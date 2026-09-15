import { NextResponse, type NextRequest } from "next/server";

import { normalizeAuthRedirect } from "@/features/auth/redirects";
import { readServerEnvironment } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { completeGoogleDeletionVerification } from "@/features/privacy/reauthentication";

export async function GET(request: NextRequest) {
  const siteUrl = readServerEnvironment().NEXT_PUBLIC_SITE_URL;
  const code = request.nextUrl.searchParams.get("code");
  const next = normalizeAuthRedirect(request.nextUrl.searchParams.get("next"));
  const source = request.nextUrl.searchParams.get("source");
  // A signup email carries its own one-time credential. It does not require the
  // PKCE verifier cookie from the browser in which registration was started.
  if (source === "register" && request.nextUrl.searchParams.has("token_hash")) {
    const tokenHash = request.nextUrl.searchParams.get("token_hash");
    const failureUrl = new URL("/register", siteUrl);
    failureUrl.searchParams.set("error", "confirmation");
    if (next !== "/start") failureUrl.searchParams.set("next", next);
    let destination = failureUrl;
    if (tokenHash && tokenHash.length <= 1024) {
      try {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "email",
        });
        if (!error && data.session && data.user) destination = new URL(next, siteUrl);
      } catch {
        // Token and provider errors must never appear in the destination URL.
      }
    }
    const response = NextResponse.redirect(destination);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  if (source === "delete-account") {
    let destination = "/profile/delete-account?verification=error";
    try {
      destination = await completeGoogleDeletionVerification(
        code,
        request.nextUrl.searchParams.get("nonce"),
      );
    } catch {
      // Never expose OAuth errors, codes or cookie contents in the response.
    }
    const response = NextResponse.redirect(new URL(destination, siteUrl));
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  const emailChange = source === "email-change";
  const failureUrl = new URL(source === "register" ? "/register" : "/login", siteUrl);
  failureUrl.searchParams.set("error", "oauth");
  if (next !== "/start") failureUrl.searchParams.set("next", next);
  if (emailChange) {
    failureUrl.pathname = "/profile";
    failureUrl.search = "?emailChange=error";
  }
  if (!code) return NextResponse.redirect(failureUrl);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(
    error ? failureUrl : new URL(emailChange ? "/profile?emailChange=checked" : next, siteUrl),
  );
}
