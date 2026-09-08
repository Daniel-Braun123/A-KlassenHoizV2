"use server";

import { revalidatePath } from "next/cache";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/actions/result";
import { saveRoundOrder } from "./order-service";

export async function saveRoundOrderAction(ids: string[]): Promise<ActionResult<null>> {
  try {
    await saveRoundOrder(ids);
    revalidatePath("/start");
    return actionSuccess(null);
  } catch (error) {
    return actionFailure(error);
  }
}
