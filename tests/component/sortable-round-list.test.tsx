import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MyRound } from "@/features/rounds/types";
vi.mock("@/features/rounds/order-actions", () => ({ saveRoundOrderAction: vi.fn() }));
vi.mock("@/components/ui/navigation-pending-indicator", () => ({
  NavigationPendingIndicator: () => null,
}));
import { SortableRoundList } from "@/components/rounds/sortable-round-list";
const rounds = ["Freunde", "Familie", "Verein"].map(
  (name, index) =>
    ({
      id: String(index),
      name,
      league_name: "A-Klasse",
      season_label: "26/27",
      role: "member",
    }) as MyRound,
);
const names = () =>
  within(screen.getByRole("list"))
    .getAllByRole("link")
    .map((link) => link.textContent);
async function moveFirstDown() {
  const link = screen.getAllByRole("link")[0]!;
  link.focus();
  fireEvent.keyDown(link, { code: "Space" });
  // The keyboard sensor attaches its document listener on the next task.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  fireEvent.keyDown(document, { code: "ArrowDown" });
  fireEvent.keyDown(document, { code: "Space" });
}
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    const item = this.closest("li");
    const index = item ? Array.from(item.parentElement!.children).indexOf(item) : 0;
    return {
      x: 0,
      y: index * 100,
      top: index * 100,
      left: 0,
      right: 400,
      bottom: (index + 1) * 100,
      width: 400,
      height: 100,
      toJSON: () => ({}),
    };
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi
      .fn()
      .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe("sortable rounds", () => {
  it("shows updated memberships when the server refreshes the list", () => {
    const { rerender } = render(<SortableRoundList rounds={rounds} />);
    rerender(<SortableRoundList rounds={[rounds[1]!]} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link")).toHaveTextContent("Familie");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("keeps navigation separate and hides sorting for a single round", () => {
    render(<SortableRoundList rounds={[rounds[0]!]} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/rounds/0");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("keeps the membership role separate from truncatable round details", () => {
    render(
      <SortableRoundList
        rounds={[
          {
            ...rounds[0]!,
            name: "Eine besonders lange Tipprundenbezeichnung für kleine Bildschirme",
            league_name: "Eine besonders lange Ligabezeichnung",
            role: "owner",
          },
        ]}
      />,
    );
    expect(screen.getByText("Besitzer")).toHaveClass("round-list__meta-role");
    expect(screen.getByText(/Eine besonders lange Ligabezeichnung/u)).toHaveClass(
      "round-list__meta-primary",
    );
  });
  it("has no sorting buttons and saves keyboard reordering", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true, data: null });
    render(<SortableRoundList rounds={rounds} saveOrder={save} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    await moveFirstDown();
    await waitFor(() => expect(save).toHaveBeenCalledWith(["1", "0", "2"]));
    expect(names()[0]).toContain("Familie");
    expect(await screen.findByText("Reihenfolge gespeichert.")).toBeInTheDocument();
  });
  it("rolls back failed saves and shows an actionable error", async () => {
    const save = vi.fn().mockResolvedValue({
      ok: false,
      error: { code: "UNAVAILABLE", message: "Bitte versuche es erneut." },
    });
    render(<SortableRoundList rounds={rounds} saveOrder={save} />);
    await moveFirstDown();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("nicht gespeichert"));
    expect(names()[0]).toContain("Freunde");
  });
  it("blocks overlapping saves and handles network exceptions", async () => {
    let reject!: (error: Error) => void;
    const save = vi.fn().mockReturnValue(
      new Promise((_resolve, fail) => {
        reject = fail;
      }),
    );
    render(<SortableRoundList rounds={rounds} saveOrder={save} />);
    await moveFirstDown();
    expect(screen.getAllByRole("link")[0]).not.toHaveAttribute("data-sortable", "true");
    await act(async () => reject(new Error("Offline")));
    expect(screen.getByRole("alert")).toHaveTextContent("Offline");
    expect(names()[0]).toContain("Freunde");
    expect(save).toHaveBeenCalledOnce();
  });
  it("starts dragging only after a 300 ms touch hold and suppresses the follow-up click", () => {
    vi.useFakeTimers();
    const { container } = render(<SortableRoundList rounds={rounds} />);
    const link = screen.getAllByRole("link")[0]!;
    fireEvent.touchStart(link, { touches: [{ identifier: 0, clientX: 40, clientY: 50 }] });
    act(() => vi.advanceTimersByTime(299));
    expect(container.querySelector(".sortable-round--overlay")).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(container.querySelector(".sortable-round--overlay")).not.toBeNull();
    fireEvent.touchEnd(link, {
      touches: [],
      changedTouches: [{ identifier: 0, clientX: 40, clientY: 50 }],
    });
    expect(fireEvent.click(link)).toBe(false);
  });
  it("cancels the hold when the finger moves early so scrolling stays available", () => {
    vi.useFakeTimers();
    const { container } = render(<SortableRoundList rounds={rounds} />);
    const link = screen.getAllByRole("link")[0]!;
    fireEvent.touchStart(link, { touches: [{ identifier: 0, clientX: 40, clientY: 50 }] });
    const allowed = fireEvent.touchMove(link, {
      touches: [{ identifier: 0, clientX: 40, clientY: 80 }],
    });
    act(() => vi.advanceTimersByTime(500));
    expect(allowed).toBe(true);
    expect(container.querySelector(".sortable-round--overlay")).toBeNull();
    fireEvent.touchEnd(link, { touches: [] });
  });
  it("does not turn a short tap or multi-touch into a drag", () => {
    vi.useFakeTimers();
    const { container } = render(<SortableRoundList rounds={rounds} />);
    const link = screen.getAllByRole("link")[0]!;
    fireEvent.touchStart(link, { touches: [{ identifier: 0, clientX: 40, clientY: 50 }] });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.touchEnd(link, { touches: [] });
    act(() => vi.advanceTimersByTime(400));
    expect(container.querySelector(".sortable-round--overlay")).toBeNull();
    fireEvent.touchStart(link, {
      touches: [
        { identifier: 0, clientX: 40, clientY: 50 },
        { identifier: 1, clientX: 80, clientY: 50 },
      ],
    });
    act(() => vi.advanceTimersByTime(400));
    expect(container.querySelector(".sortable-round--overlay")).toBeNull();
  });
});
