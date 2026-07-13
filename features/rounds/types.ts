import type { Database } from "@/lib/supabase/database.types";
export type MyRound = Database["api"]["Views"]["my_rounds"]["Row"];
export type RoundMember = Database["api"]["Views"]["round_members"]["Row"];
export type RoundActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: string;
  code?: string;
}>;
export const initialRoundActionState: RoundActionState = { status: "idle" };
