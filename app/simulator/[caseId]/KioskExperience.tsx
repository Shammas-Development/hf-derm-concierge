"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  FileText,
  HelpCircle,
  Mic,
  Play,
  Volume2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isUnlocked } from "@/lib/simulator/stages";
import type { PatientCase, SimChatMessage, Stage } from "@/lib/simulator/types";
import { PatientPresenter } from "../presenter/PatientPresenter";
import { resolveAvatarMode } from "../presenter/types";
import type { PresenterHandle } from "../presenter/types";
import { StageRail } from "./components/StageRail";
import { ResultsPanel } from "./components/ResultsPanel";
import { ProviderInput } from "./components/ProviderInput";
import { NextStepButton } from "./components/NextStepButton";
import { Aurora } from "../components/Aurora";

// Plain-language guidance shown on the start screen and the "?" help dialog.
const HOW_IT_WORKS: { icon: typeof Mic; title: string; body: string }[] = [
  {
    icon: Mic,
    title: "Ask the patient anything",
    body: "Tap the microphone and talk, or type your question. The patient answers out loud and on screen.",
  },
  {
    icon: FileText,
    title: "Request results",
    body: "Ask about symptoms and history, and open the Chart for exam findings, labs, and biopsy results as the visit progresses.",
  },
  {
    icon: ArrowRight,
    title: "Move to the next step",
    body: "Use the “Next step” button (bottom-right) to go from History → Exam → Labs/Biopsy → Diagnosis → Treatment.",
  },
];

// Example openers so a first-time user immediately knows what to do.
const STARTER_QUESTIONS = [
  "What brings you in today?",
  "How long has this been going on?",
  "Has it changed recently?",
];

export function KioskExperience({ patient }: { patient: PatientCase }) {
  const mode = resolveAvatarMode();
  const [stage, setStage] = useState<Stage>("history");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [caption, setCaption] = useState("");
  const [hasAsked, setHasAsked] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  // In live-avatar mode, hold input until the stream is connected so a question
  // asked during "Connecting…" isn't lost (repeat() needs a ready session).
  const [avatarReady, setAvatarReady] = useState(mode !== "liveavatar");

  const presenterRef = useRef<PresenterHandle>(null);
  // Conversation context lives in a ref so async callbacks (mic submit) always
  // append to the latest history instead of a stale snapshot.
  const messagesRef = useRef<SimChatMessage[]>([]);
  const stageRef = useRef<Stage>(stage);
  stageRef.current = stage;
  const busyRef = useRef(false);
  busyRef.current = thinking || speaking;

  const streamReply = useCallback(
    async (history: SimChatMessage[]) => {
      setThinking(true);
      setCaption("");
      let assembled = "";
      try {
        const res = await fetch("/api/simulator/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: patient.id,
            stage: stageRef.current,
            messages: history,
          }),
        });
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ error: "Request failed." }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const chunk = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            if (!chunk.startsWith("data:")) continue;
            const json = chunk.slice(5).trim();
            try {
              const evt = JSON.parse(json) as
                | { type: "delta"; text: string }
                | { type: "error"; message: string }
                | { type: string };
              if (evt.type === "delta") {
                assembled += (evt as { text: string }).text;
                setCaption(assembled); // stream the words onto the screen live
              } else if (evt.type === "error")
                throw new Error((evt as { message: string }).message);
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      } catch (err) {
        setThinking(false);
        toast.error((err as Error).message || "The patient could not respond.");
        return;
      }

      const reply = assembled.trim();
      setThinking(false);
      if (reply) {
        messagesRef.current = [...messagesRef.current, { role: "assistant", text: reply }];
        setCaption(reply);
        presenterRef.current?.speak(reply); // voice only — caption already shown
      }
    },
    [patient.id],
  );

  // Started by a tap so the browser allows audio and the greeting can be spoken.
  const begin = useCallback(() => {
    setStarted(true);
    presenterRef.current?.prime();
    if (mode === "liveavatar") {
      // The live avatar speaks its own opening line once connected, so skip our
      // opener — otherwise the caption text appears before the avatar loads.
      messagesRef.current = [];
      return;
    }
    const opener: SimChatMessage = {
      role: "user",
      text: "[The care team has just entered the room and greeted you. Respond with a brief, natural one-sentence greeting.]",
    };
    messagesRef.current = [opener];
    void streamReply([opener]);
  }, [streamReply, mode]);

  const askQuestion = useCallback(
    (text: string) => {
      if (busyRef.current) return;
      setHasAsked(true);
      presenterRef.current?.stop();
      const userMsg: SimChatMessage = { role: "user", text };
      const history = [...messagesRef.current, userMsg];
      messagesRef.current = history;
      void streamReply(history);
    },
    [streamReply],
  );

  const advanceTo = useCallback((next: Stage) => {
    setStage(next);
    // Surface newly unlocked clinical data automatically.
    if (isUnlocked("exam", next)) setPanelOpen(true);
  }, []);

  const inputBusy = thinking || speaking || !avatarReady;

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col text-white">
      <Aurora />

      {/* Top bar */}
      <header className="glass-panel z-20 flex items-center justify-between gap-[clamp(0.5rem,1.5vw,2rem)] border-x-0 border-t-0 px-[clamp(0.75rem,2.5vw,2.5rem)] py-[clamp(0.6rem,1.2vh,1.25rem)]">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[clamp(0.8rem,1vw,1.1rem)] text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70"
        >
          <ChevronLeft className="h-[1.1em] w-[1.1em]" />
          <span className="hidden sm:inline">Cases</span>
        </Link>

        <StageRail current={stage} />

        <div className="flex shrink-0 items-center gap-[clamp(0.25rem,0.6vw,0.75rem)]">
          <button
            onClick={() => setHelpOpen(true)}
            className="flex items-center gap-2 rounded-full px-[clamp(0.6rem,1vw,1rem)] py-[clamp(0.4rem,0.8vh,0.7rem)] text-[clamp(0.78rem,0.95vw,1.05rem)] text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70"
          >
            <HelpCircle className="h-[1.1em] w-[1.1em]" />
            <span className="hidden md:inline">How it works</span>
          </button>
          <button
            onClick={() => setPanelOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-[clamp(0.7rem,1.1vw,1.2rem)] py-[clamp(0.4rem,0.8vh,0.7rem)] text-[clamp(0.78rem,0.95vw,1.05rem)] font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70"
          >
            <FileText className="h-[1.1em] w-[1.1em]" />
            <span className="hidden sm:inline">Chart</span>
          </button>
        </div>
      </header>

      {/* Patient stage */}
      <main className="relative flex flex-1 flex-col">
        <PatientPresenter
          ref={presenterRef}
          patient={patient}
          mode={mode}
          caption={caption}
          thinking={thinking}
          listening={listening}
          onSpeakStart={() => setSpeaking(true)}
          onSpeakEnd={() => setSpeaking(false)}
          onReady={() => setAvatarReady(true)}
        />

        {!started && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-[clamp(1.25rem,3vh,2.5rem)] overflow-y-auto bg-[#070a16]/85 px-[clamp(1rem,4vw,3rem)] py-[clamp(1.5rem,4vh,4rem)] text-white backdrop-blur-md">
            <div className="text-center">
              <div className="text-[clamp(0.65rem,0.9vw,1rem)] font-medium uppercase tracking-[0.22em] text-teal-300/90">
                You&apos;re about to interview
              </div>
              <div className="mt-1 font-heading text-[clamp(2rem,4vw,4.5rem)] font-semibold leading-[1.05]">
                {patient.demographics.name}
              </div>
              <div className="text-[clamp(0.9rem,1.1vw,1.4rem)] text-white/60">
                {patient.demographics.age} · {patient.demographics.sex} ·{" "}
                {patient.title}
              </div>
            </div>

            <div className="grid w-full max-w-[min(90vw,720px)] gap-[clamp(0.6rem,1vh,1rem)] sm:grid-cols-3">
              {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
                <div
                  key={i}
                  className="glass-card flex flex-col gap-2 rounded-[clamp(1rem,1.4vw,1.5rem)] p-[clamp(0.9rem,1.3vw,1.4rem)]"
                >
                  <span className="aurora-fill flex aspect-square w-[clamp(2.1rem,2.6vw,3rem)] items-center justify-center rounded-[clamp(0.7rem,1vw,1.1rem)] text-white">
                    <Icon className="h-[55%] w-[55%]" />
                  </span>
                  <div className="text-[clamp(0.85rem,1vw,1.15rem)] font-semibold">
                    {title}
                  </div>
                  <div className="text-[clamp(0.75rem,0.9vw,1.05rem)] leading-relaxed text-white/60">
                    {body}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={begin}
              className="aurora-fill aurora-ring group flex items-center gap-3 rounded-full px-[clamp(1.5rem,2.5vw,3rem)] py-[clamp(0.8rem,1.4vh,1.4rem)] text-[clamp(1rem,1.4vw,1.6rem)] font-semibold text-white transition hover:brightness-110 active:translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              <Play className="h-[1.1em] w-[1.1em] fill-current" />
              Begin encounter
            </button>
            <p className="flex items-center gap-1.5 text-[clamp(0.7rem,0.85vw,0.95rem)] text-white/50">
              <Volume2 className="h-[1.1em] w-[1.1em]" />
              Tapping start enables the patient&apos;s voice
            </p>
          </div>
        )}
      </main>

      {/* Bottom composer + next-step */}
      <div className="glass-panel z-20 border-x-0 border-b-0">
        <div className="mx-auto w-full max-w-[min(94vw,1500px)] px-[clamp(0.75rem,2.5vw,2.5rem)] py-[clamp(0.7rem,1.5vh,1.5rem)]">
          {started && !hasAsked && !inputBusy && (
            <div className="mb-[clamp(0.6rem,1vh,1rem)]">
              <div className="mb-1.5 text-[clamp(0.7rem,0.85vw,0.95rem)] text-white/50">
                Try asking — tap one, or use the mic / type your own:
              </div>
              <div className="flex flex-wrap gap-[clamp(0.4rem,0.6vw,0.75rem)]">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => askQuestion(q)}
                    className="rounded-full border border-white/15 bg-white/10 px-[clamp(0.75rem,1vw,1.25rem)] py-[clamp(0.4rem,0.7vh,0.65rem)] text-[clamp(0.8rem,0.95vw,1.1rem)] text-white/85 transition hover:border-teal-300/50 hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-end gap-[clamp(0.6rem,1.2vw,1.5rem)]">
            <div className="min-w-[min(100%,260px)] flex-1">
              <ProviderInput
                disabled={!started || inputBusy}
                onSubmit={askQuestion}
                onListeningChange={setListening}
              />
            </div>
            <NextStepButton current={stage} onAdvance={advanceTo} />
          </div>
        </div>
      </div>

      <ResultsPanel
        patient={patient}
        current={stage}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How this works</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="aurora-fill flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {title}
                  </div>
                  <div className="text-sm text-muted-foreground">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
