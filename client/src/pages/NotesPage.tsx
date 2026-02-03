import { useState } from "react";
import { useSupabaseNotes } from "@/hooks/use-supabase-notes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, StickyNote, Pin, PinOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function NotesPage() {
  const { notes, isLoading, createNote, deleteNote, togglePin, isCreating } = useSupabaseNotes();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    
    createNote({
      title: newNoteTitle,
      content: newNoteContent,
    }, {
      onSuccess: () => {
        toast({ title: "Nota criada" });
        setNewNoteTitle("");
        setNewNoteContent("");
        setIsCreateOpen(false);
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao criar nota", variant: "destructive" });
      }
    });
  };

  if (isLoading) return <div className="p-8">Carregando notas...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notas</h1>
          <p className="text-muted-foreground">Capture pensamentos e ideias instantaneamente.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
              <Plus className="mr-2 size-4" /> Nova Nota
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Nota</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <Input 
                placeholder="Título" 
                value={newNoteTitle} 
                onChange={e => setNewNoteTitle(e.target.value)} 
                className="font-semibold text-lg border-none px-0 shadow-none focus-visible:ring-0 rounded-none border-b border-border/50 focus:border-primary transition-colors"
                autoFocus
              />
              <Textarea 
                placeholder="Escreva algo..." 
                value={newNoteContent} 
                onChange={e => setNewNoteContent(e.target.value)}
                className="min-h-[200px] border-none shadow-none focus-visible:ring-0 resize-none p-0"
              />
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Salvando..." : "Salvar Nota"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {notes?.length === 0 && (
           <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed border-muted rounded-xl">
             <StickyNote className="size-12 mx-auto mb-4 opacity-20" />
             <p>Nenhuma nota ainda. Crie sua primeira!</p>
           </div>
        )}

        {notes?.map((note) => (
          <div 
            key={note.id} 
            className={cn(
              "group relative flex flex-col p-6 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-border hover:-translate-y-1 transition-all duration-300 h-[280px]",
              note.is_pinned && "ring-2 ring-primary/20 border-primary/30"
            )}
          >
            {note.is_pinned && (
              <div className="absolute top-2 right-2">
                <Pin className="size-4 text-primary" />
              </div>
            )}
            <h3 className="font-semibold text-lg mb-2 line-clamp-1">{note.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-[8] flex-1 whitespace-pre-wrap">
              {note.content}
            </p>
            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
               <span>{note.created_at && format(new Date(note.created_at), "MMM d, yyyy")}</span>
               <div className="flex items-center gap-1">
                 <button 
                    onClick={(e) => {
                       e.stopPropagation();
                       togglePin({ id: note.id, isPinned: !note.is_pinned });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-primary/10 hover:text-primary rounded transition-all"
                 >
                    {note.is_pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                 </button>
                 <button 
                    onClick={(e) => {
                       e.stopPropagation();
                       deleteNote(note.id, {
                         onSuccess: () => toast({ title: "Nota excluída" })
                       });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
                 >
                    <Trash2 className="size-4" />
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
