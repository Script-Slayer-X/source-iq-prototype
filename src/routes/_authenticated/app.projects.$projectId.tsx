import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProject, deleteProject } from "@/lib/workspace.functions";
import { ArticleIngestForm } from "@/components/workspace/ArticleIngestForm";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/projects/$projectId")({
  head: () => ({ meta: [{ title: "Project — SourceIQ" }] }),
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const getProjectFn = useServerFn(getProject);
  const deleteProjectFn = useServerFn(deleteProject);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProjectFn({ data: { id: projectId } }),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteProjectFn({ data: { id: projectId } }),
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate({ to: "/app" });
    },
  });

  if (isLoading || !data) {
    return <div className="p-10 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            Project
          </span>
          <h1 className="mt-2 font-display text-4xl italic">
            {data.project.title}
          </h1>
          {data.project.description ? (
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {data.project.description}
            </p>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm("Delete this project and its articles?"))
              deleteMut.mutate();
          }}
        >
          <Trash2 className="mr-1 size-3.5" /> Delete
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          {data.articles.length ? (
            <div className="space-y-3">
              {data.articles.map((a) => (
                <Link
                  key={a.id}
                  to="/app/articles/$articleId"
                  params={{ articleId: a.id }}
                  className="block rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-accent/20"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{a.title}</div>
                      {a.source_url ? (
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {a.source_url}
                        </div>
                      ) : null}
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {formatDate(a.created_at)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="size-8" />}
              title="No articles in this project"
              description="Analyze your first source using the form."
            />
          )}
        </div>

        <ArticleIngestForm projectId={projectId} />
      </div>
    </div>
  );
}
