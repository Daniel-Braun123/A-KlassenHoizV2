import type { VisiblePrediction } from "@/features/predictions/types";

export function VisiblePredictions({ predictions }: { predictions: VisiblePrediction[] }) {
  if (!predictions.length) return null;
  return (
    <details className="visible-predictions">
      <summary>Tipps der Runde ({predictions.length})</summary>
      <ul>
        {predictions.map((prediction) => (
          <li key={prediction.membership_id!}>
            <span>{prediction.nickname}</span>
            <strong>
              {prediction.home_goals}:{prediction.away_goals}
            </strong>
          </li>
        ))}
      </ul>
    </details>
  );
}
