"use client";

import { useCallback, useEffect, useState } from "react";

const SOUND_STORAGE_KEY = "app_memoria_sons_v1";

type SoundTone = "success" | "error" | "tap" | "warning" | "precision" | "memory" | "timeout";
type ResultSoundDetail = "default" | "precision" | "memory" | "warning" | "timeout" | "logic" | "spatial" | "visual";
type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

let sharedAudioContext: AudioContext | null = null;

function canUseAudio() {
  if (typeof window === "undefined") return false;
  const audioWindow = window as AudioWindow;
  return typeof audioWindow.AudioContext !== "undefined" || typeof audioWindow.webkitAudioContext !== "undefined";
}

async function getAudioContext() {
  if (!canUseAudio()) return;

  const audioWindow = window as AudioWindow;
  const AudioContextClass = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioContextClass();
  }

  if (sharedAudioContext.state === "suspended") {
    await sharedAudioContext.resume();
  }

  return sharedAudioContext;
}

function playToneSequence(kinds: SoundTone[]) {
  void getAudioContext()
    .then((context) => {
      if (!context) return;
      let cursor = context.currentTime;

      kinds.forEach((kind) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = kind === "warning" || kind === "timeout" ? "triangle" : "sine";
        const startFrequency =
          kind === "success"
            ? 660
            : kind === "tap"
              ? 520
              : kind === "warning"
                ? 320
                : kind === "precision"
                  ? 720
                  : kind === "memory"
                    ? 420
                    : kind === "timeout"
                      ? 240
                      : 220;
        const endFrequency =
          kind === "success"
            ? 880
            : kind === "tap"
              ? 620
              : kind === "warning"
                ? 240
                : kind === "precision"
                  ? 980
                  : kind === "memory"
                    ? 300
                    : kind === "timeout"
                      ? 160
                      : 150;
        const duration =
          kind === "tap" ? 0.09 : kind === "precision" ? 0.18 : kind === "warning" ? 0.16 : kind === "timeout" ? 0.22 : 0.24;

        oscillator.frequency.setValueAtTime(startFrequency, cursor);
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, cursor + Math.max(0.06, duration - 0.04));

        gain.gain.setValueAtTime(0.0001, cursor);
        gain.gain.exponentialRampToValueAtTime(0.08, cursor + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, cursor + duration);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(cursor);
        oscillator.stop(cursor + duration + 0.02);

        window.setTimeout(() => {
          oscillator.disconnect();
          gain.disconnect();
        }, (cursor - context.currentTime + duration + 0.12) * 1000);

        cursor += duration + 0.05;
      });
    })
    .catch(() => undefined);
}

function playTone(kind: SoundTone) {
  playToneSequence([kind]);
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
    (completed: boolean, detail: ResultSoundDetail = "default") => {
      if (!enabled) return;
      if (completed) {
        if (detail === "precision") {
          playToneSequence(["precision", "success"]);
          return;
        }
        playTone("success");
        return;
      }

      if (detail === "timeout") {
        playToneSequence(["timeout", "error"]);
        return;
      }
      if (detail === "memory" || detail === "visual") {
        playToneSequence(["memory", "error"]);
        return;
      }
      if (detail === "warning") {
        playToneSequence(["warning", "error"]);
        return;
      }
      if (detail === "logic" || detail === "spatial") {
        playToneSequence(["warning", "memory"]);
        return;
      }

      playTone("error");
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
