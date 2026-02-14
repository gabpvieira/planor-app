import { useState, useMemo, useEffect } from 'react';
import { useFinancialChallenges, useChallengeSimulation } from '@/hooks/use-financial-challenges';
import { ChallengeWithCalculations } from '@/services/financial-challenges.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, differenceInWeeks, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Trash2,
  MoreHorizontal,
  ArrowUpRight,
  Target,
  Loader2,
  RefreshCw,
  Bell,
  BellOff,
  Zap,
  Rocket,
  Settings2,
  Plane,
  Car,
  Home,
  Laptop,
  GraduationCap,
  BookOpen,
  PiggyBank,
  Palmtree,
  Gift,
  Dumbbell,
  Heart,
  Gem,
  type LucideIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChallengeDirection, ChallengeDeposit } from '@/types/database.types';

// Challenge Templates
type ChallengeTemplate = 'custom' | '5k' | '10k';

interface TemplateConfig {
  name: string;
  targetAmount: number;
  description: string;
  icon: LucideIcon;
  color: string;
}

const CHALLENGE_TEMPLATES: Record<ChallengeTemplate, TemplateConfig> = {
  custom: {
    name: 'Personalizado',
    targetAmount: 0,
    description: 'Configure valores manualmente',
    icon: Settings2,
    color: 'violet',
  },
  '5k': {
    name: 'Desafio 5K',
    targetAmount: 5000,
    description: 'Junte R$ 5.000 com aportes leves',
    icon: Target,
    color: 'emerald',
  },
  '10k': {
    name: 'Desafio 10K',
    targetAmount: 10000,
    description: 'Junte R$ 10.000 de forma gradual',
    icon: Rocket,
    color: 'blue',
  },
};

// Calculate optimal weekly amounts using "Salary Cycle Method"
// This method is based on real-world budgeting where:
// - Week 1 (right after payday): Highest contribution (40% of monthly)
// - Week 2: Medium-high contribution (30% of monthly)
// - Week 3: Medium-low contribution (20% of monthly)  
// - Week 4: Lowest contribution (10% of monthly)
// This respects the natural cash flow cycle and makes saving easier
function calculateOptimalWeeklyAmounts(targetAmount: number, totalWeeks: number, direction: ChallengeDirection): number[] {
  const amounts: number[] = [];
  const totalMonths = Math.ceil(totalWeeks / 4);
  
  // Monthly distribution weights (Salary Cycle Method)
  // Standard: heavy at start of month (when salary arrives)
  // Inverse: heavy at end of month (for those who prefer)
  const weekWeights = direction === 'standard' 
    ? [0.40, 0.30, 0.20, 0.10]  // Standard: 40%, 30%, 20%, 10%
    : [0.10, 0.20, 0.30, 0.40]; // Inverse: 10%, 20%, 30%, 40%
  
  // Calculate monthly target with gentle progression
  const baseMonthly = targetAmount / totalMonths;
  const monthlyTargets: number[] = [];
  let totalAllocated = 0;
  
  for (let month = 0; month < totalMonths; month++) {
    // Gentle growth: first month is 85% of average, last month is 115%
    const growthFactor = 0.85 + (0.30 * month / Math.max(1, totalMonths - 1));
    const monthTarget = baseMonthly * growthFactor;
    monthlyTargets.push(monthTarget);
    totalAllocated += monthTarget;
  }
  
  // Scale to hit exact target
  const scale = targetAmount / totalAllocated;
  for (let i = 0; i < monthlyTargets.length; i++) {
    monthlyTargets[i] *= scale;
  }
  
  // Distribute each month's target across 4 weeks
  for (let week = 0; week < totalWeeks; week++) {
    const monthIndex = Math.floor(week / 4);
    const weekInMonth = week % 4;
    
    // Handle last month which might have fewer weeks
    const weeksInThisMonth = Math.min(4, totalWeeks - monthIndex * 4);
    
    // Adjust weights for partial months
    let adjustedWeights = weekWeights.slice(0, weeksInThisMonth);
    const weightSum = adjustedWeights.reduce((a, b) => a + b, 0);
    adjustedWeights = adjustedWeights.map(w => w / weightSum);
    
    const monthlyTarget = monthlyTargets[Math.min(monthIndex, monthlyTargets.length - 1)];
    let amount = monthlyTarget * adjustedWeights[weekInMonth];
    
    // Round to nearest R$1 for clean numbers
    amount = Math.round(amount);
    
    // Minimum R$5 per week
    amount = Math.max(5, amount);
    
    amounts.push(amount);
  }
  
  // Final adjustment to hit exact target
  const currentTotal = amounts.reduce((a, b) => a + b, 0);
  const diff = targetAmount - currentTotal;
  
  // Distribute difference across the heavier weeks (week 1 of each month)
  const heavyWeeks = amounts.map((_, i) => i).filter(i => i % 4 === 0);
  const adjustPerHeavyWeek = Math.round(diff / Math.max(1, heavyWeeks.length));
  
  for (const weekIndex of heavyWeeks) {
    amounts[weekIndex] += adjustPerHeavyWeek;
  }
  
  // Final fine-tune on last week
  const finalTotal = amounts.reduce((a, b) => a + b, 0);
  amounts[amounts.length - 1] += (targetAmount - finalTotal);
  
  return amounts;
}

// Icon options for challenges - using Lucide icons
const CHALLENGE_ICONS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'target', label: 'Meta', icon: Target },
  { value: 'gem', label: 'Noivado', icon: Gem },
  { value: 'plane', label: 'Viagem', icon: Plane },
  { value: 'car', label: 'Carro', icon: Car },
  { value: 'home', label: 'Casa', icon: Home },
  { value: 'laptop', label: 'Tecnologia', icon: Laptop },
  { value: 'book', label: 'Educação', icon: BookOpen },
  { value: 'graduation', label: 'Formatura', icon: GraduationCap },
  { value: 'piggy', label: 'Poupança', icon: PiggyBank },
  { value: 'palmtree', label: 'Férias', icon: Palmtree },
  { value: 'gift', label: 'Presente', icon: Gift },
  { value: 'dumbbell', label: 'Academia', icon: Dumbbell },
  { value: 'rocket', label: 'Foguete', icon: Rocket },
  { value: 'heart', label: 'Sonho', icon: Heart },
];

// Get icon component by value
function getIconComponent(iconValue: string): LucideIcon {
  const found = CHALLENGE_ICONS.find(i => i.value === iconValue);
  return found?.icon || Target;
}

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

// Week Grid Component (GitHub-style)
function WeekGrid({ 
  challenge,
  onWeekClick,
}: { 
  challenge: ChallengeWithCalculations;
  onWeekClick: (week: number) => void;
}) {
  const depositHistory = (challenge.deposit_history || []) as ChallengeDeposit[];
  const paidWeeks = new Set(depositHistory.filter(d => d.status === 'paid').map(d => d.week));
  
  // Calculate current week based on start date
  const startDate = new Date(challenge.start_date);
  const now = new Date();
  const currentWeekNumber = Math.max(1, Math.min(
    challenge.total_weeks,
    differenceInWeeks(now, startDate) + 1
  ));

  // Generate grid data
  const weeks = Array.from({ length: challenge.total_weeks }, (_, i) => {
    const week = i + 1;
    const isPaid = paidWeeks.has(week);
    const isCurrent = week === currentWeekNumber && !isPaid;
    const isPast = week < currentWeekNumber && !isPaid;
    const amount = challenge.weeklyAmounts[i];
    
    return { week, isPaid, isCurrent, isPast, amount };
  });

  // Calculate grid dimensions
  const cols = challenge.total_weeks <= 52 ? 13 : challenge.total_weeks <= 104 ? 13 : 13;
  const rows = Math.ceil(challenge.total_weeks / cols);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Semana 1</span>
        <span>Semana {challenge.total_weeks}</span>
      </div>
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {weeks.map(({ week, isPaid, isCurrent, isPast, amount }) => (
          <button
            key={week}
            onClick={() => onWeekClick(week)}
            className={cn(
              "aspect-square rounded-sm transition-all duration-200 relative group",
              "hover:scale-110 hover:z-10",
              isPaid && "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
              isCurrent && "bg-blue-500/50 animate-pulse",
              isPast && "bg-amber-500/30",
              !isPaid && !isCurrent && !isPast && "bg-white/5 border border-white/10",
            )}
            title={`Semana ${week}: ${formatCurrency(amount)}`}
          >
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border/50 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
              <div className="font-medium">Semana {week}</div>
              <div className="text-muted-foreground">{formatCurrency(amount)}</div>
              {isPaid && <Badge variant="secondary" className="mt-1 text-[10px]">Pago</Badge>}
            </div>
          </button>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
          <span>Pago</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500/50 animate-pulse" />
          <span>Atual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-500/30" />
          <span>Atrasado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/10" />
          <span>Pendente</span>
        </div>
      </div>
    </div>
  );
}

// Growth Chart Component
function GrowthChart({ challenge }: { challenge: ChallengeWithCalculations }) {
  const chartData = useMemo(() => {
    let accumulated = 0;
    const depositHistory = (challenge.deposit_history || []) as ChallengeDeposit[];
    const paidWeeks = new Map(depositHistory.filter(d => d.status === 'paid').map(d => [d.week, d.amount]));
    
    return challenge.weeklyAmounts.map((amount, index) => {
      const week = index + 1;
      const isPaid = paidWeeks.has(week);
      if (isPaid) {
        accumulated += paidWeeks.get(week) || amount;
      }
      
      return {
        week,
        deposito: amount,
        acumulado: accumulated,
        projetado: challenge.weeklyAmounts.slice(0, week).reduce((a, b) => a + b, 0),
      };
    });
  }, [challenge]);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval={Math.floor(challenge.total_weeks / 6)}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
            width={45}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === 'acumulado' ? 'Acumulado' : name === 'projetado' ? 'Projetado' : 'Depósito'
            ]}
            labelFormatter={(week) => `Semana ${week}`}
          />
          <Area
            type="monotone"
            dataKey="projetado"
            stroke="#6366f1"
            strokeWidth={1}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorProjetado)"
          />
          <Area
            type="monotone"
            dataKey="acumulado"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAcumulado)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}


// Deposit Status Card
function DepositStatusCard({ 
  challenge,
  onMarkPaid,
  isLoading,
}: { 
  challenge: ChallengeWithCalculations;
  onMarkPaid: (week: number, amount: number) => void;
  isLoading: boolean;
}) {
  const depositHistory = (challenge.deposit_history || []) as ChallengeDeposit[];
  const paidWeeks = new Set(depositHistory.filter(d => d.status === 'paid').map(d => d.week));
  
  // Find next unpaid week
  let nextWeek = 1;
  while (paidWeeks.has(nextWeek) && nextWeek <= challenge.total_weeks) {
    nextWeek++;
  }
  
  const isCompleted = nextWeek > challenge.total_weeks;
  const nextAmount = isCompleted ? 0 : challenge.weeklyAmounts[nextWeek - 1];

  if (isCompleted) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 p-6 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
        <h3 className="text-lg font-semibold mb-1">Desafio Concluído!</h3>
        <p className="text-muted-foreground text-sm">
          Você acumulou {formatCurrency(challenge.total_deposited)}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Depósito da Semana {nextWeek}</span>
        <Badge variant="outline" className="border-blue-500/30 text-blue-400">
          <Clock className="w-3 h-3 mr-1" />
          Pendente
        </Badge>
      </div>
      
      <div className="text-center py-4">
        <span className="text-4xl font-bold font-mono tracking-tight">
          {formatCurrency(nextAmount)}
        </span>
      </div>
      
      <Button 
        className="w-full gap-2" 
        size="lg"
        onClick={() => onMarkPaid(nextWeek, nextAmount)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        Marcar como Pago
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        Faltam {challenge.weeksRemaining} semanas para completar
      </p>
    </div>
  );
}

// Challenge Card Component
function ChallengeCard({ 
  challenge,
  onMarkPaid,
  onPause,
  onDelete,
  isMarkingPaid,
}: { 
  challenge: ChallengeWithCalculations;
  onMarkPaid: (week: number, amount: number) => void;
  onPause: () => void;
  onDelete: () => void;
  isMarkingPaid: boolean;
}) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showConfirmTransaction, setShowConfirmTransaction] = useState(false);

  const handleWeekClick = (week: number) => {
    const depositHistory = (challenge.deposit_history || []) as ChallengeDeposit[];
    const isPaid = depositHistory.some(d => d.week === week && d.status === 'paid');
    
    if (!isPaid) {
      setSelectedWeek(week);
    }
  };

  const handleConfirmPayment = (createTransaction: boolean) => {
    if (selectedWeek) {
      onMarkPaid(selectedWeek, challenge.weeklyAmounts[selectedWeek - 1]);
      setSelectedWeek(null);
      setShowConfirmTransaction(false);
    }
  };

  // Progress icon fill based on percentage
  const iconFillPercent = Math.min(100, challenge.progressPercent);
  const IconComponent = getIconComponent(challenge.icon);

  return (
    <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Icon with progress fill */}
            <div className="relative w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
              <IconComponent className="w-7 h-7 text-blue-400 relative z-10" />
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500/30 to-transparent transition-all duration-500"
                style={{ height: `${iconFillPercent}%` }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{challenge.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{challenge.total_weeks} semanas</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {challenge.direction === 'standard' ? (
                    <><TrendingDown className="w-3 h-3" /> Forte no início</>
                  ) : (
                    <><TrendingUp className="w-3 h-3" /> Forte no final</>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border/50">
              <DropdownMenuItem onClick={onPause}>
                {challenge.status === 'paused' ? (
                  <><Play className="h-4 w-4 mr-2" /> Retomar</>
                ) : (
                  <><Pause className="h-4 w-4 mr-2" /> Pausar</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">{formatCurrency(challenge.total_deposited)}</p>
            <p className="text-xs text-muted-foreground">Acumulado</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">{formatCurrency(challenge.targetTotal)}</p>
            <p className="text-xs text-muted-foreground">Meta Final</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">{challenge.progressPercent.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Progresso</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${challenge.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Week Grid */}
      <div className="p-5 border-b border-border/20">
        <WeekGrid challenge={challenge} onWeekClick={handleWeekClick} />
      </div>

      {/* Growth Chart */}
      <div className="p-5 border-b border-border/20">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          Curva de Crescimento
        </h4>
        <GrowthChart challenge={challenge} />
      </div>

      {/* Deposit Status */}
      <div className="p-5">
        <DepositStatusCard 
          challenge={challenge} 
          onMarkPaid={onMarkPaid}
          isLoading={isMarkingPaid}
        />
      </div>

      {/* Countdown */}
      <div className="px-5 pb-5">
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Conclusão prevista:</span>
          </div>
          <span className="font-medium">
            {format(challenge.projectedCompletion, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Week Payment Dialog */}
      <Dialog open={selectedWeek !== null} onOpenChange={() => setSelectedWeek(null)}>
        <DialogContent className="max-w-sm border-border/50 backdrop-blur-2xl bg-background/95">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Marcar semana {selectedWeek} como paga
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 text-center">
            <p className="text-4xl font-bold font-mono">
              {selectedWeek && formatCurrency(challenge.weeklyAmounts[selectedWeek - 1])}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Semana {selectedWeek} de {challenge.total_weeks}
            </p>
          </div>

          {challenge.linked_account_id && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-sm">Lançar na conta vinculada?</span>
              <Switch 
                checked={showConfirmTransaction}
                onCheckedChange={setShowConfirmTransaction}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setSelectedWeek(null)}>
              Cancelar
            </Button>
            <Button onClick={() => handleConfirmPayment(showConfirmTransaction)}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// Create Challenge Dialog with Simulator
function CreateChallengeDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [template, setTemplate] = useState<ChallengeTemplate>('5k');
  const [title, setTitle] = useState('Desafio 5K');
  const [icon, setIcon] = useState('🎯');
  const [totalWeeks, setTotalWeeks] = useState(52);
  const [direction, setDirection] = useState<ChallengeDirection>('standard');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  
  // For custom mode only
  const [startAmount, setStartAmount] = useState(1);
  const [stepAmount, setStepAmount] = useState(1);

  // Calculate simulation based on template
  const simulation = useMemo(() => {
    if (template === 'custom') {
      const targetTotal = (totalWeeks * (startAmount + (startAmount + (totalWeeks - 1) * stepAmount))) / 2;
      const firstWeek = direction === 'standard' ? startAmount : startAmount + (totalWeeks - 1) * stepAmount;
      const lastWeek = direction === 'standard' ? startAmount + (totalWeeks - 1) * stepAmount : startAmount;
      return {
        targetTotal,
        firstWeekAmount: firstWeek,
        lastWeekAmount: lastWeek,
        weeklyAmounts: [] as number[],
        avgWeekly: targetTotal / totalWeeks,
        minWeekly: Math.min(firstWeek, lastWeek),
        maxWeekly: Math.max(firstWeek, lastWeek),
        monthlyAvg: (targetTotal / totalWeeks) * 4,
      };
    }
    
    // Template mode - calculate optimal amounts using Salary Cycle Method
    const targetAmount = CHALLENGE_TEMPLATES[template].targetAmount;
    const weeklyAmounts = calculateOptimalWeeklyAmounts(targetAmount, totalWeeks, direction);
    
    // Calculate first month breakdown for preview
    const firstMonthWeeks = weeklyAmounts.slice(0, 4);
    const monthlyAvg = targetAmount / Math.ceil(totalWeeks / 4);
    
    return {
      targetTotal: targetAmount,
      firstWeekAmount: weeklyAmounts[0],
      lastWeekAmount: weeklyAmounts[weeklyAmounts.length - 1],
      weeklyAmounts,
      avgWeekly: targetAmount / totalWeeks,
      minWeekly: Math.min(...weeklyAmounts),
      maxWeekly: Math.max(...weeklyAmounts),
      monthlyAvg,
      firstMonthWeeks,
    };
  }, [template, totalWeeks, direction, startAmount, stepAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (template === 'custom') {
      onSubmit({
        title,
        icon,
        start_amount: startAmount,
        step_amount: stepAmount,
        total_weeks: totalWeeks,
        direction,
        notification_enabled: notificationEnabled,
        challenge_type: '52_weeks',
      });
    } else {
      // Template mode - use custom_amounts
      const targetAmount = CHALLENGE_TEMPLATES[template].targetAmount;
      const weeklyAmounts = calculateOptimalWeeklyAmounts(targetAmount, totalWeeks, direction);
      
      onSubmit({
        title,
        icon,
        start_amount: weeklyAmounts[0],
        step_amount: 0,
        total_weeks: totalWeeks,
        target_amount: targetAmount,
        custom_amounts: weeklyAmounts,
        direction,
        notification_enabled: notificationEnabled,
        challenge_type: 'custom_saving',
      });
    }
  };

  // Update title and icon when template changes
  useEffect(() => {
    if (template !== 'custom') {
      setTitle(CHALLENGE_TEMPLATES[template].name);
      // Set default icon based on template
      setIcon(template === '5k' ? 'target' : template === '10k' ? 'rocket' : 'target');
    }
  }, [template]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTemplate('5k');
      setTitle('Desafio 5K');
      setIcon('target');
      setTotalWeeks(52);
      setDirection('standard');
      setNotificationEnabled(true);
      setStartAmount(1);
      setStepAmount(1);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] border-border/50 backdrop-blur-2xl bg-background/95 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Novo Desafio Financeiro
          </DialogTitle>
          <DialogDescription>
            Escolha um template ou configure manualmente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Template
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTemplate('5k')}
                className={cn(
                  "p-3 rounded-lg border transition-all text-center flex flex-col items-center",
                  template === '5k'
                    ? "bg-emerald-500/20 border-emerald-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <Target className={cn("w-6 h-6", template === '5k' ? "text-emerald-400" : "text-muted-foreground")} />
                <div className="font-semibold text-sm mt-1">5K</div>
                <div className="text-[10px] text-muted-foreground">R$ 5.000</div>
              </button>
              <button
                type="button"
                onClick={() => setTemplate('10k')}
                className={cn(
                  "p-3 rounded-lg border transition-all text-center flex flex-col items-center",
                  template === '10k'
                    ? "bg-blue-500/20 border-blue-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <Rocket className={cn("w-6 h-6", template === '10k' ? "text-blue-400" : "text-muted-foreground")} />
                <div className="font-semibold text-sm mt-1">10K</div>
                <div className="text-[10px] text-muted-foreground">R$ 10.000</div>
              </button>
              <button
                type="button"
                onClick={() => setTemplate('custom')}
                className={cn(
                  "p-3 rounded-lg border transition-all text-center flex flex-col items-center",
                  template === 'custom'
                    ? "bg-violet-500/20 border-violet-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <Settings2 className={cn("w-6 h-6", template === 'custom' ? "text-violet-400" : "text-muted-foreground")} />
                <div className="font-semibold text-sm mt-1">Custom</div>
                <div className="text-[10px] text-muted-foreground">Manual</div>
              </button>
            </div>
          </div>

          {/* Title & Icon */}
          <div className="grid grid-cols-[1fr,auto] gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Nome do Desafio
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Viagem dos Sonhos"
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Ícone
              </Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="w-14 bg-white/5 border-white/10">
                  <SelectValue>
                    {(() => {
                      const IconComp = getIconComponent(icon);
                      return <IconComp className="w-5 h-5 text-blue-400" />;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="grid grid-cols-4 gap-1 p-2">
                    {CHALLENGE_ICONS.map((i) => {
                      const IconItem = i.icon;
                      return (
                        <button
                          key={i.value}
                          type="button"
                          onClick={() => setIcon(i.value)}
                          className={cn(
                            "p-2 rounded hover:bg-white/10 transition-colors flex items-center justify-center",
                            icon === i.value && "bg-white/10 ring-1 ring-blue-500/50"
                          )}
                          title={i.label}
                        >
                          <IconItem className={cn(
                            "w-5 h-5",
                            icon === i.value ? "text-blue-400" : "text-muted-foreground"
                          )} />
                        </button>
                      );
                    })}
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration - Custom slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Duração
              </Label>
              <span className="text-sm font-medium">
                {totalWeeks} semanas ({Math.round(totalWeeks / 4.33)} meses)
              </span>
            </div>
            <Slider
              value={[totalWeeks]}
              onValueChange={([v]) => setTotalWeeks(v)}
              min={12}
              max={156}
              step={4}
              className="py-2"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>3 meses</span>
              <span>1 ano</span>
              <span>2 anos</span>
              <span>3 anos</span>
            </div>
          </div>

          {/* Custom mode parameters */}
          {template === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Valor Inicial (R$)
                </Label>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={startAmount}
                  onChange={(e) => setStartAmount(parseFloat(e.target.value) || 1)}
                  className="bg-white/5 border-white/10 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Incremento (R$)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={stepAmount}
                  onChange={(e) => setStepAmount(parseFloat(e.target.value) || 0)}
                  className="bg-white/5 border-white/10 font-mono"
                />
              </div>
            </div>
          )}

          {/* Direction Toggle - Salary Cycle Method */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Ciclo de Aportes
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('standard')}
                className={cn(
                  "py-2 px-3 rounded-lg border transition-all flex items-center gap-2",
                  direction === 'standard'
                    ? "bg-blue-500/20 border-blue-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <TrendingDown className={cn(
                  "w-4 h-4",
                  direction === 'standard' ? "text-blue-400" : "text-muted-foreground"
                )} />
                <div className="text-left">
                  <div className="font-medium text-sm">Forte no início</div>
                  <div className="text-[10px] text-muted-foreground">40% → 30% → 20% → 10%</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDirection('inverse')}
                className={cn(
                  "py-2 px-3 rounded-lg border transition-all flex items-center gap-2",
                  direction === 'inverse'
                    ? "bg-violet-500/20 border-violet-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <TrendingUp className={cn(
                  "w-4 h-4",
                  direction === 'inverse' ? "text-violet-400" : "text-muted-foreground"
                )} />
                <div className="text-left">
                  <div className="font-medium text-sm">Forte no final</div>
                  <div className="text-[10px] text-muted-foreground">10% → 20% → 30% → 40%</div>
                </div>
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              {notificationEnabled ? (
                <Bell className="w-4 h-4 text-blue-400" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
              <div className="text-sm font-medium">Lembretes Semanais</div>
            </div>
            <Switch
              checked={notificationEnabled}
              onCheckedChange={setNotificationEnabled}
            />
          </div>

          {/* Simulation Preview */}
          <div className={cn(
            "rounded-xl border p-4",
            template === '5k' && "bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20",
            template === '10k' && "bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20",
            template === 'custom' && "bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-violet-500/20",
          )}>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Simulação
            </h4>
            
            {/* Template mode - show monthly breakdown */}
            {template !== 'custom' && simulation.firstMonthWeeks && (
              <div className="mb-3">
                <p className="text-[10px] text-muted-foreground mb-2">Primeiro mês (exemplo)</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {simulation.firstMonthWeeks.map((amount, i) => (
                    <div key={i} className="text-center p-1.5 rounded bg-white/5">
                      <p className="text-[9px] text-muted-foreground">Sem {i + 1}</p>
                      <p className="text-xs font-bold font-mono">{formatCurrency(amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Mín/semana</p>
                <p className="text-base font-bold font-mono">
                  {formatCurrency(simulation.minWeekly)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Média/mês</p>
                <p className="text-base font-bold font-mono">
                  {formatCurrency(simulation.monthlyAvg)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Máx/semana</p>
                <p className="text-base font-bold font-mono">
                  {formatCurrency(simulation.maxWeekly)}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <p className="text-[10px] text-muted-foreground mb-0.5">Meta Final</p>
              <p className="text-2xl font-bold font-mono">
                {formatCurrency(simulation.targetTotal)}
              </p>
              {template !== 'custom' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Método Ciclo Salarial: aportes maiores após receber
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 flex-shrink-0 sticky bottom-0 bg-background/95 pb-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Criar Desafio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Empty State
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border/30 bg-white/5">
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <Wallet className="w-10 h-10 text-blue-400" />
          </div>
          <Sparkles className="w-5 h-5 text-cyan-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Desafio das 52 Semanas</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Economize de forma progressiva e alcance seus objetivos financeiros com disciplina e consistência.
        </p>
        <Button onClick={onCreateClick} size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          Iniciar Desafio
        </Button>
      </div>
    </div>
  );
}

// Main Module Component
export function FinancialChallengeModule() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  
  const {
    challenges,
    isLoading,
    createChallenge,
    markWeekPaid,
    togglePause,
    deleteChallenge,
    isCreating,
    isMarkingPaid,
  } = useFinancialChallenges();

  const activeChallenges = challenges.filter(c => c.status !== 'cancelled');

  const handleCreate = (data: any) => {
    createChallenge(data, {
      onSuccess: () => {
        toast({ title: "Desafio criado!", description: "Boa sorte com sua jornada de poupança!" });
        setIsCreateOpen(false);
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao criar desafio", variant: "destructive" });
      },
    });
  };

  const handleMarkPaid = (challengeId: string) => (week: number, amount: number) => {
    markWeekPaid({ id: challengeId, week, amount }, {
      onSuccess: () => {
        toast({ title: "Depósito registrado!", description: `Semana ${week} marcada como paga.` });
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao registrar depósito", variant: "destructive" });
      },
    });
  };

  const handlePause = (challenge: ChallengeWithCalculations) => {
    togglePause({ id: challenge.id, currentStatus: challenge.status }, {
      onSuccess: () => {
        toast({ 
          title: challenge.status === 'paused' ? "Desafio retomado!" : "Desafio pausado",
        });
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteChallenge(id, {
      onSuccess: () => {
        toast({ title: "Desafio excluído" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-500" />
            Desafio Financeiro
          </h2>
          <p className="text-sm text-muted-foreground">
            Economize de forma progressiva com o método das 52 semanas
          </p>
        </div>
        {activeChallenges.length > 0 && (
          <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Desafio
          </Button>
        )}
      </div>

      {/* Content */}
      {activeChallenges.length === 0 ? (
        <EmptyState onCreateClick={() => setIsCreateOpen(true)} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {activeChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onMarkPaid={handleMarkPaid(challenge.id)}
              onPause={() => handlePause(challenge)}
              onDelete={() => handleDelete(challenge.id)}
              isMarkingPaid={isMarkingPaid}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateChallengeDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        isLoading={isCreating}
      />
    </div>
  );
}

export default FinancialChallengeModule;
