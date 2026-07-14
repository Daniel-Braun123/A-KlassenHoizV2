"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { removeMemberAction, updateNicknameAction } from "@/features/rounds/management-actions";
import { initialRoundActionState, type RoundMember } from "@/features/rounds/types";
export function MemberManagement({
  roundId,
  currentMembershipId,
  members,
}: {
  roundId: string;
  currentMembershipId: string;
  members: RoundMember[];
}) {
  const [nicknameState, nicknameAction, nicknamePending] = useActionState(
    updateNicknameAction,
    initialRoundActionState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeMemberAction,
    initialRoundActionState,
  );
  return (
    <section className="admin-form">
      <h2>Mitglieder</h2>
      <form action={nicknameAction} className="field">
        <input name="roundId" type="hidden" value={roundId} />
        <label className="field__label" htmlFor="nickname">
          Dein Rundennickname
        </label>
        <input
          className="field__control"
          id="nickname"
          name="nickname"
          defaultValue={members.find((m) => m.id === currentMembershipId)?.nickname ?? ""}
          required
          maxLength={40}
        />
        <Button disabled={nicknamePending} type="submit">
          Nickname speichern
        </Button>
        {nicknameState.status !== "idle" ? (
          <p role={nicknameState.status === "error" ? "alert" : "status"}>
            {nicknameState.message}
          </p>
        ) : null}
      </form>
      <ul className="member-list">
        {members.map((member) => (
          <li key={member.id!}>
            <span>
              <strong>{member.nickname}</strong>
              <small>
                {member.role === "owner"
                  ? "Besitzer"
                  : member.status === "active"
                    ? "Mitglied"
                    : member.status}
              </small>
            </span>
            {member.role === "member" && member.status === "active" ? (
              <form action={removeAction}>
                <input name="roundId" type="hidden" value={roundId} />
                <input name="membershipId" type="hidden" value={member.id!} />
                <Button disabled={removePending} variant="danger" type="submit">
                  Entfernen
                </Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
      {removeState.status !== "idle" ? (
        <p role={removeState.status === "error" ? "alert" : "status"}>{removeState.message}</p>
      ) : null}
    </section>
  );
}
