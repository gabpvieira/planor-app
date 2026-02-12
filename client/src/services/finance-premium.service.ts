import { supabase } from '@/lib/supabase';
import type {
  Account, AccountInsert, AccountUpdate,
  CreditCard, CreditCardInsert, CreditCardUpdate,
  RecurringBill, RecurringBillInsert, RecurringBillUpdate,
  FinanceTransaction, TransactionInsert, TransactionUpdate,
  FinanceCategory, FinanceCategoryInsert, FinanceCategoryUpdate,
  CardInvoice, FinanceSummary, CashFlowItem, CategoryBreakdown,
  FINANCE_CATEGORIES
} from '@/types/finance.types';
import { getBrasiliaDate, toBrasiliaISOString } from '@shared/utils/timezone';import { addMonths, startOfMonth, endOfMonth, format, parseISO, isBefore, isAfter, addDays } from 'date-fns';

// ============ ACCOUNTS SERVICE ============
export const accountsService = {
  async list(userId: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(account: AccountInsert, userId: string): Promise<Account> {
    const initialBalance = account.balance || 0;
    
    // Clean account data - ensure null values for optional bank fields
    const cleanAccount: any = {
      name: account.name,
      type: account.type,
      balance: initialBalance,
      color_hex: account.color_hex || '#3B82F6',
      icon: account.icon || 'Wallet',
      is_active: account.is_active !== false,
      bank_code: (account as any).bank_code || null,
      bank_slug: (account as any).bank_slug || null,
      logo_url: (account as any).logo_url || null,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('accounts')
      .insert(cleanAccount)
      .select()
      .single();
    if (error) throw error;

    // Se houver saldo inicial, criar transação de receita automática
    if (initialBalance > 0) {
      await supabase.from('finance_transactions').insert({
        user_id: userId,
        type: 'income',
        amount: initialBalance,
        category: 'outros',
        description: `Saldo inicial - ${account.name}`,
        date: toBrasiliaISOString(),
        account_id: data.id,
        is_transfer: false,
        is_subscription: false,
        paid: true,
      });
    }

    return data;
  },

  async update(id: string, account: AccountUpdate): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update({ ...account, updated_at: toBrasiliaISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  async updateBalance(id: string, amount: number, operation: 'add' | 'subtract'): Promise<void> {
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', id)
      .single();
    
    if (account) {
      const newBalance = operation === 'add' 
        ? Number(account.balance) + amount 
        : Number(account.balance) - amount;
      
      await supabase
        .from('accounts')
        .update({ balance: newBalance, updated_at: toBrasiliaISOString() })
        .eq('id', id);
    }
  }
};

// ============ CREDIT CARDS SERVICE ============
export const creditCardsService = {
  async list(userId: string): Promise<CreditCard[]> {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(card: CreditCardInsert, userId: string): Promise<CreditCard> {
    const { data, error } = await supabase
      .from('credit_cards')
      .insert({ ...card, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, card: CreditCardUpdate): Promise<CreditCard> {
    const { data, error } = await supabase
      .from('credit_cards')
      .update({ ...card, updated_at: toBrasiliaISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('credit_cards')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  async updateBalance(id: string, amount: number, operation: 'add' | 'subtract'): Promise<void> {
    const { data: card } = await supabase
      .from('credit_cards')
      .select('current_balance')
      .eq('id', id)
      .single();
    
    if (card) {
      const newBalance = operation === 'add' 
        ? Number(card.current_balance) + amount 
        : Number(card.current_balance) - amount;
      
      await supabase
        .from('credit_cards')
        .update({ current_balance: Math.max(0, newBalance), updated_at: toBrasiliaISOString() })
        .eq('id', id);
    }
  },

  getInvoiceDates(card: CreditCard, referenceDate: Date = getBrasiliaDate()) {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    
    let closingDate = new Date(year, month, card.closing_day);
    let dueDate = new Date(year, month, card.due_day);
    
    if (card.due_day <= card.closing_day) {
      dueDate = addMonths(dueDate, 1);
    }
    
    return { closingDate, dueDate };
  }
};

// ============ RECURRING BILLS SERVICE ============
export const recurringBillsService = {
  async list(userId: string): Promise<RecurringBill[]> {
    const { data, error } = await supabase
      .from('recurring_bills')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('due_day', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(bill: RecurringBillInsert, userId: string): Promise<RecurringBill> {
    const { data, error } = await supabase
      .from('recurring_bills')
      .insert({ ...bill, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, bill: RecurringBillUpdate): Promise<RecurringBill> {
    const { data, error } = await supabase
      .from('recurring_bills')
      .update({ ...bill, updated_at: toBrasiliaISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('recurring_bills')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  getNextDueDate(bill: RecurringBill, fromDate: Date = getBrasiliaDate()): Date {
    const today = fromDate;
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let nextDue = new Date(currentYear, currentMonth, bill.due_day);
    
    if (isBefore(nextDue, today)) {
      nextDue = addMonths(nextDue, 1);
    }
    
    return nextDue;
  }
};


// ============ TRANSACTIONS SERVICE (Enhanced) ============
export const transactionsService = {
  async list(userId: string, startDate?: string, endDate?: string): Promise<FinanceTransaction[]> {
    let query = supabase
      .from('finance_transactions')
      .select('*')
      .eq('user_id', userId);

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(transaction: TransactionInsert, userId: string): Promise<FinanceTransaction> {
    // Limpar campos que não devem ser enviados ou são undefined
    const cleanTransaction: any = {
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description || null,
      date: transaction.date,
      account_id: transaction.account_id || null,
      card_id: transaction.card_id || null,
      installments_total: transaction.installments_total || 1,
      installment_current: transaction.installment_current || 1,
      parent_transaction_id: transaction.parent_transaction_id || null,
      is_subscription: transaction.is_subscription || false,
      is_transfer: transaction.is_transfer || false,
      transfer_to_account_id: transaction.transfer_to_account_id || null,
      recurring_bill_id: transaction.recurring_bill_id || null,
      paid: transaction.paid !== undefined ? transaction.paid : true,
      due_date: transaction.due_date || null,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('finance_transactions')
      .insert(cleanTransaction)
      .select()
      .single();
    if (error) throw error;

    // Update account/card balance
    if (data.account_id && !data.is_transfer) {
      await accountsService.updateBalance(
        data.account_id,
        Number(data.amount),
        data.type === 'income' ? 'add' : 'subtract'
      );
    }
    if (data.card_id) {
      await creditCardsService.updateBalance(data.card_id, Number(data.amount), 'add');
    }

    return data;
  },

  async createInstallments(
    baseTransaction: TransactionInsert,
    userId: string,
    totalInstallments: number
  ): Promise<FinanceTransaction[]> {
    const transactions: FinanceTransaction[] = [];
    const installmentAmount = Number(baseTransaction.amount) / totalInstallments;
    const totalAmount = Number(baseTransaction.amount);
    const baseDate = parseISO(baseTransaction.date as string);

    // Create parent transaction (first installment) - sem atualizar saldo do cartão ainda
    const cleanTransaction: any = {
      type: baseTransaction.type,
      amount: installmentAmount,
      category: baseTransaction.category,
      description: baseTransaction.description || null,
      date: baseTransaction.date,
      account_id: baseTransaction.account_id || null,
      card_id: baseTransaction.card_id || null,
      installments_total: totalInstallments,
      installment_current: 1,
      parent_transaction_id: null,
      is_subscription: baseTransaction.is_subscription || false,
      is_transfer: false,
      transfer_to_account_id: null,
      recurring_bill_id: null,
      paid: true,
      due_date: null,
      user_id: userId,
    };

    const { data: parent, error: parentError } = await supabase
      .from('finance_transactions')
      .insert(cleanTransaction)
      .select()
      .single();
    if (parentError) throw parentError;
    transactions.push(parent);

    // Create future installments
    for (let i = 2; i <= totalInstallments; i++) {
      const installmentDate = addMonths(baseDate, i - 1);
      
      const installmentData: any = {
        type: baseTransaction.type,
        amount: installmentAmount,
        category: baseTransaction.category,
        description: baseTransaction.description || null,
        date: format(installmentDate, 'yyyy-MM-dd'),
        account_id: baseTransaction.account_id || null,
        card_id: baseTransaction.card_id || null,
        installments_total: totalInstallments,
        installment_current: i,
        parent_transaction_id: parent.id,
        is_subscription: baseTransaction.is_subscription || false,
        is_transfer: false,
        transfer_to_account_id: null,
        recurring_bill_id: null,
        paid: false,
        due_date: null,
        user_id: userId,
      };

      const { data, error } = await supabase
        .from('finance_transactions')
        .insert(installmentData)
        .select()
        .single();
      
      if (error) throw error;
      transactions.push(data);
    }

    // Atualizar saldo do cartão com o VALOR TOTAL da compra parcelada
    if (baseTransaction.card_id) {
      await creditCardsService.updateBalance(baseTransaction.card_id, totalAmount, 'add');
    }

    // Se for conta (não cartão), atualizar apenas com a primeira parcela
    if (baseTransaction.account_id && !baseTransaction.card_id) {
      await accountsService.updateBalance(
        baseTransaction.account_id,
        installmentAmount,
        baseTransaction.type === 'income' ? 'add' : 'subtract'
      );
    }

    return transactions;
  },

  async createTransfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    userId: string,
    description?: string
  ): Promise<void> {
    // Debit from source
    await supabase.from('finance_transactions').insert({
      user_id: userId,
      type: 'expense',
      amount,
      category: 'transferencia',
      description: description || 'Transferência entre contas',
      date: toBrasiliaISOString(),
      account_id: fromAccountId,
      is_transfer: true,
      transfer_to_account_id: toAccountId,
      paid: true,
    });

    // Credit to destination
    await supabase.from('finance_transactions').insert({
      user_id: userId,
      type: 'income',
      amount,
      category: 'transferencia',
      description: description || 'Transferência entre contas',
      date: toBrasiliaISOString(),
      account_id: toAccountId,
      is_transfer: true,
      paid: true,
    });

    // Update balances
    await accountsService.updateBalance(fromAccountId, amount, 'subtract');
    await accountsService.updateBalance(toAccountId, amount, 'add');
  },

  async update(id: number, transaction: TransactionUpdate): Promise<FinanceTransaction> {
    const { data, error } = await supabase
      .from('finance_transactions')
      .update({ ...transaction, updated_at: toBrasiliaISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: number): Promise<void> {
    // Get transaction first to reverse balance
    const { data: transaction } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (transaction && !transaction.is_transfer) {
      if (transaction.account_id && !transaction.card_id) {
        await accountsService.updateBalance(
          transaction.account_id,
          Number(transaction.amount),
          transaction.type === 'income' ? 'subtract' : 'add'
        );
      }
      
      // Para cartão: se for parcela, calcular valor total para remover
      if (transaction.card_id) {
        // Se é a primeira parcela (parent), remover valor total
        if (transaction.installments_total > 1 && transaction.installment_current === 1) {
          const totalAmount = Number(transaction.amount) * transaction.installments_total;
          await creditCardsService.updateBalance(transaction.card_id, totalAmount, 'subtract');
          
          // Deletar todas as parcelas filhas também
          await supabase
            .from('finance_transactions')
            .delete()
            .eq('parent_transaction_id', transaction.id);
        } 
        // Se é uma parcela filha, não mexer no saldo (já foi contabilizado no total)
        else if (transaction.parent_transaction_id) {
          // Apenas deleta a parcela, sem alterar saldo
        }
        // Transação simples (não parcelada)
        else {
          await creditCardsService.updateBalance(transaction.card_id, Number(transaction.amount), 'subtract');
        }
      }
    }

    const { error } = await supabase
      .from('finance_transactions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async markAsPaid(id: number, accountId?: string): Promise<void> {
    const { data: transaction } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (transaction && !transaction.paid) {
      await supabase
        .from('finance_transactions')
        .update({ paid: true, account_id: accountId || transaction.account_id })
        .eq('id', id);

      if (accountId || transaction.account_id) {
        await accountsService.updateBalance(
          accountId || transaction.account_id!,
          Number(transaction.amount),
          transaction.type === 'income' ? 'add' : 'subtract'
        );
      }
    }
  }
};

// ============ ANALYTICS SERVICE ============
export const financeAnalyticsService = {
  async getSummary(userId: string): Promise<FinanceSummary> {
    const [accounts, cards, bills, transactions] = await Promise.all([
      accountsService.list(userId),
      creditCardsService.list(userId),
      recurringBillsService.list(userId),
      transactionsService.list(userId, 
        format(startOfMonth(getBrasiliaDate()), 'yyyy-MM-dd'),
        format(endOfMonth(getBrasiliaDate()), 'yyyy-MM-dd')
      ),
    ]);

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const creditUsed = cards.reduce((sum, card) => sum + Number(card.current_balance), 0);
    const creditAvailable = cards.reduce((sum, card) => sum + (Number(card.card_limit) - Number(card.current_balance)), 0);
    
    const pendingBills = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);
    
    // Receitas: apenas transações de receita que não são transferência
    const totalIncome = transactions
      .filter(t => t.type === 'income' && !t.is_transfer)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Despesas: apenas transações de despesa que NÃO são de cartão de crédito
    // Gastos no cartão não afetam o saldo bancário até o pagamento da fatura
    const totalExpenses = transactions
      .filter(t => t.type === 'expense' && !t.is_transfer && !t.card_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Saldo livre = saldo total - compromissos recorrentes
    const freeBalance = totalBalance - pendingBills;

    return {
      totalBalance,
      freeBalance,
      totalIncome,
      totalExpenses,
      pendingBills,
      creditUsed,
      creditAvailable,
    };
  },

  async getCashFlow(userId: string, months: number = 6): Promise<CashFlowItem[]> {
    const items: CashFlowItem[] = [];
    const today = getBrasiliaDate();
    
    for (let i = 0; i < months; i++) {
      const monthDate = addMonths(today, i);
      const start = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      
      const transactions = await transactionsService.list(userId, start, end);
      const bills = await recurringBillsService.list(userId);
      
      let income = transactions
        .filter(t => t.type === 'income' && !t.is_transfer)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      let expense = transactions
        .filter(t => t.type === 'expense' && !t.is_transfer)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Add projected recurring bills for future months
      if (i > 0) {
        expense += bills.reduce((sum, bill) => sum + Number(bill.amount), 0);
      }

      items.push({
        date: start,
        income,
        expense,
        balance: income - expense,
        projected: i > 0,
      });
    }

    return items;
  },

  async getCategoryBreakdown(userId: string, startDate?: string, endDate?: string): Promise<CategoryBreakdown[]> {
    // Buscar transações e categorias personalizadas em paralelo
    const [transactions, customCategories] = await Promise.all([
      transactionsService.list(userId, startDate, endDate),
      categoriesService.list(userId),
    ]);
    
    const expenses = transactions.filter(t => t.type === 'expense' && !t.is_transfer);
    
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    expenses.forEach(t => {
      const current = categoryMap.get(t.category) || { amount: 0, count: 0 };
      categoryMap.set(t.category, {
        amount: current.amount + Number(t.amount),
        count: current.count + 1,
      });
    });

    // Função para obter a cor da categoria
    const getCategoryColor = (categorySlug: string): string => {
      // Primeiro tenta nas categorias do sistema
      const systemCategory = (FINANCE_CATEGORIES as any)[categorySlug];
      if (systemCategory) return systemCategory.color;
      
      // Depois tenta nas categorias personalizadas
      const customCategory = customCategories.find(c => c.slug === categorySlug);
      if (customCategory) return customCategory.color_hex;
      
      return '#64748B'; // Fallback
    };
    
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        color: getCategoryColor(category),
        transactions: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);
  },

  async getUpcomingBills(userId: string, days: number = 30): Promise<Array<RecurringBill & { nextDue: Date }>> {
    const bills = await recurringBillsService.list(userId);
    const today = getBrasiliaDate();
    const limit = addDays(today, days);
    
    return bills
      .map(bill => ({
        ...bill,
        nextDue: recurringBillsService.getNextDueDate(bill),
      }))
      .filter(bill => isBefore(bill.nextDue, limit))
      .sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime());
  }
};

// ============ CATEGORIES SERVICE ============
export const categoriesService = {
  async list(userId: string): Promise<FinanceCategory[]> {
    const { data, error } = await supabase
      .from('finance_categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(category: FinanceCategoryInsert, userId: string): Promise<FinanceCategory> {
    // Generate slug from name
    const slug = category.slug || category.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data, error } = await supabase
      .from('finance_categories')
      .insert({
        name: category.name,
        slug,
        type: category.type || 'both',
        color_hex: category.color_hex || '#64748B',
        icon: category.icon || 'Tag',
        is_system: false,
        is_active: true,
        user_id: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, category: FinanceCategoryUpdate): Promise<FinanceCategory> {
    const { data, error } = await supabase
      .from('finance_categories')
      .update({ ...category, updated_at: toBrasiliaISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('finance_categories')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  // Combina categorias do sistema com as personalizadas do usuário
  async getAllCategories(userId: string): Promise<Array<{ slug: string; label: string; color: string; icon: string; isCustom: boolean }>> {
    const customCategories = await this.list(userId);
    
    // Categorias padrão do sistema
    const systemCategories = Object.entries(FINANCE_CATEGORIES).map(([slug, data]) => ({
      slug,
      label: data.label,
      color: data.color,
      icon: data.icon,
      isCustom: false,
    }));

    // Categorias personalizadas
    const userCategories = customCategories.map(cat => ({
      slug: cat.slug,
      label: cat.name,
      color: cat.color_hex,
      icon: cat.icon,
      isCustom: true,
    }));

    return [...systemCategories, ...userCategories];
  }
};

// Export all services
export const financePremiumService = {
  accounts: accountsService,
  cards: creditCardsService,
  bills: recurringBillsService,
  transactions: transactionsService,
  categories: categoriesService,
  analytics: financeAnalyticsService,
};
