import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/** Owner-only contact fields — never store these on publicly readable `users/{uid}`. */
export interface PrivateUserData {
  phone?: string;
  email?: string;
  workEmail?: string;
  updatedAt?: unknown;
}

export function privateUserDataRef(userId: string) {
  return doc(db, 'privateUserData', userId);
}

export async function getPrivateUserData(userId: string): Promise<PrivateUserData> {
  const snap = await getDoc(privateUserDataRef(userId));
  if (!snap.exists()) return {};
  return snap.data() as PrivateUserData;
}

export async function savePrivateUserData(
  userId: string,
  data: Partial<PrivateUserData>
): Promise<void> {
  const cleaned: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (data.phone !== undefined) cleaned.phone = data.phone;
  if (data.email !== undefined) cleaned.email = data.email;
  if (data.workEmail !== undefined) cleaned.workEmail = data.workEmail;
  await setDoc(privateUserDataRef(userId), cleaned, { merge: true });
}

/**
 * Merge private contact fields into the caller's own profile for UI use.
 * Does not write anything back to the public `users` document.
 */
export async function hydrateOwnProfile<T extends { uid: string; phone?: string; email?: string; workEmail?: string }>(
  profile: T
): Promise<T> {
  try {
    const priv = await getPrivateUserData(profile.uid);
    // Migrate legacy public PII once, then clear it from the public users doc
    const legacyPhone = !priv.phone && profile.phone ? profile.phone : undefined;
    const legacyEmail = !priv.email && profile.email ? profile.email : undefined;
    const legacyWork = !priv.workEmail && profile.workEmail ? profile.workEmail : undefined;
    if (legacyPhone || legacyEmail || legacyWork) {
      await savePrivateUserData(profile.uid, {
        ...(legacyPhone ? { phone: legacyPhone } : {}),
        ...(legacyEmail ? { email: legacyEmail } : {}),
        ...(legacyWork ? { workEmail: legacyWork } : {}),
      });
      try {
        await setDoc(
          doc(db, 'users', profile.uid),
          { phone: '', email: '', workEmail: '', updatedAt: serverTimestamp() },
          { merge: true }
        );
      } catch {
        // Non-fatal — rules or offline may block; next profile save will retry
      }
    }

    const refreshed = (legacyPhone || legacyEmail || legacyWork)
      ? await getPrivateUserData(profile.uid)
      : priv;

    return {
      ...profile,
      phone: refreshed.phone ?? profile.phone ?? '',
      email: refreshed.email ?? profile.email ?? '',
      workEmail: refreshed.workEmail ?? profile.workEmail ?? '',
    };
  } catch (err) {
    console.warn('Failed to hydrate private user data:', err);
    return profile;
  }
}

/** Fields that must never be written to the public users collection. */
export const PUBLIC_PII_KEYS = ['phone', 'email', 'workEmail'] as const;

export function stripPiiFromWrite<T extends Record<string, unknown>>(data: T): Omit<T, 'phone' | 'email' | 'workEmail'> {
  const next = { ...data };
  for (const key of PUBLIC_PII_KEYS) {
    delete next[key];
  }
  return next as Omit<T, 'phone' | 'email' | 'workEmail'>;
}
