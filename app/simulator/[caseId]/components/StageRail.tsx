"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGE_ORDER, STAGE_META, stageIndex } from "@/lib/simulator/stages";
import type { Stage } from "@/lib/simulator/types";

export function StageRail({ current }: { current: Stage }) {
  const currentIdx = stageIndex(current);
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3">
      {STAGE_ORDER.map((stage, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={stage} className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  active && "bg-[#003DA5] text-white",
                  done && "bg-emerald-500 text-white",
                  !active && !done && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {STAGE_META[stage].short}
              </span>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <span
                className={cn(
                  "h-px w-4 sm:w-8",
                  i < currentIdx ? "bg-emerald-400" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
