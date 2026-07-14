import type { ActionFailure } from "@/lib/actions/result";

export type AuthActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | ({ status: "error" } & ActionFailure["error"]);

export const initialAuthActionState: AuthActionState = { status: "idle" };
