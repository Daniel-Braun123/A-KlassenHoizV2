export type PushBrowserStatus = "available" | "install-required" | "unsupported";

export const OPEN_TIP_BADGE_REFRESH_EVENT = "aklassenhoiz:open-tip-badge-refresh";

const PUSH_SUBSCRIPTION_SYNC_KEY_PREFIX = "ak-push-subscription-sync:v1:";

type BadgeNavigator = Navigator & {
  clearAppBadge?: () => Promise<void>;
  setAppBadge?: (contents?: number) => Promise<void>;
};

function badgeNavigator(): BadgeNavigator | null {
  return typeof navigator === "undefined" ? null : (navigator as BadgeNavigator);
}

export async function clearOpenTipAppBadge(): Promise<void> {
  const currentNavigator = badgeNavigator();
  if (typeof currentNavigator?.clearAppBadge !== "function") return;
  try {
    await currentNavigator.clearAppBadge();
  } catch {
    // Badge availability and permission are controlled by the operating system.
  }
}

export async function setOpenTipAppBadge(count: number): Promise<void> {
  const normalizedCount = Math.max(0, Math.floor(count));
  if (normalizedCount === 0) {
    await clearOpenTipAppBadge();
    return;
  }

  const currentNavigator = badgeNavigator();
  if (typeof currentNavigator?.setAppBadge !== "function") return;
  try {
    await currentNavigator.setAppBadge(normalizedCount);
  } catch {
    // Badge support may exist while the user has disabled badges for the app.
  }
}

export function requestOpenTipBadgeRefresh(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_TIP_BADGE_REFRESH_EVENT));
}

function pushSubscriptionSyncKey(userId: string): string {
  return `${PUSH_SUBSCRIPTION_SYNC_KEY_PREFIX}${userId}`;
}

export function wasPushSubscriptionSynced(userId: string): boolean {
  try {
    return window.sessionStorage.getItem(pushSubscriptionSyncKey(userId)) === "synced";
  } catch {
    return false;
  }
}

export function markPushSubscriptionSynced(userId: string): void {
  try {
    window.sessionStorage.setItem(pushSubscriptionSyncKey(userId), "synced");
  } catch {
    // Session storage can be unavailable in strict privacy modes; syncing remains functional.
  }
}

export function clearPushSubscriptionSync(userId: string): void {
  try {
    window.sessionStorage.removeItem(pushSubscriptionSyncKey(userId));
  } catch {
    // The next login simply performs the idempotent server sync again.
  }
}

function isIosDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function getPushBrowserStatus(): PushBrowserStatus {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window) ||
    !window.isSecureContext
  ) {
    return "unsupported";
  }
  if (isIosDevice() && !isStandalone()) return "install-required";
  return "available";
}

function publicKeyBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0));
  return bytes.buffer;
}

function keyToBase64Url(value: ArrayBuffer | null): string | null {
  if (!value) return null;
  let binary = "";
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function pushSubscriptionInput(subscription: PushSubscription) {
  const p256dhKey = keyToBase64Url(subscription.getKey("p256dh"));
  const authSecret = keyToBase64Url(subscription.getKey("auth"));
  if (!p256dhKey || !authSecret) throw new Error("Subscription keys unavailable");
  return {
    endpoint: subscription.endpoint,
    p256dhKey,
    authSecret,
    userAgent: navigator.userAgent,
  };
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  const registration =
    (await navigator.serviceWorker.getRegistration("/")) ??
    (await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }));
  return registration.pushManager.getSubscription();
}

export async function subscribeBrowserToPush(publicVapidKey: string): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  return (
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKeyBuffer(publicVapidKey),
    }))
  );
}
