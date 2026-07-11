import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle } from "lucide-react";

export interface Claim {
  text: string;
  verdict: string;
  confidence: number;
  rationale: string;
}
export interface BiasFlag {
  type: string;
  quote: string;
  note: string;
}
export interface Source {
  title: string;
  url: string;
  why: string;
}

function verdictStyle(v: string) {
  const key = v.toLowerCase();
  if (key.includes("support"))
    return {
      icon: CheckCircle2,
      tone: "text-accent",
      label: "Supported",
    };
  if (key.includes("false"))
    return { icon: XCircle, tone: "text-destructive", label: "False" };
  if (key.includes("contest"))
    return {
      icon: AlertTriangle,
      tone: "text-amber-400",
      label: "Contested",
    };
  return { icon: HelpCircle, tone: "text-muted-foreground", label: v };
}

export function VerificationPanel({
  summary,
  claims,
  biasFlags,
  sources,
}: {
  summary: string | null;
  claims: Claim[];
  biasFlags: BiasFlag[];
  sources: Source[];
}) {
  return (
    <div className="space-y-6">
      {summary ? (
        <section>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Summary
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            {summary}
          </p>
        </section>
      ) : null}

      <section>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Claims ({claims.length})
        </div>
        <div className="mt-2 space-y-2">
          {claims.map((c, i) => {
            const s = verdictStyle(c.verdict);
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="flex items-start gap-2">
                  <Icon className={cn("mt-0.5 size-4 shrink-0", s.tone)} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground">{c.text}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                      <span className={cn("font-semibold", s.tone)}>
                        {s.label}
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round(c.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      {c.rationale}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {biasFlags.length ? (
        <section>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Bias signals
          </div>
          <div className="mt-2 space-y-2">
            {biasFlags.map((b, i) => (
              <div
                key={i}
                className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <AlertTriangle className="size-3.5" />
                  {b.type}
                </div>
                <blockquote className="mt-1 border-l-2 border-amber-500/30 pl-2 text-[11px] italic text-muted-foreground">
                  "{b.quote}"
                </blockquote>
                <p className="mt-1 text-[11px] text-muted-foreground">{b.note}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {sources.length ? (
        <section>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Cross-references
          </div>
          <div className="mt-2 space-y-2">
            {sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                className="block rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-accent/30"
              >
                <div className="text-xs font-semibold">{s.title}</div>
                <div className="mt-1 truncate text-[11px] text-accent">
                  {s.url}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {s.why}
                </p>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
