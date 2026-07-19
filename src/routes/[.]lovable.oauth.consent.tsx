import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/common/GlassPanel";

// Beta auth.oauth namespace on the Supabase client — narrow typed wrapper so
// the consent route stays typechecked without grepping SDK internals.
type OAuthClient = { name?: string | null; client_uri?: string | null } | null;
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string | null;
  redirect_uri?: string | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};
type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null }>;
};
const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // Browser-only: the Supabase client reads its session from localStorage,
  // which is absent during SSR. Without this the loader runs server-side with
  // no session and bounces signed-in users to /auth.
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center p-8">
      <GlassPanel className="max-w-md p-8">
        <h1 className="font-display text-2xl italic">Could not load this authorization request.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </GlassPanel>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an app";
  const redirectHost = (() => {
    try {
      return details?.redirect_uri ? new URL(details.redirect_uri).host : null;
    } catch {
      return null;
    }
  })();

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.accent/10%),transparent_70%)]"
      />
      <div className="relative w-full max-w-md">
        <GlassPanel className="p-8">
          <h1 className="font-display text-2xl italic">
            Connect {clientName} to SourceIQ
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {clientName} will be able to call this app's enabled tools while you
            are signed in. This does not bypass SourceIQ's permissions or backend
            policies.
          </p>

          {redirectHost ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Redirects back to <span className="font-mono">{redirectHost}</span>
            </p>
          ) : null}

          <ul className="mt-6 space-y-2 text-sm">
            <li className="rounded-md border border-border/60 bg-card/40 p-3">
              Read your research projects, articles, and trust analyses
            </li>
            <li className="rounded-md border border-border/60 bg-card/40 p-3">
              Act as you — your Row-Level Security still applies
            </li>
          </ul>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-2">
            <Button
              disabled={busy}
              onClick={() => decide(true)}
              className="w-full bg-accent text-accent-foreground hover:opacity-90"
            >
              {busy ? "Please wait..." : "Approve"}
            </Button>
            <Button
              disabled={busy}
              onClick={() => decide(false)}
              variant="outline"
              className="w-full"
            >
              Cancel connection
            </Button>
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
