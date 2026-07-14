export function ResultRevisionNotice({ count }: { count: number }) {
  if (!count) return null;
  return (
    <aside className="revision-notice" role="note">
      <strong>
        {count} {count === 1 ? "Ergebnis wurde" : "Ergebnisse wurden"} korrigiert.
      </strong>
      <span>Die Punkte wurden jeweils vollständig und atomar neu berechnet.</span>
    </aside>
  );
}
