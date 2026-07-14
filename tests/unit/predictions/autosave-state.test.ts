import { describe, expect, it } from "vitest";
import { initialAutosaveState, reduceAutosaveState } from "@/features/predictions/autosave-state";
describe("prediction autosave state", () => {
  it("never reports saved before server confirmation", () => {
    const dirty = reduceAutosaveState(initialAutosaveState, { type: "changed" });
    expect(dirty.status).toBe("incomplete");
    const saving = reduceAutosaveState(dirty, { type: "saving", requestId: "one" });
    expect(saving.status).toBe("saving");
    expect(reduceAutosaveState(saving, { type: "saved", requestId: "stale" }).status).toBe(
      "saving",
    );
    expect(reduceAutosaveState(saving, { type: "saved", requestId: "one" }).status).toBe("saved");
  });
  it("preserves entered values across offline and retry errors", () => {
    const state = reduceAutosaveState(initialAutosaveState, {
      type: "changed",
      homeGoals: 2,
      awayGoals: 1,
    });
    const offline = reduceAutosaveState(state, { type: "offline" });
    expect(offline).toMatchObject({ status: "error", homeGoals: 2, awayGoals: 1 });
    expect(reduceAutosaveState(offline, { type: "retry" })).toMatchObject({
      status: "incomplete",
      homeGoals: 2,
      awayGoals: 1,
    });
  });
  it("locks without losing the last confirmed values", () => {
    expect(
      reduceAutosaveState(
        { ...initialAutosaveState, homeGoals: 1, awayGoals: 1, status: "saved" },
        { type: "locked" },
      ),
    ).toMatchObject({ status: "locked", homeGoals: 1, awayGoals: 1 });
  });
});
