export type InstallPromptOutcome = "accepted" | "dismissed";

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: InstallPromptOutcome;
    platform?: string;
  }>;
};

export const INSTALL_PROMPT_DECISION_KEY = "ak-pwa-install-prompt:v1";

let deferredInstallPrompt: InstallPromptEvent | null = null;
const installPromptListeners = new Set<() => void>();

export function rememberInstallPrompt(event: InstallPromptEvent | null): void {
  deferredInstallPrompt = event;
  for (const listener of installPromptListeners) listener();
}

export function readInstallPrompt(): InstallPromptEvent | null {
  return deferredInstallPrompt;
}

export function subscribeToInstallPrompt(listener: () => void): () => void {
  installPromptListeners.add(listener);
  return () => installPromptListeners.delete(listener);
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

export function isPwaInstalled(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;

  return (
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    Boolean((navigator as NavigatorWithStandalone).standalone)
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  );
}

export function readInstallPromptDecision(): string | null {
  try {
    return window.localStorage.getItem(INSTALL_PROMPT_DECISION_KEY);
  } catch {
    return null;
  }
}

export function saveInstallPromptDecision(decision: "dismissed" | "installed"): void {
  try {
    window.localStorage.setItem(INSTALL_PROMPT_DECISION_KEY, decision);
  } catch {
    // Installation remains available when storage is unavailable in a strict privacy mode.
  }
}
