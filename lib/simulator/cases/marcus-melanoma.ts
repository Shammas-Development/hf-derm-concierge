import type { PatientCase } from "../types";
import resolved from "./marcus-melanoma.resolved.json";

// ILLUSTRATIVE SAMPLE CASE — replace with client-supplied clinical content.
// A classic "don't miss" dermatology teaching case: a changing pigmented
// lesion worked up to invasive melanoma across all five encounter stages.

// LiveAvatar avatar_id — created manually in https://app.liveavatar.com
// (custom Photo Avatar from the generated portrait, or any preset). The
// generation script auto-resolves voiceId / contextId / portraitUrl into
// ./marcus-melanoma.resolved.json.
const AVATAR_ID = "7b888024-f8c9-4205-95e1-78ce01497bda"; // Shawn Therapist (preset)

export const marcusMelanoma: PatientCase = {
  id: "marcus-melanoma",
  title: "Changing mole",
  specialty: "Dermatology",
  difficulty: "intermediate",

  demographics: {
    name: "Marcus Bennett",
    age: 58,
    sex: "Male",
    pronouns: "he/him",
    occupation: "Landscaper",
    fitzpatrick: "II",
    appearance:
      "short greying brown hair, weathered outdoor complexion, light stubble, sturdy build",
  },

  portraitUrl: resolved.portraitUrl,
  voiceHint:
    "Middle-aged American man, warm but a little anxious, plain-spoken.",
  liveAvatar: {
    avatarId: AVATAR_ID,
    voiceId: resolved.voiceId,
    contextId: resolved.contextId,
  },

  personaNotes: `You are Marcus Bennett, a 58-year-old landscaper. You are friendly and cooperative but quietly worried — your wife pushed you to come in. You speak plainly, in short everyday sentences, and you don't use medical jargon. You get a little nervous when the conversation turns to cancer. You answer what you're asked and don't volunteer the whole story at once.`,

  chiefComplaint:
    "A mole on my upper back has been changing — it's gotten bigger and darker over the last few months.",

  history: {
    hpi: "I first noticed the spot maybe four months ago. It used to be small and flat, but it's grown — it's darker now and the edges look kind of ragged. It itches now and then, and about two weeks ago it bled a little when my shirt rubbed it. It doesn't really hurt.",
    pmh: ["High blood pressure (controlled)", "No prior skin cancers"],
    medications: ["Lisinopril 10 mg daily"],
    allergies: ["No known drug allergies"],
    social: [
      "Works outdoors year-round, lots of sun exposure",
      "Rarely uses sunscreen",
      "History of several blistering sunburns as a young man",
      "Former smoker, quit 10 years ago",
      "Drinks socially",
    ],
    family: [
      "Father had a 'skin cancer' removed from his face in his 60s",
      "No known family history of melanoma otherwise",
    ],
    ros: [
      "No weight loss, fevers, or night sweats",
      "No new lumps that he has noticed",
      "Energy normal",
    ],
  },

  exam: {
    summary:
      "Fair-skinned man in no distress. Skin exam focused on a pigmented lesion of the left upper back, with scattered benign-appearing nevi elsewhere.",
    findings: [
      {
        region: "Left upper back",
        description:
          "Approximately 11 mm asymmetric pigmented macule/plaque with variegated brown-black coloration and a focal blue-gray area. Borders are irregular and notched. Slightly raised centrally. No surrounding satellite lesions.",
      },
      {
        region: "Dermatoscopy (same lesion)",
        description:
          "Atypical pigment network, irregular streaks, and a blue-white veil. Asymmetry in two axes.",
      },
      {
        region: "Lymph nodes",
        description:
          "No palpable axillary or cervical lymphadenopathy.",
      },
      {
        region: "Remaining skin",
        description:
          "Multiple small, symmetric, uniformly tan nevi consistent with benign moles.",
      },
    ],
    vitals: [
      { name: "Blood pressure", value: "128/78 mmHg", flag: "normal" },
      { name: "Heart rate", value: "72 bpm", flag: "normal" },
      { name: "Temperature", value: "37.0 °C", flag: "normal" },
    ],
  },

  labs: [
    { name: "WBC", value: "6.8 x10⁹/L", reference: "4.0–11.0", flag: "normal" },
    { name: "Hemoglobin", value: "14.6 g/dL", reference: "13.5–17.5", flag: "normal" },
    { name: "Platelets", value: "248 x10⁹/L", reference: "150–400", flag: "normal" },
    { name: "LDH", value: "180 U/L", reference: "140–280", flag: "normal" },
    { name: "Comprehensive metabolic panel", value: "Within normal limits", flag: "normal" },
  ],

  biopsy: {
    procedure: "Excisional biopsy, pigmented lesion of the left upper back",
    collected: "3 days ago",
    gross:
      "Ellipse of skin 18 x 8 mm bearing a 11 mm irregular, variably pigmented lesion.",
    microscopic:
      "Asymmetric proliferation of atypical melanocytes with pagetoid upward spread and a dermal invasive component. Invasive malignant melanoma, superficial spreading type.",
    findings: [
      "Breslow thickness: 1.4 mm",
      "Clark level: IV",
      "Mitotic rate: 2 / mm²",
      "Ulceration: absent",
      "Microsatellites: none identified",
      "Peripheral and deep margins: involved on this initial excision",
    ],
  },

  diagnosis: {
    primary: "Invasive malignant melanoma (superficial spreading type)",
    staging: "Breslow 1.4 mm, non-ulcerated → pT2a; clinical stage IB pending nodal evaluation",
    reasoning:
      "Changing pigmented lesion with classic ABCDE features (asymmetry, border irregularity, color variegation, diameter >6 mm, evolution), dermatoscopic atypia, and histologic confirmation of invasive melanoma. Significant UV exposure and family history are contributing risk factors.",
  },

  treatment: {
    plan: [
      "Wide local excision with 1–2 cm margins (margin guided by Breslow thickness)",
      "Discuss sentinel lymph node biopsy (appropriate for Breslow >1.0 mm)",
      "Referral to surgical/medical oncology and multidisciplinary melanoma team",
      "Baseline staging imaging only if clinically indicated by exam/symptoms",
    ],
    nextSteps: [
      "Full-body skin examination now and every 3–6 months",
      "Patient and family counseling on the diagnosis and prognosis",
      "Strict photoprotection: sunscreen, protective clothing, sun avoidance",
      "Teach skin self-examination and the ABCDE warning signs",
    ],
    patientEducation: [
      "Melanoma found and treated early has a very good prognosis",
      "First-degree relatives should have skin checks",
      "Report any new or changing moles promptly",
    ],
  },
};
