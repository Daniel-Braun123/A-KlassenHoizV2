import type { Route } from "next";
import { ResponsiveRanking } from "@/components/rankings/responsive-ranking";
import { Link } from "@/components/ui/link";
import { listMatchdayRanking, listOverallRanking } from "@/features/rankings/service";
import { getMyRound } from "@/features/rounds/service";

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
  const dayIds = [
    ...new Set(days.map((row) => row.matchday_id).filter((id): id is string => Boolean(id))),
  ];
  const selected =
    query.matchday && dayIds.includes(query.matchday) ? query.matchday : dayIds.at(-1);
  const selectedRows = days.filter((row) => row.matchday_id === selected);
  return (
    <section className="content-page">
      <div className="content-page__intro">
        <p className="product-mark">{round.name}</p>
        <h1>Rangliste</h1>
        <p>
          Geteilte Punkte bedeuten denselben Platz. Nicknames sortieren die Anzeige, nicht die
          Wertung.
        </p>
      </div>
      <ResponsiveRanking title="Gesamt" rows={overall} />
      {dayIds.length ? (
        <>
          <nav className="matchday-selector" aria-label="Spieltagsrangliste">
            <ul>
              {dayIds.map((id) => {
                const row = days.find((item) => item.matchday_id === id)!;
                return (
                  <li key={id}>
                    <Link
                      href={`/rounds/${roundId}/rankings?matchday=${id}` as Route}
                      aria-current={id === selected ? "page" : undefined}
                    >
                      {row.display_name || `${row.matchday_number}. Spieltag`}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <ResponsiveRanking title="Spieltag" rows={selectedRows} />
        </>
      ) : null}
      <Link href={`/rounds/${roundId}` as Route}>Zurück zur Tipprunde</Link>
    </section>
  );
}
