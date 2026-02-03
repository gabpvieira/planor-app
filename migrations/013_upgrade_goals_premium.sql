-- Migration: Upgrade Goals to Premium Dashboard Structure
-- Description: Refactors goals table for progress-first dashboard with milestones, categories, and deadline tracking

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS goals_backup AS SELECT * FROM goals;
CREATE TABLE IF NOT EXISTS goal_objectives_backup AS SELECT * FROM goal_objectives;

-- Step 2: Drop existing constraints and tables
DROP TABLE IF EXISTS goal_objectives CASCADE;
DROP TABLE IF EXISTS goals CASCADE;

-- Step 3: Create new goals table with premium structure
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'pessoal' CHECK (category IN ('financas', 'pessoal', 'saude', 'carreira')),
  start_value FLOAT NOT NULL DEFAULT 0,
  target_value FLOAT NOT NULL DEFAULT 100,
  current_value FLOAT NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '%',
  deadline DATE,
  milestones JSONB DEFAULT '[{"value": 25, "label": "25%"}, {"value": 50, "label": "50%"}, {"value": 75, "label": "75%"}]'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  linked_module TEXT CHECK (linked_module IN ('finance', 'habits', 'tasks', 'workouts', null)),
  linked_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_category ON goals(category);
CREATE INDEX idx_goals_deadline ON goals(deadline);
CREATE INDEX idx_goals_is_archived ON goals(is_archived);

-- Step 5: Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- Step 7: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();

-- Step 8: Create goal templates table for premium features
CREATE TABLE goal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('financas', 'pessoal', 'saude', 'carreira')),
  default_milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_unit TEXT NOT NULL DEFAULT '%',
  icon TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 9: Insert default templates
INSERT INTO goal_templates (name, description, category, default_milestones, default_unit, icon, is_system) VALUES
  ('Casamento', 'Planejamento completo para o grande dia', 'pessoal', 
   '[{"value": 25, "label": "Noivado"}, {"value": 50, "label": "Local definido"}, {"value": 75, "label": "Convites enviados"}, {"value": 100, "label": "Casamento"}]', 
   '%', 'heart', true),
  ('Compra de Imóvel', 'Jornada para a casa própria', 'financas', 
   '[{"value": 25, "label": "Entrada"}, {"value": 50, "label": "Aprovação"}, {"value": 75, "label": "Documentação"}, {"value": 100, "label": "Chaves"}]', 
   'R$', 'home', true),
  ('Mudança de Cidade', 'Planejamento de relocação', 'pessoal', 
   '[{"value": 25, "label": "Pesquisa"}, {"value": 50, "label": "Emprego"}, {"value": 75, "label": "Moradia"}, {"value": 100, "label": "Mudança"}]', 
   '%', 'map-pin', true),
  ('Perda de Peso', 'Meta de emagrecimento saudável', 'saude', 
   '[{"value": 25, "label": "Início"}, {"value": 50, "label": "Metade"}, {"value": 75, "label": "Quase lá"}, {"value": 100, "label": "Meta"}]', 
   'kg', 'scale', true),
  ('Poupança', 'Reserva financeira', 'financas', 
   '[{"value": 25, "label": "25%"}, {"value": 50, "label": "50%"}, {"value": 75, "label": "75%"}, {"value": 100, "label": "100%"}]', 
   'R$', 'piggy-bank', true),
  ('Promoção', 'Crescimento na carreira', 'carreira', 
   '[{"value": 25, "label": "Feedback"}, {"value": 50, "label": "Projetos"}, {"value": 75, "label": "Avaliação"}, {"value": 100, "label": "Promoção"}]', 
   '%', 'briefcase', true);

-- Step 10: Enable RLS on templates (read-only for all authenticated users)
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON goal_templates FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE goals IS 'Premium goals table with progress tracking, milestones, and module integration';
COMMENT ON TABLE goal_templates IS 'Pre-defined goal templates for common life events';
