/**
 * Live Firebase verification script for NestMate security + PII changes.
 * Run: npx tsx scripts/verify-security.ts
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAbOt1hpqV056G_TkCRt916WbvIJzV7QlA',
  authDomain: 'nestmate-eb562.firebaseapp.com',
  projectId: 'nestmate-eb562',
  storageBucket: 'nestmate-eb562.firebasestorage.app',
  messagingSenderId: '647447840013',
  appId: '1:647447840013:web:7b3952e07060ab3f5d5c44',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

type Result = { name: string; ok: boolean; detail?: string };
const results: Result[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name: string, detail?: string) {
  results.push({ name, ok: false, detail });
  console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function expectDeny(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    fail(name, 'expected permission denial but write succeeded');
  } catch (e: any) {
    const code = e?.code || '';
    if (String(code).includes('permission-denied') || String(e?.message || '').includes('permission')) {
      pass(name, code || 'denied');
    } else {
      fail(name, e?.message || String(e));
    }
  }
}

async function expectAllow(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    pass(name);
  } catch (e: any) {
    fail(name, e?.message || String(e));
  }
}

const stamp = Date.now();
const emailA = `qa.verify.a.${stamp}@nestmate-test.local`;
const emailB = `qa.verify.b.${stamp}@nestmate-test.local`;
const password = 'QaVerify!23456';

async function main() {
  console.log('\n=== NestMate live security verification ===\n');

  // 0) Anonymous auth probe (demo login dependency) — informational only
  try {
    await signInAnonymously(auth);
    pass('Anonymous auth enabled');
    await signOut(auth);
  } catch (e: any) {
    // Not a hard failure — demo login now uses email/password ephemeral accounts
    console.log(`ℹ️  Anonymous auth disabled (${e?.code || e?.message}) — demo uses email/password`);
  }

  // 1) Email/password signup
  let credA;
  try {
    credA = await createUserWithEmailAndPassword(auth, emailA, password);
    pass('Email/password signup');
  } catch (e: any) {
    fail('Email/password signup', e?.message);
    process.exit(1);
  }

  const uid = credA.user.uid;

  await expectAllow('Create public user profile (safe trust fields)', async () => {
    await setDoc(doc(db, 'users', uid), {
      uid,
      name: 'QA Verify User',
      phone: '',
      email: '',
      workEmail: '',
      role: 'seeker',
      city: 'Chennai',
      localities: ['Velachery'],
      budget: 10000,
      onboardingComplete: true,
      isPremium: false,
      isVerified: false,
      workEmailVerified: false,
      verificationLevel: 1,
      quizAnswers: { q1: '1', q2: '2' },
      savedProfileIds: [],
      savedRoomIds: [],
      skippedUserIds: [],
      blockedUserIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await expectDeny('Deny client self-grant isVerified', async () => {
    await updateDoc(doc(db, 'users', uid), { isVerified: true });
  });

  await expectDeny('Deny client self-grant isPremium', async () => {
    await updateDoc(doc(db, 'users', uid), { isPremium: true });
  });

  await expectDeny('Deny client self-grant workEmailVerified', async () => {
    await updateDoc(doc(db, 'users', uid), { workEmailVerified: true });
  });

  await expectAllow('Write privateUserData for self', async () => {
    await setDoc(doc(db, 'privateUserData', uid), {
      phone: '+919876543210',
      email: emailA,
      updatedAt: serverTimestamp(),
    });
  });

  await expectAllow('Read privateUserData for self', async () => {
    const snap = await getDoc(doc(db, 'privateUserData', uid));
    if (!snap.exists()) throw new Error('private doc missing');
    if (snap.data()?.phone !== '+919876543210') throw new Error('phone mismatch');
  });

  await expectAllow('Update non-trust profile fields', async () => {
    await updateDoc(doc(db, 'users', uid), {
      bio: 'QA bio update',
      updatedAt: serverTimestamp(),
    });
  });

  await expectAllow('Create pending verification doc', async () => {
    await setDoc(doc(db, 'verifications', `qa_${uid}`), {
      userId: uid,
      type: 'aadhaar',
      status: 'pending',
      documentUrl: 'https://example.com/doc.jpg',
      submittedAt: new Date(),
    });
  });

  await expectDeny('Deny self-approve verification status', async () => {
    await updateDoc(doc(db, 'verifications', `qa_${uid}`), { status: 'approved' });
  });

  // Switch to user B
  await signOut(auth);
  const credB = await createUserWithEmailAndPassword(auth, emailB, password);
  const uid2 = credB.user.uid;
  pass('Second user signup');

  await expectDeny('Deny reading another user privateUserData', async () => {
    await getDoc(doc(db, 'privateUserData', uid));
  });

  await expectAllow('Public read of users profile (no PII)', async () => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) throw new Error('public profile missing');
    const data = snap.data()!;
    if (data.phone && String(data.phone).length > 0) {
      throw new Error(`public phone still present: ${data.phone}`);
    }
    if (data.email && String(data.email).length > 0) {
      throw new Error(`public email still present: ${data.email}`);
    }
  });

  await expectAllow('Second user create own profile', async () => {
    await setDoc(doc(db, 'users', uid2), {
      uid: uid2,
      name: 'QA User 2',
      phone: '',
      email: '',
      role: 'owner',
      city: 'Chennai',
      onboardingComplete: true,
      isPremium: false,
      isVerified: false,
      verificationLevel: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  // Chat room + phone share fields as participant
  await expectAllow('Create chat room as participant', async () => {
    await setDoc(doc(db, 'chatRooms', `qa_room_${stamp}`), {
      participants: [uid, uid2],
      matchId: '',
      lastMessage: '',
      lastMessageAt: null,
      createdAt: serverTimestamp(),
      typingStatus: {},
      phoneSharing: {
        requestedBy: null,
        requestedAt: null,
        acceptedBy: null,
        acceptedAt: null,
        requesterPhone: null,
        ownerPhone: null,
        seekerPhone: null,
      },
    });
  });

  await expectAllow('Update phoneSharing as participant', async () => {
    await updateDoc(doc(db, 'chatRooms', `qa_room_${stamp}`), {
      'phoneSharing.requestedBy': uid2,
      'phoneSharing.requesterPhone': '+911111111111',
    });
  });

  // Cleanup B
  try {
    await deleteDoc(doc(db, 'users', uid2));
    await deleteDoc(doc(db, 'chatRooms', `qa_room_${stamp}`));
  } catch {
    /* ignore */
  }
  try {
    await deleteUser(auth.currentUser!);
  } catch {
    await signOut(auth);
  }

  // Cleanup A
  await signInWithEmailAndPassword(auth, emailA, password);
  try {
    await deleteDoc(doc(db, 'verifications', `qa_${uid}`));
    await deleteDoc(doc(db, 'privateUserData', uid));
    await deleteDoc(doc(db, 'users', uid));
  } catch {
    /* ignore */
  }
  try {
    await deleteUser(auth.currentUser!);
  } catch {
    await signOut(auth);
  }
  pass('Cleanup completed');

  // Demo login path (ephemeral email account)
  const demoEmail = `demo.seeker.${stamp}@nestmate.app`;
  const demoPassword = `Demo!${stamp}`;
  try {
    const demoCred = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
    const demoUid = demoCred.user.uid;
    await setDoc(doc(db, 'users', demoUid), {
      uid: demoUid,
      name: 'Rohan (Demo Seeker)',
      phone: '',
      email: '',
      role: 'seeker',
      city: 'Chennai',
      localities: ['Velachery'],
      budget: 12000,
      onboardingComplete: true,
      isPremium: false,
      isVerified: false,
      verificationLevel: 1,
      quizAnswers: { q1: '1', q2: '2' },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(doc(db, 'privateUserData', demoUid), {
      phone: '+919999900001',
      email: demoEmail,
      updatedAt: serverTimestamp(),
    });
    pass('Demo login path (email ephemeral + privateUserData)');
    await deleteDoc(doc(db, 'privateUserData', demoUid));
    await deleteDoc(doc(db, 'users', demoUid));
    await deleteUser(demoCred.user);
  } catch (e: any) {
    fail('Demo login path (email ephemeral + privateUserData)', e?.message);
  }

  console.log('\n=== Summary ===');
  const failed = results.filter((r) => !r.ok);
  const passed = results.filter((r) => r.ok);
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);
  if (failed.length) {
    failed.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
  console.log('\nAll security checks passed.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
