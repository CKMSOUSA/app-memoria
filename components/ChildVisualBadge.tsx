import { getChildVisual } from "@/lib/child-visuals";

type ChildVisualBadgeProps = {
  token: string;
  compact?: boolean;
};

export function ChildVisualBadge({ token, compact = false }: ChildVisualBadgeProps) {
  return (
    <span className={`child-visual-badge ${compact ? "child-visual-badge-compact" : ""}`}>
      <span className="child-visual-emoji" aria-hidden="true">
        {getChildVisual(token)}
      </span>
      <span className="child-visual-label">{token}</span>
    </span>
  );
}
