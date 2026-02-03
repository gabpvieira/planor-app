import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export const appointmentsService = {
  async list(userId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) throw error;
    return data as Appointment[];
  },

  async getById(id: number) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Appointment;
  },

  async create(appointment: Omit<AppointmentInsert, 'user_id'>, userId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...appointment, user_id: userId } as any)
      .select()
      .single();

    if (error) throw error;
    return data as Appointment;
  },

  async update(id: number, appointment: AppointmentUpdate) {
    const { data, error } = await supabase
      .from('appointments')
      .update(appointment as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Appointment;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
