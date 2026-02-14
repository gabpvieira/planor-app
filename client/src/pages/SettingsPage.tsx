import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useUserSettings, ALL_TIMEZONES, BRAZILIAN_TIMEZONES, INTERNATIONAL_TIMEZONES, NotificationPrefs } from '@/hooks/use-user-settings';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { FloatingHeader } from '@/components/FloatingHeader';
import {
  User,
  Globe,
  Bell,
  Settings,
  LogOut,
  Check,
  Loader2,
  Search,
  Calendar,
  Target,
  Wallet,
  Activity,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Sun,
  Clock,
  Save,
  BellRing,
  BellOff,
  Smartphone,
  Send,
  Info,
  Building2,
  Star,
} from 'lucide-react';

type SettingsSection = 'profile' | 'regional' | 'notifications' | 'finance' | 'system';

const SECTIONS = [
  { id: 'profile' as const, label: 'Perfil', icon: User },
  { id: 'regional' as const, label: 'Regional', icon: Globe },
  { id: 'notifications' as const, label: 'Notificações', icon: Bell },
  { id: 'finance' as const, label: 'Finanças', icon: Wallet },
  { id: 'system' as const, label: 'Sistema', icon: Settings },
];

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  bank_slug: string | null;
  logo_url: string | null;
}

export default function SettingsPage() {
  const { user, signOut } = useSupabaseAuth();
  const { settings, isLoading, isSaving, updateDisplayName, updateTimezone, updateNotificationPrefs, updateDefaultAccount } = useUserSettings();
  const pushNotifications = usePushNotifications();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  
  // Local state for form
  const [localDisplayName, setLocalDisplayName] = useState('');
  const [localTimezone, setLocalTimezone] = useState('America/Sao_Paulo');
  const [localNotificationPrefs, setLocalNotificationPrefs] = useState<NotificationPrefs>({
    agenda: true,
    goals: true,
    finance: true,
    habits: true,
    dailySummary: false,
    expenseAlerts: true,
  });
  
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Load accounts
  useEffect(() => {
    async function loadAccounts() {
      if (!user?.id) return;
      setLoadingAccounts(true);
      try {
        const { data } = await supabase
          .from('accounts')
          .select('id, name, type, balance, bank_slug, logo_url')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true });
        setAccounts(data || []);
      } catch (error) {
        console.error('Error loading accounts:', error);
      } finally {
        setLoadingAccounts(false);
      }
    }
    loadAccounts();
  }, [user?.id]);

  // Initialize local state from settings
  useEffect(() => {
    if (!isLoading) {
      setLocalDisplayName(settings.displayName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
      setLocalTimezone(settings.timezone);
      setLocalNotificationPrefs(settings.notificationPrefs);
    }
  }, [settings, isLoading, user]);

  // Check for changes
  useEffect(() => {
    const displayNameChanged = localDisplayName !== (settings.displayName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
    const timezoneChanged = localTimezone !== settings.timezone;
    const notificationPrefsChanged = JSON.stringify(localNotificationPrefs) !== JSON.stringify(settings.notificationPrefs);
    
    setHasChanges(displayNameChanged || timezoneChanged || notificationPrefsChanged);
  }, [localDisplayName, localTimezone, localNotificationPrefs, settings, user]);

  // Filter timezones based on search
  const filteredTimezones = timezoneSearch
    ? ALL_TIMEZONES.filter(tz => 
        tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
        tz.value.toLowerCase().includes(timezoneSearch.toLowerCase())
      )
    : null;

  // Save all changes
  const handleSaveAll = async () => {
    try {
      // Update display name if changed
      if (localDisplayName !== settings.displayName) {
        await updateDisplayName(localDisplayName);
      }
      
      // Update timezone if changed
      if (localTimezone !== settings.timezone) {
        await updateTimezone(localTimezone);
      }
      
      // Update notification prefs if changed
      if (JSON.stringify(localNotificationPrefs) !== JSON.stringify(settings.notificationPrefs)) {
        await updateNotificationPrefs(localNotificationPrefs);
      }
      
      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências foram atualizadas com sucesso.',
      });
      
      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
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
        title="Configurações"
        subtitle="Gerencie suas preferências e conta"
        actions={
          <Button 
            onClick={handleSaveAll} 
            disabled={!hasChanges || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Salvar alterações</span>
          </Button>
        }
      />

      <div className="px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar Navigation */}
        <nav className="lg:w-56 shrink-0">
          <div className="glass-card rounded-2xl p-2 space-y-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    "text-left text-sm font-medium",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  <span>{section.label}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="mt-4">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-500/10 text-sm font-medium"
            >
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
              <span>Sair da conta</span>
            </button>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeSection === 'profile' && (
              <SettingsCard key="profile" title="Perfil" description="Gerencie suas informações pessoais">
                {/* Avatar Section */}
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-20 h-20 ring-4 ring-background shadow-xl">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-semibold">
                      {user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{user?.email}</p>
                    <p className="text-sm text-muted-foreground">Membro desde {new Date(user?.created_at || '').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Display Name Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome de exibição</label>
                  <Input
                    value={localDisplayName}
                    onChange={(e) => setLocalDisplayName(e.target.value)}
                    placeholder="Como você quer ser chamado?"
                    className="bg-background/50 border-border/50 focus:border-primary/50"
                  />
                  <p className="text-xs text-muted-foreground">Este nome aparecerá na saudação do Dashboard</p>
                </div>
              </SettingsCard>
            )}

            {activeSection === 'regional' && (
              <SettingsCard key="regional" title="Regional" description="Configure seu fuso horário e preferências regionais">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Fuso horário
                    </label>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={timezoneSearch}
                        onChange={(e) => setTimezoneSearch(e.target.value)}
                        placeholder="Buscar fuso horário..."
                        className="pl-10 bg-background/50 border-border/50"
                      />
                    </div>
                  </div>

                  {/* Timezone List */}
                  <div className="max-h-80 overflow-y-auto rounded-xl border border-border/50 bg-background/30">
                    {filteredTimezones ? (
                      <div className="p-2 space-y-1">
                        {filteredTimezones.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum resultado encontrado</p>
                        ) : (
                          filteredTimezones.map((tz) => (
                            <TimezoneOption
                              key={tz.value}
                              timezone={tz}
                              isSelected={localTimezone === tz.value}
                              onSelect={() => {
                                setLocalTimezone(tz.value);
                                setTimezoneSearch('');
                              }}
                            />
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-border/30">
                        <div className="p-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                            🇧🇷 Brasil
                          </p>
                          <div className="space-y-1">
                            {BRAZILIAN_TIMEZONES.map((tz) => (
                              <TimezoneOption
                                key={tz.value}
                                timezone={tz}
                                isSelected={localTimezone === tz.value}
                                onSelect={() => setLocalTimezone(tz.value)}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="p-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                            🌍 Internacional
                          </p>
                          <div className="space-y-1">
                            {INTERNATIONAL_TIMEZONES.map((tz) => (
                              <TimezoneOption
                                key={tz.value}
                                timezone={tz}
                                isSelected={localTimezone === tz.value}
                                onSelect={() => setLocalTimezone(tz.value)}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    O fuso horário afeta como datas e horários são exibidos na Agenda e Hábitos.
                  </p>
                </div>
              </SettingsCard>
            )}

            {activeSection === 'notifications' && (
              <SettingsCard key="notifications" title="Notificações" description="Controle quais alertas você deseja receber">
                {/* Push Notification Setup - Enhanced */}
                <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      pushNotifications.isSubscribed ? "bg-green-500/10" : "bg-primary/10"
                    )}>
                      {pushNotifications.isSubscribed ? (
                        <BellRing className="w-5 h-5 text-green-500" />
                      ) : (
                        <Bell className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">Notificações Push</h4>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          pushNotifications.permission === 'granted' 
                            ? pushNotifications.isSubscribed 
                              ? "bg-green-500/10 text-green-500" 
                              : "bg-yellow-500/10 text-yellow-500"
                            : pushNotifications.permission === 'denied'
                            ? "bg-red-500/10 text-red-500"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {pushNotifications.getPermissionText()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">
                        {!pushNotifications.isSupported ? (
                          'Seu navegador não suporta notificações push.'
                        ) : !pushNotifications.isConfigured ? (
                          'Notificações push não estão configuradas no servidor.'
                        ) : pushNotifications.permission === 'granted' ? (
                          pushNotifications.isSubscribed 
                            ? 'Notificações ativadas neste dispositivo.'
                            : 'Permissão concedida. Clique para ativar.'
                        ) : pushNotifications.permission === 'denied' ? (
                          'Notificações bloqueadas. Altere nas configurações do navegador.'
                        ) : (
                          'Receba alertas mesmo quando o Planor não estiver aberto.'
                        )}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {pushNotifications.isSupported && pushNotifications.isConfigured && (
                          <>
                            {pushNotifications.permission !== 'denied' && (
                              <Button 
                                onClick={pushNotifications.toggle}
                                variant={pushNotifications.isSubscribed ? "outline" : "default"}
                                size="sm"
                                disabled={pushNotifications.isLoading}
                                className="gap-2"
                              >
                                {pushNotifications.isLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : pushNotifications.isSubscribed ? (
                                  <BellOff className="w-4 h-4" />
                                ) : (
                                  <BellRing className="w-4 h-4" />
                                )}
                                {pushNotifications.isSubscribed ? 'Desativar' : 'Ativar notificações'}
                              </Button>
                            )}

                            {pushNotifications.isSubscribed && (
                              <Button 
                                onClick={pushNotifications.sendTest}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                              >
                                <Send className="w-4 h-4" />
                                Testar notificação
                              </Button>
                            )}
                          </>
                        )}

                        {pushNotifications.permission === 'denied' && (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                              toast({
                                title: 'Como desbloquear',
                                description: 'Clique no ícone de cadeado na barra de endereço e permita notificações.',
                              });
                            }}
                          >
                            <Info className="w-4 h-4" />
                            Como desbloquear
                          </Button>
                        )}
                      </div>

                      {/* Device Info */}
                      {pushNotifications.isSubscribed && (
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <Smartphone className="w-3 h-3" />
                          <span>Inscrito neste dispositivo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notification Toggles */}
                <div className="space-y-4">
                  <NotificationToggle
                    icon={Calendar}
                    label="Agenda"
                    description="Lembretes de eventos e compromissos"
                    checked={localNotificationPrefs.agenda}
                    onCheckedChange={(checked) => setLocalNotificationPrefs(prev => ({ ...prev, agenda: checked }))}
                  />
                  
                  <NotificationToggle
                    icon={Target}
                    label="Metas"
                    description="Progresso e prazos de metas"
                    checked={localNotificationPrefs.goals}
                    onCheckedChange={(checked) => setLocalNotificationPrefs(prev => ({ ...prev, goals: checked }))}
                  />
                  
                  <NotificationToggle
                    icon={Wallet}
                    label="Finanças"
                    description="Transações e alertas financeiros"
                    checked={localNotificationPrefs.finance}
                    onCheckedChange={(checked) => setLocalNotificationPrefs(prev => ({ ...prev, finance: checked }))}
                  />
                  
                  <NotificationToggle
                    icon={Activity}
                    label="Hábitos"
                    description="Lembretes de hábitos diários"
                    checked={localNotificationPrefs.habits}
                    onCheckedChange={(checked) => setLocalNotificationPrefs(prev => ({ ...prev, habits: checked }))}
                  />

                  <div className="pt-4 border-t border-border/30">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Recursos Premium
                    </p>
                    
                    <NotificationToggle
                      icon={Sun}
                      label="Resumo Diário"
                      description="Receba às 08h um resumo do dia"
                      checked={localNotificationPrefs.dailySummary}
                      onCheckedChange={(checked) => setLocalNotificationPrefs(prev => ({ ...prev, dailySummary: checked }))}
                      premium
                    />
                    
                    <NotificationToggle
                      icon={AlertCircle}
                      label="Alerta de Gastos"
                      description="Notificar quando despesas forem registradas via IA"
                      checked={localNotificationPrefs.expenseAlerts}
                      onCheckedChange={(checked) => setLocalNotificationPrefs(prev => ({ ...prev, expenseAlerts: checked }))}
                      premium
                    />
                  </div>
                </div>
              </SettingsCard>
            )}

            {activeSection === 'finance' && (
              <SettingsCard key="finance" title="Finanças" description="Configure sua conta principal para lançamentos rápidos">
                <div className="space-y-6">
                  {/* Default Account Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <label className="text-sm font-medium text-foreground">Conta Principal</label>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Esta conta será usada automaticamente ao registrar transações pelo Command Center (voz).
                    </p>

                    {loadingAccounts ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : accounts.length === 0 ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-sm text-amber-500">
                          Você ainda não tem contas cadastradas. Adicione uma conta na página de Finanças.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {accounts.map((account) => {
                          const isSelected = settings.defaultAccountId === account.id;
                          return (
                            <button
                              key={account.id}
                              onClick={() => updateDefaultAccount(isSelected ? null : account.id)}
                              className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
                                "border",
                                isSelected 
                                  ? "bg-primary/10 border-primary/30" 
                                  : "bg-background/30 border-border/30 hover:bg-accent hover:border-border/50"
                              )}
                            >
                              {/* Account Logo/Icon */}
                              <div className="w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center overflow-hidden shrink-0">
                                {account.logo_url ? (
                                  <img 
                                    src={account.logo_url} 
                                    alt={account.name}
                                    className="w-8 h-8 object-contain"
                                  />
                                ) : (
                                  <Building2 className="w-6 h-6 text-muted-foreground" />
                                )}
                              </div>

                              {/* Account Info */}
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{account.name}</span>
                                  {isSelected && (
                                    <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                      <Star className="w-3 h-3" />
                                      Principal
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                  {account.type === 'corrente' ? 'Conta Corrente' : 
                                   account.type === 'poupanca' ? 'Poupança' :
                                   account.type === 'investimento' ? 'Investimento' : 'Carteira'}
                                </span>
                              </div>

                              {/* Balance */}
                              <div className="text-right">
                                <span className={cn(
                                  "font-mono font-medium",
                                  Number(account.balance) >= 0 ? "text-emerald-500" : "text-red-500"
                                )}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(account.balance))}
                                </span>
                              </div>

                              {/* Selection Indicator */}
                              <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                isSelected 
                                  ? "border-primary bg-primary" 
                                  : "border-border/50"
                              )}>
                                {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {settings.defaultAccountId && (
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Check className="w-3 h-3 text-emerald-500" />
                        Transações do Command Center serão vinculadas automaticamente a esta conta.
                      </p>
                    )}
                  </div>
                </div>
              </SettingsCard>
            )}

            {activeSection === 'system' && (
              <SettingsCard key="system" title="Sistema" description="Configurações avançadas e informações do app">
                <div className="space-y-6">
                  {/* App Info */}
                  <div className="p-4 rounded-xl bg-background/30 border border-border/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Planor</h4>
                        <p className="text-sm text-muted-foreground">Versão 1.0.0</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Seu assistente pessoal de produtividade com IA.
                    </p>
                  </div>

                  {/* Storage Info */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Armazenamento Local</h4>
                    <p className="text-sm text-muted-foreground">
                      Dados de cache e preferências são armazenados localmente para melhor performance.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                      }}
                    >
                      Limpar cache local
                    </Button>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-4 border-t border-red-500/20">
                    <h4 className="text-sm font-medium text-red-500 mb-2">Zona de Perigo</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ações irreversíveis. Tenha cuidado.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                      onClick={() => signOut()}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair de todos os dispositivos
                    </Button>
                  </div>
                </div>
              </SettingsCard>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </div>
  );
}

// Settings Card Component
function SettingsCard({ 
  title, 
  description, 
  children 
}: { 
  title: string; 
  description: string; 
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {children}
    </motion.div>
  );
}

// Timezone Option Component
function TimezoneOption({ 
  timezone, 
  isSelected, 
  onSelect 
}: { 
  timezone: { value: string; label: string; region: string };
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-150",
        isSelected 
          ? "bg-primary/10 text-primary" 
          : "hover:bg-accent text-foreground"
      )}
    >
      <span className="text-sm">{timezone.label}</span>
      {isSelected && <Check className="w-4 h-4" />}
    </button>
  );
}

// Notification Toggle Component
function NotificationToggle({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  premium = false,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{label}</span>
            {premium && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                Premium
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
