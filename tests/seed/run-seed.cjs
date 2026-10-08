/**
 * CLI Runner for Test Universe Seed
 * Usage: node tests/seed/run-seed.cjs
 */
const fs = require('fs');
const path = require('path');
const { assertTestEnvironment } = require('../helpers/environmentGuard.cjs');
const { generateAllAuthStates } = require('../helpers/generateAuthStorageStates.cjs');

// Enforce production safety check first
const envCheck = assertTestEnvironment('test:seed');

const defaultQuiz = {
  sleep_time: 'before_10',
  wake_time: '6_to_8',
  food_pref: 'veg',
  smoking: 'never',
  drinking: 'never',
  guests: 'rarely',
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
  drinking: 'occasionally',
  guests: 'sometimes',
  cleanliness: 'somewhat',
  work_mode: 'wfh',
  pets: 'love',
  roommate_gender: 'any',
};

const seekers = [
  { uid: 'test_user_ref', name: 'Aditi Sharma (Reference)', email: 'seeker.ref@nestmate-test.com', role: 'seeker', status: 'active', city: 'Bengaluru', budget: 15000, quizAnswers: defaultQuiz, onboardingComplete: true, isVerified: true, phoneVerified: true, connectsUsed: 0, connectsLimit: 5, isTest: true },
  { uid: 'test_user_perfect_match', name: 'Pooja Iyer (100% Match)', email: 'seeker.perfect@nestmate-test.com', role: 'seeker', status: 'active', city: 'Bengaluru', budget: 14500, quizAnswers: defaultQuiz, onboardingComplete: true, isVerified: true, phoneVerified: true, connectsUsed: 0, connectsLimit: 5, isTest: true },
  { uid: 'test_user_night_owl', name: 'Karan Mehra (Night Owl)', email: 'seeker.night@nestmate-test.com', role: 'seeker', status: 'active', city: 'Bengaluru', budget: 16000, quizAnswers: nightOwlQuiz, onboardingComplete: true, isVerified: true, phoneVerified: true, connectsUsed: 0, connectsLimit: 5, isTest: true },
  { uid: 'test_user_diff_city', name: 'Vikram Patel (Chennai Seeker)', email: 'seeker.chennai@nestmate-test.com', role: 'seeker', status: 'active', city: 'Chennai', budget: 15000, quizAnswers: defaultQuiz, onboardingComplete: true, isVerified: true, phoneVerified: true, connectsUsed: 0, connectsLimit: 5, isTest: true },
  { uid: 'test_user_dealbreaker', name: 'Rahul Sen (Smoker Veto)', email: 'seeker.smoker@nestmate-test.com', role: 'seeker', status: 'active', city: 'Bengaluru', budget: 14000, quizAnswers: { ...defaultQuiz, smoking: 'regularly' }, onboardingComplete: true, isVerified: true, phoneVerified: true, connectsUsed: 0, connectsLimit: 5, isTest: true },
  { uid: 'test_user_quota_full', name: 'Suresh Raina (Limit Reached)', email: 'seeker.quota@nestmate-test.com', role: 'seeker', status: 'active', city: 'Bengaluru', budget: 12000, quizAnswers: defaultQuiz, onboardingComplete: true, isVerified: true, phoneVerified: true, connectsUsed: 5, connectsLimit: 5, isTest: true },
  { uid: 'test_user_onboarding_pending', name: '', email: 'incomplete@nestmate-test.com', role: null, status: 'active', city: '', budget: 0, quizAnswers: {}, onboardingComplete: false, isVerified: false, connectsUsed: 0, connectsLimit: 5, isTest: true },
  { uid: 'test_user_suspended', name: 'Suspended Seeker', email: 'suspended@nestmate-test.com', role: 'seeker', status: 'suspended', city: 'Bengaluru', budget: 10000, quizAnswers: defaultQuiz, onboardingComplete: true, isVerified: false, connectsUsed: 0, connectsLimit: 5, isTest: true },
  { uid: 'test_user_banned', name: 'Banned Seeker', email: 'banned@nestmate-test.com', role: 'seeker', status: 'banned', city: 'Bengaluru', budget: 10000, quizAnswers: defaultQuiz, onboardingComplete: true, isVerified: false, connectsUsed: 0, connectsLimit: 5, isTest: true },
  { uid: 'test_user_pro_user', name: 'Priya Sharma (Pro Seeker)', email: 'seeker.pro@nestmate-test.com', role: 'seeker', status: 'active', city: 'Bengaluru', budget: 20000, quizAnswers: defaultQuiz, onboardingComplete: true, isPremium: true, isVerified: true, phoneVerified: true, connectsUsed: 0, connectsLimit: 999, isTest: true },
];

const owners = [
  { uid: 'test_user_owner_01', name: 'Ramesh Gupta (Verified Owner)', email: 'owner.verified@nestmate-test.com', role: 'owner', status: 'active', city: 'Bengaluru', isVerified: true, verificationLevel: 3, onboardingComplete: true, isTest: true },
  { uid: 'test_user_owner_02', name: 'Siddharth Rao (Unverified Owner)', email: 'owner.unverified@nestmate-test.com', role: 'owner', status: 'active', city: 'Bengaluru', isVerified: false, verificationLevel: 0, onboardingComplete: true, isTest: true },
  { uid: 'test_user_owner_03', name: 'Anjali Deshmukh (Review Pending)', email: 'owner.pending@nestmate-test.com', role: 'owner', status: 'active', city: 'Bengaluru', isVerified: false, verificationLevel: 1, onboardingComplete: true, isTest: true },
  { uid: 'test_user_owner_04', name: 'Sunil Verma (Portfolio Owner)', email: 'owner.portfolio@nestmate-test.com', role: 'owner', status: 'active', city: 'Bengaluru', isVerified: true, verificationLevel: 3, onboardingComplete: true, isTest: true },
  { uid: 'test_user_owner_rejected', name: 'Kavita Reddy (Rejected Owner)', email: 'owner.rejected@nestmate-test.com', role: 'owner', status: 'active', city: 'Bengaluru', isVerified: false, verificationLevel: 0, onboardingComplete: true, isTest: true },
];

const admins = [
  { uid: 'test_user_admin', name: 'Administrator', email: 'admin@nestmate-test.com', role: 'seeker', status: 'active', city: 'Bengaluru', isVerified: true, isPremium: true, isTest: true },
];

const listings = [
  { id: 'test_listing_live_01', ownerId: 'test_user_owner_01', title: 'Active Prime 2BHK in Koramangala', status: 'active', totalRent: 26000, partnerShare: 13000, deposit: 52000, city: 'Bengaluru', locality: 'Koramangala', ownerVerified: true, views: 45, isTest: true },
  { id: 'test_listing_pend_01', ownerId: 'test_user_owner_02', title: 'Pending Verification 1BHK in Indiranagar', status: 'pending_verification', totalRent: 18000, partnerShare: 9000, deposit: 36000, city: 'Bengaluru', locality: 'Indiranagar', ownerVerified: false, views: 0, isTest: true },
  { id: 'test_listing_draft_01', ownerId: 'test_user_owner_02', title: 'Draft Studio in HSR Layout', status: 'draft', totalRent: 14000, partnerShare: 7000, deposit: 28000, city: 'Bengaluru', locality: 'HSR Layout', ownerVerified: false, views: 0, isTest: true },
  { id: 'test_listing_pause_01', ownerId: 'test_user_owner_01', title: 'Temporarily Paused 3BHK in Whitefield', status: 'paused', totalRent: 35000, partnerShare: 17500, deposit: 70000, city: 'Bengaluru', locality: 'Whitefield', ownerVerified: true, views: 22, isTest: true },
  { id: 'test_listing_fill_01', ownerId: 'test_user_owner_04', title: 'Filled Occupancy Room in BTM Layout', status: 'filled', totalRent: 12000, partnerShare: 6000, deposit: 24000, city: 'Bengaluru', locality: 'BTM Layout', ownerVerified: true, views: 80, isTest: true },
  { id: 'test_listing_close_01', ownerId: 'test_user_owner_04', title: 'Closed Listing in Electronic City', status: 'closed', totalRent: 16000, partnerShare: 8000, deposit: 32000, city: 'Bengaluru', locality: 'Electronic City', ownerVerified: true, views: 95, isTest: true },
  { id: 'test_listing_exp_01', ownerId: 'test_user_owner_01', title: 'Stale 30+ Days Expired Listing', status: 'active', totalRent: 22000, partnerShare: 11000, deposit: 44000, city: 'Bengaluru', locality: 'Koramangala', ownerVerified: true, views: 30, lastConfirmedAt: new Date(Date.now() - 35 * 86400000).toISOString(), isTest: true },
];

const connections = [
  { id: 'test_conn_p01', fromUserId: 'test_user_ref', toUserId: 'test_user_owner_01', status: 'pending', isTest: true },
  { id: 'test_conn_a01', fromUserId: 'test_user_perfect_match', toUserId: 'test_user_owner_01', status: 'accepted', isTest: true },
  { id: 'test_conn_r01', fromUserId: 'test_user_night_owl', toUserId: 'test_user_owner_01', status: 'rejected', isTest: true },
  { id: 'test_conn_b01', fromUserId: 'test_user_suspended', toUserId: 'test_user_owner_01', status: 'blocked', isTest: true },
];

const chatRooms = [
  { id: 'test_chat_crm_01', participants: ['test_user_perfect_match', 'test_user_owner_01'], connectionId: 'test_conn_a01', lastMessage: 'Saturday works best.', isTest: true },
];

const messages = [
  { id: 'test_msg_m01', roomId: 'test_chat_crm_01', senderId: 'test_user_perfect_match', content: 'Hi, I saw your 2BHK room listing!', read: true, isTest: true },
  { id: 'test_msg_m02', roomId: 'test_chat_crm_01', senderId: 'test_user_owner_01', content: 'Hello Pooja! Would you like a tour?', read: true, isTest: true },
  { id: 'test_msg_m03', roomId: 'test_chat_crm_01', senderId: 'test_user_perfect_match', content: 'Saturday works best.', read: false, isTest: true },
];

const notifications = [
  { id: 'test_notif_01', userId: 'test_user_owner_01', type: 'connection_request', title: 'New Connection Request', message: 'Aditi Sharma sent you a connection request for Koramangala 2BHK.', read: false, link: '/owner-dashboard?tab=applicants', isTest: true, createdAt: new Date().toISOString() },
  { id: 'test_notif_02', userId: 'test_user_perfect_match', type: 'connection_accepted', title: 'Connection Accepted', message: 'Ramesh Gupta accepted your connection request!', read: true, link: '/chat', isTest: true, createdAt: new Date().toISOString() },
  { id: 'test_notif_03', userId: 'test_user_owner_01', type: 'new_message', title: 'New Message', message: 'Pooja Iyer sent you a message: "Saturday works best."', read: false, link: '/chat', isTest: true, createdAt: new Date().toISOString() },
];

const reports = [
  { id: 'test_report_rep_01', reporterId: 'test_user_ref', targetId: 'test_user_suspended', reason: 'spam_or_scam', status: 'open', isTest: true },
  { id: 'test_report_rep_02', reporterId: 'test_user_perfect_match', targetId: 'test_user_banned', reason: 'harassment', status: 'resolved', isTest: true },
];

const verifications = [
  { id: 'test_verif_owner_01', userId: 'test_user_owner_01', status: 'APPROVED', isTest: true },
  { id: 'test_verif_owner_02', userId: 'test_user_owner_02', status: 'SUBMITTED', isTest: true },
  { id: 'test_verif_owner_03', userId: 'test_user_owner_03', status: 'UNDER_REVIEW', isTest: true },
  { id: 'test_verif_owner_04', userId: 'test_user_owner_04', status: 'RESUBMISSION_REQUIRED', isTest: true },
  { id: 'test_verif_owner_05', userId: 'test_user_owner_rejected', status: 'REJECTED', isTest: true },
];

const universe = {
  seekers,
  owners,
  admins,
  listings,
  connections,
  chatRooms,
  messages,
  notifications,
  reports,
  verifications,
};

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const outPath = path.join(dataDir, 'seed-universe.json');
fs.writeFileSync(outPath, JSON.stringify(universe, null, 2), 'utf-8');

// Generate Playwright storage states in tests/.auth/
const authFiles = generateAllAuthStates();

console.log('======================================================');
console.log('✅ NESTMATE TEST UNIVERSE SEEDED SUCCESSFULLY');
console.log('======================================================');
console.log(`Environment:         ${envCheck.nodeEnv} (isolated: ${envCheck.isolated})`);
console.log(`Seekers seeded:      ${seekers.length} (including SEEKER_A, SEEKER_B, PRO_USER, SUSPENDED, BANNED, INCOMPLETE)`);
console.log(`Owners seeded:       ${owners.length} (including OWNER_A, OWNER_B, OWNER_PENDING, OWNER_REJECTED)`);
console.log(`Admins seeded:       ${admins.length} (ADMIN)`);
console.log(`Listings seeded:     ${listings.length} (7 States: Draft, Pending, Active, Paused, Filled, Closed, Expired)`);
console.log(`Connections seeded:  ${connections.length} (4 States: Pending, Accepted, Rejected, Blocked)`);
console.log(`Chat Rooms seeded:   ${chatRooms.length}`);
console.log(`Messages seeded:     ${messages.length}`);
console.log(`Notifications:       ${notifications.length}`);
console.log(`Reports seeded:      ${reports.length}`);
console.log(`Verifications:       ${verifications.length}`);
console.log(`Storage States:      ${authFiles.length} generated in tests/.auth/`);
console.log(`Artifact saved to:   ${outPath}`);
console.log('======================================================');
