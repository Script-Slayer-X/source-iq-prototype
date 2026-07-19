import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated, dbError } from "./_supabase";

export default defineTool({
  name: "list_projects",
  title: "List research projects",
  description: "List the signed-in user's SourceIQ research projects.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max projects to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("projects")
      .select("id,name,description,created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (error) return dbError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { projects: data ?? [] },
    };
  },
});
