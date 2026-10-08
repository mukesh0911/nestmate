/**
 * NestMate — Certified Seed Data Contract Verifier (CLI / Node)
 * Verifies all required personas, listings, connections, chat rooms, verifications,
 * reports, and relationship foreign keys directly against real Firestore.
 *
 * Usage: node tests/helpers/verifySeedData.cjs
 */
const { initializeApp } = require('../../app/node_modules/firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('../../app/node_modules/firebase/auth');
const {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
} = require('../../app/node_modules/firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyAbOt1hpqV056G_TkCRt916WbvIJzV7QlA',
  authDomain: 'nestmate-eb562.firebaseapp.com',
  projectId: 'nestmate-eb562',
  storageBucket: 'nestmate-eb562.firebasestorage.app',
  messagingSenderId: '647447840013',
  appId: '1:647447840013:web:7b3952e07060ab3f5d5c44',
};

async function verifySeedData() {
  console.log('======================================================');
  console.log('🔍 CERTIFYING SEED DATA CONTRACT AGAINST FIRESTORE');
  console.log('======================================================');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInWithEmailAndPassword(auth, 'admin@nestmate-test.com', 'AdminPassword123!');
  console.log('✅ Admin authenticated. Reading live Firestore documents...\n');

  let errors = 0;
  let totalChecked = 0;

  function reportError(msg) {
    console.error(`  ❌ FAIL: ${msg}`);
    errors++;
  }

  function reportSuccess(msg) {
    console.log(`  ✓ PASS: ${msg}`);
  }

  // 1. PERSONAS CONTRACT AUDIT
  console.log('--- 1. PERSONAS VERIFICATION ---');
  const REQUIRED_PERSONAS = [
    { key: 'SEEKER_A', uid: 'test_user_ref', role: 'seeker', status: 'active', verified: true },
    { key: 'SEEKER_B', uid: 'test_user_perfect_match', role: 'seeker', status: 'active', verified: true },
    { key: 'SEEKER_C', uid: 'test_user_night_owl', role: 'seeker', status: 'active', verified: true },
    { key: 'OWNER_A', uid: 'test_user_owner_01', role: 'owner', status: 'active', verified: true },
    { key: 'OWNER_B', uid: 'test_user_owner_02', role: 'owner', status: 'active', verified: false },
    { key: 'OWNER_PENDING_VERIFICATION', uid: 'test_user_owner_03', role: 'owner', status: 'active', verified: false },
    { key: 'OWNER_REJECTED', uid: 'test_user_owner_rejected', role: 'owner', status: 'active', verified: false },
    { key: 'ADMIN', uid: 'test_user_admin', role: 'seeker', status: 'active', verified: true },
    { key: 'ONBOARDING_PENDING', uid: 'test_user_onboarding_pending', role: null, status: 'active', onboardingComplete: false },
    { key: 'SUSPENDED_USER', uid: 'test_user_suspended', role: 'seeker', status: 'suspended' },
    { key: 'BANNED_USER', uid: 'test_user_banned', role: 'seeker', status: 'banned' },
    { key: 'PREMIUM_USER', uid: 'test_user_pro_user', role: 'seeker', status: 'active', isPremium: true },
    { key: 'QUOTA_FULL_USER', uid: 'test_user_quota_full', role: 'seeker', status: 'active', connectsUsed: 5 },
  ];

  const userCache = new Map();
  for (const p of REQUIRED_PERSONAS) {
    totalChecked++;
    const snap = await getDoc(doc(db, 'users', p.uid));
    if (!snap.exists()) {
      reportError(`Missing user document for ${p.key} (UID: ${p.uid})`);
      continue;
    }
    const data = snap.data();
    userCache.set(p.uid, data);

    if (p.role !== undefined && data.role !== p.role) {
      reportError(`${p.key} role mismatch: expected '${p.role}', got '${data.role}'`);
    } else if (p.status !== undefined && data.status !== p.status) {
      reportError(`${p.key} status mismatch: expected '${p.status}', got '${data.status}'`);
    } else if (p.verified !== undefined && data.isVerified !== p.verified) {
      reportError(`${p.key} isVerified mismatch: expected ${p.verified}, got ${data.isVerified}`);
    } else if (p.onboardingComplete !== undefined && data.onboardingComplete !== p.onboardingComplete) {
      reportError(`${p.key} onboardingComplete mismatch: expected ${p.onboardingComplete}, got ${data.onboardingComplete}`);
    } else if (p.isPremium !== undefined && data.isPremium !== p.isPremium) {
      reportError(`${p.key} isPremium mismatch: expected ${p.isPremium}, got ${data.isPremium}`);
    } else if (p.connectsUsed !== undefined && data.connectsUsed !== p.connectsUsed) {
      reportError(`${p.key} connectsUsed mismatch: expected ${p.connectsUsed}, got ${data.connectsUsed}`);
    } else {
      reportSuccess(`${p.key.padEnd(28)} [${p.uid}] (${data.name || 'Anonymous'})`);
    }
  }

  // 2. LISTINGS CONTRACT AUDIT (All 7 States)
  console.log('\n--- 2. LISTINGS LIFECYCLE VERIFICATION (7 States) ---');
  const REQUIRED_LISTINGS = [
    { id: 'test_listing_kora_01', status: 'active', ownerVerified: true, ownerId: 'test_user_owner_01' },
    { id: 'FSXystxUrr3MzY37W7L2', status: 'active', ownerVerified: true, ownerId: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1' },
    { id: 'test_listing_hsr_01', status: 'active', ownerVerified: true, ownerId: 'test_user_owner_03' },
    { id: 'test_listing_pend_01', status: 'pending_verification', ownerVerified: false, ownerId: 'test_user_owner_02' },
    { id: 'test_listing_draft_01', status: 'draft', ownerVerified: false, ownerId: 'test_user_owner_02' },
    { id: 'test_listing_pause_01', status: 'paused', ownerVerified: true, ownerId: 'test_user_owner_01' },
    { id: 'test_listing_fill_01', status: 'filled', ownerVerified: true, ownerId: 'test_user_owner_04' },
    { id: 'test_listing_close_01', status: 'closed', ownerVerified: true, ownerId: 'test_user_owner_04' },
    { id: 'test_listing_exp_01', status: 'active', ownerVerified: true, ownerId: 'test_user_owner_01' },
  ];

  const listingCache = new Map();
  for (const reqL of REQUIRED_LISTINGS) {
    totalChecked++;
    const snap = await getDoc(doc(db, 'listings', reqL.id));
    if (!snap.exists()) {
      reportError(`Missing listing document: ${reqL.id}`);
      continue;
    }
    const data = snap.data();
    listingCache.set(reqL.id, data);

    if (data.status !== reqL.status) {
      reportError(`Listing ${reqL.id} status mismatch: expected '${reqL.status}', got '${data.status}'`);
    } else if (data.ownerVerified !== reqL.ownerVerified) {
      reportError(`Listing ${reqL.id} ownerVerified mismatch: expected ${reqL.ownerVerified}, got ${data.ownerVerified}`);
    } else if (data.ownerId !== reqL.ownerId) {
      reportError(`Listing ${reqL.id} ownerId mismatch: expected '${reqL.ownerId}', got '${data.ownerId}'`);
    } else {
      reportSuccess(`Listing: ${reqL.id.padEnd(24)} [status=${data.status}, verified=${data.ownerVerified}]`);
    }
  }

  // 3. CONNECTIONS CONTRACT AUDIT (All 4 States)
  console.log('\n--- 3. CONNECTIONS VERIFICATION (4 States) ---');
  const REQUIRED_CONNECTIONS = [
    { id: 'test_conn_p01', status: 'pending', from: 'test_user_ref', to: 'test_user_owner_01' },
    { id: 'test_conn_a01', status: 'accepted', from: 'test_user_perfect_match', to: 'test_user_owner_01' },
    { id: 'test_conn_r01', status: 'rejected', from: 'test_user_night_owl', to: 'test_user_owner_01' },
    { id: 'test_conn_b01', status: 'blocked', from: 'test_user_suspended', to: 'test_user_owner_01' },
  ];

  const connCache = new Map();
  for (const c of REQUIRED_CONNECTIONS) {
    totalChecked++;
    const snap = await getDoc(doc(db, 'connections', c.id));
    if (!snap.exists()) {
      reportError(`Missing connection document: ${c.id}`);
      continue;
    }
    const data = snap.data();
    connCache.set(c.id, data);

    if (data.status !== c.status) {
      reportError(`Connection ${c.id} status mismatch: expected '${c.status}', got '${data.status}'`);
    } else if (data.fromUserId !== c.from || data.toUserId !== c.to) {
      reportError(`Connection ${c.id} participants mismatch: expected ${c.from} -> ${c.to}, got ${data.fromUserId} -> ${data.toUserId}`);
    } else {
      reportSuccess(`Connection: ${c.id.padEnd(21)} [${c.from} → ${c.to}] (${data.status})`);
    }
  }

  // 4. CHAT ROOMS & MESSAGES CONTRACT AUDIT
  console.log('\n--- 4. CHAT ROOMS & SUBCOLLECTION MESSAGES VERIFICATION ---');
  totalChecked++;
  const roomSnap = await getDoc(doc(db, 'chatRooms', 'test_chat_crm_01'));
  if (!roomSnap.exists()) {
    reportError('Missing chatRoom: test_chat_crm_01');
  } else {
    const roomData = roomSnap.data();
    reportSuccess(`ChatRoom: test_chat_crm_01 [${roomData.participants.join(' ↔ ')}]`);

    // Verify subcollection messages
    const msgsSnap = await getDocs(collection(db, 'chatRooms', 'test_chat_crm_01', 'messages'));
    if (msgsSnap.empty) {
      reportError('No messages found in subcollection chatRooms/test_chat_crm_01/messages');
    } else {
      reportSuccess(`Subcollection messages count: ${msgsSnap.size} in test_chat_crm_01`);
    }
  }

  // 5. GOVERNANCE & COMPLIANCE (Verifications & Reports)
  console.log('\n--- 5. OWNER VERIFICATIONS & ABUSE REPORTS VERIFICATION ---');
  const REQUIRED_VERIFICATIONS = [
    { id: 'test_verif_owner_01', user: 'test_user_owner_01', status: 'APPROVED' },
    { id: 'test_verif_owner_02', user: 'test_user_owner_02', status: 'SUBMITTED' },
    { id: 'test_verif_owner_03', user: 'test_user_owner_03', status: 'UNDER_REVIEW' },
    { id: 'test_verif_owner_04', user: 'test_user_owner_04', status: 'RESUBMISSION_REQUIRED' },
    { id: 'test_verif_owner_05', user: 'test_user_owner_rejected', status: 'REJECTED' },
  ];

  for (const v of REQUIRED_VERIFICATIONS) {
    totalChecked++;
    const snap = await getDoc(doc(db, 'verifications', v.id));
    if (!snap.exists()) {
      reportError(`Missing verification document: ${v.id}`);
    } else {
      const data = snap.data();
      if (data.status !== v.status) {
        reportError(`Verification ${v.id} status mismatch: expected ${v.status}, got ${data.status}`);
      } else {
        reportSuccess(`Verification: ${v.id.padEnd(23)} [${v.user} → ${v.status}]`);
      }
    }
  }

  const REQUIRED_REPORTS = [
    { id: 'test_report_rep_01', status: 'open' },
    { id: 'test_report_rep_02', status: 'resolved' },
  ];
  for (const r of REQUIRED_REPORTS) {
    totalChecked++;
    const snap = await getDoc(doc(db, 'reports', r.id));
    if (!snap.exists()) {
      reportError(`Missing report document: ${r.id}`);
    } else {
      reportSuccess(`Report: ${r.id.padEnd(29)} [status=${snap.data().status}]`);
    }
  }

  // 6. FOREIGN KEY & RELATIONSHIP INTEGRITY AUDIT
  console.log('\n--- 6. FOREIGN KEY & REFERENTIAL INTEGRITY AUDIT ---');
  let brokenRefs = 0;

  // Check Listings -> Owners
  for (const [id, l] of listingCache.entries()) {
    totalChecked++;
    const ownerSnap = await getDoc(doc(db, 'users', l.ownerId));
    if (!ownerSnap.exists()) {
      reportError(`Broken FK: Listing ${id} references non-existent owner ${l.ownerId}`);
      brokenRefs++;
    }
  }

  // Check Connections -> Users
  for (const [id, c] of connCache.entries()) {
    totalChecked += 2;
    const fromSnap = await getDoc(doc(db, 'users', c.fromUserId));
    const toSnap = await getDoc(doc(db, 'users', c.toUserId));
    if (!fromSnap.exists()) {
      reportError(`Broken FK: Connection ${id} fromUserId ${c.fromUserId} not found`);
      brokenRefs++;
    }
    if (!toSnap.exists()) {
      reportError(`Broken FK: Connection ${id} toUserId ${c.toUserId} not found`);
      brokenRefs++;
    }
  }

  if (brokenRefs === 0) {
    reportSuccess('All referential foreign keys valid (0 broken references).');
  }

  console.log('\n======================================================');
  if (errors > 0) {
    console.error(`❌ SEED VERIFICATION FAILED WITH ${errors} ERROR(S) (Checked ${totalChecked} assertions)`);
    console.log('======================================================');
    process.exit(1);
  } else {
    console.log(`🎉 SEED DATA CONTRACT 100% CERTIFIED! (Checked ${totalChecked} assertions, 0 errors)`);
    console.log('======================================================');
    process.exit(0);
  }
}

if (require.main === module) {
  verifySeedData().catch(err => {
    console.error('\n❌ VERIFICATION FATAL EXCEPTION:', err);
    process.exit(1);
  });
}

module.exports = { verifySeedData };
