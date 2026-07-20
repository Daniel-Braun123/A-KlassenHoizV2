import { RankingScopeSelect } from "@/components/rankings/ranking-scope-select";
import { ResponsiveRanking } from "@/components/rankings/responsive-ranking";
import { listMatchdayRanking, listOverallRanking } from "@/features/rankings/service";
import { getMyRound } from "@/features/rounds/service";
import { formatMatchdayOptionLabel } from "@/features/competition/matchday-period";

export default async function RankingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ roundId: string }>;
  searchParams: Promise<{ matchday?: string }>;
}) {
  const [{ roundId }, query] = await Promise.all([params, searchParams]);
  const [round, overall, days] = await Promise.all([
    getMyRound(roundId),
    listOverallRanking(roundId),
    listMatchdayRanking(roundId),
  ]);
  const matchdays = [
    ...new Map(
      days.flatMap((row) =>
        row.matchday_id
          ? [
              [
                row.matchday_id,
                {
                  id: row.matchday_id,
                  label:
                    row.starts_on && row.ends_on
                      ? formatMatchdayOptionLabel(
                          row.display_name || `${row.matchday_number}. Spieltag`,
                          row.starts_on,
                          row.ends_on,
                        )
                      : row.display_name || `${row.matchday_number}. Spieltag`,
                },
              ] as const,
            ]
          : [],
      ),
    ).values(),
  ];
  const selected =
    query.matchday && matchdays.some((matchday) => matchday.id === query.matchday)
      ? query.matchday
      : "overall";
  const selectedMatchday = matchdays.find((matchday) => matchday.id === selected);
  const selectedRows =
    selected === "overall" ? overall : days.filter((row) => row.matchday_id === selected);
  const title = selectedMatchday?.label ?? "Gesamt";

  return (
    <section className="content-page ranking-page">
      <div className="content-page__intro">
        <p className="product-mark">{round.name}</p>
        <h1>Rangliste</h1>
      </div>
      <RankingScopeSelect options={matchdays} roundId={roundId} selected={selected} />
      <ResponsiveRanking title={title} rows={selectedRows} />
    </section>
  );
}
