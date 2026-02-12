import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarContext, SIDEBAR_STORAGE_KEY } from "@/hooks/use-sidebar";
import { PlanorLogo } from "@/components/ui/planor-logo";

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
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";

function AuthenticatedApp() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="flex min-h-screen" data-sidebar-collapsed={isCollapsed}>
        <AppSidebar />
        <main 
          className="flex-1 bg-background transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ 
            marginLeft: isCollapsed ? 'var(--sidebar-width-collapsed, 72px)' : 'var(--sidebar-width-expanded, 240px)' 
          }}
        >
          <Switch>
            <Route path="/app" component={Dashboard} />
            <Route path="/app/tasks" component={TasksPage} />
            <Route path="/app/notes" component={NotesPage} />
            <Route path="/app/agenda" component={AgendaPage} />
            <Route path="/app/workouts" component={WorkoutsPage} />
            <Route path="/app/habits" component={HabitsPage} />
            <Route path="/app/goals" component={GoalsPage} />
            <Route path="/app/finance" component={FinancePage} />
            <Route path="/app/command" component={CommandCenterPage} />
            {/* Placeholder for other modules */}
            <Route path="/app/nutrition">
              <div className="p-8 text-muted-foreground">Nutrição (Em Breve)</div>
            </Route>
            <Route path="/app/knowledge">
              <div className="p-8 text-muted-foreground">Conhecimento (Em Breve)</div>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

function Router() {
  const { user, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 loading-logo">
        <PlanorLogo size={48} />
        <div className="planor-loading-spinner" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/">
        {user ? <Redirect to="/app" /> : <LandingPage />}
      </Route>
      
      <Route path="/login">
        {user ? <Redirect to="/app" /> : <LoginPage />}
      </Route>
      
      {/* Protected Routes - Must be authenticated */}
      <Route path="/app">
        {user ? <AuthenticatedApp /> : <Redirect to="/login" />}
      </Route>

      <Route path="/app/:rest*">
        {user ? <AuthenticatedApp /> : <Redirect to="/login" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="planor-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
