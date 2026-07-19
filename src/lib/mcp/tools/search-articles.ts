import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated, dbError } from "./_supabase";

export default defineTool({
  name: "search_articles",
  title: "Search articles",
  description:
    "Case-insensitive substring search over the signed-in user's article titles and content. Returns matching articles with short snippets.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Search query."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const escaped = query.replace(/[%_]/g, (m) => `\\${m}`);
    const { data, error } = await supabase
      .from("articles")
      .select("id,title,source_url,content,created_at")
      .or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`)
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) return dbError(error.message);
    const results = (data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      source_url: a.source_url,
      created_at: a.created_at,
      snippet: a.content.slice(0, 240),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { results },
    };
  },
});
