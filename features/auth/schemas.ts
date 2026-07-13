import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .max(254)
  .email()
  .transform((value) => value.toLocaleLowerCase("en-US"));

const passwordSchema = z.string().min(8).max(128);
const displayNameSchema = z.string().trim().min(1).max(80);

export const registerSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
  next: z.string().max(512).optional(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  next: z.string().max(512).optional(),
});

export const passwordResetRequestSchema = z.object({ email: emailSchema });

export const completePasswordResetSchema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: passwordSchema,
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordConfirmation"],
  });

export function normalizeAuthRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/start";
  }

  try {
    const parsed = new URL(value, "https://a-klassenhoiz.invalid");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/start";
  }
}
