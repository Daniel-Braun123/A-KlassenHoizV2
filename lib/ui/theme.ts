export type ThemePreference = "system" | "light" | "dark";

export const themeStorageKey = "ak-theme:v1";

let releaseTransitionFrame: number | undefined;

export function isThemePreference(value: string | undefined | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function readThemePreference(): ThemePreference {
  const documentPreference = document.documentElement.dataset.themePreference;
  if (isThemePreference(documentPreference)) return documentPreference;

  try {
    const storedPreference = window.localStorage.getItem(themeStorageKey);
    return isThemePreference(storedPreference) ? storedPreference : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(preference: ThemePreference, persist = true) {
  const theme = resolveTheme(preference);
  const root = document.documentElement;
  if (releaseTransitionFrame !== undefined) window.cancelAnimationFrame(releaseTransitionFrame);
  root.classList.add("theme-switching");
  root.dataset.theme = theme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      "content",
      theme === "dark" ? "oklch(0.155 0.018 155)" : "oklch(0.982 0.007 155)",
    );
  releaseTransitionFrame = window.requestAnimationFrame(() => {
    releaseTransitionFrame = window.requestAnimationFrame(() => {
      root.classList.remove("theme-switching");
      releaseTransitionFrame = undefined;
    });
  });

  if (!persist) return;
  try {
    window.localStorage.setItem(themeStorageKey, preference);
  } catch {
    // The preference still applies for the current document when storage is unavailable.
  }
}
