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
 * Seeker signal required for room matching.
 */
export interface SeekerMatchSignal {
  uid?: string;
  name?: string | null;
  gender?: string | null;
  city?: string | null;
  localities?: string[];
  locality?: string | null;
  budget?: number | null;
  quizAnswers?: Record<string, string>;
  isVerified?: boolean;
  workEmailVerified?: boolean;
  onboardingComplete?: boolean;
}

/**
 * Listing intent required for room matching.
 */
export interface ListingMatchSignal {
  id?: string;
  title?: string;
  city?: string;
  locality?: string;
  monthlyRent?: number;
  partnerShare?: number;
  totalRent?: number;
  deposit?: number;
  genderPreference?: string;
  houseRules?: string[];
  amenities?: string[];
  ownerQuizAnswers?: Record<string, string>;
}

/**
 * Optional owner context for room matching.
 */
export interface OwnerMatchSignal {
  uid?: string;
  role?: string | null;
  ownerType?: 'owner_flatmate' | 'landlord' | string | null;
  city?: string | null;
  isVerified?: boolean;
  workEmailVerified?: boolean;
  quizAnswers?: Record<string, string>;
  householdExpectations?: {
    genderPref?: string;
    dietPref?: string;
    smokingPolicy?: string;
    petPolicy?: string;
  };
}

export interface RoomMatchBreakdown {
  score: number;
  budgetScore: number;
  locationScore: number;
  genderScore: number;
  rulesScore: number;
  trustScore: number;
  reasons: string[];
  caveats: string[];
}

/**
 * Multi-Factor Room Compatibility Engine (0–100%).
 *
 * Outperforms single-dimensional quiz comparison by evaluating:
 * 1. Budget Fit (25%)
 * 2. Location & Locality Fit (20%)
 * 3. Gender Requirement Fit (20%)
 * 4. House Rules & Habits Alignment (20%)
 * 5. Trust & Verification Signals (15%)
 */
export function getRoomMatchReasons(
  seeker: SeekerMatchSignal = {},
  listing: ListingMatchSignal = {},
  owner: OwnerMatchSignal = {}
): RoomMatchBreakdown {
  const reasons: string[] = [];
  const caveats: string[] = [];

  // 1. Budget Fit (Max 25 pts)
  const rent = listing.partnerShare || listing.monthlyRent || listing.totalRent || 0;
  const budget = seeker.budget || 0;
  let budgetScore = 12; // neutral baseline when unstated

  if (rent > 0 && budget > 0) {
    if (budget >= rent) {
      budgetScore = 25;
      reasons.push(`Budget fits (₹${budget.toLocaleString()} accommodates ₹${rent.toLocaleString()} rent)`);
    } else if (budget >= rent * 0.85) {
      budgetScore = 20;
      reasons.push(`Budget is close (within 15% of ₹${rent.toLocaleString()} rent)`);
    } else if (budget >= rent * 0.75) {
      budgetScore = 12;
      caveats.push(`Budget (₹${budget.toLocaleString()}) is below rent (₹${rent.toLocaleString()})`);
    } else {
      budgetScore = 0;
      caveats.push(`Budget (₹${budget.toLocaleString()}) is significantly below rent (₹${rent.toLocaleString()})`);
    }
  } else {
    caveats.push('Budget not fully specified');
  }

  // 2. Location & Locality Fit (Max 20 pts)
  const seekerCity = (seeker.city || '').toLowerCase().trim();
  const listingCity = (listing.city || owner.city || '').toLowerCase().trim();
  const listingLocality = (listing.locality || '').toLowerCase().trim();
  let locationScore = 10; // neutral baseline when unstated

  if (seekerCity && listingCity) {
    if (seekerCity === listingCity) {
      const seekerLocs = (seeker.localities || []).map(l => (l || '').toLowerCase().trim());
      if (seeker.locality) seekerLocs.push(seeker.locality.toLowerCase().trim());

      if (listingLocality && seekerLocs.some(loc => loc === listingLocality || listingLocality.includes(loc) || loc.includes(listingLocality))) {
        locationScore = 20;
        reasons.push(`Same locality (${listing.locality}, ${listing.city || seeker.city})`);
      } else {
        locationScore = 14;
        reasons.push(`Same city (${listing.city || seeker.city})`);
      }
    } else {
      locationScore = 0;
      caveats.push(`Different city (${listing.city || 'Listing'} vs ${seeker.city || 'Seeker'})`);
    }
  } else {
    caveats.push('Location not fully specified');
  }

  // 3. Gender Requirement Fit (Max 20 pts)
  const genderPref = (listing.genderPreference || owner.householdExpectations?.genderPref || 'any').toLowerCase().trim();
  const seekerGender = (seeker.gender || '').toLowerCase().trim();
  let genderScore = 20;
  let isExplicitGenderMismatch = false;

  if (genderPref === 'female' || genderPref === 'female only') {
    if (seekerGender === 'female') {
      genderScore = 20;
      reasons.push('Matches Female-only requirement');
    } else if (seekerGender === 'male') {
      genderScore = 0;
      isExplicitGenderMismatch = true;
      caveats.push('Listing specifies Female-only flatmates');
    } else {
      genderScore = 10;
      caveats.push('Gender not specified on profile');
    }
  } else if (genderPref === 'male' || genderPref === 'male only') {
    if (seekerGender === 'male') {
      genderScore = 20;
      reasons.push('Matches Male-only requirement');
    } else if (seekerGender === 'female') {
      genderScore = 0;
      isExplicitGenderMismatch = true;
      caveats.push('Listing specifies Male-only flatmates');
    } else {
      genderScore = 10;
      caveats.push('Gender not specified on profile');
    }
  } else {
    // Open to any gender
    genderScore = 20;
    if (seekerGender) {
      reasons.push('Gender open (Any flatmate welcome)');
    }
  }

  // 4. House Rules & Habits Alignment (Max 20 pts)
  const rules = (listing.houseRules || []).map(r => (r || '').toLowerCase());
  const expectations = owner.householdExpectations || {};
  const seekerQuiz = seeker.quizAnswers || {};
  let rulesScore = 0;

  // A. Food Norms (5 pts)
  const isVegOnly = rules.some(r => r.includes('veg') && !r.includes('non-veg') && !r.includes('allowed')) ||
    expectations.dietPref === 'veg';
  if (isVegOnly) {
    if (seekerQuiz.food_pref === 'veg' || seekerQuiz.food_pref === 'vegan') {
      rulesScore += 5;
      reasons.push('Vegetarian matches veg kitchen rule');
    } else if (seekerQuiz.food_pref === 'non_veg') {
      caveats.push('Non-vegetarian applying for veg-only kitchen');
    } else {
      rulesScore += 3;
    }
  } else {
    rulesScore += 5;
  }

  // B. Smoking Policy (5 pts)
  const isNoSmoking = rules.some(r => r.includes('no smoking') || r.includes('smoke-free')) ||
    expectations.smokingPolicy === 'no_smoking';
  if (isNoSmoking) {
    if (seekerQuiz.smoking === 'never') {
      rulesScore += 5;
      reasons.push('Non-smoker matches smoke-free home');
    } else if (seekerQuiz.smoking === 'outside') {
      rulesScore += 3;
      reasons.push('Smokes outside only');
    } else if (seekerQuiz.smoking === 'regularly' || seekerQuiz.smoking === 'socially') {
      caveats.push('Smoking habit conflicts with smoke-free home rule');
    } else {
      rulesScore += 3;
    }
  } else {
    rulesScore += 5;
  }

  // C. Pet Policy (5 pts)
  const isNoPets = rules.some(r => r.includes('no pets')) || expectations.petPolicy === 'no_pets';
  if (isNoPets) {
    if (seekerQuiz.pets === 'no' || seekerQuiz.pets === 'allergic') {
      rulesScore += 5;
      reasons.push('No pets matches building policy');
    } else if (seekerQuiz.pets === 'love') {
      rulesScore += 2;
      caveats.push('Loves pets but listing has no-pets rule');
    } else {
      rulesScore += 4;
    }
  } else {
    rulesScore += 5;
  }

  // D. Lifestyle / Live-in Host Overlap (5 pts)
  const hostQuiz = listing.ownerQuizAnswers || owner.quizAnswers;
  if (hostQuiz && Object.keys(hostQuiz).length > 0 && Object.keys(seekerQuiz).length > 0) {
    const sharedKeys = Object.keys(hostQuiz).filter(k => k in seekerQuiz);
    if (sharedKeys.length > 0) {
      const matches = sharedKeys.filter(k => hostQuiz[k] === seekerQuiz[k]).length;
      const ratio = matches / sharedKeys.length;
      if (ratio >= 0.5) {
        rulesScore += 5;
        reasons.push('Shared lifestyle rhythm with host');
      } else {
        rulesScore += Math.round(ratio * 5);
      }
    } else {
      rulesScore += 3;
    }
  } else {
    // Standalone landlord property: general compliance
    if (seeker.onboardingComplete !== false) {
      rulesScore += 5;
    } else {
      rulesScore += 3;
    }
  }

  // 5. Trust & Verification (Max 15 pts)
  let trustScore = 0;
  if (seeker.isVerified) {
    trustScore += 10;
    reasons.push('ID verified resident');
  }
  if (seeker.workEmailVerified) {
    trustScore += 5;
    reasons.push('Work email verified');
  }
  if (trustScore === 0) {
    caveats.push('Profile not ID verified yet');
  }

  let totalScore = budgetScore + locationScore + genderScore + rulesScore + trustScore;

  // Hard Constraint: Explicit gender mismatch is capped at 40%
  if (isExplicitGenderMismatch) {
    totalScore = Math.min(40, totalScore);
  }

  // City Mismatch: Cross-city compatibility capped at 60%
  if (seekerCity && listingCity && seekerCity !== listingCity) {
    totalScore = Math.min(60, Math.round(totalScore * 0.6));
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  return {
    score: finalScore,
    budgetScore,
    locationScore,
    genderScore,
    rulesScore,
    trustScore,
    reasons,
    caveats,
  };
}

/**
 * Synthesize comparable quiz tokens from a profile's quizAnswers,
 * householdExpectations, and listing houseRules.
 */
export function synthesizeQuizFromProfile(profile: any, listing?: any): Record<string, string> {
  const result: Record<string, string> = { ...(profile?.quizAnswers || {}) };

  // 1. Household expectations from owner or seeker
  if (profile?.householdExpectations) {
    const exp = profile.householdExpectations;
    if (!result.smoking && exp.smokingPolicy) {
      result.smoking = exp.smokingPolicy === 'no_smoking' ? 'never' : 'occasionally';
    }
    if (!result.pets && exp.petPolicy) {
      result.pets = exp.petPolicy === 'no_pets' ? 'no' : 'love';
    }
    if (!result.food_pref && exp.dietPref) {
      result.food_pref = exp.dietPref === 'veg' ? 'veg' : 'non_veg';
    }
    if (!result.roommate_gender && exp.genderPref) {
      result.roommate_gender = exp.genderPref;
    }
  }

  // 2. Listing expectations / rules
  if (listing) {
    if (!result.roommate_gender && listing.genderPreference) {
      const gp = listing.genderPreference.toLowerCase();
      result.roommate_gender = gp.includes('female') ? 'female' : gp.includes('male') ? 'male' : 'any';
    }
    if (listing.houseRules && Array.isArray(listing.houseRules)) {
      const rules = listing.houseRules.map((r: string) => (r || '').toLowerCase());
      if (!result.cleanliness && rules.some((r: string) => r.includes('clean'))) {
        result.cleanliness = 'very';
      }
      if (!result.smoking && rules.some((r: string) => r.includes('no smoking') || r.includes('smoke-free'))) {
        result.smoking = 'never';
      }
      if (!result.pets && rules.some((r: string) => r.includes('no pets'))) {
        result.pets = 'no';
      }
      if (!result.food_pref && rules.some((r: string) => r.includes('veg') && !r.includes('non-veg'))) {
        result.food_pref = 'veg';
      }
      if (!result.guests && rules.some((r: string) => r.includes('no parties') || r.includes('no guests'))) {
        result.guests = 'rarely';
      }
    }
    if (listing.ownerQuizAnswers && typeof listing.ownerQuizAnswers === 'object') {
      Object.assign(result, listing.ownerQuizAnswers);
    }
  }

  return result;
}

export interface ProfileMatchResult {
  score: number;
  reasons: string[];
  caveats: string[];
}

/**
 * Universal profile compatibility calculator:
 * - Computes multi-factor room compatibility if one party has an active room listing.
 * - Computes synthesized quiz and preference compatibility for flatmate pairs.
 */
export function calculateProfileCompatibility(
  userA: any,
  userB: any,
  listing?: any
): ProfileMatchResult {
  if (!userA || !userB) {
    return { score: 0, reasons: [], caveats: ['Profile information unavailable'] };
  }

  const roleA = (userA.role || '').toLowerCase();
  const roleB = (userB.role || '').toLowerCase();

  // Scenario 1: One user is Seeker and the other has a Listing (or listing provided)
  const isSeekerAndOwnerWithListing =
    listing &&
    ((roleA === 'seeker' && roleB === 'owner') ||
      (roleA === 'owner' && roleB === 'seeker') ||
      roleB === 'owner' ||
      roleA === 'owner');

  if (isSeekerAndOwnerWithListing) {
    const seeker = roleA === 'owner' ? userB : userA;
    const owner = roleA === 'owner' ? userA : userB;
    const breakdown = getRoomMatchReasons(seeker, listing, owner);
    return {
      score: breakdown.score,
      reasons: breakdown.reasons,
      caveats: breakdown.caveats,
    };
  }

  // Scenario 2: Seeker ↔ Seeker OR User ↔ User without active room listing
  const answersA = synthesizeQuizFromProfile(userA);
  const answersB = synthesizeQuizFromProfile(userB, listing);

  const reasonsData = getMatchReasons(answersA, answersB, {
    myCity: userA.city,
    theirCity: userB.city,
    myBudget: userA.budget,
    theirBudget: userB.budget,
  });

  return reasonsData;
}

/**
 * Pure scalar helper for calculating room compatibility score (0-100%).
 */
export function calculateRoomCompatibility(
  seeker: SeekerMatchSignal = {},
  listing: ListingMatchSignal = {},
  owner: OwnerMatchSignal = {}
): number {
  return getRoomMatchReasons(seeker, listing, owner).score;
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


