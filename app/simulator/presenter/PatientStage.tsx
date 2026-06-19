"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2 } from "lucide-react";
import type { RefObject } from "react";
import { cn } from "@/lib/utils";
import type { AvatarMode, PatientCase } from "./types";

interface Props {
  patient: PatientCase;
  mode: AvatarMode;
  caption: string;
  speaking: boolean;
  thinking: boolean;
  listening: boolean;
  videoRef?: RefObject<HTMLVideoElement | null>;
  showVideo?: boolean;
  notice?: string;
}

export function PatientStage({
  patient,
  mode,
  caption,
  speaking,
  thinking,
  listening,
  videoRef,
  showVideo,
  notice,
}: Props) {
  const d = patient.demographics;

  return (
    <div className="sim-fg flex min-h-0 flex-1 flex-col overflow-y-auto px-[clamp(1rem,3vw,3rem)] py-[clamp(1rem,2vh,2rem)]">
     <div className="my-auto flex w-full flex-col items-center gap-[clamp(0.75rem,2.5vh,2.5rem)]">
      {/* Patient visual */}
      <div className="relative flex flex-col items-center">
        <motion.div
          animate={speaking ? { scale: [1, 1.012, 1] } : { scale: [1, 1.006, 1] }}
          transition={{
            duration: speaking ? 0.5 : 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "relative overflow-hidden rounded-[clamp(1.25rem,2.2vw,2.5rem)] transition-shadow duration-500",
            speaking
              ? "aurora-glow-emerald"
              : listening
                ? "aurora-glow-sky"
                : "aurora-ring",
          )}
          style={{ width: "min(92vw, min(1600px, calc(60vh * 16 / 9)))" }}
        >
          <div className="aspect-video w-full bg-white/5">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              aria-label={`Live video of ${d.name}, the patient`}
              className={cn(
                "h-full w-full object-cover",
                showVideo ? "block" : "hidden",
              )}
            />
            {!showVideo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={patient.portraitUrl}
                alt={`${d.name}, ${d.age}`}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* Status chip */}
          <AnimatePresence>
            {(speaking || listening) && (
              <motion.div
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className={cn(
                  "absolute left-1/2 top-[clamp(0.6rem,1.2vw,1rem)] flex -translate-x-1/2 items-center gap-1.5 rounded-full px-[clamp(0.7rem,1vw,1.1rem)] py-[clamp(0.25rem,0.5vh,0.45rem)] text-[clamp(0.7rem,0.9vw,1rem)] font-medium text-white backdrop-blur",
                  speaking ? "bg-emerald-500/85" : "bg-sky-500/85",
                )}
              >
                {speaking ? (
                  <>
                    <Volume2 className="h-[1.1em] w-[1.1em]" /> Speaking
                  </>
                ) : (
                  <>
                    <Mic className="h-[1.1em] w-[1.1em]" /> Listening
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connecting overlay (live avatar) */}
          {mode === "liveavatar" && !showVideo && (
            <div className="glass-panel absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="aurora-fill h-[clamp(0.5rem,0.8vw,0.85rem)] w-[clamp(0.5rem,0.8vw,0.85rem)] rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <span className="sim-muted text-[clamp(0.8rem,1vw,1.15rem)] font-medium">
                Connecting to the patient…
              </span>
            </div>
          )}
        </motion.div>

        {/* Name plate */}
        <div className="mt-[clamp(0.75rem,1.5vh,1.5rem)] text-center">
          <div className="font-heading text-[clamp(1.25rem,2vw,2.6rem)] font-semibold leading-tight">
            {d.name}
          </div>
          <div className="sim-muted text-[clamp(0.8rem,1vw,1.3rem)]">
            {d.age} · {d.sex}
            {d.occupation ? ` · ${d.occupation}` : ""}
          </div>
        </div>
      </div>

      {/* Caption bubble — what the patient is saying */}
      <div className="flex min-h-[clamp(4rem,8vh,7rem)] w-full max-w-[min(90vw,1100px)] items-start justify-center">
        <AnimatePresence mode="wait">
          {thinking && !caption ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-bright flex w-fit items-center gap-2 rounded-[clamp(1rem,1.4vw,1.5rem)] px-[clamp(1.1rem,1.6vw,2rem)] py-[clamp(0.8rem,1.2vh,1.3rem)] shadow-2xl"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="aurora-fill h-2.5 w-2.5 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          ) : caption ? (
            <motion.div
              key="caption"
              data-testid="patient-caption"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-bright relative rounded-[clamp(1rem,1.5vw,1.75rem)] px-[clamp(1.25rem,2vw,2.5rem)] py-[clamp(0.9rem,1.4vh,1.5rem)] text-center text-[clamp(1.15rem,1.7vw,2.4rem)] leading-relaxed text-slate-900 shadow-2xl"
            >
              <span
                className="glass-bright absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-sm"
                aria-hidden
              />
              {caption}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {notice && (mode === "heygen" || mode === "liveavatar") && (
        <p className="sim-subtle text-[clamp(0.7rem,0.85vw,0.95rem)]">
          {notice}
        </p>
      )}
     </div>
    </div>
  );
}
