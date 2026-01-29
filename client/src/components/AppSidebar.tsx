import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
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
  User,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
  { title: "Dashboard", url: "/app", icon: LayoutDashboard },
  { title: "Agenda", url: "/app/agenda", icon: Calendar },
  { title: "Tasks", url: "/app/tasks", icon: CheckSquare },
  { title: "Workouts", url: "/app/workouts", icon: Dumbbell },
  { title: "Nutrition", url: "/app/nutrition", icon: Utensils },
  { title: "Habits", url: "/app/habits", icon: TrendingUp },
  { title: "Goals", url: "/app/goals", icon: Target },
  { title: "Finance", url: "/app/finance", icon: DollarSign },
  { title: "Knowledge", url: "/app/knowledge", icon: BookOpen },
  { title: "Notes", url: "/app/notes", icon: StickyNote },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-primary-foreground font-bold text-lg">P</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Planor</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/70 font-medium px-2 py-2 text-xs uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    className="gap-3 h-10 rounded-lg transition-all hover:bg-muted active:scale-[0.98]"
                  >
                    <Link href={item.url} className={location === item.url ? "text-primary font-semibold" : "text-muted-foreground"}>
                      <item.icon className={`size-5 ${location === item.url ? "stroke-[2.5px]" : "stroke-2"}`} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40">
        <div className="flex items-center gap-3 mb-4 px-2">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md transition-colors"
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
