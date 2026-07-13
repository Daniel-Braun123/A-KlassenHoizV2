import "server-only";

import { unstable_noStore as noStore } from "next/cache";

const privateCacheControl = "private, no-store, max-age=0, must-revalidate";

export function markPrivateDataAsNoStore(): void {
  noStore();
}

export function privateDataHeaders(): Readonly<Record<"Cache-Control", string>> {
  return { "Cache-Control": privateCacheControl };
}

export function publishedLeagueSeasonTag(leagueSeasonId: string): string {
  return `published-league-season:${leagueSeasonId}`;
}
