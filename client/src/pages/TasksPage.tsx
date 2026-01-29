import { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, Trash2, Plus, Calendar as CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    await createTask.mutateAsync({
      title: newTaskTitle,
      priority: newTaskPriority,
      completed: false,
      userId: "temp", // Backend handles this from session
    });
    setNewTaskTitle("");
    setIsCreateOpen(false);
  };

  const filteredTasks = tasks?.filter(task => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  if (isLoading) return <div className="p-8">Loading tasks...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage your daily todos and priorities.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
              <Plus className="mr-2 size-4" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Title</label>
                <Input 
                  placeholder="What needs to be done?" 
                  value={newTaskTitle} 
                  onChange={e => setNewTaskTitle(e.target.value)} 
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createTask.isPending}>
                  {createTask.isPending ? "Creating..." : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["all", "active", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize",
              filter === f 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredTasks?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-muted rounded-xl">
            <CheckCircle2 className="size-10 mx-auto mb-3 opacity-20" />
            <p>No tasks found. Create one to get started!</p>
          </div>
        )}

        {filteredTasks?.map((task) => (
          <div 
            key={task.id} 
            className={cn(
              "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
              task.completed ? "bg-muted/20 border-border opacity-60" : "bg-card border-border/60 hover:border-primary/30"
            )}
          >
            <button 
              onClick={() => updateTask.mutate({ id: task.id, completed: !task.completed })}
              className={cn("transition-transform active:scale-90", task.completed ? "text-primary" : "text-muted-foreground hover:text-primary")}
            >
              {task.completed ? <CheckCircle2 className="size-6" /> : <Circle className="size-6" />}
            </button>
            
            <div className="flex-1">
              <h3 className={cn("font-medium text-base", task.completed && "line-through text-muted-foreground")}>
                {task.title}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-md font-medium uppercase tracking-wide",
                  task.priority === 'high' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  task.priority === 'medium' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                )}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="size-3" /> {format(new Date(task.dueDate), "MMM d")}
                  </span>
                )}
              </div>
            </div>

            <button 
              onClick={() => deleteTask.mutate(task.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all rounded-md hover:bg-destructive/10"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
