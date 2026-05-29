import type { PatientCase } from "@/lib/simulator/types";

export type AvatarMode = "static" | "heygen";

// Imperative handle the kiosk uses to make the patient speak.
export interface PresenterHandle {
  speak: (text: string) => void;
  stop: () => void;
  // Call from within a user gesture to unlock browser audio.
  prime: () => void;
}

export interface PatientPresenterProps {
  patient: PatientCase;
  mode: AvatarMode;
  thinking?: boolean; // a reply is being generated
  listening?: boolean; // the mic is capturing a question
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
}

export function resolveAvatarMode(): AvatarMode {
  return (process.env.NEXT_PUBLIC_AVATAR_MODE ?? "static") === "heygen"
    ? "heygen"
    : "static";
}

export type { PatientCase };
