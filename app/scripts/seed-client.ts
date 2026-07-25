/**
 * COMPREHENSIVE TEST DATA SEEDER FOR NESTMATE
 * 
 * This script creates:
 * - 5 main test accounts (Seekers + Owners)
 * - 15 background filler users
 * - 10 detailed property listings
 * - 8 matches with various statuses
 * - 4 chat rooms with full message history
 * - 6 connections
 * - 10 notifications
 * 
 * Run this to populate your database for end-to-end testing.
 * 
 * Usage (from app directory):
 *   npx tsx scripts/seed-client.ts
 * 
 * Or run the /seed-data page in the app UI after logging in.
 */

import {
  initializeApp,
  getApps,
} from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  Timestamp,
} from 'firebase/firestore';

// Firebase config - Load from environment
// NOTE: These must be set in your .env file
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateUserIdFromPhone(phone: string): string {
  // Create deterministic UID from phone number
  return 'uid_' + phone.replace(/\D/g, '').slice(-10);
}

function randomDate(daysAgo: number): Timestamp {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0);
  return Timestamp.fromDate(date);
}

function futureDate(daysFromNow: number): Timestamp {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return Timestamp.fromDate(date);
}

function randomQuizAnswers(): number[] {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 4) + 1);
}

// ============================================================================
// MAIN SEEDER
// ============================================================================

async function seedDatabase() {
  const logs: string[] = [];
  const userIds: { [key: string]: string } = {};

  const log = (msg: string) => {
    logs.push(msg);
    console.log(msg);
  };

  try {
    log('🌱 Starting NestMate Database Seed...\n');

    // ========================================================================
    // 1. CREATE MAIN TEST USERS (5 accounts)
    // ========================================================================

    log('📝 CREATING MAIN TEST USERS (5)...');

    const mainUsers = [
      {
        key: 'rahul',
        phone: '+919876543210',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@test.com',
        role: 'seeker',
        age: 24,
        gender: 'Male',
        profession: 'Software Engineer',
        city: 'Chennai',
        locality: 'Adyar',
        budget: 8000,
        bio: 'Software engineer working in Tidel Park. Looking for a clean, quiet place near Adyar.',
        isPremium: false,
        connectsUsed: 2,
        verificationLevel: 1,
      },
      {
        key: 'priya',
        phone: '+919876543211',
        name: 'Priya Patel',
        email: 'priya.patel@test.com',
        role: 'owner',
        age: 26,
        gender: 'Female',
        profession: 'Data Analyst',
        city: 'Chennai',
        locality: 'Velachery',
        budget: 12000,
        bio: 'Working professional with a 2BHK in Velachery. Looking for a responsible roommate.',
        isPremium: true,
        connectsUsed: 0,
        verificationLevel: 2,
      },
      {
        key: 'amit',
        phone: '+919876543212',
        name: 'Amit Kumar',
        email: 'amit.kumar@test.com',
        role: 'seeker',
        age: 27,
        gender: 'Male',
        profession: 'Doctor',
        city: 'Chennai',
        locality: 'Anna Nagar',
        budget: 10000,
        bio: 'Doctor at Apollo Hospital. Looking for a peaceful place to stay.',
        isPremium: false,
        connectsUsed: 0,
        verificationLevel: 1,
      },
      {
        key: 'sneha',
        phone: '+919876543213',
        name: 'Sneha Reddy',
        email: 'sneha.reddy@test.com',
        role: 'owner',
        age: 25,
        gender: 'Female',
        profession: 'Architect',
        city: 'Chennai',
        locality: 'T. Nagar',
        budget: 8500,
        bio: 'Architect looking for a co-tenant for my 1BHK flat.',
        isPremium: false,
        connectsUsed: 3,
        verificationLevel: 1,
      },
      {
        key: 'vikram',
        phone: '+919876543214',
        name: 'Vikram Iyer',
        email: 'vikram.iyer@test.com',
        role: 'seeker',
        age: 28,
        gender: 'Male',
        profession: 'Consultant',
        city: 'Chennai',
        locality: 'Mylapore',
        budget: 15000,
        bio: 'Senior consultant at a leading firm. Seeking premium accommodation.',
        isPremium: true,
        connectsUsed: 10,
        verificationLevel: 3,
      },
    ];

    for (const user of mainUsers) {
      const uid = generateUserIdFromPhone(user.phone);
      userIds[user.key] = uid;

      const userData: any = {
        uid,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        gender: user.gender,
        profession: user.profession,
        city: user.city,
        localities: [user.locality],
        budget: user.budget,
        moveInDate: '2026-06-01',
        company: user.profession === 'Software Engineer' ? 'Tech Corp' : 'Company',
        avatar: `https://i.pravatar.cc/150?u=${uid}`,
        bio: user.bio,
        quizAnswers: randomQuizAnswers().reduce((acc, val, idx) => {
          acc[`q${idx + 1}`] = val;
          return acc;
        }, {} as Record<string, number>),
        onboardingComplete: true,
        isPremium: user.isPremium,
        connectsUsed: user.connectsUsed,
        connectsLimit: user.isPremium ? 50 : 5,
        verificationLevel: user.verificationLevel,
        isTestData: true,
        createdAt: randomDate(60),
        updatedAt: randomDate(30),
      };

      await setDoc(doc(db, 'users', uid), userData);
      log(`  ✓ Created ${user.role} "${user.name}" (${uid})`);
    }

    log('');

    // ========================================================================
    // 2. CREATE BACKGROUND FILLER USERS (15 users)
    // ========================================================================

    log('📝 CREATING BACKGROUND FILLER USERS (15)...');

    const backgroundSeekers = [
      { name: 'Test Arun', age: 22, profession: 'Student', locality: 'Adyar', budget: 6000 },
      { name: 'Test Divya', age: 25, profession: 'Designer', locality: 'Velachery', budget: 10000 },
      { name: 'Test Karthik', age: 27, profession: 'Teacher', locality: 'Anna Nagar', budget: 8000 },
      { name: 'Test Neha', age: 24, profession: 'HR', locality: 'T. Nagar', budget: 9000 },
      { name: 'Test Rajesh', age: 29, profession: 'Banker', locality: 'Mylapore', budget: 12000 },
      { name: 'Test Swati', age: 26, profession: 'Journalist', locality: 'Besant Nagar', budget: 11000 },
      { name: 'Test Manoj', age: 23, profession: 'Intern', locality: 'Guindy', budget: 5000 },
      { name: 'Test Ananya', age: 28, profession: 'Lawyer', locality: 'Nungambakkam', budget: 14000 },
    ];

    const backgroundOwners = [
      { name: 'Test Suresh', age: 30, profession: 'Engineer', locality: 'Adyar' },
      { name: 'Test Kavita', age: 32, profession: 'Doctor', locality: 'Velachery' },
      { name: 'Test Rohan', age: 26, profession: 'Startup Founder', locality: 'T. Nagar' },
      { name: 'Test Pooja', age: 29, profession: 'CA', locality: 'Anna Nagar' },
      { name: 'Test Deepak', age: 31, profession: 'Manager', locality: 'Mylapore' },
      { name: 'Test Ritu', age: 27, profession: 'Architect', locality: 'Besant Nagar' },
      { name: 'Test Gaurav', age: 33, profession: 'Consultant', locality: 'Alwarpet' },
    ];

    let bgIndex = 1;

    for (const user of backgroundSeekers) {
      const uid = `bg_seeker_${bgIndex}`;
      userIds[`bg_seeker_${bgIndex}`] = uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        phone: `+919999${String(bgIndex).padStart(6, '0')}`,
        name: user.name,
        email: user.name.toLowerCase().replace(' ', '.') + '@test.com',
        role: 'seeker',
        age: user.age,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        profession: user.profession,
        city: 'Chennai',
        localities: [user.locality],
        budget: user.budget,
        moveInDate: '2026-06-01',
        company: user.profession,
        avatar: `https://i.pravatar.cc/150?u=${uid}`,
        bio: `Looking for accommodation in ${user.locality}`,
        quizAnswers: randomQuizAnswers().reduce((acc, val, idx) => {
          acc[`q${idx + 1}`] = val;
          return acc;
        }, {} as Record<string, number>),
        onboardingComplete: true,
        isPremium: false,
        connectsUsed: Math.floor(Math.random() * 3),
        connectsLimit: 5,
        verificationLevel: 1,
        isTestData: true,
        createdAt: randomDate(60),
        updatedAt: randomDate(30),
      });

      log(`  ✓ Created background seeker "${user.name}"`);
      bgIndex++;
    }

    bgIndex = 1;

    for (const user of backgroundOwners) {
      const uid = `bg_owner_${bgIndex}`;
      userIds[`bg_owner_${bgIndex}`] = uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        phone: `+918888${String(bgIndex).padStart(6, '0')}`,
        name: user.name,
        email: user.name.toLowerCase().replace(' ', '.') + '@test.com',
        role: 'owner',
        age: user.age,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        profession: user.profession,
        city: 'Chennai',
        localities: [user.locality],
        budget: 15000,
        moveInDate: '',
        company: user.profession,
        avatar: `https://i.pravatar.cc/150?u=${uid}`,
        bio: `Property owner in ${user.locality}`,
        quizAnswers: randomQuizAnswers().reduce((acc, val, idx) => {
          acc[`q${idx + 1}`] = val;
          return acc;
        }, {} as Record<string, number>),
        onboardingComplete: true,
        isPremium: false,
        connectsUsed: Math.floor(Math.random() * 5),
        connectsLimit: 5,
        verificationLevel: 1,
        isTestData: true,
        createdAt: randomDate(60),
        updatedAt: randomDate(30),
      });

      log(`  ✓ Created background owner "${user.name}"`);
      bgIndex++;
    }

    log('');

    // ========================================================================
    // 3. CREATE LISTINGS (10 detailed listings)
    // ========================================================================

    log('🏠 CREATING LISTINGS (10)...');

    const listings = [
      {
        ownerId: userIds['priya'],
        title: '2BHK Fully Furnished in Velachery Near Phoenix Mall',
        description: 'Spacious 2BHK apartment with modern furnishings. 5 minutes walk from Phoenix Marketcity. Gated community with 24/7 security. Ideal for working professionals.',
        locality: 'Velachery',
        address: '45, 2nd Main Road, Velachery, Chennai - 600042',
        price: 12000,
        deposit: 24000,
        maintenance: 1500,
        availableFrom: futureDate(35),
        amenities: ['WiFi', 'AC', 'Parking', 'TV', 'Geyser', 'Fridge', 'Washing Machine', 'Power Backup', 'Security', 'Gym'],
        images: ['https://picsum.photos/400/300?random=1', 'https://picsum.photos/400/300?random=2', 'https://picsum.photos/400/300?random=3'],
        rules: { smoking: false, drinking: false, pets: false, vegetarian: false, guests: true },
        lat: 12.9815,
        lng: 80.218,
        status: 'active',
        views: 45,
      },
      {
        ownerId: userIds['sneha'],
        title: 'Cozy 1BHK in T. Nagar Near Pondy Bazaar',
        description: 'Well-maintained 1BHK in the heart of T. Nagar. Close to shopping, restaurants, and public transport. Perfect for students or young professionals.',
        locality: 'T. Nagar',
        address: '12, Burkit Road, T. Nagar, Chennai - 600017',
        price: 8500,
        deposit: 17000,
        maintenance: 800,
        availableFrom: futureDate(18),
        amenities: ['WiFi', 'AC', 'TV', 'Fridge', 'Washing Machine'],
        images: ['https://picsum.photos/400/300?random=4', 'https://picsum.photos/400/300?random=5'],
        rules: { smoking: false, drinking: true, pets: false, vegetarian: true, guests: true },
        lat: 13.0418,
        lng: 80.2341,
        status: 'active',
        views: 32,
      },
      {
        ownerId: userIds['bg_owner_1'],
        title: 'Shared Room in Adyar Near IIT Madras',
        description: 'Looking for a roommate to share a 2BHK near IIT Madras. Fully furnished with study table and wardrobe. Ideal for students or researchers.',
        locality: 'Adyar',
        address: 'IIT Madras Campus Road, Adyar, Chennai - 600036',
        price: 6000,
        deposit: 12000,
        maintenance: 500,
        availableFrom: futureDate(25),
        amenities: ['WiFi', 'AC', 'Parking', 'TV', 'Geyser'],
        images: ['https://picsum.photos/400/300?random=6'],
        rules: { smoking: false, drinking: false, pets: false, vegetarian: false, guests: true },
        lat: 12.9893,
        lng: 80.2344,
        status: 'active',
        views: 28,
      },
      {
        ownerId: userIds['bg_owner_2'],
        title: 'Premium 3BHK in Besant Nagar with Sea View',
        description: 'Luxurious 3BHK apartment with partial sea view. High-end furnishings, modular kitchen, and balcony. Looking for working professionals.',
        locality: 'Besant Nagar',
        address: '78, East Coast Road, Besant Nagar, Chennai - 600090',
        price: 25000,
        deposit: 50000,
        maintenance: 2500,
        availableFrom: futureDate(45),
        amenities: ['WiFi', 'AC', 'Parking', 'TV', 'Geyser', 'Fridge', 'Washing Machine', 'Microwave', 'Power Backup', 'Security', 'Gym', 'Lift', 'Furnished', 'Balcony'],
        images: ['https://picsum.photos/400/300?random=7', 'https://picsum.photos/400/300?random=8', 'https://picsum.photos/400/300?random=9', 'https://picsum.photos/400/300?random=10'],
        rules: { smoking: false, drinking: true, pets: false, vegetarian: false, guests: true },
        lat: 12.9854,
        lng: 80.2695,
        status: 'active',
        views: 67,
      },
      {
        ownerId: userIds['bg_owner_3'],
        title: 'PG for Women in Anna Nagar with Food',
        description: 'Safe and comfortable PG accommodation for women. Includes breakfast and dinner. 24/7 warden, CCTV security, and power backup.',
        locality: 'Anna Nagar',
        address: '55, 5th Avenue, Anna Nagar, Chennai - 600040',
        price: 9000,
        deposit: 18000,
        maintenance: 0,
        availableFrom: futureDate(30),
        amenities: ['WiFi', 'AC', 'TV', 'Geyser', 'Fridge', 'Washing Machine', 'Power Backup', 'Security', 'Furnished'],
        images: ['https://picsum.photos/400/300?random=11'],
        rules: { smoking: false, drinking: false, pets: false, vegetarian: true, guests: false },
        lat: 13.0857,
        lng: 80.2091,
        status: 'active',
        views: 41,
      },
      {
        ownerId: userIds['bg_owner_4'],
        title: '1BHK Independent House in Mylapore',
        description: 'Traditional Chennai house with modern amenities. Quiet neighborhood, close to Kapaleeshwarar Temple and Mylapore tank.',
        locality: 'Mylapore',
        address: '101, Mylapore East Street, Mylapore, Chennai - 600004',
        price: 10000,
        deposit: 20000,
        maintenance: 1000,
        availableFrom: futureDate(30),
        amenities: ['WiFi', 'AC', 'Parking', 'TV', 'Geyser', 'Fridge'],
        images: ['https://picsum.photos/400/300?random=12', 'https://picsum.photos/400/300?random=13'],
        rules: { smoking: false, drinking: false, pets: true, vegetarian: false, guests: true },
        lat: 13.0348,
        lng: 80.2706,
        status: 'paused',
        views: 15,
      },
      {
        ownerId: userIds['bg_owner_5'],
        title: '2BHK in Nungambakkam Near US Consulate',
        description: 'Modern 2BHK in premium location. Close to US Consulate, Taj Coromandel, and major offices. Fully furnished with high-speed internet.',
        locality: 'Nungambakkam',
        address: '42, Nungambakkam High Road, Chennai - 600034',
        price: 18000,
        deposit: 36000,
        maintenance: 2000,
        availableFrom: futureDate(40),
        amenities: ['WiFi', 'AC', 'Parking', 'TV', 'Geyser', 'Fridge', 'Washing Machine', 'Microwave', 'Power Backup', 'Security', 'Gym', 'Lift', 'Furnished'],
        images: ['https://picsum.photos/400/300?random=14', 'https://picsum.photos/400/300?random=15'],
        rules: { smoking: false, drinking: true, pets: false, vegetarian: false, guests: true },
        lat: 13.0603,
        lng: 80.2414,
        status: 'active',
        views: 53,
      },
      {
        ownerId: userIds['bg_owner_6'],
        title: 'Shared Accommodation in Guindy Near IITM Research Park',
        description: 'Looking for roommate to share 2BHK near IIT Madras Research Park. Ideal for students, interns, or research scholars.',
        locality: 'Guindy',
        address: 'Dr. M.G.R. Race Course Road, Guindy, Chennai - 600025',
        price: 7000,
        deposit: 14000,
        maintenance: 600,
        availableFrom: futureDate(28),
        amenities: ['WiFi', 'AC', 'Parking', 'TV', 'Geyser', 'Fridge'],
        images: ['https://picsum.photos/400/300?random=16'],
        rules: { smoking: false, drinking: false, pets: false, vegetarian: false, guests: true },
        lat: 13.0001,
        lng: 80.2293,
        status: 'active',
        views: 22,
      },
      {
        ownerId: userIds['bg_owner_7'],
        title: 'Budget PG in Tambaram for Students',
        description: 'Affordable PG accommodation near Tambaram railway station. Easy connectivity to Chennai city. Shared rooms available.',
        locality: 'Tambaram',
        address: 'Central Road, Tambaram, Chennai - 600045',
        price: 5000,
        deposit: 10000,
        maintenance: 0,
        availableFrom: futureDate(22),
        amenities: ['WiFi', 'TV', 'Geyser', 'Power Backup'],
        images: ['https://picsum.photos/400/300?random=17'],
        rules: { smoking: false, drinking: false, pets: false, vegetarian: true, guests: false },
        lat: 12.9252,
        lng: 80.1386,
        status: 'active',
        views: 18,
      },
      {
        ownerId: userIds['bg_owner_2'],
        title: 'Luxury 2BHK in Alwarpet with Modular Kitchen',
        description: 'Newly renovated 2BHK with Italian marble flooring, modular kitchen, and designer furniture. Looking for premium roommate.',
        locality: 'Alwarpet',
        address: '99, Alwarpet Avenue, Alwarpet, Chennai - 600018',
        price: 22000,
        deposit: 44000,
        maintenance: 2500,
        availableFrom: futureDate(38),
        amenities: ['WiFi', 'AC', 'Parking', 'TV', 'Geyser', 'Fridge', 'Washing Machine', 'Microwave', 'Power Backup', 'Security', 'Gym', 'Lift', 'Furnished', 'Balcony'],
        images: ['https://picsum.photos/400/300?random=18', 'https://picsum.photos/400/300?random=19', 'https://picsum.photos/400/300?random=20'],
        rules: { smoking: false, drinking: true, pets: false, vegetarian: false, guests: true },
        lat: 13.0354,
        lng: 80.2476,
        status: 'active',
        views: 38,
      },
    ];

    const listingIds: string[] = [];

    for (let i = 0; i < listings.length; i++) {
      const listingRef = await addDoc(collection(db, 'listings'), {
        ...listings[i],
        isTestData: true,
        createdAt: randomDate(45),
        updatedAt: randomDate(20),
      });
      listingIds.push(listingRef.id);
      log(`  ✓ Created listing "${listings[i].title}"`);
    }

    log('');

    // ========================================================================
    // 4. CREATE MATCHES (8 matches with different statuses)
    // ========================================================================

    log('⚡ CREATING MATCHES (8)...');

    const matches = [
      {
        userId: userIds['rahul'],
        matchedUserId: userIds['priya'],
        compatibilityScore: 94,
        status: 'accepted',
        createdAt: randomDate(7),
      },
      {
        userId: userIds['rahul'],
        matchedUserId: userIds['sneha'],
        compatibilityScore: 78,
        status: 'pending',
        createdAt: randomDate(5),
      },
      {
        userId: userIds['amit'],
        matchedUserId: userIds['priya'],
        compatibilityScore: 87,
        status: 'accepted',
        createdAt: randomDate(9),
      },
      {
        userId: userIds['vikram'],
        matchedUserId: userIds['sneha'],
        compatibilityScore: 91,
        status: 'pending',
        createdAt: randomDate(4),
      },
      {
        userId: userIds['rahul'],
        matchedUserId: userIds['bg_owner_1'],
        compatibilityScore: 65,
        status: 'rejected',
        createdAt: randomDate(12),
      },
      {
        userId: userIds['amit'],
        matchedUserId: userIds['bg_owner_2'],
        compatibilityScore: 82,
        status: 'accepted',
        createdAt: randomDate(8),
      },
      {
        userId: userIds['vikram'],
        matchedUserId: userIds['bg_owner_3'],
        compatibilityScore: 73,
        status: 'pending',
        createdAt: randomDate(6),
      },
      {
        userId: userIds['bg_seeker_1'],
        matchedUserId: userIds['priya'],
        compatibilityScore: 88,
        status: 'accepted',
        createdAt: randomDate(10),
      },
    ];

    const matchIds: string[] = [];

    for (let i = 0; i < matches.length; i++) {
      const matchRef = await addDoc(collection(db, 'matches'), {
        ...matches[i],
        isTestData: true,
        updatedAt: randomDate(15),
      });
      matchIds.push(matchRef.id);
      log(`  ✓ Created match ${i + 1}: ${matches[i].userId.slice(0, 8)}... ↔ ${matches[i].matchedUserId.slice(0, 8)}... (${matches[i].status})`);
    }

    log('');

    // ========================================================================
    // 5. CREATE CHAT ROOMS (4 chat rooms)
    // ========================================================================

    log('💬 CREATING CHAT ROOMS (4)...');

    const chatRooms = [
      {
        matchId: matchIds[0],
        participants: [userIds['rahul'], userIds['priya']],
        lastMessage: 'Perfect! See you Saturday at 11 AM.',
        lastMessageAt: Timestamp.fromDate(new Date('2026-04-26 18:30')),
        lastMessageSenderId: userIds['priya'],
      },
      {
        matchId: matchIds[2],
        participants: [userIds['amit'], userIds['priya']],
        lastMessage: 'Thanks for letting me know. Good luck!',
        lastMessageAt: Timestamp.fromDate(new Date('2026-04-19 14:00')),
        lastMessageSenderId: userIds['priya'],
      },
      {
        matchId: matchIds[1],
        participants: [userIds['rahul'], userIds['sneha']],
        lastMessage: '',
        lastMessageAt: null,
        lastMessageSenderId: null,
      },
      {
        matchId: matchIds[3],
        participants: [userIds['vikram'], userIds['sneha']],
        lastMessage: 'Is the rent negotiable for long term?',
        lastMessageAt: Timestamp.fromDate(new Date('2026-04-23 16:45')),
        lastMessageSenderId: userIds['vikram'],
      },
    ];

    const chatRoomIds: string[] = [];

    for (let i = 0; i < chatRooms.length; i++) {
      const chatRef = await addDoc(collection(db, 'chatRooms'), {
        ...chatRooms[i],
        isTestData: true,
        createdAt: randomDate(7),
      });
      chatRoomIds.push(chatRef.id);
      log(`  ✓ Created chat room ${i + 1}`);
    }

    log('');

    // ========================================================================
    // 6. CREATE MESSAGES (15 total messages across chat rooms)
    // ========================================================================

    log('📨 CREATING MESSAGES (15)...');

    const messages = [
      // Chat Room 1: Rahul ↔ Priya
      {
        chatRoomId: chatRoomIds[0],
        senderId: userIds['rahul'],
        senderName: 'Rahul Sharma',
        text: 'Hi Priya, I saw your listing in Velachery. Is it still available?',
        read: true,
        createdAt: Timestamp.fromDate(new Date('2026-04-20 10:00')),
      },
      {
        chatRoomId: chatRoomIds[0],
        senderId: userIds['priya'],
        senderName: 'Priya Patel',
        text: "Yes Rahul! It's available from June 1st.",
        read: true,
        createdAt: Timestamp.fromDate(new Date('2026-04-20 10:05')),
      },
      {
        chatRoomId: chatRoomIds[0],
        senderId: userIds['rahul'],
        senderName: 'Rahul Sharma',
        text: "Great, I'm looking for something from June only. Can I visit this weekend?",
        read: true,
        createdAt: Timestamp.fromDate(new Date('2026-04-20 10:10')),
      },
      {
        chatRoomId: chatRoomIds[0],
        senderId: userIds['priya'],
        senderName: 'Priya Patel',
        text: 'Sure, Saturday or Sunday works for me. What time?',
        read: true,
        createdAt: Timestamp.fromDate(new Date('2026-04-20 10:15')),
      },
      {
        chatRoomId: chatRoomIds[0],
        senderId: userIds['rahul'],
        senderName: 'Rahul Sharma',
        text: 'Saturday 11 AM?',
        read: true,
        createdAt: Timestamp.fromDate(new Date('2026-04-20 10:20')),
      },
      {
        chatRoomId: chatRoomIds[0],
        senderId: userIds['priya'],
        senderName: 'Priya Patel',
        text: 'Perfect! See you Saturday at 11 AM.',
        read: false,
        createdAt: Timestamp.fromDate(new Date('2026-04-26 18:30')),
      },
      // Chat Room 2: Amit ↔ Priya
      {
        chatRoomId: chatRoomIds[1],
        senderId: userIds['amit'],
        senderName: 'Amit Kumar',
        text: 'Hello, is your 1BHK in T. Nagar still available?',
        read: true,
        createdAt: Timestamp.fromDate(new Date('2026-04-18 09:00')),
      },
      {
        chatRoomId: chatRoomIds[1],
        senderId: userIds['priya'],
        senderName: 'Priya Patel',
        text: 'Sorry Amit, I think you messaged the wrong person. My listing is in Velachery.',
        read: true,
        createdAt: Timestamp.fromDate(new Date('2026-04-18 09:30')),
      },
      {
        chatRoomId: chatRoomIds[1],
        senderId: userIds['amit'],
        senderName: 'Amit Kumar',
        text: 'Oh my bad! Let me check again.',
        read: true,
        createdAt: Timestamp.fromDate(new Date('2026-04-18 10:00')),
      },
      {
        chatRoomId: chatRoomIds[1],
        senderId: userIds['priya'],
        senderName: 'Priya Patel',
        text: 'No problem! Good luck with your search.',
        read: true,
        createdAt: Timestamp.fromDate(new Date('2026-04-19 14:00')),
      },
      // Chat Room 4: Vikram ↔ Sneha
      {
        chatRoomId: chatRoomIds[3],
        senderId: userIds['vikram'],
        senderName: 'Vikram Iyer',
        text: "Hi, I'm interested in your T. Nagar listing.",
        read: true,
        createdAt: Timestamp.fromDate(new Date('2026-04-23 16:30')),
      },
      {
        chatRoomId: chatRoomIds[3],
        senderId: userIds['sneha'],
        senderName: 'Sneha Reddy',
        text: 'Hi Vikram! Yes, it\'s available.',
        read: true,
        createdAt: Timestamp.fromDate(new Date('2026-04-23 16:35')),
      },
      {
        chatRoomId: chatRoomIds[3],
        senderId: userIds['vikram'],
        senderName: 'Vikram Iyer',
        text: 'Is the rent negotiable for long term?',
        read: false,
        createdAt: Timestamp.fromDate(new Date('2026-04-23 16:45')),
      },
    ];

    let messageCount = 0;
    for (const msg of messages) {
      await addDoc(collection(db, 'messages'), {
        ...msg,
        isTestData: true,
      });
      messageCount++;
    }

    log(`  ✓ Created ${messageCount} messages across chat rooms`);
    log('');

    // ========================================================================
    // 7. CREATE CONNECTIONS (6 connections)
    // ========================================================================

    log('🔗 CREATING CONNECTIONS (6)...');

    const connections = [
      {
        fromUserId: userIds['rahul'],
        toUserId: userIds['priya'],
        status: 'accepted',
        createdAt: randomDate(7),
      },
      {
        fromUserId: userIds['amit'],
        toUserId: userIds['priya'],
        status: 'accepted',
        createdAt: randomDate(9),
      },
      {
        fromUserId: userIds['rahul'],
        toUserId: userIds['sneha'],
        status: 'pending',
        createdAt: randomDate(5),
      },
      {
        fromUserId: userIds['vikram'],
        toUserId: userIds['sneha'],
        status: 'pending',
        createdAt: randomDate(4),
      },
      {
        fromUserId: userIds['bg_seeker_2'],
        toUserId: userIds['priya'],
        status: 'rejected',
        createdAt: randomDate(12),
      },
      {
        fromUserId: userIds['bg_seeker_3'],
        toUserId: userIds['sneha'],
        status: 'accepted',
        createdAt: randomDate(10),
      },
    ];

    for (let i = 0; i < connections.length; i++) {
      await addDoc(collection(db, 'connections'), {
        ...connections[i],
        isTestData: true,
      });
      log(`  ✓ Created connection ${i + 1}: ${connections[i].fromUserId.slice(0, 8)}... → ${connections[i].toUserId.slice(0, 8)}... (${connections[i].status})`);
    }

    log('');

    // ========================================================================
    // 8. CREATE NOTIFICATIONS (10 notifications)
    // ========================================================================

    log('🔔 CREATING NOTIFICATIONS (10)...');

    const notifications = [
      {
        userId: userIds['rahul'],
        type: 'new_match',
        title: 'New Match!',
        body: `You matched with Priya (94% compatibility)`,
        read: false,
        createdAt: randomDate(7),
      },
      {
        userId: userIds['priya'],
        type: 'new_match',
        title: 'New Match!',
        body: `You matched with Rahul (94% compatibility)`,
        read: true,
        createdAt: randomDate(7),
      },
      {
        userId: userIds['amit'],
        type: 'new_match',
        title: 'New Match!',
        body: `You matched with Priya (87% compatibility)`,
        read: true,
        createdAt: randomDate(9),
      },
      {
        userId: userIds['rahul'],
        type: 'new_message',
        title: 'New Message',
        body: `Priya: Perfect! See you Saturday at 11 AM.`,
        read: false,
        createdAt: randomDate(1),
      },
      {
        userId: userIds['priya'],
        type: 'new_message',
        title: 'New Message',
        body: `Rahul: Saturday 11 AM?`,
        read: true,
        createdAt: randomDate(7),
      },
      {
        userId: userIds['vikram'],
        type: 'request_received',
        title: 'Connection Request',
        body: `Sneha wants to connect with you`,
        read: false,
        createdAt: randomDate(4),
      },
      {
        userId: userIds['sneha'],
        type: 'request_received',
        title: 'Connection Request',
        body: `Vikram wants to connect with you`,
        read: true,
        createdAt: randomDate(4),
      },
      {
        userId: userIds['rahul'],
        type: 'request_accepted',
        title: 'Request Accepted',
        body: `Priya accepted your connection request`,
        read: true,
        createdAt: randomDate(7),
      },
      {
        userId: userIds['amit'],
        type: 'listing_view',
        title: 'Profile Viewed',
        body: `Someone viewed your profile`,
        read: false,
        createdAt: randomDate(3),
      },
      {
        userId: userIds['priya'],
        type: 'premium_reminder',
        title: 'Go Premium',
        body: `Upgrade to connect with more roommates`,
        read: true,
        createdAt: randomDate(2),
      },
    ];

    for (let i = 0; i < notifications.length; i++) {
      await addDoc(collection(db, 'notifications'), {
        ...notifications[i],
        isTestData: true,
      });
      log(`  ✓ Created notification ${i + 1}: ${notifications[i].type} ("${notifications[i].title}")`);
    }

    log('');

    // ========================================================================
    // SUMMARY
    // ========================================================================

    log('═'.repeat(70));
    log('✅ DATABASE SEED COMPLETE!');
    log('═'.repeat(70));
    log('');
    log('📊 SUMMARY:');
    log(`   • Main test users: 5`);
    log(`   • Background filler users: 15`);
    log(`   • Total users: 20`);
    log(`   • Listings: 10`);
    log(`   • Matches: 8`);
    log(`   • Chat rooms: 4`);
    log(`   • Messages: ${messages.length}`);
    log(`   • Connections: 6`);
    log(`   • Notifications: 10`);
    log('');
    log('🔑 TEST ACCOUNT CREDENTIALS:');
    log('');
    log('   SEEKER (Main):');
    log('   • Phone: +919876543210');
    log('   • Name: Rahul Sharma');
    log('   • Email: rahul.sharma@test.com');
    log('');
    log('   OWNER (Main):');
    log('   • Phone: +919876543211');
    log('   • Name: Priya Patel');
    log('   • Email: priya.patel@test.com');
    log('');
    log('   SEEKER (Alternative):');
    log('   • Phone: +919876543212');
    log('   • Name: Amit Kumar');
    log('   • Email: amit.kumar@test.com');
    log('');
    log('   OWNER (Alternative):');
    log('   • Phone: +919876543213');
    log('   • Name: Sneha Reddy');
    log('   • Email: sneha.reddy@test.com');
    log('');
    log('   SEEKER (Premium):');
    log('   • Phone: +919876543214');
    log('   • Name: Vikram Iyer');
    log('   • Email: vikram.iyer@test.com');
    log('');
    log('📝 All test data has been tagged with isTestData: true');
    log('   You can easily delete it by running a cleanup script later.');
    log('');
    log('🚀 Ready to test! Start with these flows:');
    log('   1. Login as Rahul → Browse rooms → Message Priya');
    log('   2. Login as Priya → View matches → Check chat history');
    log('   3. Login as Amit → View recommendations → Send connection request');
    log('');
    log('═'.repeat(70));

    return logs;
  } catch (error: any) {
    const errorMsg = `❌ SEEDING FAILED: ${error.message}`;
    log(errorMsg);
    console.error(error);
    return logs;
  }
}

// ============================================================================
// RUN SEEDER
// ============================================================================

seedDatabase().then((logs) => {
  console.log('\n\n=== FINAL LOG OUTPUT ===\n');
  logs.forEach((log) => console.log(log));
});

export default seedDatabase;
