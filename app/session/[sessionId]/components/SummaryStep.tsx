"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UrgencyBadge } from "@/components/shared/UrgencyBadge";
import { Calendar, Mail, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { IntakeData } from "@/lib/session/types";
import type { SummaryResult } from "../SessionExperience";

const URGENCY_TITLE = {
  GREEN: "Routine follow-up recommended",
  YELLOW: "Schedule a visit soon",
  RED: "Prompt evaluation recommended",
} as const;

function renderInline(text: string) {
  // Tiny renderer: bold (**...**) and bullets (- ).
  const blocks = text.trim().split(/\n{2,}/);
  return blocks.map((block, bi) => {
    const lines = block.split("\n");
    const isList = lines.every((l) => l.trimStart().startsWith("- "));
    if (isList) {
      return (
        <ul key={bi} className="space-y-1.5 list-disc pl-5 text-foreground/80">
          {lines.map((l, i) => (
            <li key={i}>{boldify(l.replace(/^\s*-\s+/, ""))}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi} className="text-foreground/80 leading-relaxed">
        {lines.map((l, i) => (
          <span key={i}>
            {boldify(l)}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

function boldify(s: string): React.ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function SummaryStep({
  intake,
  summary,
  onBook,
  onRestart,
}: {
  intake: IntakeData;
  summary: SummaryResult;
  onBook: () => void;
  onRestart: () => void;
}) {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendEmail = () => {
    if (!email.includes("@")) {
      toast.error("Please enter a valid email.");
      return;
    }
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSent(true);
      console.log("[demo] Would email summary to:", email, {
        intake,
        summary,
      });
      toast.success("Summary sent. Check your inbox shortly.");
    }, 800);
  };

  return (
    <div className="mx-auto w-full max-w-md px-5 sm:px-6 py-6 flex flex-col gap-5">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="mx-auto h-12 w-12 rounded-full bg-[#003DA5]/10 text-[#003DA5] flex items-center justify-center"
      >
        <Check className="h-6 w-6" />
      </motion.div>

      <header className="text-center">
        <h2 className="font-heading text-2xl font-semibold text-[#002C75]">
          {URGENCY_TITLE[summary.urgency]}
        </h2>
        <p className="text-sm text-foreground/65 mt-1">
          Here's what we discussed and what we recommend next.
        </p>
      </header>

      <UrgencyBadge level={summary.urgency} />

      <section className="rounded-2xl border border-border bg-white p-5 space-y-3">
        {renderInline(summary.text)}
      </section>

      <Button
        size="lg"
        onClick={onBook}
        className="h-12 bg-[#003DA5] hover:bg-[#002C75]"
      >
        <Calendar className="mr-2 h-4 w-4" />
        Book a Henry Ford dermatology appointment
      </Button>

      <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
        <Label htmlFor="email" className="text-sm">
          Email me my summary
        </Label>
        <div className="flex gap-2">
          <Input
            id="email"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={emailSent || sendingEmail}
            className="h-11"
          />
          <Button
            variant="outline"
            onClick={handleSendEmail}
            disabled={emailSent || sendingEmail || !email}
            className="h-11 border-[#003DA5]/25 text-[#002C75] shrink-0"
          >
            <Mail className="mr-1.5 h-4 w-4" />
            {emailSent ? "Sent" : sendingEmail ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="mx-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
      >
        <RotateCcw className="h-3 w-3" />
        Start over
      </button>
    </div>
  );
}
