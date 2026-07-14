import type { ReactNode } from "react";

export function AuthFormShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="auth-shell" aria-labelledby="auth-title">
      <div className="auth-shell__copy">
        <p className="product-mark">A-KlassenHoiz</p>
        <h1 id="auth-title">{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}
