import Link from "next/link";
import { randomUUID } from "crypto";
import { HFHeader } from "@/components/branding/HFHeader";
import { HFFooter } from "@/components/branding/HFFooter";
import { buttonVariants } from "@/components/ui/button";
import {
  Sparkles,
  Smartphone,
  QrCode,
  LayoutDashboard,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const sampleSessionId = randomUUID();

  return (
    <div className="flex flex-col flex-1">
      <HFHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-[#F5F7FA] to-[#EEF2FB]" />
          <div className="absolute inset-0 -z-10 opacity-60">
            <div className="absolute top-[-10%] left-[-5%] h-[40rem] w-[40rem] rounded-full bg-[#003DA5]/8 blur-3xl drift-slower" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[36rem] w-[36rem] rounded-full bg-[#5B8DEF]/10 blur-3xl drift-slow" />
          </div>

          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#003DA5]/15 bg-white/70 px-3 py-1 text-xs font-medium text-[#003DA5] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              AI Dermatology Concierge · Demo
            </div>
            <h1 className="mt-6 font-heading text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#002C75] max-w-3xl leading-[1.05]">
              AI-powered skin health insights, designed for the way you actually
              live.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-foreground/70 leading-relaxed">
              An educational AI concierge that helps patients understand common
              dermatology concerns and routes them to the right specialist —
              built for events, kiosks, and waiting rooms.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/session/${sampleSessionId}`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 px-5 text-base bg-[#003DA5] text-white hover:bg-[#002C75]",
                )}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Start a sample session
              </Link>
              <Link
                href="/kiosk"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-12 px-5 text-base border-[#003DA5]/25 text-[#002C75]",
                )}
              >
                <QrCode className="mr-2 h-4 w-4" />
                View the kiosk
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "lg", variant: "ghost" }),
                  "h-12 px-5 text-base text-[#002C75]",
                )}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Operator dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-20">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: QrCode,
                title: "Kiosk-first",
                body: "A branded scanner at the booth opens a private consultation on the patient's phone — no app install.",
              },
              {
                icon: Sparkles,
                title: "Education, not diagnosis",
                body: "Helps patients understand concerns and triage urgency. Always routes care to a board-certified dermatologist.",
              },
              {
                icon: Stethoscope,
                title: "Booking-ready",
                body: "Captures structured leads with urgency tier — your care coordinators follow up the same day.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-white p-5"
              >
                <div className="h-10 w-10 rounded-xl bg-[#EEF2FB] text-[#003DA5] flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-heading text-lg font-semibold text-[#002C75]">
                  {title}
                </div>
                <p className="mt-1.5 text-sm text-foreground/70 leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <HFFooter />
    </div>
  );
}
