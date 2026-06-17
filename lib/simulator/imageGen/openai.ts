import type { GenerateOptions, ImageProvider } from "./types";

// OpenAI gpt-image-1 — higher fidelity, higher cost. Quality controlled by
// OPENAI_IMAGE_QUALITY (low | medium | high). Defaults to low for demo work.
export function createOpenAIProvider(): ImageProvider {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
  const quality = (process.env.OPENAI_IMAGE_QUALITY ?? "low") as
    | "low"
    | "medium"
    | "high"
    | "auto";

  return {
    name: "openai",
    async generate(prompt: string, opts: GenerateOptions = {}): Promise<Buffer> {
      if (!key) {
        throw new Error(
          "OPENAI_API_KEY is not set. Get one at https://platform.openai.com/api-keys",
        );
      }
      const size = opts.size && opts.size >= 1024 ? "1024x1024" : "1024x1024";
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size,
          quality,
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 400)}`);
      }
      const data = (await res.json()) as {
        data?: { b64_json?: string; url?: string }[];
      };
      const entry = data.data?.[0];
      if (entry?.b64_json) return Buffer.from(entry.b64_json, "base64");
      if (entry?.url) {
        const imgRes = await fetch(entry.url);
        if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);
        return Buffer.from(await imgRes.arrayBuffer());
      }
      throw new Error("OpenAI returned no image data");
    },
  };
}
