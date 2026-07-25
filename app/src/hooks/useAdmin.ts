import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit, updateDoc, deleteDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

// Hardcoded admin emails for bootstrap — also checks Firestore admins collection
const HARDCODED_ADMIN_EMAILS = ['test@nestmate.com', 'admin@nestmate.com'];

export function useAdmin() {
  const { user, profile } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = loading
  const [checking, setChecking] = useState(true);

  // Check admin status
  useEffect(() => {
    if (!user?.uid) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        // 1. Check hardcoded emails
        const email = user.email || profile?.email || '';
        if (HARDCODED_ADMIN_EMAILS.includes(email.toLowerCase())) {
          setIsAdmin(true);
          setChecking(false);
          return;
        }

        // 2. Check Firestore admins/{uid}
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          setIsAdmin(true);
          setChecking(false);
          return;
        }

        // 3. Check config/admin adminEmails array
        const configDoc = await getDoc(doc(db, 'config', 'admin'));
        if (configDoc.exists()) {
          const adminEmails: string[] = configDoc.data()?.adminEmails || [];
          if (adminEmails.includes(email.toLowerCase())) {
            setIsAdmin(true);
            setChecking(false);
            return;
          }
        }

        setIsAdmin(false);
      } catch (err) {
        console.error('Admin check failed:', err);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, [user?.uid, user?.email, profile?.email]);

  // --- Dashboard metrics ---
  const getMetrics = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Total users
    const usersSnap = await getDocs(collection(db, 'users'));
    const totalUsers = usersSnap.size;

    // Signups today
    let signupsToday = 0;
    let signupsYesterday = 0;
    usersSnap.docs.forEach(d => {
      const created = d.data().createdAt;
      if (!created) return;
      const ts = created.toMillis ? created.toMillis() : 0;
      if (ts >= today.getTime()) signupsToday++;
      else if (ts >= yesterday.getTime() && ts < today.getTime()) signupsYesterday++;
    });

    // Active listings
    const listingsSnap = await getDocs(query(collection(db, 'listings'), where('status', '==', 'active')));
    const activeListings = listingsSnap.size;

    // Total listings
    const allListingsSnap = await getDocs(collection(db, 'listings'));
    const totalListings = allListingsSnap.size;

    // Chat rooms (proxy for messages activity)
    const chatsSnap = await getDocs(collection(db, 'chatRooms'));
    const totalChats = chatsSnap.size;

    // Users by city
    const cityMap: Record<string, number> = {};
    usersSnap.docs.forEach(d => {
      const city = d.data().city;
      if (city) cityMap[city] = (cityMap[city] || 0) + 1;
    });
    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([city, count]) => ({ city, count }));

    // Daily signups (last 30 days)
    const dailySignups: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      dailySignups.push({ date: label, count: 0 });
    }
    usersSnap.docs.forEach(d => {
      const created = d.data().createdAt;
      if (!created?.toDate) return;
      const dt = created.toDate();
      const diffDays = Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 30) {
        dailySignups[29 - diffDays].count++;
      }
    });

    // Seekers vs owners
    let seekers = 0, owners = 0;
    usersSnap.docs.forEach(d => {
      const role = d.data().role;
      if (role === 'seeker') seekers++;
      else if (role === 'owner') owners++;
    });

    return {
      totalUsers, signupsToday, signupsYesterday, activeListings, totalListings,
      totalChats, topCities, dailySignups, seekers, owners,
    };
  }, []);

  // --- User management ---
  const getAllUsers = useCallback(async () => {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  }, []);

  const suspendUser = useCallback(async (uid: string) => {
    await updateDoc(doc(db, 'users', uid), { status: 'suspended', updatedAt: serverTimestamp() });
  }, []);

  const banUser = useCallback(async (uid: string) => {
    await updateDoc(doc(db, 'users', uid), { status: 'banned', updatedAt: serverTimestamp() });
  }, []);

  const reinstateUser = useCallback(async (uid: string) => {
    await updateDoc(doc(db, 'users', uid), { status: 'active', updatedAt: serverTimestamp() });
  }, []);

  // --- Listing management ---
  const getAllListings = useCallback(async () => {
    const snap = await getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }, []);

  const deleteListing = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'listings', id));
  }, []);

  // --- Broadcast notification ---
  const broadcastNotification = useCallback(async (
    title: string, description: string,
    target: 'all' | 'seekers' | 'owners',
  ) => {
    let q;
    if (target === 'seekers') q = query(collection(db, 'users'), where('role', '==', 'seeker'));
    else if (target === 'owners') q = query(collection(db, 'users'), where('role', '==', 'owner'));
    else q = query(collection(db, 'users'));

    const snap = await getDocs(q);
    const batch = snap.docs.map(d =>
      addDoc(collection(db, 'notifications'), {
        userId: d.id, type: 'system', title, description,
        read: false, createdAt: serverTimestamp(),
      })
    );
    await Promise.all(batch);
    return snap.size;
  }, []);

  // --- Reports ---
  const getAllReports = useCallback(async () => {
    const snap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }, []);

  const updateReportStatus = useCallback(async (id: string, status: string) => {
    await updateDoc(doc(db, 'reports', id), { status, updatedAt: serverTimestamp() });
  }, []);

  // --- Verifications ---
  const getAllVerifications = useCallback(async () => {
    const snap = await getDocs(query(collection(db, 'verifications'), orderBy('submittedAt', 'asc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }, []);

  const approveVerification = useCallback(async (id: string, userId: string, type: string) => {
    await updateDoc(doc(db, 'verifications', id), { status: 'approved', reviewedAt: serverTimestamp() });
    const fieldMap: Record<string, string> = { aadhaar: 'isAadhaarVerified', work_id: 'isWorkIdVerified', student_id: 'isStudentIdVerified' };
    const field = fieldMap[type];
    if (field) await updateDoc(doc(db, 'users', userId), { [field]: true, updatedAt: serverTimestamp() });
    await addDoc(collection(db, 'notifications'), {
      userId, type: 'verification', title: 'Verification Approved',
      description: `Your ${type.replace('_', ' ')} verification has been approved!`,
      read: false, createdAt: serverTimestamp(),
    });
  }, []);

  const rejectVerification = useCallback(async (id: string, userId: string, type: string, note: string) => {
    await updateDoc(doc(db, 'verifications', id), { status: 'rejected', reviewedAt: serverTimestamp(), reviewNote: note });
    await addDoc(collection(db, 'notifications'), {
      userId, type: 'verification', title: 'Verification Rejected',
      description: `Your ${type.replace('_', ' ')} verification was rejected. Reason: ${note}`,
      read: false, createdAt: serverTimestamp(),
    });
  }, []);

  // --- Admin management ---
  const getAdmins = useCallback(async () => {
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }, []);

  const addAdmin = useCallback(async (email: string, name: string) => {
    await addDoc(collection(db, 'admins'), { email, name, role: 'moderator', createdAt: serverTimestamp() });
  }, []);

  const removeAdmin = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'admins', id));
  }, []);

  const getAdminConfig = useCallback(async () => {
    const snap = await getDoc(doc(db, 'config', 'admin'));
    return snap.exists() ? (snap.data() as { adminEmails?: string[] }) : { adminEmails: [] };
  }, []);

  const updateAdminEmails = useCallback(async (emails: string[]) => {
    const ref = doc(db, 'config', 'admin');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { adminEmails: emails });
    } else {
      const { setDoc } = await import('firebase/firestore');
      await setDoc(ref, { adminEmails: emails });
    }
  }, []);

  return {
    isAdmin, checking,
    getMetrics, getAllUsers, suspendUser, banUser, reinstateUser,
    getAllListings, deleteListing, broadcastNotification,
    getAllReports, updateReportStatus,
    getAllVerifications, approveVerification, rejectVerification,
    getAdmins, addAdmin, removeAdmin, getAdminConfig, updateAdminEmails,
  };
}

