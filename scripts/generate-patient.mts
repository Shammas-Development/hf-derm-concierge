/* eslint-disable no-console */
/**
 * Patient generation script — see docs/adding-patients.md.
 *
 * Usage:
 *   tsx scripts/generate-patient.ts <case-id>
 *
 * For a given spec at lib/simulator/cases/<id>.ts this script (idempotently):
 *   1. Generates a portrait via the configured image provider and writes it
 *      to public/simulator/portraits/<id>.png.
 *   2. Resolves a stock voice_id from LiveAvatar by demographics.sex (or
 *      uses the spec override).
 *   3. Creates a LiveAvatar persona context (the patient's "brain prompt")
 *      via POST /v1/contexts.
 *   4. Writes resolved IDs to lib/simulator/cases/<id>.resolved.json.
 *   5. Appends the new case to lib/simulator/cases/index.ts if missing.
 *
 * Avatar (the talking face) creation is NOT API-available on LiveAvatar —
 * the script prints the manual dashboard step for you to follow.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import dotenv from "dotenv";

// Load env (Next's convention: .env.local takes precedence over .env)
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { getAvatarSource } from "../lib/simulator/avatarSource";
import type { AvatarSourceName } from "../lib/simulator/avatarSource";
import { buildPatientSystemPrompt } from "../lib/simulator/prompt";
import type { PatientCase, Stage } from "../lib/simulator/types";

// -------- paths / args ------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));
const id = positional[0];
const forceSource = flags.has("--force-source");
if (!id) {
  console.error("Usage: tsx scripts/generate-patient.mts <case-id> [--force-source]");
  process.exit(1);
}

const specPath = path.join(repoRoot, "lib/simulator/cases", `${id}.ts`);
const resolvedPath = path.join(repoRoot, "lib/simulator/cases", `${id}.resolved.json`);
const portraitPath = path.join(repoRoot, "public/simulator/portraits", `${id}.png`);
const indexPath = path.join(repoRoot, "lib/simulator/cases", "index.ts");

if (!existsSync(specPath)) {
  console.error(`✗ Spec not found: ${path.relative(repoRoot, specPath)}`);
  console.error("  Copy lib/simulator/cases/margaret-melanoma.ts as a template,");
  console.error("  rename the id, then re-run this script.");
  process.exit(1);
}

// Make sure the sidecar exists before importing the spec (the spec imports it).
if (!existsSync(resolvedPath)) {
  writeFileSync(resolvedPath, JSON.stringify({}, null, 2) + "\n");
  console.log(`• stub sidecar created: ${path.relative(repoRoot, resolvedPath)}`);
}

interface ResolvedSidecar {
  portraitUrl?: string;
  voiceId?: string;
  contextId?: string;
  avatarSource?: AvatarSourceName;
  heygenPhotoAvatarId?: string;
}
const resolved = JSON.parse(readFileSync(resolvedPath, "utf8")) as ResolvedSidecar;

// -------- load the spec -----------------------------------------------------
const mod = (await import(pathToFileURL(specPath).href)) as Record<string, unknown>;
const patient = Object.values(mod).find(
  (v): v is PatientCase =>
    !!v && typeof v === "object" && "id" in v && "demographics" in v,
);
if (!patient) {
  console.error(`✗ Could not find an exported PatientCase in ${path.relative(repoRoot, specPath)}`);
  process.exit(1);
}
if (patient.id !== id) {
  console.error(`✗ Spec id (${patient.id}) does not match script arg (${id}).`);
  process.exit(1);
}

console.log(`→ patient: ${patient.demographics.name} (${patient.id})`);

// -------- 1. portrait (via pluggable AvatarSource) --------------------------
const requestedSource = ((process.env.AVATAR_SOURCE ?? "heygen").toLowerCase() ===
"image"
  ? "image"
  : "heygen") as AvatarSourceName;
const havePortrait = !!resolved.portraitUrl && existsSync(portraitPath);
// A tagged source that differs from the current env wins over file presence:
// patients tagged "image" must not silently regenerate just because the env
// flipped to "heygen" (and vice versa). Pass --force-source to override.
const sourceMismatch =
  !!resolved.avatarSource && resolved.avatarSource !== requestedSource;

if (sourceMismatch && !forceSource) {
  console.log(
    `✓ patient tagged avatarSource="${resolved.avatarSource}"; ` +
      `env AVATAR_SOURCE="${requestedSource}". ` +
      "Skipping portrait (use --force-source to regenerate under the new source).",
  );
} else if (havePortrait && !forceSource) {
  console.log(
    `✓ portrait exists: ${path.relative(repoRoot, portraitPath)} (source: ${resolved.avatarSource ?? "?"})`,
  );
} else {
  const source = getAvatarSource(requestedSource);
  console.log(`→ generating portrait via avatarSource="${source.name}"…`);
  const result = await source.generate(patient);
  mkdirSync(path.dirname(portraitPath), { recursive: true });
  writeFileSync(portraitPath, result.imageBytes);
  resolved.portraitUrl = `/simulator/portraits/${id}.png`;
  resolved.avatarSource = source.name;
  if (result.heygenPhotoAvatarId) {
    resolved.heygenPhotoAvatarId = result.heygenPhotoAvatarId;
  }
  console.log(
    `✓ wrote ${path.relative(repoRoot, portraitPath)} (${result.imageBytes.length} bytes, source=${source.name})`,
  );
  if (result.heygenPhotoAvatarId) {
    console.log(`  ↳ heygenPhotoAvatarId: ${result.heygenPhotoAvatarId}`);
  }
}

// -------- 2. voice ----------------------------------------------------------
if (resolved.voiceId) {
  console.log(`✓ voice already resolved: ${resolved.voiceId}`);
} else {
  resolved.voiceId = await resolveVoice(patient.demographics.sex);
  console.log(`✓ resolved voice: ${resolved.voiceId}`);
}

// -------- 3. persona context ------------------------------------------------
if (resolved.contextId) {
  console.log(`✓ context already created: ${resolved.contextId}`);
} else {
  resolved.contextId = await createContext(patient);
  console.log(`✓ created LiveAvatar context: ${resolved.contextId}`);
}

writeFileSync(resolvedPath, JSON.stringify(resolved, null, 2) + "\n");
console.log(`✓ wrote ${path.relative(repoRoot, resolvedPath)}`);

// -------- 4. registry -------------------------------------------------------
ensureRegistered(id);

// -------- 5. avatar instructions -------------------------------------------
const avatarId = patient.liveAvatar?.avatarId;
if (!avatarId) {
  console.log("");
  console.log("─ manual step (LiveAvatar dashboard) ─────────────────────────────────");
  console.log("  LiveAvatar's API does not expose Interactive Avatar creation,");
  console.log("  so the streaming avatar is registered in the dashboard:");
  console.log("  1. open https://app.liveavatar.com (Avatars → Create new avatar)");
  console.log(`  2. upload public/simulator/portraits/${id}.png`);
  console.log("  3. copy the new avatar_id");
  console.log(`  4. paste it as AVATAR_ID at the top of`);
  console.log(`     lib/simulator/cases/${id}.ts`);
  console.log("  5. re-run this script (everything else is now cached).");
  if (resolved.heygenPhotoAvatarId) {
    console.log("");
    console.log(`  (For reference, the HeyGen Photo Avatar id is`);
    console.log(`   ${resolved.heygenPhotoAvatarId} — usable with HeyGen's "Generate`);
    console.log(`   Looks" API to vary outfit/setting on the same character.)`);
  }
  console.log("──────────────────────────────────────────────────────────────────────");
} else {
  console.log(`✓ avatar_id present in spec: ${avatarId}`);
}

console.log("\nDone.");

// ============================================================================
// helpers
// ============================================================================

async function resolveVoice(sex: string): Promise<string> {
  const key = process.env.LIVEAVATAR_API_KEY;
  if (!key) throw new Error("LIVEAVATAR_API_KEY is not set");
  const base = process.env.LIVEAVATAR_BASE_URL ?? "https://api.liveavatar.com";

  const res = await fetch(`${base}/v1/voices`, {
    headers: {
      "X-API-KEY": key,
      "User-Agent": "hf-derm-concierge/generate-patient",
    },
  });
  if (!res.ok) throw new Error(`/v1/voices ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as {
    data?: { results?: { id: string; gender?: string; name?: string; language?: string }[] };
  };
  const voices = json.data?.results ?? [];

  const want = /^f(emale)?$/i.test(sex.trim()) ? "female" : "male";
  const englishMatch = voices.find(
    (v) => v.gender === want && (v.language ?? "").toLowerCase().startsWith("en"),
  );
  const anyMatch = voices.find((v) => v.gender === want);
  const pick = englishMatch ?? anyMatch;
  if (!pick) throw new Error(`No LiveAvatar voice found for sex=${sex}`);
  console.log(`  → ${pick.name} (${pick.language ?? "?"})`);
  return pick.id;
}

async function createContext(patient: PatientCase): Promise<string> {
  const key = process.env.LIVEAVATAR_API_KEY;
  if (!key) throw new Error("LIVEAVATAR_API_KEY is not set");
  const base = process.env.LIVEAVATAR_BASE_URL ?? "https://api.liveavatar.com";

  // Use the same persona-prompt builder the runtime chat uses, anchored to the
  // history stage so we never bake unlocked clinical content into the context.
  const prompt = buildPatientSystemPrompt(patient, "history" as Stage);
  const opening = "Hi, thanks for seeing me, doctor.";

  const res = await fetch(`${base}/v1/contexts`, {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
      "User-Agent": "hf-derm-concierge/generate-patient",
    },
    body: JSON.stringify({
      name: `${patient.demographics.name} - patient`,
      prompt,
      opening_text: opening,
    }),
  });
  if (!res.ok) throw new Error(`/v1/contexts ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data?: { id?: string } };
  const cid = json.data?.id;
  if (!cid) throw new Error("LiveAvatar /v1/contexts returned no id");
  return cid;
}

function ensureRegistered(caseId: string): void {
  const src = readFileSync(indexPath, "utf8");
  if (src.includes(`from "./${caseId}"`)) {
    console.log(`✓ already registered in cases/index.ts`);
    return;
  }
  // Find the existing import line and the CASES array — naïve but reliable for
  // the small, hand-edited shape we keep here.
  const lines = src.split("\n");
  const lastImportIdx = lines.findLastIndex?.((l) => l.startsWith("import "));
  const camel = caseId.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const newImport = `import { ${camel} } from "./${caseId}";`;
  const insertAt = (lastImportIdx ?? 0) + 1;
  lines.splice(insertAt, 0, newImport);

  // Append to the CASES array
  const updated = lines
    .join("\n")
    .replace(/const CASES: PatientCase\[\] = \[([\s\S]*?)\];/, (_m, body) => {
      const items = body
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (!items.includes(camel)) items.push(camel);
      return `const CASES: PatientCase[] = [${items.join(", ")}];`;
    });
  writeFileSync(indexPath, updated);
  console.log(`✓ registered in cases/index.ts as ${camel}`);
}
