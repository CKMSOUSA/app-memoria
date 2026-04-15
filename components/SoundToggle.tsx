"use client";

import { useCallback, useEffect, useState } from "react";

const SOUND_STORAGE_KEY = "app_memoria_sons_v1";

type SoundTone = "success" | "error";

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
  oscillator.frequency.setValueAtTime(kind === "success" ? 660 : 220, now);
  oscillator.frequency.exponentialRampToValueAtTime(kind === "success" ? 880 : 150, now + 0.18);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.24);

  window.setTimeout(() => {
    void context.close();
  }, 320);
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

  return { soundEnabled: enabled, toggleSound, playResultSound };
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
