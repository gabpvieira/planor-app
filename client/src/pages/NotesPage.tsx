import { useState } from "react";
import { useNotes, useCreateNote, useDeleteNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotesPage() {
  const { data: notes, isLoading } = useNotes();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    
    await createNote.mutateAsync({
      title: newNoteTitle,
      content: newNoteContent,
      userId: "temp",
    });
    setNewNoteTitle("");
    setNewNoteContent("");
    setIsCreateOpen(false);
  };

  if (isLoading) return <div className="p-8">Loading notes...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground">Capture thoughts and ideas instantly.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
              <Plus className="mr-2 size-4" /> New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <Input 
                placeholder="Title" 
                value={newNoteTitle} 
                onChange={e => setNewNoteTitle(e.target.value)} 
                className="font-semibold text-lg border-none px-0 shadow-none focus-visible:ring-0 rounded-none border-b border-border/50 focus:border-primary transition-colors"
                autoFocus
              />
              <Textarea 
                placeholder="Write something..." 
                value={newNoteContent} 
                onChange={e => setNewNoteContent(e.target.value)}
                className="min-h-[200px] border-none shadow-none focus-visible:ring-0 resize-none p-0"
              />
              <DialogFooter>
                <Button type="submit" disabled={createNote.isPending}>Save Note</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {notes?.length === 0 && (
           <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed border-muted rounded-xl">
             <StickyNote className="size-12 mx-auto mb-4 opacity-20" />
             <p>No notes yet. Create your first one!</p>
           </div>
        )}

        {notes?.map((note) => (
          <div 
            key={note.id} 
            className="group relative flex flex-col p-6 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-border hover:-translate-y-1 transition-all duration-300 h-[280px]"
          >
            <h3 className="font-semibold text-lg mb-2 line-clamp-1">{note.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-[8] flex-1 whitespace-pre-wrap">
              {note.content}
            </p>
            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
               <span>{note.createdAt && format(new Date(note.createdAt), "MMM d, yyyy")}</span>
               <button 
                  onClick={(e) => {
                     e.stopPropagation();
                     deleteNote.mutate(note.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded transition-all"
               >
                  <Trash2 className="size-4" />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
