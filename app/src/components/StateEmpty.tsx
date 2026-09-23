import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StateEmptyProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
  titleClassName?: string;
  descriptionClassName?: string;
}

/** NestMate-styled empty state — consistent icon, refined title, muted copy, optional CTA. */
export default function StateEmpty({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
  titleClassName,
  descriptionClassName,
}: StateEmptyProps) {
  return (
    <div
      className={cn(
        'text-center page-transition',
        compact ? 'py-6' : 'py-10 sm:py-14',
        className
      )}
      role="status"
    >
      <div
        className={cn(
          'bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-3.5',
          compact ? 'w-12 h-12' : 'w-14 h-14'
        )}
      >
        <Icon className={cn(compact ? 'w-5 h-5' : 'w-6 h-6', 'text-ink/20')} aria-hidden />
      </div>
      <h3 className={cn('font-semibold text-ink mb-1.5', compact ? 'text-base' : 'text-base sm:text-lg', titleClassName)}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-xs sm:text-sm text-ink/50 max-w-sm mx-auto mb-4 leading-relaxed', descriptionClassName)}>{description}</p>
      )}
      {action && <div className="flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}
