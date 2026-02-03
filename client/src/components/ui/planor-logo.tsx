import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface PlanorLogoProps {
  /** Tamanho do logo em pixels */
  size?: number;
  /** Se deve mostrar apenas o ícone (modo colapsado) */
  iconOnly?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** Se deve mostrar o nome "Planor" ao lado do logo */
  showName?: boolean;
}

/**
 * Componente de Logo do Planor com alternância automática de tema
 * 
 * - Tema Claro: usa icon-png-black.png
 * - Tema Escuro: usa icon-png-white.png
 * 
 * Design System: Apple/macOS Premium
 */
export function PlanorLogo({ 
  size = 32, 
  iconOnly = false, 
  className,
  showName = false 
}: PlanorLogoProps) {
  const { resolvedTheme } = useTheme();
  
  // Seleciona o logo correto baseado no tema
  const logoSrc = resolvedTheme === "dark" 
    ? "/icon-png-white.png" 
    : "/icon-png-black.png";

  return (
    <div className={cn("planor-logo-container", className)}>
      <div 
        className="planor-logo"
        style={{ 
          width: size, 
          height: size,
          minWidth: size 
        }}
      >
        <img
          src={logoSrc}
          alt="Planor"
          className="planor-logo__image"
          width={size}
          height={size}
          draggable={false}
        />
      </div>
      
      {showName && !iconOnly && (
        <span className="planor-logo__name">Planor</span>
      )}
    </div>
  );
}

/**
 * Versão compacta do logo para uso em espaços reduzidos
 */
export function PlanorLogoIcon({ 
  size = 28, 
  className 
}: { 
  size?: number; 
  className?: string;
}) {
  return <PlanorLogo size={size} iconOnly className={className} />;
}
