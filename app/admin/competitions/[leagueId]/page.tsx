import { notFound } from "next/navigation";

import { LeagueEditor } from "@/components/competition/league-season-form";
import { listClubs } from "@/features/competition/club-service";
import { getAdminLeague } from "@/features/competition/league-service";
import { getSeasonCompletion } from "@/features/competition/season-completion-service";
import { SeasonCompletionControl } from "@/components/competition/season-completion-control";

export default async function LeagueOverviewPage({
  params,
}: Readonly<{ params: Promise<{ leagueId: string }> }>) {
  const { leagueId } = await params;
  const [league, clubs] = await Promise.all([getAdminLeague(leagueId), listClubs()]);
  if (!league?.id) notFound();
  const completion = await getSeasonCompletion(league.id);

  return (
    <section className="admin-section">
      <div>
        <h3>Ligadaten</h3>
      </div>
      <LeagueEditor clubs={clubs.filter((club) => club.status === "active")} league={league} />
      <SeasonCompletionControl season={completion} />
    </section>
  );
}
