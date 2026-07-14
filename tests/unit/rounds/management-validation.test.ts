import { describe, expect, it } from "vitest";
import {
  deleteAccountSchema,
  hardDeleteRoundSchema,
  transferOwnershipSchema,
  updateNicknameSchema,
} from "@/features/rounds/management-schemas";

const uuid = "00000000-0000-4000-8000-000000000001";
describe("round management validation", () => {
  it("trims nicknames and rejects empty values", () => {
    expect(updateNicknameSchema.parse({ roundId: uuid, nickname: "  Kumpel  " }).nickname).toBe(
      "Kumpel",
    );
    expect(() => updateNicknameSchema.parse({ roundId: uuid, nickname: "   " })).toThrow();
  });
  it("requires a positive version and distinct target input", () => {
    expect(
      transferOwnershipSchema.parse({
        roundId: uuid,
        targetMembershipId: uuid,
        expectedVersion: "2",
      }).expectedVersion,
    ).toBe(2);
    expect(() =>
      transferOwnershipSchema.parse({
        roundId: uuid,
        targetMembershipId: uuid,
        expectedVersion: 0,
      }),
    ).toThrow();
  });
  it("requires the exact, case-sensitive round name for hard delete", () => {
    expect(
      hardDeleteRoundSchema.safeParse({
        roundId: uuid,
        expectedVersion: 1,
        roundName: "Freunde",
        confirmationName: "freunde",
      }).success,
    ).toBe(false);
    expect(
      hardDeleteRoundSchema.safeParse({
        roundId: uuid,
        expectedVersion: 1,
        roundName: "Freunde",
        confirmationName: "Freunde",
      }).success,
    ).toBe(true);
  });
  it("requires explicit account deletion phrase and password", () => {
    expect(
      deleteAccountSchema.safeParse({ confirmation: "KONTO LÖSCHEN", password: "LocalFixture42!" })
        .success,
    ).toBe(true);
    expect(
      deleteAccountSchema.safeParse({ confirmation: "löschen", password: "LocalFixture42!" })
        .success,
    ).toBe(false);
  });
});
