export type ProviderName = "ollama" | "gemini" | "anthropic";

export type WireImageBlock = {
  type: "image";
  data: string; // base64
  mediaType?: "image/jpeg" | "image/png" | "image/webp";
};

export type WireTextBlock = {
  type: "text";
  text: string;
};

export type WireBlock = WireImageBlock | WireTextBlock;

export type WireMessage = {
  role: "user" | "assistant";
  content: WireBlock[] | string;
};

export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; stopReason: string | null }
  | { type: "error"; message: string };

export interface ChatProvider {
  name: ProviderName;
  model: string;
  stream(opts: {
    system: string;
    messages: WireMessage[];
    signal?: AbortSignal;
  }): AsyncIterable<StreamEvent>;
}

export function normalizeContent(content: WireMessage["content"]): {
  text: string;
  images: { data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" }[];
} {
  if (typeof content === "string") {
    return { text: content, images: [] };
  }
  const texts: string[] = [];
  const images: { data: string; mediaType: "image/jpeg" | "image/png" | "image/webp" }[] = [];
  for (const block of content) {
    if (block.type === "image") {
      images.push({ data: block.data, mediaType: block.mediaType ?? "image/jpeg" });
    } else {
      texts.push(block.text);
    }
  }
  return { text: texts.join("\n\n"), images };
}
