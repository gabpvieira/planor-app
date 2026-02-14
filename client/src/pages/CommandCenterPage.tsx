import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { 
  Mic, Check, X, Loader2, ArrowRight, Keyboard, Send,
  Wallet, TrendingDown, TrendingUp, CalendarDays, Activity, 
  CheckCircle, ClipboardList, Zap, Flame, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import ListeningOrb from '@/components/voice/ListeningOrb';
import { useLocation } from 'wouter';

interface CommandAction {
  action: string;
  [key: string]: any;
}

interface CommandResult {
  action?: string;
  actions?: CommandAction[];
  message?: string;
}

interface FeedbackItem {
  type: 'success' | 'error';
  message: string;
  action?: CommandAction;
  id: string;
}

// Configuração de estilo por tipo de ação
const ACTION_STYLES = {
  finance: {
    icon: Wallet,
    secondaryIcon: TrendingDown,
    incomeIcon: TrendingUp,
    borderColor: 'border-emerald-500/30',
    bgGradient: 'from-emerald-500/10 to-emerald-600/5',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    accentColor: 'text-emerald-400',
    label: 'Finanças',
  },
  agenda: {
    icon: CalendarDays,
    borderColor: 'border-violet-500/30',
    bgGradient: 'from-violet-500/10 to-purple-600/5',
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
    accentColor: 'text-violet-400',
    label: 'Agenda',
  },
  habit: {
    icon: Zap,
    secondaryIcon: Flame,
    borderColor: 'border-sky-500/30',
    bgGradient: 'from-sky-500/10 to-blue-600/5',
    iconBg: 'bg-sky-500/15',
    iconColor: 'text-sky-400',
    accentColor: 'text-sky-400',
    label: 'Hábitos',
  },
  task: {
    icon: ClipboardList,
    borderColor: 'border-amber-500/30',
    bgGradient: 'from-amber-500/10 to-orange-600/5',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    accentColor: 'text-amber-400',
    label: 'Tarefas',
  },
  default: {
    icon: Sparkles,
    borderColor: 'border-white/10',
    bgGradient: 'from-white/5 to-white/[0.02]',
    iconBg: 'bg-white/10',
    iconColor: 'text-white/70',
    accentColor: 'text-white/70',
    label: 'Comando',
  },
};

// Formatar valor monetário
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function CommandCenterPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const finalTranscriptRef = useRef<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Atalho de teclado: Espaço (segurar)
  useEffect(() => {
    if (!isClient) return;

    let spaceHoldTimer: NodeJS.Timeout;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isListening && e.target === document.body) {
        e.preventDefault();
        spaceHoldTimer = setTimeout(() => startListening(), 500);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') clearTimeout(spaceHoldTimer);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isListening, isClient]);

  const startListening = async () => {
    if (!isClient) {
      toast({ title: 'Carregando...', description: 'Aguarde a página carregar.', variant: 'default' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());
        const audioFile = new File([audioBlob], 'audio.webm', { type: mimeType, lastModified: Date.now() });
        await transcribeWithWhisper(audioFile);
      };
      
      mediaRecorder.start();
      setIsListening(true);
      setIsRecording(true);
      setTranscript('');
      setFeedbackList([]);
      finalTranscriptRef.current = '';
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast({ title: '🎤 Permissão Negada', description: 'Permita o acesso ao microfone nas configurações.', variant: 'destructive' });
      } else {
        toast({ title: 'Erro ao acessar microfone', description: 'Use o campo de texto abaixo.', variant: 'destructive' });
      }
      setShowManualInput(true);
      setIsListening(false);
      setIsRecording(false);
    }
  };

  const stopListening = () => {
    if (!mediaRecorderRef.current || !isRecording) {
      setIsListening(false);
      return;
    }
    try {
      if (mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    } catch (error) {
      toast({ title: 'Erro ao parar gravação', description: 'Tente novamente.', variant: 'destructive' });
      setIsListening(false);
      setIsRecording(false);
    }
  };

  const transcribeWithWhisper = async (audioFile: File) => {
    setIsProcessing(true);
    setIsListening(false);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Não autenticado', description: 'Faça login para usar o assistente.', variant: 'destructive' });
        setIsProcessing(false);
        setShowManualInput(true);
        return;
      }

      const formData = new FormData();
      formData.append('audio', audioFile);

      const { data, error } = await supabase.functions.invoke('transcribe-audio', { body: formData });

      if (error) {
        if (error.status === 401) {
          toast({ title: 'Sessão expirada', description: 'Faça login novamente.', variant: 'destructive' });
        }
        throw error;
      }

      if (!data?.text) throw new Error('Resposta inválida');

      setTranscript(data.text);
      finalTranscriptRef.current = data.text;
      if (data.text.trim()) await processCommand(data.text);
    } catch (error: any) {
      toast({ title: 'Erro na transcrição', description: 'Tente novamente ou use o campo de texto.', variant: 'destructive' });
      setShowManualInput(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setTranscript(manualInput);
      processCommand(manualInput);
      setManualInput('');
    }
  };

  const processCommand = async (command: string) => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-command', { body: { command } });
      if (error) throw error;

      const result: CommandResult = data;

      if (result.actions && Array.isArray(result.actions)) {
        const newFeedbacks: FeedbackItem[] = [];
        for (const action of result.actions) {
          await executeAction(action);
          newFeedbacks.push({
            type: 'success',
            message: getSuccessMessage(action),
            action,
            id: `${Date.now()}-${Math.random()}`,
          });
        }
        setFeedbackList(newFeedbacks);
      } else if (result.action) {
        if (result.action === 'unknown' || result.action === 'error') {
          setFeedbackList([{ type: 'error', message: result.message || 'Não entendi, pode repetir?', id: `${Date.now()}` }]);
        } else {
          await executeAction(result as CommandAction);
          setFeedbackList([{
            type: 'success',
            message: getSuccessMessage(result as CommandAction),
            action: result as CommandAction,
            id: `${Date.now()}`,
          }]);
        }
      }
    } catch (error) {
      setFeedbackList([{ type: 'error', message: 'Erro ao processar. Tente novamente.', id: `${Date.now()}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAction = async (action: CommandAction) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    switch (action.action) {
      case 'finance':
        await supabase.from('finance_transactions').insert({
          user_id: user.id, type: action.type, amount: action.amount,
          category: action.category || 'outros', description: action.description,
          date: action.date || new Date().toISOString(), paid: true,
        });
        break;
      case 'habit':
        if (action.operation === 'create') {
          await supabase.from('habits').insert({
            user_id: user.id, title: action.title, frequency: action.frequency || 'daily', target_count: 1,
          });
        } else {
          const { data: habits } = await supabase.from('habits').select('id')
            .eq('user_id', user.id).ilike('title', `%${action.habit_name}%`).limit(1);
          if (habits?.length) {
            await supabase.from('habit_logs').insert({
              habit_id: habits[0].id, date: action.date || new Date().toISOString().split('T')[0], count: 1, completed: true,
            });
          }
        }
        break;
      case 'agenda':
        await supabase.from('appointments').insert({
          user_id: user.id, title: action.title, start_time: action.start_time,
          end_time: action.end_time, type: action.type || 'event',
        });
        break;
    }
  };

  const getSuccessMessage = (action: CommandAction): string => {
    switch (action.action) {
      case 'finance':
        return `${action.type === 'expense' ? 'Despesa' : 'Receita'} de ${formatCurrency(action.amount)} registrada`;
      case 'habit':
        return action.operation === 'create' ? `Hábito "${action.title}" criado` : `"${action.habit_name}" marcado como feito`;
      case 'agenda':
        return `"${action.title}" agendado com sucesso`;
      default:
        return 'Comando executado';
    }
  };

  const getRedirectPath = (action: CommandAction): string => {
    const paths: Record<string, string> = { finance: '/app/finance', habit: '/app/habits', agenda: '/app/agenda' };
    return paths[action.action] || '/app';
  };

  const getActionStyle = (action?: CommandAction) => {
    if (!action) return ACTION_STYLES.default;
    return ACTION_STYLES[action.action as keyof typeof ACTION_STYLES] || ACTION_STYLES.default;
  };

  // Renderiza card de ação específico por tipo
  const renderActionCard = (feedback: FeedbackItem, index: number) => {
    const style = getActionStyle(feedback.action);
    const Icon = style.icon;

    return (
      <motion.div
        key={feedback.id}
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, delay: index * 0.08 }}
        className="w-full"
      >
        <div className={`
          relative overflow-hidden rounded-2xl
          bg-gradient-to-br ${style.bgGradient}
          border ${style.borderColor}
          backdrop-blur-2xl shadow-2xl
        `}>
          {/* Glow effect */}
          <div className={`absolute -top-20 -right-20 w-40 h-40 ${style.iconBg} rounded-full blur-3xl opacity-50`} />
          
          <div className="relative p-5 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Ícone */}
              <div className={`size-12 rounded-xl ${style.iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`size-6 ${style.iconColor}`} />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${style.accentColor}`}>
                    {style.label}
                  </span>
                  <CheckCircle className={`size-3.5 ${style.iconColor}`} />
                </div>
                
                <p className="text-base sm:text-lg font-medium text-white/95 leading-snug">
                  {feedback.message}
                </p>

                {/* Detalhes específicos por tipo */}
                {feedback.action && (
                  <div className="pt-2">
                    {feedback.action.action === 'finance' && (
                      <div className="flex items-center gap-3 text-sm">
                        <span className={`font-mono font-semibold text-lg ${
                          feedback.action.type === 'expense' ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {feedback.action.type === 'expense' ? '-' : '+'}{formatCurrency(feedback.action.amount)}
                        </span>
                        {feedback.action.category && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/50 text-xs">
                            {feedback.action.category}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {feedback.action.action === 'agenda' && (
                      <div className="flex items-center gap-2 text-sm font-mono text-violet-300/80">
                        <CalendarDays className="size-3.5" />
                        <span>{feedback.action.start_time || 'Horário a definir'}</span>
                      </div>
                    )}
                    
                    {feedback.action.action === 'habit' && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10">
                          <Activity className="size-3.5 text-sky-400" />
                          <span className="text-xs font-medium text-sky-300">1/1 hoje</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Botão de ação */}
                {feedback.action && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setLocation(getRedirectPath(feedback.action!))}
                    className={`
                      group inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl
                      bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20
                      text-sm font-medium text-white/60 hover:text-white/90 transition-all
                    `}
                  >
                    <span>Ver detalhes</span>
                    <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Renderiza card de erro
  const renderErrorCard = (feedback: FeedbackItem) => (
    <motion.div
      key={feedback.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 backdrop-blur-2xl">
        <div className="p-5 sm:p-6 flex items-start gap-4">
          <div className="size-12 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
            <X className="size-6 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Erro</span>
            <p className="text-base font-medium text-white/90 mt-1">{feedback.message}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden w-full max-w-full">
      {/* Background consistente com outras páginas */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-violet-500/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      {/* Backdrop blur overlay */}
      <div className="absolute inset-0 backdrop-blur-3xl bg-background/30" />

      <div className="relative z-10 flex flex-col min-h-screen px-4 py-6 sm:p-8 pt-20 md:pt-8">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
          
          {/* Orbe no topo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="cursor-pointer mb-6"
            onClick={isListening ? stopListening : startListening}
          >
            <ListeningOrb 
              isListening={isListening} 
              isProcessing={isProcessing}
              size="lg"
            />
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center space-y-2 mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Command Center
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Fale naturalmente. Seu assistente entende e executa.
            </p>
          </motion.div>

          {/* Status */}
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-6"
              >
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground/80">Processando seu comando...</span>
              </motion.div>
            ) : isListening ? (
              <motion.div
                key="listening"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 px-5 py-3 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/20 mb-6"
              >
                <div className="size-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Ouvindo...</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-3 mb-6"
              >
                <span className="text-sm text-muted-foreground">Clique no orbe para falar</span>
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground/60">
                  <kbd className="px-2 py-1 rounded-md bg-muted/50 border border-border font-mono text-[10px]">Espaço</kbd>
                  <span>Segure para ativar</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle input manual */}
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group mb-6"
          >
            <Keyboard className="size-4" />
            <span>Digitar comando</span>
            <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Input manual */}
          <AnimatePresence>
            {showManualInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full mb-6"
              >
                <form onSubmit={handleManualSubmit} className="relative">
                  <Input
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Digite seu comando aqui..."
                    disabled={isProcessing}
                    className="w-full h-12 sm:h-14 pl-5 pr-14 bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={isProcessing || !manualInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-9 sm:size-10 rounded-xl bg-primary hover:bg-primary/90"
                  >
                    {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcrição - Balão minimalista */}
          <AnimatePresence>
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full mb-6"
              >
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Mic className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1">
                        Você disse
                      </p>
                      <p className="text-sm sm:text-base text-foreground/80 leading-relaxed break-words">
                        "{transcript}"
                      </p>
                    </div>
                    {isProcessing && <Loader2 className="size-4 animate-spin text-primary shrink-0" />}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cards de feedback com layout animado */}
          <LayoutGroup>
            <div className="w-full space-y-4">
              <AnimatePresence mode="popLayout">
                {feedbackList.map((feedback, index) => (
                  feedback.type === 'success' 
                    ? renderActionCard(feedback, index)
                    : renderErrorCard(feedback)
                ))}
              </AnimatePresence>
            </div>
          </LayoutGroup>

          {/* Exemplos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 pt-10 w-full"
          >
            <p className="text-[10px] font-semibold text-center text-muted-foreground/50 uppercase tracking-widest">
              Experimente dizer
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Gastei 30 reais no almoço",
                "Marcar corrida como feito",
                "Reunião amanhã às 15h",
                "Adicionar despesa de 50 reais"
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => { setManualInput(example); setShowManualInput(true); }}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs text-muted-foreground hover:text-foreground transition-all"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
