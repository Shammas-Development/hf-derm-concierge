import type { GenerateOptions, ImageProvider } from "./types";

// Replicate model used by default — Flux Schnell. Fast and cheap (~$0.003/img)
// while photorealistic enough for synthetic patient portraits. Swap via the
// REPLICATE_MODEL env var (e.g. "black-forest-labs/flux-dev" for more fidelity).
const DEFAULT_MODEL = "black-forest-labs/flux-schnell";

interface PredictionResponse {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | null;
  error?: string | null;
  urls?: { get?: string };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pollUntilDone(
  url: string,
  token: string,
  timeoutMs = 60_000,
): Promise<PredictionResponse> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Replicate poll ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as PredictionResponse;
    if (body.status === "succeeded" || body.status === "failed" || body.status === "canceled") {
      return body;
    }
    await sleep(1500);
  }
  throw new Error("Replicate prediction timed out");
}

export function createReplicateProvider(): ImageProvider {
  const token = process.env.REPLICATE_API_TOKEN;
  const model = process.env.REPLICATE_MODEL ?? DEFAULT_MODEL;

  return {
    name: "replicate",
    async generate(prompt: string, opts: GenerateOptions = {}): Promise<Buffer> {
      if (!token) {
        throw new Error(
          "REPLICATE_API_TOKEN is not set. Get one at https://replicate.com/account/api-tokens",
        );
      }
      const size = opts.size ?? 1024;
      // Flux models accept aspect_ratio + output_format; we use 4:5 portrait
      // to match the avatar/portrait frame in the kiosk.
      const input = {
        prompt,
        aspect_ratio: "4:5",
        output_format: "jpg",
        output_quality: 90,
        num_outputs: 1,
        megapixels: size >= 1024 ? "1" : "0.25",
      };

      const createRes = await fetch(
        `https://api.replicate.com/v1/models/${model}/predictions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            // Block up to 60s server-side before returning while still polling
            Prefer: "wait=60",
          },
          body: JSON.stringify({ input }),
        },
      );

      if (!createRes.ok) {
        const detail = await createRes.text().catch(() => "");
        throw new Error(`Replicate ${createRes.status}: ${detail.slice(0, 400)}`);
      }

      let prediction = (await createRes.json()) as PredictionResponse;

      if (prediction.status !== "succeeded" && prediction.status !== "failed") {
        const pollUrl = prediction.urls?.get;
        if (!pollUrl) throw new Error("Replicate: no poll URL in response");
        prediction = await pollUntilDone(pollUrl, token);
      }

      if (prediction.status !== "succeeded") {
        throw new Error(
          `Replicate prediction ${prediction.status}: ${prediction.error ?? "unknown error"}`,
        );
      }

      const output = prediction.output;
      const url = Array.isArray(output) ? output[0] : output;
      if (!url || typeof url !== "string") {
        throw new Error("Replicate: prediction succeeded but no output URL");
      }

      const imgRes = await fetch(url);
      if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);
      const arr = await imgRes.arrayBuffer();
      return Buffer.from(arr);
    },
  };
}
