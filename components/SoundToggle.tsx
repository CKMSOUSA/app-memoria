"use client";

import { useCallback, useEffect, useState } from "react";

const SOUND_STORAGE_KEY = "app_memoria_sons_v1";

type SoundTone = "success" | "error" | "tap";

function canUseAudio() {
  return typeof window !== "undefined" && typeof window.AudioContext !== "undefined";
}

function playTone(kind: SoundTone) {
  if (!canUseAudio()) return;

  const AudioContextClass = window.AudioContext;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = "sine";
  const startFrequency = kind === "success" ? 660 : kind === "tap" ? 520 : 220;
  const endFrequency = kind === "success" ? 880 : kind === "tap" ? 620 : 150;
  const duration = kind === "tap" ? 0.09 : 0.24;

  oscillator.frequency.setValueAtTime(startFrequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + Math.max(0.06, duration - 0.04));

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);

  window.setTimeout(() => {
    void context.close();
  }, (duration + 0.12) * 1000);
}

export function useSoundFeedback() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setEnabled(window.localStorage.getItem(SOUND_STORAGE_KEY) === "ativo");
  }, []);

  const toggleSound = useCallback(() => {
    setEnabled((current) => {
      const next = !current;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SOUND_STORAGE_KEY, next ? "ativo" : "inativo");
      }
      if (next) playTone("success");
      return next;
    });
  }, []);

  const playResultSound = useCallback(
    (completed: boolean) => {
      if (!enabled) return;
      playTone(completed ? "success" : "error");
    },
    [enabled],
  );

  const playAnswerSound = useCallback(() => {
    if (!enabled) return;
    playTone("tap");
  }, [enabled]);

  return { soundEnabled: enabled, toggleSound, playResultSound, playAnswerSound };
}

export function SoundToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button className={`btn sound-toggle ${enabled ? "sound-toggle-active" : ""}`} type="button" onClick={onToggle}>
      {enabled ? "Som ligado" : "Som desligado"}
    </button>
  );
}
