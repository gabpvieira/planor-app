import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type Note = Database['public']['Tables']['notes']['Row'];
type NoteInsert = Database['public']['Tables']['notes']['Insert'];
type NoteUpdate = Database['public']['Tables']['notes']['Update'];

export const notesService = {
  async list(userId: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data as Note[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Note;
  },

  async create(note: Omit<NoteInsert, 'user_id'>, userId: string) {
    const { data, error } = await supabase
      .from('notes')
      .insert({ ...note, user_id: userId } as any)
      .select()
      .single();

    if (error) throw error;
    return data as Note;
  },

  async update(id: number, note: NoteUpdate) {
    const { data, error } = await supabase
      .from('notes')
      .update(note as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Note;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async togglePin(id: number, isPinned: boolean) {
    return this.update(id, { is_pinned: isPinned });
  },
};
