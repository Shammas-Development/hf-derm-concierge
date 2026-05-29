import type { NextRequest } from "next/server";
import { getCase } from "@/lib/simulator/cases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mints a short-lived LiveAvatar streaming session token for the browser SDK.
// The API key stays server-side. A custom User-Agent is required — the
// LiveAvatar API (Cloudflare) blocks default runtime user-agents with 403/1010.
export async function POST(req: NextRequest) {
  const apiKey = process.env.LIVEAVATAR_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "LIVEAVATAR_API_KEY is not set." },
      { status: 501 },
    );
  }

  let body: { caseId?: string };
  try {
    body = (await req.json()) as { caseId?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const patient = body.caseId ? getCase(body.caseId) : undefined;
  if (!patient?.liveAvatar) {
    return Response.json(
      { error: "This case has no LiveAvatar configured." },
      { status: 404 },
    );
  }

  const { avatarId, voiceId, contextId } = patient.liveAvatar;
  const baseUrl = process.env.LIVEAVATAR_BASE_URL ?? "https://api.liveavatar.com";

  try {
    const res = await fetch(`${baseUrl}/v1/sessions/token`, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "hf-derm-concierge/1.0",
      },
      body: JSON.stringify({
        mode: "FULL",
        avatar_id: avatarId,
        avatar_persona: {
          ...(voiceId ? { voice_id: voiceId } : {}),
          context_id: contextId,
          language: "en",
        },
        is_sandbox: false,
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return Response.json(
        { error: `LiveAvatar returned ${res.status}: ${text.slice(0, 300)}` },
        { status: 502 },
      );
    }
    const data = JSON.parse(text) as {
      data?: { session_token?: string; session_id?: string };
    };
    const sessionToken = data?.data?.session_token;
    if (!sessionToken) {
      return Response.json(
        { error: "LiveAvatar did not return a session token." },
        { status: 502 },
      );
    }
    return Response.json({
      sessionToken,
      sessionId: data.data?.session_id ?? null,
    });
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 502 },
    );
  }
}
