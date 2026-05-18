import type { NextRequest } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import { getProvider, type WireMessage } from "@/lib/ai/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface ChatPayload {
  messages: WireMessage[];
  intake?: {
    firstName?: string;
    ageRange?: string;
    fitzpatrick?: string;
    concerns?: string[];
    duration?: string;
  };
  endRequested?: boolean;
}

function buildContextPreamble(intake: ChatPayload["intake"]) {
  if (!intake) return "";
  const lines: string[] = [];
  if (intake.firstName) lines.push(`First name: ${intake.firstName}`);
  if (intake.ageRange) lines.push(`Age range: ${intake.ageRange}`);
  if (intake.fitzpatrick && intake.fitzpatrick !== "Unknown")
    lines.push(`Skin type (Fitzpatrick): ${intake.fitzpatrick}`);
  if (intake.concerns && intake.concerns.length)
    lines.push(`Primary concerns: ${intake.concerns.join(", ")}`);
  if (intake.duration) lines.push(`Duration: ${intake.duration}`);
  if (lines.length === 0) return "";
  return `Patient intake context (from pre-chat form):\n${lines.join("\n")}\n\nUse this context when crafting your first response — greet the patient warmly using their name if provided, and reference their concerns naturally. Do not list these fields back verbatim.`;
}

export async function POST(req: NextRequest) {
  let payload: ChatPayload;
  try {
    payload = (await req.json()) as ChatPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.messages || !Array.isArray(payload.messages)) {
    return Response.json({ error: "messages[] is required." }, { status: 400 });
  }

  const preamble = buildContextPreamble(payload.intake);
  const system = preamble ? `${SYSTEM_PROMPT}\n\n---\n${preamble}` : SYSTEM_PROMPT;

  const messages = [...payload.messages];
  if (payload.endRequested) {
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: "The patient has indicated they want to end the consultation now. Please produce a warm closing message that includes the Discussion Summary in the exact format from your instructions, and remember to include the [URGENCY:GREEN|YELLOW|RED] tag at the end of your response on its own line.",
        },
      ],
    });
  }

  const provider = getProvider();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Tell client which provider/model handled the request (visible in DevTools, useful for QA).
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "meta", provider: provider.name, model: provider.model })}\n\n`,
        ),
      );
      try {
        for await (const event of provider.stream({ system, messages })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: (err as Error).message })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
