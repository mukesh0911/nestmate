import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Tailwind max-width class. Default max-w-7xl for dashboards; use max-w-3xl for narrow pages. */
  maxWidth?: string;
  className?: string;
  /** Extra bottom padding for mobile nav clearance on pages that need it. */
  withBottomNavPad?: boolean;
}

/** Consistent page chrome: padding, max-width, optional title row, subtle enter motion. */
export default function PageShell({
  children,
  title,
  subtitle,
  actions,
  maxWidth = 'max-w-7xl',
  className,
  withBottomNavPad = false,
}: PageShellProps) {
  return (
    <div
      className={cn(
        'min-h-[calc(100vh-60px)] bg-parchment page-transition',
        withBottomNavPad && 'pb-4',
        className
      )}
    >
      <div className={cn(maxWidth, 'mx-auto px-4 sm:px-6 py-6')}>
        {(title || actions) && (
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              {/* Sprint 5C: sans voice for page headings */}
              {title && <h1 className="type-h2 text-ink">{title}</h1>}
              {subtitle && <p className="text-sm text-ink/50 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}