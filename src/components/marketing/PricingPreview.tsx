import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Reader",
    price: "Free",
    cadence: "forever",
    blurb: "For curious minds getting started with verification.",
    features: [
      "5 article analyses / month",
      "Basic trust scoring",
      "One study set at a time",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Scholar",
    price: "$18",
    cadence: "per month",
    blurb: "For students, researchers, and journalists who work daily in sources.",
    features: [
      "Unlimited analyses",
      "Full bias & causality mapping",
      "Flashcards, quizzes, summaries",
      "Priority AI models",
    ],
    cta: "Enter workspace",
    highlight: true,
  },
  {
    name: "Institution",
    price: "Custom",
    cadence: "team pricing",
    blurb: "For departments, newsrooms, and labs standardizing verification.",
    features: [
      "Shared projects & libraries",
      "SSO & audit trails",
      "Dedicated support",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

export function PricingPreview() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="mx-auto max-w-6xl px-6 py-24"
    >
      <SectionHeading
        eyebrow="Pricing"
        title={
          <>
            Priced for <em className="not-italic text-accent">rigor</em>, not for scale-farming.
          </>
        }
        description="A preview of what's coming. Early scholars will keep launch pricing for life."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {tiers.map((t, i) => (
          <Reveal key={t.name} delay={i * 80}>
            <div
              className={cn(
                "flex h-full flex-col rounded-2xl border p-8 transition-colors",
                t.highlight
                  ? "border-accent/40 bg-accent/[0.04] shadow-[0_0_60px_-30px_theme(colors.accent/60%)]"
                  : "border-white/5 bg-white/[0.02]",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-2xl italic">{t.name}</div>
                {t.highlight ? (
                  <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                    Most chosen
                  </Badge>
                ) : null}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-4xl italic">{t.price}</span>
                <span className="text-xs text-muted-foreground">{t.cadence}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{t.blurb}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className={cn(
                  "mt-8 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]",
                  t.highlight
                    ? "bg-accent text-accent-foreground shadow-[0_0_40px_-8px_theme(colors.accent/60%)]"
                    : "border border-border text-foreground hover:bg-muted",
                )}
              >
                {t.cta}
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
