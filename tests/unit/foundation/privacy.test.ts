import { describe, expect, it } from "vitest";

import { redactUnknown } from "@/lib/observability/redact";

describe("privacy-safe redaction", () => {
  it("redacts sensitive keys recursively", () => {
    expect(
      redactUnknown({
        email: "friend@example.test",
        nested: { invitationToken: "plain-token", roundName: "Freundeskreis" },
      }),
    ).toEqual({
      email: "[REDACTED]",
      nested: { invitationToken: "[REDACTED]", roundName: "[REDACTED]" },
    });
  });

  it("redacts credential-shaped strings even under neutral keys", () => {
    const value = redactUnknown({ value: "mail friend@example.test and sb_secret_abcdefghijkl" });
    expect(JSON.stringify(value)).not.toContain("friend@example.test");
    expect(JSON.stringify(value)).not.toContain("sb_secret_");
  });

  it("bounds recursive payload depth", () => {
    const value = redactUnknown({ a: { b: { c: { d: { e: { f: "hidden" } } } } } });
    expect(JSON.stringify(value)).toContain("MAX_DEPTH");
  });
});
