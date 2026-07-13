export type AutosaveStatus = "incomplete" | "saving" | "saved" | "error" | "locked";
export type AutosaveState = Readonly<{
  status: AutosaveStatus;
  homeGoals?: number | undefined;
  awayGoals?: number | undefined;
  requestId?: string | undefined;
  message?: string | undefined;
}>;
export type AutosaveEvent =
  | Readonly<{ type: "changed"; homeGoals?: number | undefined; awayGoals?: number | undefined }>
  | Readonly<{ type: "saving"; requestId: string }>
  | Readonly<{ type: "saved"; requestId: string }>
  | Readonly<{ type: "failed"; requestId: string; message: string }>
  | Readonly<{ type: "offline" }>
  | Readonly<{ type: "retry" }>
  | Readonly<{ type: "locked" }>;
export const initialAutosaveState: AutosaveState = { status: "incomplete" };
export function reduceAutosaveState(state: AutosaveState, event: AutosaveEvent): AutosaveState {
  switch (event.type) {
    case "changed":
      return {
        ...state,
        status: "incomplete",
        ...(event.homeGoals === undefined ? {} : { homeGoals: event.homeGoals }),
        ...(event.awayGoals === undefined ? {} : { awayGoals: event.awayGoals }),
        message: undefined,
        requestId: undefined,
      };
    case "saving":
      return { ...state, status: "saving", requestId: event.requestId, message: undefined };
    case "saved":
      return state.requestId === event.requestId
        ? { ...state, status: "saved", requestId: undefined, message: undefined }
        : state;
    case "failed":
      return state.requestId === event.requestId
        ? { ...state, status: "error", requestId: undefined, message: event.message }
        : state;
    case "offline":
      return {
        ...state,
        status: "error",
        message: "Offline – Eingabe ist noch nicht gespeichert.",
        requestId: undefined,
      };
    case "retry":
      return { ...state, status: "incomplete", message: undefined };
    case "locked":
      return { ...state, status: "locked", requestId: undefined, message: undefined };
  }
}
