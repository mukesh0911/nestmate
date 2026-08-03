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
}

/** NestMate-styled empty state — consistent icon, Lora title, muted copy, optional CTA. */
export default function StateEmpty({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: StateEmptyProps) {
  return (
    <div
      className={cn(
        'text-center page-transition',
        compact ? 'py-8' : 'py-12 sm:py-16',
        className
      )}
      role="status"
    >
      <div
        className={cn(
          'bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-4',
          compact ? 'w-14 h-14' : 'w-20 h-20 mb-5'
        )}
      >
        <Icon className={cn(compact ? 'w-6 h-6' : 'w-8 h-8', 'text-ink/20')} aria-hidden />
      </div>
      <h3 className={cn('font-display italic text-ink mb-2', compact ? 'text-lg' : 'text-xl')}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-ink/50 max-w-sm mx-auto mb-5 leading-relaxed">{description}</p>
      )}
      {action && <div className="flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}
