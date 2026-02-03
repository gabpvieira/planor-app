import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type Workout = Database['public']['Tables']['workouts']['Row'];
type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];
type WorkoutUpdate = Database['public']['Tables']['workouts']['Update'];
type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
type WorkoutExerciseInsert = Database['public']['Tables']['workout_exercises']['Insert'];

export type WorkoutWithExercises = Workout & {
  workout_exercises: WorkoutExercise[];
};

export const workoutsService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (*)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data as WorkoutWithExercises[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as WorkoutWithExercises;
  },

  async create(
    workout: Omit<WorkoutInsert, 'user_id'>,
    exercises: Omit<WorkoutExerciseInsert, 'workout_id'>[],
    userId: string
  ) {
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .insert({ ...workout, user_id: userId } as any)
      .select()
      .single();

    if (workoutError) throw workoutError;

    if (exercises.length > 0 && workoutData) {
      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(
          exercises.map((ex) => ({
            ...ex,
            workout_id: workoutData.id,
          })) as any
        );

      if (exercisesError) throw exercisesError;
    }

    return this.getById(workoutData!.id);
  },

  async update(id: number, workout: WorkoutUpdate) {
    const { data, error } = await supabase
      .from('workouts')
      .update(workout as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Workout;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleComplete(id: number, completed: boolean) {
    return this.update(id, { completed });
  },
};
