import { useState, useEffect, useCallback } from "react";
import { useSupabaseKnowledge, useDailyFlashcard } from "@/hooks/use-supabase-knowledge";
import { knowledgeService, KnowledgeFilter } from "@/services/knowledge.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search, Plus, Command, Book, Zap, FileText, Video, Headphones, Link2,
  Star, BookMarked, Archive, FolderOpen, Sparkles, Brain, ChevronRight,
  Trash2, ExternalLink, RotateCcw, X, Lightbulb
} from "lucide-react";
import type { Database } from "@/types/database.types";

type KnowledgeItem = Database['public']['Tables']['knowledge_items']['Row'];
type KnowledgeType = KnowledgeItem['type'];

const TYPE_CONFIG: Record<KnowledgeType, { icon: typeof Book; label: string; color: string }> = {
  note: { icon: FileText, label: 'Nota', color: 'text-blue-400' },
  article: { icon: FileText, label: 'Artigo', color: 'text-emerald-400' },
  book: { icon: Book, label: 'Livro', color: 'text-amber-400' },
  video: { icon: Video, label: 'Vídeo', color: 'text-red-400' },
  podcast: { icon: Headphones, label: 'Podcast', color: 'text-purple-400' },
  ai_insight: { icon: Zap, label: 'AI Insight', color: 'text-cyan-400' },
  link: { icon: Link2, label: 'Link', color: 'text-pink-400' },
};

const FILTER_CONFIG: Record<KnowledgeFilter, { icon: typeof FolderOpen; label: string }> = {
  all: { icon: FolderOpen, label: 'Todos' },
  to_read: { icon: BookMarked, label: 'Para ler' },
  favorites: { icon: Star, label: 'Favoritos' },
  archived: { icon: Archive, label: 'Arquivo' },
};

// Daily Flashcard Component
function DailyFlashcard() {
  const { flashcard, isLoading, refetch } = useDailyFlashcard();
  const { markReviewed } = useSupabaseKnowledge();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) return null;
  if (!flashcard) return null;

  const handleMarkReviewed = () => {
    markReviewed(flashcard.id, {
      onSuccess: () => refetch()
    });
  };

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-white/10 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-violet-500/20">
          <Brain className="size-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-violet-400">Revisão do Dia</span>
            <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-300">
              Spaced Repetition
            </Badge>
          </div>
          <h3 className="font-semibold text-sm mb-1 line-clamp-1">{flashcard.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {flashcard.ai_summary || flashcard.content?.slice(0, 150)}
          </p>

          {isExpanded && flashcard.key_takeaways && flashcard.key_takeaways.length > 0 && (
            <div className="mt-3 space-y-1">
              <span className="text-xs font-medium text-violet-400">Key Takeaways:</span>
              <ul className="space-y-1">
                {flashcard.key_takeaways.map((takeaway, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <Lightbulb className="size-3 mt-0.5 text-amber-400 shrink-0" />
                    {takeaway}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Menos' : 'Mais'}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-violet-500/20 hover:bg-violet-500/30 text-violet-300"
            onClick={handleMarkReviewed}
          >
            <RotateCcw className="size-3 mr-1" />
            Revisei
          </Button>
        </div>
      </div>
    </div>
  );
}

// Knowledge Card Component
function KnowledgeCard({ 
  item, 
  onOpenSummary,
  onToggleFavorite,
  onDelete 
}: { 
  item: KnowledgeItem;
  onOpenSummary: (item: KnowledgeItem) => void;
  onToggleFavorite: (id: number, isFavorite: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "group relative p-4 rounded-xl",
      "bg-white/5 border border-white/10",
      "hover:bg-white/8 hover:border-white/20 hover:scale-[1.02]",
      "transition-all duration-300 ease-out",
      "flex flex-col h-full"
    )}>

      {/* Type Icon */}
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-1.5 rounded-lg bg-white/5", config.color)}>
          <Icon className="size-3.5" />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.ai_summary && (
            <button
              onClick={() => onOpenSummary(item)}
              className="p-1.5 rounded-lg hover:bg-violet-500/20 text-violet-400 transition-colors"
            >
              <Sparkles className="size-3.5" />
            </button>
          )}
          <button
            onClick={() => onToggleFavorite(item.id, !item.is_favorite)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              item.is_favorite 
                ? "text-amber-400 bg-amber-500/20" 
                : "hover:bg-amber-500/20 text-muted-foreground hover:text-amber-400"
            )}
          >
            <Star className={cn("size-3.5", item.is_favorite && "fill-current")} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-medium text-sm mb-2 line-clamp-2 flex-shrink-0">{item.title}</h3>

      {/* Content Preview */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
        {item.content?.slice(0, 120) || 'Sem conteúdo'}
      </p>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/5 border-white/10">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 3 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/5 border-white/10">
              +{item.tags.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {item.progress > 0 && (
        <div className="mt-auto pt-2">
          <Progress value={item.progress} className="h-1 bg-white/5" />
        </div>
      )}

      {/* Source Link */}
      {item.source_url && (
        <a
          href={item.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
        >
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}

// AI Summary Sheet
function AISummarySheet({ 
  item, 
  isOpen, 
  onClose 
}: { 
  item: KnowledgeItem | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!item) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/10">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-violet-500/20">
              <Sparkles className="size-4 text-violet-400" />
            </div>
            <Badge variant="outline" className="border-violet-500/30 text-violet-300">
              AI Summary
            </Badge>
          </div>
          <SheetTitle className="text-left">{item.title}</SheetTitle>
          <SheetDescription className="text-left">
            Resumo gerado por IA
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Resumo</h4>
            <p className="text-sm leading-relaxed">
              {item.ai_summary || 'Nenhum resumo disponível'}
            </p>
          </div>

          {/* Key Takeaways */}
          {item.key_takeaways && item.key_takeaways.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Key Takeaways</h4>
              <ul className="space-y-2">
                {item.key_takeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <Lightbulb className="size-4 mt-0.5 text-amber-400 shrink-0" />
                    <span className="text-sm">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="bg-white/5 border-white/10">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Quick Capture Dialog
function QuickCaptureDialog({ 
  isOpen, 
  onClose, 
  onCreate 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<KnowledgeType>('note');
  const [sourceUrl, setSourceUrl] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      content: content.trim() || null,
      type,
      source_url: sourceUrl.trim() || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });

    setTitle('');
    setContent('');
    setType('note');
    setSourceUrl('');
    setTags('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-5" />
            Quick Capture
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            placeholder="Título do insight..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="bg-white/5 border-white/10 focus:border-white/20"
            autoFocus
          />

          <Select value={type} onValueChange={(v) => setType(v as KnowledgeType)}>
            <SelectTrigger className="bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <config.icon className={cn("size-4", config.color)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Conteúdo ou notas..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="min-h-[120px] bg-white/5 border-white/10 focus:border-white/20 resize-none"
          />

          <Input
            placeholder="URL da fonte (opcional)"
            value={sourceUrl}
            onChange={e => setSourceUrl(e.target.value)}
            className="bg-white/5 border-white/10 focus:border-white/20"
          />

          <Input
            placeholder="Tags (separadas por vírgula)"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="bg-white/5 border-white/10 focus:border-white/20"
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary/90 hover:bg-primary">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Empty State
function EmptyState({ filter }: { filter: KnowledgeFilter }) {
  const messages: Record<KnowledgeFilter, { title: string; description: string }> = {
    all: { 
      title: 'Seu Digital Brain está vazio', 
      description: 'O que você aprendeu hoje? Salve seu primeiro insight.' 
    },
    to_read: { 
      title: 'Nada para ler', 
      description: 'Marque itens como "Para ler" para encontrá-los aqui.' 
    },
    favorites: { 
      title: 'Sem favoritos', 
      description: 'Favorite seus melhores insights para acesso rápido.' 
    },
    archived: { 
      title: 'Arquivo vazio', 
      description: 'Itens arquivados aparecerão aqui.' 
    },
  };

  const msg = messages[filter];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
        <Brain className="size-12 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-medium mb-2">{msg.title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{msg.description}</p>
    </div>
  );
}

// Main Page Component
export default function KnowledgePage() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [filter, setFilter] = useState<KnowledgeFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const {
    items,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createItem,
    toggleFavorite,
    deleteItem,
    isCreating,
  } = useSupabaseKnowledge(filter, debouncedSearch);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 500
    ) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('knowledge-search')?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreate = (data: any) => {
    createItem(data, {
      onSuccess: () => toast({ title: 'Insight salvo!' }),
      onError: () => toast({ title: 'Erro ao salvar', variant: 'destructive' }),
    });
  };

  const handleDelete = (id: number) => {
    deleteItem(id, {
      onSuccess: () => toast({ title: 'Item removido' }),
    });
  };

  const handleOpenSummary = (item: KnowledgeItem) => {
    setSelectedItem(item);
    setIsSummaryOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-4 md:-mx-8 md:px-8 lg:-mx-10 lg:px-10 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="size-6 text-violet-400" />
              Conhecimento
            </h1>
            <p className="text-sm text-muted-foreground">Seu Digital Brain pessoal</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="knowledge-search"
                placeholder="Search or Ask AI..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-16 bg-white/5 border-white/10 focus:border-white/20 rounded-xl"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-white/5 rounded border border-white/10">
                <Command className="size-3" />K
              </kbd>
            </div>

            {/* Quick Capture Button (Desktop) */}
            <Button
              onClick={() => setIsQuickCaptureOpen(true)}
              className="hidden md:flex bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30"
            >
              <Plus className="size-4 mr-2" />
              Capture
              <kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-white/10 rounded">⌘N</kbd>
            </Button>
          </div>
        </div>

        {/* Mobile Filter Pills */}
        {isMobile && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {Object.entries(FILTER_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setFilter(key as KnowledgeFilter)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  filter === key
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
                )}
              >
                <config.icon className="size-3.5" />
                {config.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="w-48 shrink-0">
            <nav className="space-y-1 sticky top-24">
              {Object.entries(FILTER_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as KnowledgeFilter)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                    filter === key
                      ? "bg-violet-500/20 text-violet-300"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <config.icon className="size-4" />
                  {config.label}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Daily Flashcard */}
          <DailyFlashcard />

          {/* Grid */}
          {items.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <>
              <div className={cn(
                "grid gap-4",
                isMobile 
                  ? "grid-cols-1" 
                  : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              )}>
                {items.map((item) => (
                  <KnowledgeCard
                    key={item.id}
                    item={item}
                    onOpenSummary={handleOpenSummary}
                    onToggleFavorite={(id, isFav) => toggleFavorite({ id, isFavorite: isFav })}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {/* Load More */}
              {isFetchingNextPage && (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-muted-foreground text-sm">
                    Carregando mais...
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      {isMobile && (
        <button
          onClick={() => setIsQuickCaptureOpen(true)}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/30 hover:bg-violet-600 transition-all z-50"
        >
          <Plus className="size-6" />
        </button>
      )}

      {/* Dialogs */}
      <QuickCaptureDialog
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onCreate={handleCreate}
      />

      <AISummarySheet
        item={selectedItem}
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
      />
    </div>
  );
}
