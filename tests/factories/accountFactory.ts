import { TestUserProfile, AccountStatus, QuizAnswers } from '../data/testTypes';

export const TEST_EMAIL_DOMAIN = 'nestmate-test.com';
export const TEST_USER_PREFIX = 'test_user_';

export const defaultQuizAnswers: QuizAnswers = {
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

export const nightOwlQuizAnswers: QuizAnswers = {
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

export class AccountFactory {
  static createSeeker(id = 'seeker_01', overrides: Partial<TestUserProfile> = {}): TestUserProfile {
    return {
      uid: `${TEST_USER_PREFIX}${id}`,
      name: `Test Seeker ${id}`,
      email: `${id}@${TEST_EMAIL_DOMAIN}`,
      phone: '+919876543210',
      role: 'seeker',
      status: 'active',
      city: 'Bengaluru',
      localities: ['Koramangala', 'HSR Layout'],
      budget: 15000,
      moveInDate: '2026-11-01',
      profession: 'Software Engineer',
      company: 'Acme Tech',
      bio: 'Clean and quiet professional looking for a flatmate in Bengaluru.',
      age: 26,
      gender: 'male',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      quizAnswers: { ...defaultQuizAnswers },
      onboardingComplete: true,
      isPremium: false,
      isVerified: true,
      phoneVerified: true,
      workEmailVerified: false,
      verificationLevel: 1,
      connectsUsed: 0,
      connectsLimit: 5,
      savedProfileIds: [],
      savedRoomIds: [],
      skippedUserIds: [],
      blockedUserIds: [],
      isTest: true,
      ...overrides,
    };
  }

  static createOwner(id = 'owner_01', overrides: Partial<TestUserProfile> = {}): TestUserProfile {
    return {
      uid: `${TEST_USER_PREFIX}${id}`,
      name: `Test Owner ${id}`,
      email: `${id}@${TEST_EMAIL_DOMAIN}`,
      phone: '+919876543220',
      role: 'owner',
      status: 'active',
      city: 'Bengaluru',
      localities: ['Indiranagar'],
      budget: 0,
      moveInDate: '2026-11-01',
      profession: 'Property Manager',
      company: 'Self-employed',
      bio: 'Owner of well-maintained apartment looking for reliable tenants.',
      age: 32,
      gender: 'female',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      quizAnswers: { ...defaultQuizAnswers },
      onboardingComplete: true,
      isPremium: false,
      isVerified: true,
      phoneVerified: true,
      workEmailVerified: true,
      verificationLevel: 3,
      connectsUsed: 0,
      connectsLimit: 20,
      savedProfileIds: [],
      savedRoomIds: [],
      skippedUserIds: [],
      blockedUserIds: [],
      isTest: true,
      ...overrides,
    };
  }

  static createAdmin(id = 'admin', overrides: Partial<TestUserProfile> = {}): TestUserProfile {
    return {
      uid: `${TEST_USER_PREFIX}${id}`,
      name: 'Test Administrator',
      email: `admin@${TEST_EMAIL_DOMAIN}`,
      phone: '+919876543299',
      role: 'seeker',
      status: 'active',
      city: 'Bengaluru',
      localities: ['Koramangala'],
      budget: 20000,
      moveInDate: '2026-11-01',
      profession: 'Platform Operations',
      company: 'NestMate Core',
      bio: 'Platform administration and safety audit account.',
      age: 30,
      gender: 'other',
      avatar: '',
      quizAnswers: { ...defaultQuizAnswers },
      onboardingComplete: true,
      isPremium: true,
      isVerified: true,
      phoneVerified: true,
      verificationLevel: 3,
      connectsUsed: 0,
      connectsLimit: 999,
      savedProfileIds: [],
      savedRoomIds: [],
      skippedUserIds: [],
      blockedUserIds: [],
      isTest: true,
      ...overrides,
    };
  }

  static createIncompleteUser(id = 'newbie_01', overrides: Partial<TestUserProfile> = {}): TestUserProfile {
    return {
      uid: `${TEST_USER_PREFIX}${id}`,
      name: '',
      email: `${id}@${TEST_EMAIL_DOMAIN}`,
      phone: '',
      role: null,
      status: 'active',
      city: '',
      localities: [],
      budget: 0,
      moveInDate: '',
      profession: '',
      company: '',
      age: 0,
      gender: '',
      avatar: '',
      quizAnswers: {},
      onboardingComplete: false,
      isPremium: false,
      isVerified: false,
      verificationLevel: 0,
      connectsUsed: 0,
      connectsLimit: 5,
      savedProfileIds: [],
      savedRoomIds: [],
      skippedUserIds: [],
      blockedUserIds: [],
      isTest: true,
      ...overrides,
    };
  }

  static createSuspendedUser(id = 'suspended_01', overrides: Partial<TestUserProfile> = {}): TestUserProfile {
    return this.createSeeker(id, {
      status: 'suspended',
      ...overrides,
    });
  }

  static createBannedUser(id = 'banned_01', overrides: Partial<TestUserProfile> = {}): TestUserProfile {
    return this.createSeeker(id, {
      status: 'banned',
      ...overrides,
    });
  }

  static createQuotaExhaustedSeeker(id = 'quota_max_01', overrides: Partial<TestUserProfile> = {}): TestUserProfile {
    return this.createSeeker(id, {
      connectsUsed: 5,
      connectsLimit: 5,
      ...overrides,
    });
  }

  static createPremiumSeeker(id = 'pro_user', overrides: Partial<TestUserProfile> = {}): TestUserProfile {
    return this.createSeeker(id, {
      name: 'Priya Sharma (Pro Seeker)',
      email: `seeker.pro@${TEST_EMAIL_DOMAIN}`,
      isPremium: true,
      connectsLimit: 999,
      ...overrides,
    });
  }

  static createRejectedOwner(id = 'owner_rejected', overrides: Partial<TestUserProfile> = {}): TestUserProfile {
    return this.createOwner(id, {
      name: 'Kavita Reddy (Rejected Owner)',
      email: `owner.rejected@${TEST_EMAIL_DOMAIN}`,
      isVerified: false,
      verificationLevel: 0,
      ...overrides,
    });
  }
}

