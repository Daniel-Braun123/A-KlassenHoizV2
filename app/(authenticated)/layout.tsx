import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { AppBadgeSync } from "@/components/notifications/app-badge-sync";
import { getMyProfile } from "@/features/profile/service";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const profile = await getMyProfile();
  if (!profile || profile.status !== "active") redirect("/login" as Route);
  return (
    <>
      <AppBadgeSync />
      {children}
    </>
  );
}
