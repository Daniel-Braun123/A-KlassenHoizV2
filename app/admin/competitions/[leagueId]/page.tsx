import { notFound } from "next/navigation";

import { LeagueEditor } from "@/components/competition/league-season-form";
import { listClubs } from "@/features/competition/club-service";
import { getAdminLeague } from "@/features/competition/league-service";

export default async function LeagueOverviewPage({
  params,
}: Readonly<{ params: Promise<{ leagueId: string }> }>) {
  const { leagueId } = await params;
  const [league, clubs] = await Promise.all([getAdminLeague(leagueId), listClubs()]);
  if (!league?.id) notFound();

  return (
    <section className="admin-section">
      <div>
        <h3>Ligadaten</h3>
      </div>
      <LeagueEditor clubs={clubs.filter((club) => club.status === "active")} league={league} />
    </section>
  );
}
