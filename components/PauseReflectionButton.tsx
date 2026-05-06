"use client";

import { useEffect, useMemo, useState } from "react";

type PauseReflectionButtonProps = {
  prompts: string[];
  variant?: "alarm" | "game";
  seconds?: number;
  buttonLabel?: string;
  title?: string;
  doneMessage?: string;
  className?: string;
};

export function PauseReflectionButton({
  prompts,
  variant = "game",
  seconds = 40,
  buttonLabel = "Pare e Pense",
  title = "Pausa de reflexão",
  doneMessage = "Guarde a percepção que apareceu e siga com calma.",
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
  const prompt = safePrompts[promptIndex] ?? safePrompts[0];
  const complete = open && secondsLeft === 0;
  const statusTitle = complete ? "Pausa concluída" : open ? (paused ? `${secondsLeft}s em pausa` : `${secondsLeft}s para pensar`) : "Respire antes de seguir";
  const visiblePrompt = open ? prompt : "Antes de seguir, observe o que precisa de presença agora.";

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

    setPromptIndex(nextIndex);
    setSecondsLeft(seconds);
    setPaused(false);
    setOpen(true);
  }

  const reflectionButton = (
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
  );

  if (variant === "alarm") {
    return (
      <div className={`pause-reflection pause-reflection-${variant} ${className}`.trim()}>
        <article className="pause-reflection-card pause-reflection-card-alarm" aria-live="polite">
          <div className="pause-reflection-card-main">
            <div>
              <p className="small-muted pause-reflection-label">{title}</p>
              <h3>{statusTitle}</h3>
              <p className="muted pause-reflection-question">{visiblePrompt}</p>
            </div>
            {open && !complete ? (
              <button className="btn btn-secondary pause-reflection-control" type="button" onClick={() => setPaused((current) => !current)}>
                {paused ? "Continuar" : "Pausar"}
              </button>
            ) : null}
            {open ? (
              <>
                <div className="pause-reflection-meter" aria-label={`${secondsLeft} segundos restantes`}>
                  <span style={{ width: `${((seconds - secondsLeft) / seconds) * 100}%` }} />
                </div>
                {complete ? <p className="pause-reflection-done">{doneMessage}</p> : null}
              </>
            ) : null}
          </div>
          <div className="pause-reflection-card-action">{reflectionButton}</div>
        </article>
      </div>
    );
  }

  return (
    <div className={`pause-reflection pause-reflection-${variant} ${className}`.trim()}>
      {reflectionButton}
      {open ? (
        <article className="pause-reflection-card" aria-live="polite">
          <div>
            <p className="small-muted pause-reflection-label">{title}</p>
            <h3>{statusTitle}</h3>
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
        </article>
      ) : null}
    </div>
  );
}
