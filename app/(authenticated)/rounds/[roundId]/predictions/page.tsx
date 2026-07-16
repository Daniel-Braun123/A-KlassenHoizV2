import type { MatchdayOption } from "@/components/predictions/matchday-selector";
import { PredictionWorkspace } from "@/components/predictions/prediction-workspace";
import { getMyRound } from "@/features/rounds/service";
import { listPredictionSheet, listVisiblePredictions } from "@/features/predictions/service";

export default async function PredictionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ roundId: string }>;
  searchParams: Promise<{ matchday?: string }>;
}) {
  const [{ roundId }, query] = await Promise.all([params, searchParams]);
  const [round, sheet, visible] = await Promise.all([
    getMyRound(roundId),
    listPredictionSheet(roundId),
    listVisiblePredictions(roundId),
  ]);
  const grouped = new Map<string, typeof sheet>();
  for (const row of sheet) {
    if (!row.matchday_id) continue;
    const current = grouped.get(row.matchday_id) ?? [];
    current.push(row);
    grouped.set(row.matchday_id, current);
  }
  const options: MatchdayOption[] = [...grouped.entries()]
    .map(([id, rows]) => ({
      id,
      number: rows[0]?.matchday_number ?? 0,
      label: rows[0]?.display_name || `${rows[0]?.matchday_number ?? "–"}. Spieltag`,
      incomplete: rows.some((row) => row.is_open && row.predicted_home_goals === null),
    }))
    .sort((a, b) => a.number - b.number);
  const nextIncomplete = options.find((option) => option.incomplete);
  const selectedId =
    query.matchday && grouped.has(query.matchday)
      ? query.matchday
      : (nextIncomplete?.id ?? options[0]?.id);
  const matches = selectedId ? (grouped.get(selectedId) ?? []) : [];

  return (
    <section className="content-page prediction-page">
      <div className="content-page__intro">
        <p className="product-mark">{round.name}</p>
        <h1>Tipps abgeben</h1>
      </div>
      {selectedId ? (
        <PredictionWorkspace
          key={selectedId}
          matches={matches}
          options={options}
          roundId={roundId}
          selectedId={selectedId}
          visible={visible.filter((item) =>
            matches.some((match) => match.match_id === item.match_id),
          )}
        />
      ) : (
        <div className="status-state">
          <span className="status-state__symbol">i</span>
          <div>
            <h2>Noch keine Spiele</h2>
            <p>Sobald ein Spieltag veröffentlicht ist, kannst du hier tippen.</p>
          </div>
        </div>
      )}
    </section>
  );
}
