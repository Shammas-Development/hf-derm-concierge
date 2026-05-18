"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type {
  AgeRange,
  ConcernCategory,
  Duration,
  FitzpatrickType,
  IntakeData,
} from "@/lib/session/types";

const AGES: AgeRange[] = ["Under 18", "18–30", "31–45", "46–60", "61+"];
const CONCERNS: ConcernCategory[] = [
  "Acne",
  "Aging concerns",
  "Eczema or dryness",
  "Skin growths or moles",
  "Rashes or irritation",
  "Other",
];
const DURATIONS: Duration[] = [
  "Less than a week",
  "1–4 weeks",
  "1–6 months",
  "Longer",
];

const FITZPATRICK: { type: FitzpatrickType; label: string; swatch: string }[] = [
  { type: "I", label: "Very fair", swatch: "#F6E0D2" },
  { type: "II", label: "Fair", swatch: "#EBC5A8" },
  { type: "III", label: "Medium", swatch: "#D2A179" },
  { type: "IV", label: "Olive", swatch: "#A57752" },
  { type: "V", label: "Brown", swatch: "#71492F" },
  { type: "VI", label: "Deep", swatch: "#3F2517" },
];

export function IntakeStep({
  value,
  onChange,
  onBack,
  onContinue,
}: {
  value: IntakeData;
  onChange: (v: IntakeData) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const canContinue =
    !!value.ageRange &&
    !!value.fitzpatrick &&
    value.concerns.length > 0 &&
    !!value.duration;

  const toggleConcern = (c: ConcernCategory) => {
    const next = value.concerns.includes(c)
      ? value.concerns.filter((x) => x !== c)
      : [...value.concerns, c];
    onChange({ ...value, concerns: next });
  };

  return (
    <div className="mx-auto w-full max-w-md px-5 sm:px-6 py-6 flex flex-col gap-7">
      <header>
        <h2 className="font-heading text-2xl font-semibold text-[#002C75]">
          A quick intake
        </h2>
        <p className="text-sm text-foreground/65 mt-1">
          Five short questions so the concierge can tailor the conversation.
        </p>
      </header>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="firstName" className="text-sm">
          First name <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="firstName"
          autoComplete="given-name"
          inputMode="text"
          value={value.firstName ?? ""}
          onChange={(e) => onChange({ ...value, firstName: e.target.value })}
          placeholder="Skip to stay anonymous"
          className="h-11"
        />
      </div>

      {/* Age */}
      <Field label="Age range">
        <PillGroup>
          {AGES.map((a) => (
            <Pill
              key={a}
              selected={value.ageRange === a}
              onClick={() => onChange({ ...value, ageRange: a })}
            >
              {a}
            </Pill>
          ))}
        </PillGroup>
      </Field>

      {/* Fitzpatrick */}
      <Field
        label="Skin type"
        hint="The Fitzpatrick scale describes how skin responds to sun. Tap what looks closest — or pick Not sure."
      >
        <div className="grid grid-cols-6 gap-2">
          {FITZPATRICK.map((f) => (
            <button
              key={f.type}
              type="button"
              onClick={() => onChange({ ...value, fitzpatrick: f.type })}
              className={cn(
                "group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition",
                value.fitzpatrick === f.type
                  ? "border-[#003DA5] bg-[#EEF2FB] shadow-sm"
                  : "border-border hover:border-[#003DA5]/40",
              )}
              aria-label={`Type ${f.type} — ${f.label}`}
            >
              <span
                className="h-9 w-9 rounded-full ring-1 ring-black/5"
                style={{ background: f.swatch }}
              />
              <span className="text-[10px] font-medium text-foreground/80">
                {f.type}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...value, fitzpatrick: "Unknown" })}
          className={cn(
            "mt-3 text-xs font-medium underline-offset-4 hover:underline transition",
            value.fitzpatrick === "Unknown"
              ? "text-[#003DA5]"
              : "text-muted-foreground",
          )}
        >
          Not sure
        </button>
      </Field>

      {/* Concerns */}
      <Field label="Primary concern" hint="Select all that apply.">
        <PillGroup>
          {CONCERNS.map((c) => (
            <Pill
              key={c}
              selected={value.concerns.includes(c)}
              onClick={() => toggleConcern(c)}
            >
              {c}
            </Pill>
          ))}
        </PillGroup>
      </Field>

      {/* Duration */}
      <Field label="How long has this been going on?">
        <PillGroup>
          {DURATIONS.map((d) => (
            <Pill
              key={d}
              selected={value.duration === d}
              onClick={() => onChange({ ...value, duration: d })}
            >
              {d}
            </Pill>
          ))}
        </PillGroup>
      </Field>

      <div className="flex items-center gap-3 pt-2 pb-6">
        <Button
          variant="ghost"
          size="lg"
          onClick={onBack}
          className="h-12 px-4"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          size="lg"
          disabled={!canContinue}
          onClick={onContinue}
          className="h-12 flex-1 bg-[#003DA5] hover:bg-[#002C75] disabled:bg-[#003DA5]/40"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {hint && (
          <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function PillGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Pill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-[0.98]",
        selected
          ? "border-[#003DA5] bg-[#003DA5] text-white"
          : "border-border bg-white text-foreground/80 hover:border-[#003DA5]/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
