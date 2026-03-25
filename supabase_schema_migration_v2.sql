-- Add phone_number and username fields to users table
-- Run this in Supabase SQL Editor

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create index for username lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
