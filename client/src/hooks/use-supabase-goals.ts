import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsService, GoalCategory, GoalWithProgress } from '@/services/goals.service';
import { useSupabaseAuth } from './use-supabase-auth';
import type { Database, GoalMilestone } from '@/types/database.types';

type GoalInsert = Database['public']['Tables']['goals']['Insert'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];
type GoalTemplate = Database['public']['Tables']['goal_templates']['Row'];

export function useSupabaseGoals(category?: GoalCategory, includeArchived = false) {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: goals = [], isLoading, error } = useQuery({
    queryKey: ['goals', userId, category, includeArchived],
    queryFn: () => goalsService.list(userId!, category, includeArchived),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (goal: Omit<GoalInsert, 'user_id'>) => 
      goalsService.create(goal, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GoalUpdate }) =>
      goalsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, currentValue }: { id: string; currentValue: number }) =>
      goalsService.updateProgress(id, currentValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => goalsService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => goalsService.unarchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => goalsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    },
  });

  return {
    goals,
    isLoading,
    error,
    createGoal: createMutation.mutate,
    updateGoal: updateMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    archiveGoal: archiveMutation.mutate,
    unarchiveGoal: unarchiveMutation.mutate,
    deleteGoal: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useGoalTemplates() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['goal-templates'],
    queryFn: () => goalsService.listTemplates(),
    enabled: !!userId,
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, overrides }: { templateId: string; overrides?: Partial<GoalInsert> }) =>
      goalsService.createFromTemplate(templateId, userId!, overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
    },
  });

  return {
    templates,
    isLoading,
    createFromTemplate: createFromTemplateMutation.mutate,
    isCreating: createFromTemplateMutation.isPending,
  };
}

// Stats hook for dashboard
export function useGoalStats() {
  const { goals, isLoading } = useSupabaseGoals();

  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.progressPercent >= 100).length,
    inProgress: goals.filter(g => g.progressPercent > 0 && g.progressPercent < 100).length,
    notStarted: goals.filter(g => g.progressPercent === 0).length,
    critical: goals.filter(g => g.urgencyLevel === 'critical').length,
    attention: goals.filter(g => g.urgencyLevel === 'attention').length,
    byCategory: {
      financas: goals.filter(g => g.category === 'financas').length,
      pessoal: goals.filter(g => g.category === 'pessoal').length,
      saude: goals.filter(g => g.category === 'saude').length,
      carreira: goals.filter(g => g.category === 'carreira').length,
    },
    averageProgress: goals.length > 0 
      ? goals.reduce((acc, g) => acc + g.progressPercent, 0) / goals.length 
      : 0,
  };

  return { stats, isLoading };
}
