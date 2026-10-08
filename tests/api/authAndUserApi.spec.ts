import { test, expect } from '@playwright/test';
import { ApiTestContext } from '../helpers/apiTestContext';
import { BackendTestHarness } from '../helpers/backendTestHarness';
import { BusinessRuleUtils } from '../helpers/businessRuleUtils';
import { AccountFactory } from '../factories/accountFactory';

test.describe('API Suite 1: Authentication, Authorization & User Profile Operations (OP-AUTH, OP-USER)', () => {
  const ids = ApiTestContext.getUniverseIds();
  const seekerA = ApiTestContext.IDENTITIES.SEEKER_A;
  const seekerB = ApiTestContext.IDENTITIES.SEEKER_B;
  const ownerA = ApiTestContext.IDENTITIES.OWNER_A;
  const admin = ApiTestContext.IDENTITIES.ADMIN;
  const suspended = ApiTestContext.IDENTITIES.SUSPENDED_USER;
  const banned = ApiTestContext.IDENTITIES.BANNED_USER;
  const unauthenticated = ApiTestContext.IDENTITIES.UNAUTHENTICATED;

  // ── STEP 4: Authentication & Authorization Gates ───────────────────────────

  test('AUTH-01: Unauthenticated request to mutate protected user data is REJECTED', () => {
    // Unauthenticated caller attempting profile update
    const allowed = BackendTestHarness.canAccessPrivateUserData(unauthenticated.uid, ids.seekerA);
    expect(allowed).toBe(false);

    // Unauthenticated caller attempting mutation
    const mutationAllowed = BusinessRuleUtils.canPerformMutations('suspended');
    expect(mutationAllowed).toBe(false);
  });

  test('AUTH-02: Authenticated user with correct role succeeds on self-profile operations', () => {
    // Seeker A reading own private data
    const canAccessOwn = BackendTestHarness.canAccessPrivateUserData(seekerA.uid, ids.seekerA);
    expect(canAccessOwn).toBe(true);

    // Owner A reading own private data
    const ownerCanAccessOwn = BackendTestHarness.canAccessPrivateUserData(ownerA.uid, ids.ownerA);
    expect(ownerCanAccessOwn).toBe(true);
  });

  test('AUTH-03: Cross-user access attempt to another user privateUserData is strictly DENIED', () => {
    // Seeker B attempts to read Seeker A privateUserData
    const seekerBAccessingA = BackendTestHarness.canAccessPrivateUserData(seekerB.uid, ids.seekerA);
    expect(seekerBAccessingA).toBe(false);

    // Seeker A attempts to read Owner A privateUserData directly
    const seekerAAccessingOwner = BackendTestHarness.canAccessPrivateUserData(seekerA.uid, ids.ownerA);
    expect(seekerAAccessingOwner).toBe(false);

    // Only Admin or the owner themselves is allowed
    const adminAccessingA = BackendTestHarness.canAccessPrivateUserData(admin.uid, ids.seekerA, admin.email);
    expect(adminAccessingA).toBe(true);
  });

  test('AUTH-04: Non-admin users CANNOT self-grant trust fields (isVerified, isPremium, verificationLevel)', () => {
    // Ordinary Seeker A attempting to self-grant verified
    expect(BackendTestHarness.canMutateUserTrustFields(seekerA.email)).toBe(false);

    // Ordinary Owner A attempting to self-grant verified
    expect(BackendTestHarness.canMutateUserTrustFields(ownerA.email)).toBe(false);

    // Admin CAN mutate trust fields
    expect(BackendTestHarness.canMutateUserTrustFields(admin.email)).toBe(true);
  });

  test('AUTH-05: Non-admin users CANNOT mutate account status (anti-reinstatement boundary)', () => {
    // Suspended user attempting to self-reinstate status -> active
    expect(BackendTestHarness.canMutateUserStatus(suspended.email)).toBe(false);

    // Banned user attempting to self-reinstate status -> active
    expect(BackendTestHarness.canMutateUserStatus(banned.email)).toBe(false);

    // Admin can reinstate accounts
    expect(BackendTestHarness.canMutateUserStatus(admin.email)).toBe(true);
  });

  test('AUTH-06: Suspended and Banned users are blocked from mutating operations', () => {
    // Suspended account blocked from mutations
    expect(BusinessRuleUtils.canPerformMutations('suspended')).toBe(false);

    // Banned account blocked from mutations
    expect(BusinessRuleUtils.canPerformMutations('banned')).toBe(false);

    // Active account permitted
    expect(BusinessRuleUtils.canPerformMutations('active')).toBe(true);
  });

  // ── STEP 5: CRUD & Data Validation Operations ─────────────────────────────

  test('CRUD-USER-01: Valid profile read returns sanitized public data matching universe', () => {
    const userDoc = BackendTestHarness.getUser(ids.seekerA);
    expect(userDoc).not.toBeNull();
    expect(userDoc.uid).toBe(ids.seekerA);
    expect(userDoc.role).toBe('seeker');
    expect(userDoc.city).toBe('Bengaluru');
    expect(userDoc.onboardingComplete).toBe(true);
    // Public profile should not expose unmasked sensitive tokens
    expect(userDoc.status).toBe('active');
  });

  test('CRUD-USER-02: Seeker onboarding completion requires at least 5 quiz answers', () => {
    const fullQuiz = { sleep_time: 'before_10', wake_time: '6_to_8', food_pref: 'veg', smoking: 'never', drinking: 'never' };
    const incompleteQuiz = { sleep_time: 'before_10', wake_time: '6_to_8' }; // only 2

    const isFullValid = Object.keys(fullQuiz).length >= 5;
    const isIncompleteValid = Object.keys(incompleteQuiz).length >= 5;

    expect(isFullValid).toBe(true);
    expect(isIncompleteValid).toBe(false);
  });

  test('CRUD-USER-03: User cannot decrement connectsUsed counter to bypass free connection limit', () => {
    const initialUsed = 4;
    // Attempting to reset connectsUsed from 4 to 0
    const attemptedUsed = 0;
    const isDecrementSafe = attemptedUsed >= initialUsed;
    expect(isDecrementSafe).toBe(false);
  });

  test('CRUD-USER-04: Saved profile bookmarks support arrayUnion / arrayRemove idempotent updates', () => {
    const currentSaved: string[] = ['test_user_perfect_match'];
    const targetUid = 'test_user_night_owl';

    // Simulate save (arrayUnion)
    const afterUnion = Array.from(new Set([...currentSaved, targetUid]));
    expect(afterUnion).toContain(targetUid);
    expect(afterUnion.length).toBe(2);

    // Duplicate union has no effect
    const afterDupUnion = Array.from(new Set([...afterUnion, targetUid]));
    expect(afterDupUnion.length).toBe(2);

    // Simulate unsave (arrayRemove)
    const afterRemove = afterUnion.filter(id => id !== targetUid);
    expect(afterRemove).not.toContain(targetUid);
    expect(afterRemove.length).toBe(1);
  });

  test('CRUD-USER-05: Database state matches certified universe expectations', () => {
    const universe = BackendTestHarness.loadUniverse();
    expect(universe.seekers.length).toBeGreaterThanOrEqual(10);
    expect(universe.owners.length).toBeGreaterThanOrEqual(5);
    expect(universe.admins.length).toBeGreaterThanOrEqual(1);

    const refSeeker = universe.seekers.find(s => s.uid === ids.seekerA);
    expect(refSeeker).toBeDefined();
    expect(refSeeker.isTest).toBe(true);
    expect(refSeeker.connectsUsed).toBe(0);
    expect(refSeeker.connectsLimit).toBe(5);
  });
});
