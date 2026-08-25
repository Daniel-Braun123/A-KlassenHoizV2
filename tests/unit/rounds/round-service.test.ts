import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { getMyRound } from "@/features/rounds/service";

const roundId = "10000000-0000-4000-8000-000000000001";

function setupRoundQuery(data: object | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  const schema = vi.fn().mockReturnValue({ from });
  const getClaims = vi.fn().mockResolvedValue({
    data: { claims: { sub: "00000000-0000-4000-8000-000000000003" } },
    error: null,
  });
  mocks.createSupabaseServerClient.mockResolvedValue({ auth: { getClaims }, schema });
  return { eq, from, getClaims, maybeSingle, schema, select };
}

describe("getMyRound", () => {
  beforeEach(() => {
    mocks.createSupabaseServerClient.mockReset();
  });

  it("loads only the requested round instead of fetching the complete round list", async () => {
    const round = { id: roundId, name: "Freunde" };
    const query = setupRoundQuery(round);

    await expect(getMyRound(roundId)).resolves.toEqual(round);
    expect(query.schema).toHaveBeenCalledWith("api");
    expect(query.from).toHaveBeenCalledWith("my_rounds");
    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.eq).toHaveBeenCalledWith("id", roundId);
    expect(query.maybeSingle).toHaveBeenCalledOnce();
    expect(query.getClaims).toHaveBeenCalledOnce();
  });

  it("keeps inaccessible rounds indistinguishable from missing rounds", async () => {
    setupRoundQuery(null);

    await expect(getMyRound(roundId)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
