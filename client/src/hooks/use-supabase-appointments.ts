import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsService } from '@/services/appointments.service';
import { useSupabaseAuth } from './use-supabase-auth';
import type { Database } from '@/types/database.types';

type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export function useSupabaseAppointments(startDate?: string, endDate?: string) {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['appointments', userId, startDate, endDate],
    queryFn: () => appointmentsService.list(userId!, startDate, endDate),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (appointment: Omit<AppointmentInsert, 'user_id'>) =>
      appointmentsService.create(appointment, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AppointmentUpdate }) =>
      appointmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => appointmentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', userId] });
    },
  });

  return {
    appointments,
    isLoading,
    error,
    createAppointment: createMutation.mutate,
    updateAppointment: updateMutation.mutate,
    deleteAppointment: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
