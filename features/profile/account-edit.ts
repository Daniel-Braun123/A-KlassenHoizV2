import { z } from "zod";

export const displayNameChangeSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Bitte gib einen Anzeigenamen ein.")
    .max(80, "Maximal 80 Zeichen."),
});

export const emailChangeSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .email("Bitte gib eine gültige E-Mail-Adresse ein.")
    .transform((email) => email.toLowerCase()),
  currentPassword: z.string().min(1, "Bitte gib dein aktuelles Passwort ein.").max(128),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Bitte gib dein aktuelles Passwort ein.").max(128),
    password: z.string().min(8, "Verwende mindestens 8 Zeichen.").max(128),
    passwordConfirmation: z.string().min(1, "Bitte wiederhole das neue Passwort.").max(128),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Die Passwörter stimmen nicht überein.",
  })
  .refine((value) => value.password !== value.currentPassword, {
    path: ["password"],
    message: "Das neue Passwort muss sich vom bisherigen unterscheiden.",
  });

export type AccountEditState = Readonly<{
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
}>;

export const initialAccountEditState: AccountEditState = { status: "idle" };

/** Identities come from a freshly verified Auth user, never editable user metadata. */
export function canEditEmailCredentials(providers: readonly string[]): boolean {
  return providers.includes("email");
}
