type ReviewMetricItem = {
  label: string;
  value: string;
};

type ReviewMetricsProps = {
  items: ReviewMetricItem[];
  note?: string;
};

export function ReviewMetrics({ items, note }: ReviewMetricsProps) {
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
    </section>
  );
}
