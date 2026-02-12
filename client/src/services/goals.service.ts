import { supabase } from '@/lib/supabase';
import type { Database, GoalMilestone } from '@/types/database.types';
import { getBrasiliaDate } from '@shared/utils/timezone';

type Goal = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];
type GoalTemplate = Database['public']['Tables']['goal_templates']['Row'];

export type GoalCategory = 'financas' | 'pessoal' | 'saude' | 'carreira';

export interface GoalWithProgress extends Goal {
  progressPercent: number;
  daysRemaining: number | null;
  urgencyLevel: 'normal' | 'attention' | 'critical';
  achievedMilestones: GoalMilestone[];
  nextMilestone: GoalMilestone | null;
}

// Calculate progress percentage
function calculateProgress(goal: Goal): number {
  const range = goal.target_value - goal.start_value;
  if (range === 0) return goal.current_value >= goal.target_value ? 100 : 0;
  const progress = ((goal.current_value - goal.start_value) / range) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

// Calculate days remaining until deadline
function calculateDaysRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  const today = getBrasiliaDate();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Determine urgency level based on progress and deadline
function calculateUrgencyLevel(progressPercent: number, daysRemaining: number | null): 'normal' | 'attention' | 'critical' {
  if (daysRemaining === null) return 'normal';
  if (daysRemaining < 0) return 'critical'; // Overdue
  if (daysRemaining <= 7) return 'critical';
  if (daysRemaining <= 30) return 'attention';
  return 'normal';
}

// Get achieved milestones
function getAchievedMilestones(milestones: GoalMilestone[], progressPercent: number): GoalMilestone[] {
  return milestones.filter(m => progressPercent >= m.value);
}

// Get next milestone to achieve
function getNextMilestone(milestones: GoalMilestone[], progressPercent: number): GoalMilestone | null {
  const sorted = [...milestones].sort((a, b) => a.value - b.value);
  return sorted.find(m => progressPercent < m.value) || null;
}

// Enrich goal with calculated fields
function enrichGoal(goal: Goal): GoalWithProgress {
  const progressPercent = calculateProgress(goal);
  const daysRemaining = calculateDaysRemaining(goal.deadline);
  const milestones = (goal.milestones || []) as GoalMilestone[];
  
  return {
    ...goal,
    progressPercent,
    daysRemaining,
    urgencyLevel: calculateUrgencyLevel(progressPercent, daysRemaining),
    achievedMilestones: getAchievedMilestones(milestones, progressPercent),
    nextMilestone: getNextMilestone(milestones, progressPercent),
  };
}

export const goalsService = {
  async list(userId: string, category?: GoalCategory, includeArchived = false): Promise<GoalWithProgress[]> {
    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (category) {
      query = query.eq('category', category);
    }

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(enrichGoal);
  },

  async getById(id: string): Promise<GoalWithProgress> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return enrichGoal(data);
  },

  async create(goal: Omit<GoalInsert, 'user_id'>, userId: string): Promise<GoalWithProgress> {
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: userId } as GoalInsert)
      .select()
      .single();

    if (error) throw error;
    return enrichGoal(data);
  },

  async update(id: string, goal: GoalUpdate): Promise<GoalWithProgress> {
    const { data, error } = await supabase
      .from('goals')
      .update(goal as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return enrichGoal(data);
  },

  async updateProgress(id: string, currentValue: number): Promise<GoalWithProgress> {
    return this.update(id, { current_value: currentValue });
  },

  async archive(id: string): Promise<GoalWithProgress> {
    return this.update(id, { is_archived: true });
  },

  async unarchive(id: string): Promise<GoalWithProgress> {
    return this.update(id, { is_archived: false });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Templates
  async listTemplates(): Promise<GoalTemplate[]> {
    const { data, error } = await supabase
      .from('goal_templates')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async createFromTemplate(templateId: string, userId: string, overrides?: Partial<GoalInsert>): Promise<GoalWithProgress> {
    const { data: template, error: templateError } = await supabase
      .from('goal_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    const goalData: Omit<GoalInsert, 'user_id'> = {
      title: template.name,
      category: template.category,
      unit: template.default_unit,
      milestones: template.default_milestones,
      ...overrides,
    };

    return this.create(goalData, userId);
  },

  // Finance integration helper
  async syncWithFinance(goalId: string, currentBalance: number): Promise<GoalWithProgress> {
    return this.updateProgress(goalId, currentBalance);
  },
};
