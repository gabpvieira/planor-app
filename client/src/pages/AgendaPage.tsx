import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useSupabaseAppointments } from "@/hooks/use-supabase-appointments";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isSameDay, addDays, parse, setHours, setMinutes, differenceInMinutes, startOfDay, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Clock, Trash2, Edit3, Copy, ChevronLeft, ChevronRight, Search, Command, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type Appointment = Database['public']['Tables']['appointments']['Row'];

// NLP Parser para criação rápida de eventos
function parseNaturalLanguage(input: string, baseDate: Date): { title: string; start: Date; end: Date } | null {
  const text = input.toLowerCase().trim();
  let title = input;
  let start = new Date(baseDate);
  let end = new Date(baseDate);
  let duration = 60; // default 1 hora

  // Padrões de horário
  const timeMatch = text.match(/(?:às?\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:h|hrs?)?/i);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    start = setHours(setMinutes(start, minutes), hours);
    title = input.replace(timeMatch[0], '').trim();
  }

  // Padrões de duração
  const durationMatch = text.match(/(?:por|durante)\s*(\d+)\s*(?:h|hora|hrs?|min|minutos?)/i);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    duration = text.includes('min') ? value : value * 60;
    title = title.replace(durationMatch[0], '').trim();
  }

  // Padrões de data relativa
  if (text.includes('amanhã') || text.includes('amanha')) {
    start = addDays(start, 1);
    title = title.replace(/amanhã|amanha/gi, '').trim();
  }

  // Limpar título
  title = title.replace(/^\s*(reunião|evento|lembrete|call|meeting)\s*/i, (match) => match.trim() + ' ');
  title = title.trim() || 'Novo Evento';
  title = title.charAt(0).toUpperCase() + title.slice(1);

  end = addHours(start, duration / 60);
  return { title, start, end };
}

// Componente de hora atual
function CurrentTimeIndicator() {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const minutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: `calc(16px + ${(minutes / 1440) * 1440}px)` }}>
      <div className="flex items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50" />
        <div className="flex-1 h-[2px] bg-gradient-to-r from-blue-500 to-blue-500/0" />
      </div>
    </div>
  );
}

// Componente de Card de Evento na Timeline
interface EventCardProps {
  appointment: Appointment;
  onEdit: (apt: Appointment) => void;
  onDelete: (id: number) => void;
  onDuplicate: (apt: Appointment) => void;
  onDragStart: (apt: Appointment, e: React.MouseEvent) => void;
  onResizeStart: (apt: Appointment, e: React.MouseEvent) => void;
  isDragging: boolean;
  offsetTop?: number;
}

function EventCard({ appointment, onEdit, onDelete, onDuplicate, onDragStart, onResizeStart, isDragging, offsetTop = 0 }: EventCardProps) {
  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const durationMinutes = differenceInMinutes(endTime, startTime);
  const topPx = offsetTop + (startMinutes / 1440) * 1440;
  const heightPx = Math.max((durationMinutes / 1440) * 1440, 28);

  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 border-blue-500/50 hover:border-blue-400',
    green: 'bg-emerald-500/20 border-emerald-500/50 hover:border-emerald-400',
    purple: 'bg-purple-500/20 border-purple-500/50 hover:border-purple-400',
    orange: 'bg-orange-500/20 border-orange-500/50 hover:border-orange-400',
    red: 'bg-red-500/20 border-red-500/50 hover:border-red-400',
  };
  const colorClass = colors[appointment.color || 'blue'] || colors.blue;

  return (
    <div
      className={cn(
        "absolute left-16 right-2 rounded-lg border backdrop-blur-sm cursor-grab transition-all duration-150 group",
        colorClass,
        isDragging && "opacity-50 scale-[0.98]",
        "hover:shadow-lg hover:shadow-primary/10"
      )}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
      onMouseDown={(e) => onDragStart(appointment, e)}
    >
      <div className="p-2 h-full flex flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm truncate flex-1">{appointment.title}</span>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(appointment); }} 
              className="p-1 rounded hover:bg-white/20 dark:hover:bg-white/10">
              <Edit3 className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDuplicate(appointment); }}
              className="p-1 rounded hover:bg-white/20 dark:hover:bg-white/10">
              <Copy className="w-3 h-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(appointment.id); }}
              className="p-1 rounded hover:bg-red-500/20 text-red-400">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <span className="text-xs text-muted-foreground mt-0.5">
          {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
        </span>
      </div>
      {/* Resize handle */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-gradient-to-t from-white/20 to-transparent rounded-b-lg"
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart(appointment, e); }}
      />
    </div>
  );
}

// Command Bar Component
interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: () => void;
  onGoToDate: (date: Date) => void;
  onGoToToday: () => void;
  appointments: Appointment[];
  onSelectAppointment: (apt: Appointment) => void;
}

function CommandBar({ isOpen, onClose, onCreateEvent, onGoToDate, onGoToToday, appointments, onSelectAppointment }: CommandBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
    }
  }, [isOpen]);

  const filteredAppointments = useMemo(() => {
    if (!query) return [];
    return appointments.filter(apt => 
      apt.title.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }, [query, appointments]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && query) {
      // Tentar parsear como data
      const dateMatch = query.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : new Date().getFullYear();
        onGoToDate(new Date(year, month, day));
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-lg bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar eventos, ir para data (dd/mm)..."
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {/* Ações rápidas */}
          <div className="p-2 border-b border-border/30">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</p>
            <button onClick={() => { onCreateEvent(); onClose(); }}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Plus className="w-4 h-4 text-primary" />
              <span>Criar novo evento</span>
              <kbd className="ml-auto text-xs text-muted-foreground">C</kbd>
            </button>
            <button onClick={() => { onGoToToday(); onClose(); }}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Ir para hoje</span>
              <kbd className="ml-auto text-xs text-muted-foreground">T</kbd>
            </button>
          </div>
          {/* Resultados da busca */}
          {filteredAppointments.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Eventos</p>
              {filteredAppointments.map(apt => (
                <button key={apt.id} onClick={() => { onSelectAppointment(apt); onClose(); }}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{apt.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(apt.start_time), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini Calendar Component
interface MiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  appointments: Appointment[];
}

function MiniCalendar({ selectedDate, onSelectDate, appointments }: MiniCalendarProps) {
  const [month, setMonth] = useState(selectedDate);

  const daysWithEvents = useMemo(() => {
    return appointments.map(apt => startOfDay(new Date(apt.start_time)).getTime());
  }, [appointments]);

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">
          {format(month, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onSelectDate(date)}
        month={month}
        onMonthChange={setMonth}
        locale={ptBR}
        showOutsideDays={false}
        className="!m-0"
        classNames={{
          months: "flex flex-col",
          month: "space-y-2",
          caption: "hidden",
          caption_label: "hidden",
          nav: "hidden",
          table: "w-full border-collapse",
          head_row: "flex justify-between",
          head_cell: "text-muted-foreground text-[11px] font-medium w-8 text-center",
          row: "flex justify-between mt-1",
          cell: "relative p-0 text-center",
          day: cn(
            "h-8 w-8 p-0 font-normal text-sm rounded-lg transition-all duration-150",
            "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          ),
          day_selected: "!bg-primary text-primary-foreground hover:!bg-primary",
          day_today: "font-bold text-primary",
          day_outside: "text-muted-foreground/30",
          day_disabled: "text-muted-foreground/30",
        }}
        modifiers={{
          hasEvent: (date) => daysWithEvents.includes(startOfDay(date).getTime()),
        }}
        modifiersClassNames={{
          hasEvent: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
        }}
      />
    </div>
  );
}

// Timeline Grid Component
interface TimelineGridProps {
  selectedDate: Date;
  appointments: Appointment[];
  onEdit: (apt: Appointment) => void;
  onDelete: (id: number) => void;
  onDuplicate: (apt: Appointment) => void;
  onCreateAtTime: (hour: number) => void;
  onUpdateAppointment: (id: number, data: { start_time: string; end_time: string }) => void;
}

function TimelineGrid({ selectedDate, appointments, onEdit, onDelete, onDuplicate, onCreateAtTime, onUpdateAppointment }: TimelineGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [resizingId, setResizingId] = useState<number | null>(null);
  const dragStartY = useRef(0);
  const dragStartTime = useRef<Date | null>(null);
  const dragEndTime = useRef<Date | null>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isToday = isSameDay(selectedDate, new Date());

  const dayAppointments = useMemo(() => {
    return appointments.filter(apt => isSameDay(new Date(apt.start_time), selectedDate));
  }, [appointments, selectedDate]);

  // Scroll para hora atual ao carregar
  useEffect(() => {
    if (containerRef.current && isToday) {
      const now = new Date();
      const scrollPosition = (now.getHours() * 60 + now.getMinutes()) / 1440 * containerRef.current.scrollHeight - 200;
      containerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [selectedDate, isToday]);

  const handleDragStart = (apt: Appointment, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingId(apt.id);
    dragStartY.current = e.clientY;
    dragStartTime.current = new Date(apt.start_time);
    dragEndTime.current = new Date(apt.end_time);
  };

  const handleResizeStart = (apt: Appointment, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingId(apt.id);
    dragStartY.current = e.clientY;
    dragEndTime.current = new Date(apt.end_time);
  };

  useEffect(() => {
    if (!draggingId && !resizingId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const deltaY = e.clientY - dragStartY.current;
      const containerHeight = containerRef.current.scrollHeight;
      const deltaMinutes = Math.round((deltaY / containerHeight) * 1440 / 15) * 15;

      if (draggingId && dragStartTime.current && dragEndTime.current) {
        const apt = appointments.find(a => a.id === draggingId);
        if (!apt) return;
        const duration = differenceInMinutes(dragEndTime.current, dragStartTime.current);
        const newStart = new Date(dragStartTime.current.getTime() + deltaMinutes * 60000);
        const newEnd = new Date(newStart.getTime() + duration * 60000);
        // Preview visual seria aqui
      }

      if (resizingId && dragEndTime.current) {
        const newEnd = new Date(dragEndTime.current.getTime() + deltaMinutes * 60000);
        // Preview visual seria aqui
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const deltaY = e.clientY - dragStartY.current;
      const containerHeight = containerRef.current.scrollHeight;
      const deltaMinutes = Math.round((deltaY / containerHeight) * 1440 / 15) * 15;

      if (draggingId && dragStartTime.current && dragEndTime.current) {
        const apt = appointments.find(a => a.id === draggingId);
        if (apt && deltaMinutes !== 0) {
          const duration = differenceInMinutes(new Date(apt.end_time), new Date(apt.start_time));
          const newStart = new Date(dragStartTime.current.getTime() + deltaMinutes * 60000);
          const newEnd = new Date(newStart.getTime() + duration * 60000);
          onUpdateAppointment(apt.id, {
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
          });
        }
      }

      if (resizingId && dragEndTime.current) {
        const apt = appointments.find(a => a.id === resizingId);
        if (apt && deltaMinutes !== 0) {
          const newEnd = new Date(dragEndTime.current.getTime() + deltaMinutes * 60000);
          if (newEnd > new Date(apt.start_time)) {
            onUpdateAppointment(apt.id, {
              start_time: apt.start_time,
              end_time: newEnd.toISOString(),
            });
          }
        }
      }

      setDraggingId(null);
      setResizingId(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, resizingId, appointments, onUpdateAppointment]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto relative scrollbar-thin">
      <div className="relative pt-4" style={{ height: '1480px' }}>
        {/* Grade horária */}
        {hours.map(hour => (
          <div 
            key={hour} 
            className="absolute left-0 right-0 border-t border-border/20 group cursor-pointer"
            style={{ top: `calc(16px + ${(hour / 24) * 1440}px)`, height: '60px' }}
            onClick={() => onCreateAtTime(hour)}
          >
            <span className="absolute left-2 top-0 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-background px-1">
              {hour.toString().padStart(2, '0')}:00
            </span>
            <div className="absolute inset-0 left-16 opacity-0 group-hover:opacity-100 bg-primary/5 transition-opacity rounded-r-lg" />
          </div>
        ))}
        
        {/* Indicador de hora atual */}
        {isToday && <CurrentTimeIndicator />}
        
        {/* Eventos */}
        {dayAppointments.map(apt => (
          <EventCard
            key={apt.id}
            appointment={apt}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onDragStart={handleDragStart}
            onResizeStart={handleResizeStart}
            isDragging={draggingId === apt.id}
            offsetTop={16}
          />
        ))}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ onCreateEvent }: { onCreateEvent: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-6">
        <Calendar className="w-10 h-10 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium mb-2">Nenhum evento neste dia</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        Sua agenda está livre. Aproveite para planejar algo produtivo.
      </p>
      <Button onClick={onCreateEvent} variant="outline" className="gap-2">
        <Plus className="w-4 h-4" />
        Criar evento
        <kbd className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">C</kbd>
      </Button>
    </div>
  );
}

// Keyboard Shortcuts Hint
function ShortcutsHint() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px]">C</kbd>
        Criar
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px]">T</kbd>
        Hoje
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px]">⌘K</kbd>
        Buscar
      </span>
    </div>
  );
}

// Main Component
export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { appointments, isLoading, createAppointment, updateAppointment, deleteAppointment, isCreating } = useSupabaseAppointments();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [nlpInput, setNlpInput] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const nlpInputRef = useRef<HTMLInputElement>(null);

  const dayAppointments = useMemo(() => {
    return (appointments || []).filter(apt => isSameDay(new Date(apt.start_time), selectedDate));
  }, [appointments, selectedDate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver em input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsCreateOpen(true);
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setSelectedDate(new Date());
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCreateOpen(false);
        setIsCommandOpen(false);
        setEditingAppointment(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus NLP input when modal opens
  useEffect(() => {
    if (isCreateOpen) {
      setEventDate(selectedDate);
      setTimeout(() => nlpInputRef.current?.focus(), 100);
    }
  }, [isCreateOpen, selectedDate]);

  const handleNlpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim()) return;

    const parsed = parseNaturalLanguage(nlpInput, selectedDate);
    if (parsed) {
      createAppointment({
        title: parsed.title,
        start_time: parsed.start.toISOString(),
        end_time: parsed.end.toISOString(),
        type: "event",
        color: selectedColor,
      }, {
        onSuccess: () => {
          toast({ title: "Evento criado", description: `${parsed.title} adicionado à sua agenda.` });
          setNlpInput("");
          setIsCreateOpen(false);
          setSelectedDate(startOfDay(parsed.start));
        },
        onError: () => {
          toast({ title: "Erro", description: "Falha ao criar evento", variant: "destructive" });
        }
      });
    }
  };

  const handleManualCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const start = new Date(eventDate);
    const [startH, startM] = startTime.split(":").map(Number);
    start.setHours(startH, startM);

    const end = new Date(eventDate);
    const [endH, endM] = endTime.split(":").map(Number);
    end.setHours(endH, endM);

    createAppointment({
      title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      type: "event",
      color: selectedColor,
    }, {
      onSuccess: () => {
        toast({ title: "Evento criado", description: "Adicionado à sua agenda." });
        setTitle("");
        setIsCreateOpen(false);
        setSelectedDate(eventDate); // Navegar para a data do evento criado
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao criar evento", variant: "destructive" });
      }
    });
  };

  const handleEdit = (apt: Appointment) => {
    setEditingAppointment(apt);
    setTitle(apt.title);
    setStartTime(format(new Date(apt.start_time), 'HH:mm'));
    setEndTime(format(new Date(apt.end_time), 'HH:mm'));
    setSelectedColor(apt.color || 'blue');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment || !title) return;

    const start = new Date(editingAppointment.start_time);
    const [startH, startM] = startTime.split(":").map(Number);
    start.setHours(startH, startM);

    const end = new Date(editingAppointment.end_time);
    const [endH, endM] = endTime.split(":").map(Number);
    end.setHours(endH, endM);

    updateAppointment({ id: editingAppointment.id, data: {
      title,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      color: selectedColor,
    }}, {
      onSuccess: () => {
        toast({ title: "Evento atualizado" });
        setEditingAppointment(null);
        setTitle("");
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao atualizar", variant: "destructive" });
      }
    });
  };

  const handleDuplicate = (apt: Appointment) => {
    createAppointment({
      title: `${apt.title} (cópia)`,
      start_time: apt.start_time,
      end_time: apt.end_time,
      type: apt.type,
      color: apt.color,
      description: apt.description,
    }, {
      onSuccess: () => toast({ title: "Evento duplicado" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteAppointment(id, {
      onSuccess: () => toast({ title: "Evento excluído" }),
    });
  };

  const handleCreateAtTime = (hour: number) => {
    setStartTime(`${hour.toString().padStart(2, '0')}:00`);
    setEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
    setIsCreateOpen(true);
  };

  const handleUpdateAppointment = (id: number, data: { start_time: string; end_time: string }) => {
    updateAppointment({ id, data }, {
      onSuccess: () => toast({ title: "Evento movido" }),
    });
  };

  const colors = [
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'green', class: 'bg-emerald-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'red', class: 'bg-red-500' },
  ];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight">Agenda</h1>
          <div className="h-4 w-px bg-border/50" />
          <span className="text-sm text-muted-foreground">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ShortcutsHint />
          <div className="h-4 w-px bg-border/50" />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsCommandOpen(true)}
            className="gap-2 text-muted-foreground"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Buscar</span>
            <kbd className="hidden sm:inline text-[10px] bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-border/30 p-4 flex flex-col gap-4 overflow-y-auto">
          <MiniCalendar 
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            appointments={appointments || []}
          />
          
          {/* Próximos eventos */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Próximos eventos
            </h3>
            <div className="space-y-2">
              {(appointments || [])
                .filter(apt => new Date(apt.start_time) >= new Date())
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .slice(0, 4)
                .map(apt => (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedDate(new Date(apt.start_time))}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {apt.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(apt.start_time), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </button>
                ))}
              {(appointments || []).filter(apt => new Date(apt.start_time) >= new Date()).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum evento futuro
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Timeline */}
        <main className="flex-1 flex flex-col bg-background/50">
          {dayAppointments.length === 0 ? (
            <EmptyState onCreateEvent={() => setIsCreateOpen(true)} />
          ) : (
            <TimelineGrid
              selectedDate={selectedDate}
              appointments={appointments || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onCreateAtTime={handleCreateAtTime}
              onUpdateAppointment={handleUpdateAppointment}
            />
          )}
        </main>
      </div>

      {/* Command Bar */}
      <CommandBar
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onCreateEvent={() => setIsCreateOpen(true)}
        onGoToDate={setSelectedDate}
        onGoToToday={() => setSelectedDate(new Date())}
        appointments={appointments || []}
        onSelectAppointment={(apt) => {
          setSelectedDate(new Date(apt.start_time));
          handleEdit(apt);
        }}
      />

      {/* Create Event Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg">Novo Evento</DialogTitle>
          </DialogHeader>
          
          {/* NLP Input */}
          <form onSubmit={handleNlpSubmit} className="space-y-4">
            <div className="relative">
              <Input
                ref={nlpInputRef}
                value={nlpInput}
                onChange={e => setNlpInput(e.target.value)}
                placeholder="Ex: Reunião amanhã às 14h por 1h"
                className="pr-20 bg-muted/30 border-border/50 focus:border-primary/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                NLP
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border/30" />
              <span className="text-xs text-muted-foreground">ou preencha manualmente</span>
              <div className="flex-1 h-px bg-border/30" />
            </div>
          </form>

          {/* Manual Form */}
          <form onSubmit={handleManualCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Nome do evento"
                className="bg-muted/30 border-border/50"
              />
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted/30 border-border/50",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "EEEE, d 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DayPicker
                    mode="single"
                    selected={eventDate}
                    onSelect={(date) => date && setEventDate(date)}
                    locale={ptBR}
                    className="p-3"
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary",
                      day_today: "font-bold text-primary",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Início</label>
                <Input 
                  type="time" 
                  value={startTime} 
                  onChange={e => setStartTime(e.target.value)}
                  className="bg-muted/30 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Término</label>
                <Input 
                  type="time" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)}
                  className="bg-muted/30 border-border/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex items-center gap-2">
                {colors.map(color => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      color.class,
                      selectedColor === color.name && "ring-2 ring-offset-2 ring-offset-background ring-white/50 scale-110"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || (!title && !nlpInput)}>
                {isCreating ? "Criando..." : "Criar Evento"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Modal */}
      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg">Editar Evento</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Nome do evento"
                className="bg-muted/30 border-border/50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Início</label>
                <Input 
                  type="time" 
                  value={startTime} 
                  onChange={e => setStartTime(e.target.value)}
                  className="bg-muted/30 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Término</label>
                <Input 
                  type="time" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)}
                  className="bg-muted/30 border-border/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex items-center gap-2">
                {colors.map(color => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      color.class,
                      selectedColor === color.name && "ring-2 ring-offset-2 ring-offset-background ring-white/50 scale-110"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditingAppointment(null)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
