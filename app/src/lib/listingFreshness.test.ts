import { describe, it, expect } from 'vitest';
import {
    FRESHNESS_CONFIG,
    getAvailabilityState,
    getFreshnessAnchorMs,
    isDiscoverable,
    availabilityLabel,
    formatRelativeDays,
    type FreshnessListingLike,
} from './listingFreshness';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000; // fixed "now" for determinism

const ts = (ms: number) => ({ toMillis: () => ms });

function listing(overrides: Partial<FreshnessListingLike> = {}): FreshnessListingLike {
    return {
        status: 'active',
        lastConfirmedAt: ts(NOW - 2 * DAY),
        createdAt: ts(NOW - 30 * DAY),
        updatedAt: ts(NOW - 1 * DAY),
        ...overrides,
    };
}

describe('listing freshness — state derivation', () => {
    it('brand-new listing (confirmed today) is available', () => {
        expect(getAvailabilityState(listing({ lastConfirmedAt: ts(NOW - 1000) }), NOW)).toBe('available');
    });

    it('listing confirmed within stale threshold is available', () => {
        const l = listing({ lastConfirmedAt: ts(NOW - (FRESHNESS_CONFIG.STALE_AFTER_DAYS - 1) * DAY) });
        expect(getAvailabilityState(l, NOW)).toBe('available');
    });

    it('listing confirmed beyond stale threshold needs confirmation', () => {
        const l = listing({ lastConfirmedAt: ts(NOW - (FRESHNESS_CONFIG.STALE_AFTER_DAYS + 1) * DAY) });
        expect(getAvailabilityState(l, NOW)).toBe('needs_confirmation');
    });

    it('listing confirmed beyond expiry threshold is expired', () => {
        const l = listing({ lastConfirmedAt: ts(NOW - (FRESHNESS_CONFIG.EXPIRES_AFTER_DAYS + 1) * DAY) });
        expect(getAvailabilityState(l, NOW)).toBe('expired');
    });

    it('owner never confirms → legacy fallback uses updatedAt, not createdAt', () => {
        // Legacy doc: no lastConfirmedAt. updatedAt recent → still available
        // even though createdAt is old (legacy rooms must not vanish).
        const legacy = { status: 'active', createdAt: ts(NOW - 400 * DAY), updatedAt: ts(NOW - 3 * DAY) };
        expect(getAvailabilityState(legacy, NOW)).toBe('available');

        // Legacy doc with nothing recent → falls back to createdAt and expires.
        const ancient = { status: 'active', createdAt: ts(NOW - 400 * DAY) };
        expect(getAvailabilityState(ancient, NOW)).toBe('expired');
    });

    it('closed and filled statuses map to closed regardless of timestamps', () => {
        expect(getAvailabilityState(listing({ status: 'closed' }), NOW)).toBe('closed');
        expect(getAvailabilityState(listing({ status: 'filled' }), NOW)).toBe('closed');
    });

    it('paused status maps to paused', () => {
        expect(getAvailabilityState(listing({ status: 'paused' }), NOW)).toBe('paused');
    });

    it('malformed/unknown status values are treated as not actively available', () => {
        expect(getAvailabilityState(listing({ status: 'weird-value' }), NOW)).toBe('paused');
        expect(isDiscoverable(listing({ status: 'weird-value' }), NOW)).toBe(false);
    });
});

describe('listing freshness — discovery behavior', () => {
    it('available and needs_confirmation listings are discoverable', () => {
        expect(isDiscoverable(listing(), NOW)).toBe(true);
        expect(isDiscoverable(listing({ lastConfirmedAt: ts(NOW - 20 * DAY) }), NOW)).toBe(true);
    });

    it('expired listings are NOT discoverable', () => {
        expect(isDiscoverable(listing({ lastConfirmedAt: ts(NOW - 60 * DAY) }), NOW)).toBe(false);
    });

    it('closed listings never appear in active discovery', () => {
        expect(isDiscoverable(listing({ status: 'closed' }), NOW)).toBe(false);
    });

    it('freshness anchor prefers lastConfirmedAt over updatedAt over createdAt', () => {
        const l = listing(); // lastConfirmedAt = NOW-2d, updatedAt = NOW-1d
        expect(getFreshnessAnchorMs(l)).toBe(NOW - 2 * DAY);
        expect(getFreshnessAnchorMs({ status: 'active', updatedAt: ts(NOW - 5 * DAY), createdAt: ts(NOW - 9 * DAY) }))
            .toBe(NOW - 5 * DAY);
    });
});

describe('listing freshness — UI helpers', () => {
    it('labels match product copy', () => {
        expect(availabilityLabel('available')).toBe('Available');
        expect(availabilityLabel('needs_confirmation')).toBe('Availability needs confirmation');
        expect(availabilityLabel('expired')).toBe('No longer available');
        expect(availabilityLabel('closed')).toBe('Room no longer available');
    });

    it('relative day formatting handles today/yesterday/N days', () => {
        expect(formatRelativeDays(NOW, NOW)).toBe('today');
        expect(formatRelativeDays(NOW - DAY, NOW)).toBe('yesterday');
        expect(formatRelativeDays(NOW - 7 * DAY, NOW)).toBe('7 days ago');
    });

    it('timezone-independent: uses absolute millis, not local date parsing', () => {
        // Anchor computed from millis only — shifting `now` across a timezone
        // boundary cannot change the derived state.
        const l = listing({ lastConfirmedAt: ts(NOW - 10 * DAY) });
        expect(getAvailabilityState(l, NOW + 5 * 60 * 60 * 1000)).toBe('available');
        expect(getAvailabilityState(l, NOW + 4 * DAY + 23 * 60 * 60 * 1000)).toBe('needs_confirmation');
    });
});