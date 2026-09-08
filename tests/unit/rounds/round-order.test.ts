import { describe, expect, it } from "vitest";
import { applyRoundOrder } from "@/features/rounds/order";

describe("personal round order", () => {
  const rounds = [{ id: "a" }, { id: "b" }, { id: "c" }];
  it("keeps the default for missing or invalid preferences", () => {
    for (const preference of [null, undefined, "a", {}, []]) {
      expect(applyRoundOrder(rounds, preference)).toEqual(rounds);
    }
  });
  it("restores the saved order without mutating the input", () => {
    expect(applyRoundOrder(rounds, ["c", "a", "b"])).toEqual([rounds[2], rounds[0], rounds[1]]);
    expect(rounds.map((round) => round.id)).toEqual(["a", "b", "c"]);
  });
  it("ignores removed rounds, duplicate and invalid ids and appends new rounds", () => {
    expect(applyRoundOrder(rounds, ["removed", "b", null, "b", 3])).toEqual([
      rounds[1],
      rounds[0],
      rounds[2],
    ]);
  });
});
