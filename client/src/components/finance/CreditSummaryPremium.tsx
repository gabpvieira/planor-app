import React, { useState, useEffect, useRef } from 'react';
import { Wallet, TrendingDown, ShieldCheck, Eye, EyeOff } from 'lucide-react';

// ============================================
// CREDIT SUMMARY PREMIUM - Luxury Tech Design
// Inspired by Apple Card & Revolut Metal
// ============================================

interface CreditSummaryPremiumProps {
  creditCards: Array<{
    id: string;
    card_limit: number;
    current_balance: number;
  }>;
  showValues?: boolean;
  onTogglePrivacy?: () => void;
}

// Animated counter hook for count-up effect
function useAnimatedValue(targetValue: number, duration: number = 800) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startValue = previousValue.current;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * easeOut;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = targetValue;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}

// Currency formatter with monospace styling
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

// Individual animated card component
function CreditCard({ 
  label, 
  value, 
  icon: Icon, 
  variant,
  showValue,
  delay = 0
}: { 
  label: string;
  value: number;
  icon: React.ElementType;
  variant: 'total' | 'used' | 'available';
  showValue: boolean;
  delay?: number;
}) {
  const animatedValue = useAnimatedValue(showValue ? value : 0, 800);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Calculate health status for used card
  const getUsedHealthClass = () => {
    if (variant !== 'used') return '';
    const percentage = value > 0 ? (value / (value + 1)) * 100 : 0;
    if (percentage > 80) return 'credit-card-danger';
    if (percentage > 60) return 'credit-card-warning';
    return '';
  };

  const variantClasses = {
    total: 'credit-card-total',
    used: `credit-card-used ${getUsedHealthClass()}`,
    available: 'credit-card-available',
  };

  return (
    <div 
      className={`
        credit-summary-card 
        ${variantClasses[variant]}
        ${isVisible ? 'credit-card-visible' : 'credit-card-hidden'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Glassmorphism overlay */}
      <div className="credit-card-glass-overlay" />
      
      {/* Micro icon */}
      <div className="credit-card-icon-wrapper">
        <Icon className="credit-card-icon" />
      </div>
      
      {/* Label */}
      <span className="credit-card-label">{label}</span>
      
      {/* Value with monospace font */}
      <div className={`credit-card-value ${variant === 'available' ? 'credit-card-value-highlight' : ''}`}>
        {showValue ? (
          <span className="credit-value-mono">
            {formatCurrency(animatedValue)}
          </span>
        ) : (
          <span className="credit-value-hidden">••••••</span>
        )}
      </div>
    </div>
  );
}

export function CreditSummaryPremium({ 
  creditCards, 
  showValues = true,
  onTogglePrivacy 
}: CreditSummaryPremiumProps) {
  // Persist privacy state in localStorage
  const [localShowValues, setLocalShowValues] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('planor-credit-privacy');
      return stored !== null ? stored === 'true' : showValues;
    }
    return showValues;
  });

  // Calculate totals
  const totalLimit = creditCards.reduce((sum, c) => sum + Number(c.card_limit), 0);
  const totalUsed = creditCards.reduce((sum, c) => sum + Number(c.current_balance), 0);
  const totalAvailable = totalLimit - totalUsed;

  // Usage percentage for health indicator
  const usagePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  const handleTogglePrivacy = () => {
    const newValue = !localShowValues;
    setLocalShowValues(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('planor-credit-privacy', String(newValue));
    }
    onTogglePrivacy?.();
  };

  if (creditCards.length === 0) {
    return (
      <div className="credit-summary-empty">
        <div className="credit-summary-empty-icon">
          <Wallet className="size-12 opacity-30" />
        </div>
        <p className="credit-summary-empty-text">Adicione cartões para ver o resumo</p>
      </div>
    );
  }

  return (
    <div className="credit-summary-premium">
      {/* Header with privacy toggle */}
      <div className="credit-summary-header">
        <h3 className="credit-summary-title">Resumo de Crédito</h3>
        <button 
          onClick={handleTogglePrivacy}
          className="credit-privacy-toggle"
          aria-label={localShowValues ? 'Ocultar valores' : 'Mostrar valores'}
        >
          {localShowValues ? (
            <Eye className="size-4" />
          ) : (
            <EyeOff className="size-4" />
          )}
        </button>
      </div>

      {/* Cards grid */}
      <div className="credit-summary-grid">
        <CreditCard
          label="Limite Total"
          value={totalLimit}
          icon={Wallet}
          variant="total"
          showValue={localShowValues}
          delay={0}
        />
        <CreditCard
          label="Valor Utilizado"
          value={totalUsed}
          icon={TrendingDown}
          variant="used"
          showValue={localShowValues}
          delay={50}
        />
        <CreditCard
          label="Valor Disponível"
          value={totalAvailable}
          icon={ShieldCheck}
          variant="available"
          showValue={localShowValues}
          delay={100}
        />
      </div>

      {/* Usage bar indicator */}
      <div className="credit-usage-bar-container">
        <div className="credit-usage-bar">
          <div 
            className={`credit-usage-bar-fill ${
              usagePercentage > 80 ? 'credit-usage-danger' : 
              usagePercentage > 60 ? 'credit-usage-warning' : 
              'credit-usage-healthy'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        <span className="credit-usage-percentage">
          {localShowValues ? `${usagePercentage.toFixed(0)}% utilizado` : '••• utilizado'}
        </span>
      </div>
    </div>
  );
}

export default CreditSummaryPremium;
