import {
  TestListing,
  ListingStatus,
  TestConnection,
  ConnectionStatus,
  TestChatRoom,
  TestChatMessage,
  TestReport,
  TestOwnerVerification,
  OwnerVerificationStatus,
} from '../data/testTypes';

export const TEST_LISTING_PREFIX = 'test_listing_';
export const TEST_CONN_PREFIX = 'test_conn_';
export const TEST_CHAT_PREFIX = 'test_chat_';
export const TEST_REPORT_PREFIX = 'test_report_';
export const TEST_VERIF_PREFIX = 'test_verif_';

export class DataFactory {
  // ── LISTING FACTORIES ────────────────────────────────────────────────────────
  static createListing(
    id = 'l01',
    ownerId = 'test_user_owner_01',
    status: ListingStatus = 'active',
    overrides: Partial<TestListing> = {}
  ): TestListing {
    const totalRent = overrides.totalRent ?? 24000;
    const partnerShare = overrides.partnerShare ?? Math.floor(totalRent / 2);
    const deposit = overrides.deposit ?? totalRent * 2;

    return {
      id: `${TEST_LISTING_PREFIX}${id}`,
      ownerId,
      title: `Spacious 2BHK in Koramangala (${id})`,
      description: 'Fully furnished 2BHK flat with high speed wifi and 24/7 security.',
      city: 'Bengaluru',
      locality: 'Koramangala',
      address: '4th Block, Koramangala, Bengaluru, Karnataka 560034',
      totalRent,
      partnerShare,
      deposit,
      availableFrom: '2026-11-01',
      flatType: '2BHK',
      furnishing: 'Fully Furnished',
      amenities: ['WiFi', 'AC', 'Washing Machine', 'Power Backup'],
      houseRules: ['No smoking indoors', 'Cleanliness expected'],
      preferredGender: 'any',
      status,
      ownerVerified: status === 'active',
      views: 45,
      lastConfirmedAt: new Date().toISOString(),
      isTest: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  static createActiveListing(id = 'act_01', ownerId = 'test_user_owner_01', overrides: Partial<TestListing> = {}): TestListing {
    return this.createListing(id, ownerId, 'active', {
      ownerVerified: true,
      lastConfirmedAt: new Date().toISOString(),
      ...overrides,
    });
  }

  static createPendingListing(id = 'pend_01', ownerId = 'test_user_owner_01', overrides: Partial<TestListing> = {}): TestListing {
    return this.createListing(id, ownerId, 'pending_verification', {
      ownerVerified: false,
      ...overrides,
    });
  }

  static createDraftListing(id = 'draft_01', ownerId = 'test_user_owner_01', overrides: Partial<TestListing> = {}): TestListing {
    return this.createListing(id, ownerId, 'draft', {
      ownerVerified: false,
      ...overrides,
    });
  }

  static createPausedListing(id = 'pause_01', ownerId = 'test_user_owner_01', overrides: Partial<TestListing> = {}): TestListing {
    return this.createListing(id, ownerId, 'paused', overrides);
  }

  static createFilledListing(id = 'fill_01', ownerId = 'test_user_owner_01', overrides: Partial<TestListing> = {}): TestListing {
    return this.createListing(id, ownerId, 'filled', overrides);
  }

  static createClosedListing(id = 'close_01', ownerId = 'test_user_owner_01', overrides: Partial<TestListing> = {}): TestListing {
    return this.createListing(id, ownerId, 'closed', overrides);
  }

  static createExpiredListing(id = 'exp_01', ownerId = 'test_user_owner_01', overrides: Partial<TestListing> = {}): TestListing {
    // 35 days ago — violates 30-day freshness rule
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 86400000).toISOString();
    return this.createListing(id, ownerId, 'active', {
      lastConfirmedAt: thirtyFiveDaysAgo,
      createdAt: thirtyFiveDaysAgo,
      updatedAt: thirtyFiveDaysAgo,
      ...overrides,
    });
  }

  // ── CONNECTION FACTORIES ─────────────────────────────────────────────────────
  static createConnection(
    id = 'c01',
    fromUserId = 'test_user_seeker_01',
    toUserId = 'test_user_owner_01',
    status: ConnectionStatus = 'pending',
    overrides: Partial<TestConnection> = {}
  ): TestConnection {
    return {
      id: `${TEST_CONN_PREFIX}${id}`,
      fromUserId,
      toUserId,
      status,
      listingId: `${TEST_LISTING_PREFIX}act_01`,
      screeningAnswers: {
        moveInUrgency: 'immediate',
        stayDuration: '12_months',
      },
      isTest: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  static createPendingConnection(id = 'p01', fromId = 'test_user_seeker_01', toId = 'test_user_owner_01'): TestConnection {
    return this.createConnection(id, fromId, toId, 'pending');
  }

  static createAcceptedConnection(id = 'a01', fromId = 'test_user_seeker_01', toId = 'test_user_owner_01'): TestConnection {
    return this.createConnection(id, fromId, toId, 'accepted');
  }

  static createRejectedConnection(id = 'r01', fromId = 'test_user_seeker_01', toId = 'test_user_owner_01'): TestConnection {
    return this.createConnection(id, fromId, toId, 'rejected');
  }

  static createBlockedConnection(id = 'b01', fromId = 'test_user_seeker_01', toId = 'test_user_owner_01'): TestConnection {
    return this.createConnection(id, fromId, toId, 'blocked');
  }

  // ── CHAT & MESSAGING FACTORIES ───────────────────────────────────────────────
  static createChatRoom(
    id = 'r01',
    participantA = 'test_user_seeker_01',
    participantB = 'test_user_owner_01',
    connectionId = 'test_conn_a01',
    overrides: Partial<TestChatRoom> = {}
  ): TestChatRoom {
    return {
      id: `${TEST_CHAT_PREFIX}${id}`,
      participants: [participantA, participantB],
      connectionId,
      lastMessage: 'Hello! I am interested in visiting the apartment.',
      lastMessageSenderId: participantA,
      lastMessageAt: new Date().toISOString(),
      isTest: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  static createChatMessage(
    id = 'm01',
    roomId = 'test_chat_r01',
    senderId = 'test_user_seeker_01',
    content = 'Hi! Is the room still available for rent?',
    overrides: Partial<TestChatMessage> = {}
  ): TestChatMessage {
    return {
      id: `test_msg_${id}`,
      roomId,
      senderId,
      content,
      read: false,
      isTest: true,
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  // ── MODERATION & VERIFICATION FACTORIES ─────────────────────────────────────
  static createReport(
    id = 'rep_01',
    reporterId = 'test_user_seeker_01',
    targetId = 'test_user_owner_01',
    reason = 'spam_or_scam',
    overrides: Partial<TestReport> = {}
  ): TestReport {
    return {
      id: `${TEST_REPORT_PREFIX}${id}`,
      reporterId,
      targetId,
      targetType: 'user',
      reason,
      status: 'open',
      details: 'Suspicious request asking for deposit before visit.',
      isTest: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  static createOwnerVerification(
    userId = 'test_user_owner_01',
    status: OwnerVerificationStatus = 'SUBMITTED',
    overrides: Partial<TestOwnerVerification> = {}
  ): TestOwnerVerification {
    return {
      id: `${TEST_VERIF_PREFIX}${userId}`,
      userId,
      declaredName: 'Test Owner',
      documentType: 'electricity_bill',
      documentUrl: 'https://storage.googleapis.com/test-bucket/verifications/doc.pdf',
      status,
      submittedAt: new Date().toISOString(),
      reviewNote: status === 'REJECTED' ? 'Document blurred, please resubmit clearly.' : undefined,
      resubmissionCount: status === 'RESUBMISSION_REQUIRED' ? 1 : 0,
      isTest: true,
      ...overrides,
    };
  }

  // ── FUZZ DATA FOR BOUNDARY TESTING ──────────────────────────────────────────
  static getFuzzStrings(): string[] {
    return [
      '',                                                    // empty
      '   ',                                                 // whitespace only
      'a'.repeat(255),                                       // 255 chars
      'a'.repeat(5000),                                      // 5,000 chars long string
      '<script>alert("xss")</script>',                       // XSS injection payload
      'SELECT * FROM users WHERE 1=1;',                      // SQL injection pattern
      '🎉🔥🏠✨❤️🇮🇳',                                         // Emojis
      'Bengaluru / ಬೆಂಗಳೂರು / బెంగళూరు / பெங்களூரு',         // Indic scripts
      '\u0000\u0007\u001b[31m',                             // Control characters
      'undefined',                                           // Stringified null/undefined
      'null',
      'NaN',
    ];
  }
}
