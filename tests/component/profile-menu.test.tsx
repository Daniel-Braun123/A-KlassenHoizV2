import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProfileMenu } from "@/components/patterns/profile-menu";

function installMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("ProfileMenu", () => {
  beforeEach(() => {
    installMatchMedia(false);
    window.localStorage.clear();
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.themePreference = "system";
  });

  afterEach(() => {
    cleanup();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.themePreference;
  });

  it("keeps account actions inside one profile disclosure", () => {
    render(<ProfileMenu accountEnabled accountLabel="Privates Konto" displayName="Daniel" />);

    expect(
      screen.queryByRole("dialog", { name: "Profil und Darstellung" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Profilmenü öffnen" }));

    expect(screen.getByRole("dialog", { name: "Profil und Darstellung" })).toBeVisible();
    expect(screen.getByRole("button", { name: "System" })).toHaveFocus();
    expect(screen.getByText("Daniel")).toBeVisible();
    expect(screen.getByRole("link", { name: /Konto & Datenschutz/ })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("button", { name: "Abmelden" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /Verwaltung/i })).not.toBeInTheDocument();
  });

  it("applies and persists an explicit color theme", async () => {
    render(<ProfileMenu accountEnabled accountLabel="Privates Konto" displayName="Daniel" />);
    fireEvent.click(screen.getByRole("button", { name: "Profilmenü öffnen" }));
    fireEvent.click(screen.getByRole("button", { name: "Dunkel" }));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(document.documentElement.dataset.themePreference).toBe("dark");
    expect(window.localStorage.getItem("ak-theme:v1")).toBe("dark");
    expect(screen.getByRole("button", { name: "Dunkel" })).toHaveAttribute("aria-pressed", "true");
  });

  it("closes on Escape and restores focus to the trigger", () => {
    render(<ProfileMenu accountEnabled accountLabel="Privates Konto" displayName="Daniel" />);
    fireEvent.click(screen.getByRole("button", { name: "Profilmenü öffnen" }));
    fireEvent.keyDown(document, { key: "Escape" });

    const trigger = screen.getByRole("button", { name: "Profilmenü öffnen" });
    expect(
      screen.queryByRole("dialog", { name: "Profil und Darstellung" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps logout available when the account profile is inactive", () => {
    render(
      <ProfileMenu
        accountEnabled={false}
        accountLabel="Konto nicht aktiv"
        displayName="Dein Konto"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Profilmenü öffnen" }));

    expect(screen.getByText("Konto nicht aktiv")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Konto & Datenschutz/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abmelden" })).toBeVisible();
  });

  it("closes when focus leaves the profile disclosure", () => {
    render(
      <>
        <ProfileMenu accountEnabled accountLabel="Privates Konto" displayName="Daniel" />
        <button type="button">Außen</button>
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Profilmenü öffnen" }));
    fireEvent.blur(screen.getByRole("button", { name: "System" }), {
      relatedTarget: screen.getByRole("button", { name: "Außen" }),
    });

    expect(
      screen.queryByRole("dialog", { name: "Profil und Darstellung" }),
    ).not.toBeInTheDocument();
  });

  it("stays open when mobile WebKit reports no related focus target", () => {
    render(<ProfileMenu accountEnabled accountLabel="Privates Konto" displayName="Daniel" />);
    fireEvent.click(screen.getByRole("button", { name: "Profilmenü öffnen" }));
    fireEvent.blur(screen.getByRole("button", { name: "System" }), { relatedTarget: null });

    expect(screen.getByRole("dialog", { name: "Profil und Darstellung" })).toBeVisible();
  });
});
