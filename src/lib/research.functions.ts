import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  return gateway(MODEL);
}

// ============ Ingest ============

const IngestInput = z.object({
  projectId: z.string().uuid().nullable().optional(),
  title: z.string().max(300).optional(),
  url: z.string().url().optional(),
  text: z.string().max(200000).optional(),
});

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Platforms that block automated readers or hide content behind auth walls.
// We fail fast with a helpful message rather than fetching and returning noise.
const RESTRICTED_HOSTS = [
  { match: /(^|\.)instagram\.com$/, name: "Instagram", hint: "Instagram requires a login to view posts, reels, and profiles. Paste the caption or transcript text instead." },
  { match: /(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)fb\.watch$/, name: "Facebook", hint: "Facebook restricts automated readers. Copy the post body or video description and paste it as text." },
  { match: /(^|\.)tiktok\.com$/, name: "TikTok", hint: "TikTok blocks server-side readers. Paste the caption or transcript for the video instead." },
  { match: /(^|\.)snapchat\.com$/, name: "Snapchat", hint: "Snapchat content isn't publicly readable server-side. Paste the story text or description instead." },
  { match: /(^|\.)threads\.net$|(^|\.)threads\.com$/, name: "Threads", hint: "Threads posts require an authenticated session. Copy the post body and paste it as text." },
  { match: /(^|\.)x\.com$|(^|\.)twitter\.com$/, name: "X / Twitter", hint: "X / Twitter blocks server-side readers. Copy the tweet text and paste it directly." },
  { match: /(^|\.)linkedin\.com$/, name: "LinkedIn", hint: "LinkedIn requires a login. Paste the post or article body as text." },
];

type FetchResult = { title?: string; content: string };

async function fetchWithTimeout(url: string, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36 SourceIQ/1.0",
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

// YouTube: server-rendered HTML is a JS shell. Use oEmbed for title/author
// and instruct the user to paste the transcript for real content analysis.
async function fetchYouTube(url: string): Promise<FetchResult> {
  try {
    const oembed = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      10000,
    );
    if (oembed.ok) {
      const meta = (await oembed.json()) as { title?: string; author_name?: string };
      throw new Error(
        `Detected YouTube video "${meta.title ?? "video"}"${meta.author_name ? ` by ${meta.author_name}` : ""}. YouTube doesn't expose transcripts to server-side readers — open the video, click "Show transcript", and paste it into the "Paste text" tab so SourceIQ can analyze the actual content.`,
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Detected YouTube")) throw err;
  }
  throw new Error(
    "YouTube video detected. Open the video, click \"Show transcript\", and paste it into the \"Paste text\" tab — SourceIQ can't extract video transcripts server-side.",
  );
}

// Wikipedia: use the REST summary API for a clean, reliable extract.
async function fetchWikipedia(url: string): Promise<FetchResult> {
  const parsed = new URL(url);
  const lang = parsed.hostname.split(".")[0] || "en";
  const slug = decodeURIComponent(parsed.pathname.replace(/^\/wiki\//, ""));
  if (!slug) throw new Error("Couldn't find a Wikipedia article slug in that URL.");
  const api = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;
  const res = await fetchWithTimeout(api, 15000);
  if (!res.ok) throw new Error(`Wikipedia returned HTTP ${res.status} for that article.`);
  const json = (await res.json()) as { title?: string; extract?: string };
  // Follow with the full HTML for richer content.
  const htmlRes = await fetchWithTimeout(url, 15000);
  const html = htmlRes.ok ? await htmlRes.text() : "";
  const body = html ? htmlToText(html).slice(0, 60000) : (json.extract ?? "");
  return { title: json.title, content: body };
}

// GitHub: for repo URLs, fetch the README from the raw API.
async function fetchGitHub(url: string): Promise<FetchResult> {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (parts.length >= 2 && !parts[2]) {
    const [owner, repo] = parts;
    const api = `https://api.github.com/repos/${owner}/${repo}/readme`;
    const res = await fetchWithTimeout(api, 15000);
    if (res.ok) {
      const json = (await res.json()) as { content?: string; encoding?: string; name?: string };
      if (json.content && json.encoding === "base64") {
        const decoded = atob(json.content.replace(/\n/g, ""));
        return { title: `${owner}/${repo} — README`, content: decoded.slice(0, 60000) };
      }
    }
  }
  // Fallback to generic HTML fetch.
  return fetchGeneric(url);
}

// Reddit: the JSON endpoint bypasses their JS-heavy web app.
async function fetchReddit(url: string): Promise<FetchResult> {
  const jsonUrl = url.replace(/\/?$/, "") + ".json";
  const res = await fetchWithTimeout(jsonUrl, 15000);
  if (!res.ok) return fetchGeneric(url);
  try {
    const json = (await res.json()) as Array<{ data?: { children?: Array<{ data?: { title?: string; selftext?: string; body?: string } }> } }>;
    const post = json[0]?.data?.children?.[0]?.data;
    const comments = json[1]?.data?.children ?? [];
    const commentText = comments
      .map((c) => c.data?.body ?? "")
      .filter(Boolean)
      .slice(0, 40)
      .join("\n\n");
    const body = [post?.selftext ?? "", commentText].filter(Boolean).join("\n\n---\n\n");
    if (body.trim().length > 40) {
      return { title: post?.title, content: body.slice(0, 60000) };
    }
  } catch {
    // fall through
  }
  return fetchGeneric(url);
}

async function fetchGeneric(url: string): Promise<FetchResult> {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const res = await fetchWithTimeout(url, 20000);
  if (!res.ok) {
    throw new Error(
      `Couldn't fetch ${hostname} (HTTP ${res.status}). The site may block automated readers — try pasting the article text instead.`,
    );
  }
  const ctype = res.headers.get("content-type") ?? "";
  if (!ctype.includes("html") && !ctype.includes("text")) {
    throw new Error(
      `${hostname} returned ${ctype || "an unsupported format"}. Paste the article text instead.`,
    );
  }
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return { title: titleMatch?.[1]?.trim(), content: htmlToText(html).slice(0, 60000) };
}

async function extractFromUrl(url: string): Promise<FetchResult> {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();

  const restricted = RESTRICTED_HOSTS.find((r) => r.match.test(host));
  if (restricted) {
    throw new Error(`${restricted.name}: ${restricted.hint}`);
  }

  if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(host)) return fetchYouTube(url);
  if (/\.wikipedia\.org$/.test(host)) return fetchWikipedia(url);
  if (/(^|\.)github\.com$/.test(host)) return fetchGitHub(url);
  if (/(^|\.)reddit\.com$/.test(host)) return fetchReddit(url);

  return fetchGeneric(url);
}

export const ingestArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => IngestInput.parse(data))
  .handler(async ({ data, context }) => {
    let content = data.text ?? "";
    let title = data.title ?? "Untitled article";
    const sourceUrl: string | null = data.url ?? null;

    if (!content && data.url) {
      let hostname = "";
      try {
        hostname = new URL(data.url).hostname.replace(/^www\./, "");
      } catch {
        throw new Error("That doesn't look like a valid URL. Please paste a full https:// link starting with https://");
      }
      try {
        const result = await extractFromUrl(data.url);
        if (!data.title && result.title) title = result.title;
        content = result.content;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          throw new Error(`${hostname} took too long to respond. Try again or paste the text.`);
        }
        if (err instanceof Error) throw err;
        throw new Error(`Failed to fetch ${hostname}. Try pasting the article text instead.`);
      }
    }

    if (!content || content.trim().length < 80) {
      throw new Error(
        "The extracted content is too short to analyze. Some sites (paywalls, single-page apps, social media) block server-side readers — paste the article text or transcript into the \"Paste text\" tab instead.",
      );
    }



    const { data: article, error } = await context.supabase
      .from("articles")
      .insert({
        project_id: data.projectId ?? null,
        user_id: context.userId,
        title,
        source_url: sourceUrl,
        content,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return article;
  });

// ============ Analyze ============

const AnalyzeInput = z.object({ articleId: z.string().uuid() });

const analysisSchema = z.object({
  summary: z.string(),
  trust_score: z.number(),
  claims: z.array(
    z.object({
      text: z.string(),
      verdict: z.string(),
      confidence: z.number(),
      rationale: z.string(),
    }),
  ),
  bias_flags: z.array(
    z.object({
      type: z.string(),
      quote: z.string(),
      note: z.string(),
    }),
  ),
  sources: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      why: z.string(),
    }),
  ),
});

export const analyzeArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => AnalyzeInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: article, error } = await context.supabase
      .from("articles")
      .select("*")
      .eq("id", data.articleId)
      .single();
    if (error || !article) throw new Error("Article not found");

    const model = getModel();
    const prompt = `You are SourceIQ, a rigorous research analyst. Analyze this article for factual integrity, bias, and evidence quality.

Return ONLY a JSON object with EXACTLY these top-level keys — no extra keys, no markdown, no prose outside JSON:
{
  "summary": string (under 120 words),
  "trust_score": integer 0-100,
  "claims": [ { "text": string, "verdict": "Supported"|"Contested"|"Unverified"|"False", "confidence": number 0-1, "rationale": string } ]  // up to 6
  "bias_flags": [ { "type": "emotional-language"|"cherry-picking"|"source-selection"|"appeal-to-authority"|"false-balance"|"unstated-assumption", "quote": string, "note": string } ]  // up to 4
  "sources": [ { "title": string, "url": string (real https URL), "why": string } ]  // up to 5
}

IMPORTANT: use the exact key names above ("claims" not "major_claims", "sources" not "cross_reference_sources", "text" not "claim", "rationale" not "reasoning").

Article title: ${article.title}
Article source: ${article.source_url ?? "user-provided text"}
Article content:
"""
${(article.content as string).slice(0, 20000)}
"""`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: analysisSchema }),
        prompt,
      });

      const trustScore = Math.max(0, Math.min(100, Math.round(output.trust_score)));

      const { data: saved, error: insertErr } = await context.supabase
        .from("analyses")
        .insert({
          article_id: article.id,
          user_id: context.userId,
          trust_score: trustScore,
          summary: output.summary,
          claims: output.claims,
          bias_flags: output.bias_flags,
          sources: output.sources,
        })
        .select()
        .single();
      if (insertErr) throw new Error(insertErr.message);
      return saved;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("Could not produce structured analysis. Try again.");
      }
      throw err;
    }
  });

// ============ Study material ============

const StudyInput = z.object({
  articleId: z.string().uuid(),
  kind: z.enum(["flashcards", "summary", "quiz"]),
});

const flashcardsSchema = z.object({
  cards: z
    .array(z.object({ front: z.string(), back: z.string() }))
    .min(1)
    .max(20),
});
const summarySchema = z.object({
  headline: z.string(),
  key_points: z.array(z.string()).min(1).max(8),
  outline: z.array(
    z.object({ heading: z.string(), detail: z.string() }),
  ),
});
const quizSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).min(3).max(5),
        answer_index: z.number(),
        explanation: z.string(),
      }),
    )
    .min(1)
    .max(12),
});

export const generateStudyMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => StudyInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: article, error } = await context.supabase
      .from("articles")
      .select("*")
      .eq("id", data.articleId)
      .single();
    if (error || !article) throw new Error("Article not found");

    const model = getModel();
    const base = `Source article:\nTITLE: ${article.title}\n\n${(article.content as string).slice(0, 18000)}\n`;

    let content: unknown;
    try {
      if (data.kind === "flashcards") {
        const { output } = await generateText({
          model,
          output: Output.object({ schema: flashcardsSchema }),
          prompt: `${base}\nGenerate 8-12 high-quality study flashcards. Return ONLY JSON: { "cards": [ { "front": string, "back": string } ] }. Front is a precise question or term; back is a concise self-contained answer. Use exact key names "cards", "front", "back".`,
        });
        content = output;
      } else if (data.kind === "summary") {
        const { output } = await generateText({
          model,
          output: Output.object({ schema: summarySchema }),
          prompt: `${base}\nProduce a rigorous executive summary. Return ONLY JSON: { "headline": string, "key_points": [string, ...4-6 items], "outline": [ { "heading": string, "detail": string } ] }. Use exact key names.`,
        });
        content = output;
      } else {
        const { output } = await generateText({
          model,
          output: Output.object({ schema: quizSchema }),
          prompt: `${base}\nGenerate 5-8 multiple-choice questions testing comprehension. Return ONLY JSON: { "questions": [ { "question": string, "options": [string, string, string, string], "answer_index": integer 0-3, "explanation": string } ] }. Use exact key names "questions", "options", "answer_index", "explanation".`,
        });
        content = output;
      }
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        throw new Error("Could not generate study material. Try again.");
      }
      throw err;
    }

    const { data: saved, error: insertErr } = await context.supabase
      .from("study_sets")
      .insert({
        article_id: article.id,
        user_id: context.userId,
        kind: data.kind,
        content: content as never,
      })
      .select()
      .single();
    if (insertErr) throw new Error(insertErr.message);
    return saved;
  });
