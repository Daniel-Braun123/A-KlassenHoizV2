import { LeagueAdmin } from "@/components/competition/league-season-form";
import { listClubs } from "@/features/competition/club-service";
import { listAdminLeagues } from "@/features/competition/league-service";

export default async function CompetitionsPage() {
  const [leagues, clubs] = await Promise.all([listAdminLeagues(), listClubs()]);

  return (
    <section className="admin-section">
      <div>
        <h2>Ligen</h2>
      </div>
      <LeagueAdmin clubs={clubs} leagues={leagues} />
    </section>
  );
}
