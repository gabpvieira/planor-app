import { useState, useEffect, useMemo } from 'react';
import { useSupabaseGoals, useGoalTemplates, useGoalStats } from '@/hooks/use-supabase-goals';
import { GoalCategory, GoalWithProgress } from '@/services/goals.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Target, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Wallet,
  Heart,
  Briefcase,
  Activity,
  Sparkles,
  Archive,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Category configuration
const CATEGORIES: { value: GoalCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'financas', label: 'Finanças', icon: Wallet, color: 'emerald' },
  { value: 'pessoal', label: 'Pessoal', icon: Heart, color: 'pink' },
  { value: 'saude', label: 'Saúde', icon: Activity, color: 'cyan' },
  { value: 'carreira', label: 'Carreira', icon: Briefcase, color: 'violet' },
];

// Gauge Progress Component
function GaugeProgress({ 
  value, 
  size = 120, 
  strokeWidth = 10,
  urgencyLevel = 'normal',
  animated = true 
}: { 
  value: number; 
  size?: number; 
  strokeWidth?: number;
  urgencyLevel?: 'normal' | 'attention' | 'critical';
  animated?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI;
  const offset = circumference - (displayValue / 100) * circumference;

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayValue(value), 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, animated]);

  const getGradientColors = () => {
    if (urgencyLevel === 'critical') return ['#ef4444', '#f97316'];
    if (urgencyLevel === 'attention') return ['#f59e0b', '#eab308'];
    return ['#3b82f6', '#06b6d4'];
  };

  const [startColor, endColor] = getGradientColors();
  const gradientId = `gauge-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + 20}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted-foreground/10"
        />
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{ filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.3))' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <span className="text-2xl font-bold tabular-nums">
          {Math.round(displayValue)}%
        </span>
      </div>
    </div>
  );
}

// Milestone Dots Component
function MilestoneDots({ 
  milestones, 
  achievedMilestones 
}: { 
  milestones: { value: number; label: string }[];
  achievedMilestones: { value: number; label: string }[];
}) {
  const achievedValues = new Set(achievedMilestones.map(m => m.value));

  return (
    <div className="flex items-center gap-2">
      {milestones.map((milestone, index) => {
        const isAchieved = achievedValues.has(milestone.value);
        return (
          <div key={index} className="relative group">
            <div 
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                isAchieved 
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                  : "bg-muted-foreground/20"
              )}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border/50 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {milestone.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Countdown Badge Component
function CountdownBadge({ daysRemaining, urgencyLevel }: { daysRemaining: number | null; urgencyLevel: 'normal' | 'attention' | 'critical' }) {
  if (daysRemaining === null) return null;

  const getText = () => {
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)} dias atrasado`;
    if (daysRemaining === 0) return 'Hoje!';
    if (daysRemaining === 1) return '1 dia restante';
    return `${daysRemaining} dias restantes`;
  };

  return (
    <span className={cn(
      "text-xs flex items-center gap-1",
      urgencyLevel === 'critical' && "text-red-500",
      urgencyLevel === 'attention' && "text-amber-500",
      urgencyLevel === 'normal' && "text-muted-foreground"
    )}>
      <Clock className="w-3 h-3" />
      {getText()}
    </span>
  );
}

// Category Badge Component
function CategoryBadge({ category }: { category: GoalCategory }) {
  const config = CATEGORIES.find(c => c.value === category);
  if (!config) return null;
  const Icon = config.icon;
  
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}


// Goal Card Component - Estilo similar ao TaskRow
function GoalCard({ 
  goal, 
  onEdit, 
  onUpdateProgress, 
  onArchive, 
  onDelete 
}: { 
  goal: GoalWithProgress;
  onEdit: (goal: GoalWithProgress) => void;
  onUpdateProgress: (id: string, value: number) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [tempValue, setTempValue] = useState(goal.current_value);
  const milestones = (goal.milestones || []) as { value: number; label: string }[];

  const formatValue = (value: number, unit: string) => {
    if (unit === 'R$') {
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    }
    if (unit === '%') {
      return `${value.toLocaleString('pt-BR')}%`;
    }
    if (unit === 'kg' || unit === 'km') {
      return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${unit}`;
    }
    return `${value.toLocaleString('pt-BR')} ${unit}`;
  };

  const handleProgressUpdate = () => {
    onUpdateProgress(goal.id, tempValue);
    setIsUpdating(false);
  };

  return (
    <div className={cn(
      "group relative rounded-xl transition-all duration-200",
      "bg-card/50 backdrop-blur-sm border border-border/30",
      "hover:bg-muted/30 hover:border-border/50",
      goal.is_archived && "opacity-50"
    )}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <CategoryBadge category={goal.category} />
              <CountdownBadge daysRemaining={goal.daysRemaining} urgencyLevel={goal.urgencyLevel} />
            </div>
            <h3 className="text-base font-semibold truncate pr-4">{goal.title}</h3>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border/50">
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsUpdating(true)}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Atualizar Progresso
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onArchive(goal.id)}>
                <Archive className="h-4 w-4 mr-2" />
                {goal.is_archived ? 'Desarquivar' : 'Arquivar'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress Section */}
        <div className="flex items-center gap-6">
          <GaugeProgress 
            value={goal.progressPercent} 
            urgencyLevel={goal.urgencyLevel}
            size={100}
            strokeWidth={8}
          />
          
          <div className="flex-1 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{formatValue(goal.current_value, goal.unit)}</span>
              <span className="text-sm text-muted-foreground">
                de {formatValue(goal.target_value, goal.unit)}
              </span>
            </div>
            
            {milestones.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Marcos</span>
                <MilestoneDots 
                  milestones={milestones}
                  achievedMilestones={goal.achievedMilestones}
                />
              </div>
            )}

            {goal.nextMilestone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                Próximo: {goal.nextMilestone.label}
              </p>
            )}
          </div>
        </div>

        {/* Progress Update Section */}
        {isUpdating && (
          <div className="mt-4 pt-4 border-t border-border/30 space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Atualizar valor atual</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={tempValue}
                onChange={(e) => setTempValue(parseFloat(e.target.value) || 0)}
                className="flex-1 bg-muted/30 border-border/30"
              />
              <span className="text-sm text-muted-foreground">{goal.unit}</span>
            </div>
            <Slider
              value={[tempValue]}
              onValueChange={([v]) => setTempValue(v)}
              min={goal.start_value}
              max={goal.target_value}
              step={goal.unit === 'R$' ? 100 : 1}
              className="py-2"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleProgressUpdate}>Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsUpdating(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* Completed indicator */}
        {goal.progressPercent >= 100 && (
          <div className="absolute top-4 right-12">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        )}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border/30 bg-muted/10">
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center empty-state-bounce">
            <Target className="w-10 h-10 text-muted-foreground/60" />
          </div>
          <Sparkles className="w-5 h-5 text-primary absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Metas transformam intenção em realidade</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Defina objetivos claros, acompanhe seu progresso e celebre cada conquista no caminho.
        </p>
        <Button onClick={onCreateClick} size="lg" className="gap-2">
          <Plus className="w-4 h-4" />
          Criar primeira meta
        </Button>
      </div>
    </div>
  );
}


// Create/Edit Goal Dialog
function GoalFormDialog({ 
  open, 
  onOpenChange, 
  goal,
  onSubmit,
  isLoading
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: GoalWithProgress | null;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState(goal?.title || '');
  const [category, setCategory] = useState<GoalCategory>(goal?.category || 'pessoal');
  const [startValue, setStartValue] = useState(goal?.start_value || 0);
  const [targetValue, setTargetValue] = useState(goal?.target_value || 100);
  const [currentValue, setCurrentValue] = useState(goal?.current_value || 0);
  const [unit, setUnit] = useState(goal?.unit || '%');
  const [deadline, setDeadline] = useState<Date | undefined>(
    goal?.deadline ? new Date(goal.deadline) : undefined
  );

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setCategory(goal.category);
      setStartValue(goal.start_value);
      setTargetValue(goal.target_value);
      setCurrentValue(goal.current_value);
      setUnit(goal.unit);
      setDeadline(goal.deadline ? new Date(goal.deadline) : undefined);
    } else {
      setTitle('');
      setCategory('pessoal');
      setStartValue(0);
      setTargetValue(100);
      setCurrentValue(0);
      setUnit('%');
      setDeadline(undefined);
    }
  }, [goal, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title,
      category,
      start_value: startValue,
      target_value: targetValue,
      current_value: currentValue,
      unit,
      deadline: deadline ? format(deadline, 'yyyy-MM-dd') : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border/50">
        <DialogHeader>
          <DialogTitle>{goal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
          <DialogDescription>
            {goal ? 'Atualize os detalhes da sua meta' : 'Defina uma nova meta para acompanhar seu progresso'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Título</Label>
            <Input 
              placeholder="Ex: Juntar R$ 10.000 para viagem" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="bg-muted/30 border-border/30"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Categoria</Label>
              <Select value={category} onValueChange={(v) => {
                setCategory(v as GoalCategory);
                // Reset valores para padrão quando mudar categoria
                if (v !== 'financas') {
                  setUnit('%');
                  setStartValue(0);
                  setTargetValue(100);
                  setCurrentValue(0);
                }
              }}>
                <SelectTrigger className="bg-muted/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prazo (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted/30 border-border/30",
                      !deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-border/50" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Campos de valores - apenas para categoria Finanças */}
          {category === 'financas' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unidade</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="bg-muted/30 border-border/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R$">Reais (R$)</SelectItem>
                    <SelectItem value="%">Porcentagem (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Inicial</Label>
                  <Input 
                    type="number" 
                    value={startValue} 
                    onChange={e => setStartValue(parseFloat(e.target.value) || 0)}
                    className="bg-muted/30 border-border/30"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor Atual</Label>
                  <Input 
                    type="number" 
                    value={currentValue} 
                    onChange={e => setCurrentValue(parseFloat(e.target.value) || 0)}
                    className="bg-muted/30 border-border/30"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meta</Label>
                  <Input 
                    type="number" 
                    value={targetValue} 
                    onChange={e => setTargetValue(parseFloat(e.target.value) || 0)}
                    className="bg-muted/30 border-border/30"
                    placeholder="10000"
                  />
                </div>
              </div>
            </>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : goal ? 'Salvar' : 'Criar Meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Templates Dialog
function TemplatesDialog({ 
  open, 
  onOpenChange,
  onSelectTemplate
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateId: string) => void;
}) {
  const { templates, isLoading } = useGoalTemplates();

  const getIcon = (iconName: string | null) => {
    switch (iconName) {
      case 'heart': return Heart;
      case 'home': return Target;
      case 'map-pin': return Target;
      case 'scale': return Activity;
      case 'piggy-bank': return Wallet;
      case 'briefcase': return Briefcase;
      default: return Target;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Templates de Metas
          </DialogTitle>
          <DialogDescription>
            Escolha um template para começar rapidamente com marcos pré-definidos
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {templates.map(template => {
              const Icon = getIcon(template.icon);
              const categoryConfig = CATEGORIES.find(c => c.value === template.category);
              
              return (
                <div 
                  key={template.id}
                  className="cursor-pointer rounded-lg border border-border/30 bg-muted/10 p-4 hover:bg-muted/30 hover:border-primary/30 transition-all"
                  onClick={() => onSelectTemplate(template.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{template.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-xs bg-muted/50 border-0">
                        {categoryConfig?.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


// Stats Overview Component
function StatsOverview() {
  const { stats, isLoading } = useGoalStats();

  if (isLoading || stats.total === 0) return null;

  const items = [
    { label: 'Total', value: stats.total, icon: Target, color: 'text-primary' },
    { label: 'Concluídas', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Em Progresso', value: stats.inProgress, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Atenção', value: stats.critical + stats.attention, icon: AlertCircle, color: 'text-amber-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {items.map((item, index) => (
        <div key={index} className="rounded-lg bg-muted/20 border border-border/20 p-4 flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-muted/30", item.color)}>
            <item.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Page Component
export default function GoalsPage() {
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | 'all'>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  
  const { toast } = useToast();
  const { 
    goals, 
    isLoading, 
    createGoal, 
    updateGoal, 
    updateProgress,
    archiveGoal,
    unarchiveGoal,
    deleteGoal,
    isCreating,
    isUpdating 
  } = useSupabaseGoals(
    selectedCategory === 'all' ? undefined : selectedCategory,
    showArchived
  );
  
  const { createFromTemplate } = useGoalTemplates();

  const filteredGoals = useMemo(() => {
    if (selectedCategory === 'all') return goals;
    return goals.filter(g => g.category === selectedCategory);
  }, [goals, selectedCategory]);

  const handleCreateGoal = (data: any) => {
    createGoal(data, {
      onSuccess: () => {
        toast({ title: "Meta criada!", description: "Boa sorte com sua nova meta!" });
        setIsCreateOpen(false);
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao criar meta", variant: "destructive" });
      }
    });
  };

  const handleUpdateGoal = (data: any) => {
    if (!editingGoal) return;
    updateGoal({ id: editingGoal.id, data }, {
      onSuccess: () => {
        toast({ title: "Meta atualizada!" });
        setEditingGoal(null);
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao atualizar meta", variant: "destructive" });
      }
    });
  };

  const handleUpdateProgress = (id: string, value: number) => {
    updateProgress({ id, currentValue: value }, {
      onSuccess: () => {
        toast({ title: "Progresso atualizado!" });
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao atualizar progresso", variant: "destructive" });
      }
    });
  };

  const handleArchive = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (goal?.is_archived) {
      unarchiveGoal(id, {
        onSuccess: () => toast({ title: "Meta desarquivada!" }),
      });
    } else {
      archiveGoal(id, {
        onSuccess: () => toast({ title: "Meta arquivada!" }),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteGoal(id, {
      onSuccess: () => toast({ title: "Meta excluída!" }),
      onError: () => toast({ title: "Erro", description: "Falha ao excluir meta", variant: "destructive" }),
    });
  };

  const handleSelectTemplate = (templateId: string) => {
    createFromTemplate({ templateId }, {
      onSuccess: () => {
        toast({ title: "Meta criada a partir do template!" });
        setIsTemplatesOpen(false);
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao criar meta", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-6 pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Metas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhe seu progresso e conquiste seus objetivos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsTemplatesOpen(true)} className="border-border/30">
              <Sparkles className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview />

        {/* Category Filters */}
        <div className="flex items-center justify-between mb-4">
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as GoalCategory | 'all')}>
            <TabsList className="bg-muted/30 border border-border/20">
              <TabsTrigger value="all" className="gap-1.5 data-[state=active]:bg-background">
                <Target className="w-4 h-4" />
                Todas
              </TabsTrigger>
              {CATEGORIES.map(cat => (
                <TabsTrigger key={cat.value} value={cat.value} className="gap-1.5 data-[state=active]:bg-background">
                  <cat.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={cn(showArchived && "text-primary")}
          >
            <Archive className="w-4 h-4 mr-1" />
            {showArchived ? 'Ocultar arquivadas' : 'Ver arquivadas'}
          </Button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="flex-1 overflow-y-auto p-6 pt-2">
        {filteredGoals.length === 0 ? (
          <EmptyState onCreateClick={() => setIsCreateOpen(true)} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGoals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={setEditingGoal}
                onUpdateProgress={handleUpdateProgress}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <GoalFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateGoal}
        isLoading={isCreating}
      />

      <GoalFormDialog
        open={!!editingGoal}
        onOpenChange={(open) => !open && setEditingGoal(null)}
        goal={editingGoal}
        onSubmit={handleUpdateGoal}
        isLoading={isUpdating}
      />

      <TemplatesDialog
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
