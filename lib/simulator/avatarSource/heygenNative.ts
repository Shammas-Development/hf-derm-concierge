import { buildPortraitPrompt } from "../portrait";
import type { AvatarSource, AvatarSourceResult } from "./types";

// HeyGen-native source. Generates the synthetic character directly inside
// HeyGen via POST /v3/avatars (type: "prompt"). The locked portrait prompt
// (gown + exam room + no clinical content) is the same template the
// external-image path uses — single source of truth for the patient look.
//
// IMPORTANT: HeyGen's v3 docs confirm /v3/avatars accepts a text prompt and
// returns an avatar_item.id, but the response payload's exact polling /
// image-URL fields aren't documented in detail. The implementation below tries
// the obvious shape and falls back gracefully; if HeyGen returns something
// unexpected, the raw body is surfaced so the user can adjust.

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 180_000;

interface AvatarResponse {
  data?: {
    avatar_item?: {
      id?: string;
      name?: string;
      avatar_type?: string;
      group_id?: string;
      status?: string;
      preview_image_url?: string;
      image_url?: string;
      image_urls?: string[];
      supported_api_engines?: string[];
    };
    avatar_group?: { id?: string };
  };
  error?: { message?: string } | string;
  code?: number | string;
  message?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickImageUrl(item: NonNullable<NonNullable<AvatarResponse["data"]>["avatar_item"]>): string | undefined {
  return item.preview_image_url ?? item.image_url ?? item.image_urls?.[0];
}

function isReady(item: NonNullable<NonNullable<AvatarResponse["data"]>["avatar_item"]>): boolean {
  // No documented enum — accept any obvious "done" state.
  const s = (item.status ?? "").toLowerCase();
  if (s && !["pending", "processing", "generating", "queued", "in_progress"].includes(s)) {
    return true;
  }
  // If status is missing entirely (some shapes omit it), having a usable image
  // URL means it's ready.
  return s === "" && !!pickImageUrl(item);
}

export function createHeygenNativeSource(): AvatarSource {
  return {
    name: "heygen",
    async generate(patient): Promise<AvatarSourceResult> {
      const key = process.env.HEYGEN_API_KEY;
      if (!key) {
        throw new Error(
          "HEYGEN_API_KEY is not set. Required when AVATAR_SOURCE=heygen. " +
            "Get one at https://app.heygen.com/settings → API.",
        );
      }
      const baseUrl = process.env.HEYGEN_BASE_URL ?? "https://api.heygen.com";

      const prompt = buildPortraitPrompt(patient);

      // 1. Kick off generation
      const createRes = await fetch(`${baseUrl}/v3/avatars`, {
        method: "POST",
        headers: {
          "X-Api-Key": key,
          "Content-Type": "application/json",
          "User-Agent": "hf-derm-concierge/generate-patient",
        },
        body: JSON.stringify({
          type: "prompt",
          name: `${patient.demographics.name} (${patient.id})`,
          prompt,
        }),
      });
      const createText = await createRes.text();
      if (!createRes.ok) {
        throw new Error(
          `HeyGen /v3/avatars ${createRes.status}: ${createText.slice(0, 500)}`,
        );
      }
      const created = parseJson(createText) as AvatarResponse;
      const avatarId = created.data?.avatar_item?.id;
      if (!avatarId) {
        throw new Error(
          `HeyGen /v3/avatars returned no avatar_item.id: ${createText.slice(0, 500)}`,
        );
      }

      // 2. If the create call already gave us a usable image, use it.
      let item = created.data?.avatar_item;
      let imageUrl = item ? pickImageUrl(item) : undefined;

      // 3. Otherwise, poll the avatar until ready (or timeout).
      if (!imageUrl) {
        const start = Date.now();
        while (Date.now() - start < POLL_TIMEOUT_MS) {
          await sleep(POLL_INTERVAL_MS);
          const pollRes = await fetch(`${baseUrl}/v3/avatars/${avatarId}`, {
            headers: {
              "X-Api-Key": key,
              "User-Agent": "hf-derm-concierge/generate-patient",
            },
          });
          const pollText = await pollRes.text();
          if (!pollRes.ok) {
            throw new Error(
              `HeyGen /v3/avatars/${avatarId} ${pollRes.status}: ${pollText.slice(0, 500)}`,
            );
          }
          const polled = parseJson(pollText) as AvatarResponse;
          item = polled.data?.avatar_item;
          if (item && isReady(item)) {
            imageUrl = pickImageUrl(item);
            break;
          }
        }
      }

      if (!imageUrl) {
        throw new Error(
          `HeyGen avatar ${avatarId} did not yield an image URL within ${POLL_TIMEOUT_MS / 1000}s. ` +
            `If the API response shape has changed, update pickImageUrl() in heygenNative.ts.`,
        );
      }

      // 4. Download the bytes
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status} ${imageUrl}`);
      const imageBytes = Buffer.from(await imgRes.arrayBuffer());

      return {
        imageBytes,
        heygenPhotoAvatarId: avatarId,
        meta: {
          heygenAvatarGroupId: created.data?.avatar_group?.id,
          supportedApiEngines: item?.supported_api_engines,
        },
      };
    },
  };
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
