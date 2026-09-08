"use client";

import { useRef, useState } from "react";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { PageBackLink } from "@/components/patterns/page-back-link";
import { AccountEditForm, type AccountEditKind } from "./account-edit-form";
import { canEditEmailCredentials } from "@/features/profile/account-edit";
import "@/styles/account-details.css";

export type AccountDetails = Readonly<{
  displayName: string;
  email: string | null;
  pendingEmail?: string | null;
  createdAt: string;
  emailConfirmed: boolean;
  providers: string[];
}>;

export function AccountDetailsView({
  account,
  emailChangeStatus,
}: Readonly<{ account: AccountDetails; emailChangeStatus?: "checked" | "error" | undefined }>) {
  const [editing, setEditing] = useState<AccountEditKind | null>(null);
  const [notice, setNotice] = useState("");
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const canEditCredentials = Boolean(account.email) && canEditEmailCredentials(account.providers);
  function closeEditor() {
    setEditing(null);
    lastTrigger.current?.focus();
  }
  function editButton(kind: AccountEditKind, label: string) {
    return (
      <Button
        variant="ghost"
        className="account-details__edit"
        aria-label={label}
        aria-expanded={editing === kind}
        aria-controls={`account-edit-${kind}`}
        disabled={editing !== null && editing !== kind}
        onClick={(event) => {
          lastTrigger.current = event.currentTarget;
          setNotice("");
          setEditing(editing === kind ? null : kind);
        }}
      >
        Ändern
      </Button>
    );
  }
  function editor(kind: AccountEditKind, value: string) {
    return (
      <div
        id={`account-edit-${kind}`}
        hidden={editing !== kind}
        className="account-details__editor"
      >
        {editing === kind ? (
          <AccountEditForm
            kind={kind}
            value={value}
            onClose={closeEditor}
            onSaved={(message) => {
              setNotice(message);
              closeEditor();
            }}
          />
        ) : null}
      </div>
    );
  }
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
        {notice ? (
          <p className="auth-form__message" role="status">
            {notice}
          </p>
        ) : null}
        {emailChangeStatus === "error" ? (
          <p className="auth-form__message auth-form__message--error" role="alert">
            Der Bestätigungslink konnte nicht verarbeitet werden. Prüfe unten deine aktuelle
            Adresse. Öffne den Link im Browser, in dem du die Änderung angefordert hast, oder
            fordere eine neue Bestätigung an.
          </p>
        ) : null}
        {emailChangeStatus === "checked" ? (
          <p className="auth-form__message" role="status">
            {account.pendingEmail
              ? "Ein Bestätigungsschritt ist noch offen. Prüfe bitte beide Postfächer."
              : "Deine aktuelle E-Mail-Adresse ist unten aufgeführt."}
          </p>
        ) : null}
        <section className="account-details" aria-labelledby="account-details-title">
          <h2 id="account-details-title">Kontoinformationen</h2>
          <dl className="account-details__list">
            <div>
              <dt>Anzeigename</dt>
              <dd>
                <div className="account-details__value">
                  <span>{account.displayName}</span>
                  {editButton("name", "Anzeigename ändern")}
                </div>
                {editor("name", account.displayName)}
              </dd>
            </div>
            <div>
              <dt>E-Mail-Adresse</dt>
              <dd>
                <div className="account-details__value">
                  <span>{account.email ?? "Keine E-Mail-Adresse hinterlegt"}</span>
                  {canEditCredentials ? editButton("email", "E-Mail-Adresse ändern") : null}
                </div>
                {account.pendingEmail ? (
                  <p className="account-details__hint">
                    Bestätigung ausstehend für {account.pendingEmail}. Prüfe beide Postfächer. Über
                    „Ändern“ kannst du die Adresse korrigieren oder die Bestätigung erneut
                    anfordern.
                  </p>
                ) : null}
                {canEditCredentials ? editor("email", account.pendingEmail ?? "") : null}
              </dd>
            </div>
            {canEditCredentials ? (
              <div>
                <dt>Passwort</dt>
                <dd>
                  <div className="account-details__value">
                    <span>Passwort hinterlegt</span>
                    {editButton("password", "Passwort ändern")}
                  </div>
                  {editor("password", "")}
                </dd>
              </div>
            ) : null}
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
        {account.providers.includes("google") ? (
          <section className="account-panel" aria-labelledby="google-account-title">
            <div>
              <h2 id="google-account-title">Google-Konto</h2>
              <p>
                {canEditCredentials
                  ? "Dein Google-Konto bleibt zusätzlich verknüpft. Die Änderungen hier betreffen deine Anmeldung bei A-KlassenHoiz."
                  : "Du meldest dich mit Google an. E-Mail-Adresse und Passwort deines Google-Kontos verwaltest du bei Google."}
              </p>
            </div>
            <div className="account-panel__actions">
              <a href="https://myaccount.google.com/" target="_blank" rel="noopener noreferrer">
                Google-Konto verwalten<span className="sr-only"> (öffnet einen neuen Tab)</span>
              </a>
            </div>
          </section>
        ) : null}
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
