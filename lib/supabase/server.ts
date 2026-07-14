import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { readServerEnvironment } from "@/lib/config/env";
import type { Database } from "@/lib/supabase/database.types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const environment = readServerEnvironment();

  return createServerClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot write cookies. The auth refresh proxy owns that boundary.
          }
        },
      },
    },
  );
}
