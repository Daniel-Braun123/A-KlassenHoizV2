import type { ActionFailure } from "@/lib/actions/result";

export type AuthActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | ({ status: "error" } & ActionFailure["error"]);

export const initialAuthActionState: AuthActionState = { status: "idle" };

export type RegistrationActionState =
  | Exclude<AuthActionState, { status: "success" }>
  | { status: "success"; message: string; email: string; displayName: string };

export const initialRegistrationActionState: RegistrationActionState = { status: "idle" };
