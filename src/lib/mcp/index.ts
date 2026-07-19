import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProjectsTool from "./tools/list-projects";
import listArticlesTool from "./tools/list-articles";
import getArticleTool from "./tools/get-article";
import searchArticlesTool from "./tools/search-articles";

// The OAuth issuer MUST be the direct Supabase host. On publish, SUPABASE_URL
// is rewritten to the `.lovable.cloud` proxy, which mcp-js rejects (RFC 8414
// issuer mismatch). VITE_SUPABASE_PROJECT_ID is inlined at build time by Vite.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sourceiq-mcp",
  title: "SourceIQ",
  version: "0.1.0",
  instructions:
    "SourceIQ tools for the signed-in user. Read their research projects, ingested articles, and AI-generated trust analyses. All calls are scoped to the authenticated user via Supabase RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProjectsTool, listArticlesTool, getArticleTool, searchArticlesTool],
});
