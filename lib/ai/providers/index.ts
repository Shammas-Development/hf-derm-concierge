import type { ChatProvider, ProviderName } from "./types";
import { createOllamaProvider } from "./ollama";
import { createGeminiProvider } from "./gemini";
import { createAnthropicProvider } from "./anthropic";

export type { ChatProvider, ProviderName, WireMessage, StreamEvent } from "./types";

/**
 * Picks a chat provider based on environment variables.
 *
 * Priority:
 *   1. AI_PROVIDER env var (explicit override): "ollama" | "gemini" | "anthropic"
 *   2. Auto-detect by which API key is set: gemini > anthropic > ollama (fallback)
 */
export function getProvider(): ChatProvider {
  const override = (process.env.AI_PROVIDER ?? "").toLowerCase() as ProviderName | "";

  if (override === "ollama") return createOllamaProvider();
  if (override === "gemini") return createGeminiProvider();
  if (override === "anthropic") return createAnthropicProvider();

  // Auto-detect
  if (process.env.GEMINI_API_KEY) return createGeminiProvider();
  if (process.env.ANTHROPIC_API_KEY) return createAnthropicProvider();
  return createOllamaProvider();
}
