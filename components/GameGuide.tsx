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
        <span className="small-muted">Guia rapido</span>
      </div>
      <p className="muted guide-objective">{objective}</p>
      <ol className="guide-steps">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {tip ? <p className="guide-tip">{tip}</p> : null}
    </section>
  );
}
