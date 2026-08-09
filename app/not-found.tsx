import { Link } from "@/components/ui/link";

export default function NotFoundPage() {
  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <p className="product-mark">Fehler 404</p>
      <h1 id="not-found-title">Diese Seite gibt es nicht</h1>
      <p>
        Der Link ist möglicherweise veraltet oder die Adresse wurde falsch eingegeben. Auf der
        Startseite findest du den direkten Einstieg zu A-KlassenHoiz.
      </p>
      <Link href="/" variant="button">
        Zur Startseite
      </Link>
    </section>
  );
}
