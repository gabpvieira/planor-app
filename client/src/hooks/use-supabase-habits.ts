import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsService, HabitWithLogs } from '@/services/habits.service';
import { useSupabaseAuth } from './use-supabase-auth';
import type { Database } from '@/types/database.types';
import { getBrasiliaDateString, toBrasiliaISOString } from '@shared/utils/timezone';

type HabitInsert = Database['public']['Tables']['habits']['Insert'];
type HabitUpdate = Database['public']['Tables']['habits']['Update'];

export function useSupabaseHabits() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: habits = [], isLoading, error } = useQuery({
    queryKey: ['habits', userId],
    queryFn: () => habitsService.list(userId!),
    enabled: !!userId,
  });

  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['habits-stats', userId],
    queryFn: () => habitsService.getUserStats(userId!),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (habit: Omit<HabitInsert, 'user_id'>) =>
      habitsService.create(habit, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
      queryClient.invalidateQueries({ queryKey: ['habits-stats', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: HabitUpdate }) =>
      habitsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => habitsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
      queryClient.invalidateQueries({ queryKey: ['habits-stats', userId] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ habitId, date }: { habitId: number; date: string }) =>
      habitsService.completeHabit(habitId, date),
    onMutate: async ({ habitId, date }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['habits', userId] });
      const previousHabits = queryClient.getQueryData<HabitWithLogs[]>(['habits', userId]);
      
      if (previousHabits) {
        queryClient.setQueryData<HabitWithLogs[]>(['habits', userId], (old) =>
          old?.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  habit_logs: [
                    ...habit.habit_logs,
                    { id: Date.now(), habit_id: habitId, date, count: 1, completed: true, created_at: toBrasiliaISOString(), updated_at: toBrasiliaISOString() },
                  ],
                }
              : habit
          )
        );
      }
      
      return { previousHabits };
    },
    onError: (err, variables, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(['habits', userId], context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', userId] });
      queryClient.invalidateQueries({ queryKey: ['habits-stats', userId] });
    },
  });

  // Agrupar hábitos por período do dia
  const habitsByTimeOfDay = {
    morning: habits.filter((h) => h.time_of_day === 'morning'),
    afternoon: habits.filter((h) => h.time_of_day === 'afternoon'),
    evening: habits.filter((h) => h.time_of_day === 'evening'),
    unassigned: habits.filter((h) => !h.time_of_day),
  };

  // Verificar se todos os hábitos do dia foram completados
  const today = getBrasiliaDateString();
  const completedToday = habits.filter((habit) =>
    habit.habit_logs?.some((log) => log.date === today && log.completed)
  ).length;
  const allCompletedToday = habits.length > 0 && completedToday === habits.length;

  return {
    habits,
    habitsByTimeOfDay,
    userStats,
    isLoading,
    isLoadingStats,
    error,
    completedToday,
    totalHabits: habits.length,
    allCompletedToday,
    createHabit: createMutation.mutate,
    updateHabit: updateMutation.mutate,
    deleteHabit: deleteMutation.mutate,
    completeHabit: completeMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCompleting: completeMutation.isPending,
  };
}
