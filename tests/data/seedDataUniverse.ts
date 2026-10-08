import {
  TestUserProfile,
  TestListing,
  TestConnection,
  TestChatRoom,
  TestChatMessage,
  TestReport,
  TestOwnerVerification,
  TestNotification,
} from './testTypes';
import { AccountFactory, defaultQuizAnswers, nightOwlQuizAnswers } from '../factories/accountFactory';
import { DataFactory } from '../factories/dataFactory';

export interface TestUniverseDataset {
  seekers: TestUserProfile[];
  owners: TestUserProfile[];
  admins: TestUserProfile[];
  listings: TestListing[];
  connections: TestConnection[];
  chatRooms: TestChatRoom[];
  messages: TestChatMessage[];
  notifications: TestNotification[];
  reports: TestReport[];
  verifications: TestOwnerVerification[];
}

export function buildDeterministicTestUniverse(): TestUniverseDataset {
  // ── 1. SEEKER UNIVERSE ───────────────────────────────────────────────────────
  const seekers: TestUserProfile[] = [
    AccountFactory.createSeeker('ref', {
      name: 'Aditi Sharma (Reference)',
      budget: 15000,
      city: 'Bengaluru',
      quizAnswers: { ...defaultQuizAnswers },
    }),
    AccountFactory.createSeeker('perfect_match', {
      name: 'Pooja Iyer (100% Match)',
      budget: 14500,
      city: 'Bengaluru',
      quizAnswers: { ...defaultQuizAnswers },
    }),
    AccountFactory.createSeeker('night_owl', {
      name: 'Karan Mehra (Night Owl)',
      budget: 16000,
      city: 'Bengaluru',
      quizAnswers: { ...nightOwlQuizAnswers },
    }),
    AccountFactory.createSeeker('diff_city', {
      name: 'Vikram Patel (Chennai Seeker)',
      budget: 15000,
      city: 'Chennai',
      quizAnswers: { ...defaultQuizAnswers },
    }),
    AccountFactory.createSeeker('dealbreaker_conflict', {
      name: 'Rahul Sen (Smoker Veto)',
      budget: 14000,
      city: 'Bengaluru',
      quizAnswers: { ...defaultQuizAnswers, smoking: 'regularly' },
    }),
    AccountFactory.createQuotaExhaustedSeeker('quota_full', {
      name: 'Suresh Raina (Limit Reached)',
    }),
    AccountFactory.createIncompleteUser('onboarding_pending', {
      email: 'incomplete@nestmate-test.com',
    }),
    AccountFactory.createSuspendedUser('bad_actor_suspended', {
      name: 'Suspended Seeker',
    }),
    AccountFactory.createBannedUser('malicious_banned', {
      name: 'Banned User',
    }),
    AccountFactory.createPremiumSeeker('pro_user', {
      name: 'Priya Sharma (Pro Seeker)',
    }),
  ];

  // ── 2. OWNER UNIVERSE ────────────────────────────────────────────────────────
  const owners: TestUserProfile[] = [
    AccountFactory.createOwner('verified_01', {
      name: 'Ramesh Gupta (Verified Owner)',
      isVerified: true,
      verificationLevel: 3,
    }),
    AccountFactory.createOwner('unverified_01', {
      name: 'Siddharth Rao (Unverified Owner)',
      isVerified: false,
      verificationLevel: 0,
    }),
    AccountFactory.createOwner('pending_review_01', {
      name: 'Anjali Deshmukh (Review Pending)',
      isVerified: false,
      verificationLevel: 1,
    }),
    AccountFactory.createOwner('multi_listings_01', {
      name: 'Sunil Verma (Portfolio Owner)',
      isVerified: true,
      verificationLevel: 3,
    }),
    AccountFactory.createRejectedOwner('owner_rejected', {
      name: 'Kavita Reddy (Rejected Owner)',
    }),
  ];

  // ── 3. ADMIN UNIVERSE ────────────────────────────────────────────────────────
  const admins: TestUserProfile[] = [
    AccountFactory.createAdmin('primary', {
      email: 'admin@nestmate-test.com',
    }),
  ];

  // ── 4. LISTING UNIVERSE (All 7 States) ──────────────────────────────────────
  const listings: TestListing[] = [
    DataFactory.createActiveListing('live_01', owners[0].uid, {
      title: 'Active Prime 2BHK in Koramangala',
      city: 'Bengaluru',
      locality: 'Koramangala',
      totalRent: 26000,
      partnerShare: 13000,
    }),
    DataFactory.createPendingListing('pend_01', owners[1].uid, {
      title: 'Pending Verification 1BHK in Indiranagar',
      city: 'Bengaluru',
      locality: 'Indiranagar',
      totalRent: 18000,
      partnerShare: 9000,
    }),
    DataFactory.createDraftListing('draft_01', owners[1].uid, {
      title: 'Draft Studio in HSR Layout',
      city: 'Bengaluru',
      locality: 'HSR Layout',
      totalRent: 14000,
    }),
    DataFactory.createPausedListing('pause_01', owners[0].uid, {
      title: 'Temporarily Paused 3BHK in Whitefield',
      city: 'Bengaluru',
      locality: 'Whitefield',
      totalRent: 35000,
    }),
    DataFactory.createFilledListing('fill_01', owners[3].uid, {
      title: 'Filled Occupancy Room in BTM Layout',
      city: 'Bengaluru',
      locality: 'BTM Layout',
      totalRent: 12000,
    }),
    DataFactory.createClosedListing('close_01', owners[3].uid, {
      title: 'Closed Listing in Electronic City',
      city: 'Bengaluru',
      locality: 'Electronic City',
      totalRent: 16000,
    }),
    DataFactory.createExpiredListing('exp_01', owners[0].uid, {
      title: 'Stale 30+ Days Expired Listing',
      city: 'Bengaluru',
      locality: 'Koramangala',
      totalRent: 22000,
    }),
  ];

  // ── 5. CONNECTION UNIVERSE (All 4 States) ────────────────────────────────────
  const connections: TestConnection[] = [
    DataFactory.createPendingConnection('p01', seekers[0].uid, owners[0].uid),
    DataFactory.createAcceptedConnection('a01', seekers[1].uid, owners[0].uid),
    DataFactory.createRejectedConnection('r01', seekers[2].uid, owners[0].uid),
    DataFactory.createBlockedConnection('b01', seekers[7].uid, owners[0].uid),
  ];

  // ── 6. MESSAGING UNIVERSE ────────────────────────────────────────────────────
  const chatRooms: TestChatRoom[] = [
    DataFactory.createChatRoom('crm_01', seekers[1].uid, owners[0].uid, connections[1].id),
  ];

  const messages: TestChatMessage[] = [
    DataFactory.createChatMessage('m01', chatRooms[0].id, seekers[1].uid, 'Hi, I saw your 2BHK room listing!'),
    DataFactory.createChatMessage('m02', chatRooms[0].id, owners[0].uid, 'Hello Pooja! Yes, it is available. Would you like a tour?'),
    DataFactory.createChatMessage('m03', chatRooms[0].id, seekers[1].uid, 'Yes please! This Saturday afternoon works best.'),
  ];

  // ── 7. NOTIFICATIONS UNIVERSE ────────────────────────────────────────────────
  const notifications: TestNotification[] = [
    {
      id: 'test_notif_01',
      userId: owners[0].uid,
      type: 'connection_request',
      title: 'New Connection Request',
      message: 'Aditi Sharma sent you a connection request for Koramangala 2BHK.',
      read: false,
      link: '/owner-dashboard?tab=applicants',
      isTest: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'test_notif_02',
      userId: seekers[1].uid,
      type: 'connection_accepted',
      title: 'Connection Accepted',
      message: 'Ramesh Gupta accepted your connection request!',
      read: true,
      link: '/chat',
      isTest: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'test_notif_03',
      userId: owners[0].uid,
      type: 'new_message',
      title: 'New Message',
      message: 'Pooja Iyer sent you a message: "Yes please! Saturday afternoon works best."',
      read: false,
      link: '/chat',
      isTest: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // ── 8. MODERATION & OWNER VERIFICATION UNIVERSE ─────────────────────────────
  const reports: TestReport[] = [
    DataFactory.createReport('rep_01', seekers[0].uid, seekers[7].uid, 'spam_or_scam', {
      details: 'Sent unsolicited suspicious links.',
      status: 'open',
    }),
    DataFactory.createReport('rep_02', seekers[1].uid, seekers[8].uid, 'harassment', {
      details: 'Offensive language in connection note.',
      status: 'resolved',
    }),
  ];

  const verifications: TestOwnerVerification[] = [
    DataFactory.createOwnerVerification(owners[0].uid, 'APPROVED', {
      reviewedAt: new Date().toISOString(),
    }),
    DataFactory.createOwnerVerification(owners[1].uid, 'SUBMITTED'),
    DataFactory.createOwnerVerification(owners[2].uid, 'UNDER_REVIEW'),
    DataFactory.createOwnerVerification(owners[3].uid, 'RESUBMISSION_REQUIRED', {
      reviewNote: 'Electricity bill name does not match government ID.',
      resubmissionCount: 1,
    }),
    DataFactory.createOwnerVerification('test_user_owner_rejected', 'REJECTED', {
      reviewNote: 'Document blurred and unreadable. Verification rejected.',
    }),
  ];

  return {
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
}

export const TEST_UNIVERSE = buildDeterministicTestUniverse();

