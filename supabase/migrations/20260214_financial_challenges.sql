-- Financial Challenges (52 Weeks Challenge) Module
-- Supports flexible savings challenges with arithmetic progression

-- Create enum types
DO $$ BEGIN
  CREATE TYPE challenge_type AS ENUM ('52_weeks', 'custom_saving');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE challenge_direction AS ENUM ('standard', 'inverse');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create financial_challenges table
CREATE TABLE IF NOT EXISTS financial_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Challenge configuration
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  challenge_type challenge_type NOT NULL DEFAULT '52_weeks',
  direction challenge_direction NOT NULL DEFAULT 'standard',
  
  -- Financial parameters (Arithmetic Progression)
  start_amount DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  step_amount DECIMAL(12,2) NOT NULL DEFAULT 1.00,
  total_weeks INTEGER NOT NULL DEFAULT 52 CHECK (total_weeks IN (52, 104, 156)),
  
  -- Progress tracking
  current_week INTEGER NOT NULL DEFAULT 0,
  total_deposited DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Deposit history: [{week: 1, date: '2026-01-01', status: 'paid', amount: 1.00}]
  deposit_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Integration with finance module
  linked_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  auto_create_transaction BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Notifications
  notification_enabled BOOLEAN DEFAULT true,
  notification_day INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_financial_challenges_user_id ON financial_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_challenges_status ON financial_challenges(status);

-- Enable RLS
ALTER TABLE financial_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own challenges" ON financial_challenges;
CREATE POLICY "Users can view own challenges"
  ON financial_challenges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own challenges" ON financial_challenges;
CREATE POLICY "Users can create own challenges"
  ON financial_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own challenges" ON financial_challenges;
CREATE POLICY "Users can update own challenges"
  ON financial_challenges FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own challenges" ON financial_challenges;
CREATE POLICY "Users can delete own challenges"
  ON financial_challenges FOR DELETE
  USING (auth.uid() = user_id);

-- Function to calculate challenge totals
CREATE OR REPLACE FUNCTION calculate_challenge_total(
  p_start_amount DECIMAL,
  p_step_amount DECIMAL,
  p_total_weeks INTEGER,
  p_direction challenge_direction
) RETURNS DECIMAL AS $$
DECLARE
  v_last_amount DECIMAL;
  v_total DECIMAL;
BEGIN
  v_last_amount := p_start_amount + (p_total_weeks - 1) * p_step_amount;
  v_total := p_total_weeks * (p_start_amount + v_last_amount) / 2;
  RETURN v_total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get week deposit amount
CREATE OR REPLACE FUNCTION get_week_deposit_amount(
  p_start_amount DECIMAL,
  p_step_amount DECIMAL,
  p_week INTEGER,
  p_total_weeks INTEGER,
  p_direction challenge_direction
) RETURNS DECIMAL AS $$
DECLARE
  v_amount DECIMAL;
BEGIN
  IF p_direction = 'standard' THEN
    v_amount := p_start_amount + (p_week - 1) * p_step_amount;
  ELSE
    v_amount := p_start_amount + (p_total_weeks - p_week) * p_step_amount;
  END IF;
  RETURN v_amount;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_financial_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_financial_challenges_updated_at ON financial_challenges;
CREATE TRIGGER trigger_financial_challenges_updated_at
  BEFORE UPDATE ON financial_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_challenges_updated_at();


-- Add custom_amounts column for variable weekly deposits
ALTER TABLE financial_challenges 
ADD COLUMN IF NOT EXISTS custom_amounts JSONB DEFAULT NULL;

-- Add target_amount column for template-based challenges
ALTER TABLE financial_challenges 
ADD COLUMN IF NOT EXISTS target_amount DECIMAL(12,2) DEFAULT NULL;

-- Remove the constraint on total_weeks to allow any number
ALTER TABLE financial_challenges 
DROP CONSTRAINT IF EXISTS financial_challenges_total_weeks_check;

-- Add new constraint allowing 12-156 weeks
ALTER TABLE financial_challenges 
ADD CONSTRAINT financial_challenges_total_weeks_check 
CHECK (total_weeks >= 12 AND total_weeks <= 156);