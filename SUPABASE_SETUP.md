# Supabase Setup

## 1. Fresh Schema Setup

1. Open Supabase SQL Editor.
2. Run the full contents of `./supabase_schema.sql`.
3. This creates the tables, RLS policies, and the auth trigger that copies `full_name`, `username`, and `phone_number` from auth metadata into `public.users`.
4. If you use image upload, also run `./storage_policies.sql`.
5. In Supabase Storage, create the `item-images` bucket if it does not exist.

## 2. Existing Project Migration

If your database was already created from an older version of the schema, also run:

- `./supabase_schema_migration_v2.sql`

That migration adds the missing `username` and `phone_number` columns to `public.users`.

## 3. Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` is required for admin-only server actions and maintenance scripts.

## 4. Create Temporary Admin

Create the first admin account with:

```bash
TEMP_ADMIN_EMAIL=admin@bsm.hs.kr TEMP_ADMIN_PASSWORD=246810 node scripts/create-temp-admin.mjs
```

If the auth account already exists, the script upgrades it to admin and resets the password/PIN to the provided value.

## 5. Optional Seed Data

Run either:

```bash
node scripts/seed-db.js
```

or, if you prefer SQL, run `./supabase_seed_data.sql` in the SQL Editor.

## 6. Verify

1. Start the app with `npm run dev`.
2. Log in with the admin account you created.
3. Open `/admin/users` and create normal user accounts there.
4. Confirm normal users can log in with email + PIN.

## Notes

- `public.users` is populated automatically by the `on_auth_user_created` trigger.
- Public signup is disabled.
- Normal users must be created by an admin from `/admin/users`.
- The login form accepts either a password or a 6-digit PIN.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
