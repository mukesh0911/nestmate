/**
 * Sprint 2D — lightweight, privacy-conscious product measurement.
 *
 * Pure helpers only (no Firebase) so everything is unit-testable.
 * Design rules:
 *  - NEVER fabricate a metric: rates are null when the denominator is 0.
 *  - NEVER store PII: no phone numbers, message text, addresses, tokens.
 *  - Events are small, validated, and admin-read-only (see firestore.rules).
 */

/** Allowed event names — anything else is rejected. */
export const ANALYTICS_EVENTS = [
    'search_performed',
    'listing_viewed',
    'interest_sent',
    'interest_accepted',
    'interest_rejected',
    'connection_created',
    'chat_started',
    'contact_shared',
    'listing_created',
    'listing_closed',
    'availability_confirmed',
    'match_explanation_viewed',
] as const;

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[number];

export interface AnalyticsEventInput {
    name: string;
    actorId: string;
    entityId?: string;
    city?: string;
    resultCount?: number;
}

export interface ValidatedAnalyticsEvent {
    name: AnalyticsEventName;
    actorId: string;
    entityId?: string;
    city?: string;
    resultCount?: number;
}

const MAX_ID_LEN = 128;
const MAX_CITY_LEN = 64;

/**
 * Validate an event before it is written. Returns null for invalid events
 * (wrong name, missing actor, oversized fields, non-numeric resultCount).
 */
export function validateAnalyticsEvent(input: AnalyticsEventInput): ValidatedAnalyticsEvent | null {
    if (!input || typeof input !== 'object') return null;
    const { name, actorId } = input;

    if (!(ANALYTICS_EVENTS as readonly string[]).includes(name)) return null;
    if (!actorId || typeof actorId !== 'string' || actorId.length > MAX_ID_LEN) return null;

    const out: ValidatedAnalyticsEvent = { name: name as AnalyticsEventName, actorId };

    if (input.entityId != null) {
        if (typeof input.entityId !== 'string' || input.entityId.length > MAX_ID_LEN) return null;
        out.entityId = input.entityId;
    }
    if (input.city != null) {
        if (typeof input.city !== 'string' || input.city.length === 0 || input.city.length > MAX_CITY_LEN) return null;
        out.city = input.city.trim();
    }
    if (input.resultCount != null) {
        if (typeof input.resultCount !== 'number' || !Number.isFinite(input.resultCount) || input.resultCount < 0) return null;
        out.resultCount = Math.floor(input.resultCount);
    }
    return out;
}

/** Fields that must never appear in an analytics event document. */
const FORBIDDEN_FIELDS = ['phone', 'phoneNumber', 'email', 'password', 'token', 'text', 'message', 'address', 'idDocument', 'documentUrl'];

/** Defense-in-depth: reject any context object containing forbidden PII keys. */
export function isContextSafe(context: Record<string, unknown> | undefined): boolean {
    if (!context) return true;
    return !Object.keys(context).some(k => FORBIDDEN_FIELDS.includes(k));
}

// ─── Funnel math ─────────────────────────────────────────────────────────────

export interface FunnelCounts {
    searches?: number;
    listingViews?: number;
    interestsSent?: number;
    connectionsCreated?: number;
    chatsStarted?: number;
    contactShares?: number;
}

export interface FunnelRates {
    searchToView: number | null;
    viewToInterest: number | null;
    interestToConnection: number | null;
    connectionToChat: number | null;
    chatToContactShare: number | null;
}

function rate(numerator: number | undefined, denominator: number | undefined): number | null {
    // Insufficient data → null. Never fabricate a conversion rate.
    if (!denominator || denominator <= 0 || numerator == null) return null;
    return Math.round((numerator / denominator) * 100);
}

export function computeFunnelRates(c: FunnelCounts): FunnelRates {
    return {
        searchToView: rate(c.listingViews, c.searches),
        viewToInterest: rate(c.interestsSent, c.listingViews),
        interestToConnection: rate(c.connectionsCreated, c.interestsSent),
        connectionToChat: rate(c.chatsStarted, c.connectionsCreated),
        chatToContactShare: rate(c.contactShares, c.chatsStarted),
    };
}

// ─── Discovery quality ───────────────────────────────────────────────────────

/** No-result rate; null when no searches recorded. */
export function computeNoResultRate(searches: number, noResultSearches: number): number | null {
    if (!searches || searches <= 0) return null;
    return Math.round((noResultSearches / searches) * 100);
}

/** Average results per search; null when no searches recorded. */
export function computeAverageResults(totalResults: number, searches: number): number | null {
    if (!searches || searches <= 0) return null;
    return Math.round((totalResults / searches) * 10) / 10;
}

// ─── City aggregation ────────────────────────────────────────────────────────

export function aggregateByCity<T extends { city?: string }>(
    items: T[],
    predicate?: (item: T) => boolean
): Record<string, number> {
    const map: Record<string, number> = {};
    for (const item of items) {
        if (predicate && !predicate(item)) continue;
        const city = item.city?.trim();
        if (!city) continue;
        map[city] = (map[city] || 0) + 1;
    }
    return map;
}

// ─── Supply metrics (from listing snapshots) ────────────────────────────────

export interface SupplyListingLike {
    id?: string;
    status?: string;
    createdAt?: { toMillis?: () => number } | null;
    lastConfirmedAt?: { toMillis?: () => number } | number | null;
    updatedAt?: { toMillis?: () => number } | null;
}

export interface SupplyMetrics {
    total: number;
    active: number;
    fresh: number;          // confirmed within STALE_AFTER_DAYS
    stale: number;          // needs_confirmation
    closed: number;         // closed/filled/paused/expired
    zeroInterest: number;   // active listings with no interest received
    avgInterestPerActiveListing: number | null;
}

/**
 * Compute supply health from real listing docs + per-listing interest counts.
 * Uses Sprint 2A freshness semantics via getAvailabilityState.
 */
export function computeSupplyMetrics(
    listings: SupplyListingLike[],
    interestCountByListing: Record<string, number>,
    now: number = Date.now()
): SupplyMetrics {
    let active = 0, fresh = 0, stale = 0, closed = 0, zeroInterest = 0, interestSum = 0;
    for (const l of listings) {
        const status = l.status ?? 'active';
        if (status !== 'active') { closed++; continue; }
        const anchor = typeof l.lastConfirmedAt === 'number'
            ? l.lastConfirmedAt
            : l.lastConfirmedAt?.toMillis?.() ?? l.updatedAt?.toMillis?.() ?? l.createdAt?.toMillis?.() ?? 0;
        const ageDays = (now - anchor) / (24 * 60 * 60 * 1000);
        if (ageDays >= 45) { closed++; continue; }          // expired → not live supply
        active++;
        if (ageDays >= 14) stale++; else fresh++;
        const n = interestCountByListing[l.id ?? ''] ?? 0;
        interestSum += n;
        if (n === 0) zeroInterest++;
    }
    return {
        total: listings.length,
        active,
        fresh,
        stale,
        closed,
        zeroInterest,
        avgInterestPerActiveListing: active > 0 ? Math.round((interestSum / active) * 10) / 10 : null,
    };
}

// ─── Marketplace metrics (from raw event docs) ──────────────────────────────

/** Shape of an analyticsEvents document as read back from Firestore. */
export interface AnalyticsEventDoc {
    id?: string;
    name: string;
    actorId: string;
    entityId?: string;
    city?: string;
    resultCount?: number;
    at?: { toMillis?: () => number } | number | null;
}

export interface MarketplaceMetrics {
    searches: number;
    zeroResultSearches: number;
    listingViews: number;
    interestSent: number;
    interestAccepted: number;
    chatsStarted: number;
    contactsShared: number;
    listingsCreated: number;
    availabilityConfirmed: number;
    /** interest_accepted / interest_sent — null when no interests sent. */
    acceptRate: number | null;
    /** Top cities by search volume, descending, max 5. */
    topCities: [string, number][];
}

function eventTimeMs(e: AnalyticsEventDoc): number | null {
    if (typeof e.at === 'number') return e.at;
    return e.at?.toMillis?.() ?? null;
}

/**
 * Aggregate raw analytics events into marketplace funnel metrics for a time
 * window. Pure function — no Firebase, fully unit-testable. Never fabricates:
 * acceptRate is null when no interests were sent.
 */
export function computeMarketplaceMetrics(
    events: AnalyticsEventDoc[],
    now: number = Date.now(),
    windowDays: number = 30
): MarketplaceMetrics {
    const cutoff = now - windowDays * 24 * 60 * 60 * 1000;
    const inWindow = events.filter(e => {
        const t = eventTimeMs(e);
        // Events without a timestamp are kept (defensive) rather than dropped.
        return t == null || t >= cutoff;
    });

    const count = (name: string) => inWindow.filter(e => e.name === name).length;

    const searches = count('search_performed');
    const zeroResultSearches = inWindow.filter(
        e => e.name === 'search_performed' && e.resultCount === 0
    ).length;
    const interestSent = count('interest_sent');
    const interestAccepted = count('interest_accepted');

    const cityMap = aggregateByCity(inWindow, e => e.name === 'search_performed');
    const topCities = Object.entries(cityMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return {
        searches,
        zeroResultSearches,
        listingViews: count('listing_viewed'),
        interestSent,
        interestAccepted,
        chatsStarted: count('chat_started'),
        contactsShared: count('contact_shared'),
        listingsCreated: count('listing_created'),
        availabilityConfirmed: count('availability_confirmed'),
        acceptRate: rate(interestAccepted, interestSent),
        topCities,
    };
}

// ─── Client-side idempotency ─────────────────────────────────────────────────

const recentKeys = new Map<string, number>();

/**
 * Session-scoped dedupe: returns true the first time a key is seen within
 * windowMs, false afterwards. Protects against React effect re-runs,
 * double navigation, and re-renders without server-side complexity.
 */
export function shouldLogOnce(key: string, windowMs: number = 30_000, now: number = Date.now()): boolean {
    const last = recentKeys.get(key);
    if (last != null && now - last < windowMs) return false;
    recentKeys.set(key, now);
    // Opportunistic cleanup to bound memory
    if (recentKeys.size > 500) {
        for (const [k, t] of recentKeys) {
            if (now - t > windowMs) recentKeys.delete(k);
        }
    }
    return true;
}