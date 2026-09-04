import { describe, it, expect } from 'vitest';
import {
    isPubliclyVisibleListing,
    isPubliclyVisibleProfile,
    isOrphanedListing,
} from './marketplaceVisibility';
import { DEMO_EMAIL_PREFIX } from './demoUsers';

const DAY_MS = 24 * 60 * 60 * 1000;

const freshActiveListing = {
    id: 'l1',
    status: 'active',
    lastConfirmedAt: { toMillis: () => Date.now() - 2 * DAY_MS },
};

describe('isPubliclyVisibleListing (demo exclusion + freshness exclusion + owner verification gate)', () => {
    it('shows an active, recently confirmed listing', () => {
        expect(isPubliclyVisibleListing(freshActiveListing)).toBe(true);
    });

    it('hides paused / filled / closed listings', () => {
        expect(isPubliclyVisibleListing({ ...freshActiveListing, status: 'paused' })).toBe(false);
        expect(isPubliclyVisibleListing({ ...freshActiveListing, status: 'filled' })).toBe(false);
        expect(isPubliclyVisibleListing({ ...freshActiveListing, status: 'closed' })).toBe(false);
    });

    // ─── Owner verification gate (SECURITY) ────────────────────────────────
    it('SECURITY: hides pending_verification listings regardless of freshness', () => {
        expect(isPubliclyVisibleListing({ ...freshActiveListing, status: 'pending_verification' })).toBe(false);
        expect(isPubliclyVisibleListing({ status: 'pending_verification', ownerVerified: false })).toBe(false);
    });

    it('SECURITY: hides listings with ownerVerified=false (new unverified listings)', () => {
        expect(isPubliclyVisibleListing({ ...freshActiveListing, ownerVerified: false })).toBe(false);
    });

    it('SECURITY: shows listings with ownerVerified=true (admin-approved)', () => {
        expect(isPubliclyVisibleListing({ ...freshActiveListing, ownerVerified: true })).toBe(true);
    });

    it('GRACE PERIOD: shows legacy listings with no ownerVerified field (grandfathered)', () => {
        // Legacy listings created before this security feature have no ownerVerified field.
        // They receive a grace period rather than being immediately hidden.
        const legacyListing = { id: 'legacy', status: 'active', lastConfirmedAt: { toMillis: () => Date.now() - 2 * DAY_MS } };
        expect(isPubliclyVisibleListing(legacyListing)).toBe(true);
    });
    // ─────────────────────────────────────────────────────────────────────────

    it('still shows stale-but-unexpired listings (14–45 days, needs_confirmation state)', () => {
        const staleButVisible = {
            status: 'active',
            ownerVerified: true,
            lastConfirmedAt: { toMillis: () => Date.now() - 40 * DAY_MS },
        };
        expect(isPubliclyVisibleListing(staleButVisible)).toBe(true);
    });

    it('hides listings past the 45-day expiry window', () => {
        const expired = {
            status: 'active',
            lastConfirmedAt: { toMillis: () => Date.now() - 50 * DAY_MS },
        };
        expect(isPubliclyVisibleListing(expired)).toBe(false);
    });

    it('rejects malformed input safely', () => {
        expect(isPubliclyVisibleListing(null)).toBe(false);
        expect(isPubliclyVisibleListing(undefined)).toBe(false);
        expect(isPubliclyVisibleListing('nope')).toBe(false);
    });
});


describe('isPubliclyVisibleProfile (demo exclusion + account status)', () => {
    const realOwner = {
        uid: 'u1',
        name: 'Real Owner',
        role: 'owner',
        onboardingComplete: true,
    };

    it('shows a real onboarded active profile', () => {
        expect(isPubliclyVisibleProfile(realOwner)).toBe(true);
    });

    it('hides demo-flagged profiles', () => {
        expect(isPubliclyVisibleProfile({ ...realOwner, isDemo: true })).toBe(false);
    });

    it(`hides legacy demo accounts identified by the "${DEMO_EMAIL_PREFIX}" email prefix`, () => {
        expect(isPubliclyVisibleProfile({ ...realOwner, email: `${DEMO_EMAIL_PREFIX}seeker@x.com` })).toBe(false);
    });

    it('hides suspended and banned accounts', () => {
        expect(isPubliclyVisibleProfile({ ...realOwner, status: 'suspended' })).toBe(false);
        expect(isPubliclyVisibleProfile({ ...realOwner, status: 'banned' })).toBe(false);
    });

    it('hides incomplete-onboarding profiles', () => {
        expect(isPubliclyVisibleProfile({ ...realOwner, onboardingComplete: false })).toBe(false);
    });

    it('treats legacy docs without status/onboardingComplete fields as visible', () => {
        expect(isPubliclyVisibleProfile({ uid: 'u2', name: 'Legacy' })).toBe(true);
    });

    it('rejects malformed input safely', () => {
        expect(isPubliclyVisibleProfile(null)).toBe(false);
        expect(isPubliclyVisibleProfile(42)).toBe(false);
    });
});

describe('orphan handling policy', () => {
    it('flags listings whose owner document is missing as orphans (hidden)', () => {
        expect(isOrphanedListing(false)).toBe(true);
        expect(isOrphanedListing(undefined)).toBe(true);
    });

    it('does not flag listings whose owner document exists', () => {
        expect(isOrphanedListing(true)).toBe(false);
    });
});

describe('cross-surface consistency', () => {
    // Every surface (Dashboard matches, Explore, Map) must reach the SAME
    // verdict for the SAME entity because they share these helpers.
    const surfaces = ['dashboard-matches', 'explore', 'map'] as const;

    const cases: Array<[string, unknown, () => boolean]> = [
        ['active fresh listing', freshActiveListing, () => isPubliclyVisibleListing(freshActiveListing)],
        ['expired listing', { status: 'active', lastConfirmedAt: { toMillis: () => Date.now() - 50 * DAY_MS } },
            () => isPubliclyVisibleListing({ status: 'active', lastConfirmedAt: { toMillis: () => Date.now() - 50 * DAY_MS } })],
        ['demo profile', { uid: 'd1', isDemo: true, onboardingComplete: true },
            () => isPubliclyVisibleProfile({ uid: 'd1', isDemo: true, onboardingComplete: true })],
        ['banned profile', { uid: 'b1', status: 'banned', onboardingComplete: true },
            () => isPubliclyVisibleProfile({ uid: 'b1', status: 'banned', onboardingComplete: true })],
    ];

    for (const [label, , verdict] of cases) {
        it(`"${label}" gets an identical verdict on every surface`, () => {
            const expected = verdict();
            for (const s of surfaces) {
                expect(verdict(), `surface=${s} label=${label}`).toBe(expected);
            }
        });
    }
});