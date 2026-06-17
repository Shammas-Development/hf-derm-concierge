import type { PatientCase } from "./types";

// LOCKED portrait prompt template — one source of truth so every patient looks
// like they belong to the same product. Parametrised ONLY by demographics:
// nothing in here references skin lesions, body regions, or clinical findings.
// The Chart is the ONLY surface for clinical imagery; the portrait is a
// neutral identity photo for the picker and static presenter.
export function buildPortraitPrompt(patient: PatientCase): string {
  const d = patient.demographics;
  const skin = fitzpatrickDescription(d.fitzpatrick);
  const appearance = d.appearance?.trim();

  const subjectBits = [
    `${d.age}-year-old ${d.sex.toLowerCase()}`,
    skin,
    appearance,
  ].filter(Boolean);

  return [
    "Photorealistic studio portrait of a patient in a hospital examination room.",
    `Subject: ${subjectBits.join(", ")}.`,
    "Wearing a standard pale blue hospital gown.",
    "Head-and-shoulders framing, slight three-quarter angle, neutral facial expression, eyes toward the camera.",
    "Soft clinical lighting from the front-left, gentle shadows.",
    "Plain, slightly blurred medical-office background with a hint of an exam table and wall instruments.",
    "Realistic skin texture, no makeup, no glamour.",
    "STRICT NEGATIVE: no visible skin lesions, no rashes, no moles, no blemishes, no medical conditions on skin or face.",
    "No text, no watermarks, no logos, no stethoscope, no name tag.",
    "Documentary medical-portrait style, neutral colour grading.",
  ].join(" ");
}

function fitzpatrickDescription(f?: string): string | undefined {
  switch ((f ?? "").toUpperCase()) {
    case "I":
      return "very fair skin, light eyes, light hair";
    case "II":
      return "fair skin that burns easily, light to medium hair";
    case "III":
      return "medium skin tone";
    case "IV":
      return "olive skin tone";
    case "V":
      return "brown skin tone";
    case "VI":
      return "deeply pigmented dark brown skin tone";
    default:
      return undefined;
  }
}
