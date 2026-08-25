import { CreateRoundFlow } from "@/components/rounds/create-round-flow";
import { PageBackLink } from "@/components/patterns/page-back-link";
import { listPublishedLeagueSeasons } from "@/features/competition/public-service";
export default async function NewRoundPage() {
  const competitions = await listPublishedLeagueSeasons();
  return (
    <section className="content-page content-page--compact">
      <div className="content-page__heading">
        <PageBackLink accessibleLabel="Zurück zur Übersicht" href="/start" label="Übersicht" />
        <div className="content-page__intro">
          <p className="product-mark">Private Tipprunde</p>
          <h1>Neue Tipprunde</h1>
        </div>
      </div>
      {competitions.length ? (
        <CreateRoundFlow competitions={competitions} />
      ) : (
        <p className="status-state">
          Momentan ist noch keine Liga für neue Tipprunden veröffentlicht.
        </p>
      )}
    </section>
  );
}
