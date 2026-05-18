import type { Urgency } from "@/components/shared/UrgencyBadge";

const URGENCY_RE = /\[URGENCY:(GREEN|YELLOW|RED)\]/i;

export function extractUrgency(text: string): Urgency | null {
  const m = text.match(URGENCY_RE);
  if (!m) return null;
  return m[1].toUpperCase() as Urgency;
}

export function stripUrgencyTag(text: string): string {
  return text.replace(URGENCY_RE, "").trimEnd();
}
