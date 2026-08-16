import { useState, useCallback, useRef } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';



export interface Listing {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  title: string;
  description: string;
  flatType: string;
  furnishing: string;
  city: string;
  locality: string;
  address: string;
  totalRent: number;
  partnerShare: number;
  partnersNeeded: number;
  deposit: number;
  amenities: string[];
  houseRules: string[];
  images: string[];
  availableFrom: string;
  lat: number;
  lng: number;
  status: 'active' | 'paused' | 'filled';
  applicants: number;
  views: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isOwnerPremium?: boolean;
  isOwnerVerified?: boolean;
  ownerQuizAnswers?: Record<string, string>;
}

export interface ListingFilters {
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  flatType?: string[];
  furnishing?: string[];
  amenities?: string[];
}

function applyClientFilters(results: Listing[], filters?: ListingFilters): Listing[] {
  if (!filters) return results;
  if (filters.city) {
    const target = filters.city.toLowerCase().trim();
    results = results.filter(l => (l.city || '').toLowerCase().trim() === target || (l.city || '').toLowerCase().includes(target));
  }
  if (filters.budgetMin !== undefined) {
    results = results.filter(l => (l.partnerShare || l.totalRent || 0) >= (filters.budgetMin ?? 0));
  }
  if (filters.budgetMax !== undefined) {
    results = results.filter(l => (l.partnerShare || l.totalRent || 0) <= (filters.budgetMax ?? Infinity));
  }
  if (filters.flatType?.length) {
    results = results.filter(l => filters.flatType!.includes(l.flatType));
  }
  if (filters.furnishing?.length) {
    results = results.filter(l => filters.furnishing!.includes(l.furnishing));
  }
  if (filters.amenities?.length) {
    results = results.filter(l => filters.amenities!.every(a => l.amenities?.includes(a)));
  }
  return results;
}

const PAGE_SIZE = 20;

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  const getListings = useCallback(async (filters?: ListingFilters, reset = true): Promise<Listing[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const enhanceAndSortListings = async (rawListings: Listing[]): Promise<Listing[]> => {
        if (rawListings.length === 0) return [];
        const ownerIds = Array.from(new Set(rawListings.map(r => r.ownerId).filter(Boolean)));
        let ownersMap = new Map<string, any>();
        if (ownerIds.length > 0) {
          try {
            const ownerSnaps = await Promise.all(
              ownerIds.map(id => getDoc(doc(db, 'users', id)))
            );
            ownerSnaps.forEach(d => {
              if (d.exists()) {
                ownersMap.set(d.id, d.data());
              }
            });
          } catch (err) {
            console.error('Failed to pre-fetch owners profile details for listings:', err);
          }
        }
        const DEFAULT_OWNER_QUIZ = { q1: '2', q2: '1', q3: '3', q4: '2', q5: '1' };
        const enhanced = rawListings.map(r => {
          const owner = ownersMap.get(r.ownerId);
          const ownerQuiz = owner?.quizAnswers && Object.keys(owner.quizAnswers).length > 0
            ? owner.quizAnswers
            : (r as any).ownerQuizAnswers && Object.keys((r as any).ownerQuizAnswers).length > 0
            ? (r as any).ownerQuizAnswers
            : DEFAULT_OWNER_QUIZ;

          return {
            ...r,
            ownerQuizAnswers: ownerQuiz,
            isOwnerPremium: owner?.isPremium || false,
            isOwnerVerified: owner?.isVerified || false,
          };
        });
        enhanced.sort((a, b) => {
          const aPrem = a.isOwnerPremium ? 1 : 0;
          const bPrem = b.isOwnerPremium ? 1 : 0;
          if (aPrem !== bPrem) return bPrem - aPrem;

          const aVer = a.isOwnerVerified ? 1 : 0;
          const bVer = b.isOwnerVerified ? 1 : 0;
          if (aVer !== bVer) return bVer - aVer;

          return 0;
        });
        return enhanced;
      };

      let fetchedResults: Listing[] = [];
      try {
        const constraints: any[] = [
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(100),
        ];

        if (filters?.city) {
          const newConstraints: any[] = [
            where('status', '==', 'active'),
            where('city', '==', filters.city),
            orderBy('createdAt', 'desc'),
            limit(100),
          ];
          if (!reset && lastDocRef.current) {
            newConstraints.push(startAfter(lastDocRef.current));
          }
          const q = query(collection(db, 'listings'), ...newConstraints);
          const snap = await getDocs(q);
          lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
          setHasMore(snap.docs.length === 100);
          fetchedResults = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
        } else {
          if (!reset && lastDocRef.current) {
            constraints.push(startAfter(lastDocRef.current));
          }
          const q = query(collection(db, 'listings'), ...constraints);
          const snap = await getDocs(q);
          lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
          setHasMore(snap.docs.length === 100);
          fetchedResults = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
        }
      } catch (e) {
        console.warn('Firestore constrained listings fetch failed, executing fallback all-listings query:', e);
      }

      // Robust fallback query if constrained query returned no results or failed
      if (fetchedResults.length === 0) {
        try {
          const rawSnap = await getDocs(collection(db, 'listings'));
          fetchedResults = rawSnap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Listing))
            .filter((l) => l.status === 'active' || !l.status);
        } catch (err) {
          console.error('Fallback listings query failed:', err);
        }
      }



      // Apply client-side filtering on Firestore results
      let results = applyClientFilters(fetchedResults, filters);
      results = await enhanceAndSortListings(results);

      if (reset) {
        setListings(results);
      } else {
        setListings(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const uniqueResults = results.filter(r => !existingIds.has(r.id));
          return [...prev, ...uniqueResults];
        });
      }
      return results;
    } catch (err: any) {
      setError(err.message);
      setListings([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async (filters?: ListingFilters) => {
    if (!hasMore || isLoading) return;
    await getListings(filters, false);
  }, [hasMore, isLoading, getListings]);

  const getListingById = useCallback(async (id: string): Promise<Listing | null> => {
    try {
      const snap = await getDoc(doc(db, 'listings', id));
      if (snap.exists()) {
        const data = snap.data() as Omit<Listing, 'id'>;
        let isOwnerVerified = false;
        let isOwnerPremium = false;
        let ownerQuizAnswers: Record<string, string> = { q1: '2', q2: '1', q3: '3', q4: '2', q5: '1' };
        if (data.ownerId) {
          try {
            const ownerSnap = await getDoc(doc(db, 'users', data.ownerId));
            if (ownerSnap.exists()) {
              const owner = ownerSnap.data();
              isOwnerVerified = !!owner.isVerified;
              isOwnerPremium = !!owner.isPremium;
              if (owner.quizAnswers && Object.keys(owner.quizAnswers).length > 0) {
                ownerQuizAnswers = owner.quizAnswers;
              }
            }
          } catch {
            // ignore owner enrichment failures
          }
        }
        if ((data as any).ownerQuizAnswers && Object.keys((data as any).ownerQuizAnswers).length > 0) {
          ownerQuizAnswers = (data as any).ownerQuizAnswers;
        }
        return { id: snap.id, ...data, isOwnerVerified, isOwnerPremium, ownerQuizAnswers };
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  const getMyListings = useCallback(async (ownerId: string): Promise<Listing[]> => {
    try {
      const q = query(
        collection(db, 'listings'),
        where('ownerId', '==', ownerId)
      );
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
      return results.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
    } catch (err) {
      console.error("Error fetching my listings:", err);
      return [];
    }
  }, []);

  const createListing = useCallback(
    async (ownerId: string, data: Omit<Listing, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'applicants' | 'views'>): Promise<string> => {
      const docRef = await addDoc(collection(db, 'listings'), {
        ...data,
        ownerId,
        applicants: 0,
        views: 0,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    },
    []
  );

  const updateListing = useCallback(
    async (id: string, data: Partial<Listing>) => {
      await updateDoc(doc(db, 'listings', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const deleteListing = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'listings', id));
  }, []);

  const incrementViews = useCallback(async (id: string) => {
    const ref = doc(db, 'listings', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { views: (snap.data().views || 0) + 1 });
    }
  }, []);

  /**
   * Record a listing view:
   * 1. Increment listings/{id}.views
   * 2. Upsert listingViews/{listingId}_{YYYY-MM-DD}.count for analytics
   */
  const recordView = useCallback(async (listingId: string) => {
    // Increment total views on listing doc
    const listingRef = doc(db, 'listings', listingId);
    const snap = await getDoc(listingRef);
    if (snap.exists()) {
      await updateDoc(listingRef, { views: (snap.data().views || 0) + 1 });
    }

    // Upsert daily analytics record
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const viewDocId = `${listingId}_${today}`;
    const viewRef = doc(db, 'listingViews', viewDocId);
    const viewSnap = await getDoc(viewRef);
    if (viewSnap.exists()) {
      await updateDoc(viewRef, { count: (viewSnap.data().count || 0) + 1 });
    } else {
      await setDoc(viewRef, { listingId, date: today, count: 1 });
    }
  }, []);

  /**
   * Get last 7 days of view counts for a listing.
   * Returns array of { date: 'Mon', count: N } ready for charting.
   */
  const getWeeklyViews = useCallback(async (listingId: string): Promise<{ day: string; views: number }[]> => {
    const days: { day: string; date: string; views: number }[] = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = dayLabels[d.getDay()];
      days.push({ day: label, date: dateStr, views: 0 });
    }

    // Batch fetch all 7 docs
    const fetches = days.map(d =>
      getDoc(doc(db, 'listingViews', `${listingId}_${d.date}`))
    );
    const snaps = await Promise.all(fetches);
    snaps.forEach((snap, i) => {
      if (snap.exists()) {
        days[i].views = snap.data().count || 0;
      }
    });

    return days.map(d => ({ day: d.day, views: d.views }));
  }, []);

  return {
    listings,
    isLoading,
    error,
    hasMore,
    getListings,
    loadMore,
    getListingById,
    getMyListings,
    createListing,
    updateListing,
    deleteListing,
    incrementViews,
    recordView,
    getWeeklyViews,
  };
}

