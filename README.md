# Patient Encounter Simulator

A Next.js app for clinical training. A trainee interviews a lifelike,
voice-enabled patient through a fixed 5-step flow:
**History → Exam → Labs/Biopsy → Diagnosis → Treatment.**

The talking patient is a **HeyGen LiveAvatar** (interactive streaming avatar).
Clinical detail (exam findings, labs, biopsy images) is surfaced in the **Chart
panel** — never on the avatar's body.

## Getting started

```bash
cp .env.example .env.local   # then fill in keys you have
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The simulator runs at `/` (case picker) and `/simulator/<case-id>` (kiosk).

## How to add a patient

> **Synthetic patients only.** Every patient in this repo is fictional. **Never**
> paste real names, photos, or clinical notes into a spec file. There is no PHI
> in this codebase and the pipeline is not authorised to handle PHI.

The pipeline is `one spec file → one script → it appears in the case list`.

### 1. Author the spec
Copy [`lib/simulator/cases/margaret-melanoma.ts`](lib/simulator/cases/margaret-melanoma.ts)
as a template and rename it `<new-id>.ts`. Fill in:

- `id` (matches the filename), `title`, `specialty`, `difficulty`
- `demographics` — name, age, sex, occupation, **fitzpatrick** (drives the
  portrait), optional `appearance` hint (hair, build — no clinical content)
- `personaNotes`, `chiefComplaint`, `history`, `exam`, `labs`, `biopsy?`,
  `diagnosis`, `treatment`

Leave `AVATAR_ID` empty for now — you'll fill it after the dashboard step.

### 2. Run the generator
```bash
npm run generate-patient -- <new-id>
```
What it does (all idempotent — safe to re-run):
1. **Portrait** — produced by the configured **avatar source** (see
   [Switching the avatar source](#switching-the-avatar-source) below):
   - `AVATAR_SOURCE=heygen` (default): `POST https://api.heygen.com/v3/avatars`
     with the locked text prompt → downloads the resulting image.
   - `AVATAR_SOURCE=image`: external image provider (Replicate / OpenAI).
   Either way, writes `public/simulator/portraits/<id>.png`.
2. **Voice** — `GET /v1/voices` → picks a standard male/female voice from the
   LiveAvatar library by `demographics.sex` (override in spec by setting
   `liveAvatar.voiceId`).
3. **Persona context** — `POST /v1/contexts` → creates the patient's
   stage-gated brain prompt.
4. Writes the resolved IDs + the avatar source used to
   `lib/simulator/cases/<id>.resolved.json` and registers the case in
   `cases/index.ts`.

### 3. Create the LiveAvatar Photo Avatar (manual)
LiveAvatar's API **does not** support programmatic custom-avatar creation, so
the talking face is created in the dashboard:

1. Go to [app.liveavatar.com](https://app.liveavatar.com) → **Avatars** →
   **Create new avatar**.
2. Upload the generated `public/simulator/portraits/<id>.png`.
3. Copy the new `avatar_id`.
4. Paste it as `AVATAR_ID` at the top of `lib/simulator/cases/<id>.ts`.

### 4. Re-run the generator
```bash
npm run generate-patient -- <new-id>
```
Everything else is cached; this just confirms the avatar id is wired up.

The patient now appears in the case list and runs end-to-end with the live
talking avatar.

### Switching the avatar source

"How the patient's look is produced" is a strategy, set by env, never by
editing code:

| `AVATAR_SOURCE` | What it does | Keys it needs |
|---|---|---|
| `heygen` (default) | HeyGen generates the synthetic character + hospital gown + exam-room background natively via `POST /v3/avatars`. | `HEYGEN_API_KEY` |
| `image` | Fallback. Uses an external image provider (Replicate by default; OpenAI via `IMAGE_PROVIDER=openai`). | `REPLICATE_API_TOKEN` *or* `OPENAI_API_KEY` |

Switching is a config change only. The generator records the source in each
patient's `<id>.resolved.json` (`"avatarSource"`), so flipping the env later
will not silently regenerate existing patients with a different source — pass
`--force-source` if you want to regenerate intentionally:

```bash
AVATAR_SOURCE=image npm run generate-patient -- some-id --force-source
```

The locked portrait prompt ([`lib/simulator/portrait.ts`](lib/simulator/portrait.ts))
is the **single source of truth** for the patient's look — gown + exam-room
baked in, lesions/body regions explicitly forbidden — and is reused by both
sources.

> ⚠️ **LiveAvatar Interactive Avatar registration is still manual.** LiveAvatar
> does not expose Interactive Avatar creation via API, so regardless of which
> source produced the portrait, you copy the new portrait into the LiveAvatar
> dashboard once per patient to get the streaming `avatar_id`. The `heygen`
> source removes the *external image* dependency but does not remove this
> dashboard step.

## Architecture in one paragraph

- **Routes:** `/` (case picker), `/simulator/<id>` (kiosk).
- **Domain layer:** `lib/simulator/` — typed `PatientCase`, persona-prompt
  builder, stage definitions, image-gen provider abstraction, portrait prompt.
- **Server routes:** `/api/simulator/chat` (Claude/Gemini/etc.) and
  `/api/simulator/liveavatar-session` (mints the streaming token).
- **Presenter:** `app/simulator/presenter/` — pluggable static / liveavatar.
  Live mode uses `@heygen/liveavatar-web-sdk`'s `repeat()` so the AI generates
  the words and the avatar speaks them with lip-sync, with chunk events
  driving the live caption.

## Environment

See [`.env.example`](.env.example). Keys needed:

- `LIVEAVATAR_API_KEY` — runtime streaming + generation pipeline (voice list / persona context).
- `HEYGEN_API_KEY` — when `AVATAR_SOURCE=heygen` (default).
- `REPLICATE_API_TOKEN` *or* `OPENAI_API_KEY` — **only when** `AVATAR_SOURCE=image` (fallback path).
- One AI brain key: `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` / Ollama running.

Nothing should ever be hardcoded in source.

## Deploying

The app deploys to Vercel as a standard Next.js project. The generation script
runs **locally**, not at build time — its outputs (`<id>.png`,
`<id>.resolved.json`) are committed to the repo and deployed as static assets
and code.
