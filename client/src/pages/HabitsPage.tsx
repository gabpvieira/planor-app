import { useState, useMemo } from 'react';
import { useSupabaseHabits } from '@/hooks/use-supabase-habits';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Loader2, Plus, Target, Flame, Sun, Sunset, Moon, 
  TrendingUp, Calendar, Trash2, MoreHorizontal, History,
  Dumbbell, BookOpen, Droplets, Heart, Brain, Coffee, 
  Salad, Pill, Footprints, Bike, Music, Pencil, Code,
  Leaf, Zap, Star, Sparkles, Clock, CheckCircle, Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HABIT_COLORS, HABIT_ICONS, HabitWithLogs } from '@/services/habits.service';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getBrasiliaDateString } from '@shared/utils/timezone';
import { FloatingHeader } from '@/components/FloatingHeader';

// Mapeamento de ícones
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Dumbbell, BookOpen, Droplets, Moon, Sun, Heart, Brain, Coffee, Salad, Pill,
  Footprints, Bike, Music, Pencil, Code, Leaf, Zap, Target, Trophy, Star,
  Flame, Clock, Calendar, CheckCircle, Sparkles,
};

// Componente de Progresso Circular
function CircularProgress({ 
  progress, 
  color, 
  size = 120,
  strokeWidth = 8,
  children 
}: { 
  progress: number; 
  color: string; 
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke={color}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            filter: progress === 100 ? `drop-shadow(0 0 6px ${color})` : 'none',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// Mini calendário semanal
function WeeklyMiniCalendar({ habit }: { habit: HabitWithLogs }) {
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const isCompleted = habit.habit_logs?.some(
        (log) => log.date === dateStr && log.completed
      );
      const isToday = i === 0;
      
      result.push({
        day: dayNames[date.getDay()],
        date: dateStr,
        isCompleted,
        isToday,
      });
    }
    return result;
  }, [habit.habit_logs]);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-3">
      {days.map((day, idx) => (
        <TooltipProvider key={idx}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-muted-foreground font-medium">
                  {day.day}
                </span>
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-200",
                    day.isCompleted 
                      ? "scale-100" 
                      : "bg-muted/40 scale-75",
                    day.isToday && !day.isCompleted && "ring-1 ring-primary/50"
                  )}
                  style={{
                    backgroundColor: day.isCompleted ? habit.color_hex || '#3B82F6' : undefined,
                    boxShadow: day.isCompleted ? `0 0 4px ${habit.color_hex || '#3B82F6'}40` : undefined,
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {day.isToday ? 'Hoje' : new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

// Card de Hábito Premium
function HabitCard({ 
  habit, 
  onComplete, 
  onDelete,
  isCompleting 
}: { 
  habit: HabitWithLogs;
  onComplete: () => void;
  onDelete: () => void;
  isCompleting: boolean;
}) {
  const today = getBrasiliaDateString();
  const isCompletedToday = habit.habit_logs?.some(
    (log) => log.date === today && log.completed
  );
  
  const IconComponent = iconMap[habit.icon_name || 'Target'] || Target;
  const color = habit.color_hex || '#3B82F6';
  const progress = isCompletedToday ? 100 : 0;
  const hasStreak = (habit.current_streak || 0) >= 2;
  const isHotStreak = (habit.current_streak || 0) >= 7;

  return (
    <div 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 cursor-pointer rounded-xl",
        "border border-border/40 bg-card/50 backdrop-blur-sm",
        "hover:shadow-lg hover:scale-[1.02] hover:border-border/60 active:scale-[0.98]",
        isCompletedToday && "ring-1 ring-offset-2 ring-offset-background"
      )}
      style={{
        backgroundColor: isCompletedToday ? `${color}08` : undefined,
        borderColor: isCompletedToday ? `${color}30` : undefined,
        // @ts-ignore
        '--tw-ring-color': isCompletedToday ? `${color}40` : undefined,
      }}
      onClick={() => !isCompletedToday && !isCompleting && onComplete()}
    >
      {/* Streak Badge */}
      {hasStreak && (
        <div 
          className={cn(
            "absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold",
            isHotStreak ? "animate-pulse" : ""
          )}
          style={{
            backgroundColor: `${color}20`,
            color: color,
            boxShadow: isHotStreak ? `0 0 12px ${color}40` : undefined,
          }}
        >
          <Flame className="w-3 h-3" />
          <span>{habit.current_streak}</span>
        </div>
      )}

      {/* Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="p-4 flex flex-col items-center">
        {/* Progresso Circular com Ícone */}
        <CircularProgress progress={progress} color={color} size={100} strokeWidth={6}>
          <div 
            className={cn(
              "rounded-full p-3 transition-all duration-300",
              isCompletedToday ? "scale-110" : "group-hover:scale-105"
            )}
            style={{
              backgroundColor: `${color}15`,
            }}
          >
            <IconComponent 
              className="w-8 h-8 transition-colors duration-300"
              style={{ color }}
            />
          </div>
        </CircularProgress>

        {/* Nome do Hábito */}
        <h3 className={cn(
          "mt-3 font-semibold text-center text-sm leading-tight",
          isCompletedToday && "line-through opacity-60"
        )}>
          {habit.title}
        </h3>

        {/* Mini Calendário Semanal */}
        <WeeklyMiniCalendar habit={habit} />

        {/* Status */}
        <div className="mt-3 flex items-center gap-2">
          {isCompletedToday ? (
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Concluído
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground border-border/40">
              Toque para completar
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}


// Componente da Planta que cresce
function GrowingPlant({ progress, completedToday, totalHabits }: { progress: number; completedToday: number; totalHabits: number }) {
  // Estágios da planta: semente -> broto -> pequena -> média -> grande -> florescendo
  const getPlantStage = (p: number) => {
    if (p === 0) return 'seed';
    if (p < 25) return 'sprout';
    if (p < 50) return 'small';
    if (p < 75) return 'medium';
    if (p < 100) return 'large';
    return 'blooming';
  };

  const stage = getPlantStage(progress);
  const allCompleted = totalHabits > 0 && completedToday === totalHabits;

  // SVG da planta em diferentes estágios
  const PlantSVG = () => {
    const baseColor = allCompleted ? '#10B981' : '#22C55E';
    const potColor = '#92400E';
    
    return (
      <svg viewBox="0 0 100 120" className="w-full h-full">
        {/* Vaso */}
        <path 
          d="M30 95 L35 115 L65 115 L70 95 Z" 
          fill={potColor}
          className="drop-shadow-sm"
        />
        <ellipse cx="50" cy="95" rx="22" ry="6" fill="#A16207" />
        
        {/* Terra */}
        <ellipse cx="50" cy="95" rx="18" ry="4" fill="#78350F" />
        
        {stage === 'seed' && (
          <>
            {/* Semente */}
            <ellipse cx="50" cy="92" rx="4" ry="3" fill="#A16207" />
          </>
        )}
        
        {stage === 'sprout' && (
          <>
            {/* Broto pequeno */}
            <path 
              d="M50 92 Q50 85 50 80" 
              stroke={baseColor} 
              strokeWidth="3" 
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="50" cy="78" rx="6" ry="4" fill={baseColor} transform="rotate(-20 50 78)" />
            <ellipse cx="50" cy="78" rx="6" ry="4" fill={baseColor} transform="rotate(20 50 78)" />
          </>
        )}
        
        {stage === 'small' && (
          <>
            {/* Planta pequena */}
            <path 
              d="M50 92 Q50 75 50 65" 
              stroke={baseColor} 
              strokeWidth="4" 
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="42" cy="72" rx="10" ry="5" fill={baseColor} transform="rotate(-30 42 72)" />
            <ellipse cx="58" cy="72" rx="10" ry="5" fill={baseColor} transform="rotate(30 58 72)" />
            <ellipse cx="50" cy="62" rx="8" ry="5" fill={baseColor} />
          </>
        )}
        
        {stage === 'medium' && (
          <>
            {/* Planta média */}
            <path 
              d="M50 92 Q50 65 50 50" 
              stroke={baseColor} 
              strokeWidth="5" 
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="38" cy="75" rx="12" ry="6" fill={baseColor} transform="rotate(-35 38 75)" />
            <ellipse cx="62" cy="75" rx="12" ry="6" fill={baseColor} transform="rotate(35 62 75)" />
            <ellipse cx="35" cy="58" rx="11" ry="5" fill={baseColor} transform="rotate(-25 35 58)" />
            <ellipse cx="65" cy="58" rx="11" ry="5" fill={baseColor} transform="rotate(25 65 58)" />
            <ellipse cx="50" cy="48" rx="10" ry="6" fill={baseColor} />
          </>
        )}
        
        {stage === 'large' && (
          <>
            {/* Planta grande */}
            <path 
              d="M50 92 Q50 55 50 35" 
              stroke={baseColor} 
              strokeWidth="6" 
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="35" cy="78" rx="14" ry="7" fill={baseColor} transform="rotate(-40 35 78)" />
            <ellipse cx="65" cy="78" rx="14" ry="7" fill={baseColor} transform="rotate(40 65 78)" />
            <ellipse cx="30" cy="60" rx="13" ry="6" fill={baseColor} transform="rotate(-30 30 60)" />
            <ellipse cx="70" cy="60" rx="13" ry="6" fill={baseColor} transform="rotate(30 70 60)" />
            <ellipse cx="35" cy="45" rx="12" ry="5" fill={baseColor} transform="rotate(-20 35 45)" />
            <ellipse cx="65" cy="45" rx="12" ry="5" fill={baseColor} transform="rotate(20 65 45)" />
            <ellipse cx="50" cy="32" rx="11" ry="7" fill={baseColor} />
          </>
        )}
        
        {stage === 'blooming' && (
          <>
            {/* Planta florescendo */}
            <path 
              d="M50 92 Q50 50 50 25" 
              stroke={baseColor} 
              strokeWidth="6" 
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="32" cy="80" rx="14" ry="7" fill={baseColor} transform="rotate(-45 32 80)" />
            <ellipse cx="68" cy="80" rx="14" ry="7" fill={baseColor} transform="rotate(45 68 80)" />
            <ellipse cx="28" cy="62" rx="13" ry="6" fill={baseColor} transform="rotate(-35 28 62)" />
            <ellipse cx="72" cy="62" rx="13" ry="6" fill={baseColor} transform="rotate(35 72 62)" />
            <ellipse cx="32" cy="45" rx="12" ry="5" fill={baseColor} transform="rotate(-25 32 45)" />
            <ellipse cx="68" cy="45" rx="12" ry="5" fill={baseColor} transform="rotate(25 68 45)" />
            
            {/* Flores */}
            <circle cx="50" cy="18" r="10" fill="#F472B6" className={allCompleted ? 'animate-pulse' : ''} />
            <circle cx="50" cy="18" r="5" fill="#FBBF24" />
            <circle cx="35" cy="30" r="7" fill="#A78BFA" />
            <circle cx="35" cy="30" r="3" fill="#FBBF24" />
            <circle cx="65" cy="30" r="7" fill="#F472B6" />
            <circle cx="65" cy="30" r="3" fill="#FBBF24" />
            
            {/* Brilhos quando completo */}
            {allCompleted && (
              <>
                <circle cx="25" cy="15" r="2" fill="#FBBF24" className="animate-ping" />
                <circle cx="75" cy="20" r="2" fill="#FBBF24" className="animate-ping" style={{ animationDelay: '0.5s' }} />
                <circle cx="50" cy="5" r="2" fill="#FBBF24" className="animate-ping" style={{ animationDelay: '0.25s' }} />
              </>
            )}
          </>
        )}
      </svg>
    );
  };

  const stageLabels: Record<string, string> = {
    seed: '🌱 Semente',
    sprout: '🌿 Broto',
    small: '🪴 Crescendo',
    medium: '🌳 Desenvolvendo',
    large: '🌲 Quase lá',
    blooming: '🌸 Florescendo!',
  };

  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        "w-24 h-28 transition-all duration-500",
        allCompleted && "drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
      )}>
        <PlantSVG />
      </div>
      <p className={cn(
        "text-xs font-medium mt-1 transition-colors",
        allCompleted ? "text-emerald-500" : "text-muted-foreground"
      )}>
        {stageLabels[stage]}
      </p>
    </div>
  );
}

// Barra de Progresso com Planta
function PlantProgressBar({ 
  completedToday,
  totalHabits,
  totalCompletions,
}: { 
  completedToday: number;
  totalHabits: number;
  totalCompletions: number;
}) {
  const todayProgress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
  const allCompleted = totalHabits > 0 && completedToday === totalHabits;

  return (
    <div className="mb-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-6">
          {/* Planta */}
          <GrowingPlant 
            progress={todayProgress} 
            completedToday={completedToday}
            totalHabits={totalHabits}
          />
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium">Regue sua planta</p>
                <p className="text-xs text-muted-foreground">
                  Complete seus hábitos para fazê-la crescer
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {completedToday}<span className="text-muted-foreground text-lg">/{totalHabits}</span>
                </p>
                <p className="text-xs text-muted-foreground">hábitos hoje</p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="space-y-1">
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-700 ease-out",
                    allCompleted 
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500" 
                      : "bg-gradient-to-r from-emerald-500/70 to-emerald-400/70"
                  )}
                  style={{ 
                    width: `${todayProgress}%`,
                    boxShadow: allCompleted ? '0 0 12px rgba(16, 185, 129, 0.5)' : undefined,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(todayProgress)}% completo</span>
                <span>🌱 {totalCompletions} regas totais</span>
              </div>
            </div>

            {/* Mensagem motivacional */}
            {allCompleted && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center font-medium">
                  🎉 Parabéns! Sua planta floresceu hoje!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Seção de período do dia
function TimeOfDaySection({ 
  title, 
  icon: Icon, 
  habits, 
  onComplete,
  onDelete,
  isCompleting,
}: { 
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  habits: HabitWithLogs[];
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
  isCompleting: boolean;
}) {
  if (habits.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
        <Badge variant="secondary" className="text-xs ml-auto">
          {habits.length}
        </Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onComplete={() => onComplete(habit.id)}
            onDelete={() => onDelete(habit.id)}
            isCompleting={isCompleting}
          />
        ))}
      </div>
    </div>
  );
}

// Modal de criação de hábito
function CreateHabitDialog({ 
  open, 
  onOpenChange,
  onSubmit,
  isCreating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isCreating: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [targetCount, setTargetCount] = useState('1');
  const [colorHex, setColorHex] = useState(HABIT_COLORS[0].hex);
  const [iconName, setIconName] = useState('Target');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'any'>('any');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onSubmit({
      title,
      description: description || null,
      frequency,
      target_count: parseInt(targetCount) || 1,
      color_hex: colorHex,
      icon_name: iconName,
      time_of_day: timeOfDay === 'any' ? null : timeOfDay,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setFrequency('daily');
    setTargetCount('1');
    setColorHex(HABIT_COLORS[0].hex);
    setIconName('Target');
    setTimeOfDay('any');
  };

  const SelectedIcon = iconMap[iconName] || Target;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Hábito</DialogTitle>
          <DialogDescription>
            Crie um hábito para acompanhar sua consistência
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Preview */}
          <div className="flex justify-center py-4">
            <div 
              className="p-4 rounded-2xl transition-all duration-300"
              style={{ backgroundColor: `${colorHex}15` }}
            >
              <SelectedIcon 
                className="w-12 h-12"
                style={{ color: colorHex }}
              />
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Hábito</label>
            <Input 
              placeholder="Ex: Meditar, Beber água..." 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <Input 
              placeholder="Detalhes do hábito" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
          </div>

          {/* Cores */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cor</label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full transition-all duration-200",
                    colorHex === c.hex ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
                  )}
                  style={{ 
                    backgroundColor: c.hex,
                    ringColor: c.hex,
                  }}
                  onClick={() => setColorHex(c.hex)}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Ícones */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ícone</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {HABIT_ICONS.map((icon) => {
                const IconComp = iconMap[icon];
                if (!IconComp) return null;
                return (
                  <button
                    key={icon}
                    type="button"
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200",
                      iconName === icon 
                        ? "bg-primary/10 ring-1 ring-primary" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => setIconName(icon)}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Período e Frequência */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer</SelectItem>
                  <SelectItem value="morning">🌅 Manhã</SelectItem>
                  <SelectItem value="afternoon">🌤️ Tarde</SelectItem>
                  <SelectItem value="evening">🌙 Noite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Frequência</label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as 'daily' | 'weekly')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || !title.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Hábito'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


// Heatmap de consistência
function HeatmapView({ habits }: { habits: HabitWithLogs[] }) {
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    const today = new Date();
    
    // Últimos 365 dias
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      data[dateStr] = 0;
    }

    // Contar completions por dia
    habits.forEach((habit) => {
      habit.habit_logs?.forEach((log) => {
        if (log.completed && data[log.date] !== undefined) {
          data[log.date]++;
        }
      });
    });

    return data;
  }, [habits]);

  const weeks = useMemo(() => {
    const result: { date: string; count: number }[][] = [];
    const entries = Object.entries(heatmapData);
    
    let currentWeek: { date: string; count: number }[] = [];
    entries.forEach(([date, count], idx) => {
      const dayOfWeek = new Date(date).getDay();
      
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        result.push(currentWeek);
        currentWeek = [];
      }
      
      currentWeek.push({ date, count });
      
      if (idx === entries.length - 1) {
        result.push(currentWeek);
      }
    });

    return result;
  }, [heatmapData]);

  const maxCount = Math.max(...Object.values(heatmapData), 1);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return 'bg-emerald-200 dark:bg-emerald-900';
    if (intensity <= 0.5) return 'bg-emerald-400 dark:bg-emerald-700';
    if (intensity <= 0.75) return 'bg-emerald-500 dark:bg-emerald-500';
    return 'bg-emerald-600 dark:bg-emerald-400';
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Histórico de Consistência
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Menos</span>
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
            <span>Mais</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-0.5 min-w-max">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-0.5">
                {week.map((day) => (
                  <TooltipProvider key={day.date}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className={cn(
                            "w-3 h-3 rounded-sm transition-colors",
                            getColor(day.count)
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">
                          {new Date(day.date).toLocaleDateString('pt-BR', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </p>
                        <p className="text-muted-foreground">
                          {day.count} {day.count === 1 ? 'hábito' : 'hábitos'} completados
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Estatísticas
function StatsCards({ userStats }: { userStats: any }) {
  if (!userStats) return null;

  const stats = [
    {
      label: 'Total de Completions',
      value: userStats.totalCompletions,
      icon: CheckCircle,
      color: '#10B981',
    },
    {
      label: 'Maior Sequência',
      value: userStats.maxStreak,
      icon: Flame,
      color: '#F97316',
    },
    {
      label: 'Sequências Ativas',
      value: userStats.activeStreaks,
      icon: TrendingUp,
      color: '#8B5CF6',
    },
    {
      label: 'Total de Hábitos',
      value: userStats.totalHabits,
      icon: Target,
      color: '#3B82F6',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((stat) => (
        <div 
          key={stat.label}
          className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-3"
        >
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Página Principal
export default function HabitsPage() {
  const { 
    habits, 
    habitsByTimeOfDay,
    userStats,
    isLoading, 
    createHabit, 
    deleteHabit,
    completeHabit,
    isCreating,
    isCompleting,
    completedToday,
    totalHabits,
  } = useSupabaseHabits();
  
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('habits');

  const handleCreate = (data: any) => {
    createHabit(data, {
      onSuccess: () => {
        toast({ 
          title: "Hábito criado! 🎯", 
          description: "Comece a construir sua sequência!" 
        });
        setIsCreateOpen(false);
      },
      onError: () => {
        toast({ 
          title: "Erro", 
          description: "Falha ao criar hábito", 
          variant: "destructive" 
        });
      }
    });
  };

  const handleComplete = (habitId: number) => {
    const today = getBrasiliaDateString();
    completeHabit({ habitId, date: today }, {
      onSuccess: (result: any) => {
        if (!result.alreadyCompleted) {
          toast({ 
            title: "Hábito concluído! 🔥", 
            description: result.habit.current_streak > 1 
              ? `Sequência de ${result.habit.current_streak} dias!` 
              : "Continue assim!"
          });
        }
      },
    });
  };

  const handleDelete = (habitId: number) => {
    deleteHabit(habitId, {
      onSuccess: () => {
        toast({ title: "Hábito excluído" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasTimeOfDayHabits = 
    habitsByTimeOfDay.morning.length > 0 || 
    habitsByTimeOfDay.afternoon.length > 0 || 
    habitsByTimeOfDay.evening.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <FloatingHeader 
        title="Hábitos"
        subtitle="Construa consistência, um dia de cada vez"
        actions={
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="size-4 mr-1.5" />
            <span className="hidden sm:inline">Novo Hábito</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        }
      />

      <div className="px-4 sm:px-6">
        {/* Barra de Progresso com Planta */}
        <PlantProgressBar 
          completedToday={completedToday}
          totalHabits={totalHabits}
          totalCompletions={userStats?.totalCompletions || 0}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="habits" className="gap-1.5">
              <Target className="w-4 h-4" />
              Hábitos
            </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="habits" className="mt-4">
          {habits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 bg-card/30 backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Target className="size-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum hábito cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                  Comece criando seu primeiro hábito e construa uma rotina consistente
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="size-4 mr-2" />
                  Criar Primeiro Hábito
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Hábitos por período */}
              {hasTimeOfDayHabits ? (
                <>
                  <TimeOfDaySection
                    title="Manhã"
                    icon={Sun}
                    habits={habitsByTimeOfDay.morning}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    isCompleting={isCompleting}
                  />
                  <TimeOfDaySection
                    title="Tarde"
                    icon={Sunset}
                    habits={habitsByTimeOfDay.afternoon}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    isCompleting={isCompleting}
                  />
                  <TimeOfDaySection
                    title="Noite"
                    icon={Moon}
                    habits={habitsByTimeOfDay.evening}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    isCompleting={isCompleting}
                  />
                  {habitsByTimeOfDay.unassigned.length > 0 && (
                    <TimeOfDaySection
                      title="Qualquer Momento"
                      icon={Clock}
                      habits={habitsByTimeOfDay.unassigned}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                      isCompleting={isCompleting}
                    />
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {habits.map((habit) => (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      onComplete={() => handleComplete(habit.id)}
                      onDelete={() => handleDelete(habit.id)}
                      isCompleting={isCompleting}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-6">
          <StatsCards userStats={userStats} />
          <HeatmapView habits={habits} />
        </TabsContent>
      </Tabs>

      {/* Modal de Criação */}
      <CreateHabitDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        isCreating={isCreating}
      />
      </div>
    </div>
  );
}
