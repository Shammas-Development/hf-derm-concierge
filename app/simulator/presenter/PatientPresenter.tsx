"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { PatientStage } from "./PatientStage";
import { useSpeech } from "./useSpeech";
import type { PatientPresenterProps, PresenterHandle } from "./types";

// Pluggable patient presenter.
//   - "static": photorealistic portrait + browser TTS (works today).
//   - "heygen": live lip-synced avatar with a bundled voice. Until a HeyGen
//     API key + avatar id are provisioned, this transparently falls back to the
//     static behavior so the kiosk is always usable.
export const PatientPresenter = forwardRef<
  PresenterHandle,
  PatientPresenterProps
>(function PatientPresenter(
  { patient, mode, thinking = false, listening = false, onSpeakStart, onSpeakEnd },
  ref,
) {
  const { speak: ttsSpeak, cancel: ttsCancel, prime: ttsPrime } = useSpeech();
  const [caption, setCaption] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [liveConnected] = useState(false); // flips true once a HeyGen stream attaches

  // Probe HeyGen availability when in live mode. The real streaming SDK wiring
  // goes where marked below once HEYGEN_API_KEY + heygenAvatarId are set.
  useEffect(() => {
    if (mode !== "heygen") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/simulator/heygen-token", { method: "POST" });
        if (cancelled) return;
        if (!res.ok) {
          setNotice("Live avatar not connected — using voice for now.");
          return;
        }
        // TODO(heygen): const { token } = await res.json();
        //   1. new StreamingAvatar({ token })
        //   2. createStartAvatar({ avatarName: patient.heygenAvatarId, ... })
        //   3. attach the MediaStream to videoRef.current and setLiveConnected(true)
        //   4. in speakImpl(), call avatar.speak({ text }) instead of TTS
        setNotice("Live avatar token ready — SDK wiring pending.");
      } catch {
        if (!cancelled) setNotice("Live avatar unavailable — using voice for now.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const speakImpl = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      setCaption(clean);
      setSpeaking(true);
      onSpeakStart?.();

      // When the live avatar is connected, speech + lip-sync come from HeyGen.
      // Until then (and in static mode) we use browser TTS.
      ttsSpeak(clean, {
        voiceHint: patient.voiceHint,
        onEnd: () => {
          setSpeaking(false);
          onSpeakEnd?.();
        },
      });
    },
    [onSpeakStart, onSpeakEnd, ttsSpeak, patient.voiceHint],
  );

  const stopImpl = useCallback(() => {
    ttsCancel();
    setSpeaking(false);
  }, [ttsCancel]);

  useImperativeHandle(
    ref,
    () => ({ speak: speakImpl, stop: stopImpl, prime: ttsPrime }),
    [speakImpl, stopImpl, ttsPrime],
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
