import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type Meal = Database['public']['Tables']['meals']['Row'];
type MealInsert = Database['public']['Tables']['meals']['Insert'];
type MealUpdate = Database['public']['Tables']['meals']['Update'];

export const mealsService = {
  async list(userId: string, date?: string) {
    let query = supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId);

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte('date', startOfDay.toISOString())
        .lte('date', endOfDay.toISOString());
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data as Meal[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Meal;
  },

  async create(meal: Omit<MealInsert, 'user_id'>, userId: string) {
    const { data, error } = await supabase
      .from('meals')
      .insert({ ...meal, user_id: userId } as any)
      .select()
      .single();

    if (error) throw error;
    return data as Meal;
  },

  async update(id: number, meal: MealUpdate) {
    const { data, error } = await supabase
      .from('meals')
      .update(meal as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Meal;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
