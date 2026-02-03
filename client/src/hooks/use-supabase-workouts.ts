import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsService } from '@/services/workouts.service';
import { useSupabaseAuth } from './use-supabase-auth';
import type { Database } from '@/types/database.types';

type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];
type WorkoutUpdate = Database['public']['Tables']['workouts']['Update'];
type WorkoutExerciseInsert = Database['public']['Tables']['workout_exercises']['Insert'];

export function useSupabaseWorkouts() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: workouts = [], isLoading, error } = useQuery({
    queryKey: ['workouts', userId],
    queryFn: () => workoutsService.list(userId!),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: ({
      workout,
      exercises,
    }: {
      workout: Omit<WorkoutInsert, 'user_id'>;
      exercises: Omit<WorkoutExerciseInsert, 'workout_id'>[];
    }) => workoutsService.create(workout, exercises, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: WorkoutUpdate }) =>
      workoutsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => workoutsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] });
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      workoutsService.toggleComplete(id, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] });
    },
  });

  return {
    workouts,
    isLoading,
    error,
    createWorkout: createMutation.mutate,
    updateWorkout: updateMutation.mutate,
    deleteWorkout: deleteMutation.mutate,
    toggleComplete: toggleCompleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
