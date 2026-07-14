import { describe, expect, it } from "vitest";

import { ApplicationError } from "@/lib/actions/errors";
import { actionFailure, actionSuccess } from "@/lib/actions/result";

describe("action results", () => {
  it("returns typed success data", () => {
    expect(actionSuccess({ id: "fixture" })).toEqual({ ok: true, data: { id: "fixture" } });
  });

  it("maps internal details to neutral public feedback", () => {
    const result = actionFailure(
      new ApplicationError("FORBIDDEN", "private round 42 belongs to someone else"),
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Diese Aktion ist für dich nicht verfügbar.",
      },
    });
    expect(JSON.stringify(result)).not.toContain("round 42");
  });

  it("does not expose unexpected exceptions", () => {
    const result = actionFailure(new Error("database host and secret details"));

    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("database host");
  });
});
