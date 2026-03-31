"use server";

import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware handling
            // cookie setting elsewhere.
          }
        },
      },
    },
  );
}

// Wrapper functions for common operations
export async function getSupabaseUser() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

export async function getSupabaseSession() {
  const supabase = await createSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return { session, error };
}

// Admin Query Helper
export async function getSupabaseAdminClient() {
  const { createClient } = await import("@supabase/supabase-js");

  // For admin operations, use a service role key from environment
  // Make sure to set SUPABASE_SERVICE_ROLE_KEY in your environment
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
export const createClient = createSupabaseClient;
