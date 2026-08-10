export type PushBrowserStatus = "available" | "install-required" | "unsupported";

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
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export async function subscribeBrowserToPush(publicVapidKey: string): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  return (
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKeyBuffer(publicVapidKey),
    }))
  );
}
