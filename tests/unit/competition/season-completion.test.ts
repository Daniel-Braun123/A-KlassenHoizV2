import { describe, expect, it } from "vitest";
import {
  seasonCompletionBlockers,
  type SeasonCompletion,
} from "@/features/competition/season-completion";
const ready: SeasonCompletion = {
  id: "id",
  version: 1,
  status: "published",
  total_matches: 5,
  missing_results: 0,
  unfinished_matches: 0,
  unresolved_matches: 0,
  unpublished_matchdays: 0,
};
describe("season completion eligibility", () => {
  it("allows an evaluated season", () => expect(seasonCompletionBlockers(ready)).toEqual([]));
  it("blocks empty seasons", () =>
    expect(seasonCompletionBlockers({ ...ready, total_matches: 0 })).toContain(
      "Es ist noch kein Spiel vorhanden.",
    ));
  it("explains pending results, future matches and draft matchdays", () =>
    expect(
      seasonCompletionBlockers({
        ...ready,
        missing_results: 2,
        unfinished_matches: 1,
        unpublished_matchdays: 1,
      }),
    ).toHaveLength(3));
  it("blocks draft and archived seasons", () => {
    for (const status of ["draft", "archived"] as const)
      expect(seasonCompletionBlockers({ ...ready, status })).not.toEqual([]);
  });
});
