import { z } from "zod";

const supabaseBrowserEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

function optionalTrimmedString(minimumLength: number) {
  return z.preprocess(
    (value) =>
      typeof value === "string" &&
      (value.trim() === "" || value.trim().toLowerCase() === "[sensitive]")
        ? undefined
        : value,
    z.string().trim().min(minimumLength).optional(),
  );
}

const serverEnvironmentInputSchema = supabaseBrowserEnvironmentSchema.extend({
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: optionalTrimmedString(32),
  VERCEL_URL: optionalTrimmedString(1),
  PUSH_CRON_SECRET: optionalTrimmedString(32),
  SUPABASE_SECRET_KEY: optionalTrimmedString(1),
  VAPID_PRIVATE_KEY: optionalTrimmedString(32),
});

const serverEnvironmentSchema = supabaseBrowserEnvironmentSchema.extend({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().trim().min(32).optional(),
  PUSH_CRON_SECRET: z.string().min(32).optional(),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().trim().min(32).optional(),
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
