import { SupportAccessForm } from "@/components/competition/support-access-form";
import { listMySupportAudit } from "@/features/support/audit-service";
export default async function SupportPage() {
  const audit = await listMySupportAudit();
  return (
    <section className="admin-section">
      <div>
        <h2>Support-Metadaten</h2>
        <p>
          Kein Browsing, keine Liste und kein Export. Jeder Zugriff braucht Fall, Grund, Objekt-ID
          und Ablauf.
        </p>
      </div>
      <SupportAccessForm />
      <section className="data-list">
        <h2>Deine letzten Auditaktionen</h2>
        <ul>
          {audit.map((row) => (
            <li key={row.id!}>
              <strong>{row.action}</strong>
              <span>
                {row.occurred_at ? new Date(row.occurred_at).toLocaleString("de-DE") : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
