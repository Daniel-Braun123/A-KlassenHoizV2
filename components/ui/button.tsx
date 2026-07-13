import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/ui/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", fullWidth = false, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "ui-button",
        `ui-button--${variant}`,
        fullWidth && "ui-button--full",
        className,
      )}
      type={type}
      {...props}
    />
  );
});
