import type { ReactNode } from 'react';

/**
 * Sprint 5A — Badge primitive.
 *
 * ONE visual shape for every status/trust chip in the product.
 * Variants map to semantic meaning only:
 *   teal        → verified trust facts (never decorative)
 *   success     → positive lifecycle status (active, available)
 *   warning     → attention status (pending review, stale)
 *   destructive → negative status (rejected, banned)
 *   fire/navy/gold → brand accents used sparingly
 *   neutral     → metadata chips
 *
 * This component presents EXISTING truthful signals. It must never be
 * used to fabricate trust claims.
 */

export type BadgeVariant =
    | 'neutral'
    | 'fire'
    | 'navy'
    | 'teal'
    | 'gold'
    | 'success'
    | 'warning'
    | 'destructive';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
    neutral: 'badge-neutral',
    fire: 'badge-fire',
    navy: 'badge-navy',
    teal: 'badge-teal',
    gold: 'badge-gold',
    success: 'badge-success',
    warning: 'badge-warning',
    destructive: 'badge-destructive',
};

interface BadgeProps {
    variant?: BadgeVariant;
    /** Optional leading icon (Lucide component instance). */
    icon?: ReactNode;
    size?: 'sm' | 'md';
    className?: string;
    children: ReactNode;
}

export default function Badge({
    variant = 'neutral',
    icon,
    size = 'md',
    className = '',
    children,
}: BadgeProps) {
    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : '';
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-medium ${VARIANT_CLASSES[variant]} ${sizeClass} ${className}`}
        >
            {icon}
            {children}
        </span>
    );
}