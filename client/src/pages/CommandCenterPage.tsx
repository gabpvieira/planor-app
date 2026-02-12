import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, Check, X, Loader2, ArrowRight, Keyboard, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export default function CommandCenterPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackList, setFeedbackList] = useState<Array<{ type: 'success' | 'error'; message: string; action?: CommandAction; id: string }>>([]);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const finalTranscriptRef = useRef<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ✅ Inicializa apenas no client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Keyboard shortcut: Space (hold)
  useEffect(() => {
    if (!isClient) return;

    let spaceHoldTimer: NodeJS.Timeout;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isListening && e.target === document.body) {
        e.preventDefault();
        spaceHoldTimer = setTimeout(() => {
          startListening();
        }, 500);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        clearTimeout(spaceHoldTimer);
      }
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
      toast({
        title: 'Carregando...',
        description: 'Aguarde a página carregar completamente.',
        variant: 'default',
      });
      return;
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Reset audio chunks
      audioChunksRef.current = [];
      
      // Create MediaRecorder with webm format (widely supported)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Convert to file and transcribe
        const audioFile = new File([audioBlob], 'audio.webm', {
          type: mimeType,
          lastModified: Date.now(),
        });
        
        console.log('[Audio] Recording stopped, file size:', audioFile.size, 'bytes');
        await transcribeWithWhisper(audioFile);
      };
      
      // Start recording
      mediaRecorder.start();
      setIsListening(true);
      setIsRecording(true);
      setTranscript('');
      setFeedbackList([]);
      finalTranscriptRef.current = '';
      
      console.log('[Audio] Recording started with MediaRecorder');
    } catch (error: any) {
      console.error('[Audio] Error accessing microphone:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast({
          title: '🎤 Permissão Negada',
          description: 'Por favor, permita o acesso ao microfone nas configurações do navegador.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao acessar microfone',
          description: 'Não foi possível iniciar a gravação. Use o campo de texto abaixo.',
          variant: 'destructive',
        });
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
      console.log('[Audio] Stopping recording...');
      
      // Stop the MediaRecorder (will trigger onstop event)
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      setIsRecording(false);
      setIsListening(false);
    } catch (error) {
      console.error('[Audio] Error stopping recording:', error);
      toast({
        title: 'Erro ao parar gravação',
        description: 'Não foi possível processar o áudio. Tente novamente.',
        variant: 'destructive',
      });
      setIsListening(false);
      setIsRecording(false);
    }
  };

  const transcribeWithWhisper = async (audioFile: File) => {
    console.log('[Whisper] Starting transcription...');
    console.log('[Whisper] Audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });
    
    setIsProcessing(true);
    setIsListening(false);
    
    try {
      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Whisper] Auth status:', {
        authenticated: !!session,
        hasUser: !!user,
        userId: user?.id
      });

      if (!session) {
        console.error('[Whisper] User not authenticated');
        toast({
          title: 'Não autenticado',
          description: 'Você precisa estar logado para usar o assistente de voz.',
          variant: 'destructive',
        });
        setIsProcessing(false);
        setShowManualInput(true);
        return;
      }

      // Criar FormData com o áudio
      const formData = new FormData();
      formData.append('audio', audioFile);

      console.log('[Whisper] Invoking transcribe-audio Edge Function...');
      
      // Chamar Edge Function de transcrição
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: formData,
      });

      console.log('[Whisper] Response:', { data, error });

      if (error) {
        console.error('[Whisper] Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          context: error.context
        });
        
        // Tratamento específico para erro 401
        if (error.status === 401) {
          toast({
            title: 'Erro de Autenticação',
            description: 'Sua sessão expirou. Por favor, faça login novamente.',
            variant: 'destructive',
          });
          setIsProcessing(false);
          setShowManualInput(true);
          return;
        }
        
        throw error;
      }

      if (!data || !data.text) {
        console.error('[Whisper] Invalid response:', data);
        throw new Error('Resposta inválida da transcrição');
      }

      console.log('[Whisper] Transcription successful:', data.text);
      setTranscript(data.text);
      finalTranscriptRef.current = data.text;
      
      // Process command immediately
      if (data.text.trim()) {
        await processCommand(data.text);
      }
    } catch (error: any) {
      console.error('[Whisper] Transcription failed:', {
        error,
        message: error?.message,
        stack: error?.stack
      });
      
      // Mensagem de erro amigável para o usuário
      const errorMessage = error?.message || 'Erro desconhecido';
      
      toast({
        title: 'Erro na transcrição',
        description: `Não foi possível transcrever o áudio: ${errorMessage}. Tente novamente ou use o campo de texto.`,
        variant: 'destructive',
      });
      
      // Mostrar input manual como fallback
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
    console.log('[Command] Starting to process:', command);
    setIsProcessing(true);

    try {
      console.log('[Command] Invoking Supabase function...');
      const { data, error } = await supabase.functions.invoke('process-command', {
        body: { command },
      });

      console.log('[Command] Response:', { data, error });

      if (error) {
        console.error('[Command] Supabase error:', error);
        throw error;
      }

      const result: CommandResult = data;
      console.log('[Command] Parsed result:', result);

      // Handle multiple actions
      if (result.actions && Array.isArray(result.actions)) {
        console.log('[Command] Processing multiple actions:', result.actions.length);
        const newFeedbacks: typeof feedbackList = [];
        
        for (const action of result.actions) {
          await executeAction(action);
          newFeedbacks.push({
            type: 'success',
            message: getSuccessMessage(action),
            action: action,
            id: `${Date.now()}-${Math.random()}`,
          });
        }
        
        setFeedbackList(newFeedbacks);
      }
      // Handle single action
      else if (result.action) {
        if (result.action === 'unknown' || result.action === 'error') {
          setFeedbackList([{
            type: 'error',
            message: result.message || 'Não entendi, pode repetir?',
            id: `${Date.now()}-${Math.random()}`,
          }]);
        } else {
          await executeAction(result as CommandAction);
          setFeedbackList([{
            type: 'success',
            message: getSuccessMessage(result as CommandAction),
            action: result as CommandAction,
            id: `${Date.now()}-${Math.random()}`,
          }]);
        }
      }
    } catch (error: any) {
      console.error('[Command] Error processing command:', error);
      setFeedbackList([{
        type: 'error',
        message: 'Erro ao processar comando. Tente novamente.',
        id: `${Date.now()}-${Math.random()}`,
      }]);
    } finally {
      console.log('[Command] Processing complete');
      setIsProcessing(false);
    }
  };

  const executeAction = async (action: CommandAction) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    switch (action.action) {
      case 'finance':
        await supabase.from('finance_transactions').insert({
          user_id: user.id,
          type: action.type,
          amount: action.amount,
          category: action.category || 'outros',
          description: action.description,
          date: action.date || new Date().toISOString(),
          paid: true,
        });
        break;

      case 'habit':
        if (action.operation === 'create') {
          await supabase.from('habits').insert({
            user_id: user.id,
            title: action.title,
            frequency: action.frequency || 'daily',
            target_count: 1,
          });
        } else {
          // Mark habit as complete (simplified - would need to find habit by name)
          const { data: habits } = await supabase
            .from('habits')
            .select('id')
            .eq('user_id', user.id)
            .ilike('title', `%${action.habit_name}%`)
            .limit(1);

          if (habits && habits.length > 0) {
            await supabase.from('habit_logs').insert({
              habit_id: habits[0].id,
              date: action.date || new Date().toISOString().split('T')[0],
              count: 1,
              completed: true,
            });
          }
        }
        break;

      case 'agenda':
        await supabase.from('appointments').insert({
          user_id: user.id,
          title: action.title,
          start_time: action.start_time,
          end_time: action.end_time,
          type: action.type || 'event',
        });
        break;

      default:
        throw new Error('Ação não reconhecida');
    }
  };

  const getSuccessMessage = (action: CommandAction): string => {
    switch (action.action) {
      case 'finance':
        return `${action.type === 'expense' ? 'Despesa' : 'Receita'} de R$ ${action.amount} lançada!`;
      case 'habit':
        return action.operation === 'create' 
          ? `Hábito "${action.title}" criado!`
          : `Hábito "${action.habit_name}" marcado como feito!`;
      case 'agenda':
        return `Evento "${action.title}" agendado!`;
      default:
        return 'Comando executado com sucesso!';
    }
  };

  const getRedirectPath = (action: CommandAction): string => {
    switch (action.action) {
      case 'finance':
        return '/app/finance';
      case 'habit':
        return '/app/habits';
      case 'agenda':
        return '/app/agenda';
      default:
        return '/app';
    }
  };

  const getActionIcon = (action: CommandAction) => {
    switch (action.action) {
      case 'finance':
        return '💰';
      case 'habit':
        return '✅';
      case 'agenda':
        return '📅';
      default:
        return '✨';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <Sparkles className="size-6 sm:size-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold">Command Center</h1>
          </motion.div>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            Dite seus comandos e deixe a IA fazer o trabalho
          </p>
          <div className="flex items-center gap-2 justify-center">
            <p className="text-xs text-muted-foreground hidden sm:block">
              💡 Dica: Segure Espaço para ativar o microfone
            </p>
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-xs text-primary hover:underline sm:hidden"
            >
              ou digite seu comando
            </button>
          </div>
        </div>

        {/* Listening Orb - Visual Premium */}
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-6">
          {/* Orbe de Escuta */}
          <div 
            className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={isListening ? stopListening : startListening}
          >
            <ListeningOrb 
              isListening={isListening} 
              isProcessing={isProcessing}
              size="lg"
            />
          </div>

          {/* Status Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2 text-purple-400">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm font-medium">Processando...</span>
              </div>
            ) : isListening ? (
              <div className="flex items-center gap-2 text-blue-400">
                <div className="size-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-sm font-medium">Estou ouvindo...</span>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <span className="text-sm">Clique no orbe para começar</span>
              </div>
            )}
          </motion.div>

          {/* Microphone Icon Button (alternativa mobile) */}
          <div className="flex gap-2 sm:hidden">
            <Button
              size="sm"
              variant="outline"
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
            >
              {isListening ? (
                <>
                  <MicOff className="size-4 mr-2" />
                  Parar
                </>
              ) : (
                <>
                  <Mic className="size-4 mr-2" />
                  Falar
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowManualInput(!showManualInput)}
              disabled={isProcessing}
            >
              <Keyboard className="size-4 mr-2" />
              Digitar
            </Button>
          </div>
        </div>

        {/* Manual Input (for mobile or when voice not supported) */}
        <AnimatePresence>
          {showManualInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-2"
            >
              <Card className="p-4 bg-card/50 backdrop-blur">
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Keyboard className="size-4" />
                    <span>Digite seu comando</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Ex: Gastei 30 reais no almoço"
                      disabled={isProcessing}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={isProcessing || !manualInput.trim()}
                    >
                      {isProcessing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="px-2"
            >
              <Card className="p-4 sm:p-6 bg-card/50 backdrop-blur">
                <div className="flex items-start gap-3">
                  <Mic className="size-4 sm:size-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                      Você disse:
                    </p>
                    <p className="text-base sm:text-lg break-words">{transcript}</p>
                  </div>
                  {isProcessing && (
                    <Loader2 className="size-4 sm:size-5 animate-spin text-primary shrink-0" />
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Cards - Individual para cada ação */}
        <AnimatePresence mode="popLayout">
          {feedbackList.map((feedback, index) => (
            <motion.div
              key={feedback.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30,
                delay: index * 0.1 
              }}
              className="px-2"
            >
              <div className={`
                relative overflow-hidden rounded-2xl
                ${feedback.type === 'success' 
                  ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20' 
                  : 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border-red-500/20'
                }
                border backdrop-blur-xl
                shadow-lg shadow-black/5
              `}>
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                
                <div className="relative p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon with glow effect */}
                    <div className={`
                      relative shrink-0 size-12 rounded-xl flex items-center justify-center
                      ${feedback.type === 'success' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/20 text-red-400'
                      }
                    `}>
                      <div className={`absolute inset-0 rounded-xl blur-xl opacity-50 ${
                        feedback.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                      }`} />
                      {feedback.type === 'success' ? (
                        <Check className="size-6 relative z-10" strokeWidth={2.5} />
                      ) : (
                        <X className="size-6 relative z-10" strokeWidth={2.5} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <p className={`text-sm font-semibold mb-1 ${
                          feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {feedback.type === 'success' ? 'Sucesso!' : 'Ops!'}
                        </p>
                        <p className="text-base sm:text-lg font-medium text-foreground break-words">
                          {feedback.message}
                        </p>
                      </div>

                      {/* Action button for success */}
                      {feedback.type === 'success' && feedback.action && (
                        <motion.button
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          onClick={() => setLocation(getRedirectPath(feedback.action!))}
                          className="
                            group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                            bg-gradient-to-r from-emerald-500/20 to-emerald-600/20
                            hover:from-emerald-500/30 hover:to-emerald-600/30
                            border border-emerald-500/30 hover:border-emerald-500/50
                            text-sm font-medium text-emerald-300
                            transition-all duration-200
                            shadow-lg shadow-emerald-500/10
                          "
                        >
                          <span className="text-lg">{getActionIcon(feedback.action)}</span>
                          <span>Ver detalhes</span>
                          <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className={`h-1 w-full ${
                  feedback.type === 'success' 
                    ? 'bg-gradient-to-r from-emerald-500/50 via-emerald-400/50 to-transparent' 
                    : 'bg-gradient-to-r from-red-500/50 via-red-400/50 to-transparent'
                }`} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Examples */}
        <div className="space-y-3 px-2">
          <p className="text-xs sm:text-sm font-medium text-center text-muted-foreground">
            Exemplos de comandos:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-1">
              "Gastei 30 reais no almoço"
            </Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-1">
              "Marcar corrida como feita"
            </Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-1 hidden sm:inline-flex">
              "Reunião amanhã às 15h"
            </Badge>
            <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-1 hidden md:inline-flex">
              "Lança 20 de café e marca água como feito"
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
