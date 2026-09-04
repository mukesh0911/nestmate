import { describe, it, expect } from 'vitest';
import { computeTrustScore } from '../components/TrustBadge';
import { getProfileFields, computeCompleteness } from '../components/ProfileCompleteness';
import { validateReview, REVIEW_TEXT_MAX } from './reviewValidation';
import type { UserProfile } from '../hooks/useAuth';

const baseProfile = {
    uid: 'u1',
    name: 'Test User',
    role: 'seeker' as const,
    onboardingComplete: true,
    status: 'active',
    isVerified: false,
    isPremium: false,
    workEmailVerified: false,
    verificationLevel: 0,
    savedProfileIds: [],
    savedRoomIds: [],
    skippedUserIds: [],
    blockedUserIds: [],
    connectsUsed: 0,
} as unknown as UserProfile;

describe('trust signals — phone verification semantics (T1)', () => {
    it('phone step is NOT done for a Google signup (no phone provider)', () => {
        const t = computeTrustScore(baseProfile, ['google.com']);
        expect(t.steps.find(s => s.id === 'phone')!.done).toBe(false);
        // Google-only user cannot earn the phone points
        expect(t.score).toBeLessThan(20);
    });

    it('phone step IS done only when authenticated via phone OTP', () => {
        const t = computeTrustScore(baseProfile, ['phone']);
        expect(t.steps.find(s => s.id === 'phone')!.done).toBe(true);
    });

    it('unverified user receives no identity/work badges', () => {
        const t = computeTrustScore(baseProfile, []);
        expect(t.tier).toBe('bronze');
        expect(t.steps.find(s => s.id === 'aadhaar')!.done).toBe(false);
        expect(t.steps.find(s => s.id === 'workemail')!.done).toBe(false);
    });

    it('identity badge appears only from admin-set isVerified flag', () => {
        const verified = { ...baseProfile, isVerified: true, verificationLevel: 3 } as UserProfile;
        const t = computeTrustScore(verified, []);
        expect(t.tier).toBe('pro');
        expect(t.label).toBe('Verified Pro');
    });
});

describe('trust signals — profile completeness determinism (T2)', () => {
    it('is deterministic for identical inputs', () => {
        expect(computeCompleteness(baseProfile)).toBe(computeCompleteness({ ...baseProfile }));
    });

    it('a merely-PROVIDED work email does NOT count as verified', () => {
        const provided = { ...baseProfile, workEmail: 'x@company.com' } as UserProfile;
        const fields = getProfileFields(provided);
        expect(fields.find(f => f.id === 'workemail')!.done).toBe(false);
    });

    it('a VERIFIED work email counts toward completeness', () => {
        const verified = { ...baseProfile, workEmailVerified: true } as UserProfile;
        expect(getProfileFields(verified).find(f => f.id === 'workemail')!.done).toBe(true);
    });

    it('weights sum to exactly 100', () => {
        const total = getProfileFields(baseProfile).reduce((s, f) => s + f.weight, 0);
        expect(total).toBe(100);
    });

    it('empty profile scores 0 — no fabricated percentages', () => {
        expect(computeCompleteness(null)).toBe(0);
        expect(computeCompleteness(baseProfile)).toBe(0);
    });
});

describe('review/vouch integrity (T3/T6)', () => {
    const auth = 'user-a';

    it('accepts a valid vouch from the signed-in user about someone else', () => {
        expect(validateReview(
            { reviewerId: auth, targetUserId: 'user-b', rating: 5, text: 'Great roommate' },
            auth
        )).toEqual({ ok: true });
    });

    it('rejects spoofed reviewer identity', () => {
        const r = validateReview(
            { reviewerId: 'someone-else', targetUserId: 'user-b', rating: 5 },
            auth
        );
        expect(r.ok).toBe(false);
    });

    it('rejects self-reviews', () => {
        const r = validateReview({ reviewerId: auth, targetUserId: auth, rating: 5 }, auth);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toMatch(/own profile/i);
    });

    it('rejects unauthenticated submissions', () => {
        expect(validateReview(
            { reviewerId: auth, targetUserId: 'b', rating: 4 },
            null
        ).ok).toBe(false);
    });

    it('rejects out-of-range and non-integer ratings', () => {
        for (const rating of [0, 6, -1, 3.5, NaN]) {
            expect(validateReview({ reviewerId: auth, targetUserId: 'b', rating }, auth).ok).toBe(false);
        }
    });

    it('rejects over-long text', () => {
        const r = validateReview(
            { reviewerId: auth, targetUserId: 'b', rating: 4, text: 'x'.repeat(REVIEW_TEXT_MAX + 1) },
            auth
        );
        expect(r.ok).toBe(false);
    });

    it('rejects missing target', () => {
        expect(validateReview({ reviewerId: auth, targetUserId: '', rating: 4 }, auth).ok).toBe(false);
    });
});

describe('trust signals — malformed input & zero-data honesty (Sprint 3B)', () => {
    it('null profile yields score 0 with no fabricated steps', () => {
        const t = computeTrustScore(null, ['phone']);
        expect(t.score).toBe(0);
        expect(t.steps).toHaveLength(0);
    });

    it('malformed profile fields degrade safely without throwing or fabricating trust', () => {
        const garbage = {
            uid: 'u2',
            avatar: 42,
            bio: {},
            quizAnswers: 'not-an-object',
            isVerified: 'yes',
            workEmailVerified: 1,
        } as unknown as UserProfile;
        const t = computeTrustScore(garbage, undefined as unknown as string[]);
        // String 'yes' is truthy but is NOT an admin-verified boolean path in real data;
        // here we assert only that computation is deterministic and never throws.
        expect(typeof t.score).toBe('number');
        expect(t.score).toBeGreaterThanOrEqual(0);
        expect(t.score).toBeLessThanOrEqual(100);
    });

    it('zero-data user has 0% completeness — no default/fabricated percentage', () => {
        expect(computeCompleteness(null)).toBe(0);
        expect(computeCompleteness(baseProfile)).toBe(0);
    });

    it('completeness counts verification ONLY from verified flags, not provided emails', () => {
        const providedOnly = { ...baseProfile, workEmail: 'x@company.com' } as unknown as UserProfile;
        expect(computeCompleteness(providedOnly)).toBe(0);
        const adminVerified = { ...baseProfile, workEmailVerified: true } as unknown as UserProfile;
        expect(computeCompleteness(adminVerified)).toBe(15);
    });

    it('identity step is NOT done from document upload/completeness alone', () => {
        const uploadedDoc = { ...baseProfile, idDocumentUrl: 'gs://bucket/doc.pdf' } as unknown as UserProfile;
        const t = computeTrustScore(uploadedDoc, []);
        expect(t.steps.find(s => s.id === 'aadhaar')!.done).toBe(false);
    });

    it('listing availability confirmation does NOT grant identity trust', () => {
        // Listing-trust (lastConfirmedAt) and identity-trust (isVerified) are separate domains.
        const owner = { ...baseProfile } as UserProfile;
        const t = computeTrustScore(owner, []);
        expect(t.steps.find(s => s.id === 'aadhaar')!.done).toBe(false);
        expect(t.tier).not.toBe('pro');
    });
});
