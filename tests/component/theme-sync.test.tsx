import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeSync } from "@/components/patterns/theme-sync";

describe("ThemeSync", () => {
  let dark = false;
  let changeListener: (() => void) | undefined;

  beforeEach(() => {
    dark = false;
    changeListener = undefined;
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.themePreference = "system";
    const themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    document.head.append(themeColor);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        get matches() {
          return dark;
        },
        media: "(prefers-color-scheme: dark)",
        onchange: null,
        addEventListener: vi.fn((_type: string, listener: () => void) => {
          changeListener = listener;
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    document.querySelector('meta[name="theme-color"]')?.remove();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.themePreference;
  });

  it("follows a live operating-system theme change on public pages", () => {
    render(<ThemeSync />);
    expect(document.documentElement.dataset.theme).toBe("light");

    act(() => {
      dark = true;
      changeListener?.();
    });

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "oklch(0.155 0.018 155)",
    );
  });
});
