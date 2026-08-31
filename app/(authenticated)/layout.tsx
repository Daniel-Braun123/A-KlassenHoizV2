import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { AppBadgeSync } from "@/components/notifications/app-badge-sync";
import { PushSubscriptionSync } from "@/components/notifications/push-subscription-sync";
import { getMyProfile } from "@/features/profile/service";
import { readServerEnvironment } from "@/lib/config/env";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const profile = await getMyProfile();
  if (!profile || profile.status !== "active" || !profile.user_id) redirect("/login" as Route);
  const pushConfigured = Boolean(readServerEnvironment().NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  return (
    <>
      <AppBadgeSync />
      {pushConfigured && profile.app_role === "user" ? (
        <PushSubscriptionSync userId={profile.user_id} />
      ) : null}
      {children}
    </>
  );
}
