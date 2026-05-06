"use client";

import { useEffect, useMemo, useState } from "react";

type PauseReflectionButtonProps = {
  prompts: string[];
  variant?: "alarm" | "game";
  seconds?: number;
  buttonLabel?: string;
  title?: string;
  doneMessage?: string;
  historyLabel?: string;
  className?: string;
};

export function PauseReflectionButton({
  prompts,
  variant = "game",
  seconds = 40,
  buttonLabel = "Pare e Pense",
  title = "Pausa de reflexão",
  doneMessage = "Guarde a percepção que apareceu e siga com calma.",
  historyLabel = "Pausas recentes",
  className = "",
}: PauseReflectionButtonProps) {
  const promptList = useMemo(
    () => prompts.map((prompt) => prompt.trim()).filter(Boolean),
    [prompts],
  );
  const safePrompts = promptList.length > 0 ? promptList : ["O que merece sua atenção antes de continuar?"];
  const [promptIndex, setPromptIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const prompt = safePrompts[promptIndex] ?? safePrompts[0];
  const complete = open && secondsLeft === 0;

  useEffect(() => {
    if (!open || paused || secondsLeft === 0) return undefined;

    const timerId = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [open, paused, secondsLeft]);

  function startReflection() {
    const randomIndex = Math.floor(Math.random() * safePrompts.length);
    const nextIndex =
      safePrompts.length <= 1 ? promptIndex : randomIndex === promptIndex ? (randomIndex + 1) % safePrompts.length : randomIndex;
    const nextPrompt = safePrompts[nextIndex] ?? safePrompts[0];

    setPromptIndex(nextIndex);
    setHistory((current) => [nextPrompt, ...current.filter((item) => item !== nextPrompt)].slice(0, 3));
    setSecondsLeft(seconds);
    setPaused(false);
    setOpen(true);
  }

  return (
    <div className={`pause-reflection pause-reflection-${variant} ${className}`.trim()}>
      <button
        className={`pause-reflection-button pause-reflection-button-${variant}`}
        type="button"
        onClick={startReflection}
        aria-expanded={open}
      >
        {variant === "alarm" ? (
          <>
            <span className="pause-reflection-button-gloss" aria-hidden="true" />
            <span className="pause-reflection-button-label">{buttonLabel}</span>
          </>
        ) : (
          <>
            <span className="pause-reflection-button-dot" aria-hidden="true" />
            <span>{buttonLabel}</span>
          </>
        )}
      </button>
      {open ? (
        <article className="pause-reflection-card" aria-live="polite">
          <div>
            <p className="small-muted pause-reflection-label">{title}</p>
            <h3>{complete ? "Pausa concluída" : paused ? `${secondsLeft}s em pausa` : `${secondsLeft}s para pensar`}</h3>
            <p className="muted pause-reflection-question">{prompt}</p>
          </div>
          {!complete ? (
            <button className="btn btn-secondary pause-reflection-control" type="button" onClick={() => setPaused((current) => !current)}>
              {paused ? "Continuar" : "Pausar"}
            </button>
          ) : null}
          <div className="pause-reflection-meter" aria-label={`${secondsLeft} segundos restantes`}>
            <span style={{ width: `${((seconds - secondsLeft) / seconds) * 100}%` }} />
          </div>
          {complete ? <p className="pause-reflection-done">{doneMessage}</p> : null}
          {history.length > 1 ? (
            <div className="pause-reflection-history">
              <span className="small-muted">{historyLabel}</span>
              {history.slice(1).map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
