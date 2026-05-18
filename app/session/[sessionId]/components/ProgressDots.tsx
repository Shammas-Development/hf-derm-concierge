import { cn } from "@/lib/utils";

export function ProgressDots({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === current ? "w-6 bg-[#003DA5]" : i < current ? "w-1.5 bg-[#003DA5]/60" : "w-1.5 bg-[#003DA5]/15",
          )}
        />
      ))}
    </div>
  );
}
