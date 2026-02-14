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
  Settings,
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { PlanorLogo } from "@/components/ui/planor-logo";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSidebarState } from "@/hooks/use-sidebar";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Menu items organizados por categoria
const menuGroups = [
  {
    label: "GERAL",
    items: [
      { title: "Command Center", url: "/app/command", icon: Sparkles, isCommandCenter: true },
      { title: "Dashboard", url: "/app", icon: LayoutDashboard },
      { title: "Agenda", url: "/app/agenda", icon: Calendar },
    ],
  },
  {
    label: "GESTÃO",
    items: [
      { title: "Tarefas", url: "/app/tasks", icon: CheckSquare },
      { title: "Metas", url: "/app/goals", icon: Target },
      { title: "Hábitos", url: "/app/habits", icon: TrendingUp },
    ],
  },
  {
    label: "SAÚDE",
    items: [
      { title: "Treinos", url: "/app/workouts", icon: Dumbbell },
      { title: "Nutrição", url: "/app/nutrition", icon: Utensils },
    ],
  },
  {
    label: "FINANÇAS",
    items: [
      { title: "Finanças", url: "/app/finance", icon: DollarSign },
    ],
  },
  {
    label: "CONHECIMENTO",
    items: [
      { title: "Conhecimento", url: "/app/knowledge", icon: BookOpen },
      { title: "Notas", url: "/app/notes", icon: StickyNote },
    ],
  },
];

// Variantes de animação para stagger
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const groupVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export function AppSidebar() {
  const [location] = useLocation();
  const { user, signOut } = useSupabaseAuth();
  const { isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen } = useSidebarState();
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileMenu = () => setIsMobileMenuOpen?.(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen?.(false);

  // Marcar que a animação inicial já ocorreu
  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 1000);
    return () => clearTimeout(timer);
  }, []);

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

  // Check if we're on mobile - reactive
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <TooltipProvider delayDuration={400}>
      {/* Mobile Menu Button - Hidden when menu is open */}
      <button
        onClick={toggleMobileMenu}
        className={cn(
          "md:hidden fixed top-[38px] left-4 z-[60] p-2 rounded-xl bg-background/80 backdrop-blur-xl border border-border shadow-lg hover:bg-accent transition-all duration-300",
          isMobileMenuOpen && "opacity-0 pointer-events-none"
        )}
        aria-label="Toggle menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/60 z-[45] backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile ? (isMobileMenuOpen ? 0 : -320) : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 35,
        }}
        className={cn(
          // Base styles - macOS Sonoma style
          "fixed flex flex-col",
          // Translucent background with blur - theme aware
          "bg-background/90 backdrop-blur-2xl",
          // Mobile: flutuante com bordas redondas
          "md:top-0 md:left-0 md:h-full md:rounded-none",
          "top-3 left-3 bottom-3 rounded-2xl",
          // Border
          "border border-border/30 md:border-r md:border-y-0 md:border-l-0",
          // Desktop styles
          "md:z-auto",
          isCollapsed ? "md:w-[72px]" : "md:w-[260px]",
          // Mobile styles
          "w-[280px] z-[50]",
          // Desktop transition only
          "md:transition-all md:duration-300 md:ease-out",
          // Shadow
          "shadow-2xl shadow-black/20"
        )}
        data-collapsed={isCollapsed}
      >
        {/* Header - Logo and close button */}
        <div className={cn(
          "flex items-center px-4 py-3",
          isCollapsed && "md:justify-center md:px-3 md:py-2"
        )}>
          {/* Mobile: Close button + Logo side by side */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-xl bg-background/50 border border-border/50 hover:bg-accent transition-all duration-200"
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>
            <div className="drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <PlanorLogo size={90} />
            </div>
          </div>
          {/* Desktop: conditional logo */}
          <div className="hidden md:block">
            {isCollapsed ? (
              <img 
                src="/favoricon.png" 
                alt="Planor" 
                className="w-8 h-8 drop-shadow-[0_0_10px_rgba(59,130,246,0.4)]"
              />
            ) : (
              <div className="drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <PlanorLogo size={100} />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 pb-4">
          <motion.div
            variants={containerVariants}
            initial={hasAnimated ? "visible" : "hidden"}
            animate="visible"
            className="space-y-1"
          >
            {menuGroups.map((group, groupIndex) => (
              <motion.div 
                key={group.label} 
                variants={groupVariants}
                className="mb-2"
              >
                {/* Section Label */}
                {(!isCollapsed || isMobile) && (
                  <motion.span 
                    variants={itemVariants}
                    className={cn(
                      "block px-3 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest",
                      groupIndex > 0 && "mt-4"
                    )}
                  >
                    {group.label}
                  </motion.span>
                )}
                
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location === item.url;
                    const Icon = item.icon;
                    
                    const menuButton = (
                      <motion.li key={item.title} variants={itemVariants}>
                        <Link
                          href={item.url}
                          className={cn(
                            "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                            // Estado normal
                            "text-muted-foreground hover:bg-accent hover:text-foreground",
                            // Estado ativo
                            isActive && "bg-accent text-foreground",
                            isCollapsed && !isMobile && "justify-center"
                          )}
                        >
                          {/* Pílula indicadora de seleção */}
                          {isActive && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-full"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          
                          {/* Ícone com estilo especial para Command Center */}
                          {item.isCommandCenter ? (
                            <div className="relative">
                              <Icon 
                                className={cn(
                                  "w-5 h-5 shrink-0",
                                  isActive ? "text-foreground" : "text-transparent"
                                )} 
                                strokeWidth={1.5}
                                style={{
                                  background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                                  WebkitBackgroundClip: "text",
                                  backgroundClip: "text",
                                  stroke: isActive ? "currentColor" : "url(#commandGradient)",
                                }}
                              />
                              <svg width="0" height="0">
                                <defs>
                                  <linearGradient id="commandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                  </linearGradient>
                                </defs>
                              </svg>
                              <Icon 
                                className="w-5 h-5 shrink-0 absolute inset-0"
                                strokeWidth={1.5}
                                stroke="url(#commandGradient)"
                              />
                            </div>
                          ) : (
                            <Icon 
                              className={cn(
                                "w-5 h-5 shrink-0",
                                isActive && "text-foreground"
                              )} 
                              strokeWidth={1.5}
                            />
                          )}
                          
                          {(!isCollapsed || isMobile) && (
                            <span className="text-sm font-medium">{item.title}</span>
                          )}
                        </Link>
                      </motion.li>
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
              </motion.div>
            ))}
          </motion.div>
        </nav>

        {/* Footer - User Profile Card */}
        <div className="p-4 space-y-3">
          {/* Theme Toggle */}
          <div className={cn(
            "flex items-center justify-between px-3 py-2 rounded-lg",
            isCollapsed && !isMobile && "justify-center px-0"
          )}>
            {(!isCollapsed || isMobile) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                {isDark ? <Moon className="w-4 h-4" strokeWidth={1.5} /> : <Sun className="w-4 h-4" strokeWidth={1.5} />}
                <span className="text-sm">Modo escuro</span>
              </div>
            )}
            {isCollapsed && !isMobile ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Switch
                      checked={isDark}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  Modo escuro
                </TooltipContent>
              </Tooltip>
            ) : (
              <Switch
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className="data-[state=checked]:bg-blue-500"
              />
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "hidden md:flex items-center gap-2 w-full px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200",
              isCollapsed && "justify-center"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-sm">Recolher menu</span>
              </>
            )}
          </button>

          {/* User Profile Card - Link to Settings */}
          <Link href="/app/settings">
            <motion.div
              className={cn(
                "relative rounded-xl p-3 transition-all duration-300 cursor-pointer",
                "bg-accent/50 hover:bg-accent",
                "border border-border/50",
                isCollapsed && !isMobile && "p-2"
              )}
              onMouseEnter={() => setIsProfileHovered(true)}
              onMouseLeave={() => setIsProfileHovered(false)}
            >
              <div className={cn(
                "flex items-center gap-3",
                isCollapsed && !isMobile && "justify-center"
              )}>
                <Avatar className="size-9 shrink-0 ring-2 ring-border">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                    {user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {(!isCollapsed || isMobile) && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                      </p>
                      <AnimatePresence>
                        {isProfileHovered && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Settings className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </Link>

          {/* Logout Button */}
          <div className="mt-3">
            {isCollapsed && !isMobile ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                    aria-label="Sair"
                  >
                    <LogOut className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  Sair
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 text-sm font-medium"
              >
                <LogOut className="w-5 h-5" strokeWidth={1.5} />
                <span>Sair</span>
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

export { AppSidebar as Sidebar };
