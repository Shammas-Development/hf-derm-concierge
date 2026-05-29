"use client";

import { useCallback, useEffect, useState } from "react";
import { Palette } from "lucide-react";

export type SimTheme = "aurora" | "clinical";

// Persisted look-and-feel toggle so the kiosk can switch between the vibrant
// "aurora" theme and a calm "clinical" light theme (e.g. for client demos).
export function useSimTheme() {
  const [theme, setTheme] = useState<SimTheme>("aurora");

  useEffect(() => {
    const saved = window.localStorage.getItem("sim-theme");
    if (saved === "clinical" || saved === "aurora") setTheme(saved);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: SimTheme = t === "aurora" ? "clinical" : "aurora";
      try {
        window.localStorage.setItem("sim-theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: SimTheme;
  onToggle: () => void;
}) {
  const next = theme === "aurora" ? "Clinical" : "Aurora";
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="sim-chip flex min-h-[2.75rem] items-center gap-2 rounded-full px-[clamp(0.7rem,1.1vw,1.2rem)] py-[clamp(0.4rem,0.8vh,0.7rem)] text-[clamp(0.78rem,0.95vw,1.05rem)] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
    >
      <Palette className="h-[1.1em] w-[1.1em]" />
      <span className="hidden lg:inline">{next}</span>
    </button>
  );
}
