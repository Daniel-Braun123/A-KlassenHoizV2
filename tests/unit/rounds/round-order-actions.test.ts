import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationError } from "@/lib/actions/errors";
const mocks = vi.hoisted(() => ({ save: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/features/rounds/order-service", () => ({ saveRoundOrder: mocks.save }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { saveRoundOrderAction } from "@/features/rounds/order-actions";

describe("round order action", () => {
  beforeEach(() => vi.resetAllMocks());
  it("refreshes the overview only after successfully saving", async () => {
    mocks.save.mockResolvedValue(undefined);
    expect(await saveRoundOrderAction(["id"])).toEqual({ ok: true, data: null });
    expect(mocks.save).toHaveBeenCalledWith(["id"]);
    expect(mocks.revalidate).toHaveBeenCalledWith("/start");
  });
  it("returns a public error and keeps the view intact on failure", async () => {
    mocks.save.mockRejectedValue(new ApplicationError("UNAVAILABLE", "Private internal error"));
    const result = await saveRoundOrderAction(["id"]);
    expect(result).toMatchObject({ ok: false, error: { code: "UNAVAILABLE" } });
    expect(JSON.stringify(result)).not.toContain("Private internal");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
