import { z } from "zod";

const supabaseBrowserEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverEnvironmentInputSchema = supabaseBrowserEnvironmentSchema.extend({
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  VERCEL_URL: z.string().trim().min(1).optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
});

const serverEnvironmentSchema = supabaseBrowserEnvironmentSchema.extend({
  NEXT_PUBLIC_SITE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
});

export type PublicEnvironment = z.infer<typeof supabaseBrowserEnvironmentSchema>;
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

function siteUrlFromVercelHost(host: string | undefined): string | undefined {
  if (!host) return undefined;
  const candidate = new URL(`https://${host}`);
  if (
    candidate.host !== host ||
    candidate.username ||
    candidate.password ||
    candidate.pathname !== "/" ||
    candidate.search ||
    candidate.hash
  ) {
    throw new Error("VERCEL_URL must be a bare HTTPS host");
  }
  return candidate.origin;
}

export function readPublicEnvironment(
  environment: Record<string, string | undefined> = process.env,
): PublicEnvironment {
  return supabaseBrowserEnvironmentSchema.parse(environment);
}

export function readServerEnvironment(
  environment: Record<string, string | undefined> = process.env,
): ServerEnvironment {
  const input = serverEnvironmentInputSchema.parse(environment);
  return serverEnvironmentSchema.parse({
    ...input,
    NEXT_PUBLIC_SITE_URL: input.NEXT_PUBLIC_SITE_URL ?? siteUrlFromVercelHost(input.VERCEL_URL),
  });
}
