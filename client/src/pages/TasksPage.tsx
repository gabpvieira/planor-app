import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSupabaseTasks, TaskWithProject } from "@/hooks/use-supabase-tasks";
import { useSupabaseProjects } from "@/hooks/use-supabase-projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Check, Calendar as CalendarIcon, FolderOpen, ListChecks, 
  ChevronDown, ChevronRight, Plus, Trash2, Clock, X,
  LayoutList, Kanban, Search, MoreHorizontal,
  CheckCircle2, Circle, AlertCircle, Inbox, CalendarDays,
  PanelLeftClose, PanelLeft
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { FloatingHeader } from "@/components/FloatingHeader";
import type { Subtask } from "@/types/database.types";

type Priority = 'P1' | 'P2' | 'P3' | 'P4';
type ViewMode = 'list' | 'kanban';
type FilterView = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

const PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; label: string }> = {
  P1: { color: 'text-red-500', bg: 'bg-red-500', label: 'Urgente' },
  P2: { color: 'text-blue-500', bg: 'bg-blue-500', label: 'Alta' },
  P3: { color: 'text-zinc-400', bg: 'bg-zinc-400', label: 'Normal' },
  P4: { color: 'text-zinc-600', bg: 'bg-zinc-600/50', label: 'Baixa' },
};

// Normalize legacy priority values to new P1-P4 format
function normalizePriority(priority: string | null | undefined): Priority {
  if (!priority) return 'P3';
  const p = priority.toUpperCase();
  if (p === 'P1' || p === 'HIGH') return 'P1';
  if (p === 'P2') return 'P2';
  if (p === 'P3' || p === 'MEDIUM') return 'P3';
  if (p === 'P4' || p === 'LOW') return 'P4';
  return 'P3';
}

function parseTaskInput(input: string): { title: string; priority?: Priority; dueDate?: Date; project?: string } {
  let title = input;
  let priority: Priority | undefined;
  let dueDate: Date | undefined;
  let project: string | undefined;

  const priorityMatch = input.match(/\b(P[1-4])\b/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toUpperCase() as Priority;
    title = title.replace(priorityMatch[0], '').trim();
  }

  const projectMatch = input.match(/#(\w+)/);
  if (projectMatch) {
    project = projectMatch[1];
    title = title.replace(projectMatch[0], '').trim();
  }

  if (/\bhoje\b/i.test(input)) {
    dueDate = new Date();
    title = title.replace(/\bhoje\b/i, '').trim();
  } else if (/\bamanhã\b/i.test(input)) {
    dueDate = addDays(new Date(), 1);
    title = title.replace(/\bamanhã\b/i, '').trim();
  }

  return { title: title.trim(), priority, dueDate, project };
}

type TaskSection = 'overdue' | 'today' | 'upcoming' | 'noDate';

function getTaskSection(task: TaskWithProject): TaskSection {
  if (!task.due_date) return 'noDate';
  const dueDate = new Date(task.due_date);
  if (isPast(dueDate) && !isToday(dueDate)) return 'overdue';
  if (isToday(dueDate)) return 'today';
  return 'upcoming';
}

const SECTION_CONFIG: Record<TaskSection, { label: string; icon: any; className: string }> = {
  overdue: { label: 'Atrasadas', icon: AlertCircle, className: 'text-red-500' },
  today: { label: 'Hoje', icon: CalendarDays, className: 'text-primary' },
  upcoming: { label: 'Próximos Dias', icon: CalendarIcon, className: 'text-muted-foreground' },
  noDate: { label: 'Sem Data', icon: Inbox, className: 'text-muted-foreground/60' },
};


// Task Detail Panel Component
interface TaskDetailPanelProps {
  task: TaskWithProject | null;
  onClose: () => void;
  onUpdate: (id: number, data: any) => void;
  onDelete: (id: number) => void;
  projects: any[];
}

function TaskDetailPanel({ task, onClose, onUpdate, onDelete, projects }: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(normalizePriority(task?.priority));
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.due_date ? new Date(task.due_date) : undefined);
  const [projectId, setProjectId] = useState<string | undefined>(task?.project_id || undefined);
  const [estimatedTime, setEstimatedTime] = useState<string>(task?.estimated_time?.toString() || '');
  const [subtasks, setSubtasks] = useState<Subtask[]>((task?.subtasks as Subtask[]) || []);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(normalizePriority(task.priority));
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setProjectId(task.project_id || undefined);
      setEstimatedTime(task.estimated_time?.toString() || '');
      setSubtasks((task.subtasks as Subtask[]) || []);
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    onUpdate(task.id, {
      title,
      description: description || null,
      priority,
      due_date: dueDate?.toISOString() || null,
      project_id: projectId || null,
      estimated_time: estimatedTime ? parseInt(estimatedTime) : null,
      subtasks,
    });
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const newSub: Subtask = {
      id: crypto.randomUUID(),
      title: newSubtask,
      completed: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const isCompleted = task.status === 'completed' || task.completed;

  return (
    <div className="w-80 border-l border-border/30 bg-card/50 backdrop-blur-sm flex flex-col h-full shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30 shrink-0">
        <h3 className="font-semibold text-sm">Detalhes da Tarefa</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(task.id)}>
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Status Badge */}
        {isCompleted && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-emerald-600 dark:text-emerald-400">Tarefa concluída</span>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Título</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-medium"
            placeholder="Nome da tarefa"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Adicionar descrição..."
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Priority & Due Date Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioridade</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map(p => (
                  <SelectItem key={p} value={p}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", PRIORITY_CONFIG[p].bg)} />
                      {p} - {PRIORITY_CONFIG[p].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yy") : "Sem data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Project & Time Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projeto</label>
            <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tempo Est.</label>
            <div className="relative">
              <Input
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="60"
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
            </div>
          </div>
        </div>

        {/* Subtasks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Subtarefas {subtasks.length > 0 && `(${completedSubtasks}/${subtasks.length})`}
            </label>
          </div>
          
          <div className="space-y-1">
            {subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 group py-1">
                <button onClick={() => toggleSubtask(sub.id)} className="shrink-0">
                  {sub.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/50 hover:text-primary" />
                  )}
                </button>
                <span className={cn("flex-1 text-sm", sub.completed && "line-through text-muted-foreground")}>
                  {sub.title}
                </span>
                <button 
                  onClick={() => removeSubtask(sub.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Adicionar subtarefa..."
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
            />
            <Button size="sm" variant="ghost" onClick={addSubtask} className="h-8 px-2">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      {/* Footer */}
      <div className="p-3 border-t border-border/30 shrink-0">
        <Button onClick={handleSave} className="w-full" size="sm">
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}


// Create Task Modal Component
interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  projects: any[];
  isCreating: boolean;
}

function CreateTaskModal({ isOpen, onClose, onCreate, projects, isCreating }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('P3');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();
  const [estimatedTime, setEstimatedTime] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setTitle('');
      setDescription('');
      setPriority('P3');
      setDueDate(undefined);
      setProjectId(undefined);
      setEstimatedTime('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title,
      description: description || null,
      priority,
      due_date: dueDate?.toISOString() || null,
      project_id: projectId || null,
      estimated_time: estimatedTime ? parseInt(estimatedTime) : null,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Título</label>
            <Input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map(p => (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", PRIORITY_CONFIG[p].bg)} />
                        {p} - {PRIORITY_CONFIG[p].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data de Entrega</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Projeto</label>
              <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tempo Estimado</label>
              <div className="relative">
                <Input
                  type="number"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="60"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isCreating || !title.trim()}>
              {isCreating ? "Criando..." : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


// Task Row Component
function TaskRow({ 
  task, 
  onToggle, 
  onSelect,
  isSelected,
  isCompleting 
}: { 
  task: TaskWithProject;
  onToggle: () => void;
  onSelect: () => void;
  isSelected: boolean;
  isCompleting: boolean;
}) {
  const priority = normalizePriority(task.priority);
  const isCompleted = task.status === 'completed' || task.completed;
  const subtasks = (task.subtasks || []) as Subtask[];
  const completedSubtasks = subtasks.filter(s => s.completed).length;

  const dueDateLabel = useMemo(() => {
    if (!task.due_date) return null;
    const date = new Date(task.due_date);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "d MMM", { locale: ptBR });
  }, [task.due_date]);

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-150 cursor-pointer",
        "hover:bg-muted/50",
        isSelected && "bg-primary/5 border border-primary/20",
        isCompleted && "opacity-50"
      )}
    >
      {/* Priority indicator */}
      <div className={cn("w-1 h-8 rounded-full shrink-0", PRIORITY_CONFIG[priority].bg)} />
      
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
          "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
          isCompleted 
            ? "bg-primary border-primary text-primary-foreground" 
            : "border-muted-foreground/30 hover:border-primary/50 group-hover:border-muted-foreground/50"
        )}
        disabled={isCompleting}
      >
        {isCompleted && <Check className="w-3 h-3" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate transition-all",
          isCompleted && "line-through text-muted-foreground"
        )}>
          {task.title}
        </p>
        
        {/* Metadata row */}
        <div className="flex items-center gap-3 mt-0.5">
          {dueDateLabel && (
            <span className={cn(
              "text-xs flex items-center gap-1",
              isOverdue ? "text-red-500" : "text-muted-foreground"
            )}>
              <CalendarIcon className="w-3 h-3" />
              {dueDateLabel}
            </span>
          )}
          
          {task.projects && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <FolderOpen className="w-3 h-3" />
              {task.projects.name}
            </span>
          )}
          
          {subtasks.length > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ListChecks className="w-3 h-3" />
              {completedSubtasks}/{subtasks.length}
            </span>
          )}

          {task.estimated_time && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.estimated_time}min
            </span>
          )}
        </div>
      </div>

      {/* Priority badge */}
      <span className={cn(
        "text-[10px] font-semibold px-1.5 py-0.5 rounded",
        PRIORITY_CONFIG[priority].color,
        "bg-current/10"
      )}>
        {priority}
      </span>
    </div>
  );
}

// Task Section Component
function TaskSectionComponent({ 
  section, 
  tasks, 
  onToggle, 
  onSelect,
  selectedId,
  completingId 
}: {
  section: TaskSection;
  tasks: TaskWithProject[];
  onToggle: (id: number, completed: boolean) => void;
  onSelect: (task: TaskWithProject) => void;
  selectedId: number | null;
  completingId: number | null;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const config = SECTION_CONFIG[section];
  const Icon = config.icon;

  if (tasks.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 py-2 px-2 w-full text-left hover:bg-muted/30 rounded-lg transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
        <Icon className={cn("w-4 h-4", config.className)} />
        <span className={cn("text-sm font-semibold", config.className)}>
          {config.label}
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-1">
          {tasks.length}
        </span>
      </button>
      
      {!isCollapsed && (
        <div className="space-y-1 mt-1 ml-2">
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => onToggle(task.id, !task.completed)}
              onSelect={() => onSelect(task)}
              isSelected={selectedId === task.id}
              isCompleting={completingId === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}


// Sidebar Filter Component
function SidebarFilters({
  activeFilter,
  onFilterChange,
  counts,
  isCollapsed
}: {
  activeFilter: FilterView;
  onFilterChange: (filter: FilterView) => void;
  counts: Record<FilterView, number>;
  isCollapsed: boolean;
}) {
  const filters: { key: FilterView; label: string; icon: any }[] = [
    { key: 'all', label: 'Todas', icon: Inbox },
    { key: 'today', label: 'Hoje', icon: CalendarDays },
    { key: 'upcoming', label: 'Próximas', icon: CalendarIcon },
    { key: 'overdue', label: 'Atrasadas', icon: AlertCircle },
    { key: 'completed', label: 'Concluídas', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-1">
      {filters.map(({ key, label, icon: Icon }) => (
        <Tooltip key={key} delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onFilterChange(key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                activeFilter === key 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{label}</span>
                  {counts[key] > 0 && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      activeFilter === key ? "bg-primary/20" : "bg-muted"
                    )}>
                      {counts[key]}
                    </span>
                  )}
                </>
              )}
            </button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>{label} {counts[key] > 0 && `(${counts[key]})`}</p>
            </TooltipContent>
          )}
        </Tooltip>
      ))}
    </div>
  );
}

// Quick Entry Component
function QuickEntry({ 
  onSubmit, 
  isCreating,
  projects,
  onOpenModal
}: { 
  onSubmit: (data: any) => void;
  isCreating: boolean;
  projects: any[];
  onOpenModal: () => void;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const parsed = parseTaskInput(value);
    const projectMatch = projects.find(p => 
      p.name.toLowerCase() === parsed.project?.toLowerCase()
    );

    onSubmit({
      title: parsed.title,
      priority: parsed.priority || 'P3',
      due_date: parsed.dueDate?.toISOString(),
      project_id: projectMatch?.id,
    });

    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 rounded-lg border border-transparent focus-within:border-primary/30 focus-within:bg-muted/50 transition-all">
        <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Adicionar tarefa rápida... (ex: Enviar proposta amanhã P1)"
          className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50"
          disabled={isCreating}
        />
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={onOpenModal}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="w-4 h-4 mr-1" />
          Mais
        </Button>
      </div>
    </form>
  );
}

// Priority Filter Pills
function PriorityFilter({ 
  selected, 
  onChange 
}: { 
  selected: Priority[];
  onChange: (priorities: Priority[]) => void;
}) {
  const togglePriority = (p: Priority) => {
    if (selected.includes(p)) {
      onChange(selected.filter(x => x !== p));
    } else {
      onChange([...selected, p]);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {(['P1', 'P2', 'P3', 'P4'] as Priority[]).map(p => (
        <button
          key={p}
          onClick={() => togglePriority(p)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
            selected.includes(p) 
              ? "bg-primary/10 text-primary ring-1 ring-primary/20" 
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <div className={cn("w-2 h-2 rounded-full", PRIORITY_CONFIG[p].bg)} />
          {p}
        </button>
      ))}
    </div>
  );
}

// Kanban Column
function KanbanColumn({
  title,
  tasks,
  onToggle,
  onSelect,
  selectedId,
  completingId,
  className,
  icon: Icon
}: {
  title: string;
  tasks: TaskWithProject[];
  onToggle: (id: number, completed: boolean) => void;
  onSelect: (task: TaskWithProject) => void;
  selectedId: number | null;
  completingId: number | null;
  className?: string;
  icon?: any;
}) {
  return (
    <div className={cn("flex flex-col min-w-0", className)}>
      <div className="flex items-center gap-2 mb-2 px-2 shrink-0">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
        <h3 className="text-sm font-semibold text-muted-foreground truncate">{title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 space-y-1.5 bg-muted/20 rounded-lg p-2 overflow-y-auto">
        {tasks.map(task => (
          <div key={task.id} className="bg-card rounded-lg border shadow-sm">
            <TaskRow
              task={task}
              onToggle={() => onToggle(task.id, !task.completed)}
              onSelect={() => onSelect(task)}
              isSelected={selectedId === task.id}
              isCompleting={completingId === task.id}
            />
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center mb-2">
              <Check className="w-4 h-4 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground/50">Nenhuma tarefa</p>
          </div>
        )}
      </div>
    </div>
  );
}


// Main Component
export default function TasksPage() {
  const { tasks, isLoading, createTask, toggleComplete, deleteTask, updateTask, isCreating } = useSupabaseTasks();
  const { projects } = useSupabaseProjects();
  const { toast } = useToast();
  
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterView, setFilterView] = useState<FilterView>('all');
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
      if (e.key === 'Escape') {
        setSelectedTask(null);
        setIsCreateModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter counts
  const filterCounts = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'completed' && !t.completed);
    const completed = tasks.filter(t => t.status === 'completed' || t.completed);
    const today = active.filter(t => t.due_date && isToday(new Date(t.due_date)));
    const upcoming = active.filter(t => t.due_date && !isToday(new Date(t.due_date)) && !isPast(new Date(t.due_date)));
    const overdue = active.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));

    return {
      all: active.length,
      today: today.length,
      upcoming: upcoming.length,
      overdue: overdue.length,
      completed: completed.length,
    };
  }, [tasks]);

  // Filter and organize tasks
  const { filteredTasks, sections } = useMemo(() => {
    let filtered = tasks;

    // Apply filter view
    switch (filterView) {
      case 'today':
        filtered = tasks.filter(t => t.due_date && isToday(new Date(t.due_date)) && t.status !== 'completed' && !t.completed);
        break;
      case 'upcoming':
        filtered = tasks.filter(t => t.due_date && !isToday(new Date(t.due_date)) && !isPast(new Date(t.due_date)) && t.status !== 'completed' && !t.completed);
        break;
      case 'overdue':
        filtered = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'completed' && !t.completed);
        break;
      case 'completed':
        filtered = tasks.filter(t => t.status === 'completed' || t.completed);
        break;
      default:
        filtered = tasks.filter(t => t.status !== 'completed' && !t.completed);
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply priority filter
    if (priorityFilter.length > 0) {
      filtered = filtered.filter(t => priorityFilter.includes(normalizePriority(t.priority)));
    }

    // Group by section
    const grouped: Record<TaskSection, TaskWithProject[]> = {
      overdue: [],
      today: [],
      upcoming: [],
      noDate: [],
    };

    filtered.forEach(task => {
      const section = getTaskSection(task);
      grouped[section].push(task);
    });

    // Sort each section
    Object.keys(grouped).forEach(key => {
      grouped[key as TaskSection].sort((a, b) => {
        const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 };
        const aPriority = priorityOrder[normalizePriority(a.priority)];
        const bPriority = priorityOrder[normalizePriority(b.priority)];
        if (aPriority !== bPriority) return aPriority - bPriority;
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        return 0;
      });
    });

    return { filteredTasks: filtered, sections: grouped };
  }, [tasks, filterView, priorityFilter, searchQuery]);

  const handleToggle = useCallback((id: number, completed: boolean) => {
    setCompletingId(id);
    toggleComplete({ id, completed }, {
      onSuccess: () => {
        setCompletingId(null);
        if (completed) {
          toast({ title: "✓ Tarefa concluída" });
        }
      },
      onError: () => {
        setCompletingId(null);
        toast({ title: "Erro", description: "Falha ao atualizar tarefa", variant: "destructive" });
      }
    });
  }, [toggleComplete, toast]);

  const handleDelete = useCallback((id: number) => {
    deleteTask(id, {
      onSuccess: () => {
        toast({ title: "Tarefa removida" });
        if (selectedTask?.id === id) setSelectedTask(null);
      },
      onError: () => toast({ title: "Erro", description: "Falha ao remover", variant: "destructive" })
    });
  }, [deleteTask, toast, selectedTask]);

  const handleCreate = useCallback((data: any) => {
    createTask(data, {
      onSuccess: () => toast({ title: "Tarefa criada" }),
      onError: () => toast({ title: "Erro", description: "Falha ao criar tarefa", variant: "destructive" })
    });
  }, [createTask, toast]);

  const handleUpdate = useCallback((id: number, data: any) => {
    updateTask({ id, data }, {
      onSuccess: () => {
        toast({ title: "Tarefa atualizada" });
      },
      onError: () => toast({ title: "Erro", description: "Falha ao atualizar", variant: "destructive" })
    });
  }, [updateTask, toast]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <FloatingHeader 
        title="Tarefas"
        subtitle={`${filterCounts.all} pendentes`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-7 px-2"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="h-7 px-2"
              >
                <Kanban className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova</span>
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside className={cn(
          "border-r border-border/30 flex flex-col overflow-y-auto shrink-0 transition-all duration-200",
          isSidebarCollapsed ? "w-14 p-2" : "w-56 p-3"
        )}>
          {/* Search */}
          {!isSidebarCollapsed ? (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 h-8 text-sm"
              />
            </div>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 mb-2 mx-auto">
                  <Search className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Buscar</TooltipContent>
            </Tooltip>
          )}

          {/* Filters */}
          <div className={cn(!isSidebarCollapsed && "mb-4")}>
            {!isSidebarCollapsed && (
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Visualização
              </h3>
            )}
            <SidebarFilters 
              activeFilter={filterView} 
              onFilterChange={setFilterView}
              counts={filterCounts}
              isCollapsed={isSidebarCollapsed}
            />
          </div>

          {/* Priority Filter */}
          {!isSidebarCollapsed && (
            <div className="mb-4">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Prioridade
              </h3>
              <div className="px-1">
                <PriorityFilter selected={priorityFilter} onChange={setPriorityFilter} />
              </div>
            </div>
          )}

          {/* Projects */}
          {!isSidebarCollapsed && projects.length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Projetos
              </h3>
              <div className="space-y-0.5">
                {projects.map(p => (
                  <button
                    key={p.id}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                  >
                    <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: p.color }} />
                    <span className="flex-1 text-left truncate text-xs">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Quick Entry */}
          <div className="px-4 py-3 border-b border-border/30 shrink-0">
            <QuickEntry 
              onSubmit={handleCreate} 
              isCreating={isCreating} 
              projects={projects}
              onOpenModal={() => setIsCreateModalOpen(true)}
            />
          </div>

          {/* Task List / Kanban */}
          <div className={cn(
            "flex-1 overflow-hidden p-4",
            viewMode === 'kanban' && "flex flex-col"
          )}>
            {viewMode === 'list' ? (
              <div className="max-w-3xl overflow-y-auto h-full">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-7 h-7 text-muted-foreground/30" />
                    </div>
                    <p className="text-muted-foreground text-sm">Nenhuma tarefa encontrada</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">
                      {filterView === 'all' ? 'Crie uma nova tarefa para começar' : 'Tente outro filtro'}
                    </p>
                  </div>
                ) : filterView === 'completed' ? (
                  <div className="space-y-1">
                    {filteredTasks.map(task => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={() => handleToggle(task.id, false)}
                        onSelect={() => setSelectedTask(task)}
                        isSelected={selectedTask?.id === task.id}
                        isCompleting={completingId === task.id}
                      />
                    ))}
                  </div>
                ) : (
                  (['overdue', 'today', 'upcoming', 'noDate'] as TaskSection[]).map(section => (
                    <TaskSectionComponent
                      key={section}
                      section={section}
                      tasks={sections[section]}
                      onToggle={handleToggle}
                      onSelect={setSelectedTask}
                      selectedId={selectedTask?.id || null}
                      completingId={completingId}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 h-full">
                <KanbanColumn
                  title="Atrasadas"
                  icon={AlertCircle}
                  tasks={sections.overdue}
                  onToggle={handleToggle}
                  onSelect={setSelectedTask}
                  selectedId={selectedTask?.id || null}
                  completingId={completingId}
                />
                <KanbanColumn
                  title="Hoje"
                  icon={CalendarDays}
                  tasks={sections.today}
                  onToggle={handleToggle}
                  onSelect={setSelectedTask}
                  selectedId={selectedTask?.id || null}
                  completingId={completingId}
                />
                <KanbanColumn
                  title="Próximas"
                  icon={CalendarIcon}
                  tasks={sections.upcoming}
                  onToggle={handleToggle}
                  onSelect={setSelectedTask}
                  selectedId={selectedTask?.id || null}
                  completingId={completingId}
                />
                <KanbanColumn
                  title="Sem Data"
                  icon={Inbox}
                  tasks={sections.noDate}
                  onToggle={handleToggle}
                  onSelect={setSelectedTask}
                  selectedId={selectedTask?.id || null}
                  completingId={completingId}
                />
              </div>
            )}
          </div>
        </main>

        {/* Detail Panel */}
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            projects={projects}
          />
        )}
      </div>

      {/* Create Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
        projects={projects}
        isCreating={isCreating}
      />
    </div>
  );
}
