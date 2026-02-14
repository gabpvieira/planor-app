import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionService, MealType } from '@/services/nutrition.service';
import { useSupabaseAuth } from './use-supabase-auth';
import type { Database } from '@/types/database.types';

type NutritionProfileUpdate = Database['public']['Tables']['nutrition_profiles']['Update'];
type FoodLogInsert = Database['public']['Tables']['daily_food_logs']['Insert'];

export function useNutritionProfile() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['nutritionProfile', userId],
    queryFn: () => nutritionService.getProfile(userId!),
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<NutritionProfileUpdate>) =>
      nutritionService.upsertProfile(userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionProfile', userId] });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

export function useDailyNutrition(date: string) {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ['dailyNutrition', userId, date],
    queryFn: () => nutritionService.getDailySummary(userId!, date),
    enabled: !!userId && !!date,
  });

  const addFoodMutation = useMutation({
    mutationFn: (food: Omit<FoodLogInsert, 'user_id'>) =>
      nutritionService.addFoodLog(userId!, food),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyNutrition', userId, date] });
      queryClient.invalidateQueries({ queryKey: ['weeklyNutrition', userId] });
    },
  });

  const deleteFoodMutation = useMutation({
    mutationFn: (id: number) => nutritionService.deleteFoodLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyNutrition', userId, date] });
      queryClient.invalidateQueries({ queryKey: ['weeklyNutrition', userId] });
    },
  });

  const analyzeFoodMutation = useMutation({
    mutationFn: (description: string) => nutritionService.analyzeFoodWithAI(description),
  });

  return {
    summary,
    isLoading,
    refetch,
    addFood: addFoodMutation.mutate,
    addFoodAsync: addFoodMutation.mutateAsync,
    deleteFood: deleteFoodMutation.mutate,
    analyzeFood: analyzeFoodMutation.mutateAsync,
    isAdding: addFoodMutation.isPending,
    isDeleting: deleteFoodMutation.isPending,
    isAnalyzing: analyzeFoodMutation.isPending,
  };
}

export function useWeeklyNutrition(endDate: string) {
  const { user } = useSupabaseAuth();
  const userId = user?.id;

  const { data: weeklyData, isLoading } = useQuery({
    queryKey: ['weeklyNutrition', userId, endDate],
    queryFn: () => nutritionService.getWeeklyData(userId!, endDate),
    enabled: !!userId && !!endDate,
  });

  return { weeklyData, isLoading };
}

export function useMealPlans() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: plans, isLoading } = useQuery({
    queryKey: ['mealPlans', userId],
    queryFn: () => nutritionService.getMealPlans(userId!),
    enabled: !!userId,
  });

  const generateMutation = useMutation({
    mutationFn: () => nutritionService.generateMealPlan(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans', userId] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => nutritionService.archiveMealPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => nutritionService.deleteMealPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans', userId] });
    },
  });

  return {
    plans: plans || [],
    isLoading,
    generatePlan: generateMutation.mutate,
    generatePlanAsync: generateMutation.mutateAsync,
    archivePlan: archiveMutation.mutate,
    deletePlan: deleteMutation.mutate,
    isGenerating: generateMutation.isPending,
  };
}
