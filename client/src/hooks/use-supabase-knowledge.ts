import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { knowledgeService, KnowledgeFilter } from '@/services/knowledge.service';
import { useSupabaseAuth } from './use-supabase-auth';
import type { Database } from '@/types/database.types';

type KnowledgeItemInsert = Database['public']['Tables']['knowledge_items']['Insert'];
type KnowledgeItemUpdate = Database['public']['Tables']['knowledge_items']['Update'];

export function useSupabaseKnowledge(filter: KnowledgeFilter = 'all', search?: string) {
  const { user } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['knowledge', userId, filter, search],
    queryFn: ({ pageParam = 0 }) => 
      knowledgeService.listPaginated(userId!, filter, search, pageParam, 20),
    getNextPageParam: (lastPage, pages) => 
      lastPage.hasMore ? pages.length : undefined,
    enabled: !!userId,
    initialPageParam: 0,
  });

  const items = data?.pages.flatMap(page => page.items) ?? [];

  const createMutation = useMutation({
    mutationFn: (item: Omit<KnowledgeItemInsert, 'user_id'>) =>
      knowledgeService.create(item, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: KnowledgeItemUpdate }) =>
      knowledgeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => knowledgeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', userId] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: number; isFavorite: boolean }) =>
      knowledgeService.toggleFavorite(id, isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', userId] });
    },
  });

  const toggleToReadMutation = useMutation({
    mutationFn: ({ id, isToRead }: { id: number; isToRead: boolean }) =>
      knowledgeService.toggleToRead(id, isToRead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', userId] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => knowledgeService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', userId] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ id, progress }: { id: number; progress: number }) =>
      knowledgeService.updateProgress(id, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', userId] });
    },
  });

  const markReviewedMutation = useMutation({
    mutationFn: (id: number) => knowledgeService.markReviewed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', userId] });
      queryClient.invalidateQueries({ queryKey: ['dailyFlashcard', userId] });
    },
  });

  return {
    items,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createItem: createMutation.mutate,
    updateItem: updateMutation.mutate,
    deleteItem: deleteMutation.mutate,
    toggleFavorite: toggleFavoriteMutation.mutate,
    toggleToRead: toggleToReadMutation.mutate,
    archiveItem: archiveMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    markReviewed: markReviewedMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useDailyFlashcard() {
  const { user } = useSupabaseAuth();
  const userId = user?.id;

  const { data: flashcard, isLoading, refetch } = useQuery({
    queryKey: ['dailyFlashcard', userId],
    queryFn: () => knowledgeService.getDailyFlashcard(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return { flashcard, isLoading, refetch };
}
