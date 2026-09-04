import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    validateAnalyticsEvent,
    isContextSafe,
    computeFunnelRates,
    computeNoResultRate,
    computeAverageResults,
    aggregateByCity,
    computeSupplyMetrics,
    shouldLogOnce,
    computeMarketplaceMetrics,
    ANALYTICS_EVENTS,
} from './analytics';
import type { AnalyticsEventDoc } from './analytics';

describe('event validation', () => {
    it('accepts a valid event', () => {
        const e = validateAnalyticsEvent({ name: 'search_performed', actorId: 'u1', city: 'Chennai', resultCount: 5 });
        expect(e).not.toBeNull();
        expect(e!.name).toBe('search_performed');
    });

    it('rejects unknown event names', () => {
        expect(validateAnalyticsEvent({ name: 'hack_the_db', actorId: 'u1' })).toBeNull();
    });

    it('rejects missing/empty actor', () => {
        expect(validateAnalyticsEvent({ name: 'search_performed', actorId: '' })).toBeNull();
        expect(validateAnalyticsEvent({ name: 'search_performed', actorId: undefined as any })).toBeNull();
    });

    it('rejects oversized fields and negative resultCount', () => {
        expect(validateAnalyticsEvent({ name: 'interest_sent', actorId: 'u1', entityId: 'x'.repeat(200) })).toBeNull();
        expect(validateAnalyticsEvent({ name: 'interest_sent', actorId: 'u1', resultCount: -1 })).toBeNull();
        expect(validateAnalyticsEvent({ name: 'interest_sent', actorId: 'u1', city: '' })).toBeNull();
    });

    it('exposes a closed taxonomy', () => {
        expect(ANALYTICS_EVENTS).toContain('contact_shared');
        expect(ANALYTICS_EVENTS).not.toContain('password_entered');
    });
});

describe('privacy restrictions', () => {
    it('flags contexts containing PII keys as unsafe', () => {
        expect(isContextSafe({ phone: '99999' })).toBe(false);
        expect(isContextSafe({ message: 'hello' })).toBe(false);
        expect(isContextSafe({ address: '12 Main St' })).toBe(false);
        expect(isContextSafe({ city: 'Chennai' })).toBe(true);
        expect(isContextSafe(undefined)).toBe(true);
    });
});

describe('funnel calculations — never fabricated', () => {
    it('returns null rates when denominators are zero', () => {
        const r = computeFunnelRates({});
        expect(Object.values(r).every(v => v === null)).toBe(true);
    });

    it('computes real conversion rates from real counts', () => {
        const r = computeFunnelRates({
            searches: 100, listingViews: 40, interestsSent: 10,
            connectionsCreated: 5, chatsStarted: 4, contactShares: 2,
        });
        expect(r.searchToView).toBe(40);
        expect(r.viewToInterest).toBe(25);
        expect(r.interestToConnection).toBe(50);
        expect(r.connectionToChat).toBe(80);
        expect(r.chatToContactShare).toBe(50);
    });
});

describe('discovery metrics', () => {
    it('no-result rate is null with zero searches', () => {
        expect(computeNoResultRate(0, 0)).toBeNull();
    });
    it('no-result rate computes correctly', () => {
        expect(computeNoResultRate(20, 5)).toBe(25);
    });
    it('average results is null with zero searches, else rounded to 1dp', () => {
        expect(computeAverageResults(30, 0)).toBeNull();
        expect(computeAverageResults(31, 3)).toBe(10.3);
    });
});

describe('city aggregation', () => {
    it('aggregates counts by city and skips missing cities', () => {
        const map = aggregateByCity([
            { city: 'Chennai' }, { city: ' Chennai ' }, { city: 'Mumbai' }, {}, { city: '  ' },
        ]);
        expect(map['Chennai']).toBe(2);
        expect(map['Mumbai']).toBe(1);
        expect(Object.keys(map)).toHaveLength(2);
    });
});

describe('supply metrics', () => {
    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const listings = [
        { id: 'a', status: 'active', lastConfirmedAt: now - 1 * DAY },   // fresh
        { id: 'b', status: 'active', lastConfirmedAt: now - 20 * DAY },  // stale
        { id: 'c', status: 'active', lastConfirmedAt: now - 60 * DAY },  // expired → closed bucket
        { id: 'd', status: 'closed' },
        { id: 'e', status: 'active', lastConfirmedAt: now - 2 * DAY },   // fresh
    ];
    it('classifies freshness correctly using Sprint 2A semantics', () => {
        const m = computeSupplyMetrics(listings, {}, now);
        expect(m.total).toBe(5);
        expect(m.active).toBe(3);
        expect(m.fresh).toBe(2);
        expect(m.stale).toBe(1);
        expect(m.closed).toBe(2);
    });
    it('counts zero-interest listings and average interest honestly', () => {
        const m = computeSupplyMetrics(listings, { a: 2, b: 0, e: 1 }, now);
        expect(m.zeroInterest).toBe(1); // only b
        expect(m.avgInterestPerActiveListing).toBe(1);
    });
    it('avgInterest is null when no active supply', () => {
        const m = computeSupplyMetrics([{ id: 'z', status: 'closed' }], {}, now);
        expect(m.avgInterestPerActiveListing).toBeNull();
    });
});

describe('computeMarketplaceMetrics', () => {
    const NOW = 1_800_000_000_000;
    const DAY = 24 * 60 * 60 * 1000;

    const ev = (name: string, at: number | null, extra: Partial<AnalyticsEventDoc> = {}): AnalyticsEventDoc => ({
        name,
        actorId: 'u1',
        ...(at !== null ? { at } : {}),
        ...extra,
    });

    it('counts events by name within the window', () => {
        const events = [
            ev('search_performed', NOW - DAY, { resultCount: 5 }),
            ev('search_performed', NOW - 2 * DAY, { resultCount: 0 }),
            ev('listing_viewed', NOW - DAY),
            ev('interest_sent', NOW - DAY),
            ev('interest_accepted', NOW - DAY),
            ev('chat_started', NOW - DAY),
            ev('contact_shared', NOW - DAY),
            ev('listing_created', NOW - DAY),
            ev('availability_confirmed', NOW - DAY),
        ];
        const m = computeMarketplaceMetrics(events, NOW, 30);
        expect(m.searches).toBe(2);
        expect(m.zeroResultSearches).toBe(1);
        expect(m.listingViews).toBe(1);
        expect(m.interestSent).toBe(1);
        expect(m.interestAccepted).toBe(1);
        expect(m.chatsStarted).toBe(1);
        expect(m.contactsShared).toBe(1);
        expect(m.listingsCreated).toBe(1);
        expect(m.availabilityConfirmed).toBe(1);
    });

    it('excludes events older than the window', () => {
        const events = [
            ev('search_performed', NOW - 31 * DAY),
            ev('listing_viewed', NOW - 29 * DAY),
        ];
        const m = computeMarketplaceMetrics(events, NOW, 30);
        expect(m.searches).toBe(0);
        expect(m.listingViews).toBe(1);
    });

    it('returns null acceptRate when no interests were sent (never fabricates)', () => {
        const m = computeMarketplaceMetrics([ev('listing_viewed', NOW)], NOW, 30);
        expect(m.acceptRate).toBeNull();
    });

    it('computes accept rate as a rounded percentage', () => {
        const events = [
            ev('interest_sent', NOW), ev('interest_sent', NOW),
            ev('interest_accepted', NOW),
        ];
        const m = computeMarketplaceMetrics(events, NOW, 30);
        expect(m.acceptRate).toBe(50);
    });

    it('aggregates top cities from search events only, descending', () => {
        const events = [
            ev('search_performed', NOW, { city: 'Chennai' }),
            ev('search_performed', NOW, { city: 'Chennai' }),
            ev('search_performed', NOW, { city: 'Mumbai' }),
            ev('listing_viewed', NOW, { city: 'Delhi' }), // not a search — excluded
        ];
        const m = computeMarketplaceMetrics(events, NOW, 30);
        expect(m.topCities[0]).toEqual(['Chennai', 2]);
        expect(m.topCities).toHaveLength(2);
    });

    it('handles empty input with zero counts and null rates', () => {
        const m = computeMarketplaceMetrics([], NOW, 30);
        expect(m.searches).toBe(0);
        expect(m.acceptRate).toBeNull();
        expect(m.topCities).toEqual([]);
    });
});

describe('idempotency (duplicate protection)', () => {
    beforeEach(() => vi.restoreAllMocks());
    it('logs once per key within the window, then suppresses', () => {
        const t0 = 1_000_000;
        expect(shouldLogOnce('chat:r1', 30_000, t0)).toBe(true);
        expect(shouldLogOnce('chat:r1', 30_000, t0 + 1000)).toBe(false);
        expect(shouldLogOnce('chat:r1', 30_000, t0 + 31_000)).toBe(true); // window elapsed
    });
    it('different keys are independent', () => {
        const t0 = 2_000_000;
        expect(shouldLogOnce('k1', 30_000, t0)).toBe(true);
        expect(shouldLogOnce('k2', 30_000, t0)).toBe(true);
    });
});