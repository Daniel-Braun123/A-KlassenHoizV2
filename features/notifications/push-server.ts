import "server-only";

import webpush from "web-push";

import { readServerEnvironment } from "@/lib/config/env";
import type {
  ClaimedPushReminder,
  PushPayload,
  PushReminderKind,
} from "@/features/notifications/types";

type SubscriptionData = Readonly<{
  endpoint: string;
  p256dhKey: string;
  authSecret: string;
}>;

export function pushConfigurationAvailable(): boolean {
  const environment = readServerEnvironment();
  return Boolean(environment.NEXT_PUBLIC_VAPID_PUBLIC_KEY && environment.VAPID_PRIVATE_KEY);
}

function configureWebPush(): void {
  const environment = readServerEnvironment();
  if (!environment.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !environment.VAPID_PRIVATE_KEY) {
    throw new Error("VAPID keys are not configured");
  }
  webpush.setVapidDetails(
    environment.NEXT_PUBLIC_SITE_URL,
    environment.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    environment.VAPID_PRIVATE_KEY,
  );
}

export async function sendWebPush(
  subscription: SubscriptionData,
  payload: PushPayload,
): Promise<void> {
  configureWebPush();
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dhKey,
        auth: subscription.authSecret,
      },
    },
    JSON.stringify(payload),
    { TTL: 60 * 60 * 24, urgency: "high" },
  );
}

function kickoffLabel(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function buildReminderPayload(
  reminder: Pick<
    ClaimedPushReminder,
    "kind" | "matchday_id" | "missing_count" | "next_kickoff_at" | "round_id"
  >,
): PushPayload {
  const noun = reminder.missing_count === 1 ? "Tipp fehlt" : "Tipps fehlen";
  return {
    badgeCount: reminder.missing_count,
    title: `${reminder.missing_count} ${noun} noch`,
    body:
      reminder.kind === "final_60m"
        ? "Der nächste Anpfiff ist in weniger als einer Stunde."
        : `Nächster Anpfiff: ${kickoffLabel(reminder.next_kickoff_at)} Uhr.`,
    url: `/rounds/${reminder.round_id}/predictions?matchday=${reminder.matchday_id}`,
    tag: `missing-tips-${reminder.round_id}-${reminder.matchday_id}-${reminder.kind}`,
  };
}

export function buildTestPayload(): PushPayload {
  return {
    title: "Benachrichtigungen sind aktiv",
    body: "A-KlassenHoiz kann dich auf diesem Gerät an offene Tipps erinnern.",
    url: "/profile",
    tag: "push-test",
  };
}

export function pushErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) return undefined;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return typeof statusCode === "number" ? statusCode : undefined;
}

export function pushErrorCode(error: unknown): string {
  const status = pushErrorStatus(error);
  if (status) return `web-push-${status}`;
  return error instanceof Error ? error.name.slice(0, 80) : "web-push-unknown";
}

export function isExpiredPushSubscription(error: unknown): boolean {
  const status = pushErrorStatus(error);
  return status === 404 || status === 410;
}

export function reminderKindLabel(kind: PushReminderKind): string {
  return kind === "final_60m" ? "Letzte Erinnerung" : "Frühe Erinnerung";
}
