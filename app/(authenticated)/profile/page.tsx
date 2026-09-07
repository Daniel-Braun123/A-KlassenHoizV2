import { redirect } from "next/navigation";
import { AccountDetailsView } from "@/components/profile/account-details";
import { getMyProfile, getMyAccountDetails } from "@/features/profile/service";

export default async function ProfilePage() {
  const [profile, account] = await Promise.all([getMyProfile(), getMyAccountDetails()]);
  if (!profile || profile.status !== "active" || !account) redirect("/login?next=/profile");
  return (
    <AccountDetailsView
      account={{ ...account, displayName: profile.display_name ?? "Dein Profil" }}
    />
  );
}
