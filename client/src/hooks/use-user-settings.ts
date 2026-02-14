import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './use-supabase-auth';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

export interface NotificationPrefs {
  agenda: boolean;
  goals: boolean;
  finance: boolean;
  habits: boolean;
  dailySummary: boolean;
  expenseAlerts: boolean;
}

export interface UserSettings {
  displayName: string | null;
  timezone: string;
  notificationPrefs: NotificationPrefs;
  pushSubscription: PushSubscription | null;
  defaultAccountId: string | null;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  agenda: true,
  goals: true,
  finance: true,
  habits: true,
  dailySummary: false,
  expenseAlerts: true,
};

// Brazilian timezones with friendly names
export const BRAZILIAN_TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)', region: 'Brasil' },
  { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)', region: 'Brasil' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)', region: 'Brasil' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)', region: 'Brasil' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)', region: 'Brasil' },
  { value: 'America/Belem', label: 'Belém (GMT-3)', region: 'Brasil' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)', region: 'Brasil' },
  { value: 'America/Recife', label: 'Recife (GMT-3)', region: 'Brasil' },
  { value: 'America/Bahia', label: 'Salvador (GMT-3)', region: 'Brasil' },
  { value: 'America/Campo_Grande', label: 'Campo Grande (GMT-4)', region: 'Brasil' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4)', region: 'Brasil' },
  { value: 'America/Boa_Vista', label: 'Boa Vista (GMT-4)', region: 'Brasil' },
];

// Common international timezones
export const INTERNATIONAL_TIMEZONES = [
  { value: 'America/New_York', label: 'Nova York (GMT-5)', region: 'América do Norte' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)', region: 'América do Norte' },
  { value: 'America/Chicago', label: 'Chicago (GMT-6)', region: 'América do Norte' },
  { value: 'America/Toronto', label: 'Toronto (GMT-5)', region: 'América do Norte' },
  { value: 'America/Mexico_City', label: 'Cidade do México (GMT-6)', region: 'América do Norte' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (GMT-3)', region: 'América do Sul' },
  { value: 'America/Santiago', label: 'Santiago (GMT-4)', region: 'América do Sul' },
  { value: 'America/Lima', label: 'Lima (GMT-5)', region: 'América do Sul' },
  { value: 'America/Bogota', label: 'Bogotá (GMT-5)', region: 'América do Sul' },
  { value: 'Europe/London', label: 'Londres (GMT+0)', region: 'Europa' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)', region: 'Europa' },
  { value: 'Europe/Berlin', label: 'Berlim (GMT+1)', region: 'Europa' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)', region: 'Europa' },
  { value: 'Europe/Lisbon', label: 'Lisboa (GMT+0)', region: 'Europa' },
  { value: 'Europe/Rome', label: 'Roma (GMT+1)', region: 'Europa' },
  { value: 'Asia/Tokyo', label: 'Tóquio (GMT+9)', region: 'Ásia' },
  { value: 'Asia/Shanghai', label: 'Xangai (GMT+8)', region: 'Ásia' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)', region: 'Ásia' },
  { value: 'Asia/Singapore', label: 'Singapura (GMT+8)', region: 'Ásia' },
  { value: 'Australia/Sydney', label: 'Sydney (GMT+11)', region: 'Oceania' },
  { value: 'Pacific/Auckland', label: 'Auckland (GMT+13)', region: 'Oceania' },
];

export const ALL_TIMEZONES = [...BRAZILIAN_TIMEZONES, ...INTERNATIONAL_TIMEZONES];

export function useUserSettings() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    displayName: null,
    timezone: 'America/Sao_Paulo',
    notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
    pushSubscription: null,
    defaultAccountId: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from Supabase
  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, timezone, notification_prefs, push_subscription, default_account_id')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setSettings({
          displayName: data?.display_name || null,
          timezone: data?.timezone || 'America/Sao_Paulo',
          notificationPrefs: data?.notification_prefs || DEFAULT_NOTIFICATION_PREFS,
          pushSubscription: data?.push_subscription || null,
          defaultAccountId: data?.default_account_id || null,
        });
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [user?.id]);

  // Update display name
  const updateDisplayName = useCallback(async (displayName: string) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, displayName }));
    } catch (error) {
      console.error('Error updating display name:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o nome de exibição.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, toast]);

  // Update timezone
  const updateTimezone = useCallback(async (timezone: string) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ timezone, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, timezone }));
      toast({
        title: 'Fuso horário atualizado',
        description: `Agora usando ${ALL_TIMEZONES.find(tz => tz.value === timezone)?.label || timezone}`,
      });
    } catch (error) {
      console.error('Error updating timezone:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o fuso horário.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, toast]);

  // Update notification preferences
  const updateNotificationPrefs = useCallback(async (prefs: Partial<NotificationPrefs>) => {
    if (!user?.id) return;

    const newPrefs = { ...settings.notificationPrefs, ...prefs };
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_prefs: newPrefs, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, notificationPrefs: newPrefs }));
    } catch (error) {
      console.error('Error updating notification prefs:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar as preferências de notificação.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, settings.notificationPrefs, toast]);

  // Save push subscription
  const savePushSubscription = useCallback(async (subscription: PushSubscription | null) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          push_subscription: subscription ? JSON.parse(JSON.stringify(subscription)) : null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, pushSubscription: subscription }));
      
      if (subscription) {
        toast({
          title: 'Notificações ativadas',
          description: 'Você receberá notificações push neste dispositivo.',
        });
      }
    } catch (error) {
      console.error('Error saving push subscription:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a configuração de notificações.',
        variant: 'destructive',
      });
    }
  }, [user?.id, toast]);

  // Update default account
  const updateDefaultAccount = useCallback(async (accountId: string | null) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ default_account_id: accountId, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, defaultAccountId: accountId }));
      toast({
        title: accountId ? 'Conta principal definida' : 'Conta principal removida',
        description: accountId 
          ? 'Esta conta será usada automaticamente no Command Center.'
          : 'Nenhuma conta padrão configurada.',
      });
    } catch (error) {
      console.error('Error updating default account:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar a conta principal.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, toast]);

  return {
    settings,
    isLoading,
    isSaving,
    updateDisplayName,
    updateTimezone,
    updateNotificationPrefs,
    savePushSubscription,
    updateDefaultAccount,
  };
}
