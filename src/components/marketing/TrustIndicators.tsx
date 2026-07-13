import { Reveal } from "@/components/common/Reveal";
import { ShieldCheck, GraduationCap, FileSearch, Sigma } from "lucide-react";

const stats = [
  { icon: FileSearch, value: "1.2M+", label: "Sources verified" },
  { icon: ShieldCheck, value: "94%", label: "Bias-flag precision" },
  { icon: GraduationCap, value: "42", label: "Research institutions" },
  { icon: Sigma, value: "8.7s", label: "Avg. analysis time" },
];

export function TrustIndicators() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <Reveal>
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] px-6 py-10 md:px-12">
          <h2
            id="trust-heading"
            className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
          >
            Trusted by rigorous minds
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <li key={s.label} className="flex flex-col items-center text-center">
                <s.icon aria-hidden className="size-5 text-accent" />
                <div className="mt-3 font-display text-3xl italic leading-none md:text-4xl">
                  {s.value}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {s.label}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
