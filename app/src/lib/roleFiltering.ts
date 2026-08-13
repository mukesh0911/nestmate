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
