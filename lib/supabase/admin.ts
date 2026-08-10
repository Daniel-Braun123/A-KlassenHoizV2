import "server-only";

import { createClient } from "@supabase/supabase-js";

import { readServerEnvironment } from "@/lib/config/env";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseAdminClient() {
  const environment = readServerEnvironment();
  if (!environment.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY is required for this server operation");
  }

  return createClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
