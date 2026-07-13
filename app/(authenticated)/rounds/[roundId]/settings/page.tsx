import type { Route } from "next";
import { redirect } from "next/navigation";
import { ArchiveRoundDialog } from "@/components/rounds/archive-round-dialog";
import { DeleteRoundDialog } from "@/components/rounds/delete-round-dialog";
import { InvitationPanel } from "@/components/rounds/invitation-panel";
import { MemberManagement } from "@/components/rounds/member-management";
import { RoundSettingsForm } from "@/components/rounds/round-settings-form";
import { TransferOwnershipDialog } from "@/components/rounds/transfer-ownership-dialog";
import { listPublishedLeagueSeasons } from "@/features/competition/public-service";
import { getMyRound, listRoundMembers } from "@/features/rounds/service";
export default async function RoundSettingsPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const [round, competitions, members] = await Promise.all([
    getMyRound(roundId),
    listPublishedLeagueSeasons(),
    listRoundMembers(roundId),
  ]);
  if (round.role !== "owner") redirect(`/rounds/${roundId}` as Route);
  return (
    <section className="content-page">
      <div className="content-page__intro">
        <p className="product-mark">Nur für den Besitzer</p>
        <h1>{round.name} verwalten</h1>
        <p>
          Es gibt keine Co-Admins. Mitglieder, Einladungen und die Runde bleiben in deiner
          Verantwortung.
        </p>
      </div>
      <div className="admin-form-grid">
        <RoundSettingsForm competitions={competitions} round={round} />
        <MemberManagement
          roundId={roundId}
          currentMembershipId={round.membership_id!}
          members={members}
        />
        <InvitationPanel roundId={roundId} />
        <section className="admin-form">
          <h2>Besitz</h2>
          <p>Die Übertragung ersetzt dich atomar durch genau einen neuen Besitzer.</p>
          <TransferOwnershipDialog roundId={roundId} version={round.version!} members={members} />
        </section>
        <ArchiveRoundDialog
          roundId={roundId}
          version={round.version!}
          archived={round.status === "archived"}
        />
        <section className="destructive-state">
          <h2>Gefahrenbereich</h2>
          <p>
            Bevorzuge das reversible Archivieren. Die endgültige Löschung ist nur für bewusstes
            vollständiges Entfernen der privaten Runde.
          </p>
          <DeleteRoundDialog roundId={roundId} roundName={round.name!} version={round.version!} />
        </section>
      </div>
    </section>
  );
}
