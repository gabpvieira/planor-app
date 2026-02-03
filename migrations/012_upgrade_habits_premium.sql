-- Migration: 012_upgrade_habits_premium
-- Description: Upgrade habits table for premium habit tracker features
-- Date: 2026-02-02

-- Add new columns to habits table for premium features
ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_completions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS color_hex text DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS icon_name text DEFAULT 'Target',
ADD COLUMN IF NOT EXISTS time_of_day text CHECK (time_of_day IN ('morning', 'afternoon', 'evening'));

-- Update frequency column to support specific_days
ALTER TABLE habits 
DROP CONSTRAINT IF EXISTS habits_frequency_check;

ALTER TABLE habits 
ADD CONSTRAINT habits_frequency_check 
CHECK (frequency IN ('daily', 'weekly', 'specific_days'));

-- Create index for time_of_day queries
CREATE INDEX IF NOT EXISTS idx_habits_time_of_day ON habits(user_id, time_of_day);

-- Create index for streak queries
CREATE INDEX IF NOT EXISTS idx_habits_current_streak ON habits(user_id, current_streak DESC);

-- Function to update streak on habit completion
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
    habit_record RECORD;
    yesterday_date date;
    new_streak integer;
    new_longest integer;
BEGIN
    -- Only process on completion
    IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
        -- Get the habit
        SELECT * INTO habit_record FROM habits WHERE id = NEW.habit_id;
        
        -- Calculate yesterday
        yesterday_date := NEW.date - INTERVAL '1 day';
        
        -- Check if completed yesterday
        IF habit_record.last_completed_at::date = yesterday_date THEN
            -- Continue streak
            new_streak := COALESCE(habit_record.current_streak, 0) + 1;
        ELSIF habit_record.last_completed_at::date = NEW.date THEN
            -- Same day, keep streak
            new_streak := COALESCE(habit_record.current_streak, 1);
        ELSE
            -- Streak broken, start new
            new_streak := 1;
        END IF;
        
        -- Update longest streak if needed
        new_longest := GREATEST(COALESCE(habit_record.longest_streak, 0), new_streak);
        
        -- Update habit
        UPDATE habits SET
            current_streak = new_streak,
            longest_streak = new_longest,
            total_completions = COALESCE(total_completions, 0) + 1,
            last_completed_at = NOW()
        WHERE id = NEW.habit_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic streak updates
DROP TRIGGER IF EXISTS trigger_update_habit_streak ON habit_logs;
CREATE TRIGGER trigger_update_habit_streak
    AFTER INSERT OR UPDATE ON habit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_habit_streak();

-- Update existing habits with default values
UPDATE habits SET
    current_streak = COALESCE(current_streak, 0),
    longest_streak = COALESCE(longest_streak, 0),
    total_completions = COALESCE(total_completions, 0),
    color_hex = COALESCE(color_hex, '#3B82F6'),
    icon_name = COALESCE(icon_name, 'Target')
WHERE current_streak IS NULL OR color_hex IS NULL;

-- Calculate initial streaks and totals from existing logs
WITH habit_stats AS (
    SELECT 
        habit_id,
        COUNT(*) FILTER (WHERE completed = true) as total,
        MAX(date) FILTER (WHERE completed = true) as last_date
    FROM habit_logs
    GROUP BY habit_id
)
UPDATE habits h SET
    total_completions = COALESCE(hs.total, 0),
    last_completed_at = hs.last_date
FROM habit_stats hs
WHERE h.id = hs.habit_id;

COMMENT ON COLUMN habits.current_streak IS 'Current consecutive days streak';
COMMENT ON COLUMN habits.longest_streak IS 'Longest streak ever achieved';
COMMENT ON COLUMN habits.total_completions IS 'Total number of times habit was completed';
COMMENT ON COLUMN habits.last_completed_at IS 'Timestamp of last completion';
COMMENT ON COLUMN habits.color_hex IS 'Hex color for habit display';
COMMENT ON COLUMN habits.icon_name IS 'Lucide icon name for habit';
COMMENT ON COLUMN habits.time_of_day IS 'Preferred time of day: morning, afternoon, evening';
