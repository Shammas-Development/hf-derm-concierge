"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { LiveAvatarSession } from "@heygen/liveavatar-web-sdk";
import { PatientStage } from "./PatientStage";
import { useSpeech } from "./useSpeech";
import type { PatientPresenterProps, PresenterHandle } from "./types";

// Pluggable patient presenter.
//   - "static": photorealistic portrait + browser TTS (works today).
//   - "liveavatar": HeyGen LiveAvatar real-time stream. Our AI still generates
//     each reply (with stage-gating); the avatar only renders the face + voice
//     via repeat(). The session starts on the first user tap (prime) so audio
//     is allowed to autoplay.
//   - "heygen": legacy stub, falls back to voice.
export const PatientPresenter = forwardRef<
  PresenterHandle,
  PatientPresenterProps
>(function PatientPresenter(
  {
    patient,
    mode,
    caption = "",
    thinking = false,
    listening = false,
    onSpeakStart,
    onSpeakEnd,
    onReady,
    onCaption,
  },
  ref,
) {
  const { speak: ttsSpeak, cancel: ttsCancel, prime: ttsPrime } = useSpeech();
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();
  const [liveConnected, setLiveConnected] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Keep latest speak callbacks in refs so the SDK event listeners (registered
  // once) never call a stale closure.
  const onStartRef = useRef(onSpeakStart);
  const onEndRef = useRef(onSpeakEnd);
  const onReadyRef = useRef(onReady);
  const onCaptionRef = useRef(onCaption);
  onStartRef.current = onSpeakStart;
  onEndRef.current = onSpeakEnd;
  onReadyRef.current = onReady;
  onCaptionRef.current = onCaption;

  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const startedRef = useRef(false);
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Live-caption accumulation: chunks build the bubble as the avatar speaks;
  // pendingFull is the exact text we asked it to repeat (final-source-of-truth).
  const captionAccumRef = useRef("");
  const pendingFullRef = useRef("");

  const markSpeakEnd = useCallback(() => {
    if (speakTimerRef.current) {
      clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    setSpeaking(false);
    onEndRef.current?.();
  }, []);
  const markSpeakStart = useCallback(() => {
    setSpeaking(true);
    onStartRef.current?.();
    // Backstop: if the "speak ended" event never fires (greeting or reply),
    // release after a generous window so input can't lock up forever.
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    speakTimerRef.current = setTimeout(markSpeakEnd, 45000);
  }, [markSpeakEnd]);

  // Start the live session inside the user gesture (prime).
  const startLive = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const res = await fetch("/api/simulator/liveavatar-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: patient.id }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        setNotice(e.error ?? "Live avatar unavailable — using voice.");
        startedRef.current = false;
        onReadyRef.current?.(); // unlock input → falls back to browser TTS
        return;
      }
      const { sessionToken } = (await res.json()) as { sessionToken: string };
      const { LiveAvatarSession, SessionEvent, AgentEventsEnum } = await import(
        "@heygen/liveavatar-web-sdk"
      );
      const session = new LiveAvatarSession(sessionToken, { voiceChat: false });
      sessionRef.current = session;
      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        if (videoRef.current) session.attach(videoRef.current);
        setLiveConnected(true);
        onReadyRef.current?.();
      });
      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
        captionAccumRef.current = "";
        onCaptionRef.current?.(""); // clear previous line as a new one begins
        markSpeakStart();
      });
      // Word-by-word transcript, emitted in sync with the avatar's voice.
      session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION_CHUNK, (e) => {
        captionAccumRef.current += (e as { text?: string }).text ?? "";
        onCaptionRef.current?.(captionAccumRef.current);
      });
      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
        // Ensure the final line is complete even if chunks were lossy.
        const full = pendingFullRef.current || captionAccumRef.current;
        pendingFullRef.current = "";
        if (full) onCaptionRef.current?.(full);
        markSpeakEnd();
      });
      await session.start();
    } catch (err) {
      setNotice(`Live avatar failed — using voice: ${(err as Error).message}`);
      startedRef.current = false;
      onReadyRef.current?.(); // unlock input → falls back to browser TTS
    }
  }, [patient.id, markSpeakStart, markSpeakEnd]);

  // Stop the session on unmount.
  useEffect(() => {
    return () => {
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
      sessionRef.current?.stop().catch(() => {});
      sessionRef.current = null;
    };
  }, []);

  const speakImpl = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;

      if (mode === "liveavatar" && sessionRef.current) {
        pendingFullRef.current = clean; // final caption source-of-truth
        markSpeakStart(); // also arms the backstop timer
        try {
          sessionRef.current.repeat(clean);
        } catch {
          markSpeakEnd();
        }
        return;
      }

      // static / heygen → browser TTS
      setSpeaking(true);
      onStartRef.current?.();
      ttsSpeak(clean, {
        voiceHint: patient.voiceHint,
        onEnd: () => {
          setSpeaking(false);
          onEndRef.current?.();
        },
      });
    },
    [mode, ttsSpeak, patient.voiceHint, markSpeakStart, markSpeakEnd],
  );

  const stopImpl = useCallback(() => {
    if (mode === "liveavatar" && sessionRef.current) {
      try {
        sessionRef.current.interrupt();
      } catch {
        // ignore
      }
      markSpeakEnd();
      return;
    }
    ttsCancel();
    setSpeaking(false);
  }, [mode, ttsCancel, markSpeakEnd]);

  const primeImpl = useCallback(() => {
    if (mode === "liveavatar") {
      void startLive();
      return;
    }
    ttsPrime();
  }, [mode, startLive, ttsPrime]);

  // Tear down the live session to stop billing. startedRef is reset so a later
  // prime() can spin up a fresh session (used by the idle auto-disconnect).
  const pauseImpl = useCallback(() => {
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    setSpeaking(false);
    setLiveConnected(false);
    startedRef.current = false;
    const s = sessionRef.current;
    sessionRef.current = null;
    s?.stop().catch(() => {});
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      speak: speakImpl,
      stop: stopImpl,
      prime: primeImpl,
      pause: pauseImpl,
    }),
    [speakImpl, stopImpl, primeImpl, pauseImpl],
  );

  return (
    <PatientStage
      patient={patient}
      mode={mode}
      caption={caption}
      speaking={speaking}
      thinking={thinking}
      listening={listening}
      videoRef={videoRef}
      showVideo={liveConnected}
      notice={notice}
    />
  );
});
