import type { ChatProvider } from "./types";
import { normalizeContent } from "./types";

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiBody {
  systemInstruction: { parts: GeminiPart[] };
  contents: GeminiContent[];
  generationConfig: { temperature: number; maxOutputTokens: number };
  safetySettings: { category: string; threshold: string }[];
}

interface GeminiResponseChunk {
  candidates?: Array<{
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
    safetyRatings?: Array<{ category: string; probability: string; blocked?: boolean }>;
  }>;
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: Array<{ category: string; probability: string }>;
  };
  error?: { message?: string };
}

// Educational medical product — Gemini's default filters falsely block
// legitimate dermatology questions. BLOCK_NONE is the correct policy here.
const RELAXED_SAFETY = [
  "HARM_CATEGORY_HARASSMENT",
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
  "HARM_CATEGORY_CIVIC_INTEGRITY",
].map((category) => ({ category, threshold: "BLOCK_NONE" }));

export function createGeminiProvider(): ChatProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const baseUrl =
    process.env.GEMINI_BASE_URL ??
    "https://generativelanguage.googleapis.com/v1beta";

  return {
    name: "gemini",
    model,
    async *stream({ system, messages, signal }) {
      if (!apiKey) {
        yield {
          type: "error",
          message:
            "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/app/apikey",
        };
        return;
      }

      const contents: GeminiContent[] = messages.map((m) => {
        const { text, images } = normalizeContent(m.content);
        const parts: GeminiPart[] = [];
        for (const img of images) {
          parts.push({
            inlineData: { mimeType: img.mediaType, data: img.data },
          });
        }
        if (text) parts.push({ text });
        return { role: m.role === "assistant" ? "model" : "user", parts };
      });

      const body: GeminiBody = {
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        safetySettings: RELAXED_SAFETY,
      };

      const url = `${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal,
        });
      } catch (err) {
        yield {
          type: "error",
          message: `Could not reach Gemini API. (${(err as Error).message})`,
        };
        return;
      }

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        yield {
          type: "error",
          message: `Gemini returned ${res.status}. ${detail.slice(0, 400)}`,
        };
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let stopReason: string | null = null;
      let emittedAnyText = false;
      let lastBlockReason: string | null = null;
      let lastFinishReason: string | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by blank lines.
        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const event = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          for (const rawLine of event.split("\n")) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (!json) continue;
            try {
              const obj = JSON.parse(json) as GeminiResponseChunk;
              if (obj.error) {
                yield {
                  type: "error",
                  message: obj.error.message ?? "Gemini error",
                };
                continue;
              }
              if (obj.promptFeedback?.blockReason) {
                lastBlockReason = obj.promptFeedback.blockReason;
              }
              const cand = obj.candidates?.[0];
              const text = cand?.content?.parts
                ?.map((p) => p.text ?? "")
                .join("");
              if (text) {
                emittedAnyText = true;
                yield { type: "delta", text };
              }
              if (cand?.finishReason) {
                stopReason = cand.finishReason;
                lastFinishReason = cand.finishReason;
              }
            } catch {
              // Skip malformed chunk.
            }
          }
        }
      }

      // Gemini sometimes ends a stream with no text — almost always a silent
      // safety block. Surface a clear error instead of letting the UI hang.
      if (!emittedAnyText) {
        const reason =
          lastBlockReason ??
          (lastFinishReason && lastFinishReason !== "STOP"
            ? lastFinishReason
            : null);
        if (reason) {
          yield {
            type: "error",
            message: `Gemini returned no text (reason: ${reason}). This usually means a safety filter blocked the response. Try switching AI_PROVIDER to "anthropic" if this persists.`,
          };
        } else {
          yield {
            type: "error",
            message:
              "Gemini returned an empty response with no failure reason. Try retrying, or switch AI_PROVIDER to \"anthropic\".",
          };
        }
      }

      yield { type: "done", stopReason };
    },
  };
}
