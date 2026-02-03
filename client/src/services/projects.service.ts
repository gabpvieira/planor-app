import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export const projectsService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('order', { ascending: true });

    if (error) throw error;
    return data as Project[];
  },

  async create(project: Omit<ProjectInsert, 'user_id'>, userId: string) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ ...project, user_id: userId } as any)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  async update(id: string, project: ProjectUpdate) {
    const { data, error } = await supabase
      .from('projects')
      .update(project as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async archive(id: string) {
    return this.update(id, { is_archived: true });
  },
};
