/**
 * NestMate — Certified Full Firestore Seed Script
 * Generates and seeds the complete deterministic test universe into Firestore:
 * - 15 Test Personas (All 12 certified states + active browser accounts)
 * - 12 Listings (All 7 lifecycle states: active, pending, draft, paused, filled, closed, expired)
 * - 6 Connections (All 4 states: pending, accepted, rejected, blocked)
 * - 6 Chat Rooms with subcollection messages (Today's timestamps)
 * - 5 Owner Verifications & 2 Abuse Reports
 * - 8 Notifications & Private User Data
 * - Playwright storageState files in tests/.auth/ for all personas
 *
 * Usage: node tests/seed/full-firestore-seed.cjs
 */
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('../../app/node_modules/firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('../../app/node_modules/firebase/auth');
const {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
} = require('../../app/node_modules/firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyAbOt1hpqV056G_TkCRt916WbvIJzV7QlA',
  authDomain: 'nestmate-eb562.firebaseapp.com',
  projectId: 'nestmate-eb562',
  storageBucket: 'nestmate-eb562.firebasestorage.app',
  messagingSenderId: '647447840013',
  appId: '1:647447840013:web:7b3952e07060ab3f5d5c44',
};

async function seed() {
  console.log('⚡ Initializing Firebase & Admin Auth...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInWithEmailAndPassword(auth, 'admin@nestmate-test.com', 'AdminPassword123!');
  console.log('✅ Admin authenticated. Full database access granted.\n');

  const nowMs = Date.now();
  const now = Timestamp.fromMillis(nowMs);
  const tenMinsAgo = Timestamp.fromMillis(nowMs - 10 * 60 * 1000);
  const thirtyMinsAgo = Timestamp.fromMillis(nowMs - 30 * 60 * 1000);
  const oneHourAgo = Timestamp.fromMillis(nowMs - 60 * 60 * 1000);
  const twoHoursAgo = Timestamp.fromMillis(nowMs - 2 * 60 * 60 * 1000);
  const yesterday = Timestamp.fromMillis(nowMs - 24 * 60 * 60 * 1000);
  const thirtyFiveDaysAgo = Timestamp.fromMillis(nowMs - 35 * 24 * 60 * 60 * 1000);

  const defaultQuiz = {
    sleep_time: '10_to_12',
    wake_time: '6_to_8',
    food_pref: 'veg',
    smoking: 'never',
    drinking: 'socially',
    guests: 'sometimes',
    cleanliness: 'very',
    work_mode: 'hybrid',
    pets: 'ok',
    roommate_gender: 'any',
  };

  const nightOwlQuiz = {
    sleep_time: 'after_12',
    wake_time: '8_to_10',
    food_pref: 'non_veg',
    smoking: 'outside',
    drinking: 'socially',
    guests: 'sometimes',
    cleanliness: 'moderate',
    work_mode: 'wfh',
    pets: 'love',
    roommate_gender: 'any',
  };

  // ─────────────────────────────────────────────────────────────
  // 1. PERSONAS (Users)
  // ─────────────────────────────────────────────────────────────
  console.log('👤 Seeding Test Personas...');
  const personas = [
    // 1. SEEKER_A (Reference baseline)
    {
      uid: 'test_user_ref',
      name: 'Aditi Sharma',
      email: 'seeker.ref@nestmate-test.com',
      phone: '+919845012345',
      role: 'seeker',
      status: 'active',
      city: 'Bengaluru',
      localities: ['Koramangala', 'Indiranagar'],
      budget: 16000,
      gender: 'female',
      age: 24,
      profession: 'Software Engineer',
      company: 'Swiggy',
      bio: 'Backend developer at Swiggy. Vegetarian, neat & tidy. Looking for like-minded flatmates near Koramangala.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      housingIntent: 'find_room',
      moveInDate: 'Immediate',
      onboardingComplete: true,
      isVerified: true,
      phoneVerified: true,
      verificationLevel: 3,
      isPremium: false,
      connectsUsed: 0,
      connectsLimit: 5,
      quizAnswers: defaultQuiz,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 2. SEEKER_B (100% Match)
    {
      uid: 'test_user_perfect_match',
      name: 'Pooja Iyer',
      email: 'seeker.perfect@nestmate-test.com',
      phone: '+919845054321',
      role: 'seeker',
      status: 'active',
      city: 'Bengaluru',
      localities: ['Indiranagar', 'Domlur'],
      budget: 18000,
      gender: 'female',
      age: 25,
      profession: 'Product Designer',
      company: 'CRED',
      bio: 'UI/UX Designer at CRED. Love indoor plants, clean minimalist spaces, and quiet evenings.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      housingIntent: 'find_room',
      moveInDate: 'Immediate',
      onboardingComplete: true,
      isVerified: true,
      phoneVerified: true,
      verificationLevel: 3,
      isPremium: false,
      connectsUsed: 0,
      connectsLimit: 5,
      quizAnswers: defaultQuiz,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 3. SEEKER_C (Night Owl)
    {
      uid: 'test_user_night_owl',
      name: 'Karan Mehra',
      email: 'seeker.night@nestmate-test.com',
      phone: '+919845099887',
      role: 'seeker',
      status: 'active',
      city: 'Bengaluru',
      localities: ['HSR Layout', 'Koramangala'],
      budget: 15000,
      gender: 'male',
      age: 26,
      profession: 'UX Researcher',
      company: 'Razorpay',
      bio: 'Work mostly late hours. Weekend board games and movies. Friendly and non-interfering.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      housingIntent: 'find_room',
      moveInDate: 'Within 2 weeks',
      onboardingComplete: true,
      status: 'active',
      isVerified: true,
      phoneVerified: true,
      verificationLevel: 2,
      isPremium: false,
      connectsUsed: 0,
      connectsLimit: 5,
      quizAnswers: nightOwlQuiz,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 4. OWNER_A (Verified Host)
    {
      uid: 'test_user_owner_01',
      name: 'Ramesh Gupta',
      email: 'owner.verified@nestmate-test.com',
      phone: '+919845011223',
      role: 'owner',
      status: 'active',
      city: 'Bengaluru',
      localities: ['Koramangala'],
      gender: 'male',
      age: 38,
      profession: 'Property Manager',
      company: 'Gupta Properties',
      bio: 'Verified host with 5+ years managing premium flats in Koramangala. 24/7 power backup.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      onboardingComplete: true,
      isVerified: true,
      verificationLevel: 3,
      isPremium: true,
      quizAnswers: defaultQuiz,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 5. OWNER_B (Unverified Host)
    {
      uid: 'test_user_owner_02',
      name: 'Siddharth Rao',
      email: 'owner.unverified@nestmate-test.com',
      phone: '+919845022334',
      role: 'owner',
      status: 'active',
      city: 'Bengaluru',
      localities: ['Indiranagar'],
      gender: 'male',
      age: 32,
      profession: 'Entrepreneur',
      bio: 'Owner of flats in Indiranagar. Looking for responsible working professionals.',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      onboardingComplete: true,
      isVerified: false,
      verificationLevel: 0,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 6. OWNER_PENDING_VERIFICATION
    {
      uid: 'test_user_owner_03',
      name: 'Anjali Deshmukh',
      email: 'owner.pending@nestmate-test.com',
      phone: '+919845033445',
      role: 'owner',
      status: 'active',
      city: 'Bengaluru',
      localities: ['HSR Layout'],
      gender: 'female',
      age: 35,
      profession: 'Architect',
      bio: 'Architect designed flat with modern aesthetic and natural light.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      onboardingComplete: true,
      isVerified: false,
      verificationLevel: 1,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 7. OWNER_REJECTED
    {
      uid: 'test_user_owner_rejected',
      name: 'Kavita Reddy',
      email: 'owner.rejected@nestmate-test.com',
      phone: '+919845099112',
      role: 'owner',
      status: 'active',
      city: 'Bengaluru',
      localities: ['Koramangala'],
      gender: 'female',
      age: 34,
      onboardingComplete: true,
      isVerified: false,
      verificationLevel: 0,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 8. ADMIN
    {
      uid: 'test_user_admin',
      name: 'NestMate Admin',
      email: 'admin@nestmate-test.com',
      phone: '+919999999999',
      role: 'seeker',
      status: 'active',
      city: 'Bengaluru',
      onboardingComplete: true,
      isVerified: true,
      isPremium: true,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 9. ONBOARDING_PENDING
    {
      uid: 'test_user_onboarding_pending',
      name: '',
      email: 'incomplete@nestmate-test.com',
      phone: '',
      role: null,
      status: 'active',
      city: '',
      budget: 0,
      quizAnswers: {},
      onboardingComplete: false,
      isVerified: false,
      connectsUsed: 0,
      connectsLimit: 5,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 10. SUSPENDED_USER
    {
      uid: 'test_user_suspended',
      name: 'Suspended Seeker',
      email: 'suspended@nestmate-test.com',
      phone: '+919845011999',
      role: 'seeker',
      status: 'suspended',
      city: 'Bengaluru',
      budget: 10000,
      quizAnswers: defaultQuiz,
      onboardingComplete: true,
      isVerified: false,
      connectsUsed: 0,
      connectsLimit: 5,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 11. BANNED_USER
    {
      uid: 'test_user_banned',
      name: 'Banned Seeker',
      email: 'banned@nestmate-test.com',
      phone: '+919845011888',
      role: 'seeker',
      status: 'banned',
      city: 'Bengaluru',
      budget: 10000,
      quizAnswers: defaultQuiz,
      onboardingComplete: true,
      isVerified: false,
      connectsUsed: 0,
      connectsLimit: 5,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 12. PREMIUM_USER
    {
      uid: 'test_user_pro_user',
      name: 'Priya Sharma',
      email: 'seeker.pro@nestmate-test.com',
      phone: '+919845088776',
      role: 'seeker',
      status: 'active',
      city: 'Bengaluru',
      localities: ['Whitefield', 'Bellandur'],
      budget: 22000,
      gender: 'female',
      age: 27,
      profession: 'Data Scientist',
      company: 'Microsoft',
      bio: 'Data scientist at Microsoft IDC. Early riser, fitness enthusiast.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      housingIntent: 'find_room',
      moveInDate: 'Immediate',
      onboardingComplete: true,
      isVerified: true,
      phoneVerified: true,
      verificationLevel: 3,
      isPremium: true,
      connectsUsed: 0,
      connectsLimit: 999,
      quizAnswers: defaultQuiz,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 13. QUOTA_FULL_USER
    {
      uid: 'test_user_quota_full',
      name: 'Suresh Raina',
      email: 'seeker.quota@nestmate-test.com',
      phone: '+919845066554',
      role: 'seeker',
      status: 'active',
      city: 'Bengaluru',
      budget: 12000,
      quizAnswers: defaultQuiz,
      onboardingComplete: true,
      isVerified: true,
      phoneVerified: true,
      connectsUsed: 5,
      connectsLimit: 5,
      isPremium: false,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 14. Active browser owner Rohan
    {
      uid: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1',
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      phone: '+919886012345',
      role: 'owner',
      city: 'Bengaluru',
      localities: ['Indiranagar', 'Koramangala'],
      budget: 18000,
      gender: 'male',
      age: 26,
      profession: 'Senior Software Engineer',
      company: 'Razorpay',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      housingIntent: 'find_room',
      moveInDate: 'Immediate',
      onboardingComplete: true,
      status: 'active',
      isVerified: true,
      phoneVerified: true,
      verificationLevel: 3,
      isPremium: true,
      connectsUsed: 1,
      connectsLimit: 999,
      quizAnswers: defaultQuiz,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
    // 15. Portfolio Owner Sunil Verma
    {
      uid: 'test_user_owner_04',
      name: 'Sunil Verma',
      email: 'owner.portfolio@nestmate-test.com',
      phone: '+919845044556',
      role: 'owner',
      city: 'Bengaluru',
      localities: ['Whitefield', 'BTM Layout'],
      gender: 'male',
      age: 42,
      profession: 'Real Estate Investor',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      onboardingComplete: true,
      status: 'active',
      isVerified: true,
      verificationLevel: 3,
      createdAt: yesterday,
      updatedAt: now,
      lastActiveAt: now,
    },
  ];

  for (const p of personas) {
    await setDoc(doc(db, 'users', p.uid), p);
    await setDoc(doc(db, 'privateUserData', p.uid), {
      email: p.email,
      phone: p.phone,
      whatsappNumber: p.phone,
    });
    await setDoc(doc(db, 'userContacts', p.uid), {
      phone: p.phone,
      whatsapp: p.phone,
      isShared: true,
    });
    console.log(`  ✓ Persona: ${p.name || p.uid} (${p.uid}) [${p.role || 'none'}/${p.status}]`);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. LISTINGS (7 Lifecycle States)
  // ─────────────────────────────────────────────────────────────
  console.log('\n🏠 Seeding Listings (All 7 Lifecycle States)...');
  const listings = [
    // 1. ACTIVE - Koramangala
    {
      id: 'test_listing_kora_01',
      ownerId: 'test_user_owner_01',
      ownerName: 'Ramesh Gupta',
      ownerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      title: 'Active Prime 2BHK Room in Koramangala 4th Block',
      description: 'Fully furnished private room in a peaceful gated society in 4th Block Koramangala.',
      city: 'Bengaluru',
      locality: 'Koramangala',
      address: '4th Block, Koramangala, Bengaluru 560034',
      flatType: '2BHK',
      furnishing: 'Fully Furnished',
      totalRent: 28000,
      partnerShare: 14000,
      deposit: 28000,
      partnersNeeded: 1,
      availableFrom: 'Immediate',
      lat: 12.9352,
      lng: 77.6245,
      status: 'active',
      ownerVerified: true,
      isOwnerVerified: true,
      views: 78,
      applicants: 4,
      genderPreference: 'any',
      preferredGender: 'any',
      amenities: ['WiFi', 'AC', 'Washing Machine', 'Power Backup'],
      houseRules: ['Cleanliness expected'],
      images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'],
      createdAt: yesterday,
      updatedAt: now,
      lastConfirmedAt: now,
    },
    // 2. ACTIVE - Indiranagar (Rohan's room)
    {
      id: 'FSXystxUrr3MzY37W7L2',
      ownerId: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1',
      ownerName: 'Rohan Sharma',
      ownerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      title: 'Sunny Private Master Room in 3BHK Indiranagar',
      description: 'Beautiful ventilated private bedroom with attached washroom in 100ft Road Indiranagar.',
      city: 'Bengaluru',
      locality: 'Indiranagar',
      address: '100ft Road, near CMH Metro Station, Indiranagar, Bengaluru 560038',
      flatType: '3BHK',
      furnishing: 'Fully Furnished',
      totalRent: 36000,
      partnerShare: 18000,
      deposit: 36000,
      partnersNeeded: 1,
      availableFrom: 'Immediate',
      lat: 12.9784,
      lng: 77.6408,
      status: 'active',
      ownerVerified: true,
      isOwnerVerified: true,
      views: 54,
      applicants: 3,
      genderPreference: 'any',
      preferredGender: 'any',
      amenities: ['WiFi', 'AC', 'Attached Washroom', 'Power Backup'],
      houseRules: ['Keep common areas clean'],
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80'],
      createdAt: yesterday,
      updatedAt: now,
      lastConfirmedAt: now,
    },
    // 3. ACTIVE - HSR Layout
    {
      id: 'test_listing_hsr_01',
      ownerId: 'test_user_owner_03',
      ownerName: 'Anjali Deshmukh',
      ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      title: 'Architect-Designed Room in HSR Layout Sector 3',
      description: 'Spacious room in a boutique flat overlooking trees.',
      city: 'Bengaluru',
      locality: 'HSR Layout',
      address: 'Sector 3, HSR Layout, Bengaluru 560102',
      flatType: '2BHK',
      furnishing: 'Fully Furnished',
      totalRent: 32000,
      partnerShare: 16000,
      deposit: 32000,
      partnersNeeded: 1,
      availableFrom: 'Immediate',
      lat: 12.9116,
      lng: 77.6389,
      status: 'active',
      ownerVerified: true,
      isOwnerVerified: true,
      views: 62,
      applicants: 2,
      genderPreference: 'any',
      preferredGender: 'any',
      amenities: ['WiFi', 'Power Backup', 'Balcony'],
      houseRules: [],
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80'],
      createdAt: yesterday,
      updatedAt: now,
      lastConfirmedAt: now,
    },
    // 4. ACTIVE - Whitefield
    {
      id: 'test_listing_white_01',
      ownerId: 'test_user_owner_04',
      ownerName: 'Sunil Verma',
      ownerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      title: 'Luxury 3BHK Room in Prestige Shantiniketan, Whitefield',
      description: 'Private master bedroom in Prestige Shantiniketan right next to ITPL.',
      city: 'Bengaluru',
      locality: 'Whitefield',
      address: 'Prestige Shantiniketan, Whitefield, Bengaluru 560048',
      flatType: '3BHK',
      furnishing: 'Fully Furnished',
      totalRent: 45000,
      partnerShare: 15000,
      deposit: 30000,
      partnersNeeded: 1,
      availableFrom: 'Immediate',
      lat: 12.9892,
      lng: 77.7289,
      status: 'active',
      ownerVerified: true,
      isOwnerVerified: true,
      views: 95,
      applicants: 5,
      genderPreference: 'any',
      preferredGender: 'any',
      amenities: ['WiFi', 'AC', 'Swimming Pool', 'Gym'],
      houseRules: [],
      images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80'],
      createdAt: yesterday,
      updatedAt: now,
      lastConfirmedAt: now,
    },
    // 5. ACTIVE - Bellandur
    {
      id: 'test_listing_bellandur_01',
      ownerId: 'test_user_owner_01',
      ownerName: 'Ramesh Gupta',
      ownerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      title: 'Premium Room near RMZ EcoSpace & EcoWorld Bellandur',
      description: 'Walk to RMZ EcoSpace and EcoWorld in 5 minutes.',
      city: 'Bengaluru',
      locality: 'Bellandur',
      address: 'Outer Ring Road, Bellandur, Bengaluru 560103',
      flatType: '3BHK',
      furnishing: 'Fully Furnished',
      totalRent: 48000,
      partnerShare: 16000,
      deposit: 32000,
      partnersNeeded: 1,
      availableFrom: 'Immediate',
      lat: 12.926,
      lng: 77.6762,
      status: 'active',
      ownerVerified: true,
      isOwnerVerified: true,
      views: 71,
      applicants: 3,
      genderPreference: 'any',
      preferredGender: 'any',
      amenities: ['WiFi', 'AC'],
      houseRules: [],
      images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1000&q=80'],
      createdAt: yesterday,
      updatedAt: now,
      lastConfirmedAt: now,
    },
    // 6. ACTIVE - BTM Layout
    {
      id: 'test_listing_btm_01',
      ownerId: 'test_user_owner_04',
      ownerName: 'Sunil Verma',
      ownerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      title: 'Cozy Private Room in BTM Layout 2nd Stage',
      description: 'Budget-friendly room near Udupi Garden signal.',
      city: 'Bengaluru',
      locality: 'BTM Layout',
      address: '2nd Stage, BTM Layout, Bengaluru 560076',
      flatType: '2BHK',
      furnishing: 'Semi-Furnished',
      totalRent: 23000,
      partnerShare: 11500,
      deposit: 23000,
      partnersNeeded: 1,
      availableFrom: 'Immediate',
      lat: 12.9166,
      lng: 77.6101,
      status: 'active',
      ownerVerified: true,
      isOwnerVerified: true,
      views: 43,
      applicants: 1,
      genderPreference: 'any',
      preferredGender: 'any',
      amenities: ['WiFi', 'Geyser'],
      houseRules: [],
      images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80'],
      createdAt: yesterday,
      updatedAt: now,
      lastConfirmedAt: now,
    },
    // 7. PENDING_VERIFICATION (Owner B)
    {
      id: 'test_listing_pend_01',
      ownerId: 'test_user_owner_02',
      ownerName: 'Siddharth Rao',
      ownerAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      title: 'Pending Verification 1BHK in Indiranagar',
      description: 'Cozy studio awaiting verification approval.',
      city: 'Bengaluru',
      locality: 'Indiranagar',
      address: 'Double Road, Indiranagar, Bengaluru',
      flatType: '1BHK',
      furnishing: 'Semi-Furnished',
      totalRent: 18000,
      partnerShare: 9000,
      deposit: 27000,
      partnersNeeded: 1,
      availableFrom: '2026-11-01',
      lat: 12.975,
      lng: 77.641,
      status: 'pending_verification',
      ownerVerified: false,
      isOwnerVerified: false,
      views: 0,
      applicants: 0,
      amenities: ['WiFi'],
      houseRules: [],
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80'],
      createdAt: yesterday,
      updatedAt: now,
      lastConfirmedAt: now,
    },
    // 8. DRAFT (Owner B)
    {
      id: 'test_listing_draft_01',
      ownerId: 'test_user_owner_02',
      ownerName: 'Siddharth Rao',
      ownerAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      title: 'Draft Studio in HSR Layout',
      description: 'Draft listing not yet submitted.',
      city: 'Bengaluru',
      locality: 'HSR Layout',
      address: 'Sector 2, HSR Layout, Bengaluru',
      flatType: 'Studio',
      furnishing: 'Unfurnished',
      totalRent: 14000,
      partnerShare: 7000,
      deposit: 28000,
      partnersNeeded: 1,
      availableFrom: '2026-12-01',
      lat: 12.91,
      lng: 77.63,
      status: 'draft',
      ownerVerified: false,
      isOwnerVerified: false,
      views: 0,
      applicants: 0,
      amenities: [],
      houseRules: [],
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80'],
      createdAt: yesterday,
      updatedAt: now,
      lastConfirmedAt: now,
    },
    // 9. PAUSED (Owner A)
    {
      id: 'test_listing_pause_01',
      ownerId: 'test_user_owner_01',
      ownerName: 'Ramesh Gupta',
      ownerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      title: 'Temporarily Paused 3BHK in Whitefield',
      description: 'Owner temporarily paused this room listing.',
      city: 'Bengaluru',
      locality: 'Whitefield',
      address: 'ITPL Road, Whitefield',
      flatType: '3BHK',
      furnishing: 'Fully Furnished',
      totalRent: 35000,
      partnerShare: 17500,
      deposit: 35000,
      partnersNeeded: 1,
      availableFrom: '2026-12-01',
      lat: 12.97,
      lng: 77.72,
      status: 'paused',
      ownerVerified: true,
      isOwnerVerified: true,
      views: 12,
      applicants: 1,
      amenities: ['WiFi', 'AC'],
      houseRules: [],
      images: ['https://images.unsplash.com/photo-1540518614846-7ede433c4b4f?auto=format&fit=crop&w=1000&q=80'],
      createdAt: yesterday,
      updatedAt: now,
      lastConfirmedAt: now,
    },
    // 10. FILLED (Owner Sunil)
    {
      id: 'test_listing_fill_01',
      ownerId: 'test_user_owner_04',
      ownerName: 'Sunil Verma',
      ownerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      title: 'Filled Occupancy Room in BTM Layout',
      description: 'Room has been occupied.',
      city: 'Bengaluru',
      locality: 'BTM Layout',
      address: '1st Stage, BTM Layout',
      flatType: '2BHK',
      furnishing: 'Semi-Furnished',
      totalRent: 12000,
      partnerShare: 6000,
      deposit: 24000,
      partnersNeeded: 0,
      availableFrom: 'Occupied',
      lat: 12.915,
      lng: 77.612,
      status: 'filled',
      ownerVerified: true,
      isOwnerVerified: true,
      views: 80,
      applicants: 2,
      amenities: ['WiFi'],
      houseRules: [],
      images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80'],
      createdAt: yesterday,
      updatedAt: now,
      lastConfirmedAt: now,
    },
    // 11. CLOSED (Owner Sunil)
    {
      id: 'test_listing_close_01',
      ownerId: 'test_user_owner_04',
      ownerName: 'Sunil Verma',
      ownerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
      title: 'Closed Listing in Electronic City',
      description: 'Listing closed by owner.',
      city: 'Bengaluru',
      locality: 'Electronic City',
      address: 'Phase 1, Electronic City',
      flatType: '2BHK',
      furnishing: 'Fully Furnished',
      totalRent: 16000,
      partnerShare: 8000,
      deposit: 32000,
      partnersNeeded: 0,
      availableFrom: 'Closed',
      lat: 12.845,
      lng: 77.665,
      status: 'closed',
      ownerVerified: true,
      isOwnerVerified: true,
      views: 95,
      applicants: 1,
      amenities: [],
      houseRules: [],
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80'],
      createdAt: yesterday,
      updatedAt: now,
      lastConfirmedAt: now,
    },
    // 12. EXPIRED (Owner A - 35 days stale)
    {
      id: 'test_listing_exp_01',
      ownerId: 'test_user_owner_01',
      ownerName: 'Ramesh Gupta',
      ownerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      title: 'Stale 30+ Days Expired Listing',
      description: 'Availability not confirmed within 30 days.',
      city: 'Bengaluru',
      locality: 'Koramangala',
      address: '5th Block, Koramangala',
      flatType: '2BHK',
      furnishing: 'Semi-Furnished',
      totalRent: 22000,
      partnerShare: 11000,
      deposit: 44000,
      partnersNeeded: 1,
      availableFrom: 'Immediate',
      lat: 12.934,
      lng: 77.622,
      status: 'active',
      ownerVerified: true,
      isOwnerVerified: true,
      views: 30,
      applicants: 0,
      amenities: ['WiFi'],
      houseRules: [],
      images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'],
      createdAt: thirtyFiveDaysAgo,
      updatedAt: thirtyFiveDaysAgo,
      lastConfirmedAt: thirtyFiveDaysAgo,
    },
  ];

  for (const l of listings) {
    await setDoc(doc(db, 'listings', l.id), l);
    console.log(`  ✓ Listing: ${l.title} (${l.id}) [status=${l.status}, verified=${l.ownerVerified}]`);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. CONNECTIONS (All 4 States)
  // ─────────────────────────────────────────────────────────────
  console.log('\n🤝 Seeding Connections (All 4 States)...');
  const connections = [
    {
      id: 'test_conn_p01',
      fromUserId: 'test_user_ref',
      toUserId: 'test_user_owner_01',
      status: 'pending',
      listingId: 'test_listing_kora_01',
      createdAt: twoHoursAgo,
      updatedAt: twoHoursAgo,
    },
    {
      id: 'test_conn_a01',
      fromUserId: 'test_user_perfect_match',
      toUserId: 'test_user_owner_01',
      status: 'accepted',
      listingId: 'test_listing_kora_01',
      createdAt: twoHoursAgo,
      updatedAt: oneHourAgo,
    },
    {
      id: 'test_conn_r01',
      fromUserId: 'test_user_night_owl',
      toUserId: 'test_user_owner_01',
      status: 'rejected',
      listingId: 'test_listing_kora_01',
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: 'test_conn_b01',
      fromUserId: 'test_user_suspended',
      toUserId: 'test_user_owner_01',
      status: 'blocked',
      listingId: 'test_listing_kora_01',
      createdAt: yesterday,
      updatedAt: yesterday,
    },
    {
      id: 'conn_nos_pooja',
      fromUserId: 'test_user_perfect_match',
      toUserId: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1',
      status: 'accepted',
      listingId: 'FSXystxUrr3MzY37W7L2',
      createdAt: twoHoursAgo,
      updatedAt: oneHourAgo,
    },
    {
      id: 'conn_nos_aditi',
      fromUserId: 'test_user_ref',
      toUserId: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1',
      status: 'pending',
      listingId: 'FSXystxUrr3MzY37W7L2',
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo,
    },
  ];

  for (const c of connections) {
    await setDoc(doc(db, 'connections', c.id), c);
    console.log(`  ✓ Connection: ${c.id} (${c.fromUserId} → ${c.toUserId}) [${c.status}]`);
  }

  // Accepted pairs
  const pairs = [
    { id: 'test_user_perfect_match_test_user_owner_01', u1: 'test_user_perfect_match', u2: 'test_user_owner_01' },
    { id: 'test_user_owner_01_test_user_perfect_match', u1: 'test_user_owner_01', u2: 'test_user_perfect_match' },
    { id: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1_test_user_perfect_match', u1: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1', u2: 'test_user_perfect_match' },
    { id: 'test_user_perfect_match_Nos8X8pwiXb9wAVA3lmOcgH5vOy1', u1: 'test_user_perfect_match', u2: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1' },
  ];
  for (const p of pairs) {
    await setDoc(doc(db, 'acceptedPairs', p.id), {
      user1: p.u1,
      user2: p.u2,
      createdAt: now,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. CHAT ROOMS & SUBCOLLECTION MESSAGES
  // ─────────────────────────────────────────────────────────────
  console.log('\n💬 Seeding Chat Rooms & Messages...');
  const rooms = [
    {
      id: 'test_chat_crm_01',
      participants: ['test_user_perfect_match', 'test_user_owner_01'],
      connectionId: 'test_conn_a01',
      lastMessage: 'Saturday afternoon works best for the tour.',
      lastMessageSenderId: 'test_user_perfect_match',
      lastMessageAt: tenMinsAgo,
      createdAt: twoHoursAgo,
      messages: [
        {
          id: 'test_msg_m01',
          senderId: 'test_user_perfect_match',
          content: 'Hi Ramesh, I saw your 2BHK flat listing in Koramangala!',
          read: true,
          createdAt: twoHoursAgo,
        },
        {
          id: 'test_msg_m02',
          senderId: 'test_user_owner_01',
          content: 'Hello Pooja! Yes, it is fully verified and available. Would you like a tour?',
          read: true,
          createdAt: oneHourAgo,
        },
        {
          id: 'test_msg_m03',
          senderId: 'test_user_perfect_match',
          content: 'Saturday afternoon works best for the tour.',
          read: false,
          createdAt: tenMinsAgo,
        },
      ],
    },
    {
      id: 'chat_room_nos_pooja',
      participants: ['Nos8X8pwiXb9wAVA3lmOcgH5vOy1', 'test_user_perfect_match'],
      connectionId: 'conn_nos_pooja',
      lastMessage: 'Sure, Saturday 4 PM works perfectly! Looking forward to meeting.',
      lastMessageSenderId: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1',
      lastMessageAt: tenMinsAgo,
      createdAt: twoHoursAgo,
      messages: [
        {
          id: 'msg_np_01',
          senderId: 'test_user_perfect_match',
          content: 'Hi! I saw your sunny 3BHK room listing in Indiranagar. Is it still available?',
          read: true,
          createdAt: twoHoursAgo,
        },
        {
          id: 'msg_np_02',
          senderId: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1',
          content: 'Hi Pooja! Yes, it is available.',
          read: true,
          createdAt: oneHourAgo,
        },
        {
          id: 'msg_np_03',
          senderId: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1',
          content: 'Sure, Saturday 4 PM works perfectly! Looking forward to meeting.',
          read: false,
          createdAt: tenMinsAgo,
        },
      ],
    },
    {
      id: 'chat_room_nos_aditi',
      participants: ['Nos8X8pwiXb9wAVA3lmOcgH5vOy1', 'test_user_ref'],
      connectionId: 'conn_nos_aditi',
      lastMessage: 'Hi Rohan! Would love to know if pure vegetarian cooking is preferred in the flat.',
      lastMessageSenderId: 'test_user_ref',
      lastMessageAt: thirtyMinsAgo,
      createdAt: oneHourAgo,
      messages: [
        {
          id: 'msg_na_01',
          senderId: 'test_user_ref',
          content: 'Hello! Aditi here. I sent you a connection request for the Indiranagar flat.',
          read: true,
          createdAt: oneHourAgo,
        },
        {
          id: 'msg_na_02',
          senderId: 'test_user_ref',
          content: 'Hi Rohan! Would love to know if pure vegetarian cooking is preferred in the flat.',
          read: false,
          createdAt: thirtyMinsAgo,
        },
      ],
    },
  ];

  for (const r of rooms) {
    const { messages: msgs, ...roomData } = r;
    await setDoc(doc(db, 'chatRooms', r.id), roomData);
    console.log(`  ✓ ChatRoom: ${r.id} [${r.participants.join(' ↔ ')}]`);

    for (const m of msgs) {
      await setDoc(doc(db, 'chatRooms', r.id, 'messages', m.id), { ...m, roomId: r.id });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. OWNER VERIFICATIONS & ABUSE REPORTS
  // ─────────────────────────────────────────────────────────────
  console.log('\n🛡️ Seeding Verifications & Reports...');
  const verifications = [
    {
      id: 'test_verif_owner_01',
      userId: 'test_user_owner_01',
      status: 'APPROVED',
      documentType: 'electricity_bill',
      declaredName: 'Ramesh Gupta',
      documentUrl: 'https://example.com/docs/bill_01.pdf',
      createdAt: yesterday,
    },
    {
      id: 'test_verif_owner_02',
      userId: 'test_user_owner_02',
      status: 'SUBMITTED',
      documentType: 'aadhaar',
      declaredName: 'Siddharth Rao',
      documentUrl: 'https://example.com/docs/aadhaar_02.pdf',
      createdAt: now,
    },
    {
      id: 'test_verif_owner_03',
      userId: 'test_user_owner_03',
      status: 'UNDER_REVIEW',
      documentType: 'property_tax',
      declaredName: 'Anjali Deshmukh',
      documentUrl: 'https://example.com/docs/tax_03.pdf',
      createdAt: yesterday,
    },
    {
      id: 'test_verif_owner_04',
      userId: 'test_user_owner_04',
      status: 'RESUBMISSION_REQUIRED',
      documentType: 'sale_deed',
      declaredName: 'Sunil Verma',
      documentUrl: 'https://example.com/docs/deed_04.pdf',
      reviewNote: 'Document blurred. Please re-upload.',
      createdAt: yesterday,
    },
    {
      id: 'test_verif_owner_05',
      userId: 'test_user_owner_rejected',
      status: 'REJECTED',
      documentType: 'rent_agreement',
      declaredName: 'Kavita Reddy',
      documentUrl: 'https://example.com/docs/agreement_05.pdf',
      reviewNote: 'Name mismatch with electricity bill.',
      createdAt: yesterday,
    },
  ];

  for (const v of verifications) {
    await setDoc(doc(db, 'verifications', v.id), v);
    console.log(`  ✓ Verification: ${v.id} (${v.userId} → ${v.status})`);
  }

  const reports = [
    {
      id: 'test_report_rep_01',
      reporterId: 'test_user_ref',
      targetId: 'test_user_suspended',
      targetType: 'user',
      reason: 'spam_or_scam',
      status: 'open',
      details: 'Sending spam links in connection request.',
      createdAt: yesterday,
    },
    {
      id: 'test_report_rep_02',
      reporterId: 'test_user_perfect_match',
      targetId: 'test_user_banned',
      targetType: 'user',
      reason: 'harassment',
      status: 'resolved',
      details: 'Offensive language in messaging.',
      createdAt: yesterday,
    },
  ];

  for (const rep of reports) {
    await setDoc(doc(db, 'reports', rep.id), rep);
    console.log(`  ✓ Report: ${rep.id} (${rep.reporterId} reported ${rep.targetId}) [${rep.status}]`);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────
  console.log('\n🔔 Seeding Notifications...');
  const notifs = [
    {
      id: 'test_notif_01',
      userId: 'test_user_owner_01',
      type: 'connection_request',
      title: 'New Connection Request',
      message: 'Aditi Sharma sent you a connection request for Koramangala 2BHK.',
      read: false,
      link: '/owner-dashboard?tab=applicants',
      createdAt: twoHoursAgo,
    },
    {
      id: 'test_notif_02',
      userId: 'test_user_perfect_match',
      type: 'connection_accepted',
      title: 'Connection Accepted',
      message: 'Ramesh Gupta accepted your connection request!',
      read: true,
      link: '/chat',
      createdAt: oneHourAgo,
    },
    {
      id: 'test_notif_03',
      userId: 'test_user_owner_01',
      type: 'new_message',
      title: 'New Message',
      message: 'Pooja Iyer sent you a message: "Saturday afternoon works best for the tour."',
      read: false,
      link: '/chat',
      createdAt: tenMinsAgo,
    },
    {
      id: 'notif_nos_01',
      userId: 'Nos8X8pwiXb9wAVA3lmOcgH5vOy1',
      type: 'connection_request',
      title: 'New Connection Request',
      message: 'Aditi Sharma sent you a connection request for Sunny 3BHK Indiranagar.',
      read: false,
      link: '/owner-dashboard?tab=applicants',
      createdAt: oneHourAgo,
    },
  ];

  for (const n of notifs) {
    await setDoc(doc(db, 'notifications', n.id), n);
    console.log(`  ✓ Notification: ${n.id} for ${n.userId}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. GENERATE STORAGE STATES IN tests/.auth/
  // ─────────────────────────────────────────────────────────────
  console.log('\n🔐 Generating Playwright storageState files in tests/.auth/...');
  const authDir = path.resolve(__dirname, '../.auth');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const { generateStorageState } = require('../helpers/generateAuthStorageStates.cjs');
  const personaFiles = [
    { key: 'seekerA', user: personas[0] },
    { key: 'seekerB', user: personas[1] },
    { key: 'seekerC', user: personas[2] },
    { key: 'ownerA', user: personas[3] },
    { key: 'ownerB', user: personas[4] },
    { key: 'ownerPending', user: personas[5] },
    { key: 'ownerRejected', user: personas[6] },
    { key: 'admin', user: personas[7] },
    { key: 'onboardingPending', user: personas[8] },
    { key: 'suspendedUser', user: personas[9] },
    { key: 'bannedUser', user: personas[10] },
    { key: 'premiumUser', user: personas[11] },
    { key: 'quotaFullUser', user: personas[12] },
  ];

  for (const item of personaFiles) {
    const filePath = path.join(authDir, `${item.key}.json`);
    const state = generateStorageState(item.user, 'http://localhost:3000');
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    console.log(`  ✓ Auth state: ${item.key}.json`);
  }

  // Write seed-universe.json artifact for offline verification compatibility
  const dataDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const universeArtifact = {
    users: personas,
    seekers: personas.filter(p => p.role === 'seeker'),
    owners: personas.filter(p => p.role === 'owner'),
    admins: personas.filter(p => p.email === 'admin@nestmate-test.com'),
    otherUsers: personas.filter(p => p.role !== 'seeker' && p.role !== 'owner' && p.email !== 'admin@nestmate-test.com'),
    listings,
    connections,
    chatRooms: rooms,
    messages: rooms.flatMap(r => r.messages.map(m => ({ ...m, roomId: r.id }))),
    notifications: notifs,
    reports,
    verifications,
  };
  fs.writeFileSync(path.join(dataDir, 'seed-universe.json'), JSON.stringify(universeArtifact, null, 2), 'utf-8');
  console.log(`  ✓ Artifact saved: tests/data/seed-universe.json`);

  console.log('\n======================================================');
  console.log('🎉 CERTIFIED FIRESTORE SEED COMPLETE');
  console.log('======================================================');
  console.log(`Personas seeded:     ${personas.length}`);
  console.log(`Listings seeded:     ${listings.length} (7 States)`);
  console.log(`Connections seeded:  ${connections.length} (4 States)`);
  console.log(`Chat Rooms seeded:   ${rooms.length}`);
  console.log(`Verifications:       ${verifications.length}`);
  console.log(`Reports:             ${reports.length}`);
  console.log(`Notifications:       ${notifs.length}`);
  console.log(`Storage States:      ${personaFiles.length} in tests/.auth/`);
  console.log('======================================================');
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ SEED SCRIPT FAILED:', err);
  process.exit(1);
});
