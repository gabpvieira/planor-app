import { supabase } from '@/lib/supabase';
import type { Database, MealPlanJson } from '@/types/database.types';

type NutritionProfile = Database['public']['Tables']['nutrition_profiles']['Row'];
type NutritionProfileInsert = Database['public']['Tables']['nutrition_profiles']['Insert'];
type NutritionProfileUpdate = Database['public']['Tables']['nutrition_profiles']['Update'];
type FoodLog = Database['public']['Tables']['daily_food_logs']['Row'];
type FoodLogInsert = Database['public']['Tables']['daily_food_logs']['Insert'];
type MealPlan = Database['public']['Tables']['meal_plans']['Row'];
type MealPlanInsert = Database['public']['Tables']['meal_plans']['Insert'];

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: {
    breakfast: FoodLog[];
    lunch: FoodLog[];
    dinner: FoodLog[];
    snack: FoodLog[];
  };
}

export interface WeeklyData {
  date: string;
  calories: number;
  target: number;
}

export const nutritionService = {
  // ===== PROFILE =====
  async getProfile(userId: string): Promise<NutritionProfile | null> {
    const { data, error } = await supabase
      .from('nutrition_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async upsertProfile(userId: string, profile: Partial<NutritionProfileUpdate>): Promise<NutritionProfile> {
    const { data: existing } = await supabase
      .from('nutrition_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('nutrition_profiles')
        .update(profile)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('nutrition_profiles')
        .insert({ user_id: userId, ...profile } as NutritionProfileInsert)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // ===== FOOD LOGS =====
  async getFoodLogs(userId: string, date: string): Promise<FoodLog[]> {
    const { data, error } = await supabase
      .from('daily_food_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_at', date)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getDailySummary(userId: string, date: string): Promise<DailyNutritionSummary> {
    const logs = await this.getFoodLogs(userId, date);
    
    const meals = {
      breakfast: logs.filter(l => l.meal_type === 'breakfast'),
      lunch: logs.filter(l => l.meal_type === 'lunch'),
      dinner: logs.filter(l => l.meal_type === 'dinner'),
      snack: logs.filter(l => l.meal_type === 'snack'),
    };

    return {
      date,
      totalCalories: logs.reduce((sum, l) => sum + (l.calories || 0), 0),
      totalProtein: logs.reduce((sum, l) => sum + Number(l.protein || 0), 0),
      totalCarbs: logs.reduce((sum, l) => sum + Number(l.carbs || 0), 0),
      totalFat: logs.reduce((sum, l) => sum + Number(l.fat || 0), 0),
      meals,
    };
  },

  async getWeeklyData(userId: string, endDate: string): Promise<WeeklyData[]> {
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    const { data, error } = await supabase
      .from('daily_food_logs')
      .select('logged_at, calories')
      .eq('user_id', userId)
      .gte('logged_at', start.toISOString().split('T')[0])
      .lte('logged_at', end.toISOString().split('T')[0]);

    if (error) throw error;

    const profile = await this.getProfile(userId);
    const target = profile?.daily_calories_target || 2000;

    // Group by date
    const byDate: Record<string, number> = {};
    (data || []).forEach(log => {
      const d = log.logged_at;
      byDate[d] = (byDate[d] || 0) + (log.calories || 0);
    });

    // Generate 7 days
    const result: WeeklyData[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        calories: byDate[dateStr] || 0,
        target,
      });
    }

    return result;
  },

  async addFoodLog(userId: string, food: Omit<FoodLogInsert, 'user_id'>): Promise<FoodLog> {
    const { data, error } = await supabase
      .from('daily_food_logs')
      .insert({ ...food, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFoodLog(id: number): Promise<void> {
    const { error } = await supabase
      .from('daily_food_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ===== AI FOOD ANALYSIS =====
  async analyzeFoodWithAI(description: string): Promise<{
    food_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    serving_size?: string;
  }> {
    const { data, error } = await supabase.functions.invoke('analyze-food', {
      body: { description },
    });

    if (error) throw error;
    return data;
  },

  // ===== MEAL PLANS =====
  async getMealPlans(userId: string, status?: 'active' | 'archived'): Promise<MealPlan[]> {
    let query = supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getMealPlan(id: string): Promise<MealPlan | null> {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async generateMealPlan(userId: string): Promise<MealPlan> {
    const profile = await this.getProfile(userId);
    
    const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
      body: { 
        userId,
        profile: profile || {
          daily_calories_target: 2000,
          protein_target: 150,
          carbs_target: 250,
          fat_target: 65,
          goal: 'maintain',
        },
      },
    });

    if (error) throw error;

    // Save the generated plan
    const { data: savedPlan, error: saveError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        title: data.title || 'Plano Alimentar Personalizado',
        plan_json: data.plan as MealPlanJson,
        daily_avg_calories: data.plan?.summary?.avgCalories || 0,
      })
      .select()
      .single();

    if (saveError) throw saveError;
    return savedPlan;
  },

  async archiveMealPlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('meal_plans')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteMealPlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
