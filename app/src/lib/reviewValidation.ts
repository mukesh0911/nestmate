/**
 * Review/vouch integrity (Sprint 2B).
 *
 * Mirrors the authoritative Firestore rules for `reviews`:
 *   - reviewerId MUST equal the caller's auth uid (identity cannot be spoofed)
 *   - a user can never review themselves
 *   - rating must be an integer 1..5
 *   - text is optional but capped
 */

export const REVIEW_TEXT_MAX = 1000;

export interface ReviewInput {
    reviewerId: string;
    targetUserId: string;
    rating: number;
    text?: string;
}

export function validateReview(
    input: ReviewInput,
    authUid: string | null
): { ok: true } | { ok: false; reason: string } {
    if (!authUid) return { ok: false, reason: 'You must be signed in to vouch for someone.' };
    if (input.reviewerId !== authUid) {
        return { ok: false, reason: 'Review identity does not match the signed-in user.' };
    }
    if (!input.targetUserId || typeof input.targetUserId !== 'string') {
        return { ok: false, reason: 'Missing review target.' };
    }
    if (input.reviewerId === input.targetUserId) {
        return { ok: false, reason: 'You cannot review your own profile.' };
    }
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
        return { ok: false, reason: 'Rating must be between 1 and 5.' };
    }
    if (input.text && input.text.length > REVIEW_TEXT_MAX) {
        return { ok: false, reason: `Vouch message must be at most ${REVIEW_TEXT_MAX} characters.` };
    }
    return { ok: true };
}