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
            <span className="visible-predictions__outcome">
              <strong>
                {prediction.home_goals}:{prediction.away_goals}
              </strong>
              {prediction.points !== null ? (
                <span
                  className={`visible-predictions__points${
                    prediction.points === 0 ? " visible-predictions__points--zero" : ""
                  }`}
                  aria-label={`${prediction.points} Punkte`}
                >
                  {prediction.points > 0 ? `+${prediction.points} P` : "0 P"}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
