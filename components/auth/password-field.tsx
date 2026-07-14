"use client";

import { useState } from "react";

import { Input, type InputProps } from "@/components/ui/input";

type PasswordFieldProps = Omit<InputProps, "type">;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <Input {...props} type={visible ? "text" : "password"} />
      <button
        aria-label={visible ? "Passwort verbergen" : "Passwort anzeigen"}
        className="password-field__toggle"
        type="button"
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? "Verbergen" : "Anzeigen"}
      </button>
    </div>
  );
}
