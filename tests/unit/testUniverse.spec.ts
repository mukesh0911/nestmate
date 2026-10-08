import { test, expect } from '@playwright/test';
import { AccountFactory } from '../factories/accountFactory';
import { DataFactory } from '../factories/dataFactory';
import { BusinessRuleUtils } from '../helpers/businessRuleUtils';
import { buildDeterministicTestUniverse } from '../data/seedDataUniverse';

test.describe('NestMate Test Universe Foundation Certification', () => {
  test('1. Test Account Factory instantiates all roles and states', () => {
    const seeker = AccountFactory.createSeeker('s1');
    expect(seeker.role).toBe('seeker');
    expect(seeker.status).toBe('active');
    expect(seeker.onboardingComplete).toBe(true);
    expect(seeker.quizAnswers.food_pref).toBeDefined();

    const owner = AccountFactory.createOwner('o1');
    expect(owner.role).toBe('owner');
    expect(owner.status).toBe('active');
    expect(owner.isVerified).toBe(true);

    const admin = AccountFactory.createAdmin('a1');
    expect(admin.email).toBe('admin@nestmate-test.com');
    expect(BusinessRuleUtils.isAdminEmail(admin.email)).toBe(true);

    const incomplete = AccountFactory.createIncompleteUser('inc');
    expect(incomplete.onboardingComplete).toBe(false);
    expect(incomplete.role).toBeNull();

    const suspended = AccountFactory.createSuspendedUser('susp');
    expect(suspended.status).toBe('suspended');
    expect(BusinessRuleUtils.canPerformMutations(suspended.status)).toBe(false);

    const banned = AccountFactory.createBannedUser('ban');
    expect(banned.status).toBe('banned');
    expect(BusinessRuleUtils.canPerformMutations(banned.status)).toBe(false);
  });

  test('2. Listing Factory generates all 7 lifecycle states adhering to financial invariants', () => {
    const active = DataFactory.createActiveListing('act');
    const pending = DataFactory.createPendingListing('pend');
    const draft = DataFactory.createDraftListing('draft');
    const paused = DataFactory.createPausedListing('pause');
    const filled = DataFactory.createFilledListing('fill');
    const closed = DataFactory.createClosedListing('close');
    const expired = DataFactory.createExpiredListing('exp');

    expect(active.status).toBe('active');
    expect(active.ownerVerified).toBe(true);
    expect(BusinessRuleUtils.isListingFresh(active.lastConfirmedAt)).toBe(true);

    expect(pending.status).toBe('pending_verification');
    expect(pending.ownerVerified).toBe(false);

    expect(draft.status).toBe('draft');
    expect(paused.status).toBe('paused');
    expect(filled.status).toBe('filled');
    expect(closed.status).toBe('closed');

    expect(expired.status).toBe('active');
    expect(BusinessRuleUtils.isListingFresh(expired.lastConfirmedAt)).toBe(false);

    // Invariants check
    const inv = BusinessRuleUtils.validateFinancialInvariants(active);
    expect(inv.isValid).toBe(true);

    const badInv = BusinessRuleUtils.validateFinancialInvariants({
      totalRent: 10000,
      partnerShare: 15000, // exceeds total rent!
    });
    expect(badInv.isValid).toBe(false);
  });

  test('3. Connection Factory supports all 4 states', () => {
    const pend = DataFactory.createPendingConnection('p');
    const acc = DataFactory.createAcceptedConnection('a');
    const rej = DataFactory.createRejectedConnection('r');
    const blk = DataFactory.createBlockedConnection('b');

    expect(pend.status).toBe('pending');
    expect(acc.status).toBe('accepted');
    expect(rej.status).toBe('rejected');
    expect(blk.status).toBe('blocked');

    // Contact privacy test
    expect(BusinessRuleUtils.canViewUnmaskedContact('userA', 'userB', pend.status)).toBe(false);
    expect(BusinessRuleUtils.canViewUnmaskedContact('userA', 'userB', acc.status)).toBe(true);
    expect(BusinessRuleUtils.canViewUnmaskedContact('userA', 'userB', rej.status)).toBe(false);
    expect(BusinessRuleUtils.canViewUnmaskedContact('userA', 'userB', blk.status)).toBe(false);
  });

  test('4. Owner Verification State Machine conforms to transitions', () => {
    expect(BusinessRuleUtils.isValidVerificationTransition('NOT_STARTED', 'SUBMITTED')).toBe(true);
    expect(BusinessRuleUtils.isValidVerificationTransition('SUBMITTED', 'UNDER_REVIEW')).toBe(true);
    expect(BusinessRuleUtils.isValidVerificationTransition('UNDER_REVIEW', 'APPROVED')).toBe(true);
    expect(BusinessRuleUtils.isValidVerificationTransition('UNDER_REVIEW', 'REJECTED')).toBe(true);
    expect(BusinessRuleUtils.isValidVerificationTransition('REJECTED', 'RESUBMISSION_REQUIRED')).toBe(true);
    expect(BusinessRuleUtils.isValidVerificationTransition('RESUBMISSION_REQUIRED', 'SUBMITTED')).toBe(true);

    // Invalid transition
    expect(BusinessRuleUtils.isValidVerificationTransition('NOT_STARTED', 'APPROVED')).toBe(false);
    expect(BusinessRuleUtils.isValidVerificationTransition('APPROVED', 'SUBMITTED')).toBe(false);
  });

  test('5. 10-Point Compatibility calculations and dealbreakers', () => {
    const refQuiz = {
      sleep_time: 'before_10',
      wake_time: '6_to_8',
      food_pref: 'veg',
      smoking: 'never',
      drinking: 'never',
      cleanliness: 'very',
      work_mode: 'hybrid',
      guests: 'rarely',
      pets: 'ok',
      roommate_gender: 'any',
    };

    // Perfect match
    const score100 = BusinessRuleUtils.calculateCompatibility(refQuiz, { ...refQuiz }, 'Bengaluru', 'Bengaluru');
    expect(score100).toBe(100);

    // Cross-city penalty (capped at 60)
    const scoreCityCap = BusinessRuleUtils.calculateCompatibility(refQuiz, { ...refQuiz }, 'Bengaluru', 'Chennai');
    expect(scoreCityCap).toBe(60);

    // Smoker dealbreaker veto (never vs regularly -> 0)
    const smokerQuiz = { ...refQuiz, smoking: 'regularly' };
    const scoreSmokerVeto = BusinessRuleUtils.calculateCompatibility(refQuiz, smokerQuiz, 'Bengaluru', 'Bengaluru');
    expect(scoreSmokerVeto).toBe(0);
  });

  test('6. Free connection quota rules', () => {
    expect(BusinessRuleUtils.isConnectionQuotaExhausted(0, 5, false)).toBe(false);
    expect(BusinessRuleUtils.isConnectionQuotaExhausted(4, 5, false)).toBe(false);
    expect(BusinessRuleUtils.isConnectionQuotaExhausted(5, 5, false)).toBe(true);
    expect(BusinessRuleUtils.isConnectionQuotaExhausted(6, 5, false)).toBe(true);
    // Premium bypasses quota
    expect(BusinessRuleUtils.isConnectionQuotaExhausted(5, 5, true)).toBe(false);
  });

  test('7. City Normalization handles Indian metropolitan aliases', () => {
    expect(BusinessRuleUtils.normalizeCityName('bangalore')).toBe('Bengaluru');
    expect(BusinessRuleUtils.normalizeCityName('bengaluru')).toBe('Bengaluru');
    expect(BusinessRuleUtils.normalizeCityName('Bombay')).toBe('Mumbai');
    expect(BusinessRuleUtils.normalizeCityName('Madras')).toBe('Chennai');
    expect(BusinessRuleUtils.normalizeCityName('Delhi')).toBe('Delhi NCR');
  });

  test('8. Deterministic Dataset Universe compiles consistently', () => {
    const universe = buildDeterministicTestUniverse();
    expect(universe.seekers.length).toBeGreaterThanOrEqual(9);
    expect(universe.owners.length).toBeGreaterThanOrEqual(4);
    expect(universe.admins.length).toBeGreaterThanOrEqual(1);
    expect(universe.listings.length).toBe(7); // all 7 lifecycle states
    expect(universe.connections.length).toBe(4); // all 4 states
    expect(universe.verifications.length).toBe(5);
    expect(universe.chatRooms.length).toBeGreaterThanOrEqual(1);
    expect(universe.messages.length).toBeGreaterThanOrEqual(3);
  });
});
