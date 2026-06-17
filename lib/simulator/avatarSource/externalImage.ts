import { getImageProvider } from "../imageGen";
import { buildPortraitPrompt } from "../portrait";
import type { AvatarSource, AvatarSourceResult } from "./types";

// Wraps the original lib/simulator/imageGen/ flow (Replicate / OpenAI) so it
// sits behind the same AvatarSource interface as the heygen-native source.
// Behavior is unchanged — this is just the fallback path now.
export function createExternalImageSource(): AvatarSource {
  return {
    name: "image",
    async generate(patient): Promise<AvatarSourceResult> {
      const provider = getImageProvider();
      const prompt = buildPortraitPrompt(patient);
      const imageBytes = await provider.generate(prompt);
      return { imageBytes, meta: { imageProvider: provider.name } };
    },
  };
}
