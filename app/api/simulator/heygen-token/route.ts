import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mints a short-lived HeyGen streaming session token for the browser SDK.
// Inert until HEYGEN_API_KEY is configured — the static presenter is used
// until then. The API key must NEVER be sent to the client; only the
// short-lived token returned here is safe to hand to the browser.
export async function POST(_req: NextRequest) {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: "not_configured",
        message:
          "HeyGen is not configured. Set HEYGEN_API_KEY to enable the live avatar; the static presenter is used until then.",
      },
      { status: 501 },
    );
  }

  const baseUrl = process.env.HEYGEN_BASE_URL ?? "https://api.heygen.com";

  try {
    const res = await fetch(`${baseUrl}/v1/streaming.create_token`, {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return Response.json(
        { error: "heygen_error", message: `HeyGen returned ${res.status}. ${detail.slice(0, 300)}` },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { data?: { token?: string } };
    const token = data?.data?.token;
    if (!token) {
      return Response.json(
        { error: "heygen_error", message: "HeyGen did not return a token." },
        { status: 502 },
      );
    }
    return Response.json({ token });
  } catch (err) {
    return Response.json(
      { error: "network_error", message: (err as Error).message },
      { status: 502 },
    );
  }
}
