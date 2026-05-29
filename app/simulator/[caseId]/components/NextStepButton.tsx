"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { STAGE_META, nextStage } from "@/lib/simulator/stages";
import type { Stage } from "@/lib/simulator/types";

export function NextStepButton({
  current,
  onAdvance,
}: {
  current: Stage;
  onAdvance: (next: Stage) => void;
}) {
  const next = nextStage(current);

  if (!next) {
    return (
      <div className="flex items-center gap-2 rounded-[clamp(0.9rem,1.3vw,1.4rem)] bg-emerald-500/90 px-[clamp(1rem,1.6vw,1.75rem)] py-[clamp(0.7rem,1.2vh,1.2rem)] text-[clamp(0.9rem,1.1vw,1.25rem)] font-semibold text-white shadow-lg shadow-emerald-500/30">
        <CheckCircle2 className="h-[1.2em] w-[1.2em]" />
        <span>Encounter complete</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => onAdvance(next)}
      className="aurora-fill aurora-ring group flex items-center gap-[clamp(0.6rem,1vw,1rem)] rounded-[clamp(0.9rem,1.3vw,1.4rem)] px-[clamp(1rem,1.6vw,1.75rem)] py-[clamp(0.6rem,1vh,1.1rem)] text-white transition hover:brightness-110 active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
    >
      <span className="text-left leading-tight">
        <span className="block text-[clamp(0.6rem,0.75vw,0.85rem)] uppercase tracking-[0.18em] text-white/75">
          Next step
        </span>
        <span className="block text-[clamp(0.95rem,1.2vw,1.4rem)] font-semibold">
          {STAGE_META[next].label}
        </span>
      </span>
      <ArrowRight className="h-[clamp(1.1rem,1.5vw,1.6rem)] w-[clamp(1.1rem,1.5vw,1.6rem)] transition group-hover:translate-x-0.5" />
    </button>
  );
}
