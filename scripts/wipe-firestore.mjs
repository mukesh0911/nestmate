/**
 * NestMate — Production Data Wipe Script
 * Deletes ALL documents from every Firestore collection (including subcollections).
 * Run with: node scripts/wipe-firestore.mjs
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS or firebase-admin service account
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Collections to wipe (top-level)
const COLLECTIONS = [
  'users',
  'privateUserData',
  'listings',
  'connections',
  'chatRooms',
  'notifications',
  'reports',
  'reviews',
  'viewEvents',
  'blocks',
];

// Initialize Firebase Admin
let app;
const serviceAccountPath = join(__dirname, '../service-account.json');
if (existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
  app = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
} else {
  // Fall back to application default credentials
  app = getApps().length === 0 ? initializeApp() : getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

/** Delete all documents in a collection, including subcollections */
async function deleteCollection(collectionPath) {
  const ref = db.collection(collectionPath);
  const batchSize = 400;
  let totalDeleted = 0;

  while (true) {
    const snap = await ref.limit(batchSize).get();
    if (snap.empty) break;

    // Delete subcollections first
    for (const doc of snap.docs) {
      const subcols = await doc.ref.listCollections();
      for (const subcol of subcols) {
        await deleteCollection(subcol.path);
      }
    }

    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    totalDeleted += snap.size;
    process.stdout.write(`  ${collectionPath}: deleted ${totalDeleted} docs...\r`);
  }

  console.log(`  ✓ ${collectionPath}: ${totalDeleted} documents deleted`);
}

/** Delete all Firebase Auth users in batches */
async function deleteAllAuthUsers() {
  let totalDeleted = 0;
  let pageToken;

  do {
    const result = await auth.listUsers(1000, pageToken);
    if (result.users.length === 0) break;

    const uids = result.users.map(u => u.uid);
    await auth.deleteUsers(uids);
    totalDeleted += uids.length;
    console.log(`  Auth: deleted ${totalDeleted} accounts so far...`);
    pageToken = result.pageToken;
  } while (pageToken);

  console.log(`  ✓ Auth: ${totalDeleted} user accounts deleted`);
}

async function main() {
  console.log('\n🧹 NestMate — Firestore Data Wipe\n');
  console.log('Project: nestmate-eb562');
  console.log('──────────────────────────────────\n');

  console.log('📁 Deleting Firestore collections...\n');
  for (const col of COLLECTIONS) {
    await deleteCollection(col);
  }

  console.log('\n👤 Deleting Firebase Auth accounts...\n');
  await deleteAllAuthUsers();

  console.log('\n──────────────────────────────────');
  console.log('✅ All data wiped. NestMate is ready for real users.\n');
}

main().catch(err => {
  console.error('\n❌ Wipe failed:', err.message);
  process.exit(1);
});
