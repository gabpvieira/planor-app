import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

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
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        // If final result, process command
        if (event.results[current].isFinal) {
          processCommand(transcriptText);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: 'Erro no reconhecimento',
          description: 'Não foi possível capturar o áudio. Tente novamente.',
          variant: 'destructive',
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Keyboard shortcut: Space (hold)
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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Não suportado',
        description: 'Seu navegador não suporta reconhecimento de voz.',
        variant: 'destructive',
      });
      return;
    }

    setTranscript('');
    setFeedback(null);
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processCommand = async (command: string) => {
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-command', {
        body: { command },
      });

      if (error) throw error;

      const result: CommandResult = data;

      // Handle multiple actions
      if (result.actions && Array.isArray(result.actions)) {
        for (const action of result.actions) {
          await executeAction(action);
        }
        setFeedback({
          type: 'success',
          message: `${result.actions.length} ações executadas com sucesso!`,
        });
      }
      // Handle single action
      else if (result.action) {
        if (result.action === 'unknown' || result.action === 'error') {
          setFeedback({
            type: 'error',
            message: result.message || 'Não entendi, pode repetir?',
          });
        } else {
          await executeAction(result);
          setFeedback({
            type: 'success',
            message: getSuccessMessage(result),
          });
        }
      }
    } catch (error: any) {
      console.error('Error processing command:', error);
      setFeedback({
        type: 'error',
        message: 'Erro ao processar comando. Tente novamente.',
      });
    } finally {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <Sparkles className="size-8 text-primary" />
            <h1 className="text-4xl font-bold">Command Center</h1>
          </motion.div>
          <p className="text-muted-foreground">
            Dite seus comandos e deixe a IA fazer o trabalho
          </p>
          <p className="text-xs text-muted-foreground">
            💡 Dica: Segure Espaço para ativar o microfone
          </p>
        </div>

        {/* Microphone Button */}
        <div className="flex justify-center">
          <motion.div
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
          >
            <Button
              size="lg"
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`
                size-32 rounded-full relative
                ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}
              `}
            >
              {isProcessing ? (
                <Loader2 className="size-12 animate-spin" />
              ) : isListening ? (
                <MicOff className="size-12" />
              ) : (
                <Mic className="size-12" />
              )}

              {/* Sound waves animation */}
              {isListening && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-red-500"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-red-500"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                  />
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-6 bg-card/50 backdrop-blur">
                <div className="flex items-start gap-3">
                  <Mic className="size-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Você disse:
                    </p>
                    <p className="text-lg">{transcript}</p>
                  </div>
                  {isProcessing && (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className={`p-6 ${
                feedback.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-start gap-3">
                  {feedback.type === 'success' ? (
                    <Check className="size-6 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="size-6 text-red-600 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">
                      {feedback.type === 'success' ? 'Sucesso!' : 'Ops!'}
                    </p>
                    <p className="text-base">{feedback.message}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Examples */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-center text-muted-foreground">
            Exemplos de comandos:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="text-xs">
              "Gastei 30 reais no almoço"
            </Badge>
            <Badge variant="outline" className="text-xs">
              "Marcar corrida como feita"
            </Badge>
            <Badge variant="outline" className="text-xs">
              "Reunião amanhã às 15h"
            </Badge>
            <Badge variant="outline" className="text-xs">
              "Lança 20 de café e marca água como feito"
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
