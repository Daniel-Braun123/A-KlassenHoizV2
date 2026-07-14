import { PredictionCard } from "@/components/predictions/prediction-card";
import type { PredictionSheetRow, VisiblePrediction } from "@/features/predictions/types";

export function PredictionList({
  matches,
  visible,
}: {
  matches: PredictionSheetRow[];
  visible: VisiblePrediction[];
}) {
  const byMatch = new Map<string, VisiblePrediction[]>();
  for (const prediction of visible) {
    if (!prediction.match_id) continue;
    const current = byMatch.get(prediction.match_id) ?? [];
    current.push(prediction);
    byMatch.set(prediction.match_id, current);
  }
  return (
    <section className="prediction-list" aria-label="Spiele dieses Spieltags">
      {matches.map((match) => (
        <PredictionCard
          key={match.match_id!}
          match={match}
          visiblePredictions={byMatch.get(match.match_id!) ?? []}
        />
      ))}
    </section>
  );
}
