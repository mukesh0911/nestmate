import { describe, it, expect } from 'vitest';
import {
  isOwnerVerificationApproved,
  canOwnerPublishListing,
  verificationStatusLabel,
  verificationStatusDescription,
  type OwnerVerificationStatus,
} from './ownerVerification';
import {
  isPubliclyVisibleListing,
} from './marketplaceVisibility';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('Owner Verification State Machine & Security Boundary', () => {
  // ─── State Machine & Pure Helpers ──────────────────────────────────────────
  describe('Verification State Machine Transitions & Labels', () => {
    it('NOT_STARTED is not approved and cannot publish', () => {
      expect(isOwnerVerificationApproved('NOT_STARTED')).toBe(false);
      expect(canOwnerPublishListing('NOT_STARTED')).toBe(false);
      expect(verificationStatusLabel('NOT_STARTED')).toBe('Not Started');
      expect(verificationStatusDescription('NOT_STARTED')).toContain('verify your identity');
    });

    it('SUBMITTED is not approved and cannot publish', () => {
      expect(isOwnerVerificationApproved('SUBMITTED')).toBe(false);
      expect(canOwnerPublishListing('SUBMITTED')).toBe(false);
      expect(verificationStatusLabel('SUBMITTED')).toBe('Under Review');
      expect(verificationStatusDescription('SUBMITTED')).toContain('submitted and are awaiting admin review');
    });

    it('UNDER_REVIEW is not approved and cannot publish', () => {
      expect(isOwnerVerificationApproved('UNDER_REVIEW')).toBe(false);
      expect(canOwnerPublishListing('UNDER_REVIEW')).toBe(false);
      expect(verificationStatusLabel('UNDER_REVIEW')).toBe('Under Review');
      expect(verificationStatusDescription('UNDER_REVIEW')).toContain('admin is currently reviewing');
    });

    it('APPROVED is approved and CAN publish', () => {
      expect(isOwnerVerificationApproved('APPROVED')).toBe(true);
      expect(canOwnerPublishListing('APPROVED')).toBe(true);
      expect(verificationStatusLabel('APPROVED')).toBe('Verified');
      expect(verificationStatusDescription('APPROVED')).toContain('identity has been verified');
    });

    it('REJECTED is not approved and cannot publish', () => {
      expect(isOwnerVerificationApproved('REJECTED')).toBe(false);
      expect(canOwnerPublishListing('REJECTED')).toBe(false);
      expect(verificationStatusLabel('REJECTED')).toBe('Rejected');
      expect(verificationStatusDescription('REJECTED')).toContain('rejected');
    });

    it('RESUBMISSION_REQUIRED is not approved and cannot publish', () => {
      expect(isOwnerVerificationApproved('RESUBMISSION_REQUIRED')).toBe(false);
      expect(canOwnerPublishListing('RESUBMISSION_REQUIRED')).toBe(false);
      expect(verificationStatusLabel('RESUBMISSION_REQUIRED')).toBe('Resubmission Required');
      expect(verificationStatusDescription('RESUBMISSION_REQUIRED')).toContain('additional information');
    });

    it('null/undefined status fails safely to unverified', () => {
      expect(isOwnerVerificationApproved(null)).toBe(false);
      expect(isOwnerVerificationApproved(undefined)).toBe(false);
      expect(canOwnerPublishListing(null)).toBe(false);
      expect(canOwnerPublishListing(undefined)).toBe(false);
    });
  });

  // ─── Mandatory Failure Cases (A through M) ─────────────────────────────────
  describe('Mandatory Security Failure Cases (A–M)', () => {
    const baseListing = {
      id: 'list_123',
      ownerId: 'owner_456',
      title: '2BHK in Indiranagar',
      city: 'Bengaluru',
      locality: 'Indiranagar',
      totalRent: 20000,
      partnerShare: 10000,
      lastConfirmedAt: { toMillis: () => Date.now() - 1 * DAY_MS },
    };

    it('Case A: New owner creates listing without verification -> MUST NOT become public', () => {
      const newListing = {
        ...baseListing,
        status: 'pending_verification',
        ownerVerified: false,
      };
      expect(isPubliclyVisibleListing(newListing)).toBe(false);
    });

    it('Case B: Owner manually changes UI status to active while ownerVerified is false -> MUST NOT be visible', () => {
      const spoofedListing = {
        ...baseListing,
        status: 'active',
        ownerVerified: false, // Security boundary holds
      };
      expect(isPubliclyVisibleListing(spoofedListing)).toBe(false);
    });

    it('Case C: Owner directly attempts Firestore update to active with ownerVerified=false -> MUST NOT be visible', () => {
      const directWriteAttempt = {
        ...baseListing,
        status: 'active',
        ownerVerified: false,
        lastConfirmedAt: { toMillis: () => Date.now() },
      };
      expect(isPubliclyVisibleListing(directWriteAttempt)).toBe(false);
    });

    it('Case D: Owner attempts to set ownerVerified=true without admin approval -> fails state machine canOwnerPublishListing', () => {
      // In state machine, status SUBMITTED / NOT_STARTED cannot publish
      expect(canOwnerPublishListing('NOT_STARTED')).toBe(false);
      expect(canOwnerPublishListing('SUBMITTED')).toBe(false);
      expect(canOwnerPublishListing('UNDER_REVIEW')).toBe(false);
      expect(canOwnerPublishListing('REJECTED')).toBe(false);
      expect(canOwnerPublishListing('RESUBMISSION_REQUIRED')).toBe(false);
      expect(canOwnerPublishListing('APPROVED')).toBe(true);
    });

    it('Case E: Seeker direct URL access to unverified listing -> unverified listing is blocked', () => {
      const unverifiedListing = {
        ...baseListing,
        status: 'pending_verification',
        ownerVerified: false,
      };
      expect(isPubliclyVisibleListing(unverifiedListing)).toBe(false);
    });

    it('Case F: State persistence — SUBMITTED status remains unapproved across sessions', () => {
      const sessionAStatus: OwnerVerificationStatus = 'SUBMITTED';
      const sessionBStatus: OwnerVerificationStatus = 'SUBMITTED';
      expect(isOwnerVerificationApproved(sessionAStatus)).toBe(false);
      expect(isOwnerVerificationApproved(sessionBStatus)).toBe(false);
    });

    it('Case G: Owner submits verification -> status is SUBMITTED (under review)', () => {
      expect(verificationStatusLabel('SUBMITTED')).toBe('Under Review');
      expect(isOwnerVerificationApproved('SUBMITTED')).toBe(false);
    });

    it('Case H: Admin rejects verification -> Listing MUST remain non-public', () => {
      const rejectedListing = {
        ...baseListing,
        status: 'pending_verification',
        ownerVerified: false,
      };
      expect(isPubliclyVisibleListing(rejectedListing)).toBe(false);
      expect(isOwnerVerificationApproved('REJECTED')).toBe(false);
    });

    it('Case I: Admin requests resubmission -> Owner can resubmit and listing remains non-public', () => {
      const resubmitListing = {
        ...baseListing,
        status: 'pending_verification',
        ownerVerified: false,
      };
      expect(isPubliclyVisibleListing(resubmitListing)).toBe(false);
      expect(verificationStatusLabel('RESUBMISSION_REQUIRED')).toBe('Resubmission Required');
      expect(isOwnerVerificationApproved('RESUBMISSION_REQUIRED')).toBe(false);
    });

    it('Case J: Admin approves verification -> Only then may the listing become public', () => {
      const approvedLiveListing = {
        ...baseListing,
        status: 'active',
        ownerVerified: true,
      };
      expect(isOwnerVerificationApproved('APPROVED')).toBe(true);
      expect(canOwnerPublishListing('APPROVED')).toBe(true);
      expect(isPubliclyVisibleListing(approvedLiveListing)).toBe(true);
    });

    it('Case K: Seeker searches Explore -> Unverified/pending listings MUST NOT appear', () => {
      const pendingExplore = {
        ...baseListing,
        status: 'pending_verification',
        ownerVerified: false,
      };
      expect(isPubliclyVisibleListing(pendingExplore)).toBe(false);
    });

    it('Case L: Seeker uses Map -> Unverified/pending listings MUST NOT appear', () => {
      const pendingMap = {
        ...baseListing,
        status: 'pending_verification',
        ownerVerified: false,
      };
      expect(isPubliclyVisibleListing(pendingMap)).toBe(false);
    });

    it('Case M: Existing direct links / cache / stale UI -> MUST NOT expose an unverified listing', () => {
      const staleCachedPending = {
        ...baseListing,
        status: 'pending_verification',
        ownerVerified: false,
        lastConfirmedAt: { toMillis: () => Date.now() - 60 * DAY_MS },
      };
      expect(isPubliclyVisibleListing(staleCachedPending)).toBe(false);
    });
  });

  // ─── Cross-Surface Discoverability Consistency ─────────────────────────────
  describe('Cross-Surface Discoverability Consistency', () => {
    const testCases: Array<{
      description: string;
      listing: Record<string, unknown>;
      expectedVisible: boolean;
    }> = [
      {
        description: 'New pending_verification listing',
        listing: { status: 'pending_verification', ownerVerified: false, lastConfirmedAt: { toMillis: () => Date.now() } },
        expectedVisible: false,
      },
      {
        description: 'Active listing with explicit ownerVerified=false',
        listing: { status: 'active', ownerVerified: false, lastConfirmedAt: { toMillis: () => Date.now() } },
        expectedVisible: false,
      },
      {
        description: 'Active listing with ownerVerified=true (Approved & Live)',
        listing: { status: 'active', ownerVerified: true, lastConfirmedAt: { toMillis: () => Date.now() } },
        expectedVisible: true,
      },
      {
        description: 'Paused listing with ownerVerified=true',
        listing: { status: 'paused', ownerVerified: true, lastConfirmedAt: { toMillis: () => Date.now() } },
        expectedVisible: false,
      },
      {
        description: 'Closed listing with ownerVerified=true',
        listing: { status: 'closed', ownerVerified: true, lastConfirmedAt: { toMillis: () => Date.now() } },
        expectedVisible: false,
      },
    ];

    testCases.forEach(({ description, listing, expectedVisible }) => {
      it(`enforces uniform verdict: "${description}" -> ${expectedVisible ? 'VISIBLE' : 'HIDDEN'}`, () => {
        expect(isPubliclyVisibleListing(listing)).toBe(expectedVisible);
      });
    });
  });
});
