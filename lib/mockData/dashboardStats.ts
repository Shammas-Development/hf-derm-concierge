export const STAT_CARDS = {
  totalConsultations: 1247,
  activeSessions: 8,
  avgDuration: "3m 42s",
  leadsCaptured: 89,
};

export const CONCERN_BREAKDOWN = [
  { name: "Acne", value: 32, color: "#003DA5" },
  { name: "Aging", value: 24, color: "#5B8DEF" },
  { name: "Eczema", value: 18, color: "#10B981" },
  { name: "Moles/Growths", value: 14, color: "#F59E0B" },
  { name: "Rashes", value: 8, color: "#EF4444" },
  { name: "Other", value: 4, color: "#94A3B8" },
];

export const URGENCY_BREAKDOWN = [
  { name: "Routine", value: 71, color: "#10B981" },
  { name: "Soon", value: 24, color: "#F59E0B" },
  { name: "Urgent", value: 5, color: "#EF4444" },
];

// Hourly traffic curve — realistic event-day shape, peaking ~1pm
function curve(hour: number) {
  const peak = 13;
  const spread = 4.5;
  const base = Math.exp(-Math.pow(hour - peak, 2) / (2 * spread * spread));
  return Math.round(base * 180 + Math.random() * 12);
}

export const HOURLY_TRAFFIC = Array.from({ length: 12 }).map((_, i) => {
  const hour = 8 + i;
  const label = `${((hour + 11) % 12) + 1}${hour < 12 ? "a" : "p"}`;
  return { hour: label, consultations: curve(hour) };
});
