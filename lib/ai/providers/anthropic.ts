import Anthropic from "@anthropic-ai/sdk";
import type { ChatProvider } from "./types";
import { normalizeContent } from "./types";

export function createAnthropicProvider(): ChatProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

  return {
    name: "anthropic",
    model,
    async *stream({ system, messages, signal }) {
      if (!apiKey) {
        yield {
          type: "error",
          message:
            "ANTHROPIC_API_KEY is not set. Add it to .env.local or your Vercel env.",
        };
        return;
      }

      const anthropicMessages = messages.map((m) => {
        const { text, images } = normalizeContent(m.content);
        const content: Array<
          | { type: "text"; text: string }
          | {
              type: "image";
              source: {
                type: "base64";
                media_type: "image/jpeg" | "image/png" | "image/webp";
                data: string;
              };
            }
        > = [];
        for (const img of images) {
          content.push({
            type: "image",
            source: {
              type: "base64",
              media_type: img.mediaType,
              data: img.data,
            },
          });
        }
        if (text) content.push({ type: "text", text });
        return { role: m.role, content };
      });

      const client = new Anthropic({ apiKey });

      try {
        const stream = await client.messages.stream(
          {
            model,
            max_tokens: 1024,
            system,
            messages: anthropicMessages,
          },
          { signal },
        );

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            yield { type: "delta", text: event.delta.text };
          }
        }

        const final = await stream.finalMessage();
        yield { type: "done", stopReason: final.stop_reason };
      } catch (err) {
        yield {
          type: "error",
          message: err instanceof Error ? err.message : "Anthropic call failed.",
        };
      }
    },
  };
}
