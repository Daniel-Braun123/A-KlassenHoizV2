import { LeagueSeasonForms } from "@/components/competition/league-season-form";
import { LeagueEditor, SeasonEditor } from "@/components/competition/catalog-editors";
import {
  listCompetitionCatalog,
  listLeagues,
  listSeasons,
} from "@/features/competition/league-service";

export default async function CompetitionsPage() {
  const [competitions, leagues, seasons] = await Promise.all([
    listCompetitionCatalog(),
    listLeagues(),
    listSeasons(),
  ]);
  return (
    <section className="admin-section">
      <div>
        <h2>Ligen und Saisons</h2>
        <p>
          Baue den globalen Wettbewerb kontrolliert auf und veröffentliche ihn erst nach Prüfung.
        </p>
      </div>
      <LeagueSeasonForms competitions={competitions} leagues={leagues} seasons={seasons} />
      <div className="editor-list">
        <h2>Ligen korrigieren</h2>
        {leagues.map((x) => (
          <LeagueEditor key={x.id!} league={x} />
        ))}
      </div>
      <div className="editor-list">
        <h2>Saisons korrigieren</h2>
        {seasons.map((x) => (
          <SeasonEditor key={x.id!} season={x} />
        ))}
      </div>
      <div className="data-list">
        <h2>Bestehende Liga-Saisons</h2>
        {competitions.length ? (
          <ul>
            {competitions.map((x) => (
              <li key={x.league_season_id!}>
                <strong>
                  {x.league_name} · {x.season_label}
                </strong>
                <span>
                  Status {x.league_season_status}, Version {x.league_season_version}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Noch keine Liga-Saison verbunden.</p>
        )}
      </div>
    </section>
  );
}
