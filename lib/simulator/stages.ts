import type { Stage } from "./types";

export const STAGE_ORDER: Stage[] = [
  "history",
  "exam",
  "labs",
  "diagnosis",
  "treatment",
];

export const STAGE_META: Record<
  Stage,
  { label: string; short: string; blurb: string }
> = {
  history: {
    label: "History",
    short: "History",
    blurb: "Ask the patient about their concern, timeline, and background.",
  },
  exam: {
    label: "Examination",
    short: "Exam",
    blurb: "Review the physical exam findings.",
  },
  labs: {
    label: "Labs & Biopsy",
    short: "Labs",
    blurb: "Request lab values and biopsy / pathology results.",
  },
  diagnosis: {
    label: "Diagnosis",
    short: "Diagnosis",
    blurb: "Confirm the working diagnosis and reasoning.",
  },
  treatment: {
    label: "Treatment & Next Steps",
    short: "Treatment",
    blurb: "Review the management plan and next steps.",
  },
};

export function stageIndex(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function nextStage(stage: Stage): Stage | null {
  const i = stageIndex(stage);
  return i >= 0 && i < STAGE_ORDER.length - 1 ? STAGE_ORDER[i + 1] : null;
}

// True if `target` content is unlocked once the encounter has reached `current`.
export function isUnlocked(target: Stage, current: Stage): boolean {
  return stageIndex(current) >= stageIndex(target);
}
