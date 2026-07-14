import { ResultForm } from "@/components/competition/result-form";
import { listSchedule } from "@/features/competition/schedule-service";
export default async function ResultsPage() {
  const schedule = await listSchedule();
  return (
    <section className="admin-section">
      <div>
        <h2>Ergebnisse</h2>
        <p>Offizielle Ergebnisse und Korrekturen wirken zentral auf alle Tipprunden.</p>
      </div>
      <ResultForm matches={schedule} />
      <div className="data-list">
        <h2>Ergebnisstand</h2>
        {schedule.filter((x) => x.decision).length ? (
          <ul>
            {schedule
              .filter((x) => x.decision)
              .map((x) => (
                <li key={x.match_id!}>
                  <strong>
                    {x.home_club_name} {x.home_goals} : {x.away_goals} {x.away_club_name}
                  </strong>
                  <span>Revision {x.revision_no}</span>
                </li>
              ))}
          </ul>
        ) : (
          <p>Noch keine Ergebnisse.</p>
        )}
      </div>
    </section>
  );
}
