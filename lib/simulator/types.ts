// Data model for the simulated-patient training kiosk.
// A PatientCase is authored content; the AI role-plays the patient using it,
// and clinical results are revealed stage-by-stage in the UI.

export type Stage = "history" | "exam" | "labs" | "diagnosis" | "treatment";

export interface LabResult {
  name: string;
  value: string;
  reference?: string;
  flag?: "normal" | "high" | "low" | "abnormal";
}

export interface BiopsyResult {
  procedure: string; // e.g. "Excisional biopsy, left upper back"
  collected?: string; // e.g. "3 days ago"
  gross?: string;
  microscopic: string;
  findings: string[]; // key bulleted findings (Breslow, margins, etc.)
  imageUrl?: string; // optional histopathology image shown in the chart
}

export interface ExamFinding {
  region: string; // e.g. "Left upper back"
  description: string;
  imageUrl?: string; // optional clinical/dermatoscopic photo
}

export interface PatientDemographics {
  name: string;
  age: number;
  sex: string;
  occupation?: string;
  fitzpatrick?: string;
  pronouns?: string;
  // Free-text appearance hint used by the portrait generator (hair, build,
  // weathering, etc.). Never include skin lesions or anything clinical here.
  appearance?: string;
}

export interface PatientCase {
  id: string;
  title: string; // short label for the picker, e.g. "Changing mole"
  specialty: string; // e.g. "Dermatology"
  difficulty?: "intro" | "intermediate" | "advanced";

  demographics: PatientDemographics;

  // Visual presentation
  portraitUrl: string; // photorealistic still for the static presenter
  heygenAvatarId?: string; // live avatar id (used when avatar mode = heygen)
  voiceHint?: string; // plain-language voice description (age/tone/accent)

  // LiveAvatar (HeyGen real-time) — used when avatar mode = "liveavatar".
  // The avatar renders the face + voice; our AI still drives the words.
  liveAvatar?: {
    avatarId: string;
    voiceId?: string;
    contextId: string; // required by the session API; unused in repeat mode
  };

  // How the patient talks — drives the AI persona
  personaNotes: string;

  // Clinical content, surfaced stage-by-stage
  chiefComplaint: string;
  history: {
    hpi: string; // history of present illness, first-person friendly
    pmh: string[]; // past medical history
    medications: string[];
    allergies: string[];
    social: string[];
    family: string[];
    ros?: string[]; // pertinent review of systems
  };
  exam: {
    summary: string; // what an examiner would observe
    findings: ExamFinding[];
    vitals?: LabResult[];
  };
  labs: LabResult[];
  biopsy?: BiopsyResult;
  // Optional clinical photos (lesion, dermatoscopy, etc.) shown in the chart's
  // exam section. The Chart is the ONLY surface for clinical body imagery —
  // these never render on the avatar.
  clinicalPhotos?: { caption: string; src: string }[];
  diagnosis: {
    primary: string;
    staging?: string;
    reasoning: string;
  };
  treatment: {
    plan: string[];
    nextSteps: string[];
    patientEducation?: string[];
  };
}

// Wire types shared with the simulator chat endpoint.
export interface SimChatMessage {
  role: "user" | "assistant";
  text: string;
}
