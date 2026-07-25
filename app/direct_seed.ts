import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
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

const randomDate = (days: number) => Timestamp.fromDate(new Date(Date.now() - Math.random() * days * 86400000));
const getQuiz = () => Array.from({ length: 10 }, () => Math.floor(Math.random() * 4) + 1).reduce((acc: any, v, i) => ({ ...acc, [`q${i + 1}`]: String(v) }), {});

const cityData: Record<string, { localities: string[]; coords: [number, number] }> = {
  'Chennai': {
    localities: [
      'Velachery',
      'T. Nagar',
      'Adyar',
      'Anna Nagar',
      'OMR Perungudi',
      'Nungambakkam',
      'Besant Nagar',
      'Guindy',
      'Mylapore',
      'Thoraipakkam'
    ],
    coords: [13.0827, 80.2707]
  }
};

const cities = ['Chennai'];

const professions = [
  'Software Engineer', 'Product Manager', 'Data Scientist', 'UI/UX Designer',
  'Architect', 'Financial Analyst', 'Marketing Lead', 'Doctor', 'Consultant',
  'Research Scholar', 'Investment Banker', 'Brand Manager'
];

const maleAvatars = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80'
];

const femaleAvatars = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80'
];

const roomImages = [
  [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1de24248ce?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    'https://images.unsplash.com/photo-1527030280862-64139fba04ca?w=800&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80'
  ],
  [
    'https://images.unsplash.com/photo-1540518614846-7ede433c5173?w=800&q=80',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80'
  ]
];

const fNames = [
  'Aarav', 'Rohan', 'Arjun', 'Sai', 'Karan', 'Rahul', 'Vikram', 'Amit', 'Suresh', 'Deepak',
  'Isha', 'Priya', 'Ananya', 'Sneha', 'Kavita', 'Ritu', 'Pooja', 'Neha', 'Divya', 'Swati',
  'Aditya', 'Manoj', 'Karthik', 'Sanjay', 'Prakash', 'Tarun', 'Nikhil', 'Simran', 'Meera', 'Tanya'
];
const lNames = ['Sharma', 'Patel', 'Reddy', 'Kumar', 'Singh', 'Iyer', 'Menon', 'Nair', 'Desai', 'Joshi', 'Gupta', 'Verma', 'Rao', 'Das', 'Bose'];

async function authenticateAdmin() {
  const adminEmail = 'admin_purge@nestmate.com';
  const adminPassword = 'AdminPassword123!';
  try {
    console.log(`Logging in as admin (${adminEmail})...`);
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  } catch (err: any) {
    try {
      await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    } catch (e) {
      // ignore
    }
  }
  console.log('✅ Admin Authenticated.\n');
}

async function runSeed() {
  console.log('🚀 Starting Comprehensive Firebase End-to-End Test Data Seed...');
  await authenticateAdmin();

  try {
    const owners: { uid: string; name: string; avatar: string; city: string }[] = [];
    const seekers: { uid: string; name: string; avatar: string; city: string }[] = [];

    // 1. CREATE 40 USERS (20 Seekers, 20 Owners)
    console.log('1. Creating 40 Rich User Profiles (20 Seekers, 20 Owners)...');
    for (let i = 0; i < 40; i++) {
      const isOwner = i >= 20;
      const role = isOwner ? 'owner' : 'seeker';
      const isMale = i % 2 === 0;
      const gender = isMale ? 'Male' : 'Female';
      const name = `${fNames[i % fNames.length]} ${lNames[i % lNames.length]}`;
      const phone = `+9198765${i.toString().padStart(5, '0')}`;
      const uid = `seed_user_${i + 1}`;
      const city = cities[i % cities.length];
      const cityLocs = cityData[city].localities;
      const locality = cityLocs[i % cityLocs.length];
      const avatarList = isMale ? maleAvatars : femaleAvatars;
      const avatar = avatarList[i % avatarList.length];

      const baseCoords = cityData[city].coords;
      const lat = baseCoords[0] + (Math.random() - 0.5) * 0.08;
      const lng = baseCoords[1] + (Math.random() - 0.5) * 0.08;

      const userObj = {
        uid,
        name,
        phone,
        email: `${name.replace(/\s+/g, '.').toLowerCase()}@nestmate-test.com`,
        role,
        age: 22 + (i % 10),
        gender,
        profession: professions[i % professions.length],
        company: `${professions[i % professions.length]} Labs`,
        city,
        locality,
        localities: [locality, cityLocs[(i + 1) % cityLocs.length]],
        lat,
        lng,
        geoLocation: { lat, lng, formattedAddress: `${locality}, ${city}` },
        budget: isOwner ? 12000 + ((i % 10) * 800) : 8000 + ((i % 10) * 600),
        budgetMin: 5000,
        budgetMax: 25000,
        moveInDate: '2026-08-01',
        avatar,
        bio: `Hi there! I am ${name}, a passionate ${professions[i % professions.length]} based in ${city}. Clean, quiet, and friendly!`,
        lifestyle: ['Non-Smoker', 'Early Riser', 'Working Professional', i % 2 === 0 ? 'Veg Only' : 'Pet Friendly'],
        quizAnswers: getQuiz(),
        onboardingComplete: true,
        isPremium: i % 3 === 0,
        isVerified: true,
        verificationLevel: (i % 3) + 1,
        createdAt: randomDate(45),
        updatedAt: randomDate(3),
        savedProfileIds: [],
        savedRoomIds: [],
        skippedUserIds: []
      };

      await setDoc(doc(db, 'users', uid), userObj);
      if (isOwner) owners.push({ uid, name, avatar, city });
      else seekers.push({ uid, name, avatar, city });
      process.stdout.write('.');
    }
    console.log('\n✅ 40 Users Created.');

    // 2. CREATE 20 REALISTIC LISTINGS
    console.log('\n2. Creating 20 Detailed Property Listings...');
    const listingIds: { id: string; ownerId: string; title: string; city: string }[] = [];
    const flatTypes = ['1BHK', '2BHK', '3BHK', 'Private Room', 'Studio'];

    for (let i = 0; i < 20; i++) {
      const owner = owners[i % owners.length];
      const city = cities[i % cities.length];
      const cityLocs = cityData[city].localities;
      const locality = cityLocs[i % cityLocs.length];
      const baseCoords = cityData[city].coords;
      const lat = baseCoords[0] + (Math.random() - 0.5) * 0.08;
      const lng = baseCoords[1] + (Math.random() - 0.5) * 0.08;
      const flatType = flatTypes[i % flatTypes.length];
      const title = `Spacious ${flatType} in ${locality}, ${city}`;
      const imgSet = roomImages[i % roomImages.length];

      const listingData = {
        ownerId: owner.uid,
        ownerName: owner.name,
        ownerAvatar: owner.avatar,
        title,
        description: `Modern and well-maintained ${flatType} available immediately. High-speed WiFi, 24/7 security, power backup, and close to public transit. Perfect for working professionals or students.`,
        city,
        locality,
        address: `#${101 + i}, Prime Heights, ${locality}, ${city}`,
        lat,
        lng,
        totalRent: 16000 + ((i % 10) * 1200),
        partnerShare: 8000 + ((i % 10) * 600),
        partnersNeeded: 1,
        deposit: 40000 + (i * 3000),
        flatType,
        furnishing: i % 2 === 0 ? 'Fully Furnished' : 'Semi-Furnished',
        amenities: ['AC', 'WiFi', 'Washing Machine', 'TV', 'Parking', 'Power Backup', 'Gym', 'Security'],
        houseRules: ['Non-Smoker', 'Maintain Quiet Hours', 'Keep Common Areas Clean'],
        images: imgSet,
        availableFrom: '2026-08-01',
        status: 'active',
        applicants: 3 + (i % 7),
        views: 45 + (i * 18),
        createdAt: randomDate(30),
        updatedAt: randomDate(2)
      };

      const lRef = await addDoc(collection(db, 'listings'), listingData);
      listingIds.push({ id: lRef.id, ownerId: owner.uid, title, city });
      process.stdout.write('.');
    }
    console.log('\n✅ 20 Listings Created.');

    // 3. CREATE 20 CONNECTIONS
    console.log('\n3. Creating 20 Connection Requests (Accepted, Pending, Declined)...');
    const acceptedConnections: { id: string; seekerId: string; ownerId: string }[] = [];

    for (let i = 0; i < 20; i++) {
      const seeker = seekers[i % seekers.length];
      const owner = owners[i % owners.length];
      const status = i < 10 ? 'accepted' : (i < 16 ? 'pending' : 'declined');

      const connRef = await addDoc(collection(db, 'connections'), {
        fromUserId: seeker.uid,
        toUserId: owner.uid,
        status,
        message: `Hi ${owner.name}, I loved your property listing in ${owner.city}! Would love to connect.`,
        createdAt: randomDate(20),
        updatedAt: randomDate(2)
      });

      if (status === 'accepted') {
        acceptedConnections.push({ id: connRef.id, seekerId: seeker.uid, ownerId: owner.uid });
      }
      process.stdout.write('.');
    }
    console.log('\n✅ 20 Connections Created.');

    // 4. CREATE CHAT ROOMS & MESSAGES
    console.log('\n4. Creating 10 Active Chat Rooms with Real-time Message Threads...');
    for (let i = 0; i < acceptedConnections.length; i++) {
      const conn = acceptedConnections[i];
      const seeker = seekers.find(s => s.uid === conn.seekerId)!;
      const owner = owners.find(o => o.uid === conn.ownerId)!;

      const roomRef = await addDoc(collection(db, 'chatRooms'), {
        participants: [conn.seekerId, conn.ownerId],
        matchId: conn.id,
        lastMessage: 'Sounds great! I will see you on Saturday at 11 AM.',
        lastMessageAt: randomDate(1),
        lastMessageSenderId: conn.seekerId,
        createdAt: randomDate(10),
        updatedAt: randomDate(1)
      });

      const messages = [
        { senderId: conn.seekerId, text: `Hi ${owner.name}! I saw your listing in ${owner.city}. Is it still available for move-in from August?` },
        { senderId: conn.ownerId, text: `Hello ${seeker.name}! Yes, it is available. Would you like to schedule a visit this weekend?` },
        { senderId: conn.seekerId, text: `That sounds great! Saturday at 11 AM works for me.` },
        { senderId: conn.ownerId, text: `Perfect! Here is the landmark: Near Main Market Metro Station. Let me know when you arrive.` },
        { senderId: conn.seekerId, text: `Sounds great! I will see you on Saturday at 11 AM.` }
      ];

      for (const m of messages) {
        await addDoc(collection(db, 'chatRooms', roomRef.id, 'messages'), {
          ...m,
          read: true,
          createdAt: randomDate(2)
        });
      }
      process.stdout.write('.');
    }
    console.log('\n✅ Chat Rooms & Messages Created.');

    // 5. CREATE RENT AGREEMENTS
    console.log('\n5. Creating 8 Rent Agreements (Signed & Draft)...');
    for (let i = 0; i < 8; i++) {
      const conn = acceptedConnections[i % acceptedConnections.length];
      const listing = listingIds[i % listingIds.length];

      await addDoc(collection(db, 'agreements'), {
        landlordId: conn.ownerId,
        tenantId: conn.seekerId,
        listingId: listing.id,
        propertyTitle: listing.title,
        city: listing.city,
        monthlyRent: 15000 + (i * 1000),
        securityDeposit: 35000,
        leaseDurationMonths: 11,
        startDate: '2026-08-01',
        status: i % 2 === 0 ? 'signed' : 'pending_signature',
        terms: 'Standard residential lease agreement. Rent due on the 5th of every month.',
        createdAt: randomDate(15),
        updatedAt: randomDate(1)
      });
      process.stdout.write('.');
    }
    console.log('\n✅ Rent Agreements Created.');

    // 6. CREATE REVIEWS & VOUCHES
    console.log('\n6. Creating 15 Peer Reviews & Vouches...');
    for (let i = 0; i < 15; i++) {
      const reviewer = seekers[i % seekers.length];
      const targetUser = owners[i % owners.length];

      await addDoc(collection(db, 'reviews'), {
        reviewerId: reviewer.uid,
        reviewerName: reviewer.name,
        reviewerAvatar: reviewer.avatar,
        targetUserId: targetUser.uid,
        rating: 5,
        comment: `Fantastic experience! ${targetUser.name} is extremely responsive, honest, and the property matches the pictures perfectly. Highly recommended!`,
        createdAt: randomDate(25)
      });
      process.stdout.write('.');
    }
    console.log('\n✅ Peer Reviews Created.');

    // 7. CREATE NOTIFICATIONS
    console.log('\n7. Creating 25 System & Interaction Notifications...');
    for (let i = 0; i < 25; i++) {
      const user = i < 12 ? owners[i % owners.length] : seekers[i % seekers.length];

      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        type: i % 3 === 0 ? 'connect' : (i % 3 === 1 ? 'message' : 'agreement'),
        title: i % 3 === 0 ? 'New Connection Request' : (i % 3 === 1 ? 'New Chat Message' : 'Rent Agreement Update'),
        description: i % 3 === 0
          ? 'A user expressed interest in your profile!'
          : (i % 3 === 1 ? 'You have an unread message in your inbox.' : 'Your rental agreement status has been updated.'),
        read: i % 2 === 0,
        actionUrl: i % 3 === 0 ? '/connections' : (i % 3 === 1 ? '/chat' : '/agreements'),
        createdAt: randomDate(5)
      });
      process.stdout.write('.');
    }
    console.log('\n✅ Notifications Created.');

    // 8. CREATE LISTING VIEWS ANALYTICS
    console.log('\n8. Generating 30 Days of Listing View Analytics...');
    for (let l = 0; l < 5; l++) {
      const targetListingId = listingIds[l].id;
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        await setDoc(doc(db, 'listingViews', `${targetListingId}_${dayStr}`), {
          listingId: targetListingId,
          date: dayStr,
          count: 15 + Math.floor(Math.random() * 35)
        });
      }
    }
    console.log('✅ Listing Analytics Created.');

    console.log('\n🎉 ALL REAL-TIME FIREBASE END-TO-END TEST DATA POPULATED SUCCESSFULLY!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error during direct seed:', err);
    process.exit(1);
  }
}

runSeed();

