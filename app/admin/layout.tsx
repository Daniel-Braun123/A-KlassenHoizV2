import { notFound, redirect } from "next/navigation";

import { AdminNavigation } from "@/components/competition/admin-navigation";
import { AdminResponsiveLayout } from "@/components/competition/admin-responsive-layout";
import { requireAppAdmin } from "@/features/competition/server";
import { ApplicationError } from "@/lib/actions/errors";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireAppAdmin();
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "UNAUTHENTICATED") {
      redirect("/login?next=/admin/competitions");
    }
    if (error instanceof ApplicationError && error.code === "FORBIDDEN") notFound();
    throw error;
  }
  return (
    <AdminResponsiveLayout>
      <section className="admin-shell">
        <header className="admin-shell__header">
          <p className="product-mark">Administration</p>
          <h1>Globale Fußballdaten</h1>
        </header>
        <div className="admin-workspace">
          <AdminNavigation />
          <div className="admin-content">{children}</div>
        </div>
      </section>
    </AdminResponsiveLayout>
  );
}
