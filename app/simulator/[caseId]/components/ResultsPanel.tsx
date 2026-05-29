"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, FlaskConical, Microscope, Stethoscope, ClipboardCheck, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { isUnlocked, STAGE_META } from "@/lib/simulator/stages";
import type { LabResult, PatientCase, Stage } from "@/lib/simulator/types";

interface Props {
  patient: PatientCase;
  current: Stage;
  open: boolean;
  onClose: () => void;
}

const FLAG_STYLES: Record<NonNullable<LabResult["flag"]>, string> = {
  normal: "text-emerald-600",
  high: "text-amber-600",
  low: "text-amber-600",
  abnormal: "text-red-600",
};

export function ResultsPanel({ patient, current, open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">Clinical chart</h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="chat-scroll flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <Section
                icon={<Stethoscope className="h-4 w-4" />}
                title="Examination"
                unlocked={isUnlocked("exam", current)}
                lockedAt="exam"
              >
                <p className="text-sm text-foreground/80">{patient.exam.summary}</p>
                {patient.exam.vitals && patient.exam.vitals.length > 0 && (
                  <LabTable rows={patient.exam.vitals} />
                )}
                <ul className="space-y-2">
                  {patient.exam.findings.map((f, i) => (
                    <li key={i} className="rounded-lg bg-muted/60 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#003DA5]">
                        {f.region}
                      </div>
                      <div className="mt-1 text-sm text-foreground/80">
                        {f.description}
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section
                icon={<FlaskConical className="h-4 w-4" />}
                title="Laboratory results"
                unlocked={isUnlocked("labs", current)}
                lockedAt="labs"
              >
                <LabTable rows={patient.labs} />
              </Section>

              {patient.biopsy && (
                <Section
                  icon={<Microscope className="h-4 w-4" />}
                  title="Biopsy / pathology"
                  unlocked={isUnlocked("labs", current)}
                  lockedAt="labs"
                >
                  <div className="text-sm font-medium">{patient.biopsy.procedure}</div>
                  {patient.biopsy.collected && (
                    <div className="text-xs text-muted-foreground">
                      Collected {patient.biopsy.collected}
                    </div>
                  )}
                  <p className="mt-2 text-sm text-foreground/80">
                    {patient.biopsy.microscopic}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {patient.biopsy.findings.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground/80">
                        <span className="text-[#003DA5]">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section
                icon={<ClipboardCheck className="h-4 w-4" />}
                title="Diagnosis"
                unlocked={isUnlocked("diagnosis", current)}
                lockedAt="diagnosis"
              >
                <div className="text-sm font-semibold text-foreground">
                  {patient.diagnosis.primary}
                </div>
                {patient.diagnosis.staging && (
                  <div className="mt-1 rounded-md bg-[#EEF2FB] px-3 py-2 text-sm text-[#002C75]">
                    {patient.diagnosis.staging}
                  </div>
                )}
                <p className="mt-2 text-sm text-foreground/80">
                  {patient.diagnosis.reasoning}
                </p>
              </Section>

              <Section
                icon={<ListChecks className="h-4 w-4" />}
                title="Treatment & next steps"
                unlocked={isUnlocked("treatment", current)}
                lockedAt="treatment"
              >
                <BulletGroup label="Management plan" items={patient.treatment.plan} />
                <BulletGroup label="Next steps" items={patient.treatment.nextSteps} />
                {patient.treatment.patientEducation && (
                  <BulletGroup
                    label="Patient education"
                    items={patient.treatment.patientEducation}
                  />
                )}
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({
  icon,
  title,
  unlocked,
  lockedAt,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  unlocked: boolean;
  lockedAt: Stage;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF2FB] text-[#003DA5]">
          {icon}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {unlocked ? (
        <div className="space-y-2 pl-9">{children}</div>
      ) : (
        <div className="ml-9 flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Unlocks at the “{STAGE_META[lockedAt].label}” step
        </div>
      )}
    </section>
  );
}

function LabTable({ rows }: { rows: LabResult[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={cn(i % 2 === 1 && "bg-muted/40")}>
              <td className="px-3 py-2 text-foreground/80">{r.name}</td>
              <td
                className={cn(
                  "px-3 py-2 text-right font-medium tabular-nums",
                  r.flag ? FLAG_STYLES[r.flag] : "text-foreground",
                )}
              >
                {r.value}
              </td>
              <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                {r.reference ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BulletGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <ul className="mt-1 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground/80">
            <span className="text-[#003DA5]">•</span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
