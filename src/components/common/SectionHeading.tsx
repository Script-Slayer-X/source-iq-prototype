import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-4xl italic leading-[1.05] text-balance md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
