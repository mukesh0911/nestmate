/**
 * NestMate — Test Persona Registry
 * Single authoritative typed registry of all test personas, their auth states,
 * permissions, expected routes, and seeded database references.
 */

export interface TestPersonaDefinition {
  key: string;
  uid: string;
  email: string;
  name: string;
  role: 'seeker' | 'owner' | null;
  status: 'active' | 'suspended' | 'banned';
  onboardingComplete: boolean;
  isVerified: boolean;
  isPremium: boolean;
  storageStatePath: string;
  expectedRoute: string;
  expectedPermissions: string[];
  seededRelatedRecords: {
    listings?: string[];
    connections?: string[];
    chatRooms?: string[];
    verifications?: string[];
    reports?: string[];
    notifications?: string[];
  };
}

export const PERSONA_REGISTRY: Record<string, TestPersonaDefinition> = {
  SEEKER_A: {
    key: 'SEEKER_A',
    uid: 'test_user_ref',
    email: 'seeker.ref@nestmate-test.com',
    name: 'Aditi Sharma',
    role: 'seeker',
    status: 'active',
    onboardingComplete: true,
    isVerified: true,
    isPremium: false,
    storageStatePath: 'tests/.auth/seekerA.json',
    expectedRoute: '/explore?tab=rooms',
    expectedPermissions: ['browse_listings', 'send_interest', 'edit_own_profile'],
    seededRelatedRecords: {
      connections: ['test_conn_p01', 'conn_nos_aditi'],
      chatRooms: ['chat_room_nos_aditi'],
      reports: ['test_report_rep_01'],
    },
  },

  SEEKER_B: {
    key: 'SEEKER_B',
    uid: 'test_user_perfect_match',
    email: 'seeker.perfect@nestmate-test.com',
    name: 'Pooja Iyer',
    role: 'seeker',
    status: 'active',
    onboardingComplete: true,
    isVerified: true,
    isPremium: false,
    storageStatePath: 'tests/.auth/seekerB.json',
    expectedRoute: '/explore?tab=rooms',
    expectedPermissions: ['browse_listings', 'send_interest', 'chat'],
    seededRelatedRecords: {
      connections: ['test_conn_a01', 'conn_nos_pooja'],
      chatRooms: ['test_chat_crm_01', 'chat_room_nos_pooja'],
      reports: ['test_report_rep_02'],
      notifications: ['test_notif_02'],
    },
  },

  SEEKER_C: {
    key: 'SEEKER_C',
    uid: 'test_user_night_owl',
    email: 'seeker.night@nestmate-test.com',
    name: 'Karan Mehra',
    role: 'seeker',
    status: 'active',
    onboardingComplete: true,
    isVerified: true,
    isPremium: false,
    storageStatePath: 'tests/.auth/seekerC.json',
    expectedRoute: '/explore?tab=rooms',
    expectedPermissions: ['browse_listings', 'send_interest'],
    seededRelatedRecords: {
      connections: ['test_conn_r01'],
    },
  },

  OWNER_A: {
    key: 'OWNER_A',
    uid: 'test_user_owner_01',
    email: 'owner.verified@nestmate-test.com',
    name: 'Ramesh Gupta',
    role: 'owner',
    status: 'active',
    onboardingComplete: true,
    isVerified: true,
    isPremium: true,
    storageStatePath: 'tests/.auth/ownerA.json',
    expectedRoute: '/owner-dashboard',
    expectedPermissions: ['create_listing', 'edit_listing', 'manage_applicants', 'chat'],
    seededRelatedRecords: {
      listings: [
        'test_listing_kora_01',
        'test_listing_pause_01',
        'test_listing_fill_01',
        'test_listing_close_01',
        'test_listing_exp_01',
      ],
      connections: ['test_conn_p01', 'test_conn_a01', 'test_conn_r01', 'test_conn_b01'],
      chatRooms: ['test_chat_crm_01'],
      verifications: ['test_verif_owner_01'],
      notifications: ['test_notif_01', 'test_notif_03'],
    },
  },

  OWNER_B: {
    key: 'OWNER_B',
    uid: 'test_user_owner_02',
    email: 'owner.unverified@nestmate-test.com',
    name: 'Siddharth Rao',
    role: 'owner',
    status: 'active',
    onboardingComplete: true,
    isVerified: false,
    isPremium: false,
    storageStatePath: 'tests/.auth/ownerB.json',
    expectedRoute: '/owner-dashboard',
    expectedPermissions: ['create_listing', 'submit_verification'],
    seededRelatedRecords: {
      listings: ['test_listing_hsr_01'],
      verifications: ['test_verif_owner_02'],
    },
  },

  OWNER_PENDING_VERIFICATION: {
    key: 'OWNER_PENDING_VERIFICATION',
    uid: 'test_user_owner_03',
    email: 'owner.pending@nestmate-test.com',
    name: 'Anjali Deshmukh',
    role: 'owner',
    status: 'active',
    onboardingComplete: true,
    isVerified: false,
    isPremium: false,
    storageStatePath: 'tests/.auth/ownerPending.json',
    expectedRoute: '/owner-dashboard',
    expectedPermissions: ['create_listing', 'view_verification_status'],
    seededRelatedRecords: {
      listings: ['test_listing_pend_01'],
      verifications: ['test_verif_owner_03'],
    },
  },

  OWNER_REJECTED: {
    key: 'OWNER_REJECTED',
    uid: 'test_user_owner_rejected',
    email: 'owner.rejected@nestmate-test.com',
    name: 'Kavita Reddy',
    role: 'owner',
    status: 'active',
    onboardingComplete: true,
    isVerified: false,
    isPremium: false,
    storageStatePath: 'tests/.auth/ownerRejected.json',
    expectedRoute: '/owner-dashboard',
    expectedPermissions: ['view_rejection_reason', 'resubmit_verification'],
    seededRelatedRecords: {
      verifications: ['test_verif_owner_05'],
    },
  },

  ADMIN: {
    key: 'ADMIN',
    uid: 'test_user_admin',
    email: 'admin@nestmate-test.com',
    name: 'Administrator',
    role: 'seeker',
    status: 'active',
    onboardingComplete: true,
    isVerified: true,
    isPremium: true,
    storageStatePath: 'tests/.auth/admin.json',
    expectedRoute: '/admin',
    expectedPermissions: [
      'view_all_users',
      'view_all_listings',
      'approve_verifications',
      'resolve_reports',
      'manage_marketplace',
    ],
    seededRelatedRecords: {},
  },

  ONBOARDING_PENDING: {
    key: 'ONBOARDING_PENDING',
    uid: 'test_user_onboarding_pending',
    email: 'incomplete@nestmate-test.com',
    name: '',
    role: null,
    status: 'active',
    onboardingComplete: false,
    isVerified: false,
    isPremium: false,
    storageStatePath: 'tests/.auth/onboardingPending.json',
    expectedRoute: '/role-select',
    expectedPermissions: ['select_role', 'complete_onboarding'],
    seededRelatedRecords: {},
  },

  SUSPENDED_USER: {
    key: 'SUSPENDED_USER',
    uid: 'test_user_suspended',
    email: 'suspended@nestmate-test.com',
    name: 'Suspended Seeker',
    role: 'seeker',
    status: 'suspended',
    onboardingComplete: true,
    isVerified: false,
    isPremium: false,
    storageStatePath: 'tests/.auth/suspendedUser.json',
    expectedRoute: '/explore',
    expectedPermissions: ['read_public'],
    seededRelatedRecords: {
      connections: ['test_conn_b01'],
      reports: ['test_report_rep_01'],
    },
  },

  BANNED_USER: {
    key: 'BANNED_USER',
    uid: 'test_user_banned',
    email: 'banned@nestmate-test.com',
    name: 'Banned Seeker',
    role: 'seeker',
    status: 'banned',
    onboardingComplete: true,
    isVerified: false,
    isPremium: false,
    storageStatePath: 'tests/.auth/bannedUser.json',
    expectedRoute: '/explore',
    expectedPermissions: [],
    seededRelatedRecords: {
      reports: ['test_report_rep_02'],
    },
  },

  PREMIUM_USER: {
    key: 'PREMIUM_USER',
    uid: 'test_user_pro_user',
    email: 'seeker.pro@nestmate-test.com',
    name: 'Priya Sharma',
    role: 'seeker',
    status: 'active',
    onboardingComplete: true,
    isVerified: true,
    isPremium: true,
    storageStatePath: 'tests/.auth/premiumUser.json',
    expectedRoute: '/explore?tab=rooms',
    expectedPermissions: ['unlimited_connects', 'direct_contact_unlock', 'browse_listings'],
    seededRelatedRecords: {},
  },

  QUOTA_FULL_USER: {
    key: 'QUOTA_FULL_USER',
    uid: 'test_user_quota_full',
    email: 'seeker.quota@nestmate-test.com',
    name: 'Suresh Raina',
    role: 'seeker',
    status: 'active',
    onboardingComplete: true,
    isVerified: true,
    isPremium: false,
    storageStatePath: 'tests/.auth/quotaFullUser.json',
    expectedRoute: '/explore?tab=rooms',
    expectedPermissions: ['browse_listings'],
    seededRelatedRecords: {},
  },
};
