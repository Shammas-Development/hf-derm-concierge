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
      <div className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3.5 text-white shadow-lg">
        <CheckCircle2 className="h-5 w-5" />
        <span className="font-semibold">Encounter complete</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => onAdvance(next)}
      className="group flex items-center gap-3 rounded-2xl bg-[#003DA5] px-5 py-3.5 text-white shadow-lg transition hover:bg-[#002C75] active:translate-y-px"
    >
      <span className="text-left leading-tight">
        <span className="block text-[11px] uppercase tracking-wide text-white/70">
          Next step
        </span>
        <span className="block font-semibold">{STAGE_META[next].label}</span>
      </span>
      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
    </button>
  );
}
