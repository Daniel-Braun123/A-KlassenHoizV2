import "server-only";

import { revalidatePath } from "next/cache";

export function revalidatePrediction(roundId: string): void {
  revalidatePath(`/rounds/${roundId}`);
  revalidatePath(`/rounds/${roundId}/predictions`);
}
