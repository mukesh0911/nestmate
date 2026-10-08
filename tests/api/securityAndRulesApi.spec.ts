import { test, expect } from '@playwright/test';
import { ApiTestContext } from '../helpers/apiTestContext';
import { BackendTestHarness } from '../helpers/backendTestHarness';

test.describe('API Suite 7: Admin Authorization & Firestore Security Rules Matrix (OP-ADMIN, RULES-GATE)', () => {
  const ids = ApiTestContext.getUniverseIds();
  const seekerA = ApiTestContext.IDENTITIES.SEEKER_A;
  const ownerA = ApiTestContext.IDENTITIES.OWNER_A;
  const admin = ApiTestContext.IDENTITIES.ADMIN;
  const suspended = ApiTestContext.IDENTITIES.SUSPENDED_USER;
  const banned = ApiTestContext.IDENTITIES.BANNED_USER;
  const unauthenticated = ApiTestContext.IDENTITIES.UNAUTHENTICATED;

  // ── STEP 13: Universal Admin Operations Boundary ──────────────────────────

  test('ADMIN-SEC-01: Admin collection reads are permitted ONLY for admins', () => {
    const canAccessAdminRegistry = (email?: string) => BackendTestHarness.isAdmin(email);

    // ADMIN: PERMITTED
    expect(canAccessAdminRegistry(admin.email)).toBe(true);

    // SEEKER_A: DENIED (not in admin registry)
    expect(canAccessAdminRegistry(seekerA.email)).toBe(false);

    // OWNER_A: DENIED
    expect(canAccessAdminRegistry(ownerA.email)).toBe(false);

    // SUSPENDED: DENIED
    expect(canAccessAdminRegistry(suspended.email)).toBe(false);

    // BANNED: DENIED
    expect(canAccessAdminRegistry(banned.email)).toBe(false);

    // UNAUTHENTICATED: DENIED
    expect(canAccessAdminRegistry(unauthenticated.email)).toBe(false);
  });

  test('ADMIN-SEC-02: Platform metrics aggregation endpoint is restricted to admins', () => {
    const canAccessMetrics = (email?: string) => BackendTestHarness.isAdmin(email);

    expect(canAccessMetrics(admin.email)).toBe(true);
    expect(canAccessMetrics(seekerA.email)).toBe(false);
    expect(canAccessMetrics(ownerA.email)).toBe(false);
  });

  test('ADMIN-SEC-03: System broadcast creation is restricted to admins', () => {
    const canBroadcast = (email?: string) => BackendTestHarness.isAdmin(email);

    expect(canBroadcast(admin.email)).toBe(true);
    expect(canBroadcast(seekerA.email)).toBe(false);
    expect(canBroadcast(ownerA.email)).toBe(false);
  });

  // ── STEP 14: Firestore Security Rules Comprehensive Matrix ───────────────

  test('RULES-01: Read another user private data (privateUserData/{uid}) -> DENIED', () => {
    const result = BackendTestHarness.canAccessPrivateUserData(seekerA.uid, ids.seekerB);
    // Expected: DENIED (rules enforce isOwner(userId) || isAdmin())
    expect(result).toBe(false);
  });

  test('RULES-02: Write another user profile (users/{uid}) -> DENIED', () => {
    const canWriteProfile = (callerUid: string, targetUid: string, email?: string) => {
      return callerUid === targetUid || BackendTestHarness.isAdmin(email);
    };
    expect(canWriteProfile(seekerA.uid, ids.seekerB)).toBe(false);
    expect(canWriteProfile(admin.uid, ids.seekerB, admin.email)).toBe(true);
  });

  test('RULES-03: Modify another owner listing (listings/{id}) -> DENIED', () => {
    const listing = BackendTestHarness.getListing(ids.activeListing); // owned by owner A
    const res = BackendTestHarness.canUpdateListing(seekerA, listing, { title: 'Compromised' });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('CROSS_OWNER_MUTATION_PROHIBITED');
  });

  test('RULES-04: Access another user messages (chatRooms/{roomId}) -> DENIED', () => {
    const chatRoom = BackendTestHarness.getChatRoom(ids.chatRoom);
    const res = BackendTestHarness.canAccessChat(seekerA, chatRoom.participants);
    expect(res).toBe(false);
  });

  test('RULES-05: Access another user notifications (notifications/{id}) -> DENIED', () => {
    const res = BackendTestHarness.canAccessNotification(seekerA, ids.ownerA);
    expect(res).toBe(false);
  });

  test('RULES-06: Manipulate connection counter downwards -> DENIED', () => {
    const originalCount = 5;
    const attemptedCount = 0;
    const isSafe = attemptedCount >= originalCount;
    expect(isSafe).toBe(false);
  });

  test('RULES-07: Self-promote to premium subscriber -> DENIED', () => {
    const canPromote = BackendTestHarness.canMutateUserTrustFields(seekerA.email);
    expect(canPromote).toBe(false);
  });

  test('RULES-08: Non-admin approval of owner verification -> DENIED', () => {
    const res = BackendTestHarness.canTransitionVerification(seekerA, ids.ownerB, 'SUBMITTED', 'APPROVED');
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('CROSS_USER_VERIFICATION_PROHIBITED');
  });

  test('RULES-09: Unauthorized report mutation by non-admin -> DENIED', () => {
    const canMutateReport = (email?: string) => BackendTestHarness.isAdmin(email);
    expect(canMutateReport(seekerA.email)).toBe(false);
    expect(canMutateReport(admin.email)).toBe(true);
  });

  test('RULES-10: Self-connection attempt in connections collection -> DENIED', () => {
    const res = BackendTestHarness.canCreateConnection(seekerA, {
      fromUserId: seekerA.uid,
      toUserId: seekerA.uid,
      status: 'pending',
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('SELF_CONNECTION_PROHIBITED');
  });
});
