import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from './use-supabase-auth';
import { financePremiumService } from '@/services/finance-premium.service';
import type {
  AccountInsert, AccountUpdate,
  CreditCardInsert, CreditCardUpdate,
  RecurringBillInsert, RecurringBillUpdate,
  TransactionInsert, TransactionUpdate,
  FinanceCategoryInsert, FinanceCategoryUpdate,
} from '@/types/finance.types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export function useFinancePremium() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // ============ ACCOUNTS ============
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['finance-accounts', userId],
    queryFn: () => financePremiumService.accounts.list(userId!),
    enabled: !!userId,
  });

  const createAccount = useMutation({
    mutationFn: (data: AccountInsert) => financePremiumService.accounts.create(data, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-accounts', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const updateAccount = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountUpdate }) =>
      financePremiumService.accounts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-accounts', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: (id: string) => financePremiumService.accounts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-accounts', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  // ============ CREDIT CARDS ============
  const { data: creditCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['finance-cards', userId],
    queryFn: () => financePremiumService.cards.list(userId!),
    enabled: !!userId,
  });

  const createCard = useMutation({
    mutationFn: (data: CreditCardInsert) => financePremiumService.cards.create(data, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-cards', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const updateCard = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreditCardUpdate }) =>
      financePremiumService.cards.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-cards', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const deleteCard = useMutation({
    mutationFn: (id: string) => financePremiumService.cards.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-cards', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  // ============ RECURRING BILLS ============
  const { data: recurringBills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['finance-bills', userId],
    queryFn: () => financePremiumService.bills.list(userId!),
    enabled: !!userId,
  });

  const createBill = useMutation({
    mutationFn: (data: RecurringBillInsert) => financePremiumService.bills.create(data, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-bills', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const updateBill = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecurringBillUpdate }) =>
      financePremiumService.bills.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-bills', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const deleteBill = useMutation({
    mutationFn: (id: string) => financePremiumService.bills.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-bills', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  // ============ TRANSACTIONS ============
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['finance-transactions', userId],
    queryFn: () => financePremiumService.transactions.list(userId!),
    enabled: !!userId,
  });

  const createTransaction = useMutation({
    mutationFn: (data: TransactionInsert) => financePremiumService.transactions.create(data, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-accounts', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-cards', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const createInstallments = useMutation({
    mutationFn: ({ data, installments }: { data: TransactionInsert; installments: number }) =>
      financePremiumService.transactions.createInstallments(data, userId!, installments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-cards', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const createTransfer = useMutation({
    mutationFn: ({ from, to, amount, description }: { from: string; to: string; amount: number; description?: string }) =>
      financePremiumService.transactions.createTransfer(from, to, amount, userId!, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-accounts', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransactionUpdate }) =>
      financePremiumService.transactions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: (id: number) => financePremiumService.transactions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-accounts', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-cards', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const markAsPaid = useMutation({
    mutationFn: ({ id, accountId }: { id: number; accountId?: string }) =>
      financePremiumService.transactions.markAsPaid(id, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-accounts', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  // ============ ANALYTICS ============
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['finance-summary', userId],
    queryFn: () => financePremiumService.analytics.getSummary(userId!),
    enabled: !!userId,
  });

  const { data: cashFlow = [], isLoading: cashFlowLoading } = useQuery({
    queryKey: ['finance-cashflow', userId],
    queryFn: () => financePremiumService.analytics.getCashFlow(userId!, 6),
    enabled: !!userId,
  });

  const { data: categoryBreakdown = [], isLoading: breakdownLoading } = useQuery({
    queryKey: ['finance-breakdown', userId],
    queryFn: () => financePremiumService.analytics.getCategoryBreakdown(
      userId!,
      format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      format(endOfMonth(new Date()), 'yyyy-MM-dd')
    ),
    enabled: !!userId,
  });

  const { data: upcomingBills = [], isLoading: upcomingLoading } = useQuery({
    queryKey: ['finance-upcoming', userId],
    queryFn: () => financePremiumService.analytics.getUpcomingBills(userId!, 30),
    enabled: !!userId,
  });

  // ============ CATEGORIES ============
  const { data: customCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['finance-categories', userId],
    queryFn: () => financePremiumService.categories.list(userId!),
    enabled: !!userId,
  });

  const { data: allCategories = [], isLoading: allCategoriesLoading } = useQuery({
    queryKey: ['finance-all-categories', userId],
    queryFn: () => financePremiumService.categories.getAllCategories(userId!),
    enabled: !!userId,
  });

  const createCategory = useMutation({
    mutationFn: (data: FinanceCategoryInsert) => financePremiumService.categories.create(data, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-categories', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-all-categories', userId] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FinanceCategoryUpdate }) =>
      financePremiumService.categories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-categories', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-all-categories', userId] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => financePremiumService.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-categories', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-all-categories', userId] });
    },
  });

  return {
    // Data
    accounts,
    creditCards,
    recurringBills,
    transactions,
    summary,
    cashFlow,
    categoryBreakdown,
    upcomingBills,
    customCategories,
    allCategories,

    // Loading states
    isLoading: accountsLoading || cardsLoading || billsLoading || transactionsLoading,
    summaryLoading,
    cashFlowLoading,
    breakdownLoading,
    upcomingLoading,
    categoriesLoading,
    allCategoriesLoading,

    // Account mutations
    createAccount: createAccount.mutate,
    updateAccount: updateAccount.mutate,
    deleteAccount: deleteAccount.mutate,

    // Card mutations
    createCard: createCard.mutate,
    updateCard: updateCard.mutate,
    deleteCard: deleteCard.mutate,

    // Bill mutations
    createBill: createBill.mutate,
    updateBill: updateBill.mutate,
    deleteBill: deleteBill.mutate,

    // Transaction mutations
    createTransaction: createTransaction.mutate,
    createInstallments: createInstallments.mutate,
    createTransfer: createTransfer.mutate,
    updateTransaction: updateTransaction.mutate,
    deleteTransaction: deleteTransaction.mutate,
    markAsPaid: markAsPaid.mutate,

    // Category mutations
    createCategory: createCategory.mutate,
    updateCategory: updateCategory.mutate,
    deleteCategory: deleteCategory.mutate,

    // Mutation states
    isCreating: createAccount.isPending || createCard.isPending || createBill.isPending || createTransaction.isPending || createCategory.isPending,
  };
}
