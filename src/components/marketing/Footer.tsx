export function Footer() {
  return (
    <footer className="border-t border-border py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-5 rounded bg-accent blur-[2px] opacity-80" />
          <span className="font-display text-lg italic">SourceIQ</span>
          <span className="ml-2 text-xs text-muted-foreground">
            verifying the truth
          </span>
        </div>
        <div className="flex gap-6 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <a href="#" className="transition-colors hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Terms
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
