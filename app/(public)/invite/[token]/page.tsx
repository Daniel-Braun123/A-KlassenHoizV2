import type { Route } from "next";
import { Link } from "@/components/ui/link";
import { JoinRoundForm } from "@/components/rounds/join-round-form";
import { getInvitationPreview } from "@/features/invitations/service";
import { invitationReturnPath } from "@/features/invitations/auth-return";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let preview;
  try {
    preview = await getInvitationPreview(token);
  } catch {
    return (
      <section className="content-page">
        <div className="status-state status-state--locked">
          <span className="status-state__symbol" aria-hidden="true">
            !
          </span>
          <div>
            <h1>Einladung nicht verfügbar</h1>
            <p>
              Der Link ist abgelaufen, widerrufen oder ungültig. Bitte den Besitzer um einen neuen
              Link.
            </p>
          </div>
        </div>
      </section>
    );
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const next = invitationReturnPath(token);
  return (
    <section className="content-page">
      <div className="content-page__intro">
        <p className="product-mark">Persönliche Einladung</p>
        <h1>{preview.roundName}</h1>
        <p>
          {preview.leagueName} · {preview.seasonLabel}. Der Link ist bis{" "}
          {new Date(preview.expiresAt).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}{" "}
          gültig.
        </p>
      </div>
      {data?.claims.sub ? (
        <JoinRoundForm token={token} />
      ) : (
        <div className="invitation-auth">
          <h2>Melde dich an, um beizutreten</h2>
          <p>Dein Einladungskontext bleibt erhalten.</p>
          <div className="page-actions">
            <Link href={`/login?next=${encodeURIComponent(next)}` as Route} variant="button">
              Anmelden
            </Link>
            <Link href={`/register?next=${encodeURIComponent(next)}` as Route}>
              Konto erstellen
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
