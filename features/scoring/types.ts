import type { Database } from "@/lib/supabase/database.types";

export type RoundResult = Database["api"]["Views"]["round_results"]["Row"];
