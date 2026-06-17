import type { ImageProvider, ImageProviderName } from "./types";
import { createReplicateProvider } from "./replicate";
import { createOpenAIProvider } from "./openai";

export type { ImageProvider, GenerateOptions } from "./types";

// Selects an image provider via env. Defaults to Replicate (cheap, fast).
export function getImageProvider(override?: ImageProviderName): ImageProvider {
  const name = (override ?? process.env.IMAGE_PROVIDER ?? "replicate") as ImageProviderName;
  if (name === "openai") return createOpenAIProvider();
  return createReplicateProvider();
}
