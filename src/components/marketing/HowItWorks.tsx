import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";

const steps = [
  {
    n: "01",
    title: "Ingest any source",
    body: "Drop a URL, paste raw text, or forward a research paper. SourceIQ parses and normalizes the content.",
  },
  {
    n: "02",
    title: "Analyze with AI",
    body: "The engine cross-references claims, flags bias, and produces a transparent trust score with rationale.",
  },
  {
    n: "03",
    title: "Study & synthesize",
    body: "Generate flashcards, executive summaries, or quizzes tuned to the source — never generic filler.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-24">
      <SectionHeading
        eyebrow="How it works"
        title={
          <>
            From article to <em className="not-italic text-accent">insight</em> in three moves.
          </>
        }
      />
      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 100}>
            <div className="h-full rounded-2xl border border-white/5 bg-card/40 p-8">
              <div className="font-mono text-xs text-accent">{s.n}</div>
              <h3 className="mt-4 font-display text-2xl italic">{s.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
