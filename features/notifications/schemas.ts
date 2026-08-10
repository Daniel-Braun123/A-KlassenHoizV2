import { z } from "zod";

const base64UrlSchema = z
  .string()
  .trim()
  .min(8)
  .max(512)
  .regex(/^[A-Za-z0-9_-]+={0,2}$/);

export const pushSubscriptionSchema = z.object({
  endpoint: z
    .url()
    .max(2048)
    .refine((value) => value.startsWith("https://")),
  p256dhKey: base64UrlSchema.min(16),
  authSecret: base64UrlSchema.max(256),
  userAgent: z.string().trim().max(512).optional(),
});

export const pushEndpointSchema = z
  .url()
  .max(2048)
  .refine((value) => value.startsWith("https://"));

export const pushPreferenceSchema = z.object({
  missingTipsEnabled: z.boolean(),
});
