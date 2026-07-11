import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";

const features = [
  {
    title: "Causality mapping",
    body: "Automatically trace every AI claim back to its original dataset or peer-reviewed paper.",
  },
  {
    title: "Bias detection",
    body: "Linguistic analysis surfaces emotional framing, cherry-picking, and skewed sourcing in seconds.",
  },
  {
    title: "Auto-synthesis",
    body: "Convert dense literature into flashcards, executive summaries, and quiz material with one click.",
  },
];

export function FeatureGrid() {
  return (
    <section id="platform" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading
        eyebrow="Platform"
        title={
          <>
            A workspace built for <em className="not-italic text-accent">rigor.</em>
          </>
        }
        description="Every surface of SourceIQ is designed around verification — never generation for its own sake."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 100}>
            <div className="group h-full rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-accent/20 hover:bg-white/[0.04]">
              <div className="font-display text-2xl italic">{f.title}</div>
              <p className="mt-4 text-sm text-muted-foreground">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
