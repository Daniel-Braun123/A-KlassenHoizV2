import { notFound } from "next/navigation";

import { ResultManager } from "@/components/competition/result-manager";
import { getAdminLeague } from "@/features/competition/league-service";
import { listAdminResults } from "@/features/competition/result-service";

export default async function LeagueResultsPage({
  params,
}: Readonly<{ params: Promise<{ leagueId: string }> }>) {
  const { leagueId } = await params;
  const league = await getAdminLeague(leagueId);
  if (!league?.id) notFound();
  const schedule = await listAdminResults(league.id);

  return (
    <section className="admin-section">
      <div>
        <h3>Ergebnisse</h3>
      </div>
      <ResultManager schedule={schedule} />
    </section>
  );
}
