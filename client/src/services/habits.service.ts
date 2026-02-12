import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import { getBrasiliaDate, getBrasiliaDateString } from '@shared/utils/timezone';

type Habit = Database['public']['Tables']['habits']['Row'];
type HabitInsert = Database['public']['Tables']['habits']['Insert'];
type HabitUpdate = Database['public']['Tables']['habits']['Update'];
type HabitLog = Database['public']['Tables']['habit_logs']['Row'];
type HabitLogInsert = Database['public']['Tables']['habit_logs']['Insert'];

export type HabitWithLogs = Habit & {
  habit_logs: HabitLog[];
};

// Cores premium para hábitos
export const HABIT_COLORS = [
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Verde', hex: '#10B981' },
  { name: 'Roxo', hex: '#8B5CF6' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Laranja', hex: '#F97316' },
  { name: 'Amarelo', hex: '#EAB308' },
  { name: 'Ciano', hex: '#06B6D4' },
  { name: 'Vermelho', hex: '#EF4444' },
];

// Ícones disponíveis (Lucide)
export const HABIT_ICONS = [
  'Dumbbell', 'BookOpen', 'Droplets', 'Moon', 'Sun', 'Heart', 'Brain', 
  'Coffee', 'Salad', 'Pill', 'Footprints', 'Bike', 'Music', 'Pencil',
  'Code', 'Meditation', 'Leaf', 'Zap', 'Target', 'Trophy', 'Star',
  'Flame', 'Clock', 'Calendar', 'CheckCircle', 'Sparkles'
];

export const habitsService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('habits')
      .select(`
        *,
        habit_logs (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as HabitWithLogs[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('habits')
      .select(`
        *,
        habit_logs (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as HabitWithLogs;
  },

  async create(habit: Omit<HabitInsert, 'user_id'>, userId: string) {
    const { data, error } = await supabase
      .from('habits')
      .insert({ 
        ...habit, 
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        total_completions: 0,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as Habit;
  },

  async update(id: number, habit: HabitUpdate) {
    const { data, error } = await supabase
      .from('habits')
      .update(habit as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Habit;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Completar hábito com lógica de streak
  async completeHabit(habitId: number, date: string) {
    // Primeiro, buscar o hábito atual
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .single();

    if (habitError) throw habitError;

    // Verificar se já foi completado hoje
    const { data: existingLog } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', date)
      .single();

    if (existingLog?.completed) {
      return { habit, log: existingLog, alreadyCompleted: true };
    }

    // Criar ou atualizar o log
    const { data: log, error: logError } = await supabase
      .from('habit_logs')
      .upsert({
        habit_id: habitId,
        date,
        count: 1,
        completed: true,
      } as any, {
        onConflict: 'habit_id,date',
      })
      .select()
      .single();

    if (logError) throw logError;

    // Calcular novo streak
    const yesterday = getBrasiliaDate();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    const lastCompleted = habit.last_completed_at?.split('T')[0];
    
    if (lastCompleted === yesterdayStr) {
      // Continuando streak
      newStreak = (habit.current_streak || 0) + 1;
    } else if (lastCompleted === date) {
      // Já completou hoje, manter streak
      newStreak = habit.current_streak || 1;
    }

    const newLongestStreak = Math.max(newStreak, habit.longest_streak || 0);
    const newTotalCompletions = (habit.total_completions || 0) + 1;

    // Atualizar hábito com novos valores
    const { data: updatedHabit, error: updateError } = await supabase
      .from('habits')
      .update({
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        total_completions: newTotalCompletions,
        last_completed_at: getBrasiliaDate().toISOString(),
      } as any)
      .eq('id', habitId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { habit: updatedHabit, log, alreadyCompleted: false };
  },

  // Buscar logs dos últimos N dias
  async getRecentLogs(habitId: number, days: number = 7) {
    const endDate = getBrasiliaDateString();
    const startDate = getBrasiliaDate();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .gte('date', startDateStr)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data as HabitLog[];
  },

  // Buscar histórico completo para heatmap
  async getHeatmapData(userId: string, year?: number) {
    const targetYear = year || getBrasiliaDate().getFullYear();
    const startDate = `${targetYear}-01-01`;
    const endDate = `${targetYear}-12-31`;

    const { data, error } = await supabase
      .from('habit_logs')
      .select(`
        *,
        habits!inner (user_id)
      `)
      .eq('habits.user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('completed', true);

    if (error) throw error;
    return data;
  },

  // Calcular estatísticas globais do usuário
  async getUserStats(userId: string) {
    const { data: habits, error } = await supabase
      .from('habits')
      .select('current_streak, longest_streak, total_completions')
      .eq('user_id', userId);

    if (error) throw error;

    const totalCompletions = habits.reduce((sum, h) => sum + (h.total_completions || 0), 0);
    const maxStreak = Math.max(...habits.map(h => h.longest_streak || 0), 0);
    const activeStreaks = habits.filter(h => (h.current_streak || 0) > 0).length;

    // Calcular nível de disciplina
    let level = 'Iniciante';
    let xp = totalCompletions;
    let nextLevelXp = 50;

    if (totalCompletions >= 500) {
      level = 'Mestre da Rotina';
      nextLevelXp = 1000;
    } else if (totalCompletions >= 200) {
      level = 'Resiliente';
      nextLevelXp = 500;
    } else if (totalCompletions >= 50) {
      level = 'Constante';
      nextLevelXp = 200;
    }

    return {
      totalCompletions,
      maxStreak,
      activeStreaks,
      totalHabits: habits.length,
      level,
      xp,
      nextLevelXp,
    };
  },

  // Log legado para compatibilidade
  async logHabit(log: Omit<HabitLogInsert, 'id'>) {
    const { data, error } = await supabase
      .from('habit_logs')
      .upsert(log as any, {
        onConflict: 'habit_id,date',
      })
      .select()
      .single();

    if (error) throw error;
    return data as HabitLog;
  },

  async getLogsByDate(habitId: number, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data as HabitLog[];
  },
};
