/**
 * Sprint 4B regression tests — client-side listing filter pipeline.
 *
 * Bug fixed this sprint: the landing-page hero collected a locality query but
 * silently discarded it; additionally, filters.localities was only honored on
 * the roommates tab (useMatches), never on the rooms tab. These tests pin the
 * corrected behavior of applyClientFilters.
 *
 * The pipeline lives in @/lib/listingFilters (pure module, no Firebase), so
 * these tests are fully hermetic.
 */
import { describe, it, expect } from 'vitest';
import { applyClientFilters, type FilterableListing } from '../lib/listingFilters';

function makeListing(overrides: Partial<FilterableListing>): FilterableListing {
    return {
        city: 'Bengaluru',
        locality: 'HSR Layout',
        partnerShare: 12000,
        totalRent: 24000,
        flatType: '2BHK',
        furnishing: 'Semi-Furnished',
        amenities: [],
        ...overrides,
    };
}

describe('applyClientFilters — Sprint 4B locality truth fixes', () => {
    const listings = [
        makeListing({ locality: 'HSR Layout' }),
        makeListing({ locality: 'Koramangala' }),
        makeListing({ city: 'Mumbai', locality: 'Bandra West' }),
    ];

    it('no filters returns the input unchanged', () => {
        expect(applyClientFilters(listings)).toEqual(listings);
        expect(applyClientFilters(listings, {})).toEqual(listings);
    });

    it('locality filter matches case-insensitively (hero search "hsr layout")', () => {
        const out = applyClientFilters(listings, { localities: ['hsr layout'] });
        expect(out.map(l => l.locality)).toEqual(['HSR Layout']);
    });

    it('locality filter matches as a substring in both directions', () => {
        // Query shorter than stored locality…
        expect(applyClientFilters(listings, { localities: ['koram'] }).map(l => l.locality)).toEqual(['Koramangala']);
        // …and query longer than a short stored locality.
        const short = [makeListing({ locality: 'HSR' })];
        expect(applyClientFilters(short, { localities: ['hsr layout, bengaluru'] }).map(l => l.locality)).toEqual(['HSR']);
    });

    it('locality filter excludes listings in other localities/cities', () => {
        expect(applyClientFilters(listings, { localities: ['Indiranagar'] })).toEqual([]);
    });

    it('empty or whitespace-only locality arrays do not filter anything', () => {
        expect(applyClientFilters(listings, { localities: [] })).toEqual(listings);
        expect(applyClientFilters(listings, { localities: ['   '] })).toEqual(listings);
    });

    it('city and locality combine (AND semantics)', () => {
        expect(applyClientFilters(listings, { city: 'Bengaluru', localities: ['bandra west'] })).toEqual([]);
        expect(applyClientFilters(listings, { city: 'bengaluru', localities: ['hsr'] }).map(l => l.locality)).toEqual(['HSR Layout']);
    });

    it('listings with missing locality never match a locality query (fail-safe)', () => {
        const partial = [makeListing({ locality: '' })];
        expect(applyClientFilters(partial, { localities: ['hsr'] })).toEqual([]);
    });

    it('budget filters still work on partnerShare/totalRent', () => {
        expect(applyClientFilters(listings, { budgetMin: 15000 })).toEqual([]);
        expect(applyClientFilters(listings, { budgetMax: 12000 }).length).toBe(3);
    });
});