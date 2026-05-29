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
    <div className="flex items-end gap-2">
      {supported && (
        <button
          type="button"
          onClick={toggleMic}
          disabled={disabled}
          aria-label={listening ? "Stop listening" : "Ask by voice"}
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white transition disabled:opacity-40",
            listening
              ? "bg-red-500 hover:bg-red-600"
              : "bg-[#003DA5] hover:bg-[#002C75]",
          )}
        >
          {listening ? (
            <Square className="h-5 w-5 fill-current" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </button>
      )}

      <div className="flex flex-1 items-end gap-2 rounded-2xl border border-border bg-white px-3 py-2 focus-within:border-[#003DA5]/50 focus-within:ring-2 focus-within:ring-[#003DA5]/15">
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
          placeholder={
            listening ? "Listening…" : "Ask the patient a question…"
          }
          className="flex-1 resize-none bg-transparent py-2 text-[1.05rem] leading-snug text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
        />
        <Button
          type="button"
          size="icon"
          onClick={submitTyped}
          disabled={disabled || !text.trim()}
          className="h-10 w-10 shrink-0 rounded-xl bg-[#003DA5] hover:bg-[#002C75]"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
