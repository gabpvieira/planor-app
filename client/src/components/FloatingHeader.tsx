import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FloatingHeaderProps {
  title: string;
  subtitle?: string;
  showDate?: boolean;
  minimal?: boolean;
  actions?: React.ReactNode;
}

export function FloatingHeader({ 
  title, 
  subtitle, 
  showDate = false,
  minimal = false,
  actions 
}: FloatingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Detecta scroll para adicionar sombra
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Data formatada
  const formattedDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  
  // Subtítulo final (prioriza prop, depois data se habilitado)
  const displaySubtitle = subtitle || (showDate ? formattedDate : undefined);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        sticky top-0 z-40 w-full
        bg-background/60 backdrop-blur-xl
        transition-all duration-300
        ${isScrolled ? 'shadow-sm shadow-black/10' : ''}
      `}
    >
      <div className={`
        w-full px-4 sm:px-6 
        ${minimal ? 'py-2 sm:py-3' : 'py-3 sm:py-4'}
      `}>
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Título e Subtítulo - alinhado com menu hambúrguer no mobile */}
          <div className="flex-1 min-w-0 ml-11 sm:ml-0">
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`
                font-bold tracking-tight text-foreground truncate
                ${minimal ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl'}
              `}
            >
              {title}
            </motion.h1>
            
            {displaySubtitle && !minimal && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 truncate capitalize"
              >
                {displaySubtitle}
              </motion.p>
            )}
          </div>
          
          {/* Ações (botões, etc) */}
          {actions && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="shrink-0"
            >
              {actions}
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}

export default FloatingHeader;
