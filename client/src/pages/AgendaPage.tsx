import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useSupabaseAppointments } from "@/hooks/use-supabase-appointments";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, isSameDay, addDays, subDays, parse, setHours, setMinutes, differenceInMinutes, startOfDay, addHours, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Clock, Trash2, Edit3, Copy, ChevronLeft, ChevronRight, Search, Calendar, ChevronDown, X, CalendarDays, LayoutGrid, Bell, MapPin, User, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FloatingHeader } from "@/components/FloatingHeader";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import type { Database } from "@/types/database.types";

type Appointment = Database['public']['Tables']['appointments']['Row'];

// Hook para detectar mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

// Tipos de lembrete
type ReminderType = 'none' | '5m' | '15m' | '30m' | '1h' | 'at_time';

// NLP Parser estilo Todoist para criação rápida de eventos
interface ParsedEvent {
  title: string;
  start: Date;
  end: Date;
  reminder?: ReminderType;
}

function parseNaturalLanguage(input: string, baseDate: Date): ParsedEvent | null {
  if (!input.trim()) return null;
  
  let text = input.trim();
  let title = text;
  let start = new Date(baseDate);
  let end = new Date(baseDate);
  let duration = 60; // minutos
  let foundTime = false;
  let foundDate = false;

  // === PADRÕES DE DATA ===
  
  // "hoje" - define para hoje
  if (/\bhoje\b/i.test(text)) {
    start = new Date();
    foundDate = true;
    title = title.replace(/\bhoje\b/gi, '').trim();
  }
  
  // "amanhã" ou "amanha"
  if (/\bamanh[aã]\b/i.test(text)) {
    start = addDays(new Date(), 1);
    foundDate = true;
    title = title.replace(/\bamanh[aã]\b/gi, '').trim();
  }
  
  // "depois de amanhã"
  if (/\bdepois\s+de\s+amanh[aã]\b/i.test(text)) {
    start = addDays(new Date(), 2);
    foundDate = true;
    title = title.replace(/\bdepois\s+de\s+amanh[aã]\b/gi, '').trim();
  }
  
  // Dias da semana: "segunda", "terça", etc.
  const diasSemana: Record<string, number> = {
    'domingo': 0, 'dom': 0,
    'segunda': 1, 'seg': 1, 'segunda-feira': 1,
    'terça': 2, 'terca': 2, 'ter': 2, 'terça-feira': 2,
    'quarta': 3, 'qua': 3, 'quarta-feira': 3,
    'quinta': 4, 'qui': 4, 'quinta-feira': 4,
    'sexta': 5, 'sex': 5, 'sexta-feira': 5,
    'sábado': 6, 'sabado': 6, 'sab': 6,
  };
  
  for (const [dia, dayIndex] of Object.entries(diasSemana)) {
    const regex = new RegExp(`\\b${dia}\\b`, 'i');
    if (regex.test(text)) {
      const today = new Date();
      const currentDay = today.getDay();
      let daysToAdd = dayIndex - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Próxima semana se já passou
      start = addDays(today, daysToAdd);
      foundDate = true;
      title = title.replace(regex, '').trim();
      break;
    }
  }
  
  // Data específica: "15/02", "15/02/2026", "15 de fevereiro"
  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1;
    const year = dateMatch[3] ? (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3])) : new Date().getFullYear();
    start = new Date(year, month, day);
    foundDate = true;
    title = title.replace(dateMatch[0], '').trim();
  }
  
  // "15 de fevereiro", "20 de março"
  const meses: Record<string, number> = {
    'janeiro': 0, 'jan': 0, 'fevereiro': 1, 'fev': 1, 'março': 2, 'mar': 2,
    'abril': 3, 'abr': 3, 'maio': 4, 'mai': 4, 'junho': 5, 'jun': 5,
    'julho': 6, 'jul': 6, 'agosto': 7, 'ago': 7, 'setembro': 8, 'set': 8,
    'outubro': 9, 'out': 9, 'novembro': 10, 'nov': 10, 'dezembro': 11, 'dez': 11,
  };
  
  for (const [mes, monthIndex] of Object.entries(meses)) {
    const regex = new RegExp(`(\\d{1,2})\\s*(?:de\\s*)?${mes}`, 'i');
    const match = text.match(regex);
    if (match) {
      const day = parseInt(match[1]);
      start = new Date(new Date().getFullYear(), monthIndex, day);
      foundDate = true;
      title = title.replace(match[0], '').trim();
      break;
    }
  }

  // === PADRÕES DE HORÁRIO ===
  
  // Horário entre aspas: '14:00', '14h', '14:30'
  const quotedTimeMatch = text.match(/['"](\d{1,2})(?::(\d{2}))?(?:h|hrs?)?['"]/i);
  if (quotedTimeMatch) {
    const hours = parseInt(quotedTimeMatch[1]);
    const minutes = quotedTimeMatch[2] ? parseInt(quotedTimeMatch[2]) : 0;
    if (hours >= 0 && hours <= 23) {
      start = setHours(setMinutes(start, minutes), hours);
      foundTime = true;
      title = title.replace(quotedTimeMatch[0], '').trim();
    }
  }
  
  // Horário com "às": "às 14h", "às 14:30", "as 9h"
  if (!foundTime) {
    const atTimeMatch = text.match(/[àa]s?\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|hrs?)?/i);
    if (atTimeMatch) {
      const hours = parseInt(atTimeMatch[1]);
      const minutes = atTimeMatch[2] ? parseInt(atTimeMatch[2]) : 0;
      if (hours >= 0 && hours <= 23) {
        start = setHours(setMinutes(start, minutes), hours);
        foundTime = true;
        title = title.replace(atTimeMatch[0], '').trim();
      }
    }
  }
  
  // Horário simples no final: "14h", "14:30", "9h30"
  if (!foundTime) {
    const simpleTimeMatch = text.match(/\b(\d{1,2})(?::(\d{2})|h(\d{2})?)\b/i);
    if (simpleTimeMatch) {
      const hours = parseInt(simpleTimeMatch[1]);
      const minutes = simpleTimeMatch[2] ? parseInt(simpleTimeMatch[2]) : (simpleTimeMatch[3] ? parseInt(simpleTimeMatch[3]) : 0);
      if (hours >= 0 && hours <= 23) {
        start = setHours(setMinutes(start, minutes), hours);
        foundTime = true;
        title = title.replace(simpleTimeMatch[0], '').trim();
      }
    }
  }

  // === PADRÕES DE DURAÇÃO ===
  
  // "por 1h", "por 30min", "durante 2 horas"
  const durationMatch = text.match(/(?:por|durante)\s*(\d+)\s*(?:h|hora|hrs?|min|minutos?)/i);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    duration = /min/i.test(durationMatch[0]) ? value : value * 60;
    title = title.replace(durationMatch[0], '').trim();
  }

  // === LIMPEZA DO TÍTULO ===
  
  // Remove preposições soltas
  title = title.replace(/\s+(de|às|as|em|no|na|para|por)\s*$/gi, '').trim();
  title = title.replace(/^\s*(de|às|as|em|no|na|para|por)\s+/gi, '').trim();
  
  // Remove espaços múltiplos
  title = title.replace(/\s+/g, ' ').trim();
  
  // Capitaliza primeira letra
  if (title) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  } else {
    title = 'Novo Evento';
  }

  // Se não encontrou horário, define 09:00 como padrão
  if (!foundTime) {
    start = setHours(setMinutes(start, 0), 9);
  }

  // Calcula horário de término
  end = new Date(start.getTime() + duration * 60000);

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

// Date Scroller para Mobile - linha horizontal de datas
interface DateScrollerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  appointments: Appointment[];
}

function DateScroller({ selectedDate, onSelectDate, appointments }: DateScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  
  const daysWithEvents = useMemo(() => {
    return appointments.map(apt => startOfDay(new Date(apt.start_time)).getTime());
  }, [appointments]);

  // Gera 14 dias (7 antes e 7 depois da data selecionada)
  const days = useMemo(() => {
    const result = [];
    for (let i = -7; i <= 7; i++) {
      result.push(addDays(selectedDate, i));
    }
    return result;
  }, [selectedDate]);

  // Centraliza no dia selecionado
  useEffect(() => {
    if (scrollRef.current) {
      const selectedElement = scrollRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedDate]);

  return (
    <div className="bg-white/5 backdrop-blur-md border-b border-white/10">
      {/* Navegação do mês */}
      <div className="flex items-center justify-between px-4 py-2">
        <button 
          onClick={() => onSelectDate(subMonths(selectedDate, 1))}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium capitalize">
          {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button 
          onClick={() => onSelectDate(addMonths(selectedDate, 1))}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Scroll horizontal de dias */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-none gap-1 px-2 pb-3 snap-x snap-mandatory"
      >
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const hasEvent = daysWithEvents.includes(startOfDay(day).getTime());
          
          return (
            <button
              key={day.toISOString()}
              data-selected={isSelected}
              onClick={() => onSelectDate(day)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-xl transition-all snap-center",
                "bg-white/5 border border-white/10",
                isSelected && "bg-primary border-primary/50 shadow-lg shadow-primary/20",
                isToday && !isSelected && "border-primary/50",
                "active:scale-95"
              )}
            >
              <span className={cn(
                "text-[10px] uppercase font-medium",
                isSelected ? "text-primary-foreground" : "text-muted-foreground"
              )}>
                {format(day, 'EEE', { locale: ptBR })}
              </span>
              <span className={cn(
                "text-lg font-bold",
                isSelected ? "text-primary-foreground" : "text-foreground",
                isToday && !isSelected && "text-primary"
              )}>
                {format(day, 'd')}
              </span>
              {hasEvent && (
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mt-0.5",
                  isSelected ? "bg-primary-foreground" : "bg-primary"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Mini Calendar Colapsável para Mobile
interface CollapsibleMiniCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  appointments: Appointment[];
}

function CollapsibleMiniCalendar({ selectedDate, onSelectDate, appointments }: CollapsibleMiniCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(selectedDate);

  const daysWithEvents = useMemo(() => {
    return appointments.map(apt => startOfDay(new Date(apt.start_time)).getTime());
  }, [appointments]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between px-4 py-3 bg-white/5 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium capitalize">
              {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 bg-white/5 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium capitalize">
              {format(month, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button 
              onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => { date && onSelectDate(date); setIsOpen(false); }}
            month={month}
            onMonthChange={setMonth}
            locale={ptBR}
            showOutsideDays={false}
            className="!m-0"
            classNames={{
              months: "flex flex-col",
              month: "space-y-2",
              caption: "hidden",
              nav: "hidden",
              table: "w-full border-collapse",
              head_row: "flex justify-between",
              head_cell: "text-muted-foreground text-[11px] font-medium w-10 text-center",
              row: "flex justify-between mt-1",
              cell: "relative p-0 text-center",
              day: cn(
                "h-10 w-10 p-0 font-normal text-sm rounded-lg transition-all duration-150",
                "hover:bg-white/10 focus:outline-none active:scale-95"
              ),
              day_selected: "!bg-primary text-primary-foreground",
              day_today: "font-bold text-primary",
              day_outside: "text-muted-foreground/30",
            }}
            modifiers={{
              hasEvent: (date) => daysWithEvents.includes(startOfDay(date).getTime()),
            }}
            modifiersClassNames={{
              hasEvent: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full",
            }}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Event Card para Desktop - Design Melhorado
interface EventCardProps {
  appointment: Appointment;
  onEdit: (apt: Appointment) => void;
  onDelete: (id: number) => void;
  onDuplicate: (apt: Appointment) => void;
  onDragStart: (apt: Appointment, e: React.MouseEvent) => void;
  onResizeStart: (apt: Appointment, e: React.MouseEvent) => void;
  isDragging: boolean;
  offsetTop?: number;
  onViewDetails: (apt: Appointment) => void;
}

function EventCard({ appointment, onEdit, onDelete, onDuplicate, onDragStart, onResizeStart, isDragging, offsetTop = 0, onViewDetails }: EventCardProps) {
  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const durationMinutes = differenceInMinutes(endTime, startTime);
  const topPx = offsetTop + (startMinutes / 1440) * 1440;
  const heightPx = Math.max((durationMinutes / 1440) * 1440, 32);
  const isCompact = heightPx < 50;

  // Cores com gradiente sutil
  const colorStyles: Record<string, { bg: string; border: string; accent: string; glow: string }> = {
    blue: { 
      bg: 'bg-gradient-to-br from-blue-500/25 to-blue-600/15', 
      border: 'border-blue-500/40 hover:border-blue-400/60',
      accent: 'bg-blue-500',
      glow: 'shadow-blue-500/20'
    },
    green: { 
      bg: 'bg-gradient-to-br from-emerald-500/25 to-emerald-600/15', 
      border: 'border-emerald-500/40 hover:border-emerald-400/60',
      accent: 'bg-emerald-500',
      glow: 'shadow-emerald-500/20'
    },
    purple: { 
      bg: 'bg-gradient-to-br from-purple-500/25 to-purple-600/15', 
      border: 'border-purple-500/40 hover:border-purple-400/60',
      accent: 'bg-purple-500',
      glow: 'shadow-purple-500/20'
    },
    orange: { 
      bg: 'bg-gradient-to-br from-orange-500/25 to-orange-600/15', 
      border: 'border-orange-500/40 hover:border-orange-400/60',
      accent: 'bg-orange-500',
      glow: 'shadow-orange-500/20'
    },
    red: { 
      bg: 'bg-gradient-to-br from-red-500/25 to-red-600/15', 
      border: 'border-red-500/40 hover:border-red-400/60',
      accent: 'bg-red-500',
      glow: 'shadow-red-500/20'
    },
  };
  const style = colorStyles[appointment.color || 'blue'] || colorStyles.blue;

  const handleClick = (e: React.MouseEvent) => {
    // Só abre detalhes se não for drag
    if (e.detail === 1) {
      const timeout = setTimeout(() => {
        onViewDetails(appointment);
      }, 200);
      (e.target as HTMLElement).dataset.clickTimeout = String(timeout);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const timeout = (e.target as HTMLElement).dataset.clickTimeout;
    if (timeout) {
      clearTimeout(Number(timeout));
    }
    onDragStart(appointment, e);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "absolute left-16 right-2 rounded-xl border backdrop-blur-md cursor-pointer transition-all duration-200 group overflow-hidden",
        style.bg,
        style.border,
        isDragging && "opacity-50 scale-[0.98] cursor-grabbing",
        `hover:shadow-lg ${style.glow}`
      )}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Barra de cor lateral */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", style.accent)} />
      
      <div className="pl-3 pr-2 py-2 h-full flex flex-col justify-center overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-semibold truncate leading-tight",
              isCompact ? "text-xs" : "text-sm"
            )}>
              {appointment.title}
            </p>
            {!isCompact && (
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                </span>
                <span className="text-xs text-muted-foreground/60">
                  ({durationMinutes}min)
                </span>
              </div>
            )}
          </div>
          
          {/* Ações - aparecem no hover */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all duration-200 shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(appointment); }} 
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title="Editar"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDuplicate(appointment); }}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title="Duplicar"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(appointment.id); }}
              className="p-1.5 rounded-lg hover:bg-red-500/30 text-red-400 transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* Descrição se houver espaço */}
        {!isCompact && heightPx > 70 && appointment.description && (
          <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">
            {appointment.description}
          </p>
        )}
      </div>
      
      {/* Handle de resize */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-gradient-to-t from-white/10 to-transparent transition-opacity"
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart(appointment, e); }}
      />
    </motion.div>
  );
}

// Modal de Detalhes do Evento
interface EventDetailsModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (apt: Appointment) => void;
  onDelete: (id: number) => void;
  onDuplicate: (apt: Appointment) => void;
}

function EventDetailsModal({ appointment, isOpen, onClose, onEdit, onDelete, onDuplicate }: EventDetailsModalProps) {
  if (!appointment) return null;

  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  const durationMinutes = differenceInMinutes(endTime, startTime);
  const durationText = durationMinutes >= 60 
    ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 > 0 ? ` ${durationMinutes % 60}min` : ''}`
    : `${durationMinutes}min`;

  const colorStyles: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-400' },
    green: { bg: 'bg-emerald-500', text: 'text-emerald-400' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-400' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-400' },
    red: { bg: 'bg-red-500', text: 'text-red-400' },
  };
  const colorStyle = colorStyles[appointment.color || 'blue'] || colorStyles.blue;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden">
        {/* Header com cor do evento */}
        <div className={cn("h-2", colorStyle.bg)} />
        
        <div className="p-6">
          {/* Título e tipo */}
          <div className="mb-6">
            <h2 className="text-xl font-bold leading-tight">{appointment.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", colorStyle.bg, "text-white")}>
                {appointment.type === 'event' ? 'Evento' : 'Bloqueio'}
              </span>
            </div>
          </div>

          {/* Informações do evento */}
          <div className="space-y-4">
            {/* Data e hora */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className={cn("p-2 rounded-lg", colorStyle.bg + "/20")}>
                <Calendar className={cn("w-5 h-5", colorStyle.text)} />
              </div>
              <div className="flex-1">
                <p className="font-medium capitalize">
                  {format(startTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}</span>
                  <span className="text-muted-foreground/60">({durationText})</span>
                </div>
              </div>
            </div>

            {/* Descrição */}
            {appointment.description && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className={cn("p-2 rounded-lg", colorStyle.bg + "/20")}>
                  <FileText className={cn("w-5 h-5", colorStyle.text)} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Descrição</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {appointment.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onEdit(appointment); onClose(); }}
              className="flex-1 gap-2 bg-white/5 border-white/10 hover:bg-white/10"
            >
              <Edit3 className="w-4 h-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onDuplicate(appointment); onClose(); }}
              className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"
            >
              <Copy className="w-4 h-4" />
              Duplicar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { onDelete(appointment.id); onClose(); }}
              className="gap-2 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mobile Event Card - Design Melhorado
interface MobileEventCardProps {
  appointment: Appointment;
  onViewDetails: (apt: Appointment) => void;
  onDelete: (id: number) => void;
}

function MobileEventCard({ appointment, onViewDetails, onDelete }: MobileEventCardProps) {
  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  const durationMinutes = differenceInMinutes(endTime, startTime);

  const colorStyles: Record<string, { border: string; bg: string; accent: string }> = {
    blue: { border: 'border-l-blue-500', bg: 'bg-gradient-to-r from-blue-500/15 to-blue-500/5', accent: 'bg-blue-500' },
    green: { border: 'border-l-emerald-500', bg: 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5', accent: 'bg-emerald-500' },
    purple: { border: 'border-l-purple-500', bg: 'bg-gradient-to-r from-purple-500/15 to-purple-500/5', accent: 'bg-purple-500' },
    orange: { border: 'border-l-orange-500', bg: 'bg-gradient-to-r from-orange-500/15 to-orange-500/5', accent: 'bg-orange-500' },
    red: { border: 'border-l-red-500', bg: 'bg-gradient-to-r from-red-500/15 to-red-500/5', accent: 'bg-red-500' },
  };
  const style = colorStyles[appointment.color || 'blue'] || colorStyles.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "w-full min-h-[56px] rounded-xl border-l-4 backdrop-blur-md overflow-hidden",
        "border border-white/10",
        style.border,
        style.bg,
        "active:scale-[0.98] transition-transform"
      )}
      onClick={() => onViewDetails(appointment)}
    >
      <div className="p-3 flex items-center gap-3">
        {/* Indicador de cor */}
        <div className={cn("w-1 h-10 rounded-full", style.accent)} />
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{appointment.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </span>
            <span className="text-xs text-muted-foreground/60">
              ({durationMinutes}min)
            </span>
          </div>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(appointment.id); }}
          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Próximos Eventos Card para Mobile
interface UpcomingEventsCardProps {
  appointment: Appointment;
  onSelect: (apt: Appointment) => void;
}

function UpcomingEventsCard({ appointment, onSelect }: UpcomingEventsCardProps) {
  const startTime = new Date(appointment.start_time);

  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };
  const dotColor = colors[appointment.color || 'blue'] || colors.blue;

  return (
    <button
      onClick={() => onSelect(appointment)}
      className={cn(
        "w-full min-h-[48px] p-3 rounded-xl",
        "bg-white/5 backdrop-blur-md border border-white/10",
        "flex items-center gap-3 text-left",
        "active:scale-[0.98] transition-transform"
      )}
    >
      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", dotColor)} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{appointment.title}</p>
        <p className="text-xs text-muted-foreground">
          {format(startTime, "dd/MM 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
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
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-lg mx-4 bg-card/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
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
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <div className="p-2 border-b border-white/10">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</p>
            <button onClick={() => { onCreateEvent(); onClose(); }}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors">
              <Plus className="w-4 h-4 text-primary" />
              <span>Criar novo evento</span>
            </button>
            <button onClick={() => { onGoToToday(); onClose(); }}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Ir para hoje</span>
            </button>
          </div>
          {filteredAppointments.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Eventos</p>
              {filteredAppointments.map(apt => (
                <button key={apt.id} onClick={() => { onSelectAppointment(apt); onClose(); }}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors text-left">
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
      </motion.div>
    </div>
  );
}

// Mini Calendar Desktop
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
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm capitalize">
          {format(month, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
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
          nav: "hidden",
          table: "w-full border-collapse",
          head_row: "flex justify-between",
          head_cell: "text-muted-foreground text-[11px] font-medium w-8 text-center",
          row: "flex justify-between mt-1",
          cell: "relative p-0 text-center",
          day: cn(
            "h-8 w-8 p-0 font-normal text-sm rounded-lg transition-all duration-150",
            "hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
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

// Timeline Grid Desktop
interface TimelineGridProps {
  selectedDate: Date;
  appointments: Appointment[];
  onEdit: (apt: Appointment) => void;
  onDelete: (id: number) => void;
  onDuplicate: (apt: Appointment) => void;
  onCreateAtTime: (hour: number) => void;
  onUpdateAppointment: (id: number, data: { start_time: string; end_time: string }) => void;
  onViewDetails: (apt: Appointment) => void;
}

function TimelineGrid({ selectedDate, appointments, onEdit, onDelete, onDuplicate, onCreateAtTime, onUpdateAppointment, onViewDetails }: TimelineGridProps) {
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
        {hours.map(hour => (
          <div 
            key={hour} 
            className="absolute left-0 right-0 border-t border-white/10 group cursor-pointer"
            style={{ top: `calc(16px + ${(hour / 24) * 1440}px)`, height: '60px' }}
            onClick={() => onCreateAtTime(hour)}
          >
            <span className="absolute left-2 top-0 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-background px-1">
              {hour.toString().padStart(2, '0')}:00
            </span>
            <div className="absolute inset-0 left-16 opacity-0 group-hover:opacity-100 bg-primary/5 transition-opacity rounded-r-lg" />
          </div>
        ))}
        
        {isToday && <CurrentTimeIndicator />}
        
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
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}

// View Toggle Component
type ViewType = 'day' | 'week';

interface ViewToggleProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
}

function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
      <button
        onClick={() => onViewChange('day')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
          view === 'day' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-white/10"
        )}
      >
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">Dia</span>
      </button>
      <button
        onClick={() => onViewChange('week')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
          view === 'week' 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-white/10"
        )}
      >
        <CalendarDays className="w-4 h-4" />
        <span className="hidden sm:inline">Semana</span>
      </button>
    </div>
  );
}

// Weekly View Component
interface WeeklyViewProps {
  selectedDate: Date;
  appointments: Appointment[];
  onSelectDate: (date: Date) => void;
  onEdit: (apt: Appointment) => void;
  onDelete: (id: number) => void;
  onCreateAtTime: (hour: number, date: Date) => void;
}

function WeeklyView({ selectedDate, appointments, onSelectDate, onEdit, onDelete, onCreateAtTime }: WeeklyViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Obter dias da semana
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const isToday = (date: Date) => isSameDay(date, new Date());
  
  // Agrupar eventos por dia
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped[dayKey] = appointments.filter(apt => 
        isSameDay(new Date(apt.start_time), day)
      );
    });
    return grouped;
  }, [appointments, weekDays]);

  // Scroll para hora atual
  useEffect(() => {
    if (containerRef.current) {
      const now = new Date();
      const scrollPosition = (now.getHours() * 60 + now.getMinutes()) / 1440 * 1440 - 200;
      containerRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  const colors: Record<string, string> = {
    blue: 'bg-blue-500/30 border-blue-500/50',
    green: 'bg-emerald-500/30 border-emerald-500/50',
    purple: 'bg-purple-500/30 border-purple-500/50',
    orange: 'bg-orange-500/30 border-orange-500/50',
    red: 'bg-red-500/30 border-red-500/50',
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header com dias da semana */}
      <div className="flex border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-10">
        <div className="w-14 flex-shrink-0" /> {/* Espaço para horários */}
        {weekDays.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={cn(
              "flex-1 py-3 text-center transition-colors border-l border-white/10 first:border-l-0",
              isSameDay(day, selectedDate) && "bg-primary/10",
              isToday(day) && "bg-primary/5"
            )}
          >
            <p className="text-xs text-muted-foreground uppercase">
              {format(day, 'EEE', { locale: ptBR })}
            </p>
            <p className={cn(
              "text-lg font-semibold mt-0.5",
              isToday(day) && "text-primary",
              isSameDay(day, selectedDate) && "text-primary"
            )}>
              {format(day, 'd')}
            </p>
          </button>
        ))}
      </div>

      {/* Grid de horários */}
      <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex relative" style={{ height: '1440px' }}>
          {/* Coluna de horários */}
          <div className="w-14 flex-shrink-0 relative">
            {hours.map(hour => (
              <div 
                key={hour}
                className="absolute left-0 right-0 text-right pr-2"
                style={{ top: `${(hour / 24) * 1440}px` }}
              >
                <span className="text-xs text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Colunas dos dias */}
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay[dayKey] || [];
            const isTodayCol = isToday(day);

            return (
              <div 
                key={day.toISOString()}
                className={cn(
                  "flex-1 relative border-l border-white/10",
                  isSameDay(day, selectedDate) && "bg-primary/5"
                )}
              >
                {/* Linhas de hora */}
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                    style={{ top: `${(hour / 24) * 1440}px`, height: '60px' }}
                    onClick={() => onCreateAtTime(hour, day)}
                  />
                ))}

                {/* Indicador de hora atual */}
                {isTodayCol && (
                  <div 
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${((new Date().getHours() * 60 + new Date().getMinutes()) / 1440) * 1440}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <div className="flex-1 h-[2px] bg-blue-500" />
                    </div>
                  </div>
                )}

                {/* Eventos do dia */}
                {dayEvents.map(apt => {
                  const startTime = new Date(apt.start_time);
                  const endTime = new Date(apt.end_time);
                  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
                  const durationMinutes = differenceInMinutes(endTime, startTime);
                  const topPx = (startMinutes / 1440) * 1440;
                  const heightPx = Math.max((durationMinutes / 1440) * 1440, 24);
                  const colorClass = colors[apt.color || 'blue'] || colors.blue;

                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "absolute left-1 right-1 rounded-md border backdrop-blur-sm cursor-pointer transition-all",
                        "hover:scale-[1.02] hover:shadow-lg hover:z-10",
                        colorClass
                      )}
                      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                      onClick={(e) => { e.stopPropagation(); onEdit(apt); }}
                    >
                      <div className="p-1 h-full overflow-hidden">
                        <p className="text-xs font-medium truncate">{apt.title}</p>
                        {heightPx > 30 && (
                          <p className="text-[10px] text-muted-foreground">
                            {format(startTime, 'HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ onCreateEvent, isMobile }: { onCreateEvent: () => void; isMobile: boolean }) {
  return (
    <div className={cn(
      "flex-1 flex flex-col items-center justify-center text-center p-8",
      isMobile && "min-h-[50vh]"
    )}>
      <div className={cn(
        "rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mb-6",
        isMobile ? "w-16 h-16" : "w-20 h-20"
      )}>
        <Calendar className={cn(
          "text-muted-foreground/50",
          isMobile ? "w-8 h-8" : "w-10 h-10"
        )} />
      </div>
      <h3 className={cn(
        "font-medium mb-2",
        isMobile ? "text-base" : "text-lg"
      )}>Nenhum evento neste dia</h3>
      <p className={cn(
        "text-muted-foreground mb-6 max-w-xs",
        isMobile ? "text-xs" : "text-sm"
      )}>
        Sua agenda está livre. Aproveite para planejar algo produtivo.
      </p>
      <Button onClick={onCreateEvent} variant="outline" className="gap-2 bg-white/5 border-white/10">
        <Plus className="w-4 h-4" />
        Criar evento
      </Button>
    </div>
  );
}

// Swipeable Day View para Mobile
interface SwipeableDayViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  appointments: Appointment[];
  onViewDetails: (apt: Appointment) => void;
  onDelete: (id: number) => void;
  onCreateEvent: () => void;
}

function SwipeableDayView({ selectedDate, onDateChange, appointments, onViewDetails, onDelete, onCreateEvent }: SwipeableDayViewProps) {
  const [direction, setDirection] = useState(0);
  
  const dayAppointments = useMemo(() => {
    return appointments.filter(apt => isSameDay(new Date(apt.start_time), selectedDate))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [appointments, selectedDate]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      setDirection(-1);
      onDateChange(subDays(selectedDate, 1));
    } else if (info.offset.x < -threshold) {
      setDirection(1);
      onDateChange(addDays(selectedDate, 1));
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="flex-1 overflow-hidden relative">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={selectedDate.toISOString()}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 overflow-y-auto p-4"
        >
          {dayAppointments.length === 0 ? (
            <EmptyState onCreateEvent={onCreateEvent} isMobile={true} />
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {dayAppointments.map((apt, index) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MobileEventCard
                      appointment={apt}
                      onViewDetails={onViewDetails}
                      onDelete={onDelete}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Indicadores de swipe */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <ChevronLeft className="w-3 h-3" />
          <span>Deslize para navegar</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function AgendaPage() {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<ViewType>('day');
  const { appointments, isLoading, createAppointment, updateAppointment, deleteAppointment, isCreating } = useSupabaseAppointments();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [nlpInput, setNlpInput] = useState("");
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [selectedReminder, setSelectedReminder] = useState<ReminderType>('none');
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const nlpInputRef = useRef<HTMLInputElement>(null);

  // Opções de lembrete
  const reminderOptions: { value: ReminderType; label: string }[] = [
    { value: 'none', label: 'Sem lembrete' },
    { value: 'at_time', label: 'Na hora do evento' },
    { value: '5m', label: '5 minutos antes' },
    { value: '15m', label: '15 minutos antes' },
    { value: '30m', label: '30 minutos antes' },
    { value: '1h', label: '1 hora antes' },
  ];

  const dayAppointments = useMemo(() => {
    return (appointments || []).filter(apt => isSameDay(new Date(apt.start_time), selectedDate));
  }, [appointments, selectedDate]);

  const upcomingAppointments = useMemo(() => {
    return (appointments || [])
      .filter(apt => new Date(apt.start_time) >= new Date())
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 4);
  }, [appointments]);

  // Keyboard shortcuts (apenas desktop)
  useEffect(() => {
    if (isMobile) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsCreateOpen(true);
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setSelectedDate(new Date());
      }
      if (e.key === 'Escape') {
        setIsCreateOpen(false);
        setIsCommandOpen(false);
        setEditingAppointment(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  useEffect(() => {
    if (isCreateOpen) {
      setEventDate(selectedDate);
      setTimeout(() => nlpInputRef.current?.focus(), 100);
    }
  }, [isCreateOpen, selectedDate]);

  // Função para agendar notificação de lembrete
  const scheduleReminder = async (eventTitle: string, eventStart: Date, reminder: ReminderType) => {
    if (reminder === 'none') return;
    
    // Verifica se o navegador suporta notificações
    if (!('Notification' in window)) {
      console.log('Navegador não suporta notificações');
      return;
    }
    
    // Solicita permissão se necessário
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }
    
    if (Notification.permission !== 'granted') return;
    
    // Calcula o tempo do lembrete
    const reminderMinutes: Record<ReminderType, number> = {
      'none': 0,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      'at_time': 0,
    };
    
    const minutesBefore = reminderMinutes[reminder];
    const reminderTime = new Date(eventStart.getTime() - minutesBefore * 60000);
    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();
    
    // Se o lembrete já passou, não agenda
    if (delay <= 0) {
      console.log('Lembrete já passou');
      return;
    }
    
    // Agenda a notificação local (para quando o app está aberto)
    setTimeout(() => {
      const reminderText = reminder === 'at_time' 
        ? 'Agora' 
        : `Em ${minutesBefore} minutos`;
      
      // Tenta usar o Service Worker para notificação
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification('📅 Lembrete - Planor', {
            body: `${reminderText}: ${eventTitle}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            tag: `reminder-${eventStart.getTime()}`,
            requireInteraction: true,
            data: {
              url: '/app/agenda',
              timestamp: Date.now(),
            },
          } as NotificationOptions);
        });
      } else {
        // Fallback para notificação simples
        new Notification('📅 Lembrete - Planor', {
          body: `${reminderText}: ${eventTitle}`,
          icon: '/icons/icon-192x192.png',
          tag: `reminder-${eventStart.getTime()}`,
        });
      }
    }, delay);
    
    console.log(`Lembrete agendado para ${reminderTime.toLocaleString()}`);
  };

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
          // Agenda lembrete se selecionado
          if (selectedReminder !== 'none') {
            scheduleReminder(parsed.title, parsed.start, selectedReminder);
          }
          toast({ title: "Evento criado", description: `${parsed.title} adicionado à sua agenda.` });
          setNlpInput("");
          setSelectedReminder('none');
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
        // Agenda lembrete se selecionado
        if (selectedReminder !== 'none') {
          scheduleReminder(title, start, selectedReminder);
        }
        toast({ title: "Evento criado", description: "Adicionado à sua agenda." });
        setTitle("");
        setSelectedReminder('none');
        setIsCreateOpen(false);
        setSelectedDate(eventDate);
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
    setSelectedReminder('none'); // Reset reminder ao abrir edição
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
        // Agenda lembrete se selecionado
        if (selectedReminder !== 'none') {
          scheduleReminder(title, start, selectedReminder);
          toast({ 
            title: "Evento atualizado", 
            description: `Lembrete agendado para ${selectedReminder === 'at_time' ? 'na hora do evento' : reminderOptions.find(o => o.value === selectedReminder)?.label.toLowerCase()}` 
          });
        } else {
          toast({ title: "Evento atualizado" });
        }
        setEditingAppointment(null);
        setTitle("");
        setSelectedReminder('none');
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

  const handleCreateAtTime = (hour: number, date?: Date) => {
    setStartTime(`${hour.toString().padStart(2, '0')}:00`);
    setEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
    if (date) {
      setEventDate(date);
      setSelectedDate(date);
    }
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

  // ========== MOBILE LAYOUT ==========
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-2rem)] flex flex-col">
        {/* Header Mobile - sem atalhos de teclado */}
        <FloatingHeader 
          title="Agenda"
          subtitle={format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          actions={
            <Button 
              onClick={() => setIsCreateOpen(true)}
              size="sm"
              className="gap-1.5 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
            </Button>
          }
        />

        {/* Date Scroller Mobile */}
        <DateScroller 
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          appointments={appointments || []}
        />

        {/* Swipeable Day View */}
        <SwipeableDayView
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          appointments={appointments || []}
          onViewDetails={setViewingAppointment}
          onDelete={handleDelete}
          onCreateEvent={() => setIsCreateOpen(true)}
        />

        {/* Próximos Eventos - Colapsável */}
        {upcomingAppointments.length > 0 && (
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 bg-white/5 backdrop-blur-md border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Próximos eventos</span>
                  <span className="text-xs text-muted-foreground">({upcomingAppointments.length})</span>
                </div>
                <ChevronDown className="w-4 h-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 space-y-2 bg-white/5 backdrop-blur-md border-t border-white/10">
                {upcomingAppointments.map(apt => (
                  <UpcomingEventsCard
                    key={apt.id}
                    appointment={apt}
                    onSelect={(apt) => {
                      setSelectedDate(new Date(apt.start_time));
                    }}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

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

        {/* Create/Edit Modals - Reutilizados */}
        {renderCreateModal()}
        {renderEditModal()}
        
        {/* Modal de Detalhes */}
        <EventDetailsModal
          appointment={viewingAppointment}
          isOpen={!!viewingAppointment}
          onClose={() => setViewingAppointment(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      </div>
    );
  }

  // ========== DESKTOP LAYOUT ==========
  // Funções de renderização dos modais

  function renderCreateModal() {
    return (
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn(
          "bg-card/95 backdrop-blur-xl border-white/10",
          isMobile ? "max-w-[calc(100%-2rem)] rounded-2xl" : "sm:max-w-md"
        )}>
          <DialogHeader>
            <DialogTitle className="text-lg">Novo Evento</DialogTitle>
          </DialogHeader>
          
          {/* Input NLP estilo Todoist */}
          <form onSubmit={handleNlpSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <div className="relative">
                <Input
                  ref={nlpInputRef}
                  value={nlpInput}
                  onChange={e => setNlpInput(e.target.value)}
                  placeholder="Reunião com cliente hoje 14:00"
                  className="pr-12 bg-white/5 border-white/10 focus:border-primary/50 h-11"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-primary font-medium px-1.5 py-0.5 bg-primary/20 rounded">
                  NLP
                </span>
              </div>
              
              {/* Preview do NLP em tempo real */}
              {nlpInput.trim() && (() => {
                const parsed = parseNaturalLanguage(nlpInput, selectedDate);
                if (parsed) {
                  return (
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/10 rounded-lg text-xs">
                      <span className="text-primary">→</span>
                      <span className="font-medium">{parsed.title}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {format(parsed.start, "EEE, d MMM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
              
              <p className="text-[11px] text-muted-foreground px-1">
                Exemplos: "Dentista amanhã 10h" • "Call sexta às 15:00" • "Reunião 20/03 14h por 2h"
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-muted-foreground">ou preencha manualmente</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </form>

          <form onSubmit={handleManualCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Nome do evento"
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white/5 border-white/10",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "EEEE, d 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card/95 backdrop-blur-xl border-white/10" align="start">
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
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Término</label>
                <Input 
                  type="time" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            {/* Lembrete */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Lembrete
              </label>
              <div className="flex flex-wrap gap-2">
                {reminderOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedReminder(option.value)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-lg transition-all border",
                      selectedReminder === option.value 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
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
    );
  }

  function renderEditModal() {
    return (
      <Dialog open={!!editingAppointment} onOpenChange={(open) => !open && setEditingAppointment(null)}>
        <DialogContent className={cn(
          "bg-card/95 backdrop-blur-xl border-white/10",
          isMobile ? "max-w-[calc(100%-2rem)] rounded-2xl" : "sm:max-w-md"
        )}>
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
                className="bg-white/5 border-white/10"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Início</label>
                <Input 
                  type="time" 
                  value={startTime} 
                  onChange={e => setStartTime(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Término</label>
                <Input 
                  type="time" 
                  value={endTime} 
                  onChange={e => setEndTime(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            {/* Lembrete */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Lembrete
              </label>
              <div className="flex flex-wrap gap-2">
                {reminderOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedReminder(option.value)}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-lg transition-all border",
                      selectedReminder === option.value 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {selectedReminder !== 'none' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Bell className="w-3 h-3" />
                  Você será notificado {selectedReminder === 'at_time' ? 'na hora do evento' : `${reminderOptions.find(o => o.value === selectedReminder)?.label.toLowerCase()}`}
                </p>
              )}
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
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      {/* Header Desktop */}
      <FloatingHeader 
        title="Agenda"
        subtitle={viewType === 'week' 
          ? `Semana de ${format(startOfWeek(selectedDate, { weekStartsOn: 0 }), "d 'de' MMM", { locale: ptBR })}` 
          : format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        actions={
          <div className="flex items-center gap-2">
            {/* Toggle de visualização */}
            <ViewToggle view={viewType} onViewChange={setViewType} />
            
            {/* Atalhos de teclado - apenas desktop */}
            <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground ml-2">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">C</kbd>
                Criar
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">T</kbd>
                Hoje
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCommandOpen(true)}
              className="gap-2 text-muted-foreground bg-white/5 border-white/10"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Buscar</span>
            </Button>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              size="sm"
              className="gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
          </div>
        }
      />

      {/* Main Content Desktop - Duas colunas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="w-72 p-4 flex flex-col gap-4 overflow-y-auto">
          <MiniCalendar 
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            appointments={appointments || []}
          />
          
          {/* Próximos eventos Desktop */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Próximos eventos
            </h3>
            <div className="space-y-2">
              {upcomingAppointments.map(apt => (
                <button
                  key={apt.id}
                  onClick={() => setSelectedDate(new Date(apt.start_time))}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {apt.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(apt.start_time), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </button>
              ))}
              {upcomingAppointments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum evento futuro
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Main View - Day or Week */}
        <main className="flex-1 flex flex-col bg-background/50">
          {viewType === 'week' ? (
            <WeeklyView
              selectedDate={selectedDate}
              appointments={appointments || []}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setViewType('day');
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateAtTime={handleCreateAtTime}
            />
          ) : dayAppointments.length === 0 ? (
            <EmptyState onCreateEvent={() => setIsCreateOpen(true)} isMobile={false} />
          ) : (
            <TimelineGrid
              selectedDate={selectedDate}
              appointments={appointments || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onCreateAtTime={handleCreateAtTime}
              onUpdateAppointment={handleUpdateAppointment}
              onViewDetails={setViewingAppointment}
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

      {/* Modals */}
      {renderCreateModal()}
      {renderEditModal()}
      
      {/* Modal de Detalhes */}
      <EventDetailsModal
        appointment={viewingAppointment}
        isOpen={!!viewingAppointment}
        onClose={() => setViewingAppointment(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
    </div>
  );
}
