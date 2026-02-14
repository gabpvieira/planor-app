-- Migration: Create push_subscriptions table for Web Push Notifications
-- Date: 2026-02-13

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  expiration_time BIGINT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate subscriptions per user/endpoint
  UNIQUE(user_id, endpoint)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid()::text = user_id);

-- Service role can access all subscriptions (for sending notifications)
CREATE POLICY "Service role full access" ON push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE push_subscriptions IS 'Web Push notification subscriptions for VAPID';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'P-256 Diffie-Hellman public key';
COMMENT ON COLUMN push_subscriptions.auth IS 'Authentication secret';
COMMENT ON COLUMN push_subscriptions.expiration_time IS 'Subscription expiration timestamp';
COMMENT ON COLUMN push_subscriptions.user_agent IS 'Browser/device user agent string';

-- Function to clean expired subscriptions
CREATE OR REPLACE FUNCTION clean_expired_push_subscriptions()
RETURNS void AS $$
BEGIN
  DELETE FROM push_subscriptions
  WHERE expiration_time IS NOT NULL 
    AND expiration_time < EXTRACT(EPOCH FROM NOW()) * 1000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to clean expired subscriptions (requires pg_cron extension)
-- SELECT cron.schedule('clean-expired-push-subs', '0 0 * * *', 'SELECT clean_expired_push_subscriptions()');
