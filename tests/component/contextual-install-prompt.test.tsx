import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ContextualInstallPrompt } from "@/components/pwa/contextual-install-prompt";
import { INSTALL_PROMPT_DECISION_KEY } from "@/features/pwa/install-client";

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterAll(() => {
  HTMLDialogElement.prototype.showModal = originalShowModal;
  HTMLDialogElement.prototype.close = originalClose;
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function dispatchInstallEvent(outcome: "accepted" | "dismissed" = "accepted") {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = new Event("beforeinstallprompt", { cancelable: true });
  Object.assign(event, {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  });
  window.dispatchEvent(event);
  return prompt;
}

describe("ContextualInstallPrompt", () => {
  it("wartet trotz verfügbarer Installation auf eine erfolgreiche Tippabgabe", () => {
    render(<ContextualInstallPrompt trigger={0} />);
    dispatchInstallEvent();

    expect(screen.queryByRole("dialog", { name: "A-KlassenHoiz installieren" })).toBeNull();
  });

  it("öffnet den nativen Installationsdialog und merkt die Entscheidung", async () => {
    const { rerender } = render(<ContextualInstallPrompt trigger={0} />);
    const prompt = dispatchInstallEvent();
    rerender(<ContextualInstallPrompt trigger={1} />);

    expect(await screen.findByRole("dialog", { name: "A-KlassenHoiz installieren" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "App installieren" }));

    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    expect(window.localStorage.getItem(INSTALL_PROMPT_DECISION_KEY)).toBe("installed");
  });

  it("erscheint nach einer Ablehnung nicht erneut", async () => {
    const first = render(<ContextualInstallPrompt trigger={0} />);
    dispatchInstallEvent();
    first.rerender(<ContextualInstallPrompt trigger={1} />);
    fireEvent.click(await screen.findByRole("button", { name: "Nicht jetzt" }));
    first.unmount();

    render(<ContextualInstallPrompt trigger={2} />);
    dispatchInstallEvent();

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "A-KlassenHoiz installieren" })).toBeNull();
    });
    expect(window.localStorage.getItem(INSTALL_PROMPT_DECISION_KEY)).toBe("dismissed");
  });

  it("zeigt auf iOS die passenden Schritte statt eines wirkungslosen Installieren-Buttons", async () => {
    vi.spyOn(window.navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
    );
    render(<ContextualInstallPrompt trigger={1} />);

    expect(await screen.findByRole("dialog", { name: "A-KlassenHoiz installieren" })).toBeVisible();
    expect(screen.getByText("Teilen", { exact: true })).toBeVisible();
    expect(screen.getByText("Zum Home-Bildschirm", { exact: true })).toBeVisible();
    expect(screen.queryByRole("button", { name: "App installieren" })).toBeNull();
  });

  it("erscheint nicht, wenn die Anwendung bereits eigenständig läuft", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }) as MediaQueryList),
    );
    render(<ContextualInstallPrompt trigger={1} />);
    dispatchInstallEvent();

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "A-KlassenHoiz installieren" })).toBeNull();
    });
    expect(window.localStorage.getItem(INSTALL_PROMPT_DECISION_KEY)).toBe("installed");
  });
});
