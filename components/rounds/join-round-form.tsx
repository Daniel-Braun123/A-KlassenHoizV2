"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinRoundAction } from "@/features/invitations/actions";
import { initialInvitationActionState } from "@/features/invitations/types";
export function JoinRoundForm({ token }: { token: string }) {
  const [key] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(joinRoundAction, initialInvitationActionState);
  return (
    <form action={action} className="admin-form">
      <h2>Der Tipprunde beitreten</h2>
      <input name="token" type="hidden" value={token} />
      <input name="idempotencyKey" type="hidden" value={key} />
      <Input
        hint="Der Name muss in dieser Runde eindeutig sein."
        label="Dein Rundennickname"
        name="nickname"
        required
        maxLength={40}
      />
      {state.status === "error" ? (
        <p className="admin-form__message admin-form__message--error" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button disabled={pending} type="submit">
        Jetzt beitreten
      </Button>
    </form>
  );
}
