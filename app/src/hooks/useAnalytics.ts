/**
 * Sprint 2D — fire-and-forget analytics event logger.
 *
 * - Never throws, never blocks UI (all failures silently ignored).
 * - Validates every event via lib/analytics before writing.
 * - Writes ONLY whitelisted fields to `analyticsEvents`.
 */
import { useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { isDemoProfile } from '@/lib/demoUsers';
import {
    validateAnalyticsEvent,
    isContextSafe,
    shouldLogOnce,
    type AnalyticsEventInput,
} from '@/lib/analytics';

export function useAnalytics() {
    const { profile } = useAuth();
    const logEvent = useCallback(
        (input: AnalyticsEventInput, opts?: { dedupeKey?: string; dedupeWindowMs?: number }): void => {
            try {
                // Sprint 2E (P0): demo accounts never write production analytics
                // events — their activity would fabricate funnel metrics.
                if (isDemoProfile(profile as any)) return;
                if (opts?.dedupeKey && !shouldLogOnce(opts.dedupeKey, opts.dedupeWindowMs)) return;
                const valid = validateAnalyticsEvent(input);
                if (!valid) return; // invalid events are dropped, never written
                if (!isContextSafe(undefined)) return;
                // Fire-and-forget: analytics must never break the marketplace UX.
                addDoc(collection(db, 'analyticsEvents'), {
                    ...valid,
                    createdAt: serverTimestamp(),
                }).catch(() => { /* silent */ });
            } catch {
                /* silent — analytics must never throw into the UI */
            }
        },
        [profile]
    );

    return { logEvent };
}