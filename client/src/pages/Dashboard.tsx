import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useSupabaseTasks } from "@/hooks/use-supabase-tasks";
import { useSupabaseHabits } from "@/hooks/use-supabase-habits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, CalendarDays, ArrowRight, Target } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useSupabaseAuth();
  const { tasks } = useSupabaseTasks();
  const { habits } = useSupabaseHabits();

  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM");

  // Simple logic to filter for today's items
  const todaysTasks = tasks?.filter(t => !t.completed).slice(0, 5) || [];
  const todaysHabits = habits?.slice(0, 4) || [];

  const greeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {greeting()}, {user?.email?.split('@')[0] || 'Usuário'}.
          </h1>
          <p className="text-muted-foreground mt-1">{formattedDate} — Veja o que está acontecendo hoje.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/app/tasks">
             <Button>
                Nova Tarefa
             </Button>
          </Link>
        </div>
      </header>      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Daily Insight Card */}
        <motion.div 
          className="col-span-1 md:col-span-2 lg:col-span-3 p-6 rounded-2xl bg-gradient-to-r from-primary/90 to-blue-600 dark:from-primary/80 dark:to-blue-700 text-white shadow-lg shadow-primary/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between">
             <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                   <CalendarDays className="size-5 opacity-80" /> Insight Diário
                </h3>
                <p className="text-blue-50 dark:text-blue-100 max-w-2xl leading-relaxed">
                   "Consistência não é sobre perfeição. É sobre se recusar a desistir." 
                   Mantenha sua sequência viva hoje completando seus hábitos diários.
                </p>
             </div>
             <div className="hidden sm:block">
                <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-medium">
                   {habits?.length || 0} Hábitos Ativos
                </div>
             </div>
          </div>
        </motion.div>

        {/* Priority Tasks */}
        <Card className="premium-card h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Tarefas Prioritárias</CardTitle>
            <Link href="/app/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">
               Ver todas <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysTasks.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="size-10 mb-2 opacity-20" />
                  <p className="text-sm">Tudo em dia!</p>
               </div>
            ) : (
               todaysTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 group">
                     <button className="mt-0.5 text-muted-foreground hover:text-primary transition-colors">
                        <Circle className="size-5" />
                     </button>
                     <div className="flex-1">
                        <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{task.title}</p>
                        {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>}
                     </div>
                  </div>
               ))
            )}
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="premium-card h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Agenda</CardTitle>
            <Link href="/app/agenda" className="text-xs text-primary hover:underline flex items-center gap-1">
               Abrir calendário <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <CalendarDays className="size-10 mb-2 opacity-20" />
              <p className="text-sm">Nenhum evento agendado.</p>
            </div>
          </CardContent>
        </Card>

        {/* Habits Quick View */}
        <Card className="premium-card h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Hábitos</CardTitle>
            <Link href="/app/habits" className="text-xs text-primary hover:underline flex items-center gap-1">
               Gerenciar <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysHabits.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Target className="size-10 mb-2 opacity-20" />
                  <p className="text-sm">Comece um novo hábito hoje.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-3">
                  {todaysHabits.map(habit => (
                     <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors">
                        <span className="text-sm font-medium">{habit.title}</span>
                        <div className="flex gap-1">
                           {[1,2,3,4,5].map(d => (
                              <div key={d} className={`size-2.5 rounded-sm ${d > 3 ? "bg-muted" : "bg-green-500"}`} />
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
