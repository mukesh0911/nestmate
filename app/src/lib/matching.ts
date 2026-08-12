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

  let score = 0;
  const commonKeys = keysA.filter((k) => keysB.includes(k));

  if (commonKeys.length > 0) {
    let totalSimilarity = 0;
    commonKeys.forEach((key) => {
      const valA = parseInt(answersA[key], 10);
      const valB = parseInt(answersB[key], 10);
      if (!isNaN(valA) && !isNaN(valB)) {
        const diff = Math.abs(valA - valB);
        const similarity = 1 - Math.min(diff, 3) / 3;
        totalSimilarity += similarity;
      } else if (answersA[key] === answersB[key]) {
        totalSimilarity += 1.0;
      }
    });
    score = Math.round((totalSimilarity / commonKeys.length) * 100);
  } else {
    const unionKeys = Array.from(new Set([...keysA, ...keysB]));
    if (unionKeys.length > 0) {
      let matches = 0;
      unionKeys.forEach((k) => {
        if (answersA[k] && answersB[k] && answersA[k] === answersB[k]) {
          matches += 1;
        }
      });
      score = Math.round((matches / unionKeys.length) * 100);
    }
  }

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
