# Exemplos de Uso - ListeningOrb

## 1. Uso Básico (Já implementado no CommandCenterPage)

```tsx
import { useState } from 'react';
import ListeningOrb from '@/components/voice/ListeningOrb';

function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div 
        className="cursor-pointer transition-transform hover:scale-105"
        onClick={handleClick}
      >
        <ListeningOrb 
          isListening={isListening}
          isProcessing={isProcessing}
          size="lg"
        />
      </div>
      
      <p className="text-sm text-muted-foreground">
        {isProcessing ? 'Processando...' : isListening ? 'Ouvindo...' : 'Clique para falar'}
      </p>
    </div>
  );
}
```

## 2. Com Reconhecimento de Voz (Web Speech API)

```tsx
import { useState, useEffect, useRef } from 'react';
import ListeningOrb from '@/components/voice/ListeningOrb';

function SpeechRecognitionOrb() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        
        if (event.results[0].isFinal) {
          processCommand(text);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    setTranscript('');
    setIsListening(true);
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const processCommand = async (text: string) => {
    setIsProcessing(true);
    // Processar comando aqui
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div onClick={isListening ? stopListening : startListening}>
        <ListeningOrb 
          isListening={isListening}
          isProcessing={isProcessing}
          size="lg"
        />
      </div>
      {transcript && <p className="text-sm">{transcript}</p>}
    </div>
  );
}
```

## 3. Com Atalho de Teclado (Espaço)

```tsx
import { useState, useEffect } from 'react';
import ListeningOrb from '@/components/voice/ListeningOrb';

function KeyboardShortcutOrb() {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setIsListening(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsListening(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <ListeningOrb isListening={isListening} size="lg" />
      <p className="text-xs text-muted-foreground">
        Segure Espaço para falar
      </p>
    </div>
  );
}
```

## 4. Responsivo com Diferentes Tamanhos

```tsx
import ListeningOrb from '@/components/voice/ListeningOrb';

function ResponsiveOrb({ isListening }: { isListening: boolean }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <ListeningOrb isListening={isListening} size="lg" />
      </div>

      {/* Tablet */}
      <div className="hidden md:block lg:hidden">
        <ListeningOrb isListening={isListening} size="md" />
      </div>

      {/* Mobile */}
      <div className="block md:hidden">
        <ListeningOrb isListening={isListening} size="sm" />
      </div>
    </>
  );
}
```

## 5. Com Feedback Visual e Sonoro

```tsx
import { useState } from 'react';
import ListeningOrb from '@/components/voice/ListeningOrb';
import { motion, AnimatePresence } from 'framer-motion';

function OrbWithFeedback() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCommand = async () => {
    setIsListening(false);
    setIsProcessing(true);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setFeedback('Comando executado com sucesso!');
    
    // Limpar feedback após 3 segundos
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <ListeningOrb 
        isListening={isListening}
        isProcessing={isProcessing}
        size="lg"
      />

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg"
          >
            <p className="text-sm text-green-400">{feedback}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

## 6. Grid de Múltiplos Orbes (Dashboard)

```tsx
import ListeningOrb from '@/components/voice/ListeningOrb';

function OrbGrid() {
  const assistants = [
    { id: 1, name: 'Finanças', isActive: true },
    { id: 2, name: 'Agenda', isActive: false },
    { id: 3, name: 'Hábitos', isActive: false },
    { id: 4, name: 'Tarefas', isActive: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-8">
      {assistants.map(assistant => (
        <div key={assistant.id} className="flex flex-col items-center gap-3">
          <ListeningOrb 
            isListening={assistant.isActive}
            size="md"
          />
          <p className="text-sm font-medium">{assistant.name}</p>
        </div>
      ))}
    </div>
  );
}
```

## 7. Com Animação de Entrada

```tsx
import { motion } from 'framer-motion';
import ListeningOrb from '@/components/voice/ListeningOrb';

function AnimatedOrbEntry({ isListening }: { isListening: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 260,
        damping: 20 
      }}
    >
      <ListeningOrb isListening={isListening} size="lg" />
    </motion.div>
  );
}
```

## 8. Com Tooltip de Ajuda

```tsx
import ListeningOrb from '@/components/voice/ListeningOrb';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function OrbWithTooltip({ isListening }: { isListening: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer">
            <ListeningOrb isListening={isListening} size="md" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Clique para {isListening ? 'parar' : 'começar'} a ouvir</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

## Dicas de Implementação

1. **Performance**: O componente usa animações GPU-accelerated (transform, opacity)
2. **Acessibilidade**: Adicione `aria-label` e `role="button"` ao container clicável
3. **Feedback Tátil**: Use `navigator.vibrate()` em mobile para haptic feedback
4. **Sons**: Adicione sons de "beep" ao iniciar/parar gravação
5. **Estados de Erro**: Crie uma variante vermelha para estados de erro
