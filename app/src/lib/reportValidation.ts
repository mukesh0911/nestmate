/**
 * Report submission validation — client-side mirror of the
 * /reports create constraints in firestore.rules.
 *
 * The Firestore rules remain the authoritative enforcement; this module
 * gives users fast, clear feedback and keeps the two layers in sync.
 */

export const REPORT_REASONS = [
    'spam',
    'spam_or_scam',
    'harassment',
    'inappropriate',
    'inappropriate_behavior',
    'fake',
    'fake_profile',
    'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export interface ReportInput {
    reporterId: string;
    targetId: string;
    reason: string;
    description?: string;
}

export interface ReportValidationResult {
    valid: boolean;
    /** Normalized payload safe to submit, when valid. */
    payload?: {
        reporterId: string;
        targetId: string;
        reason: ReportReason;
        description: string;
        status: 'pending';
    };
    error?: string;
}

const MAX_DESCRIPTION_LENGTH = 2000;

/** Validate a report before submission. Throws nothing — returns result. */
export function validateReport(
    input: ReportInput,
    authenticatedUid: string
): ReportValidationResult {
    if (!authenticatedUid) {
        return { valid: false, error: 'You must be signed in to report.' };
    }

    // Reporter identity is server-enforced from the auth token; reject any
    // attempt to file a report as someone else.
    if (!input.reporterId || input.reporterId !== authenticatedUid) {
        return { valid: false, error: 'Reporter identity does not match the signed-in user.' };
    }

    if (!input.targetId || typeof input.targetId !== 'string') {
        return { valid: false, error: 'A report target is required.' };
    }
    if (input.targetId === authenticatedUid) {
        return { valid: false, error: 'You cannot report yourself.' };
    }

    if (!REPORT_REASONS.includes(input.reason as ReportReason)) {
        return { valid: false, error: 'Please select a valid report reason.' };
    }

    const description = (input.description ?? '').toString();
    if (description.length > MAX_DESCRIPTION_LENGTH) {
        return { valid: false, error: `Description must be under ${MAX_DESCRIPTION_LENGTH} characters.` };
    }

    return {
        valid: true,
        payload: {
            reporterId: authenticatedUid,
            targetId: input.targetId,
            reason: input.reason as ReportReason,
            description,
            status: 'pending',
        },
    };
}