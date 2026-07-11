import { cn } from "@/lib/utils";

export function LoadingShimmer({
  className,
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="scholar-shimmer h-4 w-full rounded-md"
          style={{ width: `${100 - i * 12}%` }}
        />
      ))}
    </div>
  );
}
