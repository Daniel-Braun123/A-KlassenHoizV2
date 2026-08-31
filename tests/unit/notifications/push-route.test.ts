import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  sendWebPush: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    schema: () => ({ rpc: mocks.rpc }),
  }),
}));

vi.mock("@/features/notifications/push-server", async (importOriginal) => {
  const original = (await importOriginal()) as object;
  return {
    ...original,
    pushConfigurationAvailable: () => true,
    sendWebPush: mocks.sendWebPush,
  };
});

import { POST } from "@/app/api/push/reminders/route";

const originalEnvironment = { ...process.env };

describe("push reminder route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.test";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    process.env["SUPABASE_" + "SECRET_KEY"] = "example-secret-key";
    process.env.PUSH_CRON_SECRET = "expected-cron-secret-with-at-least-32-characters";
  });

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it("rejects requests without the scheduler bearer secret", async () => {
    const response = await POST(
      new Request("https://app.example.test/api/push/reminders", { method: "POST" }),
    );
    expect(response.status).toBe(401);
  });

  it("compares a wrong same-length secret without accepting it", async () => {
    const expected = process.env.PUSH_CRON_SECRET!;
    const response = await POST(
      new Request("https://app.example.test/api/push/reminders", {
        method: "POST",
        headers: { authorization: `Bearer ${"x".repeat(expected.length)}` },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("claims and delivers reminders together with matchday lifecycle events", async () => {
    mocks.sendWebPush.mockResolvedValue(undefined);
    mocks.rpc.mockImplementation(async (name: string) => {
      if (name === "claim_due_push_reminders") {
        return {
          data: [
            {
              auth_secret: "reminder-auth",
              delivery_id: "10000000-0000-4000-8000-000000000001",
              endpoint: "https://push.example.test/reminder",
              kind: "advance_24h",
              matchday_id: "20000000-0000-4000-8000-000000000001",
              missing_count: 1,
              next_kickoff_at: "2026-09-01T17:00:00.000Z",
              p256dh_key: "reminder-key",
              round_id: "30000000-0000-4000-8000-000000000001",
              subscription_id: "40000000-0000-4000-8000-000000000001",
            },
          ],
          error: null,
        };
      }
      if (name === "claim_due_push_events") {
        return {
          data: [
            {
              auth_secret: "event-auth",
              delivery_id: "10000000-0000-4000-8000-000000000002",
              endpoint: "https://push.example.test/event",
              kind: "matchday_evaluated",
              matchday_id: "20000000-0000-4000-8000-000000000002",
              matchday_number: 2,
              matchday_points: 4,
              overall_rank: 1,
              p256dh_key: "event-key",
              round_id: "30000000-0000-4000-8000-000000000001",
              subscription_id: "40000000-0000-4000-8000-000000000002",
            },
          ],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const response = await POST(
      new Request("https://app.example.test/api/push/reminders", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.PUSH_CRON_SECRET}` },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      claimed: 2,
      reminders: 1,
      events: 1,
      sent: 2,
      failed: 0,
      expired: 0,
    });
    expect(mocks.sendWebPush).toHaveBeenCalledTimes(2);
    expect(mocks.sendWebPush.mock.calls[1]?.[1]).toMatchObject({
      title: "Spieltag 2 ist ausgewertet",
      body: "4 Punkte für dich · aktuell Platz 1 in deiner Tipprunde.",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("claim_due_push_reminders", { p_limit: 100 });
    expect(mocks.rpc).toHaveBeenCalledWith("claim_due_push_events", { p_limit: 100 });
    expect(mocks.rpc).toHaveBeenCalledWith("complete_push_delivery", {
      p_delivery_id: "10000000-0000-4000-8000-000000000002",
      p_succeeded: true,
    });
  });
});
