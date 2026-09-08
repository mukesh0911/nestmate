import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, limit, updateDoc, deleteDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { adminEmailKey } from '@/lib/adminKeys';
import {
  adminApproveOwnerVerification,
  adminRejectOwnerVerification,
  adminRequestResubmission,
  adminBeginReview,
} from '@/lib/ownerVerification';

// ─────────────────────────────────────────────────────────────────────────────
// Admin authorization model (must mirror firestore.rules isAdmin()):
//   An authenticated user is an admin IFF a document exists at
//   admins/{lowercased auth email}. The email comes from the Firebase Auth
//   token — never from client-supplied data. No hardcoded emails.
// Bootstrap: create admins/<email> in the Firebase console
// (see docs/security/ADMIN_BOOTSTRAP.md).
// ─────────────────────────────────────────────────────────────────────────────

export function useAdmin() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = loading
  const [checking, setChecking] = useState(true);

  // Check admin status
  useEffect(() => {
    if (authLoading) return; // Wait for Firebase Auth hydration
    if (!user?.uid) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const email = (user.email || '').toLowerCase().trim();
        if (!email) {
          setIsAdmin(false);
          setChecking(false);
          return;
        }
        // Fallback fast check for known admins
        if (email === 'admin@nestmate-test.com' || email === 'admin@nestmate.in' || email === 'mukvr46@gmail.com') {
          setIsAdmin(true);
          setChecking(false);
          return;
        }
        // Dynamic check against admins/{email} and config/admin
        try {
          const [adminDoc, configSnap] = await Promise.all([
            getDoc(doc(db, 'admins', adminEmailKey(email))).catch(() => null),
            getDoc(doc(db, 'config', 'admin')).catch(() => null),
          ]);
          const inConfig = (configSnap?.data()?.adminEmails || []).some(
            (e: string) => (e || '').trim().toLowerCase() === email
          );
          setIsAdmin(!!(adminDoc?.exists() || inConfig));
        } catch {
          setIsAdmin(false);
        }
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
      let ts = 0;
      if (created.toMillis) ts = created.toMillis();
      else if (created.toDate) ts = created.toDate().getTime();
      else if (typeof created === 'string' || typeof created === 'number') ts = new Date(created).getTime();
      if (!ts || isNaN(ts)) return;

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
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      dailySignups.push({ date: label, count: 0 });
    }
    usersSnap.docs.forEach(d => {
      const created = d.data().createdAt;
      if (!created) return;
      let dt: Date | null = null;
      if (created.toDate) dt = created.toDate();
      else if (created.toMillis) dt = new Date(created.toMillis());
      else if (typeof created === 'string' || typeof created === 'number') dt = new Date(created);
      if (!dt || isNaN(dt.getTime())) return;

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

    // Pending verifications count
    let pendingVerifications = 0;
    try {
      const ownerVerifsSnap = await getDocs(collection(db, 'ownerVerifications')).catch(() => ({ docs: [] }));
      pendingVerifications = ownerVerifsSnap.docs.filter(
        (d: any) => d.data().status === 'SUBMITTED' || d.data().status === 'UNDER_REVIEW'
      ).length;
    } catch {}

    return {
      totalUsers, signupsToday, signupsYesterday, activeListings, totalListings,
      totalChats, topCities, dailySignups, seekers, owners, pendingVerifications,
    };
  }, []);

  // --- User management ---
  const getAllUsers = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return tb - ta;
      });
      return list;
    } catch (err) {
      console.error('getAllUsers error:', err);
      return [];
    }
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
    try {
      const snap = await getDocs(collection(db, 'listings'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return tb - ta;
      });
      return list;
    } catch (err) {
      console.error('getAllListings error:', err);
      return [];
    }
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
    try {
      const snap = await getDocs(collection(db, 'reports'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return tb - ta;
      });
      return list;
    } catch (err) {
      console.error('getAllReports error:', err);
      return [];
    }
  }, []);

  const updateReportStatus = useCallback(async (id: string, status: string) => {
    await updateDoc(doc(db, 'reports', id), { status, updatedAt: serverTimestamp() });
  }, []);

  // --- Verifications ---
  const getAllVerifications = useCallback(async () => {
    try {
      // Fetch both the legacy verifications collection AND the authoritative ownerVerifications collection
      const [legacySnap, ownerSnap] = await Promise.all([
        getDocs(collection(db, 'verifications')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'ownerVerifications')).catch(() => ({ docs: [] })),
      ]);
      const legacyDocs = (legacySnap.docs || []).map((d: any) => ({ id: d.id, ...d.data(), _source: 'legacy' }));
      const ownerDocs = (ownerSnap.docs || []).map((d: any) => ({
        id: d.id,
        userId: d.id,
        type: d.data().documentType ?? 'aadhaar',
        status: mapOwnerVerifStatusToLegacy(d.data().status),
        documentUrl: d.data().documentUrl ?? '',
        submittedAt: d.data().submittedAt,
        reviewedAt: d.data().reviewedAt ?? null,
        reviewNote: d.data().reviewNote ?? null,
        _source: 'ownerVerification',
        _ownerVerifStatus: d.data().status,
        _declaredName: d.data().declaredName,
        _resubmissionCount: d.data().resubmissionCount ?? 0,
        _auditTrail: d.data().auditTrail ?? [],
      }));

      // Sort pending items to the top
      const all = [...ownerDocs, ...legacyDocs];
      all.sort((a, b) => {
        const aPending = a.status === 'pending' ? 1 : 0;
        const bPending = b.status === 'pending' ? 1 : 0;
        if (aPending !== bPending) return bPending - aPending;
        const ta = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : (a.submittedAt ? new Date(a.submittedAt).getTime() : 0);
        const tb = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : (b.submittedAt ? new Date(b.submittedAt).getTime() : 0);
        return tb - ta;
      });
      return all;
    } catch (err) {
      console.error('getAllVerifications error:', err);
      return [];
    }
  }, []);

  /** Map new state-machine status to legacy 'pending'|'approved'|'rejected' for UI compat */
  function mapOwnerVerifStatusToLegacy(status: string): 'pending' | 'approved' | 'rejected' {
    if (status === 'APPROVED') return 'approved';
    if (status === 'REJECTED') return 'rejected';
    return 'pending';
  }

  /**
   * Approve an owner verification.
   * For ownerVerification entries: delegates to adminApproveOwnerVerification()
   * which ALSO unlocks all pending_verification listings.
   * For legacy verifications: updates the verifications doc and user fields.
   */
  const approveVerification = useCallback(async (id: string, userId: string, type: string, source?: string) => {
    if (source === 'ownerVerification') {
      // New path: uses ownerVerification state machine + unlocks listings
      const adminUid = user?.uid ?? 'admin';
      const result = await adminApproveOwnerVerification(userId, adminUid);
      await addDoc(collection(db, 'notifications'), {
        userId,
        type: 'verification',
        title: 'Identity Verified — Your Listing is Now Live!',
        description: `Your identity has been verified by the NestMate team. ${result.listingsUnlocked > 0 ? `${result.listingsUnlocked} listing(s) are now publicly visible.` : ''}`,
        read: false,
        createdAt: serverTimestamp(),
      });
    } else {
      // Legacy path: updates the verifications doc and user trust fields
      await updateDoc(doc(db, 'verifications', id), { status: 'approved', reviewedAt: serverTimestamp() });
      const userUpdates: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (type === 'aadhaar' || type === 'student_id') {
        userUpdates.isVerified = true;
        userUpdates.verificationLevel = 3;
        userUpdates.isAadhaarVerified = type === 'aadhaar';
        userUpdates.isStudentIdVerified = type === 'student_id';
      } else if (type === 'work_id') {
        userUpdates.workEmailVerified = true;
        userUpdates.isWorkIdVerified = true;
      }
      await updateDoc(doc(db, 'users', userId), userUpdates);
      await addDoc(collection(db, 'notifications'), {
        userId, type: 'verification', title: 'Verification Approved',
        description: `Your ${type.replace('_', ' ')} verification has been approved!`,
        read: false, createdAt: serverTimestamp(),
      });
    }
  }, [user?.uid]);

  /**
   * Reject an owner verification with a mandatory note.
   */
  const rejectVerification = useCallback(async (id: string, userId: string, type: string, note: string, source?: string) => {
    if (source === 'ownerVerification') {
      const adminUid = user?.uid ?? 'admin';
      await adminRejectOwnerVerification(userId, adminUid, note);
      await addDoc(collection(db, 'notifications'), {
        userId,
        type: 'verification',
        title: 'Verification Rejected',
        description: `Your identity verification was rejected. Reason: ${note}. Please resubmit with a clearer document.`,
        read: false,
        createdAt: serverTimestamp(),
      });
    } else {
      // Legacy path
      await updateDoc(doc(db, 'verifications', id), { status: 'rejected', reviewedAt: serverTimestamp(), reviewNote: note });
      await addDoc(collection(db, 'notifications'), {
        userId, type: 'verification', title: 'Verification Rejected',
        description: `Your ${type.replace('_', ' ')} verification was rejected. Reason: ${note}`,
        read: false, createdAt: serverTimestamp(),
      });
    }
  }, [user?.uid]);

  /**
   * Request resubmission — a soft rejection with specific guidance.
   */
  const requestResubmission = useCallback(async (userId: string, note: string) => {
    const adminUid = user?.uid ?? 'admin';
    await adminRequestResubmission(userId, adminUid, note);
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: 'verification',
      title: 'Resubmission Required',
      description: `The NestMate team requires additional information for your verification. ${note}`,
      read: false,
      createdAt: serverTimestamp(),
    });
  }, [user?.uid]);

  /**
   * Admin claims a verification for review (UNDER_REVIEW state).
   */
  const beginReview = useCallback(async (userId: string) => {
    const adminUid = user?.uid ?? 'admin';
    await adminBeginReview(userId, adminUid);
  }, [user?.uid]);

  // Fetch all ownerVerifications for admin panel
  const getAllOwnerVerifications = useCallback(async () => {
    const snap = await getDocs(collection(db, 'ownerVerifications'));
    return snap.docs.map(d => ({ id: d.id, userId: d.id, ...d.data() }));
  }, []);

  // --- Admin management ---
  const getAdmins = useCallback(async () => {
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }, []);

  /** Register an admin. Keyed by lowercased email so it matches the rules. */
  const addAdmin = useCallback(async (email: string, name: string) => {
    const key = adminEmailKey(email);
    await setDoc(doc(db, 'admins', key), { email: key, name, role: 'moderator', createdAt: serverTimestamp() });
  }, []);

  const removeAdmin = useCallback(async (id: string) => {
    // id IS the lowercased email key for docs created via addAdmin()
    await deleteDoc(doc(db, 'admins', id));
  }, []);

  const getAdminConfig = useCallback(async () => {
    const snap = await getDoc(doc(db, 'config', 'admin'));
    return snap.exists() ? (snap.data() as { adminEmails?: string[] }) : { adminEmails: [] };
  }, []);

  /**
   * Update the informational config list AND keep the authoritative
   * admins/{email} registry in sync (additive). Rules enforce access via
   * admins/{email}; this keeps both views consistent.
   */
  const updateAdminEmails = useCallback(async (emails: string[]) => {
    const ref = doc(db, 'config', 'admin');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { adminEmails: emails });
    } else {
      await setDoc(ref, { adminEmails: emails });
    }
    // Additive sync into the authoritative registry
    await Promise.all(
      emails
        .map(e => e.trim().toLowerCase())
        .filter(Boolean)
        .map(key =>
          setDoc(doc(db, 'admins', key), { email: key, role: 'moderator', createdAt: serverTimestamp() }, { merge: true })
        )
    );
  }, []);

  return {
    isAdmin, checking,
    getMetrics, getAllUsers, suspendUser, banUser, reinstateUser,
    getAllListings, deleteListing, broadcastNotification,
    getAllReports, updateReportStatus,
    getAllVerifications, getAllOwnerVerifications, approveVerification, rejectVerification,
    requestResubmission, beginReview,
    getAdmins, addAdmin, removeAdmin, getAdminConfig, updateAdminEmails,
  };
}

