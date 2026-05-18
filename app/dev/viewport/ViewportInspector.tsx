"use client";

import { useEffect, useState } from "react";

interface Size {
  w: number;
  h: number;
  dpr: number;
}

const BPS = [
  { name: "base", min: 0, hint: "phones, sub-640" },
  { name: "sm", min: 640, hint: "large phones, small tablets" },
  { name: "md", min: 768, hint: "tablets" },
  { name: "lg", min: 1024, hint: "laptops" },
  { name: "xl", min: 1280, hint: "desktops" },
  { name: "2xl", min: 1536, hint: "large desktops" },
];

export function ViewportInspector() {
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    const update = () =>
      setSize({
        w: window.innerWidth,
        h: window.innerHeight,
        dpr: window.devicePixelRatio,
      });
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (!size) {
    return null;
  }

  const active = [...BPS].reverse().find((b) => size.w >= b.min)!;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#0a1738] text-white px-6 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white/5 border border-white/10 backdrop-blur p-6 sm:p-8">
        <div className="text-xs uppercase tracking-[0.22em] text-white/50">
          Viewport inspector
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="font-heading text-5xl sm:text-6xl font-semibold tabular-nums">
            {size.w}
          </span>
          <span className="text-white/40 text-2xl">×</span>
          <span className="font-heading text-3xl sm:text-4xl font-medium tabular-nums text-white/85">
            {size.h}
          </span>
        </div>
        <div className="mt-1 text-sm text-white/60">
          {size.dpr.toFixed(2)}× pixel density · CSS pixels above
        </div>

        <div className="mt-6 rounded-xl bg-[#003DA5]/40 border border-[#003DA5]/60 p-4">
          <div className="text-xs uppercase tracking-wide text-white/55">
            Active Tailwind breakpoint
          </div>
          <div className="mt-1 font-heading text-2xl font-semibold">
            {active.name}
            <span className="ml-2 text-sm text-white/55 font-sans font-normal">
              ≥ {active.min}px
            </span>
          </div>
          <div className="text-sm text-white/70 mt-1">{active.hint}</div>
        </div>

        <div className="mt-6 space-y-1.5">
          {BPS.map((b) => {
            const matched = size.w >= b.min;
            const isActive = b.name === active.name;
            return (
              <div
                key={b.name}
                className={`flex items-center justify-between text-sm rounded-lg px-3 py-1.5 transition ${
                  isActive
                    ? "bg-white/15 text-white"
                    : matched
                      ? "text-white/70"
                      : "text-white/30"
                }`}
              >
                <span className="font-mono">
                  {b.name.padEnd(5)} ≥ {String(b.min).padStart(4)}px
                </span>
                <span className="text-xs">
                  {matched ? "✓ matches" : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-white/50">
          Load this page on a real device (or resize this window) to verify
          the layout responds. Safe to leave deployed; carries no PHI.
        </p>
      </div>
    </div>
  );
}
