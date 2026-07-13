import { z } from "zod";

export const uuidSchema = z.uuid();

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, "Ungültiger Idempotenzschlüssel");

export const goalSchema = z.number().int().min(0).max(99);
export const positiveVersionSchema = z.number().int().positive();

export const paginationSchema = z.object({
  cursor: z.string().trim().min(1).max(256).optional(),
  limit: z.number().int().min(1).max(100).default(25),
});

export function trimmedTextSchema(minimum: number, maximum: number) {
  return z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(minimum).max(maximum));
}
