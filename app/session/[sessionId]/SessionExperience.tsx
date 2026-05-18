"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Urgency } from "@/components/shared/UrgencyBadge";
import type { IntakeData } from "@/lib/session/types";
import { HFHeader } from "@/components/branding/HFHeader";
import { WelcomeStep } from "./components/WelcomeStep";
import { IntakeStep } from "./components/IntakeStep";
import { ChatStep } from "./components/ChatStep";
import { SummaryStep } from "./components/SummaryStep";
import { BookingStep } from "./components/BookingStep";
import { ProgressDots } from "./components/ProgressDots";

export type Step = "welcome" | "intake" | "chat" | "summary" | "booking";

const STEP_ORDER: Step[] = ["welcome", "intake", "chat", "summary", "booking"];

export interface SummaryResult {
  urgency: Urgency;
  text: string;
}

export function SessionExperience({ sessionId }: { sessionId: string }) {
  const [step, setStep] = useState<Step>("welcome");
  const [intake, setIntake] = useState<IntakeData>({ concerns: [] });
  const [summary, setSummary] = useState<SummaryResult | null>(null);

  const goTo = useCallback((next: Step) => setStep(next), []);

  return (
    <div className="flex flex-1 flex-col bg-[#F5F7FA]">
      <HFHeader
        showBack
        rightSlot={
          step !== "welcome" && step !== "booking" ? (
            <ProgressDots
              current={STEP_ORDER.indexOf(step)}
              total={STEP_ORDER.length}
            />
          ) : undefined
        }
      />
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-1 flex-col"
          >
            {step === "welcome" && (
              <WelcomeStep onContinue={() => goTo("intake")} />
            )}
            {step === "intake" && (
              <IntakeStep
                value={intake}
                onChange={setIntake}
                onBack={() => goTo("welcome")}
                onContinue={() => goTo("chat")}
              />
            )}
            {step === "chat" && (
              <ChatStep
                sessionId={sessionId}
                intake={intake}
                onEnd={(result) => {
                  setSummary(result);
                  goTo("summary");
                }}
              />
            )}
            {step === "summary" && summary && (
              <SummaryStep
                intake={intake}
                summary={summary}
                onBook={() => goTo("booking")}
                onRestart={() => {
                  setSummary(null);
                  setIntake({ concerns: [] });
                  goTo("welcome");
                }}
              />
            )}
            {step === "booking" && (
              <BookingStep
                intake={intake}
                urgency={summary?.urgency ?? "GREEN"}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
