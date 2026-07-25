import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function authenticateAdmin() {
  const adminEmail = 'admin_purge@nestmate.com';
  const adminPassword = 'AdminPassword123!';
  try {
    console.log(`Logging in as ${adminEmail}...`);
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
      console.log(`Creating admin account ${adminEmail}...`);
      await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    } else {
      console.log(`Auth warning (${err.code}), attempting creation...`);
      try {
        await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      } catch (createErr) {
        console.error('Failed to create admin user:', createErr);
      }
    }
  }
  console.log('Authenticated successfully as admin!\n');
}

async function clearCollection(collectionName: string) {
  console.log(`Clearing collection: ${collectionName}...`);
  try {
    const snap = await getDocs(collection(db, collectionName));
    const total = snap.docs.length;
    console.log(`Found ${total} documents in ${collectionName}`);
    
    let count = 0;
    for (const d of snap.docs) {
      // Check for subcollection 'messages' if this is a chat room
      if (collectionName === 'chatRooms' || collectionName === 'chat_rooms') {
        try {
          const subSnap = await getDocs(collection(db, collectionName, d.id, 'messages'));
          for (const subDoc of subSnap.docs) {
            await deleteDoc(doc(db, collectionName, d.id, 'messages', subDoc.id));
          }
        } catch (e) {
          // ignore subcollection fetch error if none
        }
      }

      await deleteDoc(doc(db, collectionName, d.id));
      count++;
      if (count % 5 === 0 || count === total) {
        console.log(`Deleted ${count}/${total} from ${collectionName}`);
      }
    }
    console.log(`Finished clearing ${collectionName}.\n`);
  } catch (err) {
    console.error(`Error clearing ${collectionName}:`, err);
  }
}

async function clearAll() {
  console.log('🚀 Starting Firebase Firestore data purge...');
  await authenticateAdmin();

  const collections = [
    'users',
    'listings',
    'connections',
    'chatRooms',
    'chat_rooms',
    'notifications',
    'listingViews',
    'agreements',
    'verifications',
    'reports',
    'reviews',
    'matches',
    'skippedUsers',
    'savedListings',
    'savedSeekers',
    'userSettings',
    'messages',
    'ratings',
    'agreementOTPs',
    'emailOTPs'
  ];

  for (const col of collections) {
    await clearCollection(col);
  }
  console.log('🎉 All Firebase Firestore database collections have been completely cleared!');
  process.exit(0);
}

clearAll();


