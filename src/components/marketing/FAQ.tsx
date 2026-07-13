import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What makes SourceIQ different from a chatbot?",
    a: "SourceIQ is built for verification, not generation. Every claim is traced back to its origin, weighted for bias, and shown alongside the reasoning — never presented as anonymous confidence.",
  },
  {
    q: "Which AI models power the analysis?",
    a: "We route through the Lovable AI Gateway, using best-in-class frontier models for reasoning and specialized models for citation matching. You never manage keys, and models evolve as the field improves.",
  },
  {
    q: "Can I trust the trust score?",
    a: "The score is transparent by design. Every point is derived from named signals — sourcing depth, corroboration, linguistic framing — and you can inspect the rationale for any claim.",
  },
  {
    q: "Is my research private?",
    a: "Yes. Projects are scoped to your account, row-level security is enforced on every read, and nothing you ingest is used to train models.",
  },
  {
    q: "Do you support team workspaces?",
    a: "Institution plans include shared projects, SSO, and audit trails. Reach out and we'll set your team up.",
  },
];

export function FAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto max-w-3xl px-6 py-24"
    >
      <SectionHeading
        eyebrow="FAQ"
        title={
          <>
            Questions, <em className="not-italic text-accent">answered plainly.</em>
          </>
        }
      />
      <Reveal className="mt-12">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`} className="border-border/60">
              <AccordionTrigger className="text-left font-display text-lg italic hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
