import { useCallback } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState, useRef } from 'react';
import type { UserProfile } from './useAuth';

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  compatibilityScore: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

export interface MatchedUser {
  profile: UserProfile;
  compatibilityScore: number;
  matchId?: string;
  listingId?: string;
}

/**
 * Calculate dynamic compatibility score between two user profiles based on Firestore quizAnswers.
 * Computes exact mathematical vector similarity across answered lifestyle questions.
 * Returns integer percentage (0-100%).
 */
export function calculateCompatibility(
  answersA: Record<string, string> = {},
  answersB: Record<string, string> = {}
): number {
  const keysA = Object.keys(answersA || {});
  const keysB = Object.keys(answersB || {});

  // Find questions answered in common
  const commonKeys = keysA.filter((k) => keysB.includes(k));

  if (commonKeys.length > 0) {
    let totalSimilarity = 0;
    commonKeys.forEach((key) => {
      const valA = parseInt(answersA[key], 10);
      const valB = parseInt(answersB[key], 10);
      if (!isNaN(valA) && !isNaN(valB)) {
        const diff = Math.abs(valA - valB);
        // Scale distance: 0 diff = 1.0 (100%), 1 diff = 0.67, 2 diff = 0.33, 3 diff = 0.0
        const similarity = 1 - Math.min(diff, 3) / 3;
        totalSimilarity += similarity;
      } else if (answersA[key] === answersB[key]) {
        totalSimilarity += 1.0;
      }
    });
    return Math.round((totalSimilarity / commonKeys.length) * 100);
  }

  // If both have answers but no common keys, compare total available keys
  const unionKeys = Array.from(new Set([...keysA, ...keysB]));
  if (unionKeys.length > 0) {
    let matches = 0;
    unionKeys.forEach((k) => {
      if (answersA[k] && answersB[k] && answersA[k] === answersB[k]) {
        matches += 1;
      }
    });
    return Math.round((matches / unionKeys.length) * 100);
  }

  return 0;
}

/**
 * Get active status based on lastActiveAt timestamp.
 */
export function getActiveStatus(timestamp: any): { status: 'online' | 'recent' | 'offline'; text: string } {
  if (!timestamp) return { status: 'offline', text: 'Active a while ago' };
  
  const lastActive = timestamp.toMillis ? timestamp.toMillis() : (timestamp instanceof Date ? timestamp.getTime() : timestamp);
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

export function useMatches() {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  /**
   * Find potential matches for a seeker.
   * Queries users in the same city, computes compatibility, sorts by score.
   */
  const findMatches = useCallback(
    async (currentUser: UserProfile, uiCity?: string, filters?: any, isLoadMore = false): Promise<MatchedUser[]> => {
      const targetCity = uiCity !== undefined ? uiCity : currentUser.city;

      const constraints: any[] = [where('onboardingComplete', '==', true)];
      if (targetCity) {
        constraints.push(where('city', '==', targetCity));
      }

      // Role-based filtering: seekers see owners, owners see seekers
      const oppositeRole = currentUser.role === 'seeker' ? 'owner' : currentUser.role === 'owner' ? 'seeker' : null;
      if (oppositeRole) {
        constraints.push(where('role', '==', oppositeRole));
      }

      const skippedIds = new Set(currentUser.skippedUserIds || []);
      const blockedIds = new Set(currentUser.blockedUserIds || []);

      if (isLoadMore && lastDocRef.current) {
        constraints.push(startAfter(lastDocRef.current));
      } else if (!isLoadMore) {
        lastDocRef.current = null;
      }
      constraints.push(limit(20));

      const q = query(collection(db, 'users'), ...constraints);
      const snap = await getDocs(q);
      
      const newLastDoc = snap.docs[snap.docs.length - 1];
      lastDocRef.current = newLastDoc || null;
      
      if (!isLoadMore) {
        setPage(1);
      } else {
        setPage(p => p + 1);
      }
      setHasMore(snap.docs.length === 20);

      const candidates = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
        .filter((u) => u.uid !== currentUser.uid && !skippedIds.has(u.uid || '') && !blockedIds.has(u.uid || ''));

      // If the seeker is looking for owners, eagerly fetch active listings to attach to profiles
      const listingMap = new Map<string, any>();
      if (oppositeRole === 'owner' || !oppositeRole) {
        const lqConstraints: any[] = [where('status', '==', 'active')];
        if (targetCity) lqConstraints.push(where('city', '==', targetCity));
        try {
          const lq = query(collection(db, 'listings'), ...lqConstraints);
          const lsnap = await getDocs(lq);
          lsnap.docs.forEach(d => {
            if (d.data().ownerId) {
              listingMap.set(d.data().ownerId, { id: d.id, ...d.data() });
            }
          });
        } catch (err) {
          console.error('Failed to pre-fetch listings for candidates:', err);
        }
      }

      let scored: MatchedUser[] = candidates.map((u) => {
        const listingData = listingMap.get(u.uid || '');
        const profileToUse = { ...u };
        
        // Patch owner profile with listing data so filters and UI work correctly
        if (listingData) {
          if (!profileToUse.localities || profileToUse.localities.length === 0) {
            profileToUse.localities = [listingData.locality];
          }
          // Prioritize listing's partnerShare or totalRent for seeker match filtering
          profileToUse.budget = listingData.partnerShare || listingData.totalRent || profileToUse.budget;
          if (!profileToUse.moveInDate) {
            profileToUse.moveInDate = listingData.availableFrom;
          }
          // Attach extra listing data for filtering purposes
          (profileToUse as any)._listing = listingData;
        }

        return {
          profile: profileToUse,
          listingId: listingData?.id,
          compatibilityScore: calculateCompatibility(
            currentUser.quizAnswers || {},
            u.quizAnswers || {}
          ),
        };
      });

      // Apply Filters if provided
      if (filters) {
        scored = scored.filter(match => {
          const p = match.profile;
          const listing = (p as any)._listing;

          // Verified Only
          if (filters.verifiedOnly && !p.isVerified) return false;

          // Gender
          if (filters.gender && filters.gender !== 'any') {
            if (p.gender?.toLowerCase() !== filters.gender) return false;
          }

          // Budget
          const budget = p.budget || 0;
          if (budget > 0) {
            if (filters.budgetMin && budget < filters.budgetMin) return false;
            if (filters.budgetMax && budget > filters.budgetMax) return false;
          }

          // Localities
          if (filters.localities && filters.localities.length > 0) {
            const hasMatch = filters.localities.some((loc: string) => 
              p.localities?.includes(loc) || listing?.locality === loc
            );
            if (!hasMatch) return false;
          }

          // Flat Type (only applies if they have a listing)
          if (filters.flatType && filters.flatType.length > 0) {
            if (!listing || !filters.flatType.includes(listing.flatType)) return false;
          }

          // Furnishing (only applies if they have a listing)
          if (filters.furnishing && filters.furnishing.length > 0) {
            if (!listing || !filters.furnishing.includes(listing.furnishing)) return false;
          }

          // Amenities (must have ALL selected amenities)
          if (filters.amenities && filters.amenities.length > 0) {
            if (!listing || !listing.amenities) return false;
            const hasAll = filters.amenities.every((a: string) => listing.amenities.includes(a));
            if (!hasAll) return false;
          }

          return true;
        });
      }

      // Sort by Premium, Verified, then compatibility
      return scored.sort((a, b) => {
        const aPrem = a.profile.isPremium ? 1 : 0;
        const bPrem = b.profile.isPremium ? 1 : 0;
        if (aPrem !== bPrem) return bPrem - aPrem;

        const aVer = a.profile.isVerified ? 1 : 0;
        const bVer = b.profile.isVerified ? 1 : 0;
        if (aVer !== bVer) return bVer - aVer;

        return b.compatibilityScore - a.compatibilityScore;
      });
    },
    []
  );

  const createMatch = useCallback(
    async (userId: string, matchedUserId: string, score: number): Promise<string> => {
      const docRef = await addDoc(collection(db, 'matches'), {
        userId,
        matchedUserId,
        compatibilityScore: score,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    []
  );

  const getMatches = useCallback(async (userId: string): Promise<Match[]> => {
    // Firestore doesn't support OR queries; merge two queries
    const [q1, q2] = await Promise.all([
      getDocs(query(collection(db, 'matches'), where('userId', '==', userId), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'matches'), where('matchedUserId', '==', userId), orderBy('createdAt', 'desc'))),
    ]);
    const all = [...q1.docs, ...q2.docs].map((d) => ({ id: d.id, ...d.data() } as Match));
    // Deduplicate (shouldn't happen, but safety)
    const seen = new Set<string>();
    return all.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, []);

  const getMatchedUserProfiles = useCallback(
    async (userId: string): Promise<MatchedUser[]> => {
      const matches = await getMatches(userId);
      const profiles = await Promise.all(
        matches.map(async (m) => {
          const otherId = m.userId === userId ? m.matchedUserId : m.userId;
          const snap = await getDoc(doc(db, 'users', otherId));
          if (!snap.exists()) return null;
          return {
            profile: snap.data() as UserProfile,
            compatibilityScore: m.compatibilityScore,
            matchId: m.id,
          } as MatchedUser;
        })
      );
      return profiles.filter(Boolean) as MatchedUser[];
    },
    [getMatches]
  );

  const skipUser = useCallback(async (userId: string, skippedUserId: string) => {
    await addDoc(collection(db, 'skippedUsers'), {
      userId,
      skippedUserId,
      createdAt: serverTimestamp()
    });
  }, []);

  const getProfilesByIds = useCallback(
    async (currentUser: UserProfile, uids: string[]): Promise<MatchedUser[]> => {
      if (!uids || uids.length === 0) return [];
      
      const profiles = await Promise.all(
        uids.map(async (id) => {
          const snap = await getDoc(doc(db, 'users', id));
          if (!snap.exists()) return null;
          
          const user = { uid: snap.id, ...snap.data() } as UserProfile;
          
          let listingId;
          if (user.role === 'owner') {
            const lq = query(collection(db, 'listings'), where('ownerId', '==', user.uid), where('status', '==', 'active'));
            const lsnap = await getDocs(lq);
            if (!lsnap.empty) listingId = lsnap.docs[0].id;
          }

          return {
            profile: user,
            listingId,
            compatibilityScore: calculateCompatibility(
              currentUser.quizAnswers || {},
              user.quizAnswers || {}
            ),
          } as MatchedUser;
        })
      );
      return profiles.filter(Boolean) as MatchedUser[];
    },
    []
  );

  return {
    findMatches,
    createMatch,
    getMatches,
    getMatchedUserProfiles,
    calculateCompatibility,
    skipUser,
    getProfilesByIds,
    page,
    hasMore,
  };
}
