import { useCallback } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  doc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Connection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: Timestamp;
}

export const FREE_CONNECT_LIMIT = 5;

export function useConnections() {
  /** Count outgoing connections sent this calendar month */
  const getMonthlyConnectCount = useCallback(async (userId: string): Promise<number> => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startMs = startOfMonth.getTime();
    
    const q = query(
      collection(db, 'connections'),
      where('fromUserId', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.filter(d => {
      const createdAt = d.data().createdAt;
      if (!createdAt) return false;
      const ms = createdAt.toMillis ? createdAt.toMillis() : (createdAt instanceof Date ? createdAt.getTime() : 0);
      return ms >= startMs;
    }).length;
  }, []);

  /** Send a connect request from `fromId` to `toId`. Enforces free-tier monthly limit. */
  const sendRequest = useCallback(
    async (fromId: string, toId: string): Promise<string> => {
      // Platform is 100% free for all users - unlimited connections

      // Check if a connection already exists between these two
      const q = query(
        collection(db, 'connections'),
        where('fromUserId', '==', fromId),
        where('toUserId', '==', toId)
      );
      const existing = await getDocs(q);
      if (!existing.empty) return existing.docs[0].id;

      // Also check the reverse direction
      const q2 = query(
        collection(db, 'connections'),
        where('fromUserId', '==', toId),
        where('toUserId', '==', fromId)
      );
      const existing2 = await getDocs(q2);
      if (!existing2.empty) return existing2.docs[0].id;

      const ref = await addDoc(collection(db, 'connections'), {
        fromUserId: fromId,
        toUserId: toId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      return ref.id;
    },
    [getMonthlyConnectCount]
  );

  /** Get all pending requests sent TO a specific user */
  const getIncomingRequests = useCallback(async (userId: string): Promise<Connection[]> => {
    const q = query(
      collection(db, 'connections'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Connection));
  }, []);

  /** Get all connections for a user (any direction, any status) */
  const getMyConnections = useCallback(async (userId: string, status?: string): Promise<Connection[]> => {
    const results: Connection[] = [];

    const q1 = query(collection(db, 'connections'), where('fromUserId', '==', userId));
    const q2 = query(collection(db, 'connections'), where('toUserId', '==', userId));
    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    [...s1.docs, ...s2.docs].forEach(d => {
      const data = { id: d.id, ...d.data() } as Connection;
      if (!status || data.status === status) results.push(data);
    });
    return results;
  }, []);

  /** Accept a connection request */
  const acceptRequest = useCallback(async (connectionId: string) => {
    await updateDoc(doc(db, 'connections', connectionId), {
      status: 'accepted',
    });
  }, []);

  /** Reject a connection request */
  const rejectRequest = useCallback(async (connectionId: string) => {
    await updateDoc(doc(db, 'connections', connectionId), {
      status: 'rejected',
    });
  }, []);

  /** Block a user */
  const blockUser = useCallback(async (connectionId: string) => {
    await updateDoc(doc(db, 'connections', connectionId), {
      status: 'blocked',
    });
  }, []);

  /** Subscribe to incoming pending requests (real-time) */
  const subscribeToIncoming = useCallback(
    (userId: string, onChange: (conns: Connection[]) => void) => {
      const q = query(
        collection(db, 'connections'),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      return onSnapshot(q, snap => {
        onChange(snap.docs.map(d => ({ id: d.id, ...d.data() } as Connection)));
      });
    },
    []
  );

  return {
    sendRequest,
    getIncomingRequests,
    getMyConnections,
    acceptRequest,
    rejectRequest,
    blockUser,
    subscribeToIncoming,
    getMonthlyConnectCount,
  };
}
