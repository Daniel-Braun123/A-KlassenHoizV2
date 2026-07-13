import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

const serverEnvironmentSchema = publicEnvironmentSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function readPublicEnvironment(
  environment: Record<string, string | undefined> = process.env,
): PublicEnvironment {
  return publicEnvironmentSchema.parse(environment);
}

export function readServerEnvironment(
  environment: Record<string, string | undefined> = process.env,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(environment);
}
