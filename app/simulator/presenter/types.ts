import type { PatientCase } from "@/lib/simulator/types";

export type AvatarMode = "static" | "heygen" | "liveavatar";

// Imperative handle the kiosk uses to make the patient speak.
export interface PresenterHandle {
  speak: (text: string) => void;
  stop: () => void;
  // Call from within a user gesture to unlock browser audio.
  prime: () => void;
  // Tear down the live session (stops billing); prime() re-establishes it.
  pause: () => void;
}

export interface PatientPresenterProps {
  patient: PatientCase;
  mode: AvatarMode;
  caption?: string; // text shown under the patient (streams in, then is spoken)
  thinking?: boolean; // a reply is being generated
  listening?: boolean; // the mic is capturing a question
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onReady?: () => void; // live avatar stream connected and attached
  // Live caption text as the avatar speaks it (word-by-word, in sync w/ voice).
  onCaption?: (text: string) => void;
}

export function resolveAvatarMode(): AvatarMode {
  const m = process.env.NEXT_PUBLIC_AVATAR_MODE ?? "static";
  if (m === "liveavatar") return "liveavatar";
  if (m === "heygen") return "heygen";
  return "static";
}

export type { PatientCase };
