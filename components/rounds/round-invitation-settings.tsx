import type { Route } from "next";
import { Link } from "@/components/ui/link";
import { InvitationPanel } from "./invitation-panel";

export function RoundInvitationSettings({
  roundId,
  hasSuccessor,
  successorRoundId,
}: {
  roundId: string;
  hasSuccessor: boolean;
  successorRoundId: string | null;
}) {
  if (!hasSuccessor) return <InvitationPanel roundId={roundId} />;

  return (
    <section className="invitation-panel">
      <div>
        <h2>Einladungen zur neuen Saison</h2>
        <p>
          Diese Tipprunde wurde in eine neue Saison übernommen. Der bisherige Einladungslink ist
          nicht mehr gültig. Neue Mitglieder werden in der Folgerunde eingeladen.
        </p>
      </div>
      {successorRoundId ? (
        <Link href={`/rounds/${successorRoundId}` as Route}>Neue Saison öffnen</Link>
      ) : null}
    </section>
  );
}
