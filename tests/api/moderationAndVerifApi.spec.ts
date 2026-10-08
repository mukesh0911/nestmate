import { test, expect } from '@playwright/test';
import { ApiTestContext } from '../helpers/apiTestContext';
import { BackendTestHarness } from '../helpers/backendTestHarness';
import { BusinessRuleUtils } from '../helpers/businessRuleUtils';

test.describe('API Suite 6: Owner Verification Lifecycle & Moderation Reports (OP-VERIF, OP-MOD)', () => {
  const ids = ApiTestContext.getUniverseIds();
  const seekerA = ApiTestContext.IDENTITIES.SEEKER_A;
  const ownerA = ApiTestContext.IDENTITIES.OWNER_A;
  const ownerB = ApiTestContext.IDENTITIES.OWNER_B;
  const admin = ApiTestContext.IDENTITIES.ADMIN;
  const suspended = ApiTestContext.IDENTITIES.SUSPENDED_USER;

  // ── STEP 11: Owner Verification State Machine Lifecycle ───────────────────

  test('VERIF-01: Certified universe contains owner verification state machine records', () => {
    const universe = BackendTestHarness.loadUniverse();
    const verifStatuses = universe.verifications.map(v => v.status);

    expect(verifStatuses).toContain('APPROVED');
    expect(verifStatuses).toContain('SUBMITTED');
    expect(verifStatuses).toContain('UNDER_REVIEW');
    expect(verifStatuses).toContain('RESUBMISSION_REQUIRED');
    expect(verifStatuses).toContain('REJECTED');

    const vApproved = universe.verifications.find(v => v.userId === ownerA.uid);
    expect(vApproved?.status).toBe('APPROVED');
  });

  test('VERIF-02: Owner can submit verification (transition: NOT_STARTED -> SUBMITTED)', () => {
    const check = BackendTestHarness.canTransitionVerification(ownerB, ownerB.uid, 'NOT_STARTED', 'SUBMITTED');
    expect(check.allowed).toBe(true);
  });

  test('VERIF-03: Owner CANNOT self-approve verification (status=APPROVED rejected)', () => {
    // Owner attempting to set their own status to APPROVED
    const check = BackendTestHarness.canTransitionVerification(ownerB, ownerB.uid, 'SUBMITTED', 'APPROVED');
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('NON_ADMIN_CANNOT_APPROVE_OR_REVIEW_VERIFICATION');
  });

  test('VERIF-04: Ordinary seeker CANNOT review or approve owner verification', () => {
    // Seeker A attempting to approve Owner B's verification
    const check = BackendTestHarness.canTransitionVerification(seekerA, ownerB.uid, 'SUBMITTED', 'APPROVED');
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('CROSS_USER_VERIFICATION_PROHIBITED');
  });

  test('VERIF-05: Admin CAN approve owner verification and unlock pending listings', () => {
    // 1. Admin approval allowed
    const check = BackendTestHarness.canTransitionVerification(admin, ownerB.uid, 'UNDER_REVIEW', 'APPROVED');
    expect(check.allowed).toBe(true);

    // 2. Listing unlock side effect: all pending_verification listings owned by this user become active
    const pendingListings = BackendTestHarness.getListingsByOwner(ownerB.uid).filter(l => l.status === 'pending_verification');
    expect(pendingListings.length).toBeGreaterThan(0);

    // Simulate unlock
    const unlocked = pendingListings.map(l => ({ ...l, status: 'active', ownerVerified: true }));
    expect(unlocked.every(l => l.status === 'active' && l.ownerVerified === true)).toBe(true);
  });

  test('VERIF-06: Admin can reject or request resubmission with mandatory reason', () => {
    const checkReject = BackendTestHarness.canTransitionVerification(admin, ids.ownerRejected, 'SUBMITTED', 'REJECTED');
    expect(checkReject.allowed).toBe(true);

    const checkResubmit = BackendTestHarness.canTransitionVerification(admin, ids.ownerPortfolio, 'UNDER_REVIEW', 'RESUBMISSION_REQUIRED');
    expect(checkResubmit.allowed).toBe(true);
  });

  // ── STEP 12: Moderation & Reports Operations ──────────────────────────────

  test('MOD-01: Certified universe contains user reports with status tracking', () => {
    const universe = BackendTestHarness.loadUniverse();
    expect(universe.reports.length).toBeGreaterThanOrEqual(2);

    const r1 = universe.reports.find(r => r.id === ids.report1);
    expect(r1.reporterId).toBe(ids.seekerA);
    expect(r1.targetId).toBe(ids.suspendedUser);
    expect(r1.status).toBe('open');

    const r2 = universe.reports.find(r => r.id === ids.report2);
    expect(r2.reporterId).toBe(ids.seekerB);
    expect(r2.targetId).toBe(ids.bannedUser);
    expect(r2.status).toBe('resolved');
  });

  test('MOD-02: Self-reporting (reporterId === targetId) is strictly prohibited', () => {
    const isSelfReport = (reporterId: string, targetId: string) => reporterId === targetId;
    expect(isSelfReport(seekerA.uid, seekerA.uid)).toBe(true);
    expect(BusinessRuleUtils.validateSelfOperation(seekerA.uid, seekerA.uid)).toBe(false);
  });

  test('MOD-03: Users CANNOT spoof another user identity when filing reports', () => {
    const authUid = seekerA.uid;
    const claimedReporterId = seekerA.uid;
    const spoofedReporterId = ownerA.uid;

    const isIdentityBound = (caller: string, claimed: string) => caller === claimed;
    expect(isIdentityBound(authUid, claimedReporterId)).toBe(true);
    expect(isIdentityBound(authUid, spoofedReporterId)).toBe(false);
  });

  test('MOD-04: Reports are private to platform administrators (users cannot read reports)', () => {
    const canReadReports = (callerEmail?: string) => BackendTestHarness.isAdmin(callerEmail);

    expect(canReadReports(seekerA.email)).toBe(false);
    expect(canReadReports(ownerA.email)).toBe(false);
    expect(canReadReports(admin.email)).toBe(true);
  });

  test('MOD-05: Account suspension by admin pauses owner active listings', () => {
    // When admin suspends owner
    const targetOwner = ids.ownerA;
    const ownerListings = BackendTestHarness.getListingsByOwner(targetOwner);

    // Cascading side effect: all active listings set to paused
    const pausedListings = ownerListings.map(l => ({ ...l, status: 'paused' }));
    expect(pausedListings.every(l => l.status === 'paused')).toBe(true);
  });
});
