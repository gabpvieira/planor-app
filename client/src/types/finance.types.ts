// Finance Module Types - Planor Premium

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'corrente' | 'poupanca' | 'investimento' | 'carteira';
  balance: number;
  color_hex: string;
  icon: string;
  is_active: boolean;
  bank_code: string | null;
  bank_slug: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  card_limit: number;
  closing_day: number;
  due_day: number;
  current_balance: number;
  color_hex: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringBill {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  frequency: 'mensal' | 'semanal' | 'quinzenal' | 'anual';
  due_day: number;
  category: string;
  account_id: string | null;
  card_id: string | null;
  auto_post: boolean;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceTransaction {
  id: number;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string | null;
  date: string;
  account_id: string | null;
  card_id: string | null;
  installments_total: number;
  installment_current: number;
  parent_transaction_id: number | null;
  is_subscription: boolean;
  is_transfer: boolean;
  transfer_to_account_id: string | null;
  recurring_bill_id: string | null;
  paid: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardInvoice {
  id: string;
  user_id: string;
  card_id: string;
  reference_month: string;
  closing_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: 'open' | 'closed' | 'paid' | 'partial';
  paid_at: string | null;
  paid_from_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceCategory {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  type: 'income' | 'expense' | 'both';
  color_hex: string;
  icon: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Insert/Update types
export type AccountInsert = Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type AccountUpdate = Partial<AccountInsert>;

export type CreditCardInsert = Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type CreditCardUpdate = Partial<CreditCardInsert>;

export type RecurringBillInsert = Omit<RecurringBill, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type RecurringBillUpdate = Partial<RecurringBillInsert>;

export type TransactionInsert = Omit<FinanceTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type TransactionUpdate = Partial<TransactionInsert>;

export type FinanceCategoryInsert = Omit<FinanceCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type FinanceCategoryUpdate = Partial<FinanceCategoryInsert>;

// Summary types
export interface FinanceSummary {
  totalBalance: number;
  freeBalance: number;
  totalIncome: number;
  totalExpenses: number;
  pendingBills: number;
  creditUsed: number;
  creditAvailable: number;
}

export interface CashFlowItem {
  date: string;
  income: number;
  expense: number;
  balance: number;
  projected: boolean;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  transactions: number;
}

// Finance categories with colors
export const FINANCE_CATEGORIES = {
  alimentacao: { label: 'Alimentação', color: '#F97316', icon: 'Utensils' },
  transporte: { label: 'Transporte', color: '#3B82F6', icon: 'Car' },
  moradia: { label: 'Moradia', color: '#8B5CF6', icon: 'Home' },
  saude: { label: 'Saúde', color: '#10B981', icon: 'Heart' },
  educacao: { label: 'Educação', color: '#06B6D4', icon: 'GraduationCap' },
  lazer: { label: 'Lazer', color: '#EC4899', icon: 'Gamepad2' },
  compras: { label: 'Compras', color: '#F59E0B', icon: 'ShoppingBag' },
  servicos: { label: 'Serviços', color: '#6366F1', icon: 'Wrench' },
  assinaturas: { label: 'Assinaturas', color: '#14B8A6', icon: 'Repeat' },
  investimentos: { label: 'Investimentos', color: '#22C55E', icon: 'TrendingUp' },
  salario: { label: 'Salário', color: '#22C55E', icon: 'Briefcase' },
  freelance: { label: 'Freelance', color: '#3B82F6', icon: 'Laptop' },
  outros: { label: 'Outros', color: '#64748B', icon: 'MoreHorizontal' },
} as const;

export type FinanceCategory = keyof typeof FINANCE_CATEGORIES;

// Account type labels
export const ACCOUNT_TYPES = {
  corrente: { label: 'Conta Corrente', icon: 'Building2' },
  poupanca: { label: 'Poupança', icon: 'PiggyBank' },
  investimento: { label: 'Investimento', icon: 'TrendingUp' },
  carteira: { label: 'Carteira', icon: 'Wallet' },
} as const;

// Card brands
export const CARD_BRANDS = {
  visa: { label: 'Visa', color: '#1A1F71' },
  mastercard: { label: 'Mastercard', color: '#EB001B' },
  elo: { label: 'Elo', color: '#00A4E0' },
  amex: { label: 'American Express', color: '#006FCF' },
  hipercard: { label: 'Hipercard', color: '#B3131B' },
  other: { label: 'Outro', color: '#64748B' },
} as const;
