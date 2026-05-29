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
  showVideo?: boolean; // true once a live avatar stream is attached
  notice?: string; // small status note (e.g. HeyGen fallback)
}

// Pure visual surface for the patient: the portrait/avatar plus the caption
// bubble that shows what they're saying. No speech logic lives here.
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
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6">
      {/* Patient visual */}
      <div className="relative">
        <motion.div
          animate={
            speaking
              ? { scale: [1, 1.012, 1] }
              : { scale: [1, 1.006, 1] }
          }
          transition={{
            duration: speaking ? 0.5 : 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "relative overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-black/5",
            speaking && "ring-4 ring-emerald-400/60",
            listening && "ring-4 ring-sky-400/60",
          )}
          style={{ width: "clamp(260px, 34vh, 460px)" }}
        >
          <div className="aspect-[4/5] w-full">
            {/* Live avatar video (HeyGen) mounts here when connected */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
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

          {/* Speaking / listening chip */}
          <AnimatePresence>
            {(speaking || listening) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className={cn(
                  "absolute left-1/2 top-3 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white backdrop-blur",
                  speaking ? "bg-emerald-500/85" : "bg-sky-500/85",
                )}
              >
                {speaking ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5" /> Speaking
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" /> Listening
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Name plate */}
        <div className="mt-4 text-center">
          <div className="text-lg font-semibold text-foreground">{d.name}</div>
          <div className="text-sm text-muted-foreground">
            {d.age} · {d.sex}
            {d.occupation ? ` · ${d.occupation}` : ""}
          </div>
        </div>
      </div>

      {/* Caption bubble — what the patient is saying */}
      <div className="min-h-[4.5rem] w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {thinking && !caption ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto flex w-fit items-center gap-1.5 rounded-2xl bg-white px-5 py-4 shadow-md ring-1 ring-black/5"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-[#003DA5]/70"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </motion.div>
          ) : caption ? (
            <motion.div
              key="caption"
              data-testid="patient-caption"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative mx-auto rounded-2xl bg-white px-6 py-4 text-center text-[1.35rem] leading-relaxed text-foreground shadow-md ring-1 ring-black/5"
            >
              <span
                className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-sm bg-white ring-1 ring-black/5"
                aria-hidden
              />
              {caption}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {notice && (mode === "heygen" || mode === "liveavatar") && (
        <p className="text-xs text-muted-foreground">{notice}</p>
      )}
    </div>
  );
}
