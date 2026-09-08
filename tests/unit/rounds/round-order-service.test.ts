import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.create }));
import { getRoundOrder, saveRoundOrder } from "@/features/rounds/order-service";
const a = "10000000-0000-4000-8000-000000000001";
const b = "10000000-0000-4000-8000-000000000002";
function setup() {
  const getUser = vi
    .fn()
    .mockResolvedValue({
      data: { user: { id: "user", user_metadata: { round_order: [b, a], name: "Test" } } },
      error: null,
    });
  const updateUser = vi.fn().mockResolvedValue({ error: null });
  const select = vi.fn().mockResolvedValue({ data: [{ id: a }, { id: b }], error: null });
  const from = vi.fn().mockReturnValue({ select });
  mocks.create.mockResolvedValue({
    auth: { getUser, updateUser },
    schema: vi.fn().mockReturnValue({ from }),
  });
  return { getUser, updateUser, select, from };
}
describe("round order persistence", () => {
  beforeEach(() => vi.clearAllMocks());
  it("reads current account metadata, not a stale session preference", async () => {
    const mock = setup();
    expect(await getRoundOrder()).toEqual([b, a]);
    expect(mock.getUser).toHaveBeenCalledOnce();
  });
  it("saves only the presentation preference after checking memberships", async () => {
    const mock = setup();
    await saveRoundOrder([b, a]);
    expect(mock.from).toHaveBeenCalledWith("my_rounds");
    expect(mock.updateUser).toHaveBeenCalledWith({ data: { round_order: [b, a] } });
  });
  it.each([[], [a, a], ["invalid"], null, Array(501).fill(a)])(
    "rejects invalid input %j",
    async (input) => {
      const mock = setup();
      await expect(saveRoundOrder(input)).rejects.toMatchObject({ code: "INVALID_INPUT" });
      expect(mock.updateUser).not.toHaveBeenCalled();
    },
  );
  it("does not save unauthenticated requests", async () => {
    const mock = setup();
    mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(saveRoundOrder([a, b])).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(mock.updateUser).not.toHaveBeenCalled();
  });
  it("rejects removed or other users' rounds", async () => {
    const mock = setup();
    mock.select.mockResolvedValue({ data: [{ id: a }], error: null });
    await expect(saveRoundOrder([b, a])).rejects.toMatchObject({ code: "CONFLICT" });
    expect(mock.updateUser).not.toHaveBeenCalled();
  });
  it("does not save if the membership check fails", async () => {
    const mock = setup();
    mock.select.mockResolvedValue({ data: null, error: { message: "offline" } });
    await expect(saveRoundOrder([b, a])).rejects.toMatchObject({ code: "UNAVAILABLE" });
    expect(mock.updateUser).not.toHaveBeenCalled();
  });
  it("reports storage failures instead of claiming success", async () => {
    const mock = setup();
    mock.updateUser.mockResolvedValue({ error: { message: "offline" } });
    await expect(saveRoundOrder([b, a])).rejects.toMatchObject({ code: "UNAVAILABLE" });
  });
});
