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

export const ingestArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => IngestInput.parse(data))
  .handler(async ({ data, context }) => {
    let content = data.text ?? "";
    let title = data.title ?? "Untitled article";
    let sourceUrl: string | null = data.url ?? null;

    if (!content && data.url) {
      const res = await fetch(data.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SourceIQ/1.0; +https://sourceiq.app)",
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch URL (${res.status})`);
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (!data.title && titleMatch) title = titleMatch[1].trim();
      content = htmlToText(html).slice(0, 60000);
    }

    if (!content || content.length < 40) {
      throw new Error("Article content is too short to analyze.");
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
    const prompt = `You are SourceIQ, a rigorous research analyst. Analyze this article for factual integrity, bias, and evidence quality. Return valid JSON matching the schema.

Article title: ${article.title}
Article source: ${article.source_url ?? "user-provided text"}
Article content:
"""
${(article.content as string).slice(0, 20000)}
"""

Rules:
- trust_score is an integer 0-100 reflecting evidence quality, verifiability, and neutrality.
- List up to 6 major claims with verdict (Supported / Contested / Unverified / False), confidence 0-1, and a short rationale.
- Flag up to 4 bias signals (emotional-language, cherry-picking, source-selection, appeal-to-authority, false-balance, unstated-assumption) with a short quote and note.
- Suggest up to 5 authoritative cross-reference sources (real, plausible URLs) with why each is relevant.
- Keep summary under 120 words.`;

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
          prompt: `${base}\nGenerate 8-12 high-quality study flashcards. Front is a precise question or term; back is a concise, self-contained answer.`,
        });
        content = output;
      } else if (data.kind === "summary") {
        const { output } = await generateText({
          model,
          output: Output.object({ schema: summarySchema }),
          prompt: `${base}\nProduce a rigorous executive summary suitable for a lit-review: headline, 4-6 key points, and a short outline of subtopics.`,
        });
        content = output;
      } else {
        const { output } = await generateText({
          model,
          output: Output.object({ schema: quizSchema }),
          prompt: `${base}\nGenerate 5-8 multiple-choice questions testing comprehension. Provide 4 options, answer_index (0-based), and a one-sentence explanation.`,
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
