import { SettingsView } from "@/components/profile/settings-view";
import { readServerEnvironment } from "@/lib/config/env";

export default function SettingsPage() {
  const environment = readServerEnvironment();
  return <SettingsView publicVapidKey={environment.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />;
}
