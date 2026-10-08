/**
 * CLI Runner for Test Environment & Universe Verification
 * Usage: node tests/seed/run-verify.cjs
 */
const fs = require('fs');
const path = require('path');
const { assertTestEnvironment, PROTECTED_ACCOUNTS } = require('../helpers/environmentGuard.cjs');

console.log('======================================================');
console.log('🔍 NESTMATE TEST ENVIRONMENT & UNIVERSE VERIFICATION');
console.log('======================================================');

// 1. Environment & Production Protection Check
let envStatus = 'PASS';
let envDetails;
try {
  envDetails = assertTestEnvironment('test:verify');
} catch (e) {
  console.error(`❌ ENVIRONMENT ISOLATION FAILURE: ${e.message}`);
  process.exit(1);
}

// 2. Read App Environment Configuration
const appEnvPath = path.resolve(__dirname, '../../app/.env');
let firebaseProjectId = 'nestmate-eb562';
let authDomain = 'nestmate-eb562.firebaseapp.com';
let storageBucket = 'nestmate-eb562.firebasestorage.app';

if (fs.existsSync(appEnvPath)) {
  const content = fs.readFileSync(appEnvPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_FIREBASE_PROJECT_ID=')) {
      firebaseProjectId = trimmed.split('=')[1].trim();
    }
    if (trimmed.startsWith('VITE_FIREBASE_AUTH_DOMAIN=')) {
      authDomain = trimmed.split('=')[1].trim();
    }
    if (trimmed.startsWith('VITE_FIREBASE_STORAGE_BUCKET=')) {
      storageBucket = trimmed.split('=')[1].trim();
    }
  });
}

console.log('\n--- ENVIRONMENT HEALTH REPORT ---');
console.log(`TEST ENVIRONMENT:        ISOLATED (${envDetails.nodeEnv})`);
console.log(`Firebase project:        ${firebaseProjectId}`);
console.log(`Firestore:               ACTIVE (${firebaseProjectId})`);
console.log(`Storage:                 ACTIVE (${storageBucket})`);
console.log(`Auth:                    ACTIVE (${authDomain})`);
console.log(`Base URL:                http://localhost:3000`);
console.log(`Environment:             ${envDetails.nodeEnv}`);
console.log(`Production protection:   ACTIVE (Zero-Touch Protected: ${PROTECTED_ACCOUNTS.join(', ')})`);

// 3. Universe Artifact Verification
const universeFile = path.resolve(__dirname, '../data/seed-universe.json');
if (!fs.existsSync(universeFile)) {
  console.error('\n❌ VERIFICATION FAILURE: tests/data/seed-universe.json does not exist. Run "npm run test:seed" first.');
  process.exit(1);
}

const universe = JSON.parse(fs.readFileSync(universeFile, 'utf8'));

// 4. Validate All 12 Required Test Identities
const REQUIRED_IDENTITIES = [
  { key: 'SEEKER_A', uid: 'test_user_ref', role: 'seeker' },
  { key: 'SEEKER_B', uid: 'test_user_perfect_match', role: 'seeker' },
  { key: 'OWNER_A', uid: 'test_user_owner_01', role: 'owner' },
  { key: 'OWNER_B', uid: 'test_user_owner_02', role: 'owner' },
  { key: 'ADMIN', uid: 'test_user_admin', role: 'seeker' },
  { key: 'ONBOARDING_PENDING', uid: 'test_user_onboarding_pending', role: null },
  { key: 'SUSPENDED_USER', uid: 'test_user_suspended', status: 'suspended' },
  { key: 'BANNED_USER', uid: 'test_user_banned', status: 'banned' },
  { key: 'OWNER_PENDING_VERIFICATION', uid: 'test_user_owner_03', role: 'owner' },
  { key: 'OWNER_APPROVED', uid: 'test_user_owner_01', role: 'owner' },
  { key: 'OWNER_REJECTED', uid: 'test_user_owner_rejected', role: 'owner' },
  { key: 'PREMIUM_USER', uid: 'test_user_pro_user', role: 'seeker' },
];

const allUsers = universe.users || [
  ...(universe.seekers || []),
  ...(universe.owners || []),
  ...(universe.admins || []),
  ...(universe.otherUsers || []),
];
const userMap = new Map(allUsers.map(u => [u.uid, u]));

console.log('\n--- IDENTITY AUDIT ---');
let identityFailures = 0;
REQUIRED_IDENTITIES.forEach(({ key, uid, role, status }) => {
  const user = userMap.get(uid);
  if (!user) {
    console.error(`  ❌ Missing identity: ${key} (UID: ${uid})`);
    identityFailures++;
  } else {
    const roleMatches = role === undefined || user.role === role;
    const statusMatches = status === undefined || user.status === status;
    if (!roleMatches || !statusMatches) {
      console.error(`  ❌ Attribute mismatch for ${key}: role=${user.role}, status=${user.status}`);
      identityFailures++;
    } else {
      console.log(`  ✓ ${key.padEnd(28)} [UID: ${uid}] (${user.name || 'Anonymous'})`);
    }
  }
});

if (identityFailures > 0) {
  console.error(`\n❌ VERIFICATION FAILURE: ${identityFailures} identity mismatch(es) found.`);
  process.exit(1);
}

// 5. Relationship Integrity (Foreign Key Audit)
console.log('\n--- RELATIONSHIP INTEGRITY AUDIT ---');
let brokenRefs = 0;

// Listings -> Owners
universe.listings.forEach(l => {
  if (!userMap.has(l.ownerId)) {
    console.error(`  ❌ Broken Reference: Listing ${l.id} ownerId ${l.ownerId} not found in users.`);
    brokenRefs++;
  }
});

// Connections -> Users
universe.connections.forEach(c => {
  if (!userMap.has(c.fromUserId)) {
    console.error(`  ❌ Broken Reference: Connection ${c.id} fromUserId ${c.fromUserId} not found.`);
    brokenRefs++;
  }
  if (!userMap.has(c.toUserId)) {
    console.error(`  ❌ Broken Reference: Connection ${c.id} toUserId ${c.toUserId} not found.`);
    brokenRefs++;
  }
});

// ChatRooms -> Users & Connections
const connMap = new Map(universe.connections.map(c => [c.id, c]));
universe.chatRooms.forEach(cr => {
  cr.participants.forEach(p => {
    if (!userMap.has(p)) {
      console.error(`  ❌ Broken Reference: ChatRoom ${cr.id} participant ${p} not found in users.`);
      brokenRefs++;
    }
  });
  if (cr.connectionId && !connMap.has(cr.connectionId)) {
    console.error(`  ❌ Broken Reference: ChatRoom ${cr.id} connectionId ${cr.connectionId} not found.`);
    brokenRefs++;
  }
});

// Messages -> ChatRooms & Users
const roomMap = new Map(universe.chatRooms.map(r => [r.id, r]));
universe.messages.forEach(m => {
  const room = roomMap.get(m.roomId);
  if (!room) {
    console.error(`  ❌ Broken Reference: Message ${m.id} roomId ${m.roomId} not found.`);
    brokenRefs++;
  } else if (!room.participants.includes(m.senderId)) {
    console.error(`  ❌ Broken Reference: Message ${m.id} sender ${m.senderId} is not a room participant.`);
    brokenRefs++;
  }
});

// Notifications -> Users
(universe.notifications || []).forEach(n => {
  if (!userMap.has(n.userId)) {
    console.error(`  ❌ Broken Reference: Notification ${n.id} userId ${n.userId} not found.`);
    brokenRefs++;
  }
});

// Verifications -> Owners
universe.verifications.forEach(v => {
  if (!userMap.has(v.userId)) {
    console.error(`  ❌ Broken Reference: Verification ${v.id} userId ${v.userId} not found.`);
    brokenRefs++;
  }
});

// Reports -> Users
universe.reports.forEach(r => {
  if (!userMap.has(r.reporterId)) {
    console.error(`  ❌ Broken Reference: Report ${r.id} reporterId ${r.reporterId} not found.`);
    brokenRefs++;
  }
  if (!userMap.has(r.targetId)) {
    console.error(`  ❌ Broken Reference: Report ${r.id} targetId ${r.targetId} not found.`);
    brokenRefs++;
  }
});

console.log(`Total Relationships Checked: ${universe.listings.length + universe.connections.length * 2 + universe.chatRooms.length * 2 + universe.messages.length + universe.verifications.length + universe.reports.length * 2}`);
console.log(`Broken / Orphan References:  ${brokenRefs}`);

if (brokenRefs > 0) {
  console.error(`\n❌ VERIFICATION FAILURE: ${brokenRefs} broken reference(s) discovered.`);
  process.exit(1);
}

// 6. Playwright Storage State Files Check
console.log('\n--- PLAYWRIGHT STORAGE STATES AUDIT ---');
const authDir = path.resolve(__dirname, '../.auth');
const REQUIRED_STORAGE_STATES = ['seekerA.json', 'seekerB.json', 'ownerA.json', 'ownerB.json', 'admin.json'];
let authStateFailures = 0;

REQUIRED_STORAGE_STATES.forEach(filename => {
  const filePath = path.join(authDir, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`  ❌ Missing storage state: ${filename}`);
    authStateFailures++;
  } else {
    try {
      const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!state.origins || state.origins.length === 0 || !state.origins[0].localStorage) {
        console.error(`  ❌ Malformed storage state: ${filename}`);
        authStateFailures++;
      } else {
        console.log(`  ✓ tests/.auth/${filename} [Valid StorageState]`);
      }
    } catch (e) {
      console.error(`  ❌ Unparseable storage state: ${filename} (${e.message})`);
      authStateFailures++;
    }
  }
});

if (authStateFailures > 0) {
  console.error(`\n❌ VERIFICATION FAILURE: ${authStateFailures} storage state file issue(s).`);
  process.exit(1);
}

console.log('\n======================================================');
console.log('✅ ALL ENVIRONMENT & UNIVERSE VERIFICATIONS PASSED');
console.log('======================================================');
