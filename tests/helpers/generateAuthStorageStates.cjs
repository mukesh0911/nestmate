/**
 * NestMate Playwright StorageState Generator
 * Creates deterministic storage states for SEEKER_A, SEEKER_B, OWNER_A, OWNER_B, ADMIN.
 */
const fs = require('fs');
const path = require('path');

const authDir = path.resolve(__dirname, '../.auth');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

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

const users = {
  seekerA: {
    uid: 'test_user_ref',
    name: 'Aditi Sharma (Reference)',
    email: 'seeker.ref@nestmate-test.com',
    role: 'seeker',
    status: 'active',
    city: 'Bengaluru',
    localities: ['Koramangala'],
    budget: 15000,
    quizAnswers: defaultQuiz,
    onboardingComplete: true,
    isPremium: false,
    isVerified: true,
    phoneVerified: true,
    verificationLevel: 1,
    connectsUsed: 0,
    connectsLimit: 5,
    isTest: true,
  },
  seekerB: {
    uid: 'test_user_perfect_match',
    name: 'Pooja Iyer (100% Match)',
    email: 'seeker.perfect@nestmate-test.com',
    role: 'seeker',
    status: 'active',
    city: 'Bengaluru',
    localities: ['Koramangala'],
    budget: 14500,
    quizAnswers: defaultQuiz,
    onboardingComplete: true,
    isPremium: false,
    isVerified: true,
    phoneVerified: true,
    verificationLevel: 1,
    connectsUsed: 0,
    connectsLimit: 5,
    isTest: true,
  },
  ownerA: {
    uid: 'test_user_owner_01',
    name: 'Ramesh Gupta (Verified Owner)',
    email: 'owner.verified@nestmate-test.com',
    role: 'owner',
    status: 'active',
    city: 'Bengaluru',
    localities: ['Koramangala'],
    budget: 0,
    quizAnswers: defaultQuiz,
    onboardingComplete: true,
    isPremium: false,
    isVerified: true,
    phoneVerified: true,
    verificationLevel: 3,
    connectsUsed: 0,
    connectsLimit: 20,
    isTest: true,
  },
  ownerB: {
    uid: 'test_user_owner_02',
    name: 'Siddharth Rao (Unverified Owner)',
    email: 'owner.unverified@nestmate-test.com',
    role: 'owner',
    status: 'active',
    city: 'Bengaluru',
    localities: ['Indiranagar'],
    budget: 0,
    quizAnswers: defaultQuiz,
    onboardingComplete: true,
    isPremium: false,
    isVerified: false,
    phoneVerified: true,
    verificationLevel: 0,
    connectsUsed: 0,
    connectsLimit: 20,
    isTest: true,
  },
  admin: {
    uid: 'test_user_admin',
    name: 'Administrator',
    email: 'admin@nestmate-test.com',
    role: 'seeker',
    status: 'active',
    city: 'Bengaluru',
    budget: 20000,
    quizAnswers: defaultQuiz,
    onboardingComplete: true,
    isPremium: true,
    isVerified: true,
    phoneVerified: true,
    verificationLevel: 3,
    connectsUsed: 0,
    connectsLimit: 999,
    isTest: true,
  },
};

function generateStorageState(user, baseURL = 'http://localhost:3000') {
  const jsonStr = JSON.stringify(user);
  return {
    cookies: [],
    origins: [
      {
        origin: baseURL,
        localStorage: [
          { name: 'nestmate_auth_session', value: jsonStr },
          { name: 'nestmate_test_user', value: jsonStr },
        ],
      },
    ],
  };
}

function generateAllAuthStates(baseURL = 'http://localhost:3000') {
  const generated = [];
  for (const [key, user] of Object.entries(users)) {
    const filePath = path.join(authDir, `${key}.json`);
    const state = generateStorageState(user, baseURL);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    generated.push(filePath);
  }
  return generated;
}

if (require.main === module) {
  const files = generateAllAuthStates();
  console.log(`Generated ${files.length} Playwright storageState files in tests/.auth:`);
  files.forEach(f => console.log(`  - ${path.basename(f)}`));
}

module.exports = {
  generateAllAuthStates,
  generateStorageState,
  users,
};
