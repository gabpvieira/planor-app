import React, { useState, useMemo } from 'react';
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, subDays, subWeeks, subMonths, subYears, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isWithinInterval, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Activity, Heart, Calendar, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { FINANCE_CATEGORIES } from '@/types/finance.types';

// Types
type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

interface AnalyticsProps {
  transactions: any[];
  accounts: any[];
  creditCards: any[];
  recurringBills: any[];
  allCategories?: any[];
}

// Currency formatter
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatCompact = (value: number) => {
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return formatCurrency(value);
};

// ============ PERIOD SELECTOR (Apple Segmented Control) ============
function PeriodSelector({ 
  value, 
  onChange,
  customRange,
  onCustomRangeChange 
}: { 
  value: PeriodType; 
  onChange: (v: PeriodType) => void;
  customRange: { start: Date; end: Date };
  onCustomRangeChange: (range: { start: Date; end: Date }) => void;
}) {
  const periods: { value: PeriodType; label: string }[] = [
    { value: 'day', label: 'Dia' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mês' },
    { value: 'year', label: 'Ano' },
    { value: 'custom', label: 'Período' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="analytics-segmented-control">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onChange(period.value)}
            className={`analytics-segment ${value === period.value ? 'analytics-segment-active' : ''}`}
          >
            {period.label}
          </button>
        ))}
      </div>
      
      {value === 'custom' && (
        <div className="flex items-center gap-2 analytics-date-range">
          <input
            type="date"
            value={format(customRange.start, 'yyyy-MM-dd')}
            onChange={(e) => onCustomRangeChange({ ...customRange, start: new Date(e.target.value) })}
            className="analytics-date-input"
          />
          <span className="text-[var(--finance-gray-2)] text-sm">até</span>
          <input
            type="date"
            value={format(customRange.end, 'yyyy-MM-dd')}
            onChange={(e) => onCustomRangeChange({ ...customRange, end: new Date(e.target.value) })}
            className="analytics-date-input"
          />
        </div>
      )}
    </div>
  );
}

// ============ KPI CARD (Glassmorphism Premium) ============
function KPICard({
  label,
  value,
  previousValue,
  suffix,
  variant = 'neutral',
  icon: Icon,
  subLabel,
}: {
  label: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  variant?: 'positive' | 'negative' | 'neutral' | 'warning';
  icon?: React.ElementType;
  subLabel?: string;
}) {
  const change = previousValue !== undefined && previousValue !== 0 
    ? ((value - previousValue) / Math.abs(previousValue)) * 100 
    : 0;
  
  const isPositiveChange = change > 0;
  const hasChange = previousValue !== undefined && change !== 0;

  const variantStyles = {
    positive: 'text-[var(--finance-green-text)]',
    negative: 'text-[var(--finance-red-text)]',
    neutral: 'text-foreground',
    warning: 'text-[var(--finance-orange)]',
  };

  return (
    <div className="analytics-kpi-card">
      <div className="flex items-start justify-between mb-3">
        <span className="analytics-kpi-label">{label}</span>
        {Icon && (
          <div className={`analytics-kpi-icon ${variant === 'positive' ? 'analytics-kpi-icon-positive' : variant === 'negative' ? 'analytics-kpi-icon-negative' : ''}`}>
            <Icon className="size-4" />
          </div>
        )}
      </div>
      
      <div className={`analytics-kpi-value ${variantStyles[variant]}`}>
        {suffix === '%' ? `${value.toFixed(1)}%` : formatCurrency(value)}
      </div>
      
      {hasChange && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className={`analytics-change-badge ${isPositiveChange ? 'analytics-change-positive' : 'analytics-change-negative'}`}>
            {isPositiveChange ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
          <span className="analytics-change-label">vs período anterior</span>
        </div>
      )}
      
      {subLabel && (
        <p className="analytics-kpi-sublabel mt-2">{subLabel}</p>
      )}
    </div>
  );
}

// ============ HEALTH INDICATOR (Apple Health Style) ============
function FinancialHealthIndicator({ ratio }: { ratio: number }) {
  const getHealthStatus = (r: number): { label: string; color: string; description: string } => {
    if (r < 40) return { 
      label: 'Excelente', 
      color: 'var(--finance-green)',
      description: 'Suas finanças estão muito saudáveis'
    };
    if (r < 60) return { 
      label: 'Boa', 
      color: 'var(--finance-blue)',
      description: 'Você está no caminho certo'
    };
    if (r < 80) return { 
      label: 'Atenção', 
      color: 'var(--finance-orange)',
      description: 'Considere revisar seus gastos'
    };
    return { 
      label: 'Crítica', 
      color: 'var(--finance-red)',
      description: 'Recomendamos reavaliar seu orçamento'
    };
  };

  const status = getHealthStatus(ratio);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (Math.min(ratio, 100) / 100) * circumference;

  return (
    <div className="analytics-health-card">
      <div className="flex items-center gap-6">
        {/* Ring Chart */}
        <div className="relative">
          <svg width="120" height="120" className="analytics-health-ring">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="var(--finance-gray-5)"
              strokeWidth="8"
              className="dark:stroke-[var(--finance-gray-4)]"
            />
            {/* Progress ring */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke={status.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
              className="analytics-health-progress"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-semibold" style={{ color: status.color }}>
                {ratio.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Status Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="size-4" style={{ color: status.color }} />
            <span className="analytics-health-label">Saúde Financeira</span>
          </div>
          <p className="analytics-health-status" style={{ color: status.color }}>
            {status.label}
          </p>
          <p className="analytics-health-description">
            {status.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============ LINE CHART (Apple Style - SVG with Tooltips) ============
function IncomeExpenseChart({ 
  data,
  period 
}: { 
  data: { date: string; income: number; expense: number }[];
  period: PeriodType;
}) {
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (data.length === 0) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">
          <Activity className="size-5" />
          Receitas vs Despesas
        </h3>
        <div className="analytics-empty-chart">
          <Activity className="size-12 text-[var(--finance-gray-3)]" />
          <p>Sem dados para o período selecionado</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const padding = { top: 40, right: 20, bottom: 40, left: 70 };
  const width = 600;
  const height = 300;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xScale = (index: number) => padding.left + (index / (data.length - 1 || 1)) * chartWidth;
  const yScale = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

  const createSmoothPath = (values: number[]) => {
    if (values.length < 2) {
      return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(v)}`).join(' ');
    }
    
    let path = `M ${xScale(0)} ${yScale(values[0])}`;
    
    for (let i = 1; i < values.length; i++) {
      const x0 = xScale(i - 1);
      const y0 = yScale(values[i - 1]);
      const x1 = xScale(i);
      const y1 = yScale(values[i]);
      const cpx = (x0 + x1) / 2;
      
      path += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
    }
    
    return path;
  };

  const incomePath = createSmoothPath(data.map(d => d.income));
  const expensePath = createSmoothPath(data.map(d => d.expense));

  const formatLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    switch (period) {
      case 'day': return format(date, 'HH:mm');
      case 'week': return format(date, 'EEE', { locale: ptBR });
      case 'month': return format(date, 'd');
      case 'year': return format(date, 'MMM', { locale: ptBR });
      default: return format(date, 'd/MM');
    }
  };

  const formatTooltipDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    switch (period) {
      case 'day': return format(date, "d 'de' MMM, HH:mm", { locale: ptBR });
      case 'week': return format(date, "EEEE, d 'de' MMM", { locale: ptBR });
      case 'month': return format(date, "d 'de' MMMM", { locale: ptBR });
      case 'year': return format(date, "MMMM 'de' yyyy", { locale: ptBR });
      default: return format(date, "d 'de' MMM 'de' yyyy", { locale: ptBR });
    }
  };

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
    y: padding.top + chartHeight * (1 - ratio),
    value: maxValue * ratio,
  }));

  const handlePointHover = (index: number, x: number, y: number) => {
    setActivePoint(index);
    setTooltipPos({ x, y });
  };

  const handlePointLeave = () => {
    setActivePoint(null);
  };

  const activeData = activePoint !== null ? data[activePoint] : null;

  return (
    <div className="analytics-chart-card relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="analytics-chart-title">
          <Activity className="size-5" />
          Receitas vs Despesas
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[var(--finance-green)] rounded" />
            <span className="text-xs text-[var(--finance-gray-1)]">Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-[var(--finance-red)] rounded opacity-70" />
            <span className="text-xs text-[var(--finance-gray-1)]">Despesas</span>
          </div>
        </div>
      </div>
      
      <div className="analytics-chart-container relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          {gridLines.map((line, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={width - padding.right}
                y2={line.y}
                stroke="var(--finance-gray-5)"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="dark:stroke-[var(--finance-gray-4)]"
              />
              <text
                x={padding.left - 8}
                y={line.y + 4}
                textAnchor="end"
                className="analytics-chart-label"
              >
                {formatCompact(line.value)}
              </text>
            </g>
          ))}
          
          {/* X-axis labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={xScale(i)}
              y={height - 10}
              textAnchor="middle"
              className="analytics-chart-label"
            >
              {formatLabel(d.date)}
            </text>
          ))}
          
          {/* Income line */}
          <path
            d={incomePath}
            fill="none"
            stroke="var(--finance-green)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="analytics-line-income"
          />
          
          {/* Expense line */}
          <path
            d={expensePath}
            fill="none"
            stroke="var(--finance-red)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 4"
            opacity="0.7"
            className="analytics-line-expense"
          />
          
          {/* Vertical line indicator */}
          {activePoint !== null && (
            <line
              x1={xScale(activePoint)}
              y1={padding.top}
              x2={xScale(activePoint)}
              y2={height - padding.bottom}
              stroke="var(--finance-gray-3)"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="dark:stroke-[var(--finance-gray-2)]"
            />
          )}
          
          {/* Data points - Income */}
          {data.map((d, i) => (
            <circle
              key={`income-${i}`}
              cx={xScale(i)}
              cy={yScale(d.income)}
              r={activePoint === i ? 7 : 5}
              fill="var(--finance-green)"
              stroke="white"
              strokeWidth="2"
              className="analytics-data-point-interactive"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => handlePointHover(i, xScale(i), yScale(d.income))}
              onMouseLeave={handlePointLeave}
              onClick={() => setActivePoint(activePoint === i ? null : i)}
            />
          ))}
          
          {/* Data points - Expense */}
          {data.map((d, i) => (
            <circle
              key={`expense-${i}`}
              cx={xScale(i)}
              cy={yScale(d.expense)}
              r={activePoint === i ? 6 : 4}
              fill="var(--finance-red)"
              stroke="white"
              strokeWidth="2"
              className="analytics-data-point-interactive"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => handlePointHover(i, xScale(i), yScale(d.expense))}
              onMouseLeave={handlePointLeave}
              onClick={() => setActivePoint(activePoint === i ? null : i)}
            />
          ))}
          
          {/* Invisible hit areas for better touch/click */}
          {data.map((d, i) => (
            <rect
              key={`hitarea-${i}`}
              x={xScale(i) - 20}
              y={padding.top}
              width={40}
              height={chartHeight}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => handlePointHover(i, xScale(i), Math.min(yScale(d.income), yScale(d.expense)))}
              onMouseLeave={handlePointLeave}
              onClick={() => setActivePoint(activePoint === i ? null : i)}
            />
          ))}
        </svg>
        
        {/* Tooltip */}
        {activeData && activePoint !== null && (
          <div 
            className="analytics-tooltip-card"
            style={{
              position: 'absolute',
              left: `${(xScale(activePoint) / width) * 100}%`,
              top: '10px',
              transform: 'translateX(-50%)',
            }}
          >
            <p className="analytics-tooltip-date">{formatTooltipDate(activeData.date)}</p>
            <div className="analytics-tooltip-row">
              <span className="analytics-tooltip-dot" style={{ background: 'var(--finance-green)' }} />
              <span className="analytics-tooltip-label">Receitas</span>
              <span className="analytics-tooltip-value text-[var(--finance-green-text)]">
                {formatCurrency(activeData.income)}
              </span>
            </div>
            <div className="analytics-tooltip-row">
              <span className="analytics-tooltip-dot" style={{ background: 'var(--finance-red)' }} />
              <span className="analytics-tooltip-label">Despesas</span>
              <span className="analytics-tooltip-value text-[var(--finance-red-text)]">
                {formatCurrency(activeData.expense)}
              </span>
            </div>
            <div className="analytics-tooltip-divider" />
            <div className="analytics-tooltip-row">
              <span className="analytics-tooltip-label font-medium">Saldo</span>
              <span className={`analytics-tooltip-value font-semibold ${activeData.income - activeData.expense >= 0 ? 'text-[var(--finance-green-text)]' : 'text-[var(--finance-red-text)]'}`}>
                {formatCurrency(activeData.income - activeData.expense)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ DONUT CHART (Category Distribution) ============
function CategoryDonutChart({ 
  data,
  allCategories 
}: { 
  data: { category: string; amount: number; color: string }[];
  allCategories?: any[];
}) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  
  if (data.length === 0 || total === 0) {
    return (
      <div className="analytics-chart-card">
        <h3 className="analytics-chart-title">
          <Activity className="size-5" />
          Distribuição de Despesas
        </h3>
        <div className="analytics-empty-chart">
          <Activity className="size-12 text-[var(--finance-gray-3)]" />
          <p>Sem despesas no período</p>
        </div>
      </div>
    );
  }

  const getCategoryLabel = (slug: string) => {
    const systemCat = FINANCE_CATEGORIES[slug as keyof typeof FINANCE_CATEGORIES];
    if (systemCat) return systemCat.label;
    if (allCategories) {
      const custom = allCategories.find(c => c.slug === slug);
      if (custom) return custom.label;
    }
    return slug;
  };

  // Calculate segments
  const radius = 70;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  const segments = data.slice(0, 6).map((item) => {
    const percentage = (item.amount / total) * 100;
    const length = (percentage / 100) * circumference;
    const segment = {
      ...item,
      percentage,
      offset: currentOffset,
      length,
    };
    currentOffset += length;
    return segment;
  });

  return (
    <div className="analytics-chart-card">
      <h3 className="analytics-chart-title mb-6">
        <Activity className="size-5" />
        Distribuição de Despesas
      </h3>
      
      <div className="flex items-center gap-8">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <svg width="180" height="180" className="analytics-donut">
            {/* Background ring */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="var(--finance-gray-5)"
              strokeWidth={strokeWidth}
              className="dark:stroke-[var(--finance-gray-4)]"
            />
            
            {/* Segments */}
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="round"
                transform="rotate(-90 90 90)"
                className="analytics-donut-segment"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs text-[var(--finance-gray-2)] uppercase tracking-wider">Total</p>
              <p className="text-lg font-semibold">{formatCompact(total)}</p>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex-1 space-y-2">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="size-2.5 rounded-full" 
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-sm">{getCategoryLabel(seg.category)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--finance-gray-2)]">
                  {seg.percentage.toFixed(1)}%
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatCompact(seg.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ MAIN ANALYTICS COMPONENT ============
export default function FinanceAnalytics({ 
  transactions, 
  accounts, 
  creditCards, 
  recurringBills,
  allCategories 
}: AnalyticsProps) {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customRange, setCustomRange] = useState({
    start: subMonths(new Date(), 1),
    end: new Date(),
  });

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'day':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { start: startOfDay(customRange.start), end: endOfDay(customRange.end) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period, customRange]);

  // Previous period for comparison
  const previousRange = useMemo(() => {
    const duration = differenceInDays(dateRange.end, dateRange.start) + 1;
    return {
      start: subDays(dateRange.start, duration),
      end: subDays(dateRange.end, duration),
    };
  }, [dateRange]);

  // Filter transactions by period
  const periodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, dateRange);
    });
  }, [transactions, dateRange]);

  const previousTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, previousRange);
    });
  }, [transactions, previousRange]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    // Receitas: todas as receitas (exceto transferências)
    const income = periodTransactions
      .filter(t => t.type === 'income' && !t.is_transfer)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Despesas: apenas despesas que NÃO são de cartão de crédito
    // Gastos no cartão não afetam o saldo bancário até o pagamento da fatura
    const expenses = periodTransactions
      .filter(t => t.type === 'expense' && !t.is_transfer && !t.card_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Gastos no cartão (separado para referência)
    const cardExpenses = periodTransactions
      .filter(t => t.type === 'expense' && t.card_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const pendingExpenses = periodTransactions
      .filter(t => t.type === 'expense' && !t.paid && !t.card_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const prevIncome = previousTransactions
      .filter(t => t.type === 'income' && !t.is_transfer)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const prevExpenses = previousTransactions
      .filter(t => t.type === 'expense' && !t.is_transfer && !t.card_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = income - expenses;
    const prevBalance = prevIncome - prevExpenses;
    const ratio = income > 0 ? (expenses / income) * 100 : 0;

    return {
      income,
      expenses,
      cardExpenses,
      pendingExpenses,
      balance,
      ratio,
      prevIncome,
      prevExpenses,
      prevBalance,
    };
  }, [periodTransactions, previousTransactions]);

  // Chart data
  const chartData = useMemo(() => {
    const getIntervals = () => {
      switch (period) {
        case 'day':
          return eachDayOfInterval(dateRange).map(d => ({
            start: startOfDay(d),
            end: endOfDay(d),
            label: format(d, 'HH:mm'),
          }));
        case 'week':
          return eachDayOfInterval(dateRange).map(d => ({
            start: startOfDay(d),
            end: endOfDay(d),
            label: format(d, 'EEE', { locale: ptBR }),
          }));
        case 'month':
          return eachWeekOfInterval(dateRange, { locale: ptBR }).map(d => ({
            start: startOfWeek(d, { locale: ptBR }),
            end: endOfWeek(d, { locale: ptBR }),
            label: format(d, "'Sem' w"),
          }));
        case 'year':
          return eachMonthOfInterval(dateRange).map(d => ({
            start: startOfMonth(d),
            end: endOfMonth(d),
            label: format(d, 'MMM', { locale: ptBR }),
          }));
        default:
          return eachDayOfInterval(dateRange).map(d => ({
            start: startOfDay(d),
            end: endOfDay(d),
            label: format(d, 'd/MM'),
          }));
      }
    };

    const intervals = getIntervals();
    
    return intervals.map(interval => {
      const intervalTransactions = periodTransactions.filter(t => {
        const date = parseISO(t.date);
        return isWithinInterval(date, { start: interval.start, end: interval.end });
      });

      return {
        date: interval.start.toISOString(),
        income: intervalTransactions
          .filter(t => t.type === 'income' && !t.is_transfer)
          .reduce((sum, t) => sum + Number(t.amount), 0),
        // Despesas: apenas as que saíram da conta (não cartão)
        expense: intervalTransactions
          .filter(t => t.type === 'expense' && !t.is_transfer && !t.card_id)
          .reduce((sum, t) => sum + Number(t.amount), 0),
      };
    });
  }, [periodTransactions, dateRange, period]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const expensesByCategory: Record<string, number> = {};
    
    periodTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'outros';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(t.amount);
      });

    return Object.entries(expensesByCategory)
      .map(([category, amount]) => {
        const systemCat = FINANCE_CATEGORIES[category as keyof typeof FINANCE_CATEGORIES];
        const customCat = allCategories?.find(c => c.slug === category);
        const color = systemCat?.color || customCat?.color_hex || '#64748B';
        
        return { category, amount, color };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [periodTransactions, allCategories]);

  // Period label
  const periodLabel = useMemo(() => {
    switch (period) {
      case 'day':
        return format(dateRange.start, "d 'de' MMMM", { locale: ptBR });
      case 'week':
        return `${format(dateRange.start, 'd')} - ${format(dateRange.end, "d 'de' MMM", { locale: ptBR })}`;
      case 'month':
        return format(dateRange.start, "MMMM 'de' yyyy", { locale: ptBR });
      case 'year':
        return format(dateRange.start, 'yyyy');
      case 'custom':
        return `${format(dateRange.start, 'd/MM')} - ${format(dateRange.end, 'd/MM/yyyy')}`;
      default:
        return '';
    }
  }, [period, dateRange]);

  return (
    <div className="analytics-container space-y-6">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h2 className="analytics-title">Visão Analítica</h2>
          <p className="analytics-subtitle">{periodLabel}</p>
        </div>
        <PeriodSelector 
          value={period} 
          onChange={setPeriod}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Receitas do Período"
          value={kpis.income}
          previousValue={kpis.prevIncome}
          variant="positive"
          icon={TrendingUp}
        />
        <KPICard
          label="Despesas do Período"
          value={kpis.expenses}
          previousValue={kpis.prevExpenses}
          variant="negative"
          icon={TrendingDown}
          subLabel="Saídas das contas"
        />
        <KPICard
          label="Saldo do Período"
          value={kpis.balance}
          previousValue={kpis.prevBalance}
          variant={kpis.balance >= 0 ? 'positive' : 'negative'}
          icon={Activity}
          subLabel="Receitas - Despesas"
        />
        <KPICard
          label="Despesas / Receitas"
          value={kpis.ratio}
          suffix="%"
          variant={kpis.ratio < 60 ? 'neutral' : kpis.ratio < 80 ? 'warning' : 'negative'}
        />
      </div>

      {/* Health Indicator */}
      <FinancialHealthIndicator ratio={kpis.ratio} />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart data={chartData} period={period} />
        <CategoryDonutChart data={categoryData} allCategories={allCategories} />
      </div>
    </div>
  );
}
