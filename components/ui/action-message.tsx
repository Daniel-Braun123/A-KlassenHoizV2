"use client";

import { useEffect, useState } from "react";

export type ActionFeedbackState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
}>;

export const SUCCESS_MESSAGE_DURATION_MS = 4_500;
const EXIT_DURATION_MS = 200;

export function ActionMessage({ state }: Readonly<{ state: ActionFeedbackState }>) {
  const [dismissedState, setDismissedState] = useState<ActionFeedbackState | null>(null);
  const [leavingState, setLeavingState] = useState<ActionFeedbackState | null>(null);

  useEffect(() => {
    if (state.status !== "success") return;

    const leaveTimer = window.setTimeout(
      () => setLeavingState(state),
      SUCCESS_MESSAGE_DURATION_MS - EXIT_DURATION_MS,
    );
    const dismissTimer = window.setTimeout(
      () => setDismissedState(state),
      SUCCESS_MESSAGE_DURATION_MS,
    );

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [state]);

  if (state.status === "idle" || dismissedState === state) return null;

  return (
    <p
      className={`admin-form__message admin-form__message--${state.status}`}
      data-leaving={leavingState === state ? "true" : undefined}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}
