import { describe, it, expect } from 'vitest';
import { calculateCompatibility, getMatchReasons } from './matching';
import { isDiscoverable } from './listingFreshness';
import { isAccountActive } from './accountStatus';

describe('scoring determinism & missing data (Phase 4/18)', () => {
    it('is deterministic for identical inputs', () => {
        const a = { q1: '2', q2: '5' };
        const b = { q1: '3', q2: '4' };
        expect(calculateCompatibility(a, b)).toBe(calculateCompatibility({ ...a }, { ...b }));
    });

    it('identical answers score 100', () => {
        const a = { q1: '1', q2: '2', q3: '3' };
        expect(calculateCompatibility(a, { ...a })).toBe(100);
    });

    it('maximally different answers score 0', () => {
        expect(calculateCompatibility({ q: '1' }, { q: '4' })).toBe(0);
    });

    it('missing keys are ignored, not penalized (partial overlap)', () => {
        // Only shared key counts; missing key does not drag the score down
        expect(calculateCompatibility({ q1: '2', qX: '9' }, { q1: '2' })).toBe(100);
    });

    it('empty answers yield 0 — no fabricated compatibility', () => {
        expect(calculateCompatibility({}, {})).toBe(0);
        expect(calculateCompatibility({}, undefined as any)).toBe(0);
    });

    it('cross-city scores are capped at 60', () => {
        const a = { q1: '1', q2: '1' };
        expect(calculateCompatibility(a, { ...a }, 'Chennai', 'Hyderabad')).toBeLessThanOrEqual(60);
        expect(calculateCompatibility(a, { ...a }, 'chennai ', ' Chennai')).toBe(100); // normalized equal
    });
});

describe('match explanation accuracy (Phase 8)', () => {
    it('reports same-city reason only when both cities known and equal', () => {
        const r = getMatchReasons({}, {}, { myCity: 'Chennai', theirCity: 'Chennai' });
        expect(r.reasons.some(x => x.startsWith('Same city'))).toBe(true);
    });

    it('caveats — never fabricates reasons from missing data', () => {
        const r = getMatchReasons({}, {}, {});
        expect(r.score).toBe(0);
        expect(r.reasons).toHaveLength(0);
        expect(r.caveats.length).toBeGreaterThan(0);
    });

    it('budget reason appears only when both budgets known and close', () => {
        const close = getMatchReasons({}, {}, { myBudget: 10000, theirBudget: 11000 });
        expect(close.reasons).toContain('Budgets are close');
        const far = getMatchReasons({}, {}, { myBudget: 5000, theirBudget: 20000 });
        expect(far.caveats).toContain('Budgets differ significantly');
        const unknown = getMatchReasons({}, {}, { myBudget: 0, theirBudget: 8000 });
        expect(unknown.caveats).toContain('Budget not fully specified');
    });

    it('counts genuinely shared lifestyle answers', () => {
        const mine = { sleep: '1', food: '2', work: '3' };
        const theirs = { sleep: '1', food: '2', work: '4' };
        const r = getMatchReasons(mine, theirs);
        expect(r.reasons.some(x => x.includes('lifestyle preference'))).toBe(true);
    });

    it('flags low-confidence when few overlapping answers', () => {
        const r = getMatchReasons({ a: '1' }, { a: '1' });
        expect(r.caveats.some(c => c.includes('low-confidence'))).toBe(true);
    });
});

describe('eligibility before ranking (Phases 5/6/14/16)', () => {
    const DAY = 24 * 60 * 60 * 1000;
    const ms = (d: number) => ({ toMillis: () => d });
    const freshListing = {
        status: 'active',
        createdAt: ms(Date.now() - 10 * DAY),
        lastConfirmedAt: Date.now() - 1 * DAY,
    };

    it('fresh confirmed listing is discoverable', () => {
        expect(isDiscoverable(freshListing)).toBe(true);
    });

    it('expired listing is excluded even with status active', () => {
        const expired = { ...freshListing, lastConfirmedAt: Date.now() - 50 * DAY };
        expect(isDiscoverable(expired)).toBe(false);
    });

    it('closed and paused listings are excluded', () => {
        expect(isDiscoverable({ ...freshListing, status: 'closed' })).toBe(false);
        expect(isDiscoverable({ ...freshListing, status: 'paused' })).toBe(false);
    });

    it('legacy listing without confirmation data still discoverable (no false exclusion)', () => {
        expect(isDiscoverable({ status: 'active', createdAt: ms(Date.now()) })).toBe(true);
    });

    it('suspended/banned accounts are ineligible candidates', () => {
        expect(isAccountActive('active')).toBe(true);
        expect(isAccountActive(undefined)).toBe(true); // legacy docs default to active
        expect(isAccountActive('suspended')).toBe(false);
        expect(isAccountActive('banned')).toBe(false);
    });
});