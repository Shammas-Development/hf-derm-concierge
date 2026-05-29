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
  { patient, mode, caption = "", thinking = false, listening = false, onSpeakStart, onSpeakEnd },
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
  onStartRef.current = onSpeakStart;
  onEndRef.current = onSpeakEnd;

  const sessionRef = useRef<LiveAvatarSession | null>(null);
  const startedRef = useRef(false);
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSpeakStart = useCallback(() => {
    setSpeaking(true);
    onStartRef.current?.();
  }, []);
  const markSpeakEnd = useCallback(() => {
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    setSpeaking(false);
    onEndRef.current?.();
  }, []);

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
        setNotice(e.error ?? "Live avatar unavailable.");
        startedRef.current = false;
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
      });
      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => markSpeakStart());
      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => markSpeakEnd());
      await session.start();
    } catch (err) {
      setNotice(`Live avatar failed: ${(err as Error).message}`);
      startedRef.current = false;
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
        markSpeakStart();
        try {
          sessionRef.current.repeat(clean);
        } catch {
          markSpeakEnd();
          return;
        }
        // Fallback in case the AVATAR_SPEAK_ENDED event never arrives.
        if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
        const words = clean.split(/\s+/).length;
        speakTimerRef.current = setTimeout(
          markSpeakEnd,
          Math.min(60000, 4000 + words * 450),
        );
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

  useImperativeHandle(
    ref,
    () => ({ speak: speakImpl, stop: stopImpl, prime: primeImpl }),
    [speakImpl, stopImpl, primeImpl],
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
