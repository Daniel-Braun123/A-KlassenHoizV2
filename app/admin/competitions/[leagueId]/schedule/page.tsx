import { notFound } from "next/navigation";

import { ScheduleWorkspace } from "@/components/competition/schedule-workspace";
import { clubLogoUrl } from "@/features/competition/club-logo-url";
import { listClubs } from "@/features/competition/club-service";
import { getAdminLeague } from "@/features/competition/league-service";
import { listAdminSchedule } from "@/features/competition/schedule-service";
import type { AdminLeagueRow } from "@/features/competition/schedule-service";

export default async function LeagueSchedulePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ leagueId: string }>;
  searchParams: Promise<{ matchday?: string }>;
}>) {
  const [{ leagueId }, query] = await Promise.all([params, searchParams]);
  const [league, schedule, clubCatalog] = await Promise.all([
    getAdminLeague(leagueId),
    listAdminSchedule(leagueId),
    listClubs(),
  ]);
  if (
    !league?.id ||
    !league.name ||
    !league.status ||
    league.version === null ||
    !league.year_label
  )
    notFound();
  const selectedLeague: AdminLeagueRow = {
    ...league,
    club_ids: league.club_ids ?? [],
    club_names: league.club_names ?? [],
    id: league.id,
    name: league.name,
    status: league.status,
    version: league.version,
    year_label: league.year_label,
  };
  const clubCatalogById = new Map(
    clubCatalog.flatMap((club) => (club.id ? ([[club.id, club]] as const) : [])),
  );
  const clubs = selectedLeague.club_ids.map((id, index) => {
    const club = clubCatalogById.get(id);
    return {
      id,
      logoUrl: clubLogoUrl(club?.logo_path, club?.logo_url),
      name: club?.name ?? selectedLeague.club_names[index] ?? "Unbekannter Verein",
    };
  });

  return (
    <section className="admin-section">
      <div>
        <h3>Spielplan</h3>
      </div>
      <ScheduleWorkspace
        basePath={`/admin/competitions/${selectedLeague.id}/schedule`}
        clubs={clubs}
        schedule={schedule}
        selectedLeague={selectedLeague}
        selectedMatchdayId={query.matchday}
      />
    </section>
  );
}
