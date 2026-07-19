import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated, dbError } from "./_supabase";

export default defineTool({
  name: "get_article",
  title: "Get article with analysis",
  description:
    "Fetch one article by ID, including its full content, latest AI trust analysis (score, summary, claims, bias flags, sources), and any generated study sets.",
  inputSchema: {
    articleId: z.string().uuid().describe("Article UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ articleId }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);

    const [{ data: article, error: articleErr }, { data: analyses, error: analysesErr }, { data: studySets, error: studyErr }] =
      await Promise.all([
        supabase
          .from("articles")
          .select("id,title,source_url,content,project_id,created_at")
          .eq("id", articleId)
          .maybeSingle(),
        supabase
          .from("analyses")
          .select("id,trust_score,summary,claims,bias_flags,sources,created_at")
          .eq("article_id", articleId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("study_sets")
          .select("id,kind,content,created_at")
          .eq("article_id", articleId)
          .order("created_at", { ascending: false }),
      ]);

    if (articleErr) return dbError(articleErr.message);
    if (!article) {
      return {
        content: [{ type: "text", text: `No article found with id ${articleId}.` }],
        isError: true,
      };
    }
    if (analysesErr) return dbError(analysesErr.message);
    if (studyErr) return dbError(studyErr.message);

    const payload = {
      article,
      latestAnalysis: analyses?.[0] ?? null,
      studySets: studySets ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
