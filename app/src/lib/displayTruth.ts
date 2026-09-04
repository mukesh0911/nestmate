/**
 * Sprint 4A — Truthful display helpers.
 *
 * Single source of truth for "missing data" rendering semantics across
 * marketplace surfaces. RULE: if real data exists, display it; if not,
 * display an explicit neutral state. NEVER invent, estimate, or hardcode
 * user/property data to make the UI look complete.
 *
 * Pure functions — no Firebase — fully unit-testable (displayTruth.test.ts).
 */

/** True only when the listing carries at least one REAL uploaded image. */
export function hasRealListingImages(images?: string[] | null): boolean {
    return Array.isArray(images) && images.some(src => typeof src === 'string' && src.trim().length > 0);
}

/**
 * Photos to render for a listing. Returns ONLY real uploaded images.
 * Callers must render an explicit empty-photo placeholder when
 * hasRealPhotos is false — never substitute stock photography.
 */
export function getListingPhotos(images?: string[] | null): { photos: string[]; hasRealPhotos: boolean } {
    const list = Array.isArray(images)
        ? images.filter((src): src is string => typeof src === 'string' && src.trim().length > 0)
        : [];
    return { photos: list, hasRealPhotos: list.length > 0 };
}

/** Truthful deposit rendering. Missing/zero deposit is NEVER estimated. */
export function formatDepositINR(deposit?: number | null): string {
    return typeof deposit === 'number' && Number.isFinite(deposit) && deposit > 0
        ? `₹${deposit.toLocaleString('en-IN')}`
        : 'Not specified';
}

/** Truthful budget rendering. Missing/zero budget is NEVER guessed. */
export function formatBudgetINR(budget?: number | null): string {
    return typeof budget === 'number' && Number.isFinite(budget) && budget > 0
        ? `₹${budget.toLocaleString('en-IN')}`
        : 'Budget not provided';
}

/** True only when the owner actually answered the lifestyle quiz. */
export function hasOwnerPreferences(quiz?: Record<string, string> | null): boolean {
    return !!quiz && typeof quiz === 'object' && Object.keys(quiz).length > 0;
}

/**
 * Budget-overlap percentage from TWO REAL budgets.
 * Returns null when either budget is missing/zero — callers must render a
 * neutral "unknown" state instead of a fabricated percentage.
 */
export function budgetOverlapPct(a?: number | null, b?: number | null): number | null {
    const x = typeof a === 'number' && Number.isFinite(a) ? a : 0;
    const y = typeof b === 'number' && Number.isFinite(b) ? b : 0;
    if (x <= 0 || y <= 0) return null;
    return Math.max(0, 100 - Math.round((Math.abs(x - y) / Math.max(x, y)) * 100));
}