-- ============================================================
-- PLANOR - Finance Premium Module Migration
-- Central de Controle Patrimonial
-- ============================================================

-- 1. Tabela: accounts (Contas e Carteiras)
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'corrente' CHECK (type IN ('corrente', 'poupanca', 'investimento', 'carteira')),
  balance numeric NOT NULL DEFAULT 0,
  color_hex text DEFAULT '#3B82F6',
  icon text DEFAULT 'Wallet',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabela: credit_cards (Cartões de Crédito)
CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  card_limit numeric NOT NULL DEFAULT 0,
  closing_day int NOT NULL DEFAULT 1 CHECK (closing_day >= 1 AND closing_day <= 31),
  due_day int NOT NULL DEFAULT 10 CHECK (due_day >= 1 AND due_day <= 31),
  current_balance numeric NOT NULL DEFAULT 0,
  color_hex text DEFAULT '#8B5CF6',
  brand text DEFAULT 'visa' CHECK (brand IN ('visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Tabela: recurring_bills (Despesas Fixas/Recorrentes)
CREATE TABLE IF NOT EXISTS recurring_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  frequency text NOT NULL DEFAULT 'mensal' CHECK (frequency IN ('mensal', 'semanal', 'quinzenal', 'anual')),
  due_day int NOT NULL DEFAULT 1 CHECK (due_day >= 1 AND due_day <= 31),
  category text NOT NULL DEFAULT 'outros',
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  card_id uuid REFERENCES credit_cards(id) ON DELETE SET NULL,
  auto_post boolean DEFAULT false,
  is_active boolean DEFAULT true,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Campos avançados na tabela finance_transactions
ALTER TABLE finance_transactions 
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS card_id uuid REFERENCES credit_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS installments_total int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS installment_current int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_transaction_id int REFERENCES finance_transactions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_subscription boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_transfer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS transfer_to_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurring_bill_id uuid REFERENCES recurring_bills(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paid boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS due_date date;

-- 5. Tabela: card_invoices (Faturas de Cartão)
CREATE TABLE IF NOT EXISTS card_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  closing_date date NOT NULL,
  due_date date NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid', 'partial')),
  paid_at timestamptz,
  paid_from_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(card_id, reference_month)
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_user ON recurring_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_account ON finance_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_card ON finance_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_parent ON finance_transactions(parent_transaction_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_date ON finance_transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_card_invoices_card ON card_invoices(card_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_invoices ENABLE ROW LEVEL SECURITY;

-- Policies for accounts
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- Policies for credit_cards
CREATE POLICY "Users can view own credit_cards" ON credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit_cards" ON credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credit_cards" ON credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own credit_cards" ON credit_cards FOR DELETE USING (auth.uid() = user_id);

-- Policies for recurring_bills
CREATE POLICY "Users can view own recurring_bills" ON recurring_bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring_bills" ON recurring_bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring_bills" ON recurring_bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring_bills" ON recurring_bills FOR DELETE USING (auth.uid() = user_id);

-- Policies for card_invoices
CREATE POLICY "Users can view own card_invoices" ON card_invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own card_invoices" ON card_invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own card_invoices" ON card_invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own card_invoices" ON card_invoices FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- COMENTÁRIOS DAS TABELAS
-- ============================================================
COMMENT ON TABLE accounts IS 'Contas bancárias e carteiras do usuário';
COMMENT ON TABLE credit_cards IS 'Cartões de crédito com controle de limite e fatura';
COMMENT ON TABLE recurring_bills IS 'Despesas fixas e recorrentes (assinaturas, contas)';
COMMENT ON TABLE card_invoices IS 'Histórico de faturas dos cartões de crédito';
