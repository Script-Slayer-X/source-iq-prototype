import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassPanel } from "@/components/common/GlassPanel";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/settings")({
  head: () => ({ meta: [{ title: "Settings — SourceIQ" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setEmail(userData.user.email ?? "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", userData.user.id)
          .maybeSingle();
        setDisplayName(profile?.display_name ?? "");
      }
    })();
  }, []);

  async function saveProfile() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userData.user.id, display_name: displayName });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
        Account
      </span>
      <h1 className="mt-2 font-display text-4xl italic">Settings</h1>

      <GlassPanel className="mt-8 p-6">
        <h2 className="font-display text-2xl italic">Profile</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <Button
            onClick={saveProfile}
            disabled={loading}
            className="bg-accent text-accent-foreground"
          >
            {loading ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </GlassPanel>

      <GlassPanel className="mt-6 p-6">
        <h2 className="font-display text-2xl italic">Session</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign out of this device.
        </p>
        <Button onClick={signOut} variant="outline" className="mt-4">
          Sign out
        </Button>
      </GlassPanel>
    </div>
  );
}
