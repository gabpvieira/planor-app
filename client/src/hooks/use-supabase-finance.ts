import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '@/services/finance.service';
import { useSupabaseAuth } from './use-supabase-auth';
import type { Database } from '@/types/database.types';

type FinanceTransactionInsert = Database['public']['Tables']['finance_transactions']['Insert'];
type FinanceTransactionUpdate = Database['public']['Tables']['finance_transactions']['Update'];

export function useSupabaseFinance(startDate?: string, endDate?: string) {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['finance-transactions', userId, startDate, endDate],
    queryFn: () => financeService.list(userId!, startDate, endDate),
    enabled: !!userId,
  });

  const { data: summary } = useQuery({
    queryKey: ['finance-summary', userId, startDate, endDate],
    queryFn: () => financeService.getSummary(userId!, startDate, endDate),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (transaction: Omit<FinanceTransactionInsert, 'user_id'>) =>
      financeService.create(transaction, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FinanceTransactionUpdate }) =>
      financeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => financeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary', userId] });
    },
  });

  return {
    transactions,
    summary,
    isLoading,
    error,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
