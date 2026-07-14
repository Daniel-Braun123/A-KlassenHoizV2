import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/ui/cn";

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  id?: string;
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { children, className, error, hint, id: providedId, label, required, ...props },
  ref,
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <select
        ref={ref}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={cn("field__control", "field__select", className)}
        id={id}
        required={required}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
