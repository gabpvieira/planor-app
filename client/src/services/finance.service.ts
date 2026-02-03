import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type FinanceTransaction = Database['public']['Tables']['finance_transactions']['Row'];
type FinanceTransactionInsert = Database['public']['Tables']['finance_transactions']['Insert'];
type FinanceTransactionUpdate = Database['public']['Tables']['finance_transactions']['Update'];

export const financeService = {
  async list(userId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('finance_transactions')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data as FinanceTransaction[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as FinanceTransaction;
  },

  async create(transaction: Omit<FinanceTransactionInsert, 'user_id'>, userId: string) {
    const { data, error } = await supabase
      .from('finance_transactions')
      .insert({ ...transaction, user_id: userId } as any)
      .select()
      .single();

    if (error) throw error;
    return data as FinanceTransaction;
  },

  async update(id: number, transaction: FinanceTransactionUpdate) {
    const { data, error } = await supabase
      .from('finance_transactions')
      .update(transaction as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FinanceTransaction;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('finance_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getSummary(userId: string, startDate?: string, endDate?: string) {
    const transactions = await this.list(userId, startDate, endDate);

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      transactions,
    };
  },
};
