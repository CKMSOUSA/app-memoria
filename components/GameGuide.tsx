"use client";

import { useNarrationText } from "@/lib/app-settings";

type GameGuideProps = {
  title: string;
  objective: string;
  steps: string[];
  tip?: string;
  isChild?: boolean;
};

export function GameGuide({ title, objective, steps, tip, isChild = false }: GameGuideProps) {
  const { narrationEnabled, simplifiedCommands, screenReaderHints, narrateNow } = useNarrationText(
    `${title}. ${objective}. ${steps.slice(0, 3).join(". ")}${tip ? `. Dica: ${tip}` : ""}`,
  );
  const visibleSteps = simplifiedCommands ? steps.slice(0, 3) : steps;

  return (
    <section className={`guide-card ${isChild ? "guide-card-child" : ""}`}>
      <div className="section-head">
        <h3>{title}</h3>
        <div className="button-row guide-actions">
          <span className="guide-badge">{simplifiedCommands ? "Comandos simples" : "Leia antes de jogar"}</span>
          <button type="button" className="btn btn-secondary btn-guide-narrate" onClick={narrateNow}>
            {narrationEnabled ? "Repetir voz" : "Ouvir instrucoes"}
          </button>
        </div>
      </div>
      {isChild ? (
        <div className="guide-cue-row" aria-hidden="true">
          <span className="guide-cue">👀</span>
          <span className="guide-cue">🧠</span>
          <span className="guide-cue">👉</span>
          <span className="guide-cue">⭐</span>
        </div>
      ) : null}
      <div className="guide-objective-box">
        <span className="guide-objective-label">Como funciona</span>
        <p className="guide-objective">{objective}</p>
      </div>
      <ol className="guide-steps">
        {visibleSteps.map((step, index) => (
          <li key={step}>
            <span className="guide-step-index">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {tip ? <p className="guide-tip">{tip}</p> : null}
      {screenReaderHints ? <p className="sr-only" aria-live="polite">{`${title}. ${objective}`}</p> : null}
    </section>
  );
}
