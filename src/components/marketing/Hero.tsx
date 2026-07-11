import { Link } from "@tanstack/react-router";
import heroForest from "@/assets/hero-forest.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 px-6">
      <img
        src={heroForest}
        alt=""
        aria-hidden
        width={1920}
        height={1088}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,theme(colors.accent/12%),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-4xl text-center animate-reveal">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-6 block">
          The Scholar's Instrument
        </span>
        <h1 className="font-display text-5xl italic leading-[0.95] text-balance sm:text-7xl md:text-8xl">
          AI research for the <br className="hidden sm:block" />
          <span className="text-accent">critical mind.</span>
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
          Move beyond generation. Verify every claim, map every source, and
          synthesize complex literature with surgical precision.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/auth"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-[0_0_40px_-8px_theme(colors.accent/60%)] transition-transform hover:scale-[1.02]"
          >
            Enter the workspace
          </Link>
          <a
            href="#how"
            className="rounded-full border border-border bg-transparent px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}
