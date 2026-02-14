-- =============================================
-- PLANOR - Nutrition Module Tables
-- =============================================

-- Nutrition Profiles (user goals and settings)
CREATE TABLE IF NOT EXISTS nutrition_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight NUMERIC(5,2), -- kg
  height NUMERIC(5,2), -- cm
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level TEXT DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal TEXT DEFAULT 'maintain' CHECK (goal IN ('lose', 'maintain', 'gain')),
  daily_calories_target INTEGER DEFAULT 2000,
  protein_target INTEGER DEFAULT 150, -- grams
  carbs_target INTEGER DEFAULT 250, -- grams
  fat_target INTEGER DEFAULT 65, -- grams
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Daily Food Logs (individual food entries)
CREATE TABLE IF NOT EXISTS daily_food_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  description TEXT,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC(6,2) DEFAULT 0,
  carbs NUMERIC(6,2) DEFAULT 0,
  fat NUMERIC(6,2) DEFAULT 0,
  fiber NUMERIC(6,2) DEFAULT 0,
  serving_size TEXT,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal Plans (AI-generated plans)
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  plan_json JSONB NOT NULL, -- Full 7-day plan structure
  total_days INTEGER DEFAULT 7,
  daily_avg_calories INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nutrition_profiles_user ON nutrition_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_food_logs_user ON daily_food_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_food_logs_date ON daily_food_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_daily_food_logs_user_date ON daily_food_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_status ON meal_plans(status);

-- Enable RLS
ALTER TABLE nutrition_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nutrition_profiles
CREATE POLICY "Users can view own nutrition profile"
  ON nutrition_profiles FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own nutrition profile"
  ON nutrition_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own nutrition profile"
  ON nutrition_profiles FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own nutrition profile"
  ON nutrition_profiles FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for daily_food_logs
CREATE POLICY "Users can view own food logs"
  ON daily_food_logs FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own food logs"
  ON daily_food_logs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own food logs"
  ON daily_food_logs FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own food logs"
  ON daily_food_logs FOR DELETE
  USING (auth.uid()::text = user_id);

-- RLS Policies for meal_plans
CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE
  USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nutrition_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_nutrition_profiles_updated_at ON nutrition_profiles;
CREATE TRIGGER update_nutrition_profiles_updated_at
  BEFORE UPDATE ON nutrition_profiles
  FOR EACH ROW EXECUTE FUNCTION update_nutrition_updated_at();

DROP TRIGGER IF EXISTS update_meal_plans_updated_at ON meal_plans;
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_nutrition_updated_at();
