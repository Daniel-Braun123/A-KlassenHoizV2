import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const actorIds = {
  "nonmember@example.test": "00000000-0000-4000-8000-000000000001",
  "member@example.test": "00000000-0000-4000-8000-000000000002",
  "owner@example.test": "00000000-0000-4000-8000-000000000003",
  "app-admin@example.test": "00000000-0000-4000-8000-000000000004",
  "disabled@example.test": "00000000-0000-4000-8000-000000000005",
} as const;

export type LocalActorEmail = keyof typeof actorIds;

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function localActorToken(email: LocalActorEmail) {
  const secret = process.env.SUPABASE_TEST_JWT_SECRET;
  if (!secret) throw new Error("Local actor clients require SUPABASE_TEST_JWT_SECRET.");
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    aud: "authenticated",
    email,
    exp: now + 3_600,
    // Windows and Docker Desktop can briefly drift after the local stack restarts.
    iat: now - 60,
    iss: "supabase",
    role: "authenticated",
    sub: actorIds[email],
  });
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

export function createLocalActorClient(email: LocalActorEmail) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_TEST_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error("Local actor clients require local Supabase environment variables.");
  if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
    throw new Error("Synthetic actor tokens may only be used with local Supabase.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${localActorToken(email)}` } },
  });
}
