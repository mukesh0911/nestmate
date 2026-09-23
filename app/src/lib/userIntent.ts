import type { UserProfile } from '@/hooks/useAuth';

export type UserIntentType = 'room_seeker' | 'roommate_seeker' | 'property_host';

export interface UserIntentDetails {
  type: UserIntentType;
  /** Primary intent badge displayed on cards (e.g. 'Looking for a Room', 'Room Available') */
  badgeText: string;
  badgeVariant: 'seeker' | 'room_available' | 'owner';
  /** Primary requirement description (e.g. 'A Room', 'A Roommate') */
  requirementLabel: string;
  requirementValue: string;
  /** Label for roommate/tenant preference column (e.g. 'Preference') */
  preferenceLabel: string;
  /** Financial label distinguishing budget vs rent */
  priceLabel: 'Budget' | 'Rent';
  priceSubtext: string;
  /** Role description (e.g. 'Room Seeker', 'Live-in Host', 'Property Host') */
  roleLabel: string;
}

/**
 * Determine a user's true marketplace intent from their profile, role, and listing context.
 *
 * Rules:
 * 1. Room Seeker (Needs a room):
 *    - role is 'seeker' (and no active listing and not an owner_flatmate)
 *    - Has a personal budget, not a rental property
 *    - Needs accommodation
 *
 * 2. Roommate Seeker (Has a room, needs a roommate):
 *    - role is 'owner' with ownerType === 'owner_flatmate' OR has an active room listing attached
 *    - OR seeker with housingIntent === 'have_room'
 *    - Has a room available to share, wants a roommate to move in
 *
 * 3. Property Host (Landlord / Property Manager):
 *    - role is 'owner' with ownerType === 'landlord'
 *    - Provides accommodation, wants tenants
 */
export function getUserIntent(
  profile?: Partial<UserProfile> | null,
  listing?: any | null
): UserIntentDetails {
  if (!profile) {
    return {
      type: 'room_seeker',
      badgeText: 'Looking for a Room',
      badgeVariant: 'seeker',
      requirementLabel: 'Seeking',
      requirementValue: 'A Room',
      preferenceLabel: 'Preference',
      priceLabel: 'Budget',
      priceSubtext: 'max / mo',
      roleLabel: 'Room Seeker',
    };
  }

  const role = (profile.role || 'seeker').toLowerCase();
  const ownerType = ((profile as any).ownerType || '').toLowerCase();
  const hasListing = Boolean(listing || (profile as any)._listing);
  const housingIntent = (profile as any).housingIntent;

  // Case 1: Live-in Host or user offering an existing room (including any profile with an attached listing)
  if (
    hasListing ||
    (role === 'owner' && (ownerType === 'owner_flatmate' || !ownerType)) ||
    housingIntent === 'have_room'
  ) {
    // If explicitly landlord without live-in, let landlord case handle below
    if (role === 'owner' && ownerType === 'landlord' && !listing) {
      // Handled in case 2
    } else {
      return {
        type: 'roommate_seeker',
        badgeText: 'Room Available',
        badgeVariant: 'room_available',
        requirementLabel: 'Seeking',
        requirementValue: 'A Roommate',
        preferenceLabel: 'Preference',
        priceLabel: 'Rent',
        priceSubtext: 'share / mo',
        roleLabel: 'Live-in Host',
      };
    }
  }

  // Case 2: Absentee Landlord / Property Owner
  if (role === 'owner' && ownerType === 'landlord') {
    return {
      type: 'property_host',
      badgeText: 'Property Host',
      badgeVariant: 'owner',
      requirementLabel: 'Offering',
      requirementValue: 'Room / Property',
      preferenceLabel: 'Preference',
      priceLabel: 'Rent',
      priceSubtext: '/ mo',
      roleLabel: 'Property Host',
    };
  }

  // Case 3: Seeker teaming up
  if (housingIntent === 'team_up') {
    return {
      type: 'room_seeker',
      badgeText: 'Teaming Up for a Room',
      badgeVariant: 'seeker',
      requirementLabel: 'Seeking',
      requirementValue: 'Team-Up Flat',
      preferenceLabel: 'Preference',
      priceLabel: 'Budget',
      priceSubtext: 'max / mo',
      roleLabel: 'Room Seeker',
    };
  }

  // Case 4: Standard Room Seeker (Default)
  return {
    type: 'room_seeker',
    badgeText: 'Looking for a Room',
    badgeVariant: 'seeker',
    requirementLabel: 'Seeking',
    requirementValue: profile.preferredRoomType || 'A Room',
    preferenceLabel: 'Preference',
    priceLabel: 'Budget',
    priceSubtext: 'max / mo',
    roleLabel: 'Room Seeker',
  };
}

/**
 * Resolves the preferred roommate gender truthfully from preferences or quiz answers.
 *
 * CRITICAL RULE:
 * NEVER fall back to the user's own gender!
 * If user hasn't specified a preference, return 'Any Gender'.
 */
export function getPreferredRoommateGender(
  profile?: Partial<UserProfile> | null,
  listing?: any | null
): { label: string; raw: 'female' | 'male' | 'any' } {
  if (!profile && !listing) {
    return { label: 'Any Gender', raw: 'any' };
  }

  const rawPref =
    listing?.preferredGender ||
    listing?.householdExpectations?.genderPref ||
    profile?.householdExpectations?.genderPref ||
    profile?.quizAnswers?.roommate_gender ||
    profile?.preferences?.genderPref ||
    (profile as any)?.preferredGender;

  if (typeof rawPref === 'string') {
    const normalized = rawPref.trim().toLowerCase();
    if (normalized === 'female' || normalized.includes('female')) {
      return { label: 'Female Only', raw: 'female' };
    }
    if (normalized === 'male' || normalized.includes('male')) {
      return { label: 'Male Only', raw: 'male' };
    }
  }

  return { label: 'Any Gender', raw: 'any' };
}

/**
 * Returns a clean, truthful initials representation for user avatar fallback.
 * Example: 'Mukeshram G' -> 'MG', 'Ram' -> 'R', null -> 'U'
 */
export function getUserInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
