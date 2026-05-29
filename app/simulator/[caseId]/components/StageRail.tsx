"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGE_ORDER, STAGE_META, stageIndex } from "@/lib/simulator/stages";
import type { Stage } from "@/lib/simulator/types";

export function StageRail({ current }: { current: Stage }) {
  const currentIdx = stageIndex(current);
  return (
    <div
      aria-label="Encounter progress"
      className="flex min-w-0 items-center justify-center gap-[clamp(0.2rem,0.6vw,0.75rem)]"
    >
      {STAGE_ORDER.map((stage, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div
            key={stage}
            className="flex items-center gap-[clamp(0.2rem,0.6vw,0.75rem)]"
          >
            <div
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full px-[clamp(0.3rem,0.7vw,0.7rem)] py-[clamp(0.2rem,0.4vh,0.4rem)] transition-colors",
                active && "aurora-fill text-white shadow-lg shadow-indigo-500/30",
                !active && "sim-surface",
              )}
            >
              <span
                className={cn(
                  "flex aspect-square w-[clamp(1.25rem,1.7vw,2rem)] items-center justify-center rounded-full text-[clamp(0.65rem,0.85vw,1rem)] font-semibold transition-colors",
                  active && "bg-white/25 text-white",
                  done && "bg-teal-400 text-slate-900",
                  !active && !done && "sim-surface sim-subtle",
                )}
              >
                {done ? <Check className="h-[60%] w-[60%]" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden whitespace-nowrap pr-1 text-[clamp(0.8rem,0.95vw,1.1rem)] font-medium md:inline",
                  active ? "text-white" : "sim-muted",
                )}
              >
                {STAGE_META[stage].short}
              </span>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <span
                className={cn(
                  "h-px w-[clamp(0.6rem,2vw,2.5rem)] transition-colors",
                  i < currentIdx ? "bg-teal-400/70" : "bg-[var(--sim-border)]",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
