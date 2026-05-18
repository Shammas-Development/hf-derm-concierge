export interface FakeLead {
  firstName: string;
  ageRange: string;
  concern: string;
  urgency: "GREEN" | "YELLOW" | "RED";
  booked: boolean;
  minutesAgo: number;
}

const FIRST_NAMES = [
  "Sarah",
  "James",
  "Priya",
  "Marcus",
  "Lena",
  "David",
  "Amara",
  "Chris",
  "Sofia",
  "Daniel",
  "Aisha",
  "Tom",
  "Mei",
  "Jordan",
  "Olivia",
  "Ravi",
  "Hannah",
  "Mateo",
  "Yuki",
  "Tasha",
];
const LAST_INITIALS = "MKRJSTLNPGCBDOWVHEAY".split("");
const CONCERNS = [
  "Acne",
  "Aging concerns",
  "Eczema or dryness",
  "Skin growths or moles",
  "Rashes or irritation",
  "Other",
];
const AGE_RANGES = ["Under 18", "18–30", "31–45", "46–60", "61+"];

// Deterministic generator (seeded by index) so the table is stable across renders.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateLeads(count = 18): FakeLead[] {
  const rng = seeded(7);
  const choose = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  const urgRng = () => {
    const r = rng();
    if (r < 0.71) return "GREEN" as const;
    if (r < 0.95) return "YELLOW" as const;
    return "RED" as const;
  };
  return Array.from({ length: count }).map((_, i) => ({
    firstName: `${choose(FIRST_NAMES)} ${choose(LAST_INITIALS)}.`,
    ageRange: choose(AGE_RANGES),
    concern: choose(CONCERNS),
    urgency: urgRng(),
    booked: rng() < 0.62,
    minutesAgo: Math.round(i * 3.5 + rng() * 4),
  }));
}

const FEED_TEMPLATES = [
  (id: number) => `Session #${id} — started · Discussing acne concerns`,
  (id: number) => `Session #${id} — booked appointment with Dr. Patel`,
  (id: number) => `Session #${id} — completed (Green urgency)`,
  (id: number) => `Session #${id} — completed (Yellow urgency)`,
  (id: number) => `Session #${id} — image analyzed · Mole evaluation`,
  (id: number) => `Session #${id} — booked appointment with Dr. Chen`,
  (id: number) => `Session #${id} — completed (Red urgency · Same-week)`,
  (id: number) => `Session #${id} — started · Eczema flare`,
  (id: number) => `Session #${id} — email summary sent`,
  (id: number) => `Session #${id} — booked appointment with Dr. Russo`,
];

export function randomFeedItem(latestId: number) {
  const tpl = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)];
  return {
    id: crypto.randomUUID(),
    sessionId: latestId,
    text: tpl(latestId),
    at: Date.now(),
  };
}

export const initialFeed = Array.from({ length: 8 }).map((_, i) => ({
  id: crypto.randomUUID(),
  sessionId: 1247 - i,
  text: FEED_TEMPLATES[i % FEED_TEMPLATES.length](1247 - i),
  at: Date.now() - i * 45000,
}));
