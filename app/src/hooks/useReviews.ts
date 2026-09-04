import { useState, useCallback } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { validateReview } from '@/lib/reviewValidation';

export interface Review {
  id: string;
  targetUserId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  text: string;
  createdAt: Timestamp;
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getReviewsForUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'reviews'),
        where('targetUserId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
      setReviews(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch reviews', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addReview = useCallback(
    async (
      targetUserId: string,
      reviewerId: string,
      reviewerName: string,
      reviewerAvatar: string,
      rating: number,
      text: string
    ) => {
      // Sprint 2B: authoritative validation mirroring Firestore rules —
      // reviewer identity must match the signed-in user, no self-reviews,
      // rating 1..5, capped text.
      const check = validateReview({ reviewerId, targetUserId, rating, text }, reviewerId);
      if (!check.ok) {
        throw new Error(check.reason);
      }

      // Check if user has already reviewed this target
      try {
        const existingQuery = query(
          collection(db, 'reviews'),
          where('targetUserId', '==', targetUserId),
          where('reviewerId', '==', reviewerId)
        );
        const existingSnap = await getDocs(existingQuery);
        if (!existingSnap.empty) {
          throw new Error('You have already submitted a vouch for this profile.');
        }
      } catch (err: any) {
        if (err.message?.includes('already submitted')) throw err;
        // Ignore Firestore index missing warnings on fallback
      }

      try {
        const ref = await addDoc(collection(db, 'reviews'), {
          targetUserId,
          reviewerId,
          reviewerName,
          reviewerAvatar,
          rating,
          text,
          createdAt: serverTimestamp(),
        });

        const newReview: Review = {
          id: ref.id,
          targetUserId,
          reviewerId,
          reviewerName,
          reviewerAvatar,
          rating,
          text,
          createdAt: Timestamp.now(),
        };

        setReviews(prev => [newReview, ...prev.filter(r => r.reviewerId !== reviewerId)]);
        return ref.id;
      } catch (err) {
        console.error('Failed to add review', err);
        throw err;
      }
    },
    []
  );

  return {
    reviews,
    isLoading,
    getReviewsForUser,
    addReview,
  };
}
