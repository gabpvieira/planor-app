/**
 * Hook for managing Push Notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './use-supabase-auth';
import { pushNotifications, NotificationPayload } from '@/services/push-notifications.service';
import { useToast } from './use-toast';

export interface PushNotificationState {
  isSupported: boolean;
  isConfigured: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
}

export function usePushNotifications() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isConfigured: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: true,
  });

  // Initialize state
  useEffect(() => {
    const init = async () => {
      const isSupported = pushNotifications.isSupported();
      const isConfigured = pushNotifications.isConfigured();
      const permission = pushNotifications.getPermissionStatus();
      const isSubscribed = await pushNotifications.isSubscribed();

      setState({
        isSupported,
        isConfigured,
        permission,
        isSubscribed,
        isLoading: false,
      });
    };

    init();
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para ativar notificações.',
        variant: 'destructive',
      });
      return false;
    }

    if (!state.isSupported) {
      toast({
        title: 'Não suportado',
        description: 'Seu navegador não suporta notificações push.',
        variant: 'destructive',
      });
      return false;
    }

    if (!state.isConfigured) {
      toast({
        title: 'Não configurado',
        description: 'As notificações push não estão configuradas no servidor.',
        variant: 'destructive',
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await pushNotifications.subscribe(user.id);
      
      setState(prev => ({
        ...prev,
        permission: 'granted',
        isSubscribed: true,
        isLoading: false,
      }));

      toast({
        title: 'Notificações ativadas',
        description: 'Você receberá notificações push neste dispositivo.',
      });

      return true;
    } catch (error: any) {
      console.error('[Push] Subscribe error:', error);
      
      const permission = pushNotifications.getPermissionStatus();
      setState(prev => ({
        ...prev,
        permission,
        isSubscribed: false,
        isLoading: false,
      }));

      if (permission === 'denied') {
        toast({
          title: 'Permissão negada',
          description: 'Você bloqueou as notificações. Altere nas configurações do navegador.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao ativar',
          description: error.message || 'Não foi possível ativar as notificações.',
          variant: 'destructive',
        });
      }

      return false;
    }
  }, [user?.id, state.isSupported, state.isConfigured, toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await pushNotifications.unsubscribe(user.id);
      
      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toast({
        title: 'Notificações desativadas',
        description: 'Você não receberá mais notificações push neste dispositivo.',
      });

      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      
      setState(prev => ({ ...prev, isLoading: false }));

      toast({
        title: 'Erro ao desativar',
        description: 'Não foi possível desativar as notificações.',
        variant: 'destructive',
      });

      return false;
    }
  }, [user?.id, toast]);

  // Toggle subscription
  const toggle = useCallback(async (): Promise<boolean> => {
    if (state.isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [state.isSubscribed, subscribe, unsubscribe]);

  // Send test notification
  const sendTest = useCallback(async (): Promise<boolean> => {
    if (!state.isSubscribed) {
      toast({
        title: 'Não inscrito',
        description: 'Ative as notificações primeiro.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      await pushNotifications.sendTestNotification();
      
      toast({
        title: 'Teste enviado',
        description: 'Você deve receber uma notificação em instantes.',
      });

      return true;
    } catch (error: any) {
      console.error('[Push] Test notification error:', error);
      
      toast({
        title: 'Erro no teste',
        description: error.message || 'Não foi possível enviar a notificação de teste.',
        variant: 'destructive',
      });

      return false;
    }
  }, [state.isSubscribed, toast]);

  // Request server to send notification
  const sendServerNotification = useCallback(async (
    payload: NotificationPayload
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      return await pushNotifications.requestServerNotification(user.id, payload);
    } catch (error) {
      console.error('[Push] Server notification error:', error);
      return false;
    }
  }, [user?.id]);

  // Get permission status text
  const getPermissionText = useCallback((): string => {
    switch (state.permission) {
      case 'granted':
        return 'Permitido';
      case 'denied':
        return 'Bloqueado';
      default:
        return 'Não solicitado';
    }
  }, [state.permission]);

  // Get status color
  const getStatusColor = useCallback((): string => {
    switch (state.permission) {
      case 'granted':
        return state.isSubscribed ? 'text-green-500' : 'text-yellow-500';
      case 'denied':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  }, [state.permission, state.isSubscribed]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    toggle,
    sendTest,
    sendServerNotification,
    getPermissionText,
    getStatusColor,
  };
}
