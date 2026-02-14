import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type KnowledgeItem = Database['public']['Tables']['knowledge_items']['Row'];
type KnowledgeItemInsert = Database['public']['Tables']['knowledge_items']['Insert'];
type KnowledgeItemUpdate = Database['public']['Tables']['knowledge_items']['Update'];

export type KnowledgeFilter = 'all' | 'to_read' | 'favorites' | 'archived';

export const knowledgeService = {
  async list(userId: string, filter: KnowledgeFilter = 'all', search?: string) {
    let query = supabase
      .from('knowledge_items')
      .select('*')
      .eq('user_id', userId);

    // Apply filter
    switch (filter) {
      case 'to_read':
        query = query.eq('is_to_read', true).eq('is_archived', false);
        break;
      case 'favorites':
        query = query.eq('is_favorite', true).eq('is_archived', false);
        break;
      case 'archived':
        query = query.eq('is_archived', true);
        break;
      default:
        query = query.eq('is_archived', false);
    }

    // Apply search
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;
    return data as KnowledgeItem[];
  },

  async listPaginated(
    userId: string, 
    filter: KnowledgeFilter = 'all', 
    search?: string,
    page: number = 0,
    pageSize: number = 20
  ) {
    let query = supabase
      .from('knowledge_items')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    switch (filter) {
      case 'to_read':
        query = query.eq('is_to_read', true).eq('is_archived', false);
        break;
      case 'favorites':
        query = query.eq('is_favorite', true).eq('is_archived', false);
        break;
      case 'archived':
        query = query.eq('is_archived', true);
        break;
      default:
        query = query.eq('is_archived', false);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { 
      items: data as KnowledgeItem[], 
      total: count || 0,
      hasMore: (count || 0) > to + 1
    };
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
      .update({ ...item, updated_at: new Date().toISOString() } as any)
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

  async toggleFavorite(id: number, isFavorite: boolean) {
    return this.update(id, { is_favorite: isFavorite });
  },

  async toggleToRead(id: number, isToRead: boolean) {
    return this.update(id, { is_to_read: isToRead });
  },

  async archive(id: number) {
    return this.update(id, { is_archived: true });
  },

  async unarchive(id: number) {
    return this.update(id, { is_archived: false });
  },

  async updateProgress(id: number, progress: number) {
    return this.update(id, { progress: Math.min(100, Math.max(0, progress)) });
  },

  async markReviewed(id: number) {
    return this.update(id, { last_reviewed_at: new Date().toISOString() });
  },

  // Get a random item for daily flashcard (not reviewed in last 7 days)
  async getDailyFlashcard(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('knowledge_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .or(`last_reviewed_at.is.null,last_reviewed_at.lt.${sevenDaysAgo.toISOString()}`)
      .not('ai_summary', 'is', null)
      .limit(10);

    if (error) throw error;
    
    if (!data || data.length === 0) {
      // Fallback: get any item with content
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false)
        .not('content', 'is', null)
        .limit(10);
      
      if (fallbackError) throw fallbackError;
      if (!fallbackData || fallbackData.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * fallbackData.length);
      return fallbackData[randomIndex] as KnowledgeItem;
    }

    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex] as KnowledgeItem;
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

  async getAllTags(userId: string) {
    const { data, error } = await supabase
      .from('knowledge_items')
      .select('tags')
      .eq('user_id', userId);

    if (error) throw error;

    const allTags = data.flatMap((item: any) => item.tags || []);
    const uniqueTags = Array.from(new Set(allTags));
    return uniqueTags as string[];
  },
};
