import { Link } from "@/components/ui/link";
import { PageBackLink } from "@/components/patterns/page-back-link";

export type AccountDetails = Readonly<{
  displayName: string;
  email: string | null;
  createdAt: string;
  emailConfirmed: boolean;
  providers: string[];
}>;

export function AccountDetailsView({ account }: Readonly<{ account: AccountDetails }>) {
  const createdDate = new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(new Date(account.createdAt));
  const providerLabels = account.providers.map((provider) =>
    provider === "google" ? "Google" : provider === "email" ? "E-Mail" : provider,
  );
  return (
    <section
      className="content-page content-page--compact profile-page"
      aria-labelledby="account-title"
    >
      <div className="content-page__heading">
        <PageBackLink accessibleLabel="Zurück zur Übersicht" href="/start" label="Übersicht" />
        <div className="content-page__intro">
          <p className="product-mark">Dein Profil</p>
          <h1 id="account-title">Konto</h1>
        </div>
      </div>
      <div className="profile-page__sections">
        <section className="account-details" aria-labelledby="account-details-title">
          <h2 id="account-details-title">Kontoinformationen</h2>
          <dl className="account-details__list">
            <div>
              <dt>Anzeigename</dt>
              <dd>{account.displayName}</dd>
            </div>
            <div>
              <dt>E-Mail-Adresse</dt>
              <dd>{account.email ?? "Keine E-Mail-Adresse hinterlegt"}</dd>
            </div>
            <div>
              <dt>E-Mail-Status</dt>
              <dd>{account.emailConfirmed ? "Bestätigt" : "Noch nicht bestätigt"}</dd>
            </div>
            <div>
              <dt>Konto erstellt am</dt>
              <dd>
                <time dateTime={account.createdAt}>{createdDate}</time>
              </dd>
            </div>
            <div>
              <dt>Anmeldung über</dt>
              <dd>{providerLabels.join(" und ") || "Nicht verfügbar"}</dd>
            </div>
          </dl>
        </section>
        <section
          className="account-panel account-panel--deletion"
          aria-labelledby="account-deletion-title"
        >
          <div>
            <h2 id="account-deletion-title">Konto löschen</h2>
            <p>
              Du kannst dein Konto dauerhaft löschen. Im nächsten Schritt bestätigst du die
              Löschung.
            </p>
          </div>
          <div className="account-panel__actions">
            <Link href="/profile/delete-account">Zur Kontolöschung</Link>
          </div>
        </section>
      </div>
    </section>
  );
}
