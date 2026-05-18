import type { ChatProvider } from "./types";
import { normalizeContent } from "./types";

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[];
}

export function createOllamaProvider(): ChatProvider {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "llama3.2-vision:11b";

  return {
    name: "ollama",
    model,
    async *stream({ system, messages, signal }) {
      const ollamaMessages: OllamaMessage[] = [
        { role: "system", content: system },
      ];
      for (const m of messages) {
        const { text, images } = normalizeContent(m.content);
        const msg: OllamaMessage = { role: m.role, content: text };
        if (images.length > 0) msg.images = images.map((i) => i.data);
        ollamaMessages.push(msg);
      }

      let res: Response;
      try {
        res = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            stream: true,
            messages: ollamaMessages,
            options: { temperature: 0.7, num_ctx: 4096 },
          }),
          signal,
        });
      } catch (err) {
        yield {
          type: "error",
          message: `Could not reach Ollama at ${baseUrl}. Is it running? (${(err as Error).message})`,
        };
        return;
      }

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        yield {
          type: "error",
          message: `Ollama returned ${res.status}. ${detail.slice(0, 300)}`,
        };
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line) continue;
          try {
            const evt = JSON.parse(line) as {
              message?: { role: string; content: string };
              done?: boolean;
              done_reason?: string;
              error?: string;
            };
            if (evt.error) {
              yield { type: "error", message: evt.error };
              continue;
            }
            const delta = evt.message?.content ?? "";
            if (delta) yield { type: "delta", text: delta };
            if (evt.done) {
              yield { type: "done", stopReason: evt.done_reason ?? null };
            }
          } catch {
            // Malformed line — skip.
          }
        }
      }
    },
  };
}
