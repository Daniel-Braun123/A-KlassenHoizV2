import { describe, expect, it } from "vitest";

import {
  goalSchema,
  idempotencyKeySchema,
  paginationSchema,
  trimmedTextSchema,
} from "@/lib/validation/common";

describe("common validation", () => {
  it("trims bounded human text", () => {
    expect(trimmedTextSchema(1, 10).parse("  Hoiz  ")).toBe("Hoiz");
  });

  it("accepts only complete goal values from 0 to 99", () => {
    expect(goalSchema.parse(0)).toBe(0);
    expect(goalSchema.parse(99)).toBe(99);
    expect(() => goalSchema.parse(100)).toThrow();
    expect(() => goalSchema.parse(1.5)).toThrow();
  });

  it("bounds idempotency keys and pagination", () => {
    expect(idempotencyKeySchema.parse("fixture_key-1234")).toBe("fixture_key-1234");
    expect(() => idempotencyKeySchema.parse("short")).toThrow();
    expect(paginationSchema.parse({})).toEqual({ limit: 25 });
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });
});
