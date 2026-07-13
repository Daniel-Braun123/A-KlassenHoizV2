"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export type DialogProps = Readonly<{
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}>;

export function Dialog({ children, description, onClose, open, title }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className="ui-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="ui-dialog__surface">
        <header className="ui-dialog__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <Button aria-label="Dialog schließen" onClick={onClose} variant="ghost">
            <span aria-hidden="true">×</span>
          </Button>
        </header>
        <div className="ui-dialog__body">{children}</div>
      </div>
    </dialog>
  );
}
