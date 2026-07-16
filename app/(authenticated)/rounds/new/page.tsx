import { CreateRoundFlow } from "@/components/rounds/create-round-flow";
import { listPublishedLeagueSeasons } from "@/features/competition/public-service";
export default async function NewRoundPage() {
  const competitions = await listPublishedLeagueSeasons();
  return (
    <section className="content-page">
      <div className="content-page__intro">
        <p className="product-mark">Private Tipprunde</p>
        <h1>In drei Schritten gemeinsam starten</h1>
        <p>
          Du bleibst alleiniger Besitzer. Später lädst du deine Freunde per Link oder QR-Code ein.
        </p>
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
