"use client";

import { useEffect, useState } from "react";
import { Mic, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "../../presenter/useSpeechRecognition";

interface Props {
  disabled?: boolean;
  onSubmit: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
}

export function ProviderInput({ disabled, onSubmit, onListeningChange }: Props) {
  const [text, setText] = useState("");

  const { supported, listening, start, stop } = useSpeechRecognition({
    onInterim: (t) => setText(t),
    onFinal: (t) => {
      const clean = t.trim();
      setText("");
      if (clean) onSubmit(clean);
    },
  });

  useEffect(() => {
    onListeningChange?.(listening);
  }, [listening, onListeningChange]);

  // If the patient starts thinking/speaking, force the mic off so it never
  // transcribes the patient's own voice back into the box.
  useEffect(() => {
    if (disabled && listening) stop();
  }, [disabled, listening, stop]);

  const submitTyped = () => {
    const clean = text.trim();
    if (!clean || disabled) return;
    setText("");
    onSubmit(clean);
  };

  const toggleMic = () => {
    if (disabled) return;
    if (listening) stop();
    else start();
  };

  return (
    <div className="flex items-end gap-[clamp(0.4rem,0.8vw,0.75rem)]">
      {supported && (
        <button
          type="button"
          onClick={toggleMic}
          disabled={disabled}
          aria-label={listening ? "Stop listening" : "Ask by voice"}
          className={cn(
            "flex aspect-square w-[clamp(3rem,4vw,4.25rem)] shrink-0 items-center justify-center rounded-[clamp(0.9rem,1.3vw,1.4rem)] text-white transition disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30",
            listening
              ? "bg-red-500 shadow-lg shadow-red-500/40 hover:bg-red-600"
              : "aurora-fill aurora-ring hover:brightness-110",
          )}
        >
          {listening ? (
            <Square className="h-[40%] w-[40%] fill-current" />
          ) : (
            <Mic className="h-[48%] w-[48%]" />
          )}
        </button>
      )}

      <div className="flex flex-1 items-end gap-2 rounded-[clamp(0.9rem,1.3vw,1.4rem)] border border-white/15 bg-white/10 px-[clamp(0.6rem,1vw,1rem)] py-[clamp(0.3rem,0.5vh,0.5rem)] backdrop-blur transition focus-within:border-teal-300/50 focus-within:ring-2 focus-within:ring-teal-300/40">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitTyped();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder={listening ? "Listening…" : "Ask the patient a question…"}
          className="flex-1 resize-none bg-transparent py-[clamp(0.5rem,0.9vh,0.85rem)] text-[clamp(1rem,1.2vw,1.4rem)] leading-snug text-white placeholder:text-white/40 focus:outline-none disabled:opacity-60"
        />
        <Button
          type="button"
          size="icon"
          onClick={submitTyped}
          disabled={disabled || !text.trim()}
          className="aurora-fill h-[clamp(2.25rem,3vw,3rem)] w-[clamp(2.25rem,3vw,3rem)] shrink-0 rounded-[clamp(0.7rem,1vw,1.1rem)] hover:brightness-110 disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-[45%] w-[45%]" />
        </Button>
      </div>
    </div>
  );
}
