import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated, dbError } from "./_supabase";

export default defineTool({
  name: "list_articles",
  title: "List articles",
  description:
    "List the signed-in user's ingested articles (id, title, source URL, created timestamp). Optionally filter by project.",
  inputSchema: {
    projectId: z.string().uuid().optional().describe("Filter to a single project by UUID."),
    limit: z.number().int().min(1).max(100).optional().describe("Max results (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ projectId, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("articles")
      .select("id,title,source_url,project_id,created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) return dbError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { articles: data ?? [] },
    };
  },
});
