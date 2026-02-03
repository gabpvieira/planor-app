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

const menuItems = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
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
  const { isCollapsed, setIsCollapsed } = useSidebarState();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <TooltipProvider delayDuration={400}>
      <aside
        className={cn(
          "planor-sidebar",
          isCollapsed && "planor-sidebar--collapsed"
        )}
        data-collapsed={isCollapsed}
      >
        {/* Header */}
        <div className="planor-sidebar__header">
          <div className="planor-sidebar__brand">
            <PlanorLogo size={120} />
          </div>
          
          <div className="planor-sidebar__header-actions">
            {!isCollapsed && <ThemeToggle />}
            <button
              onClick={toggleSidebar}
              className="planor-sidebar__toggle"
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
        <nav className="planor-sidebar__nav">
          {!isCollapsed && (
            <span className="planor-sidebar__section-label">MENU</span>
          )}
          
          <ul className="planor-sidebar__menu">
            {menuItems.map((item) => {
              const isActive = location === item.url;
              const Icon = item.icon;
              
              const menuButton = (
                <li key={item.title} className="planor-sidebar__menu-item">
                  <Link
                    href={item.url}
                    className={cn(
                      "planor-sidebar__menu-link",
                      isActive && "planor-sidebar__menu-link--active"
                    )}
                  >
                    {isActive && <span className="planor-sidebar__active-indicator" />}
                    <Icon
                      className={cn(
                        "planor-sidebar__menu-icon",
                        isActive && "planor-sidebar__menu-icon--active"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="planor-sidebar__menu-text">{item.title}</span>
                    )}
                  </Link>
                </li>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="planor-sidebar__tooltip"
                      sideOffset={12}
                    >
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
        <div className="planor-sidebar__footer">
          <div className="planor-sidebar__user">
            <Avatar className="planor-sidebar__avatar">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="planor-sidebar__avatar-fallback">
                {user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="planor-sidebar__user-info">
                <span className="planor-sidebar__user-name">
                  {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                </span>
                <span className="planor-sidebar__user-email">{user?.email}</span>
              </div>
            )}
          </div>

          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut()}
                  className="planor-sidebar__logout planor-sidebar__logout--collapsed"
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
              className="planor-sidebar__logout"
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
