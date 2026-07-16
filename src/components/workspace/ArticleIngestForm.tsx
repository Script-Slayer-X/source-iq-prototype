import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { ingestArticle, analyzeArticle } from "@/lib/research.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GlassPanel } from "@/components/common/GlassPanel";
import { toast } from "sonner";
import { Sparkles, AlertTriangle, Info } from "lucide-react";

type PlatformHint = { level: "info" | "warn"; message: string } | null;

function detectPlatform(raw: string): { valid: boolean; hint: PlatformHint } {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, hint: null };
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return {
      valid: false,
      hint: { level: "warn", message: "That doesn't look like a full URL. It should start with https://" },
    };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { valid: false, hint: { level: "warn", message: "Only http:// and https:// links are supported." } };
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (/instagram\.com$/.test(host)) return { valid: true, hint: { level: "warn", message: "Instagram requires login — SourceIQ will ask you to paste the caption if extraction fails." } };
  if (/facebook\.com$|fb\.com$|fb\.watch$/.test(host)) return { valid: true, hint: { level: "warn", message: "Facebook restricts automated readers — paste the post body if extraction fails." } };
  if (/tiktok\.com$/.test(host)) return { valid: true, hint: { level: "warn", message: "TikTok blocks server-side readers — you'll be asked to paste the caption or transcript." } };
  if (/snapchat\.com$/.test(host)) return { valid: true, hint: { level: "warn", message: "Snapchat content isn't publicly readable — paste the story text instead." } };
  if (/(^|\.)x\.com$|twitter\.com$/.test(host)) return { valid: true, hint: { level: "warn", message: "X / Twitter blocks server-side readers — paste the tweet text if extraction fails." } };
  if (/threads\.(net|com)$/.test(host)) return { valid: true, hint: { level: "warn", message: "Threads requires auth — paste the post body if extraction fails." } };
  if (/youtube\.com$|youtu\.be$/.test(host)) return { valid: true, hint: { level: "info", message: "YouTube detected — SourceIQ can't fetch transcripts server-side. Have the transcript ready to paste." } };
  if (/wikipedia\.org$/.test(host)) return { valid: true, hint: { level: "info", message: "Wikipedia detected — using the official summary API." } };
  if (/github\.com$/.test(host)) return { valid: true, hint: { level: "info", message: "GitHub detected — the README will be analyzed." } };
  if (/reddit\.com$/.test(host)) return { valid: true, hint: { level: "info", message: "Reddit detected — the post and top comments will be analyzed." } };
  return { valid: true, hint: null };
}

export function ArticleIngestForm({ projectId }: { projectId?: string | null }) {
  const [mode, setMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const ingest = useServerFn(ingestArticle);
  const analyze = useServerFn(analyzeArticle);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const platform = detectPlatform(url);

  const mutation = useMutation({
    mutationFn: async () => {
      const article = await ingest({
        data: {
          projectId: projectId ?? null,
          url: mode === "url" ? url.trim() : undefined,
          text: mode === "text" ? text : undefined,
          title: title || undefined,
        },
      });
      await analyze({ data: { articleId: article.id } });
      return article;
    },
    onSuccess: (article) => {
      toast.success("Analysis complete");
      queryClient.invalidateQueries();
      navigate({
        to: "/app/articles/$articleId",
        params: { articleId: article.id },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const disabled =
    mutation.isPending ||
    (mode === "url" ? !platform.valid : !text.trim().length);

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-accent" />
        <h3 className="font-display text-2xl italic">Analyze a source</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste a URL or raw text. SourceIQ ingests, verifies claims, and scores
        the source.
      </p>

      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as "url" | "text")}
        className="mt-6"
      >
        <TabsList>
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="text">Paste text</TabsTrigger>
        </TabsList>
        <TabsContent value="url" className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="url">Article URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/research/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        </TabsContent>
        <TabsContent value="text" className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Working title"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="text">Article text</Label>
            <Textarea
              id="text"
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the article body here..."
            />
          </div>
        </TabsContent>
      </Tabs>

      <Button
        onClick={() => mutation.mutate()}
        disabled={disabled}
        className="mt-6 w-full bg-accent text-accent-foreground hover:opacity-90"
      >
        {mutation.isPending ? "Analyzing source…" : "Analyze & verify"}
      </Button>
    </GlassPanel>
  );
}
