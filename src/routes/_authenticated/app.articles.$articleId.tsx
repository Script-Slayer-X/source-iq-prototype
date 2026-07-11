import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getArticle } from "@/lib/workspace.functions";
import { analyzeArticle } from "@/lib/research.functions";
import { GlassPanel } from "@/components/common/GlassPanel";
import { LoadingShimmer } from "@/components/common/LoadingShimmer";
import { TrustScoreDial } from "@/components/workspace/TrustScoreDial";
import {
  VerificationPanel,
  type Claim,
  type BiasFlag,
  type Source,
} from "@/components/workspace/VerificationPanel";
import { StudyGenerator } from "@/components/workspace/StudyGenerator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/articles/$articleId")({
  head: () => ({ meta: [{ title: "Article — SourceIQ" }] }),
  component: ArticlePage,
});

function ArticlePage() {
  const { articleId } = Route.useParams();
  const getArticleFn = useServerFn(getArticle);
  const analyzeFn = useServerFn(analyzeArticle);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => getArticleFn({ data: { id: articleId } }),
  });

  const reanalyze = useMutation({
    mutationFn: () => analyzeFn({ data: { articleId } }),
    onSuccess: () => {
      toast.success("Re-analysis complete");
      queryClient.invalidateQueries({ queryKey: ["article", articleId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <LoadingShimmer lines={6} />
      </div>
    );
  }

  const { article, analysis, studySets } = data;
  const claims = ((analysis?.claims as unknown) ?? []) as Claim[];
  const biasFlags = ((analysis?.bias_flags as unknown) ?? []) as BiasFlag[];
  const sources = ((analysis?.sources as unknown) ?? []) as Source[];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            Article
          </span>
          <h1 className="mt-2 font-display text-3xl italic md:text-4xl">
            {article.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {article.source_url ? (
              <a
                href={article.source_url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                Source <ExternalLink className="size-3" />
              </a>
            ) : (
              <span>Pasted text</span>
            )}
            <span>Added {formatDate(article.created_at)}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => reanalyze.mutate()}
          disabled={reanalyze.isPending}
        >
          <RefreshCw className="mr-1 size-3.5" />
          {reanalyze.isPending ? "Re-analyzing…" : "Re-analyze"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <GlassPanel className="p-6 md:p-8">
            <div className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/90">
              {(article.content as string)
                .split(/\n\n+|(?<=\.)\s{2,}/)
                .slice(0, 40)
                .map((p, i) => (
                  <p key={i} className="mb-4 text-muted-foreground">
                    {p}
                  </p>
                ))}
            </div>
          </GlassPanel>

          <StudyGenerator articleId={articleId} studySets={studySets} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-16 lg:self-start">
          <GlassPanel className="p-6">
            {analysis ? (
              <>
                <TrustScoreDial score={analysis.trust_score} />
                <div className="mt-6">
                  <VerificationPanel
                    summary={analysis.summary}
                    claims={claims}
                    biasFlags={biasFlags}
                    sources={sources}
                  />
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  No analysis yet.
                </p>
                <Button
                  onClick={() => reanalyze.mutate()}
                  disabled={reanalyze.isPending}
                  className="mt-3 bg-accent text-accent-foreground"
                >
                  {reanalyze.isPending ? "Analyzing…" : "Run analysis"}
                </Button>
              </div>
            )}
          </GlassPanel>
        </aside>
      </div>
    </div>
  );
}
