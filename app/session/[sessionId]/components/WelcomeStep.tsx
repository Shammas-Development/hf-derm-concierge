"use client";

import { Button } from "@/components/ui/button";
import { ConsentDisclaimer } from "@/components/shared/ConsentDisclaimer";
import { Lock, Sparkles, ArrowRight } from "lucide-react";

export function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md px-5 sm:px-6 py-8 flex flex-col gap-6">
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-[#EEF2FB] px-3 py-1 text-xs font-medium text-[#003DA5]">
          <Sparkles className="h-3.5 w-3.5" />
          AI Dermatology Concierge
        </div>
        <h1 className="mt-5 font-heading text-[28px] sm:text-3xl font-semibold tracking-tight text-[#002C75] leading-tight">
          Welcome to your private skin health consultation
        </h1>
        <p className="mt-3 text-foreground/70 leading-relaxed">
          Take a few minutes to share what's going on with your skin. We'll
          help you understand it and connect you with the right board-certified
          dermatologist.
        </p>
      </div>

      <ConsentDisclaimer />

      <div className="flex items-start gap-2.5 rounded-xl bg-white border border-border p-4">
        <Lock className="h-4 w-4 text-[#003DA5] mt-0.5 shrink-0" />
        <p className="text-sm text-foreground/75">
          Your conversation is private and{" "}
          <span className="font-medium text-foreground">
            not stored after your visit
          </span>
          . Photos you share are analyzed in real time, never saved.
        </p>
      </div>

      <Button
        size="lg"
        className="h-12 text-base bg-[#003DA5] hover:bg-[#002C75]"
        onClick={onContinue}
      >
        I understand — let's begin
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Educational tool · Not medical advice · Synthetic demo data
      </p>
    </div>
  );
}
