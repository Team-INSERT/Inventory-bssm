import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ezdxnhglpbrjugxeafzo.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("🛠️ Fixing infinite recursion policies...");

  const queries = [
    `CREATE OR REPLACE FUNCTION public.is_admin()
     RETURNS BOOLEAN AS $$
     BEGIN
       RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;`,

    // Fix users policy
    `DROP POLICY IF EXISTS "Admins can read all users" ON public.users;`,
    `CREATE POLICY "Admins can read all users" ON public.users FOR SELECT USING ( public.is_admin() );`,

    // Fix item_serials policy
    `DROP POLICY IF EXISTS "Only admins can modify item_serials" ON public.item_serials;`,
    `CREATE POLICY "Only admins can modify item_serials" ON public.item_serials FOR ALL USING ( public.is_admin() );`,

    // Fix items policy
    `DROP POLICY IF EXISTS "Only admins can modify items" ON public.items;`,
    `CREATE POLICY "Only admins can modify items" ON public.items FOR ALL USING ( public.is_admin() );`,

    // Fix inventory policy
    `DROP POLICY IF EXISTS "Only admins can modify inventory" ON public.inventory;`,
    `CREATE POLICY "Only admins can modify inventory" ON public.inventory FOR ALL USING ( public.is_admin() );`,

    // Fix warehouses
    `DROP POLICY IF EXISTS "Only admins can modify warehouses" ON public.warehouses;`,
    `CREATE POLICY "Only admins can modify warehouses" ON public.warehouses FOR ALL USING ( public.is_admin() );`,
  ];

  // Supabase JS doesn't have a direct raw SQL executor unless through rpc, but let me check if we can call supabase.rpc or something.
  // Actually, we can use standard PG client if needed, or query via rpc, but wait, the RLS is what's causing `42P17`.
  // Wait, I can't run raw SQL from DDL easily with supabase-js unless I have an RPC.
}

run();
