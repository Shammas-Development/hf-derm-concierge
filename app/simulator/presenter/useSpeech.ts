"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeakOptions {
  voiceHint?: string;
  onWord?: (charIndex: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

// Thin wrapper around the Web Speech API (speechSynthesis). Used by the static
// presenter to give the patient a voice today; the live HeyGen avatar brings
// its own bundled voice and bypasses this.
export function useSpeech() {
  const [supported, setSupported] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const pickVoice = useCallback((): SpeechSynthesisVoice | undefined => {
    const voices = voicesRef.current;
    if (!voices.length) return undefined;
    // Prefer a natural-sounding English voice; fall back to the first English one.
    const preferred = voices.find(
      (v) =>
        /en[-_]US/i.test(v.lang) &&
        /(natural|google|samantha|daniel|aria|jenny)/i.test(v.name),
    );
    return preferred ?? voices.find((v) => /^en/i.test(v.lang)) ?? voices[0];
  }, []);

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        // No TTS available — still drive the caption lifecycle.
        opts.onStart?.();
        opts.onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = 1;
      u.pitch = 1;
      u.onstart = () => opts.onStart?.();
      u.onend = () => opts.onEnd?.();
      u.onerror = () => opts.onEnd?.();
      u.onboundary = (e) => {
        if (e.name === "word" || e.charIndex != null) opts.onWord?.(e.charIndex);
      };
      window.speechSynthesis.speak(u);
    },
    [pickVoice],
  );

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Must be called from inside a user gesture (e.g. a tap). Browsers block
  // speech until the user interacts; speaking a near-silent utterance here
  // unlocks the engine so later (async) replies can be spoken aloud.
  const prime = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      // ignore — speech simply stays locked
    }
  }, []);

  return { supported, speak, cancel, prime };
}
