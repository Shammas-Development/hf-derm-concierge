import Link from "next/link";
import { ArrowRight, Stethoscope } from "lucide-react";
import { listCases } from "@/lib/simulator/cases";

export function CasePicker() {
  const cases = listCases();
  return (
    <div className="flex flex-1 flex-col bg-[#F5F7FA]">
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#003DA5] text-white">
            <Stethoscope className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-semibold">
              Patient Encounter Simulator
            </h1>
            <p className="text-sm text-muted-foreground">
              Interview a simulated patient through history, exam, results,
              diagnosis, and treatment.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/simulator/${c.id}`}
              className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-[#003DA5]/40 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.portraitUrl}
                  alt={c.demographics.name}
                  className="h-20 w-16 rounded-lg object-cover ring-1 ring-black/5"
                />
                <div className="flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#003DA5]">
                    {c.specialty}
                    {c.difficulty ? ` · ${c.difficulty}` : ""}
                  </div>
                  <div className="mt-0.5 text-lg font-semibold text-foreground">
                    {c.demographics.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {c.demographics.age} · {c.demographics.sex} · {c.title}
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#003DA5]">
                    Start encounter
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
