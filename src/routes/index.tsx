import { createFileRoute } from "@tanstack/react-router";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Hero } from "@/components/marketing/Hero";
import { WorkspacePeek } from "@/components/marketing/WorkspacePeek";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { CTASection } from "@/components/marketing/CTASection";
import { Footer } from "@/components/marketing/Footer";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />
      <main>
        <Hero />
        <WorkspacePeek />
        <FeatureGrid />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
