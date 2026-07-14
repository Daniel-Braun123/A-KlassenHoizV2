import { NextResponse, type NextRequest } from "next/server";

import { normalizeAuthRedirect } from "@/features/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = normalizeAuthRedirect(request.nextUrl.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL("/login?error=callback", request.url));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(error ? "/login?error=callback" : next, request.url));
}
