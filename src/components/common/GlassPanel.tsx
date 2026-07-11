import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function GlassPanel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]",
        className,
      )}
      {...props}
    />
  );
}
