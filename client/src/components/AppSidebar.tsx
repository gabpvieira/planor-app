import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Dumbbell,
  Utensils,
  TrendingUp,
  Target,
  DollarSign,
  BookOpen,
  StickyNote,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlanorLogo } from "@/components/ui/planor-logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSidebarState } from "@/hooks/use-sidebar";
import { useEffect } from "react";

const menuItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Command Center", url: "/app/command", icon: Sparkles, highlight: true },
  { title: "Agenda", url: "/app/agenda", icon: Calendar },
  { title: "Tarefas", url: "/app/tasks", icon: CheckSquare },
  { title: "Treinos", url: "/app/workouts", icon: Dumbbell },
  { title: "Nutrição", url: "/app/nutrition", icon: Utensils },
  { title: "Hábitos", url: "/app/habits", icon: TrendingUp },
  { title: "Metas", url: "/app/goals", icon: Target },
  { title: "Finanças", url: "/app/finance", icon: DollarSign },
  { title: "Conhecimento", url: "/app/knowledge", icon: BookOpen },
  { title: "Notas", url: "/app/notes", icon: StickyNote },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, signOut } = useSupabaseAuth();
  const { isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen } = useSidebarState();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileMenu = () => setIsMobileMenuOpen?.(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen?.(false);

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu();
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <TooltipProvider delayDuration={400}>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-[60] p-2.5 rounded-xl bg-background/95 backdrop-blur-sm border border-border shadow-lg hover:bg-accent transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-[45] backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Base styles
          "fixed top-0 left-0 h-full bg-background border-r border-border flex flex-col",
          // Desktop styles
          "md:z-auto",
          isCollapsed ? "md:w-[72px]" : "md:w-[240px]",
          // Mobile styles
          "w-[280px] z-[50]",
          "transition-transform duration-300 ease-out",
          // Mobile visibility
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Shadow
          "shadow-2xl md:shadow-none"
        )}
        data-collapsed={isCollapsed}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center border-b border-border",
          isCollapsed ? "md:justify-center md:p-3" : "justify-between p-4"
        )}>
          <div className="flex items-center gap-3">
            {/* Mobile: always show logo */}
            <div className="md:hidden">
              <PlanorLogo size={100} />
            </div>
            {/* Desktop: conditional logo */}
            <div className="hidden md:block">
              {isCollapsed ? (
                <img 
                  src="/favoricon.png" 
                  alt="Planor" 
                  className="w-8 h-8"
                />
              ) : (
                <PlanorLogo size={100} />
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isCollapsed && <div className="hidden md:block"><ThemeToggle /></div>}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-accent transition-colors"
              aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {isCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {/* Section Label */}
          {(!isCollapsed || isMobile) && (
            <span className="block px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              MENU
            </span>
          )}
          
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location === item.url;
              const Icon = item.icon;
              
              const menuButton = (
                <li key={item.title}>
                  <Link
                    href={item.url}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      "hover:bg-accent/50",
                      isActive && "bg-primary/10 text-primary font-medium",
                      !isActive && "text-foreground/70 hover:text-foreground",
                      isCollapsed && !isMobile && "justify-center"
                    )}
                  >
                    <Icon className={cn(
                      "size-5 shrink-0",
                      isActive && "text-primary"
                    )} />
                    {(!isCollapsed || isMobile) && (
                      <span className="text-sm">{item.title}</span>
                    )}
                  </Link>
                </li>
              );

              // Show tooltip only on desktop when collapsed
              if (isCollapsed && !isMobile) {
                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return menuButton;
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-3">
          {/* User Info */}
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && !isMobile && "justify-center"
          )}>
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                {user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          {isCollapsed && !isMobile ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                  aria-label="Sair"
                >
                  <LogOut className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Sair
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-sm font-medium"
            >
              <LogOut className="size-4" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

export { AppSidebar as Sidebar };
