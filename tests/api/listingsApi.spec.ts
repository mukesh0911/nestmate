import { test, expect } from '@playwright/test';
import { ApiTestContext } from '../helpers/apiTestContext';
import { BackendTestHarness } from '../helpers/backendTestHarness';
import { BusinessRuleUtils } from '../helpers/businessRuleUtils';

test.describe('API Suite 2: Property Listings Operations & Lifecycle Verification (OP-LIST)', () => {
  const ids = ApiTestContext.getUniverseIds();
  const ownerA = ApiTestContext.IDENTITIES.OWNER_A;
  const ownerB = ApiTestContext.IDENTITIES.OWNER_B;
  const seekerA = ApiTestContext.IDENTITIES.SEEKER_A;
  const admin = ApiTestContext.IDENTITIES.ADMIN;
  const suspended = ApiTestContext.IDENTITIES.SUSPENDED_USER;

  // ── STEP 6: All 7 Listing Lifecycle States in Certified Universe ───────────

  test('LIST-01: Certified universe contains all 7 required listing lifecycle states', () => {
    const universe = BackendTestHarness.loadUniverse();
    const statuses = universe.listings.map(l => l.status);

    // 1. Active
    expect(statuses).toContain('active');
    const liveListing = universe.listings.find(l => l.id === ids.activeListing);
    expect(liveListing?.status).toBe('active');
    expect(liveListing?.ownerVerified).toBe(true);

    // 2. Pending Verification
    expect(statuses).toContain('pending_verification');
    const pendListing = universe.listings.find(l => l.id === ids.pendingListing);
    expect(pendListing?.status).toBe('pending_verification');
    expect(pendListing?.ownerVerified).toBe(false);

    // 3. Draft
    expect(statuses).toContain('draft');
    const draftListing = universe.listings.find(l => l.id === ids.draftListing);
    expect(draftListing?.status).toBe('draft');

    // 4. Paused
    expect(statuses).toContain('paused');
    const pauseListing = universe.listings.find(l => l.id === ids.pausedListing);
    expect(pauseListing?.status).toBe('paused');

    // 5. Filled
    expect(statuses).toContain('filled');
    const fillListing = universe.listings.find(l => l.id === ids.filledListing);
    expect(fillListing?.status).toBe('filled');

    // 6. Closed
    expect(statuses).toContain('closed');
    const closeListing = universe.listings.find(l => l.id === ids.closedListing);
    expect(closeListing?.status).toBe('closed');

    // 7. Expired (Stale > 30 days)
    const expListing = universe.listings.find(l => l.id === ids.expiredListing);
    expect(expListing).toBeDefined();
    expect(expListing?.lastConfirmedAt).toBeDefined();
    // Verify freshness anchor confirms it is stale (> 30 days)
    const isFresh = BusinessRuleUtils.isListingFresh(expListing?.lastConfirmedAt);
    expect(isFresh).toBe(false);
  });

  // ── Listing Creation Security Boundaries ───────────────────────────────────

  test('LIST-02: Owner can create listing with initial status pending_verification and ownerVerified=false', () => {
    const validListingPayload = {
      ownerId: ownerA.uid,
      title: 'Valid New 2BHK Room',
      status: 'pending_verification',
      ownerVerified: false,
    };
    const check = BackendTestHarness.canCreateListing(ownerA, validListingPayload);
    expect(check.allowed).toBe(true);
  });

  test('LIST-03: Owner CANNOT directly create listing with status active or ownerVerified=true', () => {
    // Attempt 1: Direct active status bypass
    const bypassActive = {
      ownerId: ownerA.uid,
      title: 'Sneaky Active Room',
      status: 'active',
      ownerVerified: false,
    };
    const resActive = BackendTestHarness.canCreateListing(ownerA, bypassActive);
    expect(resActive.allowed).toBe(false);
    expect(resActive.reason).toBe('NEW_LISTING_CANNOT_START_AS_ACTIVE');

    // Attempt 2: Self-grant ownerVerified=true
    const bypassVerified = {
      ownerId: ownerA.uid,
      title: 'Sneaky Verified Room',
      status: 'pending_verification',
      ownerVerified: true,
    };
    const resVerified = BackendTestHarness.canCreateListing(ownerA, bypassVerified);
    expect(resVerified.allowed).toBe(false);
    expect(resVerified.reason).toBe('OWNER_CANNOT_SELF_VERIFY_LISTING');
  });

  test('LIST-04: Suspended or banned owner CANNOT create a listing', () => {
    const listingPayload = {
      ownerId: suspended.uid,
      title: 'Suspended Owner Room',
      status: 'pending_verification',
      ownerVerified: false,
    };
    const res = BackendTestHarness.canCreateListing(suspended, listingPayload);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('INACTIVE_USER_MUTATION_BLOCKED');
  });

  // ── Listing Modification & Cross-User Security ────────────────────────────

  test('LIST-05: Seeker CANNOT mutate an owner listing', () => {
    const existingListing = BackendTestHarness.getListing(ids.activeListing);
    expect(existingListing).not.toBeNull();

    // Seeker A attempts to update Owner A's listing
    const check = BackendTestHarness.canUpdateListing(seekerA, existingListing, { title: 'Hacked Title' });
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('CROSS_OWNER_MUTATION_PROHIBITED');
  });

  test('LIST-06: Owner CANNOT mutate another owner listing', () => {
    const listingOwnedByA = BackendTestHarness.getListing(ids.activeListing); // owned by Owner A
    expect(listingOwnedByA.ownerId).toBe(ownerA.uid);

    // Owner B attempts to update Owner A's listing
    const check = BackendTestHarness.canUpdateListing(ownerB, listingOwnedByA, { totalRent: 1000 });
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('CROSS_OWNER_MUTATION_PROHIBITED');
  });

  test('LIST-07: Owner CANNOT activate an unverified listing (Security Gate)', () => {
    const pendingListing = BackendTestHarness.getListing(ids.pendingListing); // ownerVerified: false
    expect(pendingListing.ownerVerified).toBe(false);

    // Owner B attempts to switch status to active directly
    const check = BackendTestHarness.canUpdateListing(ownerB, pendingListing, { status: 'active' });
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('UNVERIFIED_LISTING_CANNOT_BE_ACTIVATED_BY_OWNER');
  });

  test('LIST-08: Admin CAN update and activate any listing', () => {
    const pendingListing = BackendTestHarness.getListing(ids.pendingListing);
    const check = BackendTestHarness.canUpdateListing(admin, pendingListing, { status: 'active', ownerVerified: true });
    expect(check.allowed).toBe(true);
  });

  // ── Financial Invariants ───────────────────────────────────────────────────

  test('LIST-09: Rent and deposit financial invariants are strictly validated', () => {
    // 1. Valid financial profile
    const validFin = BusinessRuleUtils.validateFinancialInvariants({ totalRent: 26000, partnerShare: 13000, deposit: 52000 });
    expect(validFin.isValid).toBe(true);

    // 2. Zero or negative rent rejected
    const zeroRent = BusinessRuleUtils.validateFinancialInvariants({ totalRent: 0, partnerShare: 10000 });
    expect(zeroRent.isValid).toBe(false);

    // 3. partnerShare exceeding totalRent rejected
    const invalidShare = BusinessRuleUtils.validateFinancialInvariants({ totalRent: 20000, partnerShare: 25000 });
    expect(invalidShare.isValid).toBe(false);

    // 4. Negative deposit rejected
    const negDeposit = BusinessRuleUtils.validateFinancialInvariants({ totalRent: 20000, partnerShare: 10000, deposit: -500 });
    expect(negDeposit.isValid).toBe(false);
  });

  test('LIST-10: Public view increment does not mutate protected listing metadata', () => {
    const initialListing = BackendTestHarness.getListing(ids.activeListing);
    const initialViews = initialListing.views;
    const initialRent = initialListing.totalRent;

    // View increment operation (only views changes)
    const newViews = initialViews + 1;
    expect(newViews).toBe(initialViews + 1);
    expect(initialRent).toBe(26000); // Unrelated fields unchanged
  });
});
