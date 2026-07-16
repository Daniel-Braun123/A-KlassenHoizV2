import { notFound } from "next/navigation";

import { ScheduleWorkspace } from "@/components/competition/schedule-workspace";
import { listClubs } from "@/features/competition/club-service";
import { listAdminLeagues, listAdminSchedule } from "@/features/competition/schedule-service";

export default async function LeagueSchedulePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ leagueId: string }>;
  searchParams: Promise<{ matchday?: string }>;
}>) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const [leagues, schedule, clubCatalog] = await Promise.all([
    listAdminLeagues(),
    listAdminSchedule(leagueId),
    listClubs(),
  ]);
  const league = leagues.find((entry) => entry.id === leagueId);
  if (!league) notFound();
  const clubCatalogById = new Map(
    clubCatalog.flatMap((club) => (club.id ? ([[club.id, club]] as const) : [])),
  );
  const clubs = league.club_ids.map((id, index) => {
    const club = clubCatalogById.get(id);
    return {
      id,
      logoUrl: club?.logo_url ?? null,
      name: club?.name ?? league.club_names[index] ?? "Unbekannter Verein",
    };
  });

  return (
    <section className="admin-section">
      <div>
        <h3>Spielplan</h3>
      </div>
      <ScheduleWorkspace
        basePath={`/admin/competitions/${league.id}/schedule`}
        clubs={clubs}
        schedule={schedule}
        selectedLeague={league}
        selectedMatchdayId={query.matchday}
      />
    </section>
  );
}
