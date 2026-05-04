type ReviewMetricItem = {
  label: string;
  value: string;
};

type ReviewMetricsProps = {
  items: ReviewMetricItem[];
  note?: string;
};

type ReviewReflection = {
  title: string;
  question: string;
  action: string;
};

function readMetric(items: ReviewMetricItem[], candidates: string[]) {
  const item = items.find((entry) => candidates.some((candidate) => entry.label.toLowerCase().includes(candidate)));
  const match = item?.value.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function getReviewReflection(items: ReviewMetricItem[], completed = false): ReviewReflection {
  const errors = readMetric(items, ["erro"]);
  const missed = readMetric(items, ["faltaram"]);
  const hits = readMetric(items, ["acerto", "alvo", "par"]);

  if (completed && errors === 0 && missed === 0) {
    return {
      title: "Processo percebido",
      question: "O que você fez com calma que ajudou o resultado a aparecer?",
      action: "Repita a estratégia antes de aumentar a velocidade.",
    };
  }

  if (errors > 0) {
    return {
      title: "Atenção ao impulso",
      question: "O erro veio mais da pressa, da distração ou de uma regra mal conferida?",
      action: "Na próxima tentativa, pare um segundo antes da primeira resposta.",
    };
  }

  if (missed > 0 || hits === 0) {
    return {
      title: "Memória em construção",
      question: "O que faltou fixar: ordem, posição, detalhe visual ou significado?",
      action: "Escolha uma pista mental simples antes de tentar de novo.",
    };
  }

  return {
    title: "Ajuste de estratégia",
    question: "Que parte da rodada mostrou melhor o seu jeito de pensar?",
    action: "Mantenha esse caminho e mude apenas uma coisa na próxima tentativa.",
  };
}

export function ReviewMetrics({ items, note }: ReviewMetricsProps) {
  const reflection = getReviewReflection(items, note?.toLowerCase().includes("excelente") ?? false);

  return (
    <section className="review-metrics">
      <div className="review-metrics-grid">
        {items.map((item) => (
          <article key={`${item.label}-${item.value}`} className="review-metric-card">
            <span className="small-muted">{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
      {note ? <p className="review-note">{note}</p> : null}
      <article className="review-reflection-card">
        <span className="small-muted">Resumo da sessão</span>
        <strong>{reflection.title}</strong>
        <p>{reflection.question}</p>
        <p className="review-reflection-action">{reflection.action}</p>
      </article>
    </section>
  );
}
