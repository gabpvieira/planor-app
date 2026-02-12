import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Check, X, Loader2, ArrowRight, Keyboard, Send } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative overflow-hidden">
      {/* Gradient Background - macOS style */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3"
          >
            <h1 className="text-5xl font-semibold tracking-tight bg-gradient-to-br from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              Command Center
            </h1>
            <p className="text-base text-white/50 font-light max-w-md mx-auto">
              Speak naturally. Your AI assistant understands and executes.
            </p>
          </motion.div>

          {/* Main Orb Container */}
          <div className="flex flex-col items-center justify-center py-16 gap-8">
            {/* Orb */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="cursor-pointer"
              onClick={isListening ? stopListening : startListening}
            >
              <ListeningOrb 
                isListening={isListening} 
                isProcessing={isProcessing}
                size="lg"
              />
            </motion.div>

            {/* Status */}
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10"
                >
                  <Loader2 className="size-4 animate-spin text-blue-400" />
                  <span className="text-sm font-medium text-white/90">Processing your request</span>
                </motion.div>
              ) : isListening ? (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 px-6 py-3 rounded-full bg-blue-500/10 backdrop-blur-xl border border-blue-500/20"
                >
                  <div className="size-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-sm font-medium text-blue-300">Listening...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-sm text-white/40 font-light">Click to speak</span>
                  <div className="flex items-center gap-2 text-xs text-white/30">
                    <kbd className="px-2 py-1 rounded bg-white/5 border border-white/10 font-mono">Space</kbd>
                    <span>Hold to activate</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Alternative Input Toggle */}
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-sm text-white/40 hover:text-white/60 transition-colors flex items-center gap-2 group"
            >
              <Keyboard className="size-4" />
              <span>Type instead</span>
              <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Manual Input */}
          <AnimatePresence>
            {showManualInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <form onSubmit={handleManualSubmit} className="relative">
                  <Input
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Type your command here..."
                    disabled={isProcessing}
                    className="w-full h-14 pl-6 pr-14 bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={isProcessing || !manualInput.trim()}
                    className="absolute right-2 top-2 size-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {isProcessing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </form>
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
              >
                <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Mic className="size-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
                        You said
                      </p>
                      <p className="text-lg text-white/90 leading-relaxed">
                        {transcript}
                      </p>
                    </div>
                    {isProcessing && (
                      <Loader2 className="size-5 animate-spin text-blue-400 shrink-0" />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback Cards */}
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
              >
                <div className={`
                  relative overflow-hidden rounded-2xl
                  ${feedback.type === 'success' 
                    ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20' 
                    : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20'
                  }
                  border backdrop-blur-xl
                `}>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`
                        size-12 rounded-xl flex items-center justify-center shrink-0
                        ${feedback.type === 'success' 
                          ? 'bg-emerald-500/10' 
                          : 'bg-red-500/10'
                        }
                      `}>
                        {feedback.type === 'success' ? (
                          <Check className="size-6 text-emerald-400" strokeWidth={2.5} />
                        ) : (
                          <X className="size-6 text-red-400" strokeWidth={2.5} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <p className={`text-xs font-semibold mb-1.5 uppercase tracking-wider ${
                            feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {feedback.type === 'success' ? 'Success' : 'Error'}
                          </p>
                          <p className="text-base font-medium text-white/90">
                            {feedback.message}
                          </p>
                        </div>

                        {/* Action button */}
                        {feedback.type === 'success' && feedback.action && (
                          <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            onClick={() => setLocation(getRedirectPath(feedback.action!))}
                            className="
                              group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                              bg-white/5 hover:bg-white/10
                              border border-white/10 hover:border-white/20
                              text-sm font-medium text-white/70 hover:text-white/90
                              transition-all duration-200
                            "
                          >
                            <span>View details</span>
                            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Examples */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-4 pt-8"
          >
            <p className="text-xs font-medium text-center text-white/30 uppercase tracking-wider">
              Try saying
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "I spent $30 on lunch",
                "Mark running as done",
                "Meeting tomorrow at 3pm",
                "Add $20 coffee expense"
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setManualInput(example);
                    setShowManualInput(true);
                  }}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs text-white/50 hover:text-white/70 transition-all"
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
