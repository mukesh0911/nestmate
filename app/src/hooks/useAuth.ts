import { useState, useEffect, useCallback } from 'react';
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';

// Declare global recaptchaVerifier to persist across renders
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | null;
    confirmationResult: any;
  }
}

export interface UserProfile {
  uid: string;
  phone: string;
  name: string;
  email: string;
  role: 'seeker' | 'owner' | null;
  city: string;
  localities: string[];
  budget: number;
  moveInDate: string;
  profession: string;
  company: string;
  bio?: string;
  age: number;
  gender: string;
  avatar: string;
  geoLocation?: { lat: number; lng: number; formattedAddress?: string } | null;
  quizAnswers: Record<string, string>;
  onboardingComplete: boolean;
  isPremium: boolean;
  isVerified: boolean;
  connectsUsed: number;
  connectsLimit: number;
  verificationLevel: number;
  settings?: Record<string, any>;
  locality?: string;
  // Persisted user action arrays
  savedProfileIds: string[];   // UIDs of saved match profiles
  savedRoomIds: string[];      // IDs of saved listings
  skippedUserIds: string[];    // UIDs excluded from match feed
  blockedUserIds: string[];    // UIDs blocked by user
  savedSearches?: {            // Saved search filters
    id: string;
    filters: any;
    name: string;
    createdAt: any;
  }[];
  workEmail?: string;
  workEmailVerified?: boolean;
  socialLinks?: {
    linkedin?: string;
    instagram?: string;
  };
  lastActiveAt?: any;
  createdAt: any;
  updatedAt: any;
}

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const profileSnap = await getDoc(userRef);

          if (profileSnap.exists()) {
            const data = profileSnap.data() as UserProfile;
            const hasQuiz = data.quizAnswers && Object.keys(data.quizAnswers).length > 0;
            if (!data.onboardingComplete || !hasQuiz) {
              const defaultAnswers = { q1: '1', q2: '2', q3: '1', q4: '3', q5: '2', q6: '1', q7: '4', q8: '2', q9: '1', q10: '3' };
              const updated = {
                ...data,
                onboardingComplete: true,
                role: data.role || 'seeker',
                city: data.city || 'Chennai',
                quizAnswers: hasQuiz ? data.quizAnswers : defaultAnswers
              };
              await setDoc(userRef, updated, { merge: true });
              setProfile(updated);
            } else {
              setProfile(data);
            }
          } else {
            const defaultName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User');
            const fallbackProfile: UserProfile = {
              uid: firebaseUser.uid,
              phone: firebaseUser.phoneNumber || '+919876543210',
              name: defaultName,
              email: firebaseUser.email || `${defaultName.toLowerCase()}@nestmate.com`,
              role: 'seeker',
              city: 'Chennai',
              localities: ['Velachery'],
              budget: 10000,
              moveInDate: '2026-08-01',
              profession: 'Software Professional',
              company: 'Tech Hub',
              bio: 'Passionate professional looking for clean, friendly roommate in Chennai.',
              age: 24,
              gender: 'Male',
              avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
              quizAnswers: { q1: '1', q2: '2', q3: '1', q4: '3', q5: '2', q6: '1', q7: '4', q8: '2', q9: '1', q10: '3' },
              onboardingComplete: true,
              isPremium: false,
              connectsUsed: 0,
              connectsLimit: 5,
              verificationLevel: 1,
              isVerified: true,
              savedProfileIds: [],
              savedRoomIds: [],
              skippedUserIds: [],
              blockedUserIds: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            try {
              await setDoc(userRef, fallbackProfile, { merge: true });
            } catch (e) {
              console.warn('Failed to save default fallback profile:', e);
            }
            setProfile(fallbackProfile as UserProfile);
          }
        } catch (err: any) {
          console.error('Unable to read user profile during auth load:', err);
          setError('Unable to load profile data. Please refresh or contact support.');
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Initialize the invisible reCAPTCHA verifier.
   * Call this once when the PhoneLogin page mounts.
   * containerId: the id of the div in the DOM to attach to.
   */
  const initRecaptcha = useCallback((containerId: string) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          window.recaptchaVerifier = null;
        },
      });
    }
  }, []);

  /**
   * Initialize reCAPTCHA for development (bypasses some restrictions)
   */
  const initRecaptchaDev = useCallback((containerId: string) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          window.recaptchaVerifier = null;
        },
        // Add development settings
        'hl': 'en', // language
      });
    }
  }, []);

  const refreshProfile = useCallback(async (uid?: string): Promise<UserProfile | null> => {
    const profileUid = uid || user?.uid;
    if (!profileUid) return null;

    try {
      const profileSnap = await getDoc(doc(db, 'users', profileUid));
      if (profileSnap.exists()) {
        const data = profileSnap.data() as UserProfile;
        setProfile(data);
        return data;
      }
    } catch (err: any) {
      console.error('Unable to refresh profile:', err);
    }
    return null;
  }, [user]);

  /**
   * Send OTP to the given phone number (E.164 format, e.g. +919876543210)
   * Returns the verificationId which must be passed to verifyOTP.
   */
  const sendOTP = useCallback(async (phone: string): Promise<string> => {
    setError(null);
    try {
      // For development, use test phone numbers that work without reCAPTCHA
      if (!window.recaptchaVerifier) {
        initRecaptcha('recaptcha-container');
        // Wait a bit for reCAPTCHA to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!window.recaptchaVerifier) {
        throw new Error('reCAPTCHA verification failed. Please refresh the page and try again.');
      }

      const confirmation = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      window.confirmationResult = confirmation;
      return confirmation.verificationId;
    } catch (err: any) {
      // Reset captcha on failure so user can retry
      window.recaptchaVerifier = null;

      // Provide more helpful error messages
      let msg = err.message || 'Failed to send OTP';

      if (msg.includes('reCAPTCHA')) {
        msg = 'reCAPTCHA verification failed. Please refresh the page and try again.';
      } else if (msg.includes('quota')) {
        msg = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (msg.includes('invalid')) {
        msg = 'Invalid phone number format. Please check and try again.';
      }

      setError(msg);
      throw new Error(msg);
    }
  }, [initRecaptcha]);

  /**
   * Sign in with email + password.
   * Returns { isNew, role, onboardingComplete } for post-login routing.
   */
  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<{ isNew: boolean; role: string | null; onboardingComplete: boolean }> => {
      setError(null);
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = result.user;

        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const isNew = !userSnap.exists();

        if (isNew) {
          const defaultName = firebaseUser.displayName || email.split('@')[0];
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            phone: firebaseUser.phoneNumber || '+919876543210',
            name: defaultName,
            email: firebaseUser.email || email,
            role: 'seeker',
            city: 'Chennai',
            localities: ['Velachery'],
            budget: 10000,
            moveInDate: '2026-08-01',
            profession: 'Software Professional',
            company: 'Tech Hub',
            bio: 'Passionate professional looking for clean, friendly roommate in Chennai.',
            age: 25,
            gender: 'Male',
            avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
            quizAnswers: { q1: '1', q2: '2', q3: '1', q4: '3', q5: '2', q6: '1', q7: '4', q8: '2', q9: '1', q10: '3' },
            onboardingComplete: true,
            isPremium: false,
            connectsUsed: 0,
            connectsLimit: 5,
            verificationLevel: 1,
            isVerified: true,
            savedProfileIds: [],
            savedRoomIds: [],
            skippedUserIds: [],
            blockedUserIds: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile, { merge: true });
          setProfile(newProfile);
          setUser(firebaseUser);
          return { isNew: true, role: 'seeker', onboardingComplete: true };
        } else {
          const data = userSnap.data() as UserProfile;
          const updated = {
            ...data,
            onboardingComplete: true,
            role: data.role || 'seeker',
            city: data.city || 'Chennai',
          };
          await setDoc(userRef, updated, { merge: true });
          setProfile(updated);
          setUser(firebaseUser);
          return { isNew: false, role: updated.role, onboardingComplete: true };
        }
      } catch (err: any) {
        let msg = err.message || 'Sign in failed';
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          msg = 'Invalid email or password. Please try again.';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Too many failed attempts. Please try again later.';
        }
        setError(msg);
        throw new Error(msg);
      }
    },
    []
  );

  /**
   * Create account with email + password.
   * Creates a minimal Firestore profile; caller should redirect to /role-select.
   */
  const signUpWithEmail = useCallback(
    async (email: string, password: string): Promise<void> => {
      setError(null);
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = result.user;

        const newProfile: Partial<UserProfile> = {
          uid: firebaseUser.uid,
          phone: '',
          name: '',
          email: firebaseUser.email || '',
          role: null,
          city: '',
          localities: [],
          budget: 8000,
          moveInDate: '',
          profession: '',
          company: '',
          age: 0,
          gender: '',
          avatar: '',
          quizAnswers: {},
          onboardingComplete: false,
          isPremium: false,
          connectsUsed: 0,
          connectsLimit: 5,
          verificationLevel: 0,
          isVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
        setProfile(newProfile as UserProfile);
        setUser(firebaseUser);
      } catch (err: any) {
        let msg = err.message || 'Account creation failed';
        if (err.code === 'auth/email-already-in-use') {
          msg = 'An account with this email already exists. Try signing in.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Please enter a valid email address.';
        } else if (err.code === 'auth/weak-password') {
          msg = 'Password is too weak. Use at least 6 characters.';
        }
        setError(msg);
        throw new Error(msg);
      }
    },
    []
  );

  /**
   * Send a password reset email.
   */
  const resetPassword = useCallback(async (email: string): Promise<void> => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      let msg = err.message || 'Failed to send reset email';
      if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email address.';
      }
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  // ── Phone OTP (kept for future re-enable) ────────────────────
  /**
   * @deprecated Use signInWithEmail instead.
   * Verify OTP code. On success, creates/updates Firestore user profile.
   * Returns true if new user (needs onboarding), false if existing user.
   */
  const verifyOTP = useCallback(
    async (verificationId: string, code: string): Promise<{ isNew: boolean; role?: string | null }> => {
      setError(null);
      try {
        const credential = PhoneAuthProvider.credential(verificationId, code);
        const result = await signInWithCredential(auth, credential);
        const firebaseUser = result.user;

        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const isNew = !userSnap.exists();

        if (isNew) {
          // Create minimal profile in Firestore — rest filled during onboarding
          const newProfile: Partial<UserProfile> = {
            uid: firebaseUser.uid,
            phone: firebaseUser.phoneNumber || '',
            name: '',
            email: '',
            role: null,
            city: '',
            localities: [],
            budget: 8000,
            moveInDate: '',
            profession: '',
            company: '',
            age: 0,
            gender: '',
            avatar: '',
            quizAnswers: {},
            onboardingComplete: false,
            isPremium: false,
            connectsUsed: 0,
            connectsLimit: 5,
            verificationLevel: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile as UserProfile);
        } else {
          setProfile(userSnap.data() as UserProfile);
        }

        setUser(firebaseUser);
        return { isNew, role: isNew ? null : (userSnap.data() as UserProfile).role };
      } catch (err: any) {
        const msg = err.code === 'auth/invalid-verification-code'
          ? 'Invalid OTP. Please try again.'
          : err.message || 'Verification failed';
        setError(msg);
        throw new Error(msg);
      }
    },
    []
  );

  /**
   * Google Sign-in flow
   * Continues seamlessly, creates profile if new.
   */
  const signInWithGoogle = useCallback(async (): Promise<{ isNew: boolean; role?: string | null }> => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      const isNew = !userSnap.exists();

      if (isNew) {
        const defaultName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User');
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          phone: firebaseUser.phoneNumber || '+919876543210',
          name: defaultName,
          email: firebaseUser.email || '',
          role: 'seeker',
          city: 'Chennai',
          localities: ['Velachery'],
          budget: 10000,
          moveInDate: '2026-08-01',
          profession: 'Software Professional',
          company: 'Tech Hub',
          bio: 'Passionate professional looking for clean, friendly roommate in Chennai.',
          age: 25,
          gender: 'Male',
          avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
          quizAnswers: { q1: '1', q2: '2', q3: '1', q4: '3', q5: '2', q6: '1', q7: '4', q8: '2', q9: '1', q10: '3' },
          onboardingComplete: true,
          isPremium: false,
          connectsUsed: 0,
          connectsLimit: 5,
          verificationLevel: 1,
          isVerified: true,
          savedProfileIds: [],
          savedRoomIds: [],
          skippedUserIds: [],
          blockedUserIds: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, newProfile, { merge: true });
        setProfile(newProfile);
        setUser(firebaseUser);
        return { isNew: true, role: 'seeker' };
      } else {
        const existingProfile = userSnap.data() as UserProfile;
        const profileUpdates: Partial<UserProfile> = {
          onboardingComplete: true,
          role: existingProfile.role || 'seeker',
          city: existingProfile.city || 'Chennai',
        };

        if (firebaseUser.displayName && firebaseUser.displayName !== existingProfile.name) {
          profileUpdates.name = firebaseUser.displayName;
        }
        if (firebaseUser.email && firebaseUser.email !== existingProfile.email) {
          profileUpdates.email = firebaseUser.email;
        }
        if (firebaseUser.photoURL && firebaseUser.photoURL !== existingProfile.avatar) {
          profileUpdates.avatar = firebaseUser.photoURL;
        }

        await setDoc(userRef, {
          ...existingProfile,
          ...profileUpdates,
          updatedAt: serverTimestamp(),
        }, { merge: true });

        const merged = { ...existingProfile, ...profileUpdates };
        setProfile(merged);
        setUser(firebaseUser);
        return { isNew: false, role: merged.role };
      }
    } catch (err: any) {
      let msg = err.message || 'Google Sign-in failed';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in cancelled.';
      }
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    window.recaptchaVerifier = null;
    useStore.getState().resetAll();
  }, []);

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    error,
    // Email/Password auth (primary)
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    // Google auth
    signInWithGoogle,
    // Shared
    logout,
    refreshProfile,
    // Phone OTP (legacy — kept for re-enable)
    initRecaptcha,
    sendOTP,
    verifyOTP,
  };
}
