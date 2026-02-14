import { Redirect } from "wouter";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { PlanorLogo } from "@/components/ui/planor-logo";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente que protege rotas autenticadas.
 * - Mostra loading enquanto verifica autenticação
 * - Redireciona para /login se não autenticado
 * - Renderiza children se autenticado
 * - NÃO redireciona automaticamente para outra rota se já autenticado
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  // Enquanto carrega, mostra spinner (sem redirecionar)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 loading-logo">
        <PlanorLogo size={48} />
        <div className="planor-loading-spinner" />
      </div>
    );
  }

  // Se não autenticado, redireciona para login
  if (!isAuthenticated) {
    return <Redirect to="/login" replace />;
  }

  // Se autenticado, renderiza a rota atual (sem redirecionar)
  return <>{children}</>;
}

/**
 * Componente para rotas públicas (login, landing).
 * - Mostra loading enquanto verifica autenticação
 * - Renderiza children normalmente
 * - NÃO redireciona automaticamente se autenticado
 */
export function PublicRoute({ children }: ProtectedRouteProps) {
  const { isLoading } = useSupabaseAuth();

  // Enquanto carrega, mostra spinner
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 loading-logo">
        <PlanorLogo size={48} />
        <div className="planor-loading-spinner" />
      </div>
    );
  }

  // Renderiza a rota atual (sem redirecionar baseado em auth)
  return <>{children}</>;
}

/**
 * Componente para rotas que devem redirecionar se já autenticado.
 * Usado apenas em /login para evitar que usuário logado veja a tela de login.
 */
export function GuestOnlyRoute({ children, redirectTo = "/app" }: ProtectedRouteProps & { redirectTo?: string }) {
  const { isAuthenticated, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 loading-logo">
        <PlanorLogo size={48} />
        <div className="planor-loading-spinner" />
      </div>
    );
  }

  // Se já autenticado, redireciona (apenas para rotas como /login)
  if (isAuthenticated) {
    return <Redirect to={redirectTo} replace />;
  }

  return <>{children}</>;
}
