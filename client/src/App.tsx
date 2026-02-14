import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarContext, SIDEBAR_STORAGE_KEY } from "@/hooks/use-sidebar";
import { ProtectedRoute, PublicRoute, GuestOnlyRoute } from "@/components/ProtectedRoute";
import { QuickCommand, useQuickCommand } from "@/components/QuickCommand";
import { cn } from "@/lib/utils";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import TasksPage from "@/pages/TasksPage";
import NotesPage from "@/pages/NotesPage";
import AgendaPage from "@/pages/AgendaPage";
import HabitsPage from "@/pages/HabitsPage";
import WorkoutsPage from "@/pages/WorkoutsPage";
import FinancePage from "@/pages/FinancePage";
import GoalsPage from "@/pages/GoalsPage";
import CommandCenterPage from "@/pages/CommandCenterPage";
import SettingsPage from "@/pages/SettingsPage";
import KnowledgePage from "@/pages/KnowledgePage";
import NutritionPage from "@/pages/NutritionPage";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

function AuthenticatedLayout({ children, fullWidth = false }: { children: React.ReactNode; fullWidth?: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    }
    return false;
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const quickCommand = useQuickCommand();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen }}>
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background" data-sidebar-collapsed={isCollapsed}>
        <AppSidebar />
        {/* Main content - no margin on mobile (sidebar is overlay), margin on desktop */}
        <main 
          className={cn(
            "flex-1 w-full min-w-0",
            "transition-[margin-left] duration-300 ease-out",
            // Mobile: no margin (sidebar is overlay drawer)
            "ml-0",
            // Desktop: margin based on sidebar state
            isCollapsed ? "md:ml-[72px]" : "md:ml-[260px]"
          )}
        >
          {fullWidth ? (
            // Full width layout (for Command Center, etc.)
            <div className="w-full min-h-screen">
              {children}
            </div>
          ) : (
            // Standard layout with padding and max-width
            <div className="w-full min-h-screen px-4 py-6 md:px-8 lg:px-10">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </div>
          )}
        </main>
        
        {/* Quick Command Modal (CMD+K) */}
        <QuickCommand isOpen={quickCommand.isOpen} onClose={quickCommand.close} />
      </div>
    </SidebarContext.Provider>
  );
}

function ProtectedPage({ children, fullWidth = false }: { children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout fullWidth={fullWidth}>
        {children}
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="planor-theme">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/">
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            </Route>
            
            <Route path="/login">
              <GuestOnlyRoute redirectTo="/app">
                <LoginPage />
              </GuestOnlyRoute>
            </Route>
            
            <Route path="/app">
              <ProtectedPage><Dashboard /></ProtectedPage>
            </Route>

            <Route path="/app/tasks">
              <ProtectedPage><TasksPage /></ProtectedPage>
            </Route>

            <Route path="/app/notes">
              <ProtectedPage><NotesPage /></ProtectedPage>
            </Route>

            <Route path="/app/agenda">
              <ProtectedPage><AgendaPage /></ProtectedPage>
            </Route>

            <Route path="/app/workouts">
              <ProtectedPage><WorkoutsPage /></ProtectedPage>
            </Route>

            <Route path="/app/habits">
              <ProtectedPage><HabitsPage /></ProtectedPage>
            </Route>

            <Route path="/app/goals">
              <ProtectedPage><GoalsPage /></ProtectedPage>
            </Route>

            <Route path="/app/finance">
              <ProtectedPage><FinancePage /></ProtectedPage>
            </Route>

            <Route path="/app/command">
              <ProtectedPage fullWidth><CommandCenterPage /></ProtectedPage>
            </Route>

            <Route path="/app/nutrition">
              <ProtectedPage><NutritionPage /></ProtectedPage>
            </Route>

            <Route path="/app/knowledge">
              <ProtectedPage><KnowledgePage /></ProtectedPage>
            </Route>

            <Route path="/app/settings">
              <ProtectedPage><SettingsPage /></ProtectedPage>
            </Route>

            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
