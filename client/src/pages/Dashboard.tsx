import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useSupabaseTasks } from "@/hooks/use-supabase-tasks";
import { useSupabaseHabits } from "@/hooks/use-supabase-habits";
import { useUserSettings } from "@/hooks/use-user-settings";
import { 
  CheckCircle2, Circle, CalendarDays, ArrowRight, Target, Upload, 
  Play, Pause, RotateCcw, Sparkles, Clock, Flame, Plus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect, useMemo, useCallback } from "react";
import StatementImport from "@/components/finance/StatementImport";
import { FloatingHeader } from "@/components/FloatingHeader";

// ============================================
// TIPOS E CONSTANTES
// ============================================

interface GreetingData {
  greeting: string;
  message: string;
  motivation: string;
}

const GREETINGS = {
  morning: [
    "Prepare-se para vencer",
    "O dia está apenas começando", 
    "Foco total hoje",
    "Energia renovada para conquistar",
    "Cada manhã é uma nova chance"
  ],
  afternoon: [
    "Mantenha a energia",
    "Você está no caminho certo",
    "Metas em foco",
    "Continue firme",
    "A tarde é sua aliada"
  ],
  evening: [
    "Reflexão e preparo",
    "Dia produtivo?",
    "Planeje o amanhã",
    "Momento de avaliar",
    "Descanse com propósito"
  ],
  night: [
    "Hora de recarregar",
    "Amanhã será incrível",
    "Durma bem, conquiste mais",
    "O descanso é parte do sucesso"
  ]
};

const MOTIVATIONS = {
  weekday: [
    "A consistência é o que separa o plano do resultado.",
    "Pequenos passos diários constroem grandes conquistas.",
    "Disciplina é liberdade disfarçada.",
    "Seu futuro eu agradece suas escolhas de hoje.",
    "Foco no processo, os resultados virão."
  ],
  weekend: [
    "Equilíbrio é a chave do sucesso sustentável.",
    "Aproveite para recarregar e planejar.",
    "Visão de longo prazo, ação no presente.",
    "Descanso estratégico também é produtividade.",
    "Use esse tempo para refletir e ajustar."
  ]
};

const DAYS_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function getWeekOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil((diff / oneWeek) + 1);
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getGreetingData(hour: number, dayOfWeek: number, name: string): GreetingData {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayName = DAYS_PT[dayOfWeek];
  
  let greeting: string;
  let periodMessages: string[];
  
  if (hour >= 5 && hour < 12) {
    greeting = "Bom dia";
    periodMessages = GREETINGS.morning;
  } else if (hour >= 12 && hour < 18) {
    greeting = "Boa tarde";
    periodMessages = GREETINGS.afternoon;
  } else if (hour >= 18 && hour < 22) {
    greeting = "Boa noite";
    periodMessages = GREETINGS.evening;
  } else {
    greeting = "Boa noite";
    periodMessages = GREETINGS.night;
  }
  
  const message = getRandomItem(periodMessages);
  const motivations = isWeekend ? MOTIVATIONS.weekend : MOTIVATIONS.weekday;
  const motivation = `Hoje é ${dayName}. ${getRandomItem(motivations)}`;
  
  return { greeting: `${greeting}, ${name}.`, message, motivation };
}

// ============================================
// COMPONENTES
// ============================================

// Animação stagger para os cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

// Card base com glassmorphism
function BentoCard({ 
  children, 
  className = "", 
  span = "1",
  onClick
}: { 
  children: React.ReactNode; 
  className?: string;
  span?: "1" | "2" | "3" | "full";
  onClick?: () => void;
}) {
  const spanClasses = {
    "1": "",
    "2": "md:col-span-2",
    "3": "lg:col-span-3",
    "full": "col-span-full"
  };
  
  return (
    <motion.div
      variants={itemVariants}
      className={`
        relative overflow-hidden rounded-3xl
        bg-white/5 backdrop-blur-2xl
        border border-white/10
        ${spanClasses[span]}
        ${className}
        ${onClick ? 'cursor-pointer hover:bg-white/[0.07] transition-colors' : ''}
      `}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// Widget: Progresso do Ano (Memento Mori) - Full Width Horizontal
function YearProgressWidget() {
  const currentWeek = getWeekOfYear(new Date());
  const totalWeeks = 52;
  const progressPercent = Math.round((currentWeek / totalWeeks) * 100);
  
  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 p-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Info lado esquerdo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="size-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Clock className="size-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                2026
              </span>
              <span className="text-xs font-mono text-primary font-semibold">
                {currentWeek}/52
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 hidden sm:block">
              {progressPercent}% do ano
            </p>
          </div>
        </div>
        
        {/* Grade de semanas - horizontal */}
        <div className="flex-1 flex items-center gap-[3px] sm:gap-1">
          {Array.from({ length: totalWeeks }, (_, i) => (
            <div
              key={i}
              className={`
                flex-1 h-3 sm:h-4 rounded-[2px] sm:rounded-sm transition-all duration-300 min-w-[4px]
                ${i < currentWeek 
                  ? 'bg-primary shadow-sm shadow-primary/20' 
                  : 'bg-white/10'
                }
              `}
              title={`Semana ${i + 1}`}
            />
          ))}
        </div>
        
        {/* Legenda lado direito */}
        <p className="text-[10px] text-muted-foreground/50 italic shrink-0 hidden lg:block max-w-[180px] text-right">
          O tempo é seu recurso mais escasso.
        </p>
      </div>
    </motion.div>
  );
}

// Widget: Timer Pomodoro - Full Width com descrição de tarefa
function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [focusTask, setFocusTask] = useState('');
  
  const totalTime = isBreak ? 5 * 60 : 25 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsBreak(!isBreak);
      setTimeLeft(isBreak ? 25 * 60 : 5 * 60);
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak]);
  
  const reset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  const startFocus = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
  };
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-5 sm:p-6"
    >
      {/* Glow de fundo quando ativo */}
      {isRunning && (
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-violet-500/10 animate-pulse" />
      )}
      
      <div className="relative flex flex-col lg:flex-row lg:items-center gap-5">
        {/* Lado esquerdo: Timer */}
        <div className="flex items-center gap-5 shrink-0">
          {/* Timer circular compacto */}
          <div className="relative size-20 sm:size-24">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-white/5"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${progress * 2.64} 264`}
                className={isBreak ? "text-emerald-400" : "text-violet-400"}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xl sm:text-2xl font-light tracking-tight text-foreground">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
          
          {/* Info e controles */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <Flame className="size-3.5 text-violet-400" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isBreak ? 'Pausa' : 'Foco'}
              </span>
            </div>
            
            {/* Controles */}
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg bg-white/5 hover:bg-white/10"
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg bg-white/5 hover:bg-white/10"
                onClick={reset}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Separador vertical */}
        <div className="hidden lg:block w-px h-16 bg-white/10" />
        
        {/* Lado direito: Input de tarefa */}
        <div className="flex-1 space-y-3">
          <p className="text-xs text-muted-foreground">
            {isRunning 
              ? 'Focando em:' 
              : 'No que você vai focar agora?'
            }
          </p>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={focusTask}
              onChange={(e) => setFocusTask(e.target.value)}
              placeholder="Ex: Finalizar relatório, Estudar React..."
              disabled={isRunning}
              className={`
                flex-1 h-10 px-4 rounded-xl text-sm
                bg-white/5 border border-white/10
                placeholder:text-muted-foreground/50
                focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all
              `}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && focusTask.trim()) {
                  startFocus();
                }
              }}
            />
            {!isRunning && (
              <Button
                onClick={startFocus}
                disabled={!focusTask.trim()}
                className="h-10 px-5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-50"
              >
                <Play className="size-4 mr-2" />
                Iniciar
              </Button>
            )}
          </div>
          
          {isRunning && focusTask && (
            <p className="text-sm font-medium text-foreground/90 truncate">
              "{focusTask}"
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}


// Widget: Hábitos do Dia
function HabitsWidget({ 
  habits, 
  completedToday,
  onComplete 
}: { 
  habits: any[];
  completedToday: number;
  onComplete: (habitId: number, date: string) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const displayHabits = habits.slice(0, 4);
  
  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-5 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Target className="size-4 text-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Hábitos
          </span>
        </div>
        <Link href="/app/habits">
          <span className="text-xs text-primary hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="size-3" />
          </span>
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col">
        {displayHabits.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Target className="size-10 mb-2 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">Comece um novo hábito</p>
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            {displayHabits.map(habit => {
              const isCompleted = habit.habit_logs?.some(
                (log: any) => log.date === today && log.completed
              );
              const progress = isCompleted ? 100 : 0;
              
              return (
                <div key={habit.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate flex-1 mr-2">
                      {habit.title}
                    </span>
                    <button
                      onClick={() => !isCompleted && onComplete(habit.id, today)}
                      className={`
                        size-5 rounded-full flex items-center justify-center transition-all
                        ${isCompleted 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-white/5 border border-white/20 hover:border-emerald-500/50'
                        }
                      `}
                    >
                      {isCompleted && <CheckCircle2 className="size-3" />}
                    </button>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {habits.length > 0 && (
          <div className="pt-3 mt-auto border-t border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso hoje</span>
              <span className="font-mono text-emerald-400">
                {completedToday}/{habits.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Widget: Tarefas Prioritárias
function TasksWidget({ tasks }: { tasks: any[] }) {
  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 4);
  
  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-5 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <CheckCircle2 className="size-4 text-amber-400" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tarefas
          </span>
        </div>
        <Link href="/app/tasks">
          <span className="text-xs text-primary hover:underline flex items-center gap-1">
            Ver todas <ArrowRight className="size-3" />
          </span>
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col">
        {pendingTasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="size-10 mb-2 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">Tudo em dia!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map(task => (
              <div 
                key={task.id} 
                className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <button className="mt-0.5 text-muted-foreground hover:text-primary transition-colors">
                  <Circle className="size-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {task.title}
                  </p>
                  {task.due_date && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {format(new Date(task.due_date), "d MMM", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Widget: Agenda do Dia
function AgendaWidget() {
  return (
    <motion.div
      variants={itemVariants}
      className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-5 h-full flex flex-col"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-sky-500/15 flex items-center justify-center">
              <CalendarDays className="size-4 text-sky-400" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Agenda
            </span>
          </div>
          <Link href="/app/agenda">
            <span className="text-xs text-primary hover:underline flex items-center gap-1">
              Abrir <ArrowRight className="size-3" />
            </span>
          </Link>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <CalendarDays className="size-10 mb-2 text-muted-foreground/20" />
          <p className="text-xs text-muted-foreground">Nenhum evento hoje</p>
          <Link href="/app/agenda">
            <Button variant="ghost" size="sm" className="mt-3 text-xs gap-1.5 rounded-lg">
              <Plus className="size-3" />
              Agendar
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Widget: Insight Diário (Card Grande)
function InsightWidget({ habitsCount }: { habitsCount: number }) {
  const insights = [
    "Consistência não é sobre perfeição. É sobre se recusar a desistir.",
    "Cada pequena vitória de hoje constrói o sucesso de amanhã.",
    "O segredo está em começar, mesmo quando não se sente pronto.",
    "Disciplina é escolher entre o que você quer agora e o que você mais quer.",
    "Seus hábitos definem seu destino. Escolha-os com sabedoria."
  ];
  
  const [insight] = useState(() => getRandomItem(insights));
  
  return (
    <BentoCard span="full" className="p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-blue-600/10 border-primary/20">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="size-5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
              Insight Diário
            </span>
          </div>
          <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-medium">
            "{insight}"
          </p>
          <p className="text-sm text-muted-foreground">
            Mantenha sua sequência viva completando seus hábitos diários.
          </p>
        </div>
        <div className="shrink-0">
          <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10">
            <div className="text-center">
              <span className="text-2xl font-semibold text-primary">{habitsCount}</span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                Hábitos Ativos
              </p>
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}


// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Dashboard() {
  const { user } = useSupabaseAuth();
  const { tasks } = useSupabaseTasks();
  const { habits, completedToday, completeHabit } = useSupabaseHabits();
  const { settings } = useUserSettings();
  const [importOpen, setImportOpen] = useState(false);

  const today = new Date();

  // Nome do usuário com fallbacks
  const displayName = settings.displayName || 
    user?.user_metadata?.full_name || 
    user?.email?.split('@')[0] || 
    'Usuário';

  // Saudação inteligente (memoizada para não mudar durante a sessão)
  const greetingData = useMemo(() => {
    const hour = today.getHours();
    const dayOfWeek = today.getDay();
    return getGreetingData(hour, dayOfWeek, displayName);
  }, [displayName]);

  const handleCompleteHabit = useCallback((habitId: number, date: string) => {
    completeHabit({ habitId, date });
  }, [completeHabit]);

  // Ações do header
  const headerActions = (
    <div className="flex gap-2">
      <Link href="/app/tasks">
        <Button size="sm" className="gap-2 rounded-xl">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova Tarefa</span>
        </Button>
      </Link>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => setImportOpen(true)}
        className="gap-2 rounded-xl bg-white/5 border-white/10 hover:bg-white/10"
      >
        <Upload className="size-4" />
        <span className="hidden sm:inline">Importar</span>
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header Flutuante */}
      <FloatingHeader 
        title={greetingData.greeting}
        subtitle={greetingData.message}
        actions={headerActions}
      />

      {/* Background sutil */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="px-4 sm:px-6 pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Motivação do dia */}
          <motion.div variants={itemVariants}>
            <div className="px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
              <p className="text-sm text-muted-foreground italic">
                💡 {greetingData.motivation}
              </p>
            </div>
          </motion.div>

          {/* Insight Card (Full Width) */}
          <InsightWidget habitsCount={habits?.length || 0} />

          {/* Progresso do Ano - Full Width */}
          <YearProgressWidget />

          {/* Bento Grid Principal - 3 colunas, mesma altura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
            {/* Agenda - Posição 1 */}
            <AgendaWidget />
            
            {/* Hábitos - Posição 2 */}
            <HabitsWidget 
              habits={habits || []} 
              completedToday={completedToday}
              onComplete={handleCompleteHabit}
            />
            
            {/* Tarefas - Posição 3 */}
            <TasksWidget tasks={tasks || []} />
          </div>

          {/* Widget de Foco - Full Width */}
          <PomodoroWidget />
        </motion.div>
      </div>

      {/* FAB Mobile */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform md:hidden"
        onClick={() => setImportOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        aria-label="Importar Extrato"
      >
        <Upload className="size-6" />
      </motion.button>

      <StatementImport open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
