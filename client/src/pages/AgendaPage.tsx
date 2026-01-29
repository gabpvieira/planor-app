import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useAppointments, useCreateAppointment, useDeleteAppointment } from "@/hooks/use-appointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format, isSameDay } from "date-fns";
import { Calendar, Plus, Clock, Trash2 } from "lucide-react";

export default function AgendaPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { data: appointments, isLoading } = useAppointments();
  const createAppointment = useCreateAppointment();
  const deleteAppointment = useDeleteAppointment();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const selectedDateAppointments = appointments?.filter(apt => 
    date && isSameDay(new Date(apt.startTime), date)
  ) || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !title) return;

    // Construct dates
    const start = new Date(date);
    const [startH, startM] = startTime.split(":").map(Number);
    start.setHours(startH, startM);

    const end = new Date(date);
    const [endH, endM] = endTime.split(":").map(Number);
    end.setHours(endH, endM);

    await createAppointment.mutateAsync({
      title,
      startTime: start,
      endTime: end,
      type: "event",
      userId: "temp"
    });
    
    setTitle("");
    setIsCreateOpen(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">Manage your schedule and appointments.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/25">
              <Plus className="mr-2 size-4" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Event for {date ? format(date, "MMM do") : ""}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Title</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Meeting with Team" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createAppointment.isPending}>Schedule Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Card className="border-border/60 shadow-sm">
             <CardContent className="p-4 flex justify-center">
                <DayPicker
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="bg-background rounded-lg"
                  modifiersStyles={{
                    selected: { backgroundColor: "hsl(var(--primary))", color: "white" }
                  }}
                />
             </CardContent>
          </Card>
        </div>

        {/* Daily Schedule */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
           <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              {date ? format(date, "EEEE, MMMM do, yyyy") : "Select a date"}
           </h2>
           
           <div className="space-y-2">
              {selectedDateAppointments.length === 0 ? (
                 <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-xl text-muted-foreground bg-muted/5">
                    <Clock className="size-10 mb-2 opacity-20" />
                    <p>No events scheduled for this day.</p>
                 </div>
              ) : (
                 selectedDateAppointments
                   .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                   .map(apt => (
                     <div key={apt.id} className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all">
                        <div className="flex flex-col items-center min-w-[80px] px-2 py-1 rounded bg-muted/30 text-sm font-medium">
                           <span>{format(new Date(apt.startTime), "h:mm a")}</span>
                           <span className="text-xs text-muted-foreground">{format(new Date(apt.endTime), "h:mm a")}</span>
                        </div>
                        <div className="flex-1">
                           <h3 className="font-semibold">{apt.title}</h3>
                           {apt.description && <p className="text-sm text-muted-foreground">{apt.description}</p>}
                        </div>
                        <button 
                           onClick={() => deleteAppointment.mutate(apt.id)}
                           className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                        >
                           <Trash2 className="size-4" />
                        </button>
                     </div>
                 ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
