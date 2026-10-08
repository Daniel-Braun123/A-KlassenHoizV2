import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { ApplicationError } from "@/lib/actions/errors";
import { readServerEnvironment } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountDeletionError } from "./errors";

const COOKIE = "account-deletion-verification";
const LIFETIME_SECONDS = 600;
const deletionPath = "/profile/delete-account";
const ticketSchema = z.object({
  stage: z.enum(["pending", "verified"]),
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  nonce: z.string().min(1),
  expiresAt: z.number().int(),
});
type Ticket = z.infer<typeof ticketSchema>;
type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function signature(payload: string) {
  const secret = readServerEnvironment().SUPABASE_SECRET_KEY;
  if (!secret) throw new ApplicationError("UNAVAILABLE", "Deletion signing key missing");
  return createHmac("sha256", secret).update(`account-deletion:v1:${payload}`).digest();
}

async function readTicket(): Promise<Ticket | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const actual = Buffer.from(parts[1], "base64url");
  const expected = signature(parts[0]);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const ticket = ticketSchema.parse(JSON.parse(Buffer.from(parts[0], "base64url").toString()));
    return ticket.expiresAt > Date.now() ? ticket : null;
  } catch {
    return null;
  }
}

async function writeTicket(ticket: Ticket) {
  const payload = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${signature(payload).toString("base64url")}`, {
    httpOnly: true,
    secure: new URL(readServerEnvironment().NEXT_PUBLIC_SITE_URL).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: LIFETIME_SECONDS,
  });
}

export async function clearDeletionVerification() {
  (await cookies()).delete(COOKIE);
}

async function verifiedSessionId(supabase: Supabase, userId: string): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || data?.claims.sub !== userId) return null;
  const sessionId = data.claims.session_id;
  return typeof sessionId === "string" && sessionId ? sessionId : null;
}

export async function hasGoogleDeletionVerification(supabase: Supabase, userId: string) {
  const ticket = await readTicket();
  return Boolean(
    ticket?.stage === "verified" &&
    ticket.userId === userId &&
    ticket.sessionId === (await verifiedSessionId(supabase, userId)),
  );
}

export async function startGoogleDeletionVerification(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApplicationError("UNAUTHENTICATED");
  if (!data.user.identities?.some((identity) => identity.provider === "google")) {
    throw new ApplicationError("FORBIDDEN");
  }
  const sessionId = await verifiedSessionId(supabase, data.user.id);
  if (!sessionId) throw new ApplicationError("UNAUTHENTICATED");
  const nonce = randomBytes(32).toString("base64url");
  await writeTicket({
    stage: "pending",
    userId: data.user.id,
    sessionId,
    nonce,
    expiresAt: Date.now() + LIFETIME_SECONDS * 1000,
  });
  const callback = new URL("/auth/callback", readServerEnvironment().NEXT_PUBLIC_SITE_URL);
  callback.searchParams.set("source", "delete-account");
  callback.searchParams.set("nonce", nonce);
  const result = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
        ...(data.user.email ? { login_hint: data.user.email } : {}),
      },
    },
  });
  if (result.error || !result.data.url) {
    await clearDeletionVerification();
    throw new AccountDeletionError(
      "Die Google-Bestätigung konnte nicht gestartet werden. Bitte versuche es erneut.",
    );
  }
  return result.data.url;
}

/** OAuth only grants a short-lived confirmation; deletion remains a separate POST action. */
export async function completeGoogleDeletionVerification(
  code: string | null,
  nonce: string | null,
): Promise<string> {
  const ticket = await readTicket();
  await clearDeletionVerification();
  const failure = `${deletionPath}?verification=error`;
  if (!code || !nonce || ticket?.stage !== "pending" || ticket.nonce !== nonce) return failure;
  const supabase = await createSupabaseServerClient();
  // Bind the return trip to the account and session that initiated this specific request.
  const { data: current, error: currentError } = await supabase.auth.getUser();
  if (
    currentError ||
    current.user?.id !== ticket.userId ||
    (await verifiedSessionId(supabase, ticket.userId)) !== ticket.sessionId
  )
    return failure;
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return failure;
  if (
    data.user.id !== ticket.userId ||
    !data.user.identities?.some((identity) => identity.provider === "google")
  ) {
    await supabase.auth.signOut({ scope: "local" });
    return "/login?error=delete-account-mismatch&next=%2Fprofile%2Fdelete-account";
  }
  const sessionId = await verifiedSessionId(supabase, ticket.userId);
  if (!sessionId) return failure;
  await writeTicket({
    ...ticket,
    stage: "verified",
    sessionId,
    expiresAt: Date.now() + LIFETIME_SECONDS * 1000,
  });
  return deletionPath;
}
