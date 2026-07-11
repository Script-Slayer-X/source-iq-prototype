import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function TrustScoreDial({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1200;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(clamped * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const tone =
    clamped >= 80
      ? "text-accent"
      : clamped >= 50
        ? "text-amber-400"
        : "text-destructive";

  const circ = 2 * Math.PI * 46;
  const offset = circ - (circ * display) / 100;

  return (
    <div className="relative mx-auto flex size-32 items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0">
        <circle
          cx="50"
          cy="50"
          r="46"
          className="stroke-border/40"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r="46"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          className={cn("transition-[stroke-dashoffset]", tone)}
          stroke="currentColor"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ filter: "drop-shadow(0 0 8px currentColor)" }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className={cn("font-display text-4xl italic", tone)}>
          {display}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
          Trust score
        </span>
      </div>
    </div>
  );
}
