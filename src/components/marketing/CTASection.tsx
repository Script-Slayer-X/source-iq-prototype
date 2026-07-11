import { Link } from "@tanstack/react-router";
import ctaMountains from "@/assets/cta-mountains.jpg";

export function CTASection() {
  return (
    <section id="verification" className="relative overflow-hidden py-32">
      <img
        src={ctaMountains}
        alt=""
        aria-hidden
        width={1920}
        height={912}
        loading="lazy"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_80%)]"
      />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
          Start today
        </span>
        <h2 className="mt-4 font-display text-5xl italic leading-[1.05] text-balance md:text-6xl">
          Verify the truth. <br />
          <span className="text-accent">Master the field.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
          A research instrument for scholars, analysts, and anyone who refuses
          to be fooled by well-worded confidence.
        </p>
        <div className="mt-10">
          <Link
            to="/auth"
            className="inline-flex rounded-full bg-accent px-8 py-3 text-sm font-semibold text-accent-foreground shadow-[0_0_60px_-10px_theme(colors.accent/70%)] transition-transform hover:scale-[1.02]"
          >
            Create your workspace
          </Link>
        </div>
      </div>
    </section>
  );
}
