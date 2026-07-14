import { ClubForms } from "@/components/competition/club-form";
import { ClubEditor } from "@/components/competition/catalog-editors";
import { listClubs } from "@/features/competition/club-service";
import { listCompetitionCatalog } from "@/features/competition/league-service";
export default async function ClubsPage() {
  const [clubs, competitions] = await Promise.all([listClubs(), listCompetitionCatalog()]);
  return (
    <section className="admin-section">
      <div>
        <h2>Vereine</h2>
        <p>Vereine werden zentral angelegt und einer Liga-Saison zugeordnet.</p>
      </div>
      <ClubForms clubs={clubs} competitions={competitions} />
      <div className="editor-list">
        <h2>Vereinskatalog korrigieren</h2>
        {clubs.length ? (
          clubs.map((x) => <ClubEditor club={x} key={x.id!} />)
        ) : (
          <p>Noch keine Vereine.</p>
        )}
      </div>
    </section>
  );
}
