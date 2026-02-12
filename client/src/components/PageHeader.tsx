import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn(
      "flex flex-col gap-4 mb-6 sm:mb-8",
      // Add padding on mobile to avoid hamburger menu overlap
      "pt-16 md:pt-0",
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground break-words">
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
