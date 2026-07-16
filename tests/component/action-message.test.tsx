import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionMessage, SUCCESS_MESSAGE_DURATION_MS } from "@/components/ui/action-message";

afterEach(() => {
  vi.useRealTimers();
});

describe("action feedback", () => {
  it("dismisses successful status messages automatically", () => {
    vi.useFakeTimers();
    render(<ActionMessage state={{ status: "success", message: "Gespeichert." }} />);

    expect(screen.getByRole("status")).toHaveTextContent("Gespeichert.");
    act(() => vi.advanceTimersByTime(SUCCESS_MESSAGE_DURATION_MS));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps error messages visible", () => {
    vi.useFakeTimers();
    render(<ActionMessage state={{ status: "error", message: "Speichern fehlgeschlagen." }} />);

    act(() => vi.advanceTimersByTime(SUCCESS_MESSAGE_DURATION_MS * 2));
    expect(screen.getByRole("alert")).toHaveTextContent("Speichern fehlgeschlagen.");
  });
});
