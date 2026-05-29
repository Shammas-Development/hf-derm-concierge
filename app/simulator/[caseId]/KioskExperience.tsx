"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, FileText, Play, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isUnlocked } from "@/lib/simulator/stages";
import type { PatientCase, SimChatMessage, Stage } from "@/lib/simulator/types";
import { PatientPresenter } from "../presenter/PatientPresenter";
import { resolveAvatarMode } from "../presenter/types";
import type { PresenterHandle } from "../presenter/types";
import { StageRail } from "./components/StageRail";
import { ResultsPanel } from "./components/ResultsPanel";
import { ProviderInput } from "./components/ProviderInput";
import { NextStepButton } from "./components/NextStepButton";

export function KioskExperience({ patient }: { patient: PatientCase }) {
  const mode = resolveAvatarMode();
  const [stage, setStage] = useState<Stage>("history");
  const [messages, setMessages] = useState<SimChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [started, setStarted] = useState(false);

  const presenterRef = useRef<PresenterHandle>(null);
  const stageRef = useRef<Stage>(stage);
  stageRef.current = stage;

  const streamReply = useCallback(
    async (history: SimChatMessage[]) => {
      setThinking(true);
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
              if (evt.type === "delta") assembled += (evt as { text: string }).text;
              else if (evt.type === "error")
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
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        presenterRef.current?.speak(reply);
      }
    },
    [patient.id],
  );

  // Started by a tap so the browser allows audio and the greeting can be spoken.
  const begin = useCallback(() => {
    setStarted(true);
    presenterRef.current?.prime();
    const opener: SimChatMessage = {
      role: "user",
      text: "[The care team has just entered the room and greeted you. Respond with a brief, natural one-sentence greeting.]",
    };
    setMessages([opener]);
    void streamReply([opener]);
  }, [streamReply]);

  const askQuestion = useCallback(
    (text: string) => {
      if (thinking || speaking) return;
      presenterRef.current?.stop();
      const userMsg: SimChatMessage = { role: "user", text };
      const history = [...messages, userMsg];
      setMessages(history);
      void streamReply(history);
    },
    [messages, thinking, speaking, streamReply],
  );

  const advanceTo = useCallback((next: Stage) => {
    setStage(next);
    // Surface newly unlocked clinical data automatically.
    if (isUnlocked("exam", next)) setPanelOpen(true);
  }, []);

  const inputBusy = thinking || speaking;

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

        <Button
          variant="outline"
          onClick={() => setPanelOpen(true)}
          className="h-9 gap-2 px-3"
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Chart</span>
        </Button>
      </header>

      {/* Patient stage */}
      <main className="relative flex flex-1 flex-col">
        <PatientPresenter
          ref={presenterRef}
          patient={patient}
          mode={mode}
          thinking={thinking}
          listening={listening}
          onSpeakStart={() => setSpeaking(true)}
          onSpeakEnd={() => setSpeaking(false)}
        />

        {!started && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <div className="font-heading text-2xl font-semibold text-foreground">
                {patient.demographics.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {patient.demographics.age} · {patient.demographics.sex} ·{" "}
                {patient.title}
              </div>
            </div>
            <button
              onClick={begin}
              className="flex items-center gap-3 rounded-2xl bg-[#003DA5] px-7 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[#002C75] active:translate-y-px"
            >
              <Play className="h-5 w-5 fill-current" />
              Begin encounter
            </button>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Volume2 className="h-3.5 w-3.5" />
              Tap to start — this enables the patient&apos;s voice
            </p>
          </div>
        )}
      </main>

      {/* Bottom composer + next-step */}
      <div className="border-t border-border bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end gap-4 px-4 py-4 sm:px-6">
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

      <ResultsPanel
        patient={patient}
        current={stage}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}
