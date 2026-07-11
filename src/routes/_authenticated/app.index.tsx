import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listProjects,
  listRecentArticles,
  createProject,
} from "@/lib/workspace.functions";
import { ArticleIngestForm } from "@/components/workspace/ArticleIngestForm";
import { GlassPanel } from "@/components/common/GlassPanel";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FolderKanban, FileText, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Workspace — SourceIQ" }] }),
  component: Dashboard,
});

function Dashboard() {
  const listProjectsFn = useServerFn(listProjects);
  const listRecentFn = useServerFn(listRecentArticles);
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjectsFn(),
  });
  const { data: recent } = useQuery({
    queryKey: ["recent-articles"],
    queryFn: () => listRecentFn(),
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
          Workspace
        </span>
        <h1 className="mt-2 font-display text-4xl italic md:text-5xl">
          What are we researching?
        </h1>
        <p className="mt-2 text-muted-foreground">
          Verify a source, organize a project, or continue where you left off.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ArticleIngestForm />

        <GlassPanel className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Projects
              </div>
              <h2 className="font-display text-2xl italic">Your work</h2>
            </div>
            <NewProjectDialog />
          </div>
          {projects && projects.length ? (
            <ul className="space-y-2">
              {projects.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link
                    to="/app/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 transition-colors hover:border-accent/20"
                  >
                    <FolderKanban className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {p.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(p.updated_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No projects yet. Create one to group related sources.
            </p>
          )}
        </GlassPanel>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl italic">Recent articles</h2>
        {recent && recent.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {recent.map((a) => (
              <Link
                key={a.id}
                to="/app/articles/$articleId"
                params={{ articleId: a.id }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-accent/20"
              >
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.title}</div>
                    {a.source_url ? (
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
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
            title="No sources yet"
            description="Analyze your first article using the form above."
          />
        )}
      </section>
    </div>
  );
}

function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const create = useServerFn(createProject);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      create({ data: { title, description: description || undefined } }),
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setTitle("");
      setDescription("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 size-3.5" /> New
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl italic">
            New project
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-title">Title</Label>
            <Input
              id="p-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Neural Ethics 2026"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description (optional)</Label>
            <Textarea
              id="p-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!title || mutation.isPending}
            className="w-full bg-accent text-accent-foreground"
          >
            {mutation.isPending ? "Creating…" : "Create project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
