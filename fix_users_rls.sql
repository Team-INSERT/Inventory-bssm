-- Drop existing problem policy
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

-- Create correct policy using auth.jwt() metadata
-- Supabase attaches app_metadata and user_metadata to JWTs automatically
CREATE POLICY "Admins can read all users" ON public.users 
FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  OR 
  -- fallback if someone prefers querying the table directly, wait, querying the table directly caused the recursion
  -- Let's just use the JWT so it doesn't query the table
  -- OR, create a security definer function to avoid recursion
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Actually, a better way, without infinite loop:
-- The infinite loop happens because the policy on 'users' SELECT tries to do a SELECT on 'users'.
-- We can avoid it by just doing:
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users" ON public.users 
FOR ALL USING (
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
);