import { useCallback } from 'react';
import { useSupabaseAppointments } from './use-supabase-appointments';
import { useToast } from './use-toast';
import type { Database } from '@/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

export function useTaskToAgenda() {
  const { createAppointment, isCreating } = useSupabaseAppointments();
  const { toast } = useToast();

  const createTimeBlock = useCallback((
    task: Task,
    startTime: Date,
    options?: { onSuccess?: () => void; onError?: () => void }
  ) => {
    const duration = task.estimated_time || 60; // default 60 minutos
    const endTime = new Date(startTime.getTime() + duration * 60000);

    createAppointment({
      title: task.title,
      description: task.description || `Tarefa: ${task.title}`,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      type: 'block',
      color: getPriorityColor(task.priority),
    }, {
      onSuccess: () => {
        toast({ 
          title: "Time Block criado", 
          description: `"${task.title}" adicionado à agenda` 
        });
        options?.onSuccess?.();
      },
      onError: () => {
        toast({ 
          title: "Erro", 
          description: "Falha ao criar time block", 
          variant: "destructive" 
        });
        options?.onError?.();
      }
    });
  }, [createAppointment, toast]);

  return {
    createTimeBlock,
    isCreating,
  };
}

function getPriorityColor(priority: string | null): string {
  switch (priority) {
    case 'P1':
    case 'high':
      return 'red';
    case 'P2':
      return 'blue';
    case 'P3':
    case 'medium':
      return 'purple';
    case 'P4':
    case 'low':
      return 'green';
    default:
      return 'blue';
  }
}
