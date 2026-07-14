import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import logo from "@/assets/sourceiq-logo.jpg";

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 flex w-full items-center justify-between border-b px-6 py-4 backdrop-blur-md transition-colors",
        scrolled
          ? "border-border bg-background/80"
          : "border-transparent bg-transparent",
      )}
    >
      <Link to="/" className="flex items-center gap-2" aria-label="SourceIQ home">
        <img
          src={logo}
          alt="SourceIQ"
          className="h-8 w-auto md:h-9"
          width={200}
          height={64}
        />
      </Link>
      <div className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
        <a href="#platform" className="transition-colors hover:text-accent">
          Platform
        </a>
        <a href="#how" className="transition-colors hover:text-accent">
          How it works
        </a>
        <a href="#verification" className="transition-colors hover:text-accent">
          Verification
        </a>
      </div>
      <Link
        to="/auth"
        className="rounded-full bg-foreground px-4 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-accent"
      >
        Get access
      </Link>
    </nav>
  );
}
