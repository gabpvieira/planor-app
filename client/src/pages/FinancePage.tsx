import React, { useState, useEffect } from 'react';
import { useFinancePremium } from '@/hooks/use-finance-premium';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Loader2, Plus, TrendingUp, TrendingDown, Wallet, CreditCard, Receipt,
  ArrowRightLeft, Calendar, PieChart, BarChart3, AlertCircle,
  Building2, PiggyBank, Trash2, Edit2, Sparkles, Eye, EyeOff, Tag, Activity, Upload
} from 'lucide-react';
import FinanceAnalytics from '@/components/finance/FinanceAnalytics';
import { CardCarousel } from '@/components/finance/PremiumCreditCard';
import { CreditSummaryPremium } from '@/components/finance/CreditSummaryPremium';
import { FINANCE_CATEGORIES, ACCOUNT_TYPES, CARD_BRANDS } from '@/types/finance.types';
import type { AccountInsert, CreditCardInsert, RecurringBillInsert, TransactionInsert, FinanceCategoryInsert } from '@/types/finance.types';
import { BankSelect, type BrazilianBank } from '@/components/ui/bank-select';
import { getBankBySlug } from '@/data/brazilian-banks';
import { getBrasiliaDateString } from '@shared/utils/timezone';
import StatementImport from '@/components/finance/StatementImport';
import { PageHeader } from '@/components/PageHeader';

// Currency formatter
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Currency input helper
const parseCurrencyInput = (value: string): number => {
  const numbers = value.replace(/\D/g, '');
  return parseInt(numbers || '0', 10) / 100;
};

const formatCurrencyInput = (value: number): string => {
  if (!value || value === 0) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Currency Input Component
function CurrencyInput({ 
  value, 
  onChange, 
  placeholder = "0,00",
  required = false,
  className = ""
}: { 
  value: number; 
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(formatCurrencyInput(value));
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numericValue = parseCurrencyInput(input);
    setDisplayValue(formatCurrencyInput(numericValue));
    onChange(numericValue);
  };

  useEffect(() => {
    setDisplayValue(formatCurrencyInput(value));
  }, [value]);

  const showPlaceholder = !displayValue && !isFocused;

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--finance-gray-1)] text-sm font-medium pointer-events-none z-10">
        R$
      </span>
      {showPlaceholder && (
        <span className="absolute left-11 top-1/2 -translate-y-1/2 text-[var(--finance-gray-2)] text-sm pointer-events-none z-10">
          {placeholder}
        </span>
      )}
      <Input
        type="text"
        inputMode="numeric"
        placeholder=""
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        required={required}
        className={`finance-input ${className}`}
        style={{ paddingLeft: '2.75rem' }}
      />
    </div>
  );
}

// ============ SUMMARY CARDS - macOS Style ============
function SummaryCards({ summary, showValues }: { summary: any; showValues: boolean }) {
  const displayValue = (value: number) => showValues ? formatCurrency(value) : '••••••';
  
  const cards = [
    {
      label: 'Saldo em Contas',
      value: summary?.totalBalance || 0,
      subLabel: 'Todas as contas',
      icon: Wallet,
      colorClass: 'text-[var(--finance-green-text)]',
      bgClass: 'bg-[var(--finance-green-soft)]'
    },
    {
      label: 'Receitas',
      value: summary?.totalIncome || 0,
      subLabel: 'Este mês',
      icon: TrendingUp,
      colorClass: 'text-[var(--finance-green-text)]',
      bgClass: 'bg-[var(--finance-green-soft)]'
    },
    {
      label: 'Despesas',
      value: summary?.totalExpenses || 0,
      subLabel: 'Este mês (sem cartão)',
      icon: TrendingDown,
      colorClass: 'text-[var(--finance-red-text)]',
      bgClass: 'bg-[var(--finance-red-soft)]'
    },
    {
      label: 'Compromissos',
      value: summary?.pendingBills || 0,
      subLabel: 'Recorrências ativas',
      icon: Receipt,
      colorClass: 'text-[var(--finance-orange)]',
      bgClass: 'bg-[var(--finance-orange-soft)]'
    }
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 w-full">
      {cards.map((card, index) => (
        <div 
          key={index}
          className="finance-summary-card finance-animate-in min-w-0"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
            <span className="finance-label text-xs sm:text-sm truncate">{card.label}</span>
            <div className={`p-1.5 sm:p-2 rounded-lg ${card.bgClass} shrink-0`}>
              <card.icon className={`size-3 sm:size-4 ${card.colorClass}`} />
            </div>
          </div>
          <div className={`text-base sm:text-xl lg:text-2xl font-semibold ${card.colorClass} truncate`}>
            {displayValue(card.value)}
          </div>
          <p className="finance-label-small mt-1 sm:mt-2 text-[10px] sm:text-xs truncate">{card.subLabel}</p>
        </div>
      ))}
    </div>
  );
}

// ============ ACCOUNTS SECTION - Minimalist ============
function AccountsSection({ accounts, onCreateAccount, onDeleteAccount }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BrazilianBank | null>(null);
  const [form, setForm] = useState<AccountInsert & { bank_code?: string | null; bank_slug?: string | null; logo_url?: string | null }>({
    name: '',
    type: 'corrente',
    balance: 0,
    color_hex: '#007AFF',
    icon: 'Wallet',
    is_active: true,
    bank_code: null,
    bank_slug: null,
    logo_url: null,
  });
  const { toast } = useToast();

  const handleBankSelect = (bank: BrazilianBank | null) => {
    setSelectedBank(bank);
    if (bank) {
      setForm({
        ...form,
        name: bank.shortName,
        color_hex: bank.color,
        bank_code: bank.code,
        bank_slug: bank.slug,
        logo_url: bank.logo,
      });
    } else {
      setForm({ ...form, bank_code: null, bank_slug: null, logo_url: null });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateAccount(form, {
      onSuccess: () => {
        toast({ title: 'Conta criada com sucesso!' });
        setIsOpen(false);
        setSelectedBank(null);
        setForm({ name: '', type: 'corrente', balance: 0, color_hex: '#007AFF', icon: 'Wallet', is_active: true, bank_code: null, bank_slug: null, logo_url: null });
      },
      onError: (error: any) => {
        toast({ title: 'Erro ao criar conta', description: error?.message, variant: 'destructive' });
      },
    });
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'corrente': return Building2;
      case 'poupanca': return PiggyBank;
      case 'investimento': return TrendingUp;
      default: return Wallet;
    }
  };

  return (
    <div className="finance-glass p-4 sm:p-5 w-full min-w-0">
      <div className="finance-section-header">
        <h3 className="finance-section-title text-sm sm:text-base">
          <Wallet className="size-4 sm:size-5 finance-icon" />
          Contas e Carteiras
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="finance-btn finance-btn-secondary flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 shrink-0">
              <Plus className="size-3 sm:size-4" /> <span className="hidden xs:inline">Nova</span>
            </button>
          </DialogTrigger>
          <DialogContent className="finance-glass-elevated max-w-[95vw] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Conta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="finance-label">Banco (opcional)</label>
                <BankSelect
                  value={selectedBank?.slug}
                  onSelect={handleBankSelect}
                  placeholder="Selecione um banco..."
                />
              </div>
              <div className="space-y-2">
                <label className="finance-label">Nome da Conta</label>
                <Input
                  placeholder="Ex: Nubank, Itaú..."
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="finance-input"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="finance-label">Tipo</label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACCOUNT_TYPES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="finance-label">Saldo Inicial</label>
                  <CurrencyInput
                    value={form.balance}
                    onChange={(value) => setForm({ ...form, balance: value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="finance-btn finance-btn-primary w-full sm:w-auto">Criar Conta</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <div className="finance-empty-state py-6 sm:py-8">
          <Wallet className="finance-empty-state-icon size-8 sm:size-10" />
          <p className="finance-empty-state-text text-xs sm:text-sm">Nenhuma conta cadastrada</p>
          <p className="finance-empty-state-hint text-[10px] sm:text-xs">Adicione suas contas para começar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account: any) => {
            const bank = account.bank_slug ? getBankBySlug(account.bank_slug) : null;
            const logoUrl = account.logo_url || bank?.logo;
            const IconComponent = getAccountIcon(account.type);
            
            return (
              <div
                key={account.id}
                className="finance-account-card group w-full"
                style={{ '--account-color': account.color_hex } as React.CSSProperties}
              >
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="size-8 sm:size-10 rounded-xl flex items-center justify-center bg-[var(--finance-gray-6)] dark:bg-[var(--finance-gray-5)] shrink-0">
                      {logoUrl ? (
                        <img 
                          src={logoUrl}
                          alt={account.name}
                          className="size-5 sm:size-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <IconComponent className="size-4 sm:size-5 finance-icon" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-[0.9375rem] truncate">{account.name}</p>
                      <p className="finance-label-small text-[10px] sm:text-xs truncate">
                        {ACCOUNT_TYPES[account.type as keyof typeof ACCOUNT_TYPES]?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <span className={`text-xs sm:text-sm font-semibold truncate ${Number(account.balance) >= 0 ? 'text-[var(--finance-green-text)]' : 'text-[var(--finance-red-text)]'}`}>
                      {formatCurrency(Number(account.balance))}
                    </span>
                    <button
                      onClick={() => onDeleteAccount(account.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 sm:p-2 text-[var(--finance-gray-2)] hover:text-[var(--finance-red)] rounded-lg transition-all"
                    >
                      <Trash2 className="size-3 sm:size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ CREDIT CARDS - Ultra Premium Design ============
function CreditCardsSection({ creditCards, onCreateCard, onDeleteCard }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<CreditCardInsert>({
    name: '',
    card_limit: 0,
    closing_day: 1,
    due_day: 10,
    current_balance: 0,
    color_hex: '#1C1C1E',
    brand: 'visa',
    is_active: true,
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateCard(form, {
      onSuccess: () => {
        toast({ title: 'Cartão adicionado!' });
        setIsOpen(false);
        setForm({ name: '', card_limit: 0, closing_day: 1, due_day: 10, current_balance: 0, color_hex: '#1C1C1E', brand: 'visa', is_active: true });
      },
    });
  };

  // Premium card colors - metallic/dark tones
  const cardColors = [
    '#1C1C1E', // Space Black
    '#2C3E50', // Midnight Blue
    '#1A365D', // Navy
    '#4A1942', // Deep Purple
    '#1E3A5F', // Ocean Blue
    '#2D3748', // Slate
    '#1F2937', // Charcoal
    '#374151', // Graphite
  ];

  return (
    <div className="finance-glass p-5">
      <div className="finance-section-header mb-6">
        <h3 className="finance-section-title">
          <CreditCard className="size-5 finance-icon" />
          Cartões de Crédito
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="finance-btn finance-btn-secondary flex items-center gap-1.5">
              <Plus className="size-4" /> Novo
            </button>
          </DialogTrigger>
          <DialogContent className="finance-glass-elevated">
            <DialogHeader>
              <DialogTitle>Novo Cartão de Crédito</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="finance-label">Nome do Cartão</label>
                <Input
                  placeholder="Ex: Nubank Ultravioleta"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="finance-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="finance-label">Bandeira</label>
                  <Select value={form.brand} onValueChange={v => setForm({ ...form, brand: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CARD_BRANDS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="finance-label">Limite</label>
                  <CurrencyInput
                    value={form.card_limit}
                    onChange={(value) => setForm({ ...form, card_limit: value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="finance-label">Dia Fechamento</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={form.closing_day}
                    onChange={e => setForm({ ...form, closing_day: parseInt(e.target.value) || 1 })}
                    className="finance-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="finance-label">Dia Vencimento</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={form.due_day}
                    onChange={e => setForm({ ...form, due_day: parseInt(e.target.value) || 10 })}
                    className="finance-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="finance-label">Cor do Cartão</label>
                <div className="flex flex-wrap gap-2">
                  {cardColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`size-10 rounded-xl transition-all duration-200 ${
                        form.color_hex === color 
                          ? 'ring-2 ring-offset-2 ring-[var(--finance-blue)] scale-110 shadow-lg' 
                          : 'hover:scale-105'
                      }`}
                      style={{ 
                        backgroundColor: color,
                        boxShadow: form.color_hex === color ? `0 4px 12px ${color}66` : undefined
                      }}
                      onClick={() => setForm({ ...form, color_hex: color })}
                    />
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="finance-btn finance-btn-primary">Adicionar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Premium Card Carousel */}
      <CardCarousel 
        cards={creditCards} 
        onDeleteCard={onDeleteCard}
      />
    </div>
  );
}


// ============ CARD TRANSACTIONS SECTION ============
function CardTransactionsSection({ 
  transactions, 
  creditCards,
  onDeleteTransaction 
}: { 
  transactions: any[]; 
  creditCards: any[];
  onDeleteTransaction: (id: number) => void;
}) {
  const [selectedCardId, setSelectedCardId] = useState<string | 'all'>('all');
  
  // Filtrar apenas transações de cartão
  const cardTransactions = transactions
    .filter((t: any) => t.card_id)
    .filter((t: any) => selectedCardId === 'all' || t.card_id === selectedCardId)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCardName = (cardId: string) => {
    const card = creditCards.find((c: any) => c.id === cardId);
    return card?.name || 'Cartão';
  };

  return (
    <div className="finance-glass p-5">
      <div className="finance-section-header">
        <h3 className="finance-section-title">
          <Receipt className="size-5 finance-icon" />
          Lançamentos no Cartão
        </h3>
        {creditCards.length > 1 && (
          <Select value={selectedCardId} onValueChange={setSelectedCardId}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Todos os cartões" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cartões</SelectItem>
              {creditCards.map((card: any) => (
                <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <ScrollArea className="h-[350px]">
        {cardTransactions.length === 0 ? (
          <div className="finance-empty-state py-8">
            <CreditCard className="finance-empty-state-icon" />
            <p className="finance-empty-state-text">Nenhum lançamento no cartão</p>
            <p className="finance-empty-state-hint">Adicione transações selecionando um cartão</p>
          </div>
        ) : (
          <div className="finance-transaction-list">
            {cardTransactions.slice(0, 50).map((transaction: any) => {
              const category = FINANCE_CATEGORIES[transaction.category as keyof typeof FINANCE_CATEGORIES];
              const isInstallment = transaction.installments_total > 1;
              
              return (
                <div
                  key={transaction.id}
                  className="finance-transaction-row group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl flex items-center justify-center bg-[var(--finance-red-soft)]">
                      <CreditCard className="size-5 text-[var(--finance-red-text)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[0.9375rem]">
                          {transaction.description || category?.label || transaction.category}
                        </p>
                        {isInstallment && (
                          <span className="finance-badge finance-badge-neutral">
                            {transaction.installment_current}/{transaction.installments_total}
                          </span>
                        )}
                      </div>
                      <p className="finance-label-small">
                        {format(parseISO(transaction.date), "d 'de' MMM", { locale: ptBR })}
                        {creditCards.length > 1 && ` • ${getCardName(transaction.card_id)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="finance-value-medium text-[var(--finance-red-text)]">
                      -{formatCurrency(Number(transaction.amount))}
                    </span>
                    <button
                      onClick={() => onDeleteTransaction(transaction.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-[var(--finance-gray-2)] hover:text-[var(--finance-red)] rounded-lg transition-all"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}


// ============ RECURRING BILLS SECTION ============
function RecurringBillsSection({ bills, accounts, cards, onCreateBill, onDeleteBill }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<RecurringBillInsert>({
    description: '',
    amount: 0,
    frequency: 'mensal',
    due_day: 1,
    category: 'outros',
    account_id: null,
    card_id: null,
    auto_post: false,
    is_active: true,
    start_date: getBrasiliaDateString(),
    end_date: null,
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateBill(form, {
      onSuccess: () => {
        toast({ title: 'Despesa recorrente criada!' });
        setIsOpen(false);
        setForm({
          description: '', amount: 0, frequency: 'mensal', due_day: 1, category: 'outros',
          account_id: null, card_id: null, auto_post: false, is_active: true,
          start_date: getBrasiliaDateString(), end_date: null,
        });
      },
    });
  };

  return (
    <div className="finance-glass p-5">
      <div className="finance-section-header">
        <h3 className="finance-section-title">
          <Receipt className="size-5 finance-icon" />
          Despesas Recorrentes
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="finance-btn finance-btn-secondary flex items-center gap-1.5">
              <Plus className="size-4" /> Nova
            </button>
          </DialogTrigger>
          <DialogContent className="finance-glass-elevated">
            <DialogHeader>
              <DialogTitle>Nova Despesa Recorrente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="finance-label">Descrição</label>
                <Input
                  placeholder="Ex: Aluguel, Netflix..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  required
                  className="finance-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="finance-label">Valor</label>
                  <CurrencyInput
                    value={form.amount}
                    onChange={(value) => setForm({ ...form, amount: value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="finance-label">Dia Vencimento</label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={form.due_day}
                    onChange={e => setForm({ ...form, due_day: parseInt(e.target.value) || 1 })}
                    className="finance-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="finance-label">Frequência</label>
                  <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="finance-label">Categoria</label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FINANCE_CATEGORIES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="finance-btn finance-btn-primary">Criar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {bills.length === 0 ? (
        <div className="finance-empty-state">
          <Receipt className="finance-empty-state-icon" />
          <p className="finance-empty-state-text">Nenhuma despesa recorrente</p>
        </div>
      ) : (
        <div className="space-y-1">
          {bills.map((bill: any) => {
            const category = FINANCE_CATEGORIES[bill.category as keyof typeof FINANCE_CATEGORIES];
            return (
              <div
                key={bill.id}
                className="finance-transaction-row group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${category?.color}15` }}
                  >
                    <Receipt className="size-4" style={{ color: category?.color }} />
                  </div>
                  <div>
                    <p className="font-medium text-[0.9375rem]">{bill.description}</p>
                    <p className="finance-label-small">
                      Dia {bill.due_day} • {bill.frequency}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[var(--finance-red-text)]">
                    {formatCurrency(Number(bill.amount))}
                  </span>
                  <button
                    onClick={() => onDeleteBill(bill.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-[var(--finance-gray-2)] hover:text-[var(--finance-red)] rounded-lg transition-all"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ TRANSACTIONS SECTION - Clean List ============
function TransactionsSection({ 
  transactions, accounts, creditCards, allCategories,
  onCreateTransaction, onCreateInstallments, onDeleteTransaction, onUpdateTransaction
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [form, setForm] = useState<TransactionInsert & { installments?: number }>({
    type: 'expense',
    amount: 0,
    category: 'outros',
    description: '',
    date: getBrasiliaDateString(),
    account_id: null,
    card_id: null,
    installments_total: 1,
    installment_current: 1,
    parent_transaction_id: null,
    is_subscription: false,
    is_transfer: false,
    transfer_to_account_id: null,
    recurring_bill_id: null,
    paid: true,
    due_date: null,
    installments: 1,
  });
  const { toast } = useToast();
  const [importOpen, setImportOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transactionData = {
      ...form,
      account_id: form.account_id === 'none' || !form.account_id ? null : form.account_id,
      card_id: form.card_id === 'none' || !form.card_id ? null : form.card_id,
    };

    if (editingTransaction) {
      onUpdateTransaction({ id: editingTransaction.id, data: transactionData }, {
        onSuccess: () => {
          toast({ title: 'Transação atualizada!' });
          setIsOpen(false);
          setEditingTransaction(null);
          resetForm();
        },
        onError: (error: any) => {
          toast({ title: 'Erro ao atualizar', description: error?.message, variant: 'destructive' });
        },
      });
      return;
    }
    
    if (form.installments && form.installments > 1) {
      onCreateInstallments({ data: transactionData, installments: form.installments }, {
        onSuccess: () => {
          toast({ title: `Compra parcelada em ${form.installments}x registrada!` });
          setIsOpen(false);
          resetForm();
        },
        onError: (error: any) => {
          toast({ title: 'Erro ao criar transação', description: error?.message, variant: 'destructive' });
        },
      });
    } else {
      onCreateTransaction(transactionData, {
        onSuccess: () => {
          toast({ title: 'Transação registrada!' });
          setIsOpen(false);
          resetForm();
        },
        onError: (error: any) => {
          toast({ title: 'Erro ao criar transação', description: error?.message, variant: 'destructive' });
        },
      });
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setForm({
      type: transaction.type,
      amount: Number(transaction.amount),
      category: transaction.category,
      description: transaction.description || '',
      date: transaction.date.split('T')[0],
      account_id: transaction.account_id,
      card_id: transaction.card_id,
      installments_total: transaction.installments_total || 1,
      installment_current: transaction.installment_current || 1,
      parent_transaction_id: transaction.parent_transaction_id,
      is_subscription: transaction.is_subscription || false,
      is_transfer: transaction.is_transfer || false,
      transfer_to_account_id: transaction.transfer_to_account_id,
      recurring_bill_id: transaction.recurring_bill_id,
      paid: transaction.paid !== false,
      due_date: transaction.due_date,
      installments: 1,
    });
    setIsOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingTransaction(null);
      resetForm();
    }
    setIsOpen(open);
  };

  const resetForm = () => {
    setForm({
      type: 'expense', amount: 0, category: 'outros', description: '',
      date: getBrasiliaDateString(), account_id: null, card_id: null,
      installments_total: 1, installment_current: 1, parent_transaction_id: null,
      is_subscription: false, is_transfer: false, transfer_to_account_id: null,
      recurring_bill_id: null, paid: true, due_date: null, installments: 1,
    });
  };

  return (
    <div className="finance-glass p-4 sm:p-5 w-full min-w-0">
      <div className="finance-section-header flex-wrap gap-2">
        <h3 className="finance-section-title">
          <BarChart3 className="size-5 finance-icon" />
          Transações
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="finance-btn finance-btn-secondary flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="size-3 sm:size-4" /> <span className="hidden sm:inline">Importar</span>
          </button>
          <Dialog open={isOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <button className="finance-btn finance-btn-primary flex items-center gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
              <Plus className="size-3 sm:size-4" /> Nova
            </button>
          </DialogTrigger>
          <DialogContent className="finance-glass-elevated max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Type Toggle */}
              <div className="flex gap-2 p-1 bg-[var(--finance-gray-6)] dark:bg-[var(--finance-gray-5)] rounded-lg">
                <button
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    form.type === 'expense' 
                      ? 'bg-white dark:bg-[var(--finance-gray-4)] shadow-sm' 
                      : 'text-[var(--finance-gray-1)]'
                  }`}
                  onClick={() => setForm({ ...form, type: 'expense' })}
                >
                  <TrendingDown className="size-4" /> Despesa
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    form.type === 'income' 
                      ? 'bg-white dark:bg-[var(--finance-gray-4)] shadow-sm' 
                      : 'text-[var(--finance-gray-1)]'
                  }`}
                  onClick={() => setForm({ ...form, type: 'income' })}
                >
                  <TrendingUp className="size-4" /> Receita
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="finance-label">Valor</label>
                  <CurrencyInput
                    value={form.amount}
                    onChange={(value) => setForm({ ...form, amount: value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="finance-label">Data</label>
                  <Input
                    type="date"
                    value={form.date as string}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="finance-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="finance-label">Categoria</label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCategories && allCategories.length > 0 ? (
                      <>
                        {allCategories.filter((cat: any) => !cat.isCustom).map((cat: any) => (
                          <SelectItem key={cat.slug} value={cat.slug}>{cat.label}</SelectItem>
                        ))}
                        {allCategories.some((cat: any) => cat.isCustom) && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-medium text-[var(--finance-gray-2)] border-t mt-1 pt-2">
                              Suas Categorias
                            </div>
                            {allCategories.filter((cat: any) => cat.isCustom).map((cat: any) => (
                              <SelectItem key={cat.slug} value={cat.slug}>
                                <div className="flex items-center gap-2">
                                  <div className="size-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                  {cat.label}
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </>
                    ) : (
                      Object.entries(FINANCE_CATEGORIES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="finance-label">Descrição</label>
                <Input
                  placeholder="Descrição da transação"
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="finance-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="finance-label">Conta</label>
                  <Select 
                    value={form.account_id || 'none'} 
                    onValueChange={v => setForm({ ...form, account_id: v === 'none' ? null : v, card_id: null })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {accounts.map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="finance-label">Cartão</label>
                  <Select 
                    value={form.card_id || 'none'} 
                    onValueChange={v => setForm({ ...form, card_id: v === 'none' ? null : v, account_id: null })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {creditCards.map((card: any) => {
                        const available = Number(card.card_limit) - Number(card.current_balance);
                        return (
                          <SelectItem key={card.id} value={card.id}>
                            <div className="flex items-center justify-between w-full gap-3">
                              <span>{card.name}</span>
                              <span className="text-xs text-emerald-500 font-mono">
                                {formatCurrency(available)}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Card Limit Info */}
              {form.card_id && (
                (() => {
                  const selectedCard = creditCards.find((c: any) => c.id === form.card_id);
                  if (!selectedCard) return null;
                  const limit = Number(selectedCard.card_limit);
                  const used = Number(selectedCard.current_balance);
                  const available = limit - used;
                  const usagePercent = limit > 0 ? (used / limit) * 100 : 0;
                  return (
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/30 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Limite disponível</span>
                        <span className={`font-mono font-semibold ${available < limit * 0.15 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {formatCurrency(available)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            usagePercent > 85 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${100 - usagePercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Usado: {formatCurrency(used)}</span>
                        <span>Limite: {formatCurrency(limit)}</span>
                      </div>
                    </div>
                  );
                })()
              )}

              {form.card_id && form.type === 'expense' && (
                <div className="space-y-2">
                  <label className="finance-label">Parcelas</label>
                  <Select 
                    value={String(form.installments || 1)} 
                    onValueChange={v => setForm({ ...form, installments: parseInt(v) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="subscription"
                  checked={form.is_subscription}
                  onChange={e => setForm({ ...form, is_subscription: e.target.checked })}
                  className="rounded border-[var(--finance-gray-3)]"
                />
                <label htmlFor="subscription" className="text-sm text-[var(--finance-gray-1)]">É uma assinatura</label>
              </div>

              <DialogFooter>
                <Button type="submit" className="finance-btn finance-btn-primary">
                  {editingTransaction ? 'Atualizar' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        {transactions.length === 0 ? (
          <div className="finance-empty-state">
            <BarChart3 className="finance-empty-state-icon" />
            <p className="finance-empty-state-text">Nenhuma transação registrada</p>
          </div>
        ) : (
          <div className="finance-transaction-list">
            {transactions.filter((t: any) => !t.is_transfer && !t.card_id).slice(0, 50).map((transaction: any) => {
              const category = FINANCE_CATEGORIES[transaction.category as keyof typeof FINANCE_CATEGORIES];
              const isInstallment = transaction.installments_total > 1;
              const isIncome = transaction.type === 'income';
              
              return (
                <div
                  key={transaction.id}
                  className="finance-transaction-row group w-full"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div
                      className={`size-8 sm:size-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-[var(--finance-green-soft)]' : 'bg-[var(--finance-red-soft)]'
                      }`}
                    >
                      {isIncome ? (
                        <TrendingUp className="size-4 sm:size-5 text-[var(--finance-green-text)]" />
                      ) : (
                        <TrendingDown className="size-4 sm:size-5 text-[var(--finance-red-text)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-xs sm:text-[0.9375rem] truncate">
                          {transaction.description || category?.label || transaction.category}
                        </p>
                        {isInstallment && (
                          <span className="finance-badge finance-badge-neutral">
                            {transaction.installment_current}/{transaction.installments_total}
                          </span>
                        )}
                        {transaction.is_subscription && (
                          <span className="finance-badge finance-badge-neutral">
                            <Sparkles className="size-3 mr-1" /> Assinatura
                          </span>
                        )}
                        {transaction.description?.includes('✨') && (
                          <span className="finance-badge finance-badge-neutral text-primary">
                            <Sparkles className="size-3 mr-0.5" /> IA
                          </span>
                        )}
                      </div>
                      <p className="finance-label-small text-[10px] sm:text-xs truncate">
                        {format(parseISO(transaction.date), "d 'de' MMM", { locale: ptBR })}
                        {transaction.card_id && ' • Cartão'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <span className={`text-xs sm:text-sm font-semibold truncate ${isIncome ? 'text-[var(--finance-green-text)]' : 'text-[var(--finance-red-text)]'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </span>
                    <div className="flex items-center gap-0.5 sm:gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-1.5 sm:p-2 text-[var(--finance-gray-2)] hover:text-[var(--finance-blue)] rounded-lg"
                      >
                        <Edit2 className="size-3 sm:size-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(transaction.id)}
                        className="p-1.5 sm:p-2 text-[var(--finance-gray-2)] hover:text-[var(--finance-red)] rounded-lg"
                      >
                        <Trash2 className="size-3 sm:size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      <StatementImport
        open={importOpen}
        onOpenChange={setImportOpen}
        accountId={null}
      />
    </div>
  );
}


// ============ CATEGORY BREAKDOWN - Apple Style Chart ============
function CategoryBreakdownChart({ breakdown, allCategories }: { breakdown: any[]; allCategories?: any[] }) {
  const total = breakdown.reduce((sum, cat) => sum + cat.amount, 0);
  
  const getCategoryLabel = (categorySlug: string) => {
    const systemCategory = FINANCE_CATEGORIES[categorySlug as keyof typeof FINANCE_CATEGORIES];
    if (systemCategory) return systemCategory.label;
    if (allCategories) {
      const customCategory = allCategories.find(c => c.slug === categorySlug);
      if (customCategory) return customCategory.label;
    }
    return categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);
  };
  
  if (breakdown.length === 0) {
    return (
      <div className="finance-glass p-5">
        <h3 className="finance-section-title mb-4">
          <PieChart className="size-5 finance-icon" />
          Gastos por Categoria
        </h3>
        <div className="finance-empty-state">
          <PieChart className="finance-empty-state-icon" />
          <p className="finance-empty-state-text">Sem dados para exibir</p>
          <p className="finance-empty-state-hint">Adicione transações para ver o gráfico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="finance-glass p-5">
      <h3 className="finance-section-title mb-4">
        <PieChart className="size-5 finance-icon" />
        Gastos por Categoria
      </h3>
      <div className="space-y-4">
        {breakdown.slice(0, 6).map((cat, index) => (
          <div 
            key={cat.category} 
            className="finance-animate-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-medium">{getCategoryLabel(cat.category)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--finance-gray-1)]">{cat.percentage.toFixed(1)}%</span>
                <span className="font-semibold text-sm">{formatCurrency(cat.amount)}</span>
              </div>
            </div>
            <div className="finance-progress">
              <div 
                className="finance-progress-fill"
                style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="finance-divider" />
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

// ============ CASH FLOW CHART - Minimal Apple Style ============
function CashFlowChart({ cashFlow }: { cashFlow: any[] }) {
  if (cashFlow.length === 0) {
    return (
      <div className="finance-glass p-5">
        <h3 className="finance-section-title mb-4">
          <BarChart3 className="size-5 finance-icon" />
          Fluxo de Caixa
        </h3>
        <div className="finance-empty-state">
          <BarChart3 className="finance-empty-state-icon" />
          <p className="finance-empty-state-text">Sem dados para exibir</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...cashFlow.map(cf => Math.max(cf.income, cf.expense)));

  return (
    <div className="finance-glass p-5">
      <h3 className="finance-section-title mb-6">
        <BarChart3 className="size-5 finance-icon" />
        Fluxo de Caixa (6 meses)
      </h3>
      <div className="space-y-5">
        {cashFlow.map((month, index) => {
          const monthDate = parseISO(month.date);
          const incomeWidth = maxValue > 0 ? (month.income / maxValue) * 100 : 0;
          const expenseWidth = maxValue > 0 ? (month.expense / maxValue) * 100 : 0;
          
          return (
            <div 
              key={month.date} 
              className="finance-animate-in"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${month.projected ? 'text-[var(--finance-gray-2)]' : ''}`}>
                  {format(monthDate, 'MMM yyyy', { locale: ptBR })}
                  {month.projected && <span className="ml-1 text-xs">(projetado)</span>}
                </span>
                <span className={`font-semibold ${month.balance >= 0 ? 'text-[var(--finance-green-text)]' : 'text-[var(--finance-red-text)]'}`}>
                  {formatCurrency(month.balance)}
                </span>
              </div>
              <div className="flex gap-1 h-2">
                <div
                  className="finance-chart-bar-fill finance-chart-bar-income rounded-l"
                  style={{ width: `${incomeWidth}%`, opacity: month.projected ? 0.5 : 1 }}
                />
                <div
                  className="finance-chart-bar-fill finance-chart-bar-expense rounded-r"
                  style={{ width: `${expenseWidth}%`, opacity: month.projected ? 0.5 : 1 }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="finance-divider" />
      <div className="flex gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded finance-chart-bar-income" />
          <span className="text-[var(--finance-gray-1)]">Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-3 rounded finance-chart-bar-expense" />
          <span className="text-[var(--finance-gray-1)]">Despesas</span>
        </div>
      </div>
    </div>
  );
}

// ============ UPCOMING BILLS ============
function UpcomingBillsSection({ upcomingBills }: { upcomingBills: any[] }) {
  return (
    <div className="finance-glass p-5">
      <h3 className="finance-section-title mb-4">
        <Calendar className="size-5 finance-icon" />
        Próximos Vencimentos
      </h3>
      {upcomingBills.length === 0 ? (
        <div className="finance-empty-state py-8">
          <Calendar className="finance-empty-state-icon" />
          <p className="finance-empty-state-text">Nenhum vencimento próximo</p>
        </div>
      ) : (
        <div className="space-y-1">
          {upcomingBills.slice(0, 5).map((bill: any, index) => {
            const daysUntil = Math.ceil((bill.nextDue.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isUrgent = daysUntil <= 3;
            
            return (
              <div
                key={bill.id}
                className={`finance-transaction-row finance-animate-in ${isUrgent ? 'bg-[var(--finance-orange-soft)]' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  {isUrgent && <AlertCircle className="size-4 text-[var(--finance-orange)]" />}
                  <div>
                    <p className="font-medium text-[0.9375rem]">{bill.description}</p>
                    <p className="finance-label-small">
                      {format(bill.nextDue, "d 'de' MMMM", { locale: ptBR })}
                      {isUrgent && ` • ${daysUntil === 0 ? 'Hoje' : `em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`}`}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-[var(--finance-red-text)]">
                  {formatCurrency(Number(bill.amount))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============ CATEGORIES SECTION ============
function CategoriesSection({ customCategories, allCategories, onCreateCategory, onDeleteCategory }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FinanceCategoryInsert>({
    name: '',
    slug: '',
    type: 'both',
    color_hex: '#64748B',
    icon: 'Tag',
    is_system: false,
    is_active: true,
  });
  const { toast } = useToast();

  const CATEGORY_COLORS = [
    '#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#06B6D4', 
    '#EC4899', '#F59E0B', '#6366F1', '#14B8A6', '#22C55E',
    '#EF4444', '#84CC16', '#0EA5E9', '#A855F7', '#64748B'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    
    onCreateCategory(form, {
      onSuccess: () => {
        toast({ title: 'Categoria criada com sucesso!' });
        setIsOpen(false);
        setForm({ name: '', slug: '', type: 'both', color_hex: '#64748B', icon: 'Tag', is_system: false, is_active: true });
      },
      onError: (error: any) => {
        toast({ title: 'Erro ao criar categoria', description: error?.message, variant: 'destructive' });
      },
    });
  };

  const systemCategories = Object.entries(FINANCE_CATEGORIES).map(([slug, data]) => ({
    slug,
    label: data.label,
    color: data.color,
    icon: data.icon,
    isCustom: false,
  }));

  return (
    <div className="finance-glass p-5">
      <div className="finance-section-header">
        <h3 className="finance-section-title">
          <Tag className="size-5 finance-icon" />
          Categorias
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="finance-btn finance-btn-secondary flex items-center gap-1.5">
              <Plus className="size-4" /> Nova
            </button>
          </DialogTrigger>
          <DialogContent className="finance-glass-elevated">
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="finance-label">Nome da Categoria</label>
                <Input
                  placeholder="Ex: Pets, Academia..."
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="finance-input"
                />
              </div>
              <div className="space-y-2">
                <label className="finance-label">Tipo</label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Receita e Despesa</SelectItem>
                    <SelectItem value="expense">Apenas Despesa</SelectItem>
                    <SelectItem value="income">Apenas Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="finance-label">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORY_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`size-7 rounded-lg transition-all ${form.color_hex === color ? 'ring-2 ring-offset-2 ring-[var(--finance-blue)] scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setForm({ ...form, color_hex: color })}
                    />
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="finance-btn finance-btn-primary">Criar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {customCategories.length > 0 && (
          <div>
            <p className="finance-label-small mb-3">Suas Categorias</p>
            <div className="space-y-1">
              {customCategories.map((category: any) => (
                <div
                  key={category.id}
                  className="finance-transaction-row group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color_hex}20`, color: category.color_hex }}
                    >
                      <Tag className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="finance-label-small">
                        {category.type === 'both' ? 'Receita e Despesa' : 
                         category.type === 'income' ? 'Receita' : 'Despesa'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteCategory(category.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-[var(--finance-gray-2)] hover:text-[var(--finance-red)] rounded-lg transition-all"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="finance-label-small mb-3">Categorias Padrão</p>
          <div className="grid grid-cols-2 gap-1">
            {systemCategories.map((category) => (
              <div
                key={category.slug}
                className="flex items-center gap-2 p-2 rounded-lg text-sm"
              >
                <div
                  className="size-5 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  <Tag className="size-3" />
                </div>
                <span className="text-[var(--finance-gray-1)] text-sm">{category.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ TRANSFER MODAL ============
function TransferModal({ accounts, onTransfer, isOpen, setIsOpen }: any) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to || !amount || from === to) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    
    onTransfer({ from, to, amount, description }, {
      onSuccess: () => {
        toast({ title: 'Transferência realizada!' });
        setIsOpen(false);
        setFrom('');
        setTo('');
        setAmount(0);
        setDescription('');
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="finance-glass-elevated">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-5 finance-icon-accent" />
            Transferência entre Contas
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="finance-label">Conta de Origem</label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {accounts.map((acc: any) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(Number(acc.balance))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="finance-label">Conta de Destino</label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {accounts.filter((acc: any) => acc.id !== from).map((acc: any) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(Number(acc.balance))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="finance-label">Valor</label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="finance-label">Descrição (opcional)</label>
            <Input
              placeholder="Ex: Reserva de emergência"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="finance-input"
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="finance-btn finance-btn-primary">Transferir</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


// ============ MAIN FINANCE PAGE ============
export default function FinancePage() {
  const {
    accounts, creditCards, recurringBills, transactions,
    summary, cashFlow, categoryBreakdown, upcomingBills,
    customCategories, allCategories,
    isLoading,
    createAccount, deleteAccount,
    createCard, deleteCard,
    createBill, deleteBill,
    createTransaction, createInstallments, createTransfer, deleteTransaction, updateTransaction,
    createCategory, deleteCategory,
  } = useFinancePremium();

  const [showValues, setShowValues] = useState(true);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-[var(--finance-blue)]" />
      </div>
    );
  }

  return (
    <div className="finance-page overflow-x-hidden">
      <div className="space-y-4 sm:space-y-6">
        {/* Header - Clean & Minimal */}
        <div className="w-full">
          <PageHeader
            title="Finanças"
            description="Central de controle patrimonial"
            actions={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowValues(!showValues)}
                  className="finance-btn finance-btn-secondary p-2"
                  title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
                >
                  {showValues ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                <button 
                  onClick={() => setIsTransferOpen(true)}
                  className="finance-btn finance-btn-secondary flex items-center gap-2 px-2 sm:px-3"
                >
                  <ArrowRightLeft className="size-4" />
                  <span className="hidden sm:inline">Transferir</span>
                </button>
              </div>
            }
          />
        </div>

        {/* Summary Cards */}
        <SummaryCards summary={summary} showValues={showValues} />

        {/* Main Content Tabs - Linear Style */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="finance-tabs w-full min-w-max sm:min-w-0 lg:w-auto lg:inline-flex">
              <TabsTrigger value="overview" className="finance-tab data-[state=active]:finance-tab-active gap-2 flex-1 sm:flex-initial">
                <BarChart3 className="size-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="finance-tab data-[state=active]:finance-tab-active gap-2 flex-1 sm:flex-initial">
                <Activity className="size-4" />
                <span className="hidden sm:inline">Análise</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="finance-tab data-[state=active]:finance-tab-active gap-2 flex-1 sm:flex-initial">
                <Wallet className="size-4" />
                <span className="hidden sm:inline">Contas</span>
              </TabsTrigger>
              <TabsTrigger value="cards" className="finance-tab data-[state=active]:finance-tab-active gap-2 flex-1 sm:flex-initial">
                <CreditCard className="size-4" />
                <span className="hidden sm:inline">Cartões</span>
              </TabsTrigger>
              <TabsTrigger value="bills" className="finance-tab data-[state=active]:finance-tab-active gap-2 flex-1 sm:flex-initial">
                <Receipt className="size-4" />
                <span className="hidden sm:inline">Recorrências</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="finance-tab data-[state=active]:finance-tab-active gap-2 flex-1 sm:flex-initial">
                <Tag className="size-4" />
                <span className="hidden sm:inline">Categorias</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6 finance-animate-in">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <TransactionsSection
                  transactions={transactions}
                  accounts={accounts}
                  creditCards={creditCards}
                  allCategories={allCategories}
                  onCreateTransaction={createTransaction}
                  onCreateInstallments={createInstallments}
                  onDeleteTransaction={deleteTransaction}
                  onUpdateTransaction={updateTransaction}
                />
              </div>
              <div className="space-y-4 sm:space-y-6">
                <CategoryBreakdownChart breakdown={categoryBreakdown} allCategories={allCategories} />
                <UpcomingBillsSection upcomingBills={upcomingBills} />
              </div>
            </div>
            <CashFlowChart cashFlow={cashFlow} />
          </TabsContent>

          {/* Analytics Tab - Premium Financial Vision */}
          <TabsContent value="analytics" className="finance-animate-in">
            <FinanceAnalytics
              transactions={transactions}
              accounts={accounts}
              creditCards={creditCards}
              recurringBills={recurringBills}
              allCategories={allCategories}
            />
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4 sm:space-y-6 finance-animate-in">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <AccountsSection
                accounts={accounts}
                onCreateAccount={createAccount}
                onDeleteAccount={deleteAccount}
              />
              <div className="finance-glass p-4 sm:p-5">
                <h3 className="finance-section-title mb-4">Distribuição do Patrimônio</h3>
                {accounts.length === 0 ? (
                  <div className="finance-empty-state">
                    <PieChart className="finance-empty-state-icon" />
                    <p className="finance-empty-state-text">Adicione contas para ver a distribuição</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accounts.map((account: any, index: number) => {
                      const total = accounts.reduce((sum: number, acc: any) => sum + Math.max(0, Number(acc.balance)), 0);
                      const percentage = total > 0 ? (Math.max(0, Number(account.balance)) / total) * 100 : 0;
                      
                      return (
                        <div 
                          key={account.id} 
                          className="finance-animate-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="size-3 rounded-full"
                                style={{ backgroundColor: account.color_hex }}
                              />
                              <span className="text-sm font-medium">{account.name}</span>
                            </div>
                            <span className="font-semibold text-sm">{formatCurrency(Number(account.balance))}</span>
                          </div>
                          <div className="finance-progress">
                            <div 
                              className="finance-progress-fill"
                              style={{ width: `${percentage}%`, backgroundColor: account.color_hex }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-4 sm:space-y-6 finance-animate-in">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <CreditCardsSection
                creditCards={creditCards}
                onCreateCard={createCard}
                onDeleteCard={deleteCard}
              />
              <div className="finance-glass p-5">
                <CreditSummaryPremium creditCards={creditCards} />
              </div>
            </div>
            
            {/* Card Transactions List */}
            <CardTransactionsSection
              transactions={transactions}
              creditCards={creditCards}
              onDeleteTransaction={deleteTransaction}
            />
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills" className="space-y-4 sm:space-y-6 finance-animate-in">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <RecurringBillsSection
                bills={recurringBills}
                accounts={accounts}
                cards={creditCards}
                onCreateBill={createBill}
                onDeleteBill={deleteBill}
              />
              <div className="space-y-6">
                <UpcomingBillsSection upcomingBills={upcomingBills} />
                <div className="finance-glass p-5">
                  <h3 className="finance-section-title mb-4">Compromissos Mensais</h3>
                  {recurringBills.length === 0 ? (
                    <div className="finance-empty-state py-8">
                      <Receipt className="finance-empty-state-icon" />
                      <p className="finance-empty-state-text">Nenhuma despesa recorrente</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[var(--finance-orange-soft)]">
                        <p className="finance-label-small">Total Mensal Comprometido</p>
                        <p className="finance-value-large text-[var(--finance-orange)] mt-1">
                          {formatCurrency(
                            recurringBills
                              .filter((b: any) => b.frequency === 'mensal')
                              .reduce((sum: number, b: any) => sum + Number(b.amount), 0)
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-[var(--finance-gray-1)]">
                        {recurringBills.length} despesas recorrentes ativas
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4 sm:space-y-6 finance-animate-in">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <CategoriesSection
                customCategories={customCategories}
                allCategories={allCategories}
                onCreateCategory={createCategory}
                onDeleteCategory={deleteCategory}
              />
              <div className="finance-glass p-5">
                <h3 className="finance-section-title mb-4">Sobre Categorias</h3>
                <div className="space-y-4 text-sm text-[var(--finance-gray-1)]">
                  <p>
                    As categorias ajudam você a organizar suas transações e entender 
                    melhor para onde vai seu dinheiro.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Dicas:</p>
                    <ul className="list-disc list-inside space-y-1 text-[var(--finance-gray-2)]">
                      <li>Crie categorias específicas para seus gastos recorrentes</li>
                      <li>Use cores diferentes para identificar rapidamente</li>
                      <li>Categorias personalizadas aparecem junto com as padrão</li>
                    </ul>
                  </div>
                  <div className="finance-divider" />
                  <p className="text-xs">
                    <span className="font-medium text-foreground">{Object.keys(FINANCE_CATEGORIES).length}</span> categorias padrão
                    {customCategories.length > 0 && (
                      <> + <span className="font-medium text-foreground">{customCategories.length}</span> personalizadas</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Transfer Modal */}
        <TransferModal
          accounts={accounts}
          onTransfer={createTransfer}
          isOpen={isTransferOpen}
          setIsOpen={setIsTransferOpen}
        />
      </div>
    </div>
  );
}
