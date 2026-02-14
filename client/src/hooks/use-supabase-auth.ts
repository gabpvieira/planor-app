import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAuthService } from '@/services/supabase-auth.service';
import { useEffect, useState, useCallback } from 'react';

export function useSupabaseAuth() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicialização segura da autenticação
  const { data: authData, isLoading: isLoadingSession, error: sessionError } = useQuery({
    queryKey: ['supabase-auth-init'],
    queryFn: async () => {
      const result = await supabaseAuthService.initializeAuth();
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Não retry em caso de erro de auth
    refetchOnWindowFocus: false,
  });

  // Marca como inicializado quando a query terminar (sucesso ou erro)
  useEffect(() => {
    if (!isLoadingSession) {
      setIsInitialized(true);
    }
  }, [isLoadingSession]);

  const session = authData?.session ?? null;
  const user = authData?.user ?? null;

  const signInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      supabaseAuthService.signIn(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-auth-init'] });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: ({
      email,
      password,
      metadata,
    }: {
      email: string;
      password: string;
      metadata?: { full_name?: string };
    }) => supabaseAuthService.signUp(email, password, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-auth-init'] });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: () => supabaseAuthService.signOut(),
    onSuccess: () => {
      queryClient.clear();
      // Pequeno delay para garantir que o storage foi limpo
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    },
  });

  // Função para forçar logout (útil em caso de erro)
  const forceSignOut = useCallback(async () => {
    await supabaseAuthService.forceSignOut();
    queryClient.clear();
    window.location.href = '/';
  }, [queryClient]);

  // Listen to auth state changes
  useEffect(() => {
    const { data: authListener } = supabaseAuthService.onAuthStateChange(
      (event, newSession) => {
        console.log('[Auth] State change:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          queryClient.invalidateQueries({ queryKey: ['supabase-auth-init'] });
        } else if (event === 'SIGNED_OUT') {
          queryClient.clear();
        } else if (event === 'USER_DELETED') {
          // Usuário foi deletado, força logout
          forceSignOut();
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [queryClient, forceSignOut]);

  // Se houve erro na inicialização (ex: refresh token inválido), 
  // considera como não autenticado mas não trava
  const hasError = !!sessionError;
  
  // Loading só é true durante a inicialização inicial
  // Depois disso, mesmo com erro, não fica em loading
  const isLoading = !isInitialized;

  return {
    session,
    user,
    isLoading,
    isInitialized,
    hasError,
    isAuthenticated: !!session && !!user,
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    signOut: signOutMutation.mutate,
    forceSignOut,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    signInError: signInMutation.error,
    signUpError: signUpMutation.error,
  };
}
