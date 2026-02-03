-- ============================================================
-- PLANOR - Adicionar campos de banco na tabela accounts
-- Permite associar contas a bancos brasileiros com logo
-- ============================================================

-- Adicionar campos para informações do banco
ALTER TABLE accounts 
  ADD COLUMN IF NOT EXISTS bank_code text,
  ADD COLUMN IF NOT EXISTS bank_slug text,
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Índice para busca por código do banco
CREATE INDEX IF NOT EXISTS idx_accounts_bank_code ON accounts(bank_code);

-- Comentários
COMMENT ON COLUMN accounts.bank_code IS 'Código COMPE do banco (ex: 001, 341, 260)';
COMMENT ON COLUMN accounts.bank_slug IS 'Identificador único do banco (ex: nubank, itau-unibanco)';
COMMENT ON COLUMN accounts.logo_url IS 'URL do logo do banco';
