import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks.service';
import { useSupabaseAuth } from './use-supabase-auth';
import type { Database, Subtask } from '@/types/database.types';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type Task = Database['public']['Tables']['tasks']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

export type TaskWithProject = Task & { projects: Project | null };

export function useSupabaseTasks() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks', userId],
    queryFn: () => tasksService.list(userId!),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (task: Omit<TaskInsert, 'user_id'>) =>
      tasksService.create(task, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskUpdate }) =>
      tasksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tasksService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      tasksService.toggleComplete(id, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });

  const updateSubtasksMutation = useMutation({
    mutationFn: ({ id, subtasks }: { id: number; subtasks: Subtask[] }) =>
      tasksService.updateSubtasks(id, subtasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });

  return {
    tasks: tasks as TaskWithProject[],
    isLoading,
    error,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    toggleComplete: toggleCompleteMutation.mutate,
    updateSubtasks: updateSubtasksMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
