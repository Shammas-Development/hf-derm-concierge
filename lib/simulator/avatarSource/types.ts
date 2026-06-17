import type { PatientCase } from "../types";

export type AvatarSourceName = "heygen" | "image";

export interface AvatarSourceResult {
  /** Raw image bytes for the patient's portrait (JPG or PNG). */
  imageBytes: Buffer;
  /**
   * The HeyGen Photo Avatar id, only when source.name === "heygen". May be
   * usable in LiveAvatar streaming (probe is run by the script); the script
   * persists this either way for future "Generate Looks" calls.
   */
  heygenPhotoAvatarId?: string;
  /** Any source-specific metadata the script may want to surface. */
  meta?: Record<string, unknown>;
}

export interface AvatarSource {
  name: AvatarSourceName;
  /** Produce a portrait + (if heygen) the photo-avatar id for this patient. */
  generate(patient: PatientCase): Promise<AvatarSourceResult>;
}
