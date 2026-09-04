/**
 * Listing freshness & availability integrity (Sprint 2A).
 *
 * Single source of truth for availability semantics. A listing's
 * conceptual availability state is DERIVED, never stored as a new
 * enum, so no cron/migration is required:
 *
 *   available          → status 'active' AND confirmed within STALE_AFTER_DAYS
 *   needs_confirmation → status 'active' AND confirmed older than STALE_AFTER_DAYS
 *                        (still shown in discovery, with a stale indicator)
 *   expired            → status 'active' AND confirmed older than EXPIRES_AFTER_DAYS
 *                        (hidden from discovery)
 *   closed             → status 'closed' or 'filled' (owner said room is taken)
 *   paused             → owner paused visibility
 *
 * Freshness anchor: `lastConfirmedAt` = "the owner most recently confirmed
 * this room is still available". It is NOT equivalent to updatedAt (an edit
 * of a photo/description is not an availability confirmation) except for
 * LEGACY listings created before this feature, which fall back to
 * updatedAt ?? createdAt so valid old rooms do not silently disappear.
 */

export const FRESHNESS_CONFIG = {
    /** Days after confirmation before a listing is considered stale. */
    STALE_AFTER_DAYS: 14,
    /** Days after confirmation before a listing expires from discovery. */
    EXPIRES_AFTER_DAYS: 45,
} as const;

export type AvailabilityState =
    | 'available'
    | 'needs_confirmation'
    | 'expired'
    | 'closed'
    | 'paused';

/** Minimal shape needed — accepts Firestore Timestamps or millis numbers. */
export interface FreshnessListingLike {
    status?: string;
    lastConfirmedAt?: { toMillis?: () => number } | number | null;
    updatedAt?: { toMillis?: () => number } | null;
    createdAt?: { toMillis?: () => number } | null;
}

function toMillis(t: FreshnessListingLike['lastConfirmedAt']): number | null {
    if (t == null) return null;
    if (typeof t === 'number') return t;
    if (typeof t.toMillis === 'function') return t.toMillis();
    return null;
}

/** The effective freshness anchor (ms), with legacy fallback. */
export function getFreshnessAnchorMs(listing: FreshnessListingLike): number {
    return (
        toMillis(listing.lastConfirmedAt) ??
        toMillis(listing.updatedAt) ??
        toMillis(listing.createdAt) ??
        0
    );
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function getAvailabilityState(listing: FreshnessListingLike, now: number = Date.now()): AvailabilityState {
    const status = listing.status ?? 'active';
    if (status === 'closed' || status === 'filled') return 'closed';
    if (status === 'paused') return 'paused';
    if (status !== 'active') return 'paused'; // malformed/unknown → treat as not actively available

    const ageDays = (now - getFreshnessAnchorMs(listing)) / DAY_MS;
    if (ageDays >= FRESHNESS_CONFIG.EXPIRES_AFTER_DAYS) return 'expired';
    if (ageDays >= FRESHNESS_CONFIG.STALE_AFTER_DAYS) return 'needs_confirmation';
    return 'available';
}

/** May this listing appear in normal seeker discovery? */
export function isDiscoverable(listing: FreshnessListingLike, now: number = Date.now()): boolean {
    const s = getAvailabilityState(listing, now);
    return s === 'available' || s === 'needs_confirmation';
}

/** Human-readable label for UI badges (kept minimal by design). */
export function availabilityLabel(state: AvailabilityState): string {
    switch (state) {
        case 'available': return 'Available';
        case 'needs_confirmation': return 'Availability needs confirmation';
        case 'expired': return 'No longer available';
        case 'closed': return 'Room no longer available';
        case 'paused': return 'Paused by owner';
    }
}

/** "3 days ago" style relative time for the owner dashboard. */
export function formatRelativeDays(ms: number, now: number = Date.now()): string {
    const days = Math.floor((now - ms) / DAY_MS);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
}