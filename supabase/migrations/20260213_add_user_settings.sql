-- Migration: Add user settings fields
-- Date: 2026-02-13

-- Add settings columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"agenda": true, "goals": true, "finance": true, "habits": true, "dailySummary": false, "expenseAlerts": true}'::jsonb,
ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone);

-- Comment on columns
COMMENT ON COLUMN users.display_name IS 'User preferred display name';
COMMENT ON COLUMN users.timezone IS 'User timezone preference (IANA format)';
COMMENT ON COLUMN users.notification_prefs IS 'JSON object with notification preferences per module';
COMMENT ON COLUMN users.push_subscription IS 'Web Push subscription data for VAPID notifications';
