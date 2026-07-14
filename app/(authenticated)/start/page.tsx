import type { Route } from "next";
import { Link } from "@/components/ui/link";
import { RoundSwitcher } from "@/components/rounds/round-switcher";
import { listMyRounds } from "@/features/rounds/service";
export default async function StartPage() {
  const rounds = await listMyRounds();
  return (
    <section className="start-page">
      <div className="launch-copy">
        <p className="product-mark">Los geht’s</p>
        <h1>Deine private Tipprunde beginnt hier.</h1>
        <p>Wähle eine Runde, erstelle eine neue oder öffne den Einladungslink eines Freundes.</p>
        <Link href={"/profile" as Route}>Profil ansehen</Link>
      </div>
      <RoundSwitcher rounds={rounds} />
    </section>
  );
}
