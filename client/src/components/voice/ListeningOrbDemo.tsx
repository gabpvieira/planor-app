import { useState } from 'react';
import ListeningOrb from './ListeningOrb';
import { Button } from '@/components/ui/button';

/**
 * Componente de demonstração do ListeningOrb
 * Use este componente para testar o orbe isoladamente
 */
export default function ListeningOrbDemo() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">ListeningOrb Demo</h1>
        <p className="text-slate-400">Teste o componente de escuta visual</p>
      </div>

      {/* Orbe */}
      <div 
        className="cursor-pointer"
        onClick={() => {
          if (!isProcessing) {
            setIsListening(!isListening);
          }
        }}
      >
        <ListeningOrb 
          isListening={isListening}
          isProcessing={isProcessing}
          size="lg"
        />
      </div>

      {/* Controles */}
      <div className="flex gap-4">
        <Button
          onClick={() => setIsListening(!isListening)}
          disabled={isProcessing}
          variant={isListening ? "destructive" : "default"}
        >
          {isListening ? 'Parar de Ouvir' : 'Começar a Ouvir'}
        </Button>
        
        <Button
          onClick={() => {
            setIsListening(false);
            setIsProcessing(!isProcessing);
          }}
          variant={isProcessing ? "secondary" : "outline"}
        >
          {isProcessing ? 'Parar Processamento' : 'Simular Processamento'}
        </Button>
      </div>

      {/* Status */}
      <div className="text-center space-y-2">
        <div className="flex gap-4 justify-center text-sm">
          <span className={isListening ? 'text-blue-400 font-semibold' : 'text-slate-500'}>
            Ouvindo: {isListening ? '✓' : '✗'}
          </span>
          <span className={isProcessing ? 'text-purple-400 font-semibold' : 'text-slate-500'}>
            Processando: {isProcessing ? '✓' : '✗'}
          </span>
        </div>
      </div>

      {/* Tamanhos */}
      <div className="flex gap-8 items-end">
        <div className="text-center space-y-2">
          <ListeningOrb isListening={isListening} size="sm" />
          <p className="text-xs text-slate-400">Small</p>
        </div>
        <div className="text-center space-y-2">
          <ListeningOrb isListening={isListening} size="md" />
          <p className="text-xs text-slate-400">Medium</p>
        </div>
        <div className="text-center space-y-2">
          <ListeningOrb isListening={isListening} size="lg" />
          <p className="text-xs text-slate-400">Large</p>
        </div>
      </div>
    </div>
  );
}
