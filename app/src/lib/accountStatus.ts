/**
 * Account moderation status helpers — mirrors the `status` field on
 * users/{uid} written by admin suspend/ban actions and enforced by
 * firestore.rules (isActiveUser()).
 *
 * Legacy documents without a `status` field are treated as active.
 */

export type AccountStatus = 'active' | 'suspended' | 'banned' | string;

export const BLOCKED_STATUSES: ReadonlySet<string> = new Set(['suspended', 'banned']);

/** True when the account may use marketplace features. */
export function isAccountActive(status?: AccountStatus | null): boolean {
    if (!status) return true; // legacy docs / missing field
    return !BLOCKED_STATUSES.has(status);
}

/** Human-readable explanation for a blocked status (UI copy). */
export function blockedStatusMessage(status?: AccountStatus | null): string | null {
    switch (status) {
        case 'suspended':
            return 'Your account has been temporarily suspended. You can browse but not interact with listings or members. Contact support if you believe this is a mistake.';
        case 'banned':
            return 'Your account has been banned for violating our community guidelines. Contact support to appeal.';
        default:
            return null;
    }
}