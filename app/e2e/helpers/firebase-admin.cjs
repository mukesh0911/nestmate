/**
 * Firebase Admin Helper for E2E Tests
 * Creates/resets test users in the REAL Firebase project (production credentials).
 * 
 * Rules-compliant: Signs in as the correct user before every operation so
 * Firestore security rules (which enforce request.auth.uid == owner/sender) pass cleanly.
 */
'use strict';

const { initializeApp, getApps } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs, addDoc, updateDoc, Timestamp } = require('firebase/firestore');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const TEST_PASSWORD = 'E2eTestPass@2026';
const TEST_EMAIL_DOMAIN = 'nestmate-test.com';

const TEST_USERS = {
  // SEEKERS: S001–S010
  S001: {
    email: `s001@${TEST_EMAIL_DOMAIN}`,
    name: 'Priya Sharma (S001)',
    role: 'seeker',
    city: 'Chennai',
    budget: 14500,
    quizAnswers: {
      sleep_time: 'before_10', wake_time: '6_to_8', food_pref: 'veg',
      smoking: 'never', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'hybrid', pets: 'ok', roommate_gender: 'any',
    },
    description: 'Reference seeker — 100% match with O001',
  },
  S002: {
    email: `s002@${TEST_EMAIL_DOMAIN}`,
    name: 'Rohan Verma (S002)',
    role: 'seeker',
    city: 'Chennai',
    budget: 15000,
    quizAnswers: {
      sleep_time: '10_to_12', wake_time: '6_to_8', food_pref: 'veg',
      smoking: 'never', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'wfo', pets: 'ok', roommate_gender: 'any',
    },
    description: '80% match with O001 (sleep_time + work_mode differ)',
  },
  S003: {
    email: `s003@${TEST_EMAIL_DOMAIN}`,
    name: 'Ananya Roy (S003)',
    role: 'seeker',
    city: 'Chennai',
    budget: 16000,
    quizAnswers: {
      sleep_time: 'after_12', wake_time: '8_to_10', food_pref: 'non_veg',
      smoking: 'socially', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'hybrid', pets: 'ok', roommate_gender: 'any',
    },
    description: '60% match with O001 (4 answers differ)',
  },
  S004: {
    email: `s004@${TEST_EMAIL_DOMAIN}`,
    name: 'Meera Patel (S004)',
    role: 'seeker',
    city: 'Mumbai',
    budget: 14000,
    quizAnswers: {
      sleep_time: 'before_10', wake_time: '6_to_8', food_pref: 'veg',
      smoking: 'never', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'hybrid', pets: 'ok', roommate_gender: 'any',
    },
    description: 'Different city — 100% quiz match capped at 60% cross-city',
  },
  S005: {
    email: `s005@${TEST_EMAIL_DOMAIN}`,
    name: 'Kiran Iyer (S005)',
    role: 'seeker',
    city: 'Chennai',
    budget: 28000,
    quizAnswers: {
      sleep_time: 'after_12', wake_time: '8_to_10', food_pref: 'non_veg',
      smoking: 'regularly', drinking: 'regularly', guests: 'very_often',
      cleanliness: 'messy', work_mode: 'hybrid', pets: 'ok', roommate_gender: 'any',
    },
    description: '40% match with O001 (6 answers differ)',
  },
  S006: {
    email: `s006@${TEST_EMAIL_DOMAIN}`,
    name: 'Rahul Sen (S006)',
    role: 'seeker',
    city: 'Chennai',
    budget: 12000,
    quizAnswers: {
      sleep_time: 'varies', wake_time: 'after_10', food_pref: 'non_veg',
      smoking: 'regularly', drinking: 'regularly', guests: 'very_often',
      cleanliness: 'messy', work_mode: 'wfo', pets: 'allergic', roommate_gender: 'female',
    },
    description: '0% match with O001 (all 10 answers differ)',
  },
  S007: {
    email: `s007@${TEST_EMAIL_DOMAIN}`,
    name: 'Sneha Nair (S007)',
    role: 'seeker',
    city: 'Hyderabad',
    budget: 13000,
    quizAnswers: {
      sleep_time: 'before_10', wake_time: '6_to_8', food_pref: 'veg',
      smoking: 'never', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'hybrid', pets: 'ok', roommate_gender: 'any',
    },
    description: '100% quiz but different city — cross-city capped at 60%',
  },
  S008: {
    email: `s008@${TEST_EMAIL_DOMAIN}`,
    name: 'Arjun Reddy (S008)',
    role: 'seeker',
    city: 'Chennai',
    budget: 15000,
    quizAnswers: {},
    description: 'Incomplete profile — 0% compatibility (no quiz data)',
  },
  S009: {
    email: `s009@${TEST_EMAIL_DOMAIN}`,
    name: 'Kavya Singh (S009)',
    role: 'seeker',
    city: 'Chennai',
    budget: 15500,
    quizAnswers: {
      sleep_time: 'before_10', wake_time: '6_to_8', food_pref: 'veg',
      smoking: 'never', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'hybrid', pets: 'no', roommate_gender: 'any',
    },
    description: '90% match with O001 (pets answer differs)',
  },
  S010: {
    email: `s010@${TEST_EMAIL_DOMAIN}`,
    name: 'Manish Joshi (S010)',
    role: 'seeker',
    city: 'Chennai',
    budget: 15000,
    quizAnswers: {
      sleep_time: '10_to_12', wake_time: '6_to_8', food_pref: 'non_veg',
      smoking: 'never', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'wfo', pets: 'ok', roommate_gender: 'any',
    },
    description: '70% match with O001 (3 answers differ)',
  },

  // OWNERS: O001–O007
  O001: {
    email: `o001@${TEST_EMAIL_DOMAIN}`,
    name: 'Vikram Kumar (O001)',
    role: 'owner',
    city: 'Chennai',
    budget: 16000,
    quizAnswers: {
      sleep_time: 'before_10', wake_time: '6_to_8', food_pref: 'veg',
      smoking: 'never', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'hybrid', pets: 'ok', roommate_gender: 'any',
    },
    description: 'Reference owner — 100% match with S001',
  },
  O002: {
    email: `o002@${TEST_EMAIL_DOMAIN}`,
    name: 'Pradeep Rao (O002)',
    role: 'owner',
    city: 'Chennai',
    budget: 18000,
    quizAnswers: {
      sleep_time: 'after_12', wake_time: '8_to_10', food_pref: 'non_veg',
      smoking: 'socially', drinking: 'socially', guests: 'often',
      cleanliness: 'moderate', work_mode: 'wfo', pets: 'allergic', roommate_gender: 'male',
    },
    description: 'Different lifestyle — low match with most seekers',
  },
  O003: {
    email: `o003@${TEST_EMAIL_DOMAIN}`,
    name: 'Suresh Menon (O003)',
    role: 'owner',
    city: 'Bengaluru',
    budget: 14000,
    quizAnswers: {
      sleep_time: 'before_10', wake_time: '6_to_8', food_pref: 'veg',
      smoking: 'never', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'hybrid', pets: 'ok', roommate_gender: 'any',
    },
    description: 'Different city from S001',
  },
  O004: {
    email: `o004@${TEST_EMAIL_DOMAIN}`,
    name: 'Arun Nair (O004)',
    role: 'owner',
    city: 'Chennai',
    budget: 12000,
    quizAnswers: {
      sleep_time: 'before_10', wake_time: '6_to_8', food_pref: 'veg',
      smoking: 'never', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'hybrid', pets: 'ok', roommate_gender: 'any',
    },
    description: 'Same city + answers as S001 — 100% match',
  },
  O005: {
    email: `o005@${TEST_EMAIL_DOMAIN}`,
    name: 'Gopal Krishnan (O005)',
    role: 'owner',
    city: 'Chennai',
    budget: 20000,
    quizAnswers: {},
    description: 'Incomplete quiz — 0% match',
  },
  O006: {
    email: `o006@${TEST_EMAIL_DOMAIN}`,
    name: 'Rajesh Pillai (O006)',
    role: 'owner',
    city: 'Chennai',
    budget: 15000,
    quizAnswers: {
      sleep_time: 'before_10', wake_time: '6_to_8', food_pref: 'veg',
      smoking: 'never', drinking: 'never', guests: 'rarely',
      cleanliness: 'very', work_mode: 'hybrid', pets: 'ok', roommate_gender: 'any',
    },
    description: '100% match with S001 — tests duplicate/sorting',
  },
  O007: {
    email: `o007@${TEST_EMAIL_DOMAIN}`,
    name: 'Divya Krishnamurti (O007)',
    role: 'owner',
    city: 'Chennai',
    budget: 22000,
    quizAnswers: {
      sleep_time: 'after_12', wake_time: 'after_10', food_pref: 'non_veg',
      smoking: 'regularly', drinking: 'regularly', guests: 'very_often',
      cleanliness: 'messy', work_mode: 'wfo', pets: 'allergic', roommate_gender: 'female',
    },
    description: '0% match — conflict on all 10 answers',
  },
  ADMIN: {
    email: `admin@${TEST_EMAIL_DOMAIN}`,
    name: 'NestMate System Admin',
    role: 'owner',
    city: 'Chennai',
    budget: 25000,
    quizAnswers: {},
    description: 'System Administrator Account',
  },
};

async function ensureAuthUser(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      return cred.user;
    }
    throw err;
  }
}

async function provisionUser(userId) {
  const def = TEST_USERS[userId];
  if (!def) throw new Error(`Unknown test user: ${userId}`);

  const firebaseUser = await ensureAuthUser(def.email, TEST_PASSWORD);
  const uid = firebaseUser.uid;

  const isIncomplete = userId === 'S008' || userId === 'O005';

  const userDocRef = doc(db, 'users', uid);
  const existingDoc = await getDoc(userDocRef);

  const profileData = {
    uid,
    email: '',
    name: def.name,
    role: def.role,
    city: def.city,
    localities: [`${def.city} Central`, `${def.city} North`],
    budget: def.budget,
    budgetMin: 5000,
    budgetMax: 30000,
    moveInDate: '2026-09-01',
    profession: 'Software Engineer',
    company: 'NestMate Test Corp',
    bio: `Test user ${userId}: ${def.description}`,
    age: 25,
    gender: 'Any',
    avatar: '',
    quizAnswers: isIncomplete ? {} : (def.quizAnswers || {}),
    onboardingComplete: !isIncomplete,
    status: 'active',
    connectsUsed: 0,
    connectsLimit: 5,
    savedProfileIds: [],
    savedRoomIds: [],
    skippedUserIds: [],
    blockedUserIds: [],
    updatedAt: Timestamp.now(),
    ...(!existingDoc.exists() ? {
      isPremium: false,
      isVerified: false,
      verificationLevel: 0,
      createdAt: Timestamp.now(),
    } : {}),
  };

  await setDoc(userDocRef, profileData, { merge: true });

  if (userId === 'ADMIN') {
    try {
      await signInWithEmailAndPassword(auth, def.email, TEST_PASSWORD);
      await setDoc(doc(db, 'admins', def.email.toLowerCase()), {
        email: def.email.toLowerCase(),
        name: def.name,
        role: 'superadmin',
        createdAt: Timestamp.now(),
      }, { merge: true });
    } catch (adminErr) {
      console.warn('  ⚠️ Note: Client SDK admins collection write:', adminErr.message);
    }
  }

  if (userId === 'O001') {
    try {
      const adminDef = TEST_USERS.ADMIN;
      await signInWithEmailAndPassword(auth, adminDef.email, TEST_PASSWORD);
      await setDoc(userDocRef, {
        isVerified: true,
        verificationLevel: 3,
        isAadhaarVerified: true,
      }, { merge: true });
      await setDoc(doc(db, 'ownerVerifications', uid), {
        userId: uid,
        status: 'APPROVED',
        documentType: 'aadhaar',
        declaredName: def.name,
        reviewedAt: Timestamp.now(),
        submittedAt: Timestamp.now(),
      }, { merge: true });

      // Ensure O001 has an active, verified listing
      const existingListingQ = query(
        collection(db, 'listings'),
        where('ownerId', '==', uid),
        where('status', '==', 'active'),
        where('ownerVerified', '==', true)
      );
      const existingListingSnap = await getDocs(existingListingQ);
      if (existingListingSnap.empty) {
        await addDoc(collection(db, 'listings'), {
          ownerId: uid,
          title: 'Sunny 2BHK in T. Nagar with Balcony',
          description: 'Spacious verified 2BHK flat available for vegetarian flatmate. High-speed WiFi and AC.',
          city: 'Chennai',
          locality: 'T. Nagar',
          address: '14/2, Usman Road, T. Nagar, Chennai',
          lat: 13.0418,
          lng: 80.2341,
          totalRent: 16000,
          partnerShare: 8000,
          partnersNeeded: 1,
          deposit: 25000,
          flatType: '2 BHK',
          furnishing: 'Semi-Furnished',
          amenities: ['WiFi', 'AC', 'Attached Washroom', 'Washing Machine'],
          houseRules: ['Vegetarian preferred', 'No Smoking'],
          status: 'active',
          ownerVerified: true,
          applicants: 0,
          views: 12,
          lastConfirmedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (oErr) {
      console.warn('  ⚠️ Note: O001 verification bootstrap:', oErr.message);
    }
  }

  if (userId === 'O002') {
    try {
      const existingListingQ = query(
        collection(db, 'listings'),
        where('ownerId', '==', uid)
      );
      const existingListingSnap = await getDocs(existingListingQ);
      if (existingListingSnap.empty) {
        await addDoc(collection(db, 'listings'), {
          ownerId: uid,
          title: 'Cozy 1BHK in Adyar (Pending Verification)',
          description: 'Great location in Adyar near beach. Owner identity verification pending.',
          city: 'Chennai',
          locality: 'Adyar',
          address: '5/12, Beach Road, Adyar, Chennai',
          lat: 13.0012,
          lng: 80.2565,
          totalRent: 14000,
          partnerShare: 7000,
          partnersNeeded: 1,
          deposit: 20000,
          flatType: '1 BHK',
          furnishing: 'Furnished',
          amenities: ['WiFi', 'AC'],
          houseRules: ['No Smoking'],
          status: 'pending_verification',
          ownerVerified: false,
          applicants: 0,
          views: 3,
          lastConfirmedAt: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (o2Err) {
      console.warn('  ⚠️ Note: O002 listing bootstrap:', o2Err.message);
    }
  }

  return { uid, email: def.email, password: TEST_PASSWORD };
}

async function provisionAllUsers() {
  console.log('🔧 Provisioning test users in Firebase...');
  const results = {};
  // Provision ADMIN first so admin privileges are available
  const keys = ['ADMIN', ...Object.keys(TEST_USERS).filter(k => k !== 'ADMIN')];
  for (const userId of keys) {
    try {
      results[userId] = await provisionUser(userId);
    } catch (err) {
      console.error(`  ❌ Failed to provision ${userId}:`, err.message);
      results[userId] = { error: err.message };
    }
  }
  return results;
}

/**
 * Create a listing on behalf of an owner by signing in as that owner first.
 */
async function createTestListing(ownerUserKey, overrides = {}) {
  const def = TEST_USERS[ownerUserKey];
  if (!def) throw new Error(`Unknown owner: ${ownerUserKey}`);

  const user = await ensureAuthUser(def.email, TEST_PASSWORD);
  const ownerUid = user.uid;

  const listing = {
    ownerId: ownerUid,
    title: overrides.title || `Test Listing by ${def.name}`,
    description: overrides.description || 'E2E test listing — deterministic',
    city: overrides.city || 'Chennai',
    locality: overrides.locality || 'T. Nagar',
    address: overrides.address || '42, Test Street, T. Nagar, Chennai',
    lat: overrides.lat || 13.0418,
    lng: overrides.lng || 80.2341,
    totalRent: overrides.totalRent || 24000,
    partnerShare: overrides.partnerShare || 12000,
    partnersNeeded: overrides.partnersNeeded || 1,
    deposit: overrides.deposit || 30000,
    flatType: overrides.flatType || '2BHK',
    furnishing: overrides.furnishing || 'Fully Furnished',
    amenities: overrides.amenities || ['AC', 'WiFi', 'Washing Machine'],
    houseRules: overrides.houseRules || ['No Smoking', 'Vegetarian'],
    status: overrides.status || 'pending_verification',
    ownerVerified: overrides.ownerVerified || false,
    applicants: overrides.applicants || 0,
    views: overrides.views || 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const ref = await addDoc(collection(db, 'listings'), listing);
  return { id: ref.id, ...listing };
}

/**
 * Create a connection from userA to userB by signing in as userA.
 */
async function createTestConnection(fromUserKey, toUserKey, overrides = {}) {
  const fromDef = TEST_USERS[fromUserKey];
  const toDef = TEST_USERS[toUserKey];

  const fromUser = await ensureAuthUser(fromDef.email, TEST_PASSWORD);
  const toUser = await ensureAuthUser(toDef.email, TEST_PASSWORD);

  // Sign back in as fromUser so request.auth.uid == fromUserId
  await signInWithEmailAndPassword(auth, fromDef.email, TEST_PASSWORD);

  const conn = {
    fromUserId: fromUser.uid,
    toUserId: toUser.uid,
    status: overrides.status || 'pending',
    createdAt: Timestamp.now(),
    ...overrides,
  };

  const ref = await addDoc(collection(db, 'connections'), conn);
  return { id: ref.id, ...conn };
}

/**
 * Accept a connection by signing in as the recipient (toUserId).
 */
async function acceptTestConnection(connectionId, recipientUserKey) {
  const def = TEST_USERS[recipientUserKey];
  await signInWithEmailAndPassword(auth, def.email, TEST_PASSWORD);
  await updateDoc(doc(db, 'connections', connectionId), { status: 'accepted' });
}

/**
 * Create a chat room between userA and userB by signing in as userA.
 */
async function createTestChatRoom(userKeyA, userKeyB, matchId = '') {
  const defA = TEST_USERS[userKeyA];
  const defB = TEST_USERS[userKeyB];

  const userA = await ensureAuthUser(defA.email, TEST_PASSWORD);
  const userB = await ensureAuthUser(defB.email, TEST_PASSWORD);

  // Sign back in as userA
  await signInWithEmailAndPassword(auth, defA.email, TEST_PASSWORD);

  const room = {
    participants: [userA.uid, userB.uid],
    matchId,
    lastMessage: '',
    lastMessageAt: Timestamp.now(),
    lastMessageSenderId: userA.uid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const ref = await addDoc(collection(db, 'chatRooms'), room);
  return { id: ref.id, ...room };
}

/**
 * Create a notification for a target user.
 */
async function createTestNotification(targetUid, type = 'connect', overrides = {}) {
  // Any authenticated user can create notifications
  const notif = {
    userId: targetUid,
    type,
    title: overrides.title || `Test ${type} notification`,
    description: overrides.description || `E2E test notification of type: ${type}`,
    read: false,
    actionUrl: overrides.actionUrl || '/notifications',
    createdAt: Timestamp.now(),
    ...overrides,
  };
  const ref = await addDoc(collection(db, 'notifications'), notif);
  return { id: ref.id, ...notif };
}

async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

async function signInAsTestUser(userId) {
  const def = TEST_USERS[userId];
  const cred = await signInWithEmailAndPassword(auth, def.email, TEST_PASSWORD);
  const profile = await getUserProfile(cred.user.uid);
  return { user: cred.user, profile, email: def.email, password: TEST_PASSWORD };
}

async function cleanTestConnections(userKeyA, userKeyB) {
  const defA = TEST_USERS[userKeyA];
  const defB = TEST_USERS[userKeyB];
  const userA = await ensureAuthUser(defA.email, TEST_PASSWORD);
  const userB = await ensureAuthUser(defB.email, TEST_PASSWORD);

  const adminDef = TEST_USERS.ADMIN;
  await signInWithEmailAndPassword(auth, adminDef.email, TEST_PASSWORD);

  const q1 = query(collection(db, 'connections'), where('fromUserId', '==', userA.uid), where('toUserId', '==', userB.uid));
  const snap1 = await getDocs(q1);
  for (const docSnap of snap1.docs) {
    await deleteDoc(docSnap.ref);
  }
  const q2 = query(collection(db, 'connections'), where('fromUserId', '==', userB.uid), where('toUserId', '==', userA.uid));
  const snap2 = await getDocs(q2);
  for (const docSnap of snap2.docs) {
    await deleteDoc(docSnap.ref);
  }

  // Also clean any prior chatRooms between userA and userB for clean test isolation
  const roomSnap = await getDocs(query(collection(db, 'chatRooms'), where('participants', 'array-contains', userA.uid)));
  for (const rDoc of roomSnap.docs) {
    const data = rDoc.data();
    if (data.participants && data.participants.includes(userB.uid)) {
      await deleteDoc(rDoc.ref);
    }
  }
}

module.exports = {
  TEST_USERS,
  TEST_PASSWORD,
  provisionAllUsers,
  provisionUser,
  createTestListing,
  createTestConnection,
  acceptTestConnection,
  createTestChatRoom,
  createTestNotification,
  cleanTestConnections,
  getUserProfile,
  signInAsTestUser,
  auth,
  db,
};
