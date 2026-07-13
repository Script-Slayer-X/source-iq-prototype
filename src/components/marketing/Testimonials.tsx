import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";

const quotes = [
  {
    quote:
      "SourceIQ catches framing I would have missed on my third read. It feels like a second, tireless peer reviewer.",
    name: "Dr. Amara Okafor",
    role: "Computational Linguist, Cambridge",
  },
  {
    quote:
      "I stopped copy-pasting citations into spreadsheets. Trust scoring plus synthesis is the workflow I've wanted for a decade.",
    name: "Julien Marchand",
    role: "Investigative Editor, Le Monde",
  },
  {
    quote:
      "My students learn to defend claims, not just repeat them. The verification panel is now part of every seminar.",
    name: "Prof. Hannah Reeve",
    role: "Political Theory, LSE",
  },
];

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="mx-auto max-w-6xl px-6 py-24"
    >
      <SectionHeading
        eyebrow="Voices"
        title={
          <>
            Chosen by people who <em className="not-italic text-accent">read closely.</em>
          </>
        }
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {quotes.map((q, i) => (
          <Reveal key={q.name} delay={i * 100}>
            <figure className="flex h-full flex-col justify-between rounded-2xl border border-white/5 bg-card/40 p-8">
              <blockquote className="font-display text-lg italic leading-snug text-foreground">
                &ldquo;{q.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 border-t border-border/60 pt-4">
                <div className="text-sm font-semibold">{q.name}</div>
                <div className="text-xs text-muted-foreground">{q.role}</div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
