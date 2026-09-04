/**
 * Pure matching helpers — safe to unit test without Firebase.
 */

/**
 * Calculate dynamic compatibility score between two quiz answer maps.
 * Returns integer percentage (0-100%).
 */
export function calculateCompatibility(
  answersA: Record<string, string> = {},
  answersB: Record<string, string> = {},
  cityA?: string,
  cityB?: string
): number {
  const keysA = Object.keys(answersA || {});
  const keysB = Object.keys(answersB || {});

  // Quiz answer IDs are opaque string tokens (e.g. 'before_10', '10_to_12', 'veg', 'wfh').
  // They must ONLY be compared by exact string equality — never parsed as numbers.
  // parseInt('10_to_12') === 10 and parseInt('6_to_8') === 6, which gives a
  // false numeric diff score and completely wrong compatibility results.
  let score = 0;
  const commonKeys = keysA.filter((k) => keysB.includes(k));

  if (commonKeys.length > 0) {
    // Score = fraction of shared questions where both users gave the exact same answer
    const matches = commonKeys.filter((k) => answersA[k] === answersB[k]).length;
    score = Math.round((matches / commonKeys.length) * 100);
  }
  // If there are no common keys (one or both have no answers), score stays 0 — honest.

  // City Mismatch Adjustment:
  // If both cities are specified and they do NOT match (e.g. Chennai vs Hyderabad),
  // cap cross-city compatibility at 60% so users in Chennai are never misled by a 100% score for a Hyderabad profile.
  if (cityA && cityB) {
    const normA = cityA.toLowerCase().trim();
    const normB = cityB.toLowerCase().trim();
    if (normA && normB && normA !== normB) {
      score = Math.min(60, Math.round(score * 0.6));
    }
  }

  return score;
}

/**
 * Truthful match explanation (Sprint 2C).
 *
 * Returns ONLY reasons supported by real data — never fabricated.
 * Used by the compatibility breakdown UI so users can see WHY a
 * candidate is a good match instead of a bare percentage.
 */
export interface MatchReasons {
  score: number;
  reasons: string[];      // positive, data-backed reasons
  caveats: string[];      // honest limitations (missing data etc.)
}

export function getMatchReasons(
  myAnswers: Record<string, string> = {},
  theirAnswers: Record<string, string> = {},
  opts: {
    myCity?: string;
    theirCity?: string;
    myBudget?: number;
    theirBudget?: number;
    sharedAnswerCount?: number;
  } = {}
): MatchReasons {
  const score = calculateCompatibility(myAnswers, theirAnswers, opts.myCity, opts.theirCity);
  const reasons: string[] = [];
  const caveats: string[] = [];

  // Location — only when both cities are known and equal
  if (opts.myCity && opts.theirCity) {
    if (opts.myCity.toLowerCase().trim() === opts.theirCity.toLowerCase().trim()) {
      reasons.push(`Same city (${opts.myCity})`);
    } else {
      caveats.push('Different cities');
    }
  } else {
    caveats.push('Location not fully specified');
  }

  // Budget overlap — only when both budgets are known and positive
  const myB = opts.myBudget || 0;
  const theirB = opts.theirBudget || 0;
  if (myB > 0 && theirB > 0) {
    const gapPct = Math.abs(myB - theirB) / Math.max(myB, theirB);
    if (gapPct <= 0.2) reasons.push('Budgets are close');
    else caveats.push('Budgets differ significantly');
  } else {
    caveats.push('Budget not fully specified');
  }

  // Lifestyle — count genuinely shared answers (exact string equality only)
  const commonKeys = Object.keys(myAnswers).filter(k => k in (theirAnswers || {}));
  if (commonKeys.length > 0) {
    const shared = commonKeys.filter(k => myAnswers[k] === theirAnswers[k]).length;
    if (shared > 0) reasons.push(`${shared} lifestyle preference${shared === 1 ? '' : 's'} in common`);
    if (commonKeys.length < 5) caveats.push('Few overlapping quiz answers — score is low-confidence');
  } else {
    caveats.push('No overlapping quiz answers yet');
  }

  return { score, reasons, caveats };
}

/**
 * Get active status based on lastActiveAt timestamp.
 */
export function getActiveStatus(timestamp: any): { status: 'online' | 'recent' | 'offline'; text: string } {
  if (!timestamp) return { status: 'offline', text: 'Active a while ago' };

  const lastActive = timestamp.toMillis
    ? timestamp.toMillis()
    : timestamp instanceof Date
      ? timestamp.getTime()
      : timestamp;
  const now = Date.now();
  const diffMs = now - lastActive;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 15) {
    return { status: 'online', text: 'Active now' };
  } else if (diffHours < 24) {
    return { status: 'recent', text: `Active ${diffHours || 1}h ago` };
  } else {
    return { status: 'offline', text: `Active ${diffDays} days ago` };
  }
}
