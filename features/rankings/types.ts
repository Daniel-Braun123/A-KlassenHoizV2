import type { Database } from "@/lib/supabase/database.types";

export type OverallRankingRow = Database["api"]["Views"]["overall_ranking"]["Row"];
export type MatchdayRankingRow = Database["api"]["Views"]["matchday_ranking"]["Row"];
