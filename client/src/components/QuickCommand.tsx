import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Loader2, Send, Keyboard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useLocation } from 'wouter';
import ListeningOrb from '@/components/voice/ListeningOrb';

interface QuickCommandProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCommand({ isOpen, onClose }: QuickCommandProps) {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Foca no input quando abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setManualInput('');
      setResult(null);
      setIsListening(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // ESC para fechar
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const startListening = async () => {
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
        const audioFile = new File([audioBlob], 'audio.webm', { type: mimeType });
        await transcribeAndProcess(audioFile);
      };
      
      mediaRecorder.start();
      setIsListening(true);
      setTranscript('');
      setResult(null);
    } catch (error) {
      toast({ title: 'Erro ao acessar microfone', variant: 'destructive' });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    setIsListening(false);
  };

  const transcribeAndProcess = async (audioFile: File) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);

      const { data, error } = await supabase.functions.invoke('transcribe-audio', { body: formData });
      if (error || !data?.text) throw error || new Error('Erro na transcrição');

      setTranscript(data.text);
      await processCommand(data.text);
    } catch (error) {
      setResult({ type: 'error', message: 'Erro ao processar. Tente novamente.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    
    setTranscript(manualInput);
    setManualInput('');
    await processCommand(manualInput);
  };

  const processCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-command', { body: { command } });
      if (error) throw error;

      if (data.action === 'unknown' || data.action === 'error') {
        setResult({ type: 'error', message: data.message || 'Não entendi o comando.' });
      } else {
        // Executar ação
        await executeAction(data);
        setResult({ type: 'success', message: getSuccessMessage(data) });
        
        // Fechar após sucesso
        setTimeout(() => {
          onClose();
          // Navegar para a página relevante
          const path = getRedirectPath(data);
          if (path !== '/app') setLocation(path);
        }, 1500);
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Erro ao processar comando.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAction = async (action: any) => {
    if (!user?.id) return;

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
              habit_id: habits[0].id, date: new Date().toISOString().split('T')[0], count: 1, completed: true,
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

  const getSuccessMessage = (action: any): string => {
    const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    switch (action.action) {
      case 'finance': return `${action.type === 'expense' ? 'Despesa' : 'Receita'} de ${formatCurrency(action.amount)} registrada!`;
      case 'habit': return action.operation === 'create' ? `Hábito criado!` : `Hábito marcado como feito!`;
      case 'agenda': return `Evento agendado!`;
      default: return 'Comando executado!';
    }
  };

  const getRedirectPath = (action: any): string => {
    const paths: Record<string, string> = { finance: '/app/finance', habit: '/app/habits', agenda: '/app/agenda' };
    return paths[action.action] || '/app';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg bg-background/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="size-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Comando Rápido</h2>
                <p className="text-[10px] text-muted-foreground">Fale ou digite seu comando</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Orbe pequeno + Input */}
            <div className="flex items-center gap-3">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`
                  size-12 rounded-xl flex items-center justify-center shrink-0 transition-all
                  ${isListening 
                    ? 'bg-primary/20 border-2 border-primary animate-pulse' 
                    : 'bg-muted/50 border border-border hover:bg-muted'
                  }
                `}
              >
                {isProcessing ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : (
                  <Mic className={`size-5 ${isListening ? 'text-primary' : 'text-muted-foreground'}`} />
                )}
              </button>
              
              <form onSubmit={handleSubmit} className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Digite ou fale seu comando..."
                  disabled={isProcessing || isListening}
                  className="w-full h-12 pr-12 bg-muted/30 border-border/50 rounded-xl"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isProcessing || !manualInput.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 size-9 rounded-lg"
                >
                  <Send className="size-4" />
                </Button>
              </form>
            </div>

            {/* Status */}
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 py-2"
              >
                <div className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-primary font-medium">Ouvindo...</span>
              </motion.div>
            )}

            {/* Transcrição */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-muted/30 border border-border/50"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Você disse</p>
                <p className="text-sm text-foreground">"{transcript}"</p>
              </motion.div>
            )}

            {/* Resultado */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl ${
                  result.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/20' 
                    : 'bg-red-500/10 border border-red-500/20'
                }`}
              >
                <p className={`text-sm font-medium ${
                  result.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {result.message}
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border/50 bg-muted/20">
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">Esc</kbd>
                Fechar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono">Enter</kbd>
                Enviar
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook para usar o Quick Command globalmente
export function useQuickCommand() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K ou Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
