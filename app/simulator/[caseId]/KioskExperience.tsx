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
    <div className="relative flex flex-1 flex-col bg-[#F5F7FA]">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 border-b border-border bg-white px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Cases</span>
        </Link>

        <StageRail current={stage} />

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setHelpOpen(true)}
            className="h-9 gap-2 px-3"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">How it works</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setPanelOpen(true)}
            className="h-9 gap-2 px-3"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Chart</span>
          </Button>
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
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 overflow-y-auto bg-white/85 px-4 py-8 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-sm font-medium uppercase tracking-wide text-[#003DA5]">
                You're about to interview
              </div>
              <div className="mt-1 font-heading text-3xl font-semibold text-foreground">
                {patient.demographics.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {patient.demographics.age} · {patient.demographics.sex} ·{" "}
                {patient.title}
              </div>
            </div>

            <div className="w-full max-w-lg space-y-3">
              {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FB] text-[#003DA5]">
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

            <button
              onClick={begin}
              className="flex items-center gap-3 rounded-2xl bg-[#003DA5] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[#002C75] active:translate-y-px"
            >
              <Play className="h-5 w-5 fill-current" />
              Begin encounter
            </button>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" />
              Tapping start enables the patient&apos;s voice
            </p>
          </div>
        )}
      </main>

      {/* Bottom composer + next-step */}
      <div className="border-t border-border bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6">
          {started && !hasAsked && !inputBusy && (
            <div className="mb-3">
              <div className="mb-1.5 text-xs text-muted-foreground">
                Try asking — tap one, or use the mic / type your own:
              </div>
              <div className="flex flex-wrap gap-2">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => askQuestion(q)}
                    className="rounded-full border border-border bg-white px-3 py-1.5 text-sm text-foreground/80 transition hover:border-[#003DA5]/40 hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[260px] flex-1">
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
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FB] text-[#003DA5]">
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
