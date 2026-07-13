import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { readPublicEnvironment } from "@/lib/config/env";
import type { Database } from "@/lib/supabase/database.types";

export async function updateSession(request: NextRequest) {
  const environment = readPublicEnvironment();
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) request.cookies.set(cookie.name, cookie.value);
          response = NextResponse.next({ request });
          for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    },
  );

  await supabase.auth.getClaims();
  return response;
}
