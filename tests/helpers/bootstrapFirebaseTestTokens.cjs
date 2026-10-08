/**
 * NestMate — Firebase Auth Token Bootstrapper
 * Creates/authenticates real Firebase Auth accounts for test personas,
 * synchronizes their Firestore profile docs to their Firebase Auth UIDs,
 * and saves deterministic IndexedDB auth records to tests/.auth/firebaseAuthTokens.json.
 */
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('d:/nestmate/app/node_modules/firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('d:/nestmate/app/node_modules/firebase/auth');
const { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } = require('d:/nestmate/app/node_modules/firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyAbOt1hpqV056G_TkCRt916WbvIJzV7QlA',
  authDomain: 'nestmate-eb562.firebaseapp.com',
  projectId: 'nestmate-eb562',
  storageBucket: 'nestmate-eb562.firebasestorage.app',
  messagingSenderId: '647447840013',
  appId: '1:647447840013:web:7b3952e07060ab3f5d5c44',
};

const PERSONAS_TO_BOOTSTRAP = [
  { key: 'ADMIN', email: 'admin@nestmate-test.com', pass: 'AdminPassword123!', templateUid: 'test_user_admin' },
  { key: 'SEEKER_A', email: 'seeker.ref@nestmate-test.com', pass: 'password123', templateUid: 'test_user_ref' },
  { key: 'SEEKER_B', email: 'seeker.perfect@nestmate-test.com', pass: 'password123', templateUid: 'test_user_perfect_match' },
  { key: 'OWNER_A', email: 'owner.verified@nestmate-test.com', pass: 'password123', templateUid: 'test_user_owner_01' },
  { key: 'OWNER_B', email: 'owner.unverified@nestmate-test.com', pass: 'password123', templateUid: 'test_user_owner_02' },
];

async function bootstrap() {
  console.log('⚡ Bootstrapping Real Firebase Auth Tokens for Test Personas...');
  const adminApp = initializeApp(firebaseConfig, 'admin-app-' + Date.now());
  const adminAuth = getAuth(adminApp);
  const adminDb = getFirestore(adminApp);

  await signInWithEmailAndPassword(adminAuth, 'admin@nestmate-test.com', 'AdminPassword123!');
  console.log('✓ Admin authenticated.');

  const authRecords = {};
  const personaUids = {};

  for (const p of PERSONAS_TO_BOOTSTRAP) {
    const personaApp = initializeApp(firebaseConfig, 'persona-' + p.key + '-' + Date.now());
    const personaAuth = getAuth(personaApp);
    let userCred = null;
    try {
      userCred = await signInWithEmailAndPassword(personaAuth, p.email, p.pass);
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          userCred = await createUserWithEmailAndPassword(personaAuth, p.email, p.pass);
          console.log(`+ Created Firebase Auth account for ${p.email}`);
        } catch (createErr) {
          console.error(`Failed to create ${p.email}:`, createErr.message);
          continue;
        }
      } else {
        console.error(`Sign in failed for ${p.email}:`, err.message);
        continue;
      }
    }

    const u = userCred.user;
    const tokenResult = await u.getIdTokenResult();
    personaUids[p.key] = u.uid;

    const record = {
      fbase_key: `firebase:authUser:${firebaseConfig.apiKey}:[DEFAULT]`,
      value: {
        uid: u.uid,
        email: u.email,
        emailVerified: u.emailVerified,
        isAnonymous: u.isAnonymous,
        providerData: [
          {
            providerId: 'password',
            uid: u.email,
            displayName: u.displayName,
            email: u.email,
            phoneNumber: u.phoneNumber,
            photoURL: u.photoURL,
          },
        ],
        stsTokenManager: {
          refreshToken: u.refreshToken,
          accessToken: tokenResult.token,
          expirationTime: Date.now() + 3600000,
        },
        createdAt: u.metadata.createdAt,
        lastLoginAt: u.metadata.lastLoginAt,
        apiKey: firebaseConfig.apiKey,
        appName: '[DEFAULT]',
      },
    };

    authRecords[p.key] = record;
    console.log(`✓ Persona ${p.key} (${p.email}) UID: ${u.uid}`);

    // Sync Firestore profile doc from template using adminDb
    const templateSnap = await getDoc(doc(adminDb, 'users', p.templateUid));
    if (templateSnap.exists()) {
      const templateData = templateSnap.data();
      await setDoc(doc(adminDb, 'users', u.uid), {
        ...templateData,
        uid: u.uid,
        email: p.email,
      });
      console.log(`  ✓ Synced Firestore profile users/${u.uid}`);
    }
  }

  // Ensure test_chat_crm_01 has participants for SEEKER_B and OWNER_A using adminDb
  const chatParticipants = [
    'test_user_perfect_match',
    'test_user_owner_01',
    personaUids['SEEKER_B'],
    personaUids['OWNER_A'],
  ].filter(Boolean);

  await updateDoc(doc(adminDb, 'chatRooms', 'test_chat_crm_01'), {
    participants: arrayUnion(...chatParticipants),
  });
  console.log('✓ Updated test_chat_crm_01 participants with live UIDs.');

  // Save tokens to tests/.auth/firebaseAuthTokens.json
  const outDir = path.resolve(__dirname, '../.auth');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, 'firebaseAuthTokens.json');
  fs.writeFileSync(outFile, JSON.stringify(authRecords, null, 2), 'utf-8');
  console.log(`✅ Saved all Firebase Auth tokens to ${outFile}\n`);
}

bootstrap().catch(console.error);
