/**
 * Notification Settings Page
 * Dedicated page for managing push notification settings
 * Route: /app/settings/notifications
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useUserSettings, NotificationPrefs } from '@/hooks/use-user-settings';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { FloatingHeader } from '@/components/FloatingHeader';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import {
  Bell,
  BellRing,
  BellOff,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Smartphone,
  Send,
  Info,
  AlertTriangle,
  Calendar,
  Target,
  Wallet,
  Activity,
  Sun,
  AlertCircle,
  Shield,
  RefreshCw,
} from 'lucide-react';

export default function NotificationSettingsPage() {
  const { user } = useSupabaseAuth();
  const { settings, isLoading, isSaving, updateNotificationPrefs } = useUserSettings();
  const push = usePushNotifications();
  const { toast } = useToast();
  
  const [localPrefs, setLocalPrefs] = useState<NotificationPrefs>(settings.notificationPrefs);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local prefs when settings load
  useState(() => {
    setLocalPrefs(settings.notificationPrefs);
  });

  const handlePrefChange = (key: keyof NotificationPrefs, value: boolean) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateNotificationPrefs(localPrefs);
      setHasChanges(false);
      toast({
        title: 'Preferências salvas',
        description: 'Suas configurações de notificação foram atualizadas.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as preferências.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FloatingHeader 
        title="Notificações"
        subtitle="Configure como você recebe alertas"
        actions={
          <Link href="/app/settings">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </Link>
        }
      />

      <div className="px-4 sm:px-6 max-w-2xl mx-auto">

      {/* Push Notification Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
            push.isSubscribed 
              ? "bg-green-500/10" 
              : push.permission === 'denied'
              ? "bg-red-500/10"
              : "bg-primary/10"
          )}>
            {push.isSubscribed ? (
              <BellRing className="w-7 h-7 text-green-500" />
            ) : push.permission === 'denied' ? (
              <BellOff className="w-7 h-7 text-red-500" />
            ) : (
              <Bell className="w-7 h-7 text-primary" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">Notificações Push</h2>
              <StatusBadge status={push.permission} isSubscribed={push.isSubscribed} />
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {getStatusMessage(push)}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {push.isSupported && push.isConfigured && (
                <>
                  {push.permission !== 'denied' && (
                    <Button 
                      onClick={push.toggle}
                      variant={push.isSubscribed ? "outline" : "default"}
                      disabled={push.isLoading}
                      className="gap-2"
                    >
                      {push.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : push.isSubscribed ? (
                        <BellOff className="w-4 h-4" />
                      ) : (
                        <BellRing className="w-4 h-4" />
                      )}
                      {push.isSubscribed ? 'Desativar' : 'Ativar notificações'}
                    </Button>
                  )}

                  {push.isSubscribed && (
                    <Button 
                      onClick={push.sendTest}
                      variant="outline"
                      className="gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Testar
                    </Button>
                  )}
                </>
              )}

              {push.permission === 'denied' && (
                <Button 
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    toast({
                      title: 'Como desbloquear notificações',
                      description: 'Clique no ícone de cadeado/informação na barra de endereço do navegador e altere a permissão de notificações para "Permitir".',
                    });
                  }}
                >
                  <Info className="w-4 h-4" />
                  Como desbloquear
                </Button>
              )}
            </div>

            {/* Device Info */}
            {push.isSubscribed && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Inscrito neste dispositivo
                </span>
                <Check className="w-4 h-4 text-green-500 ml-auto" />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Browser Support Warning */}
      {!push.isSupported && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-500">Navegador não suportado</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Seu navegador não suporta notificações push. Tente usar Chrome, Firefox, Edge ou Safari.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* VAPID Not Configured Warning */}
      {push.isSupported && !push.isConfigured && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-500">Configuração pendente</h4>
              <p className="text-sm text-muted-foreground mt-1">
                As chaves VAPID não estão configuradas no servidor. Entre em contato com o administrador.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notification Categories */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-1">Categorias</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Escolha quais tipos de notificação você deseja receber
        </p>

        <div className="space-y-4">
          <NotificationCategory
            icon={Calendar}
            label="Agenda"
            description="Lembretes de eventos e compromissos"
            checked={localPrefs.agenda}
            onChange={(v) => handlePrefChange('agenda', v)}
          />
          
          <NotificationCategory
            icon={Target}
            label="Metas"
            description="Progresso e prazos de metas"
            checked={localPrefs.goals}
            onChange={(v) => handlePrefChange('goals', v)}
          />
          
          <NotificationCategory
            icon={Wallet}
            label="Finanças"
            description="Transações e alertas financeiros"
            checked={localPrefs.finance}
            onChange={(v) => handlePrefChange('finance', v)}
          />
          
          <NotificationCategory
            icon={Activity}
            label="Hábitos"
            description="Lembretes de hábitos diários"
            checked={localPrefs.habits}
            onChange={(v) => handlePrefChange('habits', v)}
          />
        </div>
      </motion.div>

      {/* Premium Features */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-foreground">Recursos Premium</h3>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
            Premium
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Notificações avançadas para usuários premium
        </p>

        <div className="space-y-4">
          <NotificationCategory
            icon={Sun}
            label="Resumo Diário"
            description="Receba às 08h um resumo do seu dia"
            checked={localPrefs.dailySummary}
            onChange={(v) => handlePrefChange('dailySummary', v)}
            premium
          />
          
          <NotificationCategory
            icon={AlertCircle}
            label="Alerta de Gastos"
            description="Notificar quando despesas forem registradas via IA"
            checked={localPrefs.expenseAlerts}
            onChange={(v) => handlePrefChange('expenseAlerts', v)}
            premium
          />
        </div>
      </motion.div>

      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 flex justify-end"
        >
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 shadow-lg"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Salvar preferências
          </Button>
        </motion.div>
      )}
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status, isSubscribed }: { status: NotificationPermission; isSubscribed: boolean }) {
  if (status === 'granted' && isSubscribed) {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
        Ativo
      </span>
    );
  }
  
  if (status === 'granted') {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
        Permitido
      </span>
    );
  }
  
  if (status === 'denied') {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
        Bloqueado
      </span>
    );
  }
  
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
      Não solicitado
    </span>
  );
}

// Get status message based on push state
function getStatusMessage(push: ReturnType<typeof usePushNotifications>): string {
  if (!push.isSupported) {
    return 'Seu navegador não suporta notificações push.';
  }
  
  if (!push.isConfigured) {
    return 'As notificações push não estão configuradas no servidor.';
  }
  
  if (push.permission === 'denied') {
    return 'Você bloqueou as notificações. Para receber alertas, altere a permissão nas configurações do navegador.';
  }
  
  if (push.permission === 'granted' && push.isSubscribed) {
    return 'Você receberá notificações push neste dispositivo, mesmo quando o Planor não estiver aberto.';
  }
  
  if (push.permission === 'granted') {
    return 'Permissão concedida. Clique em "Ativar notificações" para começar a receber alertas.';
  }
  
  return 'Receba alertas importantes mesmo quando o Planor não estiver aberto no navegador.';
}

// Notification Category Component
function NotificationCategory({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  premium = false,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  premium?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          premium ? "bg-amber-500/10" : "bg-accent"
        )}>
          <Icon className={cn("w-5 h-5", premium ? "text-amber-500" : "text-muted-foreground")} strokeWidth={1.5} />
        </div>
        <div>
          <span className="text-sm font-medium text-foreground">{label}</span>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
