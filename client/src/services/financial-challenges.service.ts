import { supabase } from '@/lib/supabase';
import type { Database, ChallengeDeposit, ChallengeDirection, ChallengeType, ChallengeStatus } from '@/types/database.types';

type Challenge = Database['public']['Tables']['financial_challenges']['Row'];
type ChallengeInsert = Database['public']['Tables']['financial_challenges']['Insert'];
type ChallengeUpdate = Database['public']['Tables']['financial_challenges']['Update'];

export interface ChallengeWithCalculations extends Challenge {
  // Calculated values
  targetTotal: number;
  currentWeekAmount: number;
  progressPercent: number;
  weeksRemaining: number;
  weeklyAmounts: number[];
  projectedCompletion: Date;
}

// Calculate last week amount: a_n = a_1 + (n - 1) * r
function calculateLastWeekAmount(startAmount: number, stepAmount: number, totalWeeks: number): number {
  return startAmount + (totalWeeks - 1) * stepAmount;
}

// Calculate total: S_n = n * (a_1 + a_n) / 2
function calculateTargetTotal(startAmount: number, stepAmount: number, totalWeeks: number): number {
  const lastAmount = calculateLastWeekAmount(startAmount, stepAmount, totalWeeks);
  return (totalWeeks * (startAmount + lastAmount)) / 2;
}

// Get deposit amount for a specific week
function getWeekDepositAmount(
  startAmount: number,
  stepAmount: number,
  week: number,
  totalWeeks: number,
  direction: ChallengeDirection
): number {
  if (direction === 'standard') {
    return startAmount + (week - 1) * stepAmount;
  } else {
    // Inverse: starts high, decreases
    return startAmount + (totalWeeks - week) * stepAmount;
  }
}

// Generate all weekly amounts (arithmetic progression)
function generateWeeklyAmounts(
  startAmount: number,
  stepAmount: number,
  totalWeeks: number,
  direction: ChallengeDirection
): number[] {
  const amounts: number[] = [];
  for (let week = 1; week <= totalWeeks; week++) {
    amounts.push(getWeekDepositAmount(startAmount, stepAmount, week, totalWeeks, direction));
  }
  return amounts;
}

// Enrich challenge with calculated fields
function enrichChallenge(challenge: Challenge): ChallengeWithCalculations {
  // Use custom_amounts if available, otherwise calculate from arithmetic progression
  const customAmounts = challenge.custom_amounts as number[] | null;
  
  let weeklyAmounts: number[];
  let targetTotal: number;
  
  if (customAmounts && customAmounts.length === challenge.total_weeks) {
    weeklyAmounts = customAmounts;
    targetTotal = customAmounts.reduce((a, b) => a + b, 0);
  } else {
    weeklyAmounts = generateWeeklyAmounts(
      Number(challenge.start_amount),
      Number(challenge.step_amount),
      challenge.total_weeks,
      challenge.direction
    );
    targetTotal = calculateTargetTotal(
      Number(challenge.start_amount),
      Number(challenge.step_amount),
      challenge.total_weeks
    );
  }
  
  const nextWeek = challenge.current_week + 1;
  const currentWeekAmount = nextWeek <= challenge.total_weeks
    ? weeklyAmounts[nextWeek - 1]
    : 0;

  const progressPercent = targetTotal > 0 
    ? (Number(challenge.total_deposited) / targetTotal) * 100 
    : 0;

  const weeksRemaining = challenge.total_weeks - challenge.current_week;
  
  const startDate = new Date(challenge.start_date);
  const projectedCompletion = new Date(startDate);
  projectedCompletion.setDate(projectedCompletion.getDate() + (challenge.total_weeks * 7));

  return {
    ...challenge,
    start_amount: Number(challenge.start_amount),
    step_amount: Number(challenge.step_amount),
    total_deposited: Number(challenge.total_deposited),
    target_amount: challenge.target_amount ? Number(challenge.target_amount) : null,
    targetTotal,
    currentWeekAmount,
    progressPercent,
    weeksRemaining,
    weeklyAmounts,
    projectedCompletion,
  };
}

export const financialChallengesService = {
  // List all challenges for user
  async list(userId: string): Promise<ChallengeWithCalculations[]> {
    const { data, error } = await supabase
      .from('financial_challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(enrichChallenge);
  },

  // Get single challenge
  async getById(id: string): Promise<ChallengeWithCalculations> {
    const { data, error } = await supabase
      .from('financial_challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return enrichChallenge(data);
  },

  // Create new challenge
  async create(challenge: Omit<ChallengeInsert, 'user_id'>, userId: string): Promise<ChallengeWithCalculations> {
    const { data, error } = await supabase
      .from('financial_challenges')
      .insert({ ...challenge, user_id: userId } as ChallengeInsert)
      .select()
      .single();

    if (error) throw error;
    return enrichChallenge(data);
  },

  // Update challenge
  async update(id: string, challenge: ChallengeUpdate): Promise<ChallengeWithCalculations> {
    const { data, error } = await supabase
      .from('financial_challenges')
      .update(challenge as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return enrichChallenge(data);
  },

  // Mark week as paid
  async markWeekPaid(
    id: string, 
    week: number, 
    amount: number,
    createTransaction: boolean = false,
    accountId?: string
  ): Promise<ChallengeWithCalculations> {
    // Get current challenge
    const { data: current, error: fetchError } = await supabase
      .from('financial_challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const depositHistory = (current.deposit_history || []) as ChallengeDeposit[];
    const existingIndex = depositHistory.findIndex(d => d.week === week);
    
    const newDeposit: ChallengeDeposit = {
      week,
      date: new Date().toISOString().split('T')[0],
      status: 'paid',
      amount,
    };

    if (existingIndex >= 0) {
      depositHistory[existingIndex] = newDeposit;
    } else {
      depositHistory.push(newDeposit);
    }

    // Calculate new total deposited
    const totalDeposited = depositHistory
      .filter(d => d.status === 'paid')
      .reduce((sum, d) => sum + d.amount, 0);

    // Update current week to the highest paid week
    const maxPaidWeek = Math.max(...depositHistory.filter(d => d.status === 'paid').map(d => d.week), 0);

    // Check if completed
    const isCompleted = maxPaidWeek >= current.total_weeks;

    const { data, error } = await supabase
      .from('financial_challenges')
      .update({
        deposit_history: depositHistory,
        total_deposited: totalDeposited,
        current_week: maxPaidWeek,
        status: isCompleted ? 'completed' : current.status,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create finance transaction if requested
    if (createTransaction && accountId) {
      await supabase.from('finance_transactions').insert({
        user_id: current.user_id,
        type: 'expense',
        amount: amount,
        category: 'Poupança',
        description: `Desafio ${current.title} - Semana ${week}`,
        date: new Date().toISOString(),
        account_id: accountId,
        paid: true,
      });
    }

    return enrichChallenge(data);
  },

  // Delete challenge
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_challenges')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Pause/Resume challenge
  async togglePause(id: string, currentStatus: ChallengeStatus): Promise<ChallengeWithCalculations> {
    const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
    return this.update(id, { status: newStatus });
  },

  // Calculate simulation values (for preview)
  calculateSimulation(
    startAmount: number,
    stepAmount: number,
    totalWeeks: number,
    direction: ChallengeDirection
  ) {
    const targetTotal = calculateTargetTotal(startAmount, stepAmount, totalWeeks);
    const weeklyAmounts = generateWeeklyAmounts(startAmount, stepAmount, totalWeeks, direction);
    const lastWeekAmount = calculateLastWeekAmount(startAmount, stepAmount, totalWeeks);
    
    return {
      targetTotal,
      weeklyAmounts,
      firstWeekAmount: direction === 'standard' ? startAmount : lastWeekAmount,
      lastWeekAmount: direction === 'standard' ? lastWeekAmount : startAmount,
    };
  },
};
