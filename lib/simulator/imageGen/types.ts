// Image-generation provider interface. Used by scripts/generate-patient.ts to
// produce the static portrait that drives the case picker and the static
// presenter. The talking avatar itself is a separate LiveAvatar Photo Avatar
// (created manually in the LiveAvatar dashboard — see docs/adding-patients).

export type ImageProviderName = "replicate" | "openai";

export interface GenerateOptions {
  /** Output edge length in pixels (e.g. 1024). Providers may round to nearest supported size. */
  size?: number;
}

export interface ImageProvider {
  name: ImageProviderName;
  /** Returns raw image bytes (PNG or JPG, whichever the provider returns). */
  generate(prompt: string, opts?: GenerateOptions): Promise<Buffer>;
}
