import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type KnowledgeItem = Database['public']['Tables']['knowledge_items']['Row'];
type KnowledgeItemInsert = Database['public']['Tables']['knowledge_items']['Insert'];
type KnowledgeItemUpdate = Database['public']['Tables']['knowledge_items']['Update'];

export const knowledgeService = {
  async list(userId: string, topic?: string) {
    let query = supabase
      .from('knowledge_items')
      .select('*')
      .eq('user_id', userId);

    if (topic) {
      query = query.eq('topic', topic);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;
    return data as KnowledgeItem[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as KnowledgeItem;
  },

  async create(item: Omit<KnowledgeItemInsert, 'user_id'>, userId: string) {
    const { data, error } = await supabase
      .from('knowledge_items')
      .insert({ ...item, user_id: userId } as any)
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgeItem;
  },

  async update(id: number, item: KnowledgeItemUpdate) {
    const { data, error } = await supabase
      .from('knowledge_items')
      .update(item as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as KnowledgeItem;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('knowledge_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getTopics(userId: string) {
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('topic')
      .eq('user_id', userId)
      .not('topic', 'is', null);

    if (error) throw error;

    const topics = data.map((item: any) => item.topic).filter(Boolean);
    const uniqueTopics = Array.from(new Set(topics));
    return uniqueTopics as string[];
  },
};
