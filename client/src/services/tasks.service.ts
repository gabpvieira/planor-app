import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import { getBrasiliaDate } from '@shared/utils/timezone';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export const tasksService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, projects(*)')
      .eq('user_id', userId)
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (Task & { projects: Database['public']['Tables']['projects']['Row'] | null })[];
  },

  async listByStatus(userId: string, status: 'active' | 'completed') {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, projects(*)')
      .eq('user_id', userId)
      .eq('status', status)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (Task & { projects: Database['public']['Tables']['projects']['Row'] | null })[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, projects(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Task & { projects: Database['public']['Tables']['projects']['Row'] | null };
  },

  async create(task: Omit<TaskInsert, 'user_id'>, userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ 
        ...task, 
        user_id: userId,
        status: 'active',
        priority: task.priority || 'P3',
        subtasks: task.subtasks || [],
        tags: task.tags || []
      } as any)
      .select('*, projects(*)')
      .single();

    if (error) throw error;
    return data as Task;
  },

  async update(id: number, task: TaskUpdate) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...task,
        updated_at: getBrasiliaDate().toISOString()
      } as any)
      .eq('id', id)
      .select('*, projects(*)')
      .single();

    if (error) throw error;
    return data as Task;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleComplete(id: number, completed: boolean) {
    return this.update(id, { 
      completed,
      status: completed ? 'completed' : 'active'
    });
  },

  async updateSubtasks(id: number, subtasks: any[]) {
    return this.update(id, { subtasks });
  },

  async reorder(tasks: { id: number; order: number }[]) {
    const promises = tasks.map(({ id, order }) =>
      supabase.from('tasks').update({ order } as any).eq('id', id)
    );
    await Promise.all(promises);
  },
};
