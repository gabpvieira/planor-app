/**
 * PLANOR - Premium Credit Card Component
 * Design System: Apple Card + Revolut Metal
 * 
 * Features:
 * - Glassmorphism avançado
 * - Tilt 3D com react-parallax-tilt
 * - Shimmer effect no hover
 * - Gradiente dinâmico por uso
 * - Micro-interações refinadas
 * - Carrossel para múltiplos cartões
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { Trash2, ChevronLeft, ChevronRight, Calendar, CreditCard as CreditCardIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============ TYPES ============
interface CreditCardData {
  id: string;
  name: string;
  card_limit: number;
  current_balance: number;
  closing_day: number;
  due_day: number;
  color_hex: string;
  brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard';
  bank_name?: string;
  bank_logo?: string;
}

interface PremiumCreditCardProps {
  card: CreditCardData;
  isActive?: boolean;
  onDelete?: (id: string) => void;
  onClick?: () => void;
}

interface CardCarouselProps {
  cards: CreditCardData[];
  onDeleteCard?: (id: string) => void;
}

// ============ BRAND LOGOS (SVG) ============
const BrandLogos = {
  visa: (
    <svg viewBox="0 0 48 16" className="h-6 w-auto opacity-80">
      <path fill="currentColor" d="M19.5 1.5l-2.8 13h-2.8l2.8-13h2.8zm11.3 8.4l1.5-4 .8 4h-2.3zm3.1 4.6h2.6l-2.3-13h-2.4c-.5 0-1 .3-1.2.8l-4.2 12.2h2.9l.6-1.6h3.6l.4 1.6zm-8.1-4.2c0-3.4-4.7-3.6-4.7-5.1 0-.5.5-.9 1.4-.9 1.3 0 2.3.3 2.9.6l.5-2.4c-.7-.3-1.8-.5-3-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.8 3.4 1.2.6 1.7 1 1.6 1.5 0 .8-1 1.2-1.9 1.2-1.6 0-2.5-.4-3.2-.8l-.6 2.5c.7.3 2.1.6 3.5.6 3.4 0 5.6-1.7 5.6-4.2h.5zM8.5 1.5L4 14.5H1L3.3 3.3c.1-.6-.3-1.1-.9-1.3C1.6 1.7.8 1.5 0 1.5h.1l4.5-.1 3.9.1z"/>
    </svg>
  ),
  mastercard: (
    <svg viewBox="0 0 48 30" className="h-6 w-auto">
      <circle cx="15" cy="15" r="15" fill="#EB001B" opacity="0.9"/>
      <circle cx="33" cy="15" r="15" fill="#F79E1B" opacity="0.9"/>
      <path fill="#FF5F00" d="M19 15a15 15 0 0 1 5-11.2 15 15 0 0 0 0 22.4 15 15 0 0 1-5-11.2z"/>
    </svg>
  ),
  elo: (
    <svg viewBox="0 0 48 20" className="h-5 w-auto opacity-90">
      <text x="0" y="16" fill="currentColor" fontSize="16" fontWeight="bold" fontFamily="system-ui">elo</text>
    </svg>
  ),
  amex: (
    <svg viewBox="0 0 48 16" className="h-5 w-auto opacity-80">
      <text x="0" y="13" fill="currentColor" fontSize="12" fontWeight="bold" fontFamily="system-ui">AMEX</text>
    </svg>
  ),
  hipercard: (
    <svg viewBox="0 0 48 16" className="h-5 w-auto opacity-80">
      <text x="0" y="13" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="system-ui">HIPERCARD</text>
    </svg>
  ),
};

// ============ UTILITY FUNCTIONS ============
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getUsageGradient = (percentage: number) => {
  if (percentage <= 50) {
    return 'from-emerald-400 to-cyan-400';
  } else if (percentage <= 75) {
    return 'from-yellow-400 to-orange-400';
  } else {
    return 'from-orange-500 to-red-500';
  }
};

// ============ SHIMMER EFFECT COMPONENT ============
function ShimmerEffect({ isHovered }: { isHovered: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-[20px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: isHovered ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={isHovered ? { x: '200%' } : { x: '-100%' }}
        transition={{ 
          duration: 1.5, 
          ease: 'easeInOut',
          repeat: isHovered ? Infinity : 0,
          repeatDelay: 0.5
        }}
        style={{ transform: 'skewX(-20deg)' }}
      />
    </motion.div>
  );
}

// ============ MAIN PREMIUM CREDIT CARD COMPONENT ============
export function PremiumCreditCard({ 
  card, 
  isActive = true, 
  onDelete, 
  onClick,
}: PremiumCreditCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showContextual, setShowContextual] = useState(false);
  
  const used = Number(card.current_balance);
  const limit = Number(card.card_limit);
  const available = limit - used;
  const usagePercent = limit > 0 ? (used / limit) * 100 : 0;
  const isCritical = available / limit < 0.15;

  return (
    <motion.div
      initial={{ scale: 0.8, rotateY: 5, opacity: 0 }}
      animate={{ scale: 1, rotateY: 0, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="w-full"
    >
      <Tilt
        tiltMaxAngleX={8}
        tiltMaxAngleY={8}
        perspective={1000}
        scale={isActive ? 1.02 : 1}
        transitionSpeed={400}
        gyroscope={false}
        className="w-full"
      >
        <div
          className={cn(
            "relative cursor-pointer transition-all duration-300",
            !isActive && "opacity-60 scale-95 blur-[1px]"
          )}
          onMouseEnter={() => { setIsHovered(true); setShowContextual(true); }}
          onMouseLeave={() => { setIsHovered(false); setShowContextual(false); }}
          onClick={onClick}
        >
          {/* Card Body */}
          <div
            className="relative aspect-[1.586/1] w-full max-w-[340px] mx-auto rounded-[20px] p-5 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${card.color_hex} 0%, ${card.color_hex}dd 50%, ${card.color_hex}aa 100%)`,
              boxShadow: isHovered 
                ? `0 25px 50px -12px ${card.color_hex}66, 0 0 0 1px rgba(255,255,255,0.1) inset`
                : `0 10px 40px -10px ${card.color_hex}44, 0 0 0 1px rgba(255,255,255,0.05) inset`,
            }}
          >
            {/* Glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
            
            {/* Metallic reflection */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
            
            {/* Shimmer effect */}
            <ShimmerEffect isHovered={isHovered} />

            {/* Card Content */}
            <div className="relative z-10 h-full flex flex-col justify-between">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  {card.bank_name && (
                    <span className="text-white/50 text-[10px] font-medium uppercase tracking-[0.15em] mb-0.5">
                      {card.bank_name}
                    </span>
                  )}
                  <span className="text-white text-sm font-semibold tracking-wide">
                    {card.name}
                  </span>
                </div>
                
                {/* Delete button */}
                {onDelete && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                    onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
                    className="p-1.5 rounded-full bg-black/20 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/40 transition-all"
                  >
                    <Trash2 className="size-3.5" />
                  </motion.button>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end">
                {/* Brand Logo */}
                <div className="text-white/90">
                  {BrandLogos[card.brand] || BrandLogos.visa}
                </div>

                {/* Contextual Info (appears on hover) */}
                <AnimatePresence>
                  {showContextual && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-1.5 text-white/60"
                    >
                      <Calendar className="size-3" />
                      <span className="text-[10px] font-medium">
                        Fecha {card.closing_day} • Vence {card.due_day}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Usage Details (below card) */}
          <motion.div 
            className="mt-4 px-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Progress Bar with Gradient */}
            <div className="h-1.5 rounded-full bg-white/5 dark:bg-white/10 overflow-hidden mb-3">
              <motion.div
                className={cn("h-full rounded-full bg-gradient-to-r", getUsageGradient(usagePercent))}
                initial={{ width: 0 }}
                animate={{ width: `${usagePercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            {/* Values */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                  Fatura Atual
                </span>
                <p className="font-mono text-base font-semibold text-foreground">
                  {formatCurrency(used)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                  Disponível
                </span>
                <motion.p 
                  className={cn(
                    "font-mono text-base font-semibold",
                    isCritical ? "text-red-500" : "text-emerald-500"
                  )}
                  animate={isCritical ? { opacity: [1, 0.6, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {formatCurrency(available)}
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </Tilt>
    </motion.div>
  );
}

// ============ CARD CAROUSEL (STACK) COMPONENT ============
export function CardCarousel({ cards, onDeleteCard }: CardCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <CreditCardIcon className="size-8 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Adicione seu primeiro cartão de crédito</p>
      </div>
    );
  }

  if (cards.length === 1) {
    return (
      <PremiumCreditCard 
        card={cards[0]} 
        isActive 
        onDelete={onDeleteCard}
      />
    );
  }

  return (
    <div className="relative pt-4">
      {/* Navigation Buttons */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToPrevious}
          className="size-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
        </motion.button>
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToNext}
          className="size-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="size-4" />
        </motion.button>
      </div>

      {/* Cards - Simple Fade Transition */}
      <div className="relative px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={cards[activeIndex].id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <PremiumCreditCard
              card={cards[activeIndex]}
              isActive
              onDelete={onDeleteCard}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-1.5 mt-4">
        {cards.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === activeIndex 
                ? "w-6 bg-primary" 
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
    </div>
  );
}

export default PremiumCreditCard;
