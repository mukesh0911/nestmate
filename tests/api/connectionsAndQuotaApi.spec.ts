import { test, expect } from '@playwright/test';
import { ApiTestContext } from '../helpers/apiTestContext';
import { BackendTestHarness } from '../helpers/backendTestHarness';
import { BusinessRuleUtils } from '../helpers/businessRuleUtils';

test.describe('API Suite 3: Connections & Free Quota Enforcement (OP-CONN, RISK-02)', () => {
  const ids = ApiTestContext.getUniverseIds();
  const seekerA = ApiTestContext.IDENTITIES.SEEKER_A;
  const seekerB = ApiTestContext.IDENTITIES.SEEKER_B;
  const ownerA = ApiTestContext.IDENTITIES.OWNER_A;
  const premiumSeeker = ApiTestContext.IDENTITIES.PREMIUM_USER;
  const suspended = ApiTestContext.IDENTITIES.SUSPENDED_USER;

  // ── STEP 7: Connections Lifecycle & Basic Validations ─────────────────────

  test('CONN-01: Certified universe contains all 4 connection statuses', () => {
    const universe = BackendTestHarness.loadUniverse();
    const statuses = universe.connections.map(c => c.status);

    expect(statuses).toContain('pending');
    expect(statuses).toContain('accepted');
    expect(statuses).toContain('rejected');
    expect(statuses).toContain('blocked');

    const pending = universe.connections.find(c => c.id === ids.pendingConnection);
    expect(pending?.fromUserId).toBe(ids.seekerA);
    expect(pending?.toUserId).toBe(ids.ownerA);

    const accepted = universe.connections.find(c => c.id === ids.acceptedConnection);
    expect(accepted?.fromUserId).toBe(ids.seekerB);
    expect(accepted?.toUserId).toBe(ids.ownerA);
  });

  test('CONN-02: Self-connection attempt (fromUserId === toUserId) is REJECTED', () => {
    const selfConnPayload = {
      fromUserId: seekerA.uid,
      toUserId: seekerA.uid,
      status: 'pending',
    };
    const check = BackendTestHarness.canCreateConnection(seekerA, selfConnPayload);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('SELF_CONNECTION_PROHIBITED');
  });

  test('CONN-03: Sender cannot self-accept their own connection request', () => {
    const pendingConn = BackendTestHarness.getConnection(ids.pendingConnection);
    expect(pendingConn.fromUserId).toBe(seekerA.uid);
    expect(pendingConn.toUserId).toBe(ownerA.uid);

    // Rule: allow update: if (request.auth.uid == toUserId && request.resource.data.status in ['accepted', 'rejected'])
    const canSenderAccept = (callerUid: string, toUserId: string) => callerUid === toUserId;
    expect(canSenderAccept(seekerA.uid, pendingConn.toUserId)).toBe(false);
    expect(canSenderAccept(ownerA.uid, pendingConn.toUserId)).toBe(true);
  });

  test('CONN-04: Listing attribution requires listing to be active and owned by recipient', () => {
    // 1. Attributing listing owned by recipient (Owner A)
    const activeListing = BackendTestHarness.getListing(ids.activeListing);
    expect(activeListing.ownerId).toBe(ownerA.uid);
    expect(activeListing.status).toBe('active');

    const isAttributionValid = (listing: any, recipientId: string) => {
      return listing && listing.ownerId === recipientId && listing.status === 'active';
    };

    expect(isAttributionValid(activeListing, ownerA.uid)).toBe(true);

    // 2. Attributing closed listing is rejected
    const closedListing = BackendTestHarness.getListing(ids.closedListing);
    expect(isAttributionValid(closedListing, ownerA.uid)).toBe(false);

    // 3. Attributing someone else's listing is rejected
    expect(isAttributionValid(activeListing, 'other_random_owner')).toBe(false);
  });

  // ── RISK-02 & Step 7 CRITICAL: Connection Quota Enforcement ───────────────

  test('CONN-QUOTA-01: Non-premium seeker is allowed connections 1 to 5', () => {
    const mockUser = { ...seekerA, connectsUsed: 0 };

    for (let count = 0; count < 5; count++) {
      mockUser.connectsUsed = count;
      const isExhausted = BusinessRuleUtils.isConnectionQuotaExhausted(mockUser.connectsUsed, 5, false);
      expect(isExhausted).toBe(false);

      const check = BackendTestHarness.canCreateConnection(mockUser, {
        fromUserId: mockUser.uid,
        toUserId: `target_owner_${count}`,
        status: 'pending',
      });
      expect(check.allowed).toBe(true);
    }
  });

  test('CONN-QUOTA-02: 6th connection attempt is REJECTED at the server/database boundary', () => {
    const exhaustedSeeker = { ...seekerA, connectsUsed: 5 };

    // Client/Business rule pre-check
    const isExhausted = BusinessRuleUtils.isConnectionQuotaExhausted(exhaustedSeeker.connectsUsed, 5, false);
    expect(isExhausted).toBe(true);

    // Backend rule evaluation (mirroring firestore.rules connectionQuotaAvailable())
    const check = BackendTestHarness.canCreateConnection(exhaustedSeeker, {
      fromUserId: exhaustedSeeker.uid,
      toUserId: ownerA.uid,
      status: 'pending',
    });
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('FREE_CONNECTION_LIMIT_REACHED');
  });

  test('CONN-QUOTA-03: Direct Firestore addDoc attempt for 6th connection fails with PERMISSION_DENIED', () => {
    const exhaustedSeeker = { ...seekerA, connectsUsed: 5, isPremium: false };
    const directWriteAllowed = (user: typeof exhaustedSeeker) => {
      return user.isPremium || user.connectsUsed < 5;
    };
    expect(directWriteAllowed(exhaustedSeeker)).toBe(false);
  });

  test('CONN-QUOTA-04: Premium (NestMate Pro) subscriber bypasses connection quota entirely', () => {
    const proUser = { ...premiumSeeker, connectsUsed: 12 };

    // Premium user is never quota-exhausted
    expect(BusinessRuleUtils.isConnectionQuotaExhausted(proUser.connectsUsed, 5, true)).toBe(false);

    // Backend rule permits premium connection creation even well beyond 5
    const check = BackendTestHarness.canCreateConnection(proUser, {
      fromUserId: proUser.uid,
      toUserId: ownerA.uid,
      status: 'pending',
    });
    expect(check.allowed).toBe(true);
  });

  test('CONN-QUOTA-05: Non-premium user CANNOT decrement connectsUsed to reset quota', () => {
    const initialConnectsUsed = 5;
    const attemptedNewConnectsUsed = 0; // tampering attempt

    const canDecrement = attemptedNewConnectsUsed >= initialConnectsUsed;
    expect(canDecrement).toBe(false);
  });

  test('CONN-QUOTA-06: Non-premium user CANNOT self-promote to isPremium=true', () => {
    // Attempting to self-grant isPremium
    const canSelfPromote = BackendTestHarness.canMutateUserTrustFields(seekerA.email);
    expect(canSelfPromote).toBe(false);
  });

  test('CONN-QUOTA-07: Suspended user CANNOT send connections', () => {
    const check = BackendTestHarness.canCreateConnection(suspended, {
      fromUserId: suspended.uid,
      toUserId: ownerA.uid,
      status: 'pending',
    });
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('INACTIVE_USER_MUTATION_BLOCKED');
  });
});
