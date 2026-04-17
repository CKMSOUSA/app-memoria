"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type AppSettings = {
  highContrast: boolean;
  largeText: boolean;
  narrationEnabled: boolean;
  simplifiedCommands: boolean;
  therapeuticMode: boolean;
  reducedStimuli: boolean;
  screenReaderHints: boolean;
};

const APP_SETTINGS_KEY = "app_memoria_settings_v1";
const SETTINGS_EVENT = "app-memoria-settings-updated";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  highContrast: false,
  largeText: false,
  narrationEnabled: false,
  simplifiedCommands: false,
  therapeuticMode: false,
  reducedStimuli: false,
  screenReaderHints: true,
};

export function loadAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;

  const raw = window.localStorage.getItem(APP_SETTINGS_KEY);
  if (!raw) return DEFAULT_APP_SETTINGS;

  try {
    return {
      ...DEFAULT_APP_SETTINGS,
      ...(JSON.parse(raw) as Partial<AppSettings>),
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event(SETTINGS_EVENT));
}

export function getSessionAdjustments(settings: AppSettings) {
  const therapeuticMode = settings.therapeuticMode;
  return {
    reducedStimuli: settings.reducedStimuli || therapeuticMode,
    therapeuticMode,
    memoryItemDelta: therapeuticMode ? -1 : 0,
    attentionCellDelta: therapeuticMode ? -2 : 0,
    comparisonRoundDelta: therapeuticMode ? -1 : 0,
    spatialStepDelta: therapeuticMode ? -1 : 0,
    logicRoundDelta: therapeuticMode ? -1 : 0,
    exclusiveSequenceDelta: therapeuticMode ? -1 : 0,
    timeBonusSeconds: therapeuticMode ? 2 : 0,
    minimumDelta: therapeuticMode ? -1 : 0,
    revealBonusSeconds: therapeuticMode ? 1 : 0,
  };
}

export function applyAppSettingsToDocument(settings: AppSettings) {
  if (typeof document === "undefined") return;

  const body = document.body;
  body.classList.toggle("app-high-contrast", settings.highContrast);
  body.classList.toggle("app-large-text", settings.largeText);
  body.classList.toggle("app-reduced-stimuli", settings.reducedStimuli || settings.therapeuticMode);
  body.classList.toggle("app-screen-reader-hints", settings.screenReaderHints);
  body.classList.toggle("app-therapeutic-mode", settings.therapeuticMode);
}

export function useAppSettingsState() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  useEffect(() => {
    setSettings(loadAppSettings());

    const sync = () => setSettings(loadAppSettings());
    window.addEventListener("storage", sync);
    window.addEventListener(SETTINGS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SETTINGS_EVENT, sync);
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    const next = { ...loadAppSettings(), ...partial };
    saveAppSettings(next);
    setSettings(next);
  }, []);

  return { settings, updateSettings };
}

export function registerOfflineSupport() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
}

export function speakText(text: string, enabled: boolean) {
  if (!enabled || typeof window === "undefined" || typeof window.speechSynthesis === "undefined") return;
  if (!text.trim()) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") return;
  window.speechSynthesis.cancel();
}

export function useNarrationText(text: string) {
  const { settings } = useAppSettingsState();
  const stableText = useMemo(() => text, [text]);

  useEffect(() => {
    if (!settings.narrationEnabled) return;
    speakText(stableText, true);
    return () => cancelSpeech();
  }, [settings.narrationEnabled, stableText]);

  const narrateNow = useCallback(() => speakText(stableText, settings.narrationEnabled || true), [settings.narrationEnabled, stableText]);

  return {
    narrationEnabled: settings.narrationEnabled,
    simplifiedCommands: settings.simplifiedCommands,
    screenReaderHints: settings.screenReaderHints,
    narrateNow,
  };
}
