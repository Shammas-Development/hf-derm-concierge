"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronRight,
  CheckCircle2,
  Star,
  MapPin,
} from "lucide-react";
import type { IntakeData } from "@/lib/session/types";
import type { Urgency } from "@/components/shared/UrgencyBadge";

interface Provider {
  id: string;
  name: string;
  title: string;
  initials: string;
  bgGradient: string;
  focus: string;
}

const PROVIDERS: Provider[] = [
  {
    id: "p1",
    name: "Dr. Amara Patel",
    title: "MD, FAAD · General & Pediatric Dermatology",
    initials: "AP",
    bgGradient: "from-[#003DA5] to-[#5B8DEF]",
    focus: "Acne · Eczema · Pediatric",
  },
  {
    id: "p2",
    name: "Dr. Marcus Chen",
    title: "MD, FAAD · Mohs & Skin Cancer",
    initials: "MC",
    bgGradient: "from-[#0F766E] to-[#10B981]",
    focus: "Mole evaluation · Skin cancer",
  },
  {
    id: "p3",
    name: "Dr. Lena Russo",
    title: "MD · Medical & Cosmetic Dermatology",
    initials: "LR",
    bgGradient: "from-[#7C3AED] to-[#A855F7]",
    focus: "Rosacea · Aging · Pigmentation",
  },
];

const SLOT_TEMPLATES = ["8:30 AM", "10:00 AM", "1:15 PM", "3:45 PM"];

function nextDays(n: number) {
  const today = new Date();
  return Array.from({ length: n }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

function formatDay(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}
function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { day: "numeric" });
}
function formatLong(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function BookingStep({
  intake,
  urgency,
}: {
  intake: IntakeData;
  urgency: Urgency;
}) {
  const days = useMemo(() => nextDays(14), []);
  const [dayIdx, setDayIdx] = useState(urgency === "RED" ? 0 : 2);
  const [slot, setSlot] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string>(PROVIDERS[0].id);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const provider = PROVIDERS.find((p) => p.id === providerId)!;
  const canConfirm = !!slot;

  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-md px-5 sm:px-6 py-8 flex flex-col gap-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="mx-auto h-16 w-16 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center"
        >
          <CheckCircle2 className="h-8 w-8" />
        </motion.div>

        <header className="text-center">
          <h2 className="font-heading text-2xl font-semibold text-[#002C75]">
            Your request has been sent
          </h2>
          <p className="mt-2 text-foreground/70 leading-relaxed">
            A care coordinator will reach out within{" "}
            <strong className="text-foreground">24 hours</strong> to confirm
            your appointment{intake.firstName ? `, ${intake.firstName}` : ""}.
          </p>
        </header>

        <div className="rounded-2xl border border-border bg-white p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar provider={provider} />
            <div>
              <div className="text-sm font-medium text-foreground">
                {provider.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {provider.title}
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <Row icon={Calendar} label={`${formatLong(days[dayIdx])} · ${slot}`} />
            <Row
              icon={MapPin}
              label="Downtown Dermatology Center"
            />
          </div>
        </div>

        {/* Rating */}
        <div className="rounded-2xl border border-border bg-white p-5">
          {feedbackSubmitted ? (
            <div className="text-sm text-foreground/70 text-center">
              Thank you — we appreciate your feedback.
            </div>
          ) : (
            <>
              <div className="text-sm font-medium text-foreground text-center">
                How was your experience?
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    aria-label={`${n} stars`}
                    className="p-1 transition active:scale-95"
                  >
                    <Star
                      className={cn(
                        "h-7 w-7",
                        n <= rating
                          ? "fill-[#F59E0B] text-[#F59E0B]"
                          : "text-foreground/20",
                      )}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Anything we could do better? (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-3 resize-none"
                rows={2}
              />
              <Button
                onClick={() => {
                  setFeedbackSubmitted(true);
                  console.log("[demo] Feedback submitted:", { rating, feedback });
                }}
                disabled={rating === 0}
                className="mt-3 w-full bg-[#003DA5] hover:bg-[#002C75]"
              >
                Submit feedback
              </Button>
            </>
          )}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Educational tool · Demo · No real appointment was created
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-5 sm:px-6 py-6 flex flex-col gap-6">
      <header>
        <h2 className="font-heading text-2xl font-semibold text-[#002C75]">
          Book your appointment
        </h2>
        <p className="text-sm text-foreground/65 mt-1">
          Pick a provider, day, and time. We'll handle the rest.
        </p>
      </header>

      {/* Provider picker */}
      <section className="space-y-2.5">
        <div className="text-sm font-medium text-foreground">Provider</div>
        <div className="space-y-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProviderId(p.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]",
                providerId === p.id
                  ? "border-[#003DA5] bg-[#EEF2FB]"
                  : "border-border bg-white hover:border-[#003DA5]/40",
              )}
            >
              <Avatar provider={p} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {p.name}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {p.title}
                </div>
                <div className="text-[11px] text-[#003DA5] mt-0.5">
                  {p.focus}
                </div>
              </div>
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center",
                  providerId === p.id
                    ? "border-[#003DA5] bg-[#003DA5]"
                    : "border-border",
                )}
              >
                {providerId === p.id && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Day picker */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">Day</div>
          <div className="text-xs text-muted-foreground">
            Next 14 days
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 snap-x">
          {days.map((d, i) => (
            <button
              key={i}
              onClick={() => {
                setDayIdx(i);
                setSlot(null);
              }}
              className={cn(
                "snap-start flex-shrink-0 w-14 rounded-xl border py-2 px-1 flex flex-col items-center transition",
                dayIdx === i
                  ? "border-[#003DA5] bg-[#003DA5] text-white"
                  : "border-border bg-white text-foreground/80 hover:border-[#003DA5]/40",
              )}
            >
              <span className="text-[10px] uppercase tracking-wide opacity-75">
                {formatDay(d)}
              </span>
              <span className="text-lg font-semibold tabular-nums leading-tight">
                {formatDate(d)}
              </span>
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatLong(days[dayIdx])}
        </div>
      </section>

      {/* Slot picker */}
      <section className="space-y-2.5">
        <div className="text-sm font-medium text-foreground">Time</div>
        <div className="grid grid-cols-2 gap-2">
          {SLOT_TEMPLATES.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className={cn(
                "rounded-xl border py-2.5 text-sm font-medium transition active:scale-[0.98]",
                slot === s
                  ? "border-[#003DA5] bg-[#003DA5] text-white"
                  : "border-border bg-white text-foreground/80 hover:border-[#003DA5]/40",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <Button
        size="lg"
        onClick={() => setSubmitted(true)}
        disabled={!canConfirm}
        className="h-12 bg-[#003DA5] hover:bg-[#002C75] disabled:bg-[#003DA5]/40"
      >
        Request appointment
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Demo · No real appointment will be booked
      </p>
    </div>
  );
}

function Avatar({ provider }: { provider: Provider }) {
  return (
    <div
      className={cn(
        "h-11 w-11 shrink-0 rounded-full bg-gradient-to-br text-white font-semibold flex items-center justify-center text-sm",
        provider.bgGradient,
      )}
    >
      {provider.initials}
    </div>
  );
}

function Row({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-foreground/80">
      <Icon className="h-4 w-4 text-[#003DA5] shrink-0" />
      <span>{label}</span>
    </div>
  );
}
