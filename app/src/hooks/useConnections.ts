import { useCallback } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  doc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  or,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  FREE_CONNECT_LIMIT,
  findExistingConnectionId,
  countConnectionsSince,
} from '@/lib/connectionGuards';

export interface Connection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: Timestamp;
}

export { FREE_CONNECT_LIMIT };

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
    const msList = snap.docs.map(d => {
      const createdAt = d.data().createdAt;
      if (!createdAt) return 0;
      return createdAt.toMillis ? createdAt.toMillis() : (createdAt instanceof Date ? createdAt.getTime() : 0);
    });
    return countConnectionsSince(msList, startMs);
  }, []);

  /** Send a connect request from `fromId` to `toId`. Returns the connection doc ID. */
  const sendRequest = useCallback(
    async (fromId: string, toId: string): Promise<string> => {
      const q = query(
        collection(db, 'connections'),
        where('fromUserId', '==', fromId),
        where('toUserId', '==', toId)
      );
      const existing = await getDocs(q);
      const q2 = query(
        collection(db, 'connections'),
        where('fromUserId', '==', toId),
        where('toUserId', '==', fromId)
      );
      const existing2 = await getDocs(q2);

      const pairs = [
        ...existing.docs.map(d => ({ id: d.id, fromUserId: fromId, toUserId: toId })),
        ...existing2.docs.map(d => ({ id: d.id, fromUserId: toId, toUserId: fromId })),
      ];
      const existingId = findExistingConnectionId(pairs, fromId, toId);
      if (existingId) return existingId;

      const ref = await addDoc(collection(db, 'connections'), {
        fromUserId: fromId,
        toUserId: toId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      return ref.id;
    },
    []
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

  /** Get a single connection document by ID */
  const getConnectionById = useCallback(async (connectionId: string): Promise<Connection | null> => {
    const snap = await getDoc(doc(db, 'connections', connectionId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Connection;
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

  /** Subscribe to incoming pending requests (real-time) — used by OwnerDashboard */
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

  /**
   * Subscribe to ALL connections involving a user in either direction (real-time).
   * Used by SeekerDashboard and MatchDetail so button states update instantly
   * when the other party accepts/rejects without a page refresh.
   *
   * Firestore does not support OR queries across two fields directly, so we run
   * two listeners and merge them in memory, deduplicating by connection ID.
   */
  const subscribeToMyConnections = useCallback(
    (userId: string, onChange: (conns: Connection[]) => void) => {
      const map = new Map<string, Connection>();

      const notify = () => onChange(Array.from(map.values()));

      const qSent = query(
        collection(db, 'connections'),
        where('fromUserId', '==', userId)
      );
      const qReceived = query(
        collection(db, 'connections'),
        where('toUserId', '==', userId)
      );

      const unsubSent = onSnapshot(qSent, snap => {
        snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Connection));
        // Remove any docs that were deleted from this query
        snap.docChanges().filter(c => c.type === 'removed').forEach(c => map.delete(c.doc.id));
        notify();
      });

      const unsubReceived = onSnapshot(qReceived, snap => {
        snap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() } as Connection));
        snap.docChanges().filter(c => c.type === 'removed').forEach(c => map.delete(c.doc.id));
        notify();
      });

      // Return a combined unsubscribe function
      return () => {
        unsubSent();
        unsubReceived();
      };
    },
    []
  );

  return {
    sendRequest,
    getIncomingRequests,
    getMyConnections,
    getConnectionById,
    acceptRequest,
    rejectRequest,
    blockUser,
    subscribeToIncoming,
    subscribeToMyConnections,
    getMonthlyConnectCount,
  };
}
