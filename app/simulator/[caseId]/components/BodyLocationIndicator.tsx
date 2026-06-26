"use client";

import { motion } from "framer-motion";
import type { BodyRegion } from "@/lib/simulator/types";

interface RegionInfo {
  view: "front" | "back";
  cx: number;
  cy: number;
  label: string;
}

// Coordinates on a 240×320 viewBox: front figure centred at x=60, back figure
// at x=180. Markers use the PATIENT's left/right (clinical convention) — for
// the front figure that means patient-left is on the viewer's right.
const REGIONS: Record<BodyRegion, RegionInfo> = {
  scalp: { view: "front", cx: 60, cy: 16, label: "Scalp" },
  face: { view: "front", cx: 60, cy: 32, label: "Face" },
  neck: { view: "front", cx: 60, cy: 52, label: "Neck" },
  chest: { view: "front", cx: 60, cy: 90, label: "Chest" },
  abdomen: { view: "front", cx: 60, cy: 130, label: "Abdomen" },
  "upper-back": { view: "back", cx: 180, cy: 90, label: "Upper back" },
  "lower-back": { view: "back", cx: 180, cy: 130, label: "Lower back" },
  "shoulder-left": { view: "front", cx: 80, cy: 65, label: "Left shoulder" },
  "shoulder-right": { view: "front", cx: 40, cy: 65, label: "Right shoulder" },
  "arm-left": { view: "front", cx: 90, cy: 120, label: "Left arm" },
  "arm-right": { view: "front", cx: 30, cy: 120, label: "Right arm" },
  "hand-left": { view: "front", cx: 96, cy: 195, label: "Left hand" },
  "hand-right": { view: "front", cx: 24, cy: 195, label: "Right hand" },
  "thigh-left": { view: "front", cx: 72, cy: 200, label: "Left thigh" },
  "thigh-right": { view: "front", cx: 48, cy: 200, label: "Right thigh" },
  "lower-leg-left": { view: "front", cx: 72, cy: 260, label: "Left lower leg" },
  "lower-leg-right": { view: "front", cx: 48, cy: 260, label: "Right lower leg" },
  "foot-left": { view: "front", cx: 73, cy: 298, label: "Left foot" },
  "foot-right": { view: "front", cx: 47, cy: 298, label: "Right foot" },
};

// Stylised silhouette — pure location pointer. No body detail, no clinical
// content rendered here; that boundary lives in the Chart panel.
function FigureSilhouette({ cx, label }: { cx: number; label: string }) {
  return (
    <g>
      <g fill="currentColor" opacity={0.22}>
        {/* head */}
        <circle cx={cx} cy={26} r={14} />
        {/* neck */}
        <rect x={cx - 6} y={40} width={12} height={10} rx={3} />
        {/* torso */}
        <path
          d={`M ${cx - 26} 56 Q ${cx - 30} 60 ${cx - 26} 70 L ${cx - 22} 160 Q ${cx} 168 ${cx + 22} 160 L ${cx + 26} 70 Q ${cx + 30} 60 ${cx + 26} 56 Z`}
        />
        {/* left arm (patient's left = viewer's right of front figure) */}
        <path
          d={`M ${cx + 28} 60 L ${cx + 38} 72 L ${cx + 34} 180 L ${cx + 22} 178 L ${cx + 24} 76 Z`}
        />
        {/* right arm */}
        <path
          d={`M ${cx - 28} 60 L ${cx - 38} 72 L ${cx - 34} 180 L ${cx - 22} 178 L ${cx - 24} 76 Z`}
        />
        {/* hands */}
        <circle cx={cx + 36} cy={192} r={6} />
        <circle cx={cx - 36} cy={192} r={6} />
        {/* left leg */}
        <path
          d={`M ${cx + 2} 160 L ${cx + 4} 290 L ${cx + 18} 290 L ${cx + 22} 165 Z`}
        />
        {/* right leg */}
        <path
          d={`M ${cx - 2} 160 L ${cx - 4} 290 L ${cx - 18} 290 L ${cx - 22} 165 Z`}
        />
        {/* feet */}
        <ellipse cx={cx + 11} cy={300} rx={10} ry={5} />
        <ellipse cx={cx - 11} cy={300} rx={10} ry={5} />
      </g>
      <text
        x={cx}
        y={318}
        textAnchor="middle"
        fontSize={10}
        className="fill-current opacity-55"
      >
        {label}
      </text>
    </g>
  );
}

export function BodyLocationIndicator({ region }: { region?: BodyRegion }) {
  if (!region) return null;
  const info = REGIONS[region];
  return (
    <div className="glass-panel sim-fg pointer-events-none w-[clamp(140px,12vw,200px)] rounded-2xl p-[clamp(0.5rem,0.8vw,0.9rem)]">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[clamp(0.6rem,0.7vw,0.78rem)] font-semibold uppercase tracking-wide opacity-70">
          Location
        </span>
        <span className="truncate text-[clamp(0.65rem,0.75vw,0.85rem)] opacity-75">
          {info.label}
        </span>
      </div>
      <svg viewBox="0 0 240 322" className="block h-auto w-full">
        <FigureSilhouette cx={60} label="Front" />
        <FigureSilhouette cx={180} label="Back" />

        {/* Pulsing marker on the affected region */}
        <g transform={`translate(${info.cx}, ${info.cy})`}>
          <motion.circle
            r={14}
            fill="rgb(244 63 94 / 0.35)"
            animate={{ scale: [1, 1.6, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle r={5} fill="rgb(244 63 94)" />
          <circle r={5} fill="none" stroke="white" strokeWidth={1.4} />
        </g>
      </svg>
    </div>
  );
}
