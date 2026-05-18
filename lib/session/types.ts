export type AgeRange = "Under 18" | "18–30" | "31–45" | "46–60" | "61+";

export type FitzpatrickType = "I" | "II" | "III" | "IV" | "V" | "VI" | "Unknown";

export type ConcernCategory =
  | "Acne"
  | "Aging concerns"
  | "Eczema or dryness"
  | "Skin growths or moles"
  | "Rashes or irritation"
  | "Other";

export type Duration =
  | "Less than a week"
  | "1–4 weeks"
  | "1–6 months"
  | "Longer";

export interface IntakeData {
  firstName?: string;
  ageRange?: AgeRange;
  fitzpatrick?: FitzpatrickType;
  concerns: ConcernCategory[];
  duration?: Duration;
}

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessageContentText {
  type: "text";
  text: string;
}

export interface ChatMessageContentImage {
  type: "image";
  data: string; // base64
  mediaType: "image/jpeg" | "image/png" | "image/webp";
}

export type ChatMessageContent = ChatMessageContentText | ChatMessageContentImage;

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: ChatMessageContent[];
  createdAt: number;
}
