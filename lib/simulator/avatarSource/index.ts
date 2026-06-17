import type { AvatarSource, AvatarSourceName } from "./types";
import { createHeygenNativeSource } from "./heygenNative";
import { createExternalImageSource } from "./externalImage";

export type { AvatarSource, AvatarSourceName, AvatarSourceResult } from "./types";

// Selects the patient-look source via AVATAR_SOURCE env (default "heygen").
// Switching sources is therefore a config change, never a code change.
export function getAvatarSource(override?: AvatarSourceName): AvatarSource {
  const raw = (override ?? process.env.AVATAR_SOURCE ?? "heygen").toLowerCase();
  if (raw === "image") return createExternalImageSource();
  return createHeygenNativeSource();
}
