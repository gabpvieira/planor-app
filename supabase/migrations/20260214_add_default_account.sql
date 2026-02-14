-- Migration: Add default account field to profiles
-- Date: 2026-02-14

-- Add default_account_id column to profiles table (UUID type to match accounts.id)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS default_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_default_account ON profiles(default_account_id);

-- Comment on column
COMMENT ON COLUMN profiles.default_account_id IS 'Default account ID for quick transactions (Command Center)';
