import type { Route } from "next";
import { redirect } from "next/navigation";
import { AccountNavigation } from "@/components/patterns/account-navigation";
import { getMyProfile } from "@/features/profile/service";
export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const profile = await getMyProfile();
  if (!profile || profile.status !== "active") redirect("/login" as Route);
  return (
    <>
      <AccountNavigation isAppAdmin={profile.app_role === "app_admin"} />
      {children}
    </>
  );
}
