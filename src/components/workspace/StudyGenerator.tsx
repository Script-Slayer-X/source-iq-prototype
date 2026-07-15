import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateStudyMaterial } from "@/lib/research.functions";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/common/GlassPanel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sparkles, GraduationCap, FileText, ListChecks } from "lucide-react";

type Kind = "flashcards" | "summary" | "quiz";

const OPTIONS: { kind: Kind; label: string; icon: typeof Sparkles }[] = [
  { kind: "flashcards", label: "Flashcards", icon: GraduationCap },
  { kind: "summary", label: "Summary", icon: FileText },
  { kind: "quiz", label: "Quiz", icon: ListChecks },
];

interface StudySet {
  id: string;
  kind: string;
  content: unknown;
  created_at: string;
}

export function StudyGenerator({
  articleId,
  studySets,
}: {
  articleId: string;
  studySets: StudySet[];
}) {
  const [kind, setKind] = useState<Kind>("flashcards");
  const generate = useServerFn(generateStudyMaterial);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => generate({ data: { articleId, kind } }),
    onSuccess: () => {
      toast.success("Study material ready");
      queryClient.invalidateQueries({ queryKey: ["article", articleId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const latest = studySets.find((s) => s.kind === kind);

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center gap-2">
        <GraduationCap className="size-4 text-accent" />
        <h3 className="font-display text-2xl italic">Study material</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Turn this article into flashcards, a summary, or a quiz.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          return (
            <button
              key={o.kind}
              onClick={() => setKind(o.kind)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition-all",
                kind === o.kind
                  ? "border-accent/40 bg-accent/10 text-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:border-accent/20",
              )}
            >
              <Icon className="size-4" />
              {o.label}
            </button>
          );
        })}
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="mt-4 w-full bg-accent text-accent-foreground hover:opacity-90"
      >
        {mutation.isPending ? "Generating…" : `Generate ${kind}`}
      </Button>

      {latest ? <StudyResult set={latest} /> : null}
    </GlassPanel>
  );
}

function StudyResult({ set }: { set: StudySet }) {
  const c = set.content as Record<string, unknown>;
  if (set.kind === "flashcards" && Array.isArray(c.cards)) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(c.cards as { front: string; back: string }[]).map((card, i) => (
          <Flashcard key={`${set.id}-${i}`} front={card.front} back={card.back} />
        ))}
      </div>
    );
  }
  if (set.kind === "summary" && typeof c.headline === "string") {
    return (
      <div className="mt-6 space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h4 className="font-display text-xl italic">{c.headline as string}</h4>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {(c.key_points as string[]).map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
        <div className="space-y-3">
          {(c.outline as { heading: string; detail: string }[]).map((o, i) => (
            <div key={i}>
              <div className="text-sm font-semibold">{o.heading}</div>
              <p className="text-sm text-muted-foreground">{o.detail}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (set.kind === "quiz" && Array.isArray(c.questions)) {
    return (
      <div className="mt-6 space-y-3">
        {(
          c.questions as {
            question: string;
            options: string[];
            answer_index: number;
            explanation: string;
          }[]
        ).map((q, i) => (
          <QuizCard key={`${set.id}-${i}`} q={q} />
        ))}
      </div>
    );
  }
  return null;
}

function Flashcard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      className="min-h-32 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm transition-colors hover:border-accent/30"
    >
      <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
        {flipped ? "Back" : "Front"}
      </div>
      <p className="mt-2 text-foreground">{flipped ? back : front}</p>
    </button>
  );
}

function QuizCard({
  q,
}: {
  q: {
    question: string;
    options: string[];
    answer_index: number;
    explanation: string;
  };
}) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-sm font-semibold">{q.question}</div>
      <div className="mt-3 space-y-2">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === q.answer_index;
          const showState = picked !== null;
          return (
            <button
              key={i}
              onClick={() => setPicked(i)}
              className={cn(
                "block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                !showState && "border-white/10 hover:border-accent/30",
                showState && isCorrect && "border-accent/50 bg-accent/10",
                showState &&
                  isPicked &&
                  !isCorrect &&
                  "border-destructive/40 bg-destructive/10",
                showState && !isPicked && !isCorrect && "border-white/5 opacity-60",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p>
      ) : null}
    </div>
  );
}
