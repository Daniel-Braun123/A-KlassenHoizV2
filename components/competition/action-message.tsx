import type { CompetitionActionState } from "@/features/competition/types";

export function ActionMessage({ state }: Readonly<{ state: CompetitionActionState }>) {
  if (state.status === "idle") return null;
  return (
    <p
      className={`admin-form__message admin-form__message--${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}
