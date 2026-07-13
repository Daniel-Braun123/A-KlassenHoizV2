"use server";

import { revalidatePath } from "next/cache";

export async function refreshRankingsAction(roundId: string): Promise<void> {
  revalidatePath(`/rounds/${roundId}/rankings`);
}
