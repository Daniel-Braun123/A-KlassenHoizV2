import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/push/reminders/route";

const originalEnvironment = { ...process.env };

describe("push reminder route", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.example.test";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
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
});
