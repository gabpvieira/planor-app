import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialChallengesService, ChallengeWithCalculations } from '@/services/financial-challenges.service';
import { useSupabaseAuth } from './use-supabase-auth';
import type { Database, ChallengeDirection } from '@/types/database.types';

type ChallengeInsert = Database['public']['Tables']['financial_challenges']['Insert'];
type ChallengeUpdate = Database['public']['Tables']['financial_challenges']['Update'];

export function useFinancialChallenges() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: challenges = [], isLoading, error } = useQuery({
    queryKey: ['financial-challenges', userId],
    queryFn: () => financialChallengesService.list(userId!),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (challenge: Omit<ChallengeInsert, 'user_id'>) =>
      financialChallengesService.create(challenge, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-challenges', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChallengeUpdate }) =>
      financialChallengesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-challenges', userId] });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ 
      id, 
      week, 
      amount, 
      createTransaction, 
      accountId 
    }: { 
      id: string; 
      week: number; 
      amount: number;
      createTransaction?: boolean;
      accountId?: string;
    }) => financialChallengesService.markWeekPaid(id, week, amount, createTransaction, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-challenges', userId] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financialChallengesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-challenges', userId] });
    },
  });

  const togglePauseMutation = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: 'active' | 'paused' | 'completed' | 'cancelled' }) =>
      financialChallengesService.togglePause(id, currentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-challenges', userId] });
    },
  });

  return {
    challenges,
    isLoading,
    error,
    createChallenge: createMutation.mutate,
    updateChallenge: updateMutation.mutate,
    markWeekPaid: markPaidMutation.mutate,
    deleteChallenge: deleteMutation.mutate,
    togglePause: togglePauseMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isMarkingPaid: markPaidMutation.isPending,
  };
}

// Hook for simulation calculations
export function useChallengeSimulation(
  startAmount: number,
  stepAmount: number,
  totalWeeks: number,
  direction: ChallengeDirection
) {
  return financialChallengesService.calculateSimulation(
    startAmount,
    stepAmount,
    totalWeeks,
    direction
  );
}
