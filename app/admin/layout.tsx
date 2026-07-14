import { redirect } from "next/navigation";
import { AccountNavigation } from "@/components/patterns/account-navigation";
import { AdminNavigation } from "@/components/competition/admin-navigation";
import { AdminResponsiveLayout } from "@/components/competition/admin-responsive-layout";
import { requireAppAdmin } from "@/features/competition/server";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireAppAdmin();
  } catch {
    redirect("/login?next=/admin/competitions");
  }
  return (
    <AdminResponsiveLayout>
      <AccountNavigation isAppAdmin />
      <section className="admin-shell">
        <header className="admin-shell__header">
          <p className="product-mark">Globale Verwaltung</p>
          <h1>Wettbewerbe zentral pflegen</h1>
          <p>Ligen, Spielpläne und Ergebnisse gelten für alle privaten Tipprunden.</p>
        </header>
        <AdminNavigation />
        {children}
      </section>
    </AdminResponsiveLayout>
  );
}
