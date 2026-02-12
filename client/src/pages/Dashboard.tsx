import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useSupabaseTasks } from "@/hooks/use-supabase-tasks";
import { useSupabaseHabits } from "@/hooks/use-supabase-habits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, CalendarDays, ArrowRight, Target, Upload } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import StatementImport from "@/components/finance/StatementImport";
import { PageHeader } from "@/components/PageHeader";

export default function Dashboard() {
  const { user } = useSupabaseAuth();
  const { tasks } = useSupabaseTasks();
  const { habits } = useSupabaseHabits();
  const [importOpen, setImportOpen] = useState(false);

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <PageHeader
        title={`${greeting()}, ${user?.email?.split('@')[0] || 'Usuário'}.`}
        description={`${formattedDate} — Veja o que está acontecendo hoje.`}
        actions={
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Link href="/app/tasks" className="flex-1 sm:flex-initial">
              <Button className="w-full">
                Nova Tarefa
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2 flex-1 sm:flex-initial">
              <Upload className="size-4" /> 
              <span className="hidden sm:inline">Importar Extrato</span>
              <span className="sm:hidden">Importar</span>
            </Button>
          </div>
        }
      />      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Daily Insight Card */}
        <motion.div 
          className="col-span-1 md:col-span-2 lg:col-span-3 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-primary/90 to-blue-600 dark:from-primary/80 dark:to-blue-700 text-white shadow-lg shadow-primary/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
             <div className="flex-1">
                <h3 className="font-semibold text-base sm:text-lg mb-2 flex items-center gap-2">
                   <CalendarDays className="size-4 sm:size-5 opacity-80" /> Insight Diário
                </h3>
                <p className="text-sm sm:text-base text-blue-50 dark:text-blue-100 leading-relaxed">
                   "Consistência não é sobre perfeição. É sobre se recusar a desistir." 
                   Mantenha sua sequência viva hoje completando seus hábitos diários.
                </p>
             </div>
             <div className="w-full sm:w-auto">
                <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-sm font-medium text-center">
                   {habits?.length || 0} Hábitos Ativos
                </div>
             </div>
          </div>
        </motion.div>

        {/* Priority Tasks */}
        <Card className="premium-card h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base sm:text-lg font-semibold">Tarefas Prioritárias</CardTitle>
            <Link href="/app/tasks" className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
               Ver todas <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {todaysTasks.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="size-8 sm:size-10 mb-2 opacity-20" />
                  <p className="text-xs sm:text-sm">Tudo em dia!</p>
               </div>
            ) : (
               todaysTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2 sm:gap-3 group">
                     <button className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0">
                        <Circle className="size-4 sm:size-5" />
                     </button>
                     <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium leading-none group-hover:text-primary transition-colors truncate">{task.title}</p>
                        {task.description && <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>}
                     </div>
                  </div>
               ))
            )}
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="premium-card h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base sm:text-lg font-semibold">Agenda</CardTitle>
            <Link href="/app/agenda" className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
               Abrir <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center text-muted-foreground">
              <CalendarDays className="size-8 sm:size-10 mb-2 opacity-20" />
              <p className="text-xs sm:text-sm">Nenhum evento agendado.</p>
            </div>
          </CardContent>
        </Card>

        {/* Habits Quick View */}
        <Card className="premium-card h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-base sm:text-lg font-semibold">Hábitos</CardTitle>
            <Link href="/app/habits" className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
               Gerenciar <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysHabits.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center text-muted-foreground">
                  <Target className="size-8 sm:size-10 mb-2 opacity-20" />
                  <p className="text-xs sm:text-sm">Comece um novo hábito hoje.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  {todaysHabits.map(habit => (
                     <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors">
                        <span className="text-xs sm:text-sm font-medium truncate flex-1 mr-2">{habit.title}</span>
                        <div className="flex gap-1 shrink-0">
                           {[1,2,3,4,5].map(d => (
                              <div key={d} className={`size-2 sm:size-2.5 rounded-sm ${d > 3 ? "bg-muted" : "bg-green-500"}`} />
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FAB - Importar Extrato */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform md:hidden"
        onClick={() => setImportOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        aria-label="Importar Extrato"
      >
        <Upload className="size-6" />
      </motion.button>

      <StatementImport open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
