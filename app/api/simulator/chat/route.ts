import type { NextRequest } from "next/server";
import { getProvider, type WireMessage } from "@/lib/ai/providers";
import { getCase } from "@/lib/simulator/cases";
import { buildPatientSystemPrompt } from "@/lib/simulator/prompt";
import { STAGE_ORDER } from "@/lib/simulator/stages";
import type { SimChatMessage, Stage } from "@/lib/simulator/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface SimChatPayload {
  caseId: string;
  stage: Stage;
  messages: SimChatMessage[];
}

export async function POST(req: NextRequest) {
  let payload: SimChatPayload;
  try {
    payload = (await req.json()) as SimChatPayload;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patient = getCase(payload.caseId);
  if (!patient) {
    return Response.json({ error: "Unknown case." }, { status: 404 });
  }
  if (!STAGE_ORDER.includes(payload.stage)) {
    return Response.json({ error: "Unknown stage." }, { status: 400 });
  }
  if (!Array.isArray(payload.messages)) {
    return Response.json({ error: "messages[] is required." }, { status: 400 });
  }

  const system = buildPatientSystemPrompt(patient, payload.stage);

  const messages: WireMessage[] = payload.messages.map((m) => ({
    role: m.role,
    content: [{ type: "text", text: m.text }],
  }));

  const provider = getProvider();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
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
