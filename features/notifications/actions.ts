"use server";

import { ZodError } from "zod";

import { ApplicationError } from "@/lib/actions/errors";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/actions/result";
import {
  getOpenTipCount,
  getOwnedPushSubscription,
  registerPushSubscription,
  removePushSubscription,
  setMissingTipsPreference,
} from "@/features/notifications/service";
import {
  buildTestPayload,
  isExpiredPushSubscription,
  sendWebPush,
} from "@/features/notifications/push-server";

type MessageResult = ActionResult<Readonly<{ message: string }>>;
type BadgeCountResult = ActionResult<Readonly<{ count: number }>>;

function failed(error: unknown): MessageResult {
  return actionFailure(
    error instanceof ZodError ? new ApplicationError("INVALID_INPUT", "Push input invalid") : error,
  );
}

export async function getOpenTipBadgeCountAction(): Promise<BadgeCountResult> {
  try {
    return actionSuccess({ count: await getOpenTipCount() });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function registerPushSubscriptionAction(input: unknown): Promise<MessageResult> {
  try {
    await registerPushSubscription(input);
    return actionSuccess({ message: "Benachrichtigungen sind auf diesem Gerät aktiv." });
  } catch (error) {
    return failed(error);
  }
}

export async function removePushSubscriptionAction(endpoint: unknown): Promise<MessageResult> {
  try {
    await removePushSubscription(endpoint);
    return actionSuccess({ message: "Benachrichtigungen sind auf diesem Gerät deaktiviert." });
  } catch (error) {
    return failed(error);
  }
}

export async function setMissingTipsPreferenceAction(input: unknown): Promise<MessageResult> {
  try {
    const enabled = await setMissingTipsPreference(input);
    return actionSuccess({
      message: enabled
        ? "Erinnerungen an offene Tipps sind aktiv."
        : "Erinnerungen an offene Tipps sind pausiert.",
    });
  } catch (error) {
    return failed(error);
  }
}

export async function sendTestPushNotificationAction(endpoint: unknown): Promise<MessageResult> {
  try {
    const subscription = await getOwnedPushSubscription(endpoint);
    await sendWebPush(
      {
        endpoint: subscription.endpoint,
        p256dhKey: subscription.p256dh_key,
        authSecret: subscription.auth_secret,
      },
      buildTestPayload(),
    );
    return actionSuccess({ message: "Testbenachrichtigung wurde gesendet." });
  } catch (error) {
    if (isExpiredPushSubscription(error)) {
      try {
        await removePushSubscription(endpoint);
      } catch {
        // The original delivery error is the useful result for the user.
      }
    }
    return failed(error);
  }
}
