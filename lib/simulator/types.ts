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
