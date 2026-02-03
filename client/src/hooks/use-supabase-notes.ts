import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesService } from '@/services/notes.service';
import { useSupabaseAuth } from './use-supabase-auth';
import type { Database } from '@/types/database.types';

type NoteInsert = Database['public']['Tables']['notes']['Insert'];
type NoteUpdate = Database['public']['Tables']['notes']['Update'];

export function useSupabaseNotes() {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['notes', userId],
    queryFn: () => notesService.list(userId!),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (note: Omit<NoteInsert, 'user_id'>) =>
      notesService.create(note, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: NoteUpdate }) =>
      notesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', userId] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: number; isPinned: boolean }) =>
      notesService.togglePin(id, isPinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', userId] });
    },
  });

  return {
    notes,
    isLoading,
    error,
    createNote: createMutation.mutate,
    updateNote: updateMutation.mutate,
    deleteNote: deleteMutation.mutate,
    togglePin: togglePinMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
