-- ============================================================
-- PLANOR - Tabela de Categorias Financeiras Personalizadas
-- Permite ao usuário criar suas próprias categorias
-- ============================================================

CREATE TABLE IF NOT EXISTS finance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  type text NOT NULL DEFAULT 'both' CHECK (type IN ('income', 'expense', 'both')),
  color_hex text NOT NULL DEFAULT '#64748B',
  icon text NOT NULL DEFAULT 'Tag',
  is_system boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_finance_categories_user_id ON finance_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_categories_slug ON finance_categories(slug);

-- RLS
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own categories" ON finance_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories" ON finance_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON finance_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON finance_categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = false);

-- Comentários
COMMENT ON TABLE finance_categories IS 'Categorias financeiras personalizadas do usuário';
COMMENT ON COLUMN finance_categories.type IS 'Tipo: income (receita), expense (despesa), both (ambos)';
COMMENT ON COLUMN finance_categories.is_system IS 'Categorias do sistema não podem ser deletadas';
