import { useEffect, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function useActiveTracking() {
  const { user } = useAuth();
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdateRef = useRef<boolean>(false);

  useEffect(() => {
    if (!user) return;

    const trackActivity = async () => {
      if (!user.uid) return;
      
      const now = Date.now();
      // Only update if 5 minutes have passed since last update
      if (now - lastUpdateRef.current >= FIVE_MINUTES_MS && !pendingUpdateRef.current) {
        pendingUpdateRef.current = true;
        try {
          const userRef = doc(db, 'users', user.uid);
          // Sprint 7 fix: merge-set instead of updateDoc so a missing profile
          // document is created rather than denied (update on missing doc is
          // PERMISSION_DENIED even for the owner).
          await setDoc(userRef, {
            lastActiveAt: serverTimestamp(),
          }, { merge: true });
          lastUpdateRef.current = now;
        } catch (e) {
          console.error('Failed to update activity status:', e);
        } finally {
          pendingUpdateRef.current = false;
        }
      }
    };

    // Update on initial load
    trackActivity();

    // Attach listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleEvent = () => trackActivity();

    events.forEach(event => {
      window.addEventListener(event, handleEvent, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleEvent);
      });
    };
  }, [user]);
}
