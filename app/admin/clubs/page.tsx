import { ClubAdmin } from "@/components/competition/club-form";
import { listClubs } from "@/features/competition/club-service";

export default async function ClubsPage() {
  const clubs = await listClubs();

  return (
    <section className="admin-section">
      <div>
        <h2>Vereine</h2>
      </div>
      <ClubAdmin clubs={clubs} />
    </section>
  );
}
