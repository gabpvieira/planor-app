import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import TasksPage from "@/pages/TasksPage";
import NotesPage from "@/pages/NotesPage";
import AgendaPage from "@/pages/AgendaPage";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function AuthenticatedApp() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <Switch>
          <Route path="/app" component={Dashboard} />
          <Route path="/app/tasks" component={TasksPage} />
          <Route path="/app/notes" component={NotesPage} />
          <Route path="/app/agenda" component={AgendaPage} />
          {/* Placeholder for other modules */}
          <Route path="/app/workouts">Workouts (Coming Soon)</Route>
          <Route path="/app/nutrition">Nutrition (Coming Soon)</Route>
          <Route path="/app/habits">Habits (Coming Soon)</Route>
          <Route path="/app/goals">Goals (Coming Soon)</Route>
          <Route path="/app/finance">Finance (Coming Soon)</Route>
          <Route path="/app/knowledge">Knowledge (Coming Soon)</Route>
          <Route component={NotFound} />
        </Switch>
      </SidebarInset>
    </SidebarProvider>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to="/app" /> : <LandingPage />}
      </Route>
      
      {/* Protected Routes */}
      <Route path="/app/:rest*">
        {user ? <AuthenticatedApp /> : <Redirect to="/" />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
