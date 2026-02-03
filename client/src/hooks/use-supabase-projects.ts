import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '@/services/projects.service';
import { useSupabaseAuth } from './use-supabase-auth';
import type { Database } from '@/types/database.types';

type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export function useSupabaseProjects() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects', userId],
    queryFn: () => projectsService.list(userId!),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (project: Omit<ProjectInsert, 'user_id'>) =>
      projectsService.create(project, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) =>
      projectsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userId] });
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject: createMutation.mutate,
    updateProject: updateMutation.mutate,
    deleteProject: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
