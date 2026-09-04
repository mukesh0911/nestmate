/**
 * Sprint 3A — Owner-side EXPLAINABLE applicant ranking.
 *
 * Answers the owner's core question: "Who should I talk to first?"
 *
 * Integrity rules honored:
 * - Every signal is derived from REAL stored data (quiz answers, budget,
 *   city/locality, verification flags written by actual verification events).
 * - No opaque score: every ranked applicant carries data-backed reasons and
 *   honest caveats that the UI displays verbatim.
 * - Missing data is stated as missing (caveat), never invented.
 * - Ties preserve chronological order (input is createdAt desc), so ranking
 *   never hides newer applicants behind equal-scoring older ones unfairly.
 */
import { calculateCompatibility } from './matching';

/** Minimal applicant shape needed — accepts UserProfile-like objects. */
export interface ApplicantSignalLike {
    uid?: string;
    city?: string;
    locality?: string;
    budget?: number;
    quizAnswers?: Record<string, string>;
    onboardingComplete?: boolean;
    /** Real verification fields — must ONLY be set by genuine verification events. */
    isVerified?: boolean;
    workEmailVerified?: boolean;
}

/** Minimal listing-intent shape (the owner's room). */
export interface ListingIntentLike {
    city?: string;
    locality?: string;
    partnerShare?: number;
    totalRent?: number;
}

export interface ApplicantFit {
    /** Reproducible compatibility % (same engine as seeker-side matching). */
    score: number;
    /** Positive, data-backed reasons shown to the owner. */
    reasons: string[];
    /** Honest limitations (missing data, mismatches). */
    caveats: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Evaluate ONE applicant against the owner's preferences + listing intent.
 * Pure function — no Firebase, fully unit-testable.
 */
export function evaluateApplicantFit(
    ownerAnswers: Record<string, string> = {},
    applicant: ApplicantSignalLike,
    opts: {
        ownerCity?: string;
        listing?: ListingIntentLike;
        /** Connection creation time (ms) — used only for display/recency context. */
        requestedAtMs?: number;
        now?: number;
    } = {}
): ApplicantFit {
    const reasons: string[] = [];
    const caveats: string[] = [];

    const listing = opts.listing;
    const listingCity = listing?.city || opts.ownerCity;

    // 1. Compatibility — same deterministic engine as seeker-side matching.
    const score = calculateCompatibility(
        ownerAnswers,
        applicant.quizAnswers || {},
        listingCity,
        applicant.city
    );

    // 2. Location vs the actual room.
    if (listingCity && applicant.city) {
        if (listingCity.toLowerCase().trim() === applicant.city.toLowerCase().trim()) {
            reasons.push(`Same city (${listingCity})`);
        } else {
            caveats.push('Different city from your room');
        }
    } else {
        caveats.push('Location not fully specified');
    }
    if (listing?.locality && applicant.locality &&
        listing.locality.toLowerCase().trim() === applicant.locality.toLowerCase().trim()) {
        reasons.push(`Same locality (${listing.locality})`);
    }

    // 3. Budget fit vs the room's actual rent.
    const rent = listing?.partnerShare || listing?.totalRent || 0;
    const budget = applicant.budget || 0;
    if (rent > 0 && budget > 0) {
        const gapPct = Math.abs(rent - budget) / Math.max(rent, budget);
        if (gapPct <= 0.2) {
            reasons.push(`Budget fits (₹${budget.toLocaleString()} vs ₹${rent.toLocaleString()} rent)`);
        } else {
            caveats.push(`Budget (₹${budget.toLocaleString()}) differs from rent (₹${rent.toLocaleString()})`);
        }
    } else {
        caveats.push('Budget not fully specified');
    }

    // 4. Lifestyle overlap — count genuinely shared answers (exact string equality only).
    // Quiz answer IDs are opaque tokens like 'before_10', 'veg', 'wfh' — parseInt gives wrong
    // partial numbers (parseInt('10_to_12') === 10) so numeric diff comparison is incorrect.
    const commonKeys = Object.keys(ownerAnswers || {}).filter(k => k in (applicant.quizAnswers || {}));
    if (commonKeys.length > 0) {
        const shared = commonKeys.filter(k => ownerAnswers[k] === (applicant.quizAnswers || {})[k]).length;
        if (shared > 0) reasons.push(`${shared} lifestyle preference${shared === 1 ? '' : 's'} in common`);
        if (commonKeys.length < 5) caveats.push('Few overlapping answers — low confidence');
    } else {
        caveats.push('No overlapping lifestyle answers yet');
    }

    // 5. Profile completeness — missing data is stated, never penalized silently.
    if (applicant.onboardingComplete === false || Object.keys(applicant.quizAnswers || {}).length === 0) {
        caveats.push('Profile incomplete — limited signal');
    }

    // 6. Trust signals — ONLY real verification fields.
    if (applicant.workEmailVerified) reasons.push('Work email verified');
    if (applicant.isVerified) reasons.push('ID verified');

    // 7. Recency context (display-only; never affects score).
    if (opts.requestedAtMs && opts.now && opts.now - opts.requestedAtMs > 7 * DAY_MS) {
        caveats.push('Requested over a week ago');
    }

    return { score, reasons, caveats };
}

/**
 * Rank applicants by fit score (desc). JavaScript sort is stable, so equal
 * scores keep their input order — which is chronological (newest first),
 * preserving today's behavior for ties.
 */
export function rankApplicants<T>(
    items: T[],
    fitOf: (item: T) => ApplicantFit
): Array<T & { fit: ApplicantFit }> {
    return items
        .map(item => ({ ...item, fit: fitOf(item) }))
        .sort((a, b) => b.fit.score - a.fit.score);
}