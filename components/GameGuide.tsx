type GameGuideProps = {
  title: string;
  objective: string;
  steps: string[];
  tip?: string;
};

export function GameGuide({ title, objective, steps, tip }: GameGuideProps) {
  return (
    <section className="guide-card">
      <div className="section-head">
        <h3>{title}</h3>
        <span className="guide-badge">Leia antes de jogar</span>
      </div>
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
