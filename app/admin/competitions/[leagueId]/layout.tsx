import { notFound } from "next/navigation";

import { LeagueAdminNavigation } from "@/components/competition/league-admin-navigation";
import { Link } from "@/components/ui/link";
import { getAdminLeague } from "@/features/competition/league-service";

export default async function LeagueManagementLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ leagueId: string }>;
}>) {
  const { leagueId } = await params;
  const league = await getAdminLeague(leagueId);
  if (!league?.id) notFound();

  return (
    <section className="league-management">
      <header className="league-management__header">
        <Link href="/admin/competitions">Alle Ligen</Link>
        <div className="league-management__title-row">
          <div>
            <h2>{league.name}</h2>
            <p>
              {league.year_label} · {league.club_count ?? 0} Vereine
            </p>
          </div>
          <span
            className={`publication-status publication-status--${league.status === "draft" ? "draft" : "published"}`}
          >
            {league.status === "draft" ? "Entwurf" : "Veröffentlicht"}
          </span>
        </div>
      </header>
      <LeagueAdminNavigation leagueId={league.id} />
      <div className="league-management__content">{children}</div>
    </section>
  );
}
