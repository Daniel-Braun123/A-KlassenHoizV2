import { NextResponse, type NextRequest } from "next/server";

import { normalizeAuthRedirect } from "@/features/auth/redirects";
import { readServerEnvironment } from "@/lib/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const siteUrl = readServerEnvironment().NEXT_PUBLIC_SITE_URL;
  const code = request.nextUrl.searchParams.get("code");
  const next = normalizeAuthRedirect(request.nextUrl.searchParams.get("next"));
  const source = request.nextUrl.searchParams.get("source");
  const failureUrl = new URL(source === "register" ? "/register" : "/login", siteUrl);
  failureUrl.searchParams.set("error", "oauth");
  if (next !== "/start") failureUrl.searchParams.set("next", next);
  if (!code) return NextResponse.redirect(failureUrl);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(error ? failureUrl : new URL(next, siteUrl));
}
