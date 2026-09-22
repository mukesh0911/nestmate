export interface UserProfileLike {
  uid: string;
  role: 'seeker' | 'owner' | string | null;
  name?: string;
}

/**
 * Filter candidates based on logged-in user role:
 * - OWNER sees SEEKERS (excluding self)
 * - SEEKER sees OWNERS (excluding self)
 */
export function filterProfilesByRole<T extends UserProfileLike>(
  profiles: T[],
  currentUserId: string | null | undefined,
  currentUserRole: 'seeker' | 'owner' | string | null | undefined
): T[] {
  if (!currentUserId || !currentUserRole) return [];
  const targetRole = currentUserRole.toLowerCase() === 'owner' ? 'seeker' : 'owner';

  return profiles.filter(p => {
    if (!p.uid || p.uid === currentUserId) return false;
    const r = (p.role || '').toLowerCase();
    return r === targetRole;
  });
}

/**
 * Filter candidates for the Flatmates / Roommates discovery tab (DISC-03):
 * - SEEKER discovers OTHER SEEKERS (potential roommates, excluding self)
 * - OWNER discovers SEEKERS (prospective tenants/flatmates, excluding self)
 * Both roles browse 'seeker' profiles on this tab, excluding the logged-in user.
 */
export function filterFlatmateProfiles<T extends UserProfileLike>(
  profiles: T[],
  currentUserId: string | null | undefined,
  currentUserRole?: 'seeker' | 'owner' | string | null | undefined
): T[] {
  return profiles.filter(p => {
    if (!p.uid || p.uid === currentUserId) return false;
    const r = (p.role || '').toLowerCase();
    const isOwnerFlatmate = (p as any).ownerType === 'owner_flatmate';
    if (currentUserRole === 'owner') {
      return r === 'seeker';
    }
    return r === 'seeker' || isOwnerFlatmate;
  });
}

