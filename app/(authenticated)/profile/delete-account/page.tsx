import { redirect } from "next/navigation";
import { PageBackLink } from "@/components/patterns/page-back-link";
import { DeleteAccountForm } from "@/components/profile/delete-account-form";
import { hasGoogleDeletionVerification } from "@/features/privacy/reauthentication";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DeleteAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ verification?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) redirect("/login?next=%2Fprofile%2Fdelete-account");
  const google = Boolean(data.user.identities?.some((identity) => identity.provider === "google"));
  const [verified, params] = await Promise.all([
    google ? hasGoogleDeletionVerification(supabase, data.user.id) : false,
    searchParams,
  ]);
  return (
    <section className="content-page">
      <div className="content-page__heading">
        <PageBackLink accessibleLabel="Zurück zum Konto" href="/profile" label="Konto" />
        <div className="content-page__intro">
          <p className="product-mark">Datenschutz</p>
          <h1>Konto löschen</h1>
          <p>
            Du musst zuerst den Besitz jeder aktiven Tipprunde übertragen oder die Runde endgültig
            löschen.
          </p>
        </div>
      </div>
      <DeleteAccountForm
        google={google}
        verified={verified}
        email={data.user.email}
        verificationError={params.verification === "error"}
      />
    </section>
  );
}
