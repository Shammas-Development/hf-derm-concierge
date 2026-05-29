import Link from "next/link";
import { ArrowRight, Stethoscope, Sparkles } from "lucide-react";
import { listCases } from "@/lib/simulator/cases";
import { Aurora } from "./components/Aurora";

export function CasePicker() {
  const cases = listCases();
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col text-white">
      <Aurora />

      <div className="mx-auto w-full max-w-[min(92vw,1600px)] flex-1 px-[clamp(1rem,4vw,4rem)] py-[clamp(2rem,6vh,6rem)]">
        {/* Header */}
        <div className="flex items-center gap-[clamp(0.75rem,1.2vw,1.5rem)]">
          <span className="aurora-fill aurora-ring flex aspect-square w-[clamp(2.75rem,4.5vw,5rem)] items-center justify-center rounded-[clamp(0.9rem,1.4vw,1.6rem)] text-white">
            <Stethoscope className="h-[55%] w-[55%]" />
          </span>
          <div>
            <div className="flex items-center gap-2 text-[clamp(0.65rem,0.9vw,1rem)] font-medium uppercase tracking-[0.22em] text-white/55">
              <Sparkles className="h-[1em] w-[1em]" />
              Clinical Training
            </div>
            <h1 className="font-heading text-[clamp(1.6rem,3.4vw,4rem)] font-semibold leading-[1.05]">
              <span className="aurora-text">Patient Encounter</span> Simulator
            </h1>
          </div>
        </div>
        <p className="mt-[clamp(0.75rem,1.5vh,1.5rem)] max-w-[60ch] text-[clamp(0.95rem,1.2vw,1.5rem)] leading-relaxed text-white/65">
          Interview a lifelike patient through history, examination, results,
          diagnosis, and treatment — by voice or touch.
        </p>

        {/* Cases */}
        <div className="mt-[clamp(2rem,4vh,4rem)] grid gap-[clamp(1rem,1.8vw,2rem)] [grid-template-columns:repeat(auto-fill,minmax(min(100%,clamp(280px,26vw,460px)),1fr))]">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/simulator/${c.id}`}
              className="group glass-card relative overflow-hidden rounded-[clamp(1.1rem,1.6vw,2rem)] p-[clamp(1.1rem,1.5vw,1.75rem)] transition duration-300 hover:-translate-y-1 hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70"
            >
              <span className="aurora-fill pointer-events-none absolute inset-x-0 -top-px h-px opacity-60" />
              <div className="flex items-start gap-[clamp(0.9rem,1.4vw,1.5rem)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.portraitUrl}
                  alt={c.demographics.name}
                  className="aspect-[4/5] w-[clamp(4.5rem,7vw,8rem)] shrink-0 rounded-[clamp(0.7rem,1vw,1.2rem)] object-cover ring-1 ring-white/15"
                />
                <div className="flex-1">
                  <div className="text-[clamp(0.62rem,0.8vw,0.9rem)] font-semibold uppercase tracking-[0.18em] text-teal-300/90">
                    {c.specialty}
                    {c.difficulty ? ` · ${c.difficulty}` : ""}
                  </div>
                  <div className="mt-1 text-[clamp(1.1rem,1.5vw,1.9rem)] font-semibold leading-tight">
                    {c.demographics.name}
                  </div>
                  <div className="text-[clamp(0.85rem,1vw,1.2rem)] text-white/55">
                    {c.demographics.age} · {c.demographics.sex} · {c.title}
                  </div>
                  <div className="mt-[clamp(0.75rem,1.4vh,1.5rem)] inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[clamp(0.8rem,0.95vw,1.1rem)] font-medium text-white transition group-hover:bg-white/20">
                    Start encounter
                    <ArrowRight className="h-[1em] w-[1em] transition group-hover:translate-x-0.5" />
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
