"use client";

import { createBrowserClient } from "@supabase/ssr";

import { readPublicEnvironment } from "@/lib/config/env";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const environment = readPublicEnvironment();
  browserClient = createBrowserClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return browserClient;
}
