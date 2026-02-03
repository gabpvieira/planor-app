import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAuthService } from '@/services/supabase-auth.service';
import { useEffect } from 'react';

export function useSupabaseAuth() {
  const queryClient = useQueryClient();

  const { data: session, isLoading } = useQuery({
    queryKey: ['supabase-session'],
    queryFn: () => supabaseAuthService.getSession(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: user } = useQuery({
    queryKey: ['supabase-user'],
    queryFn: () => supabaseAuthService.getUser(),
    enabled: !!session,
  });

  const signInMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      supabaseAuthService.signIn(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supabase-session'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-user'] });
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
      queryClient.invalidateQueries({ queryKey: ['supabase-session'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-user'] });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: () => supabaseAuthService.signOut(),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/';
    },
  });

  // Listen to auth state changes
  useEffect(() => {
    const { data: authListener } = supabaseAuthService.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          queryClient.invalidateQueries({ queryKey: ['supabase-session'] });
          queryClient.invalidateQueries({ queryKey: ['supabase-user'] });
        } else if (event === 'SIGNED_OUT') {
          queryClient.clear();
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [queryClient]);

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session && !!user,
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    signOut: signOutMutation.mutate,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    signInError: signInMutation.error,
    signUpError: signUpMutation.error,
  };
}
