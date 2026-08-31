import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { readServerEnvironment } from "@/lib/config/env";
import { writeOperationalLog } from "@/lib/observability/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildEventPayload,
  buildReminderPayload,
  isExpiredPushSubscription,
  pushConfigurationAvailable,
  pushErrorCode,
  sendWebPush,
} from "@/features/notifications/push-server";
import type { ClaimedPushEvent, ClaimedPushReminder } from "@/features/notifications/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request, expectedSecret: string): boolean {
  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const actualBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expectedSecret);
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

type ClaimedPushDelivery = ClaimedPushReminder | ClaimedPushEvent;

function isMatchdayEvent(delivery: ClaimedPushDelivery): delivery is ClaimedPushEvent {
  return delivery.kind === "matchday_published" || delivery.kind === "matchday_evaluated";
}

async function deliver(delivery: ClaimedPushDelivery): Promise<"sent" | "failed" | "expired"> {
  const supabase = createSupabaseAdminClient();
  try {
    await sendWebPush(
      {
        endpoint: delivery.endpoint,
        p256dhKey: delivery.p256dh_key,
        authSecret: delivery.auth_secret,
      },
      isMatchdayEvent(delivery) ? buildEventPayload(delivery) : buildReminderPayload(delivery),
    );
    const { error } = await supabase.schema("api").rpc("complete_push_delivery", {
      p_delivery_id: delivery.delivery_id,
      p_succeeded: true,
    });
    if (error) throw error;
    return "sent";
  } catch (error) {
    if (isExpiredPushSubscription(error)) {
      const { error: deletionError } = await supabase
        .schema("api")
        .rpc("delete_push_subscription", { p_subscription_id: delivery.subscription_id });
      if (deletionError) throw deletionError;
      return "expired";
    }
    const { error: completionError } = await supabase.schema("api").rpc("complete_push_delivery", {
      p_delivery_id: delivery.delivery_id,
      p_succeeded: false,
      p_error_code: pushErrorCode(error),
    });
    if (completionError) throw completionError;
    return "failed";
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const correlationId = crypto.randomUUID();
  const environment = readServerEnvironment();
  if (!environment.PUSH_CRON_SECRET || !authorized(request, environment.PUSH_CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!environment.SUPABASE_SECRET_KEY || !pushConfigurationAvailable()) {
    return NextResponse.json({ error: "Push service unavailable" }, { status: 503 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [reminderClaim, eventClaim] = await Promise.all([
      supabase.schema("api").rpc("claim_due_push_reminders", { p_limit: 100 }),
      supabase.schema("api").rpc("claim_due_push_events", { p_limit: 100 }),
    ]);
    if (reminderClaim.error) throw reminderClaim.error;
    if (eventClaim.error) throw eventClaim.error;

    const reminders = reminderClaim.data ?? [];
    const events = eventClaim.data ?? [];
    const deliveries: ClaimedPushDelivery[] = [...reminders, ...events];
    const results: Array<"sent" | "failed" | "expired"> = [];
    for (let index = 0; index < deliveries.length; index += 10) {
      const batch = deliveries.slice(index, index + 10);
      results.push(...(await Promise.all(batch.map(deliver))));
    }

    const counts = {
      claimed: deliveries.length,
      reminders: reminders.length,
      events: events.length,
      sent: results.filter((value) => value === "sent").length,
      failed: results.filter((value) => value === "failed").length,
      expired: results.filter((value) => value === "expired").length,
    };
    writeOperationalLog({
      level: counts.failed > 0 ? "warn" : "info",
      code: "push.reminders.completed",
      correlationId,
      route: "/api/push/reminders",
      status: 200,
      durationMs: Date.now() - startedAt,
      details: counts,
    });
    return NextResponse.json(counts);
  } catch (error) {
    writeOperationalLog({
      level: "error",
      code: "push.reminders.failed",
      correlationId,
      route: "/api/push/reminders",
      status: 500,
      durationMs: Date.now() - startedAt,
      details: { error },
    });
    return NextResponse.json({ error: "Push delivery failed" }, { status: 500 });
  }
}
