type ContentLoadingProps = Readonly<{
  label?: string;
  rows?: number;
}>;

export function ContentLoading({ label = "Inhalt wird geladen", rows = 4 }: ContentLoadingProps) {
  return (
    <section aria-busy="true" aria-label={label} className="content-loading" role="status">
      <span className="content-loading__eyebrow" />
      <span className="content-loading__title" />
      <span className="content-loading__copy" />
      <div className="content-loading__panel">
        {Array.from({ length: rows }, (_, index) => (
          <span className="content-loading__row" key={index} />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </section>
  );
}
