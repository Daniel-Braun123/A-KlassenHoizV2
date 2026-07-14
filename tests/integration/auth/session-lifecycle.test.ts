import { createClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/supabase/database.types";

const url = process.env.SUPABASE_TEST_URL;
const publishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  throw new Error("Local Supabase test environment was not provided by the integration runner.");
}

const publicClient = createClient<Database>(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const adminClient = createClient<Database>(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const createdUserIds: string[] = [];

afterAll(async () => {
  for (const userId of createdUserIds) {
    await adminClient.auth.admin.deleteUser(userId);
  }
});

describe("local Supabase auth lifecycle", () => {
  const email = `auth-${crypto.randomUUID()}@example.test`;
  const password = "FreundeSindStark42!";

  it("creates an immediately active session and profile without email confirmation", async () => {
    const { data, error } = await publicClient.auth.signUp({
      email,
      password,
      options: { data: { display_name: "Lokaler Test" } },
    });

    expect(error).toBeNull();
    expect(data.session).not.toBeNull();
    expect(data.user?.email_confirmed_at).toBeTruthy();
    if (!data.user) throw new Error("Expected a created local auth user.");
    createdUserIds.push(data.user.id);

    const { data: profile, error: profileError } = await publicClient
      .schema("api")
      .from("my_profile")
      .select("user_id,display_name,app_role,status")
      .single();

    expect(profileError).toBeNull();
    expect(profile).toMatchObject({
      user_id: data.user.id,
      display_name: "Lokaler Test",
      app_role: "user",
      status: "active",
    });
  });

  it("signs out, signs back in and accepts a neutral password-reset request", async () => {
    expect((await publicClient.auth.signOut()).error).toBeNull();
    const signIn = await publicClient.auth.signInWithPassword({ email, password });
    expect(signIn.error).toBeNull();
    expect(signIn.data.session).not.toBeNull();

    const reset = await publicClient.auth.resetPasswordForEmail(email, {
      redirectTo: "http://127.0.0.1:3000/password/reset",
    });
    expect(reset.error).toBeNull();
  });
});
