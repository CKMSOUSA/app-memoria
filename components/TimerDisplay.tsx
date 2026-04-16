"use client";

export function TimerDisplay({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "active";
}) {
  return (
    <div className={`timer-display timer-display-${tone}`} aria-live="polite">
      <span className="timer-display-label">{label}</span>
      <strong className="timer-display-value">{value}</strong>
    </div>
  );
}
