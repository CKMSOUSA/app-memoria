type GameGuideProps = {
  title: string;
  objective: string;
  steps: string[];
  tip?: string;
  isChild?: boolean;
};

export function GameGuide({ title, objective, steps, tip, isChild = false }: GameGuideProps) {
  return (
    <section className={`guide-card ${isChild ? "guide-card-child" : ""}`}>
      <div className="section-head">
        <h3>{title}</h3>
        <span className="guide-badge">Leia antes de jogar</span>
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
        {steps.map((step, index) => (
          <li key={step}>
            <span className="guide-step-index">{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {tip ? <p className="guide-tip">{tip}</p> : null}
    </section>
  );
}
