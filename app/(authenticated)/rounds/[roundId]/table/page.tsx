import { LeagueTable } from "@/components/standings/league-table";
import { getMyRound } from "@/features/rounds/service";
import { listLeagueTable } from "@/features/standings/service";

export default async function LeagueTablePage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const round = await getMyRound(roundId);
  const rows = await listLeagueTable(roundId, round.league_season_id!);

  return (
    <section className="content-page league-table-page">
      <div className="content-page__intro">
        <p className="product-mark">
          {round.league_name} · {round.season_label}
        </p>
        <h1>Tabelle</h1>
      </div>
      <LeagueTable rows={rows} />
    </section>
  );
}
