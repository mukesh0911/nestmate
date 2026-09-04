/**
 * Sprint 2E — Demo account quarantine helpers.
 *
 * Demo accounts created by the 1-click demo login are REAL auth users with
 * fabricated names/phone numbers. They must never appear in production
 * discovery, matching, or analytics aggregates as if they were real people.
 *
 * Detection is dual:
 *  - explicit `isDemo: true` field on the user doc (written at creation)
 *  - email prefix `demo.` (covers accounts created before the flag existed)
 *
 * Pure functions — no Firebase — fully unit-testable.
 */

export const DEMO_EMAIL_PREFIX = 'demo.';

/** True when the email belongs to an ephemeral demo account. */
export function isDemoEmail(email?: string | null): boolean {
    if (!email || typeof email !== 'string') return false;
    return email.toLowerCase().startsWith(DEMO_EMAIL_PREFIX);
}

/**
 * True when a user profile should be treated as a demo entity and excluded
 * from production marketplace surfaces (discovery, matching, map, analytics).
 */
export function isDemoProfile(p?: { isDemo?: boolean; email?: string } | null): boolean {
    if (!p) return false;
    return p.isDemo === true || isDemoEmail(p.email);
}