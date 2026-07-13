"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type DestructiveStateProps = Readonly<{
  title: string;
  description: string;
  confirmationName: string;
  actionLabel: string;
  pending?: boolean;
  onConfirm: () => void;
}>;

export function DestructiveState({
  actionLabel,
  confirmationName,
  description,
  onConfirm,
  pending = false,
  title,
}: DestructiveStateProps) {
  const [confirmation, setConfirmation] = useState("");
  const confirmed = confirmation === confirmationName;

  return (
    <section className="destructive-state" aria-labelledby="destructive-title">
      <div className="destructive-state__copy">
        <span aria-hidden="true" className="destructive-state__symbol">
          !
        </span>
        <div>
          <h2 id="destructive-title">{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <Input
        autoComplete="off"
        label={`Zur Bestätigung „${confirmationName}“ eingeben`}
        onChange={(event) => setConfirmation(event.currentTarget.value)}
        spellCheck={false}
        value={confirmation}
      />
      <Button disabled={!confirmed || pending} onClick={onConfirm} variant="danger" fullWidth>
        {pending ? "Wird endgültig gelöscht …" : actionLabel}
      </Button>
    </section>
  );
}
