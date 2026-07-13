import { MatchEditor } from "@/components/competition/match-editor";
import { listClubs } from "@/features/competition/club-service";
import { listCompetitionCatalog } from "@/features/competition/league-service";
import { listSchedule } from "@/features/competition/schedule-service";
import { ExistingMatchEditor, MatchdayEditor } from "@/components/competition/schedule-editors";
export default async function SchedulePage() {
  const [clubs, competitions, schedule] = await Promise.all([
    listClubs(),
    listCompetitionCatalog(),
    listSchedule(),
  ]);
  const matchdays = [...new Map(schedule.map((x) => [x.matchday_id, x])).values()];
  return (
    <section className="admin-section">
      <div>
        <h2>Spielplan</h2>
        <p>Anpfiffzeiten sind die serverseitig verbindlichen Tippfristen.</p>
      </div>
      <MatchEditor clubs={clubs} competitions={competitions} schedule={schedule} />
      <div className="editor-list">
        <h2>Spieltage veröffentlichen oder korrigieren</h2>
        {matchdays.map((x) => (
          <MatchdayEditor key={x.matchday_id!} row={x} />
        ))}
      </div>
      <div className="editor-list">
        <h2>Spiele verschieben oder korrigieren</h2>
        {schedule
          .filter((x) => x.match_id)
          .map((x) => (
            <ExistingMatchEditor clubs={clubs} key={x.match_id!} row={x} />
          ))}
      </div>
    </section>
  );
}
