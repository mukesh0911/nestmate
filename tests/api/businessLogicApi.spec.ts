import { test, expect } from '@playwright/test';
import { ApiTestContext } from '../helpers/apiTestContext';
import { BackendTestHarness } from '../helpers/backendTestHarness';
import { BusinessRuleUtils } from '../helpers/businessRuleUtils';

test.describe('API Suite: Core Business Rules & Pure Service Logic (RULE-01 to RULE-20)', () => {
  const ids = ApiTestContext.getUniverseIds();
  const seekerA = ApiTestContext.IDENTITIES.SEEKER_A;
  const ownerA = ApiTestContext.IDENTITIES.OWNER_A;

  test('BIZ-RULE-01: 10-Point Compatibility Score computes deterministic results', () => {
    const sA = BackendTestHarness.getUser(ids.seekerA);
    const sB = BackendTestHarness.getUser(ids.seekerB);
    const score = BusinessRuleUtils.calculateCompatibility(sA.quizAnswers, sB.quizAnswers, sA.city, sB.city);
    expect(score).toBe(100);
  });

  test('BIZ-RULE-03: Free connection limit (FREE_CONNECT_LIMIT = 5) enforced', () => {
    expect(BusinessRuleUtils.isConnectionQuotaExhausted(4, 5, false)).toBe(false);
    expect(BusinessRuleUtils.isConnectionQuotaExhausted(5, 5, false)).toBe(true);
    expect(BusinessRuleUtils.isConnectionQuotaExhausted(10, 5, true)).toBe(false); // Pro bypass
  });

  test('BIZ-RULE-04: Phone numbers unmasked only upon accepted connection', () => {
    expect(BusinessRuleUtils.canViewUnmaskedContact(ids.seekerA, ids.ownerA, 'pending')).toBe(false);
    expect(BusinessRuleUtils.canViewUnmaskedContact(ids.seekerA, ids.ownerA, 'accepted')).toBe(true);
    expect(BusinessRuleUtils.canViewUnmaskedContact(ids.seekerA, ids.ownerA, null, true)).toBe(true); // admin
  });

  test('BIZ-RULE-05: 30-Day freshness window excludes stale listings', () => {
    const freshDate = new Date(Date.now() - 5 * 86400000).toISOString();
    const staleDate = new Date(Date.now() - 35 * 86400000).toISOString();
    expect(BusinessRuleUtils.isListingFresh(freshDate)).toBe(true);
    expect(BusinessRuleUtils.isListingFresh(staleDate)).toBe(false);
  });

  test('BIZ-RULE-06: Verification state machine valid transitions', () => {
    expect(BusinessRuleUtils.isValidVerificationTransition('NOT_STARTED', 'SUBMITTED')).toBe(true);
    expect(BusinessRuleUtils.isValidVerificationTransition('SUBMITTED', 'APPROVED')).toBe(true);
    expect(BusinessRuleUtils.isValidVerificationTransition('SUBMITTED', 'NOT_STARTED')).toBe(false);
  });

  test('BIZ-RULE-09: Applicant ranking formula (40% comp, 20% profile, 20% budget, 20% trust)', () => {
    const rankScore = BusinessRuleUtils.calculateApplicantRankScore({
      compatibilityScore: 100,
      profileCompleteness: 100,
      budgetAlignment: 100,
      verificationLevel: 3,
    });
    expect(rankScore).toBe(100);
  });

  test('BIZ-RULE-11: Listing financial invariants validation', () => {
    expect(BusinessRuleUtils.validateFinancialInvariants({ totalRent: 20000, partnerShare: 10000 }).isValid).toBe(true);
    expect(BusinessRuleUtils.validateFinancialInvariants({ totalRent: 20000, partnerShare: 25000 }).isValid).toBe(false);
  });

  test('BIZ-RULE-13: Self operations prohibited', () => {
    expect(BusinessRuleUtils.validateSelfOperation(seekerA.uid, seekerA.uid)).toBe(false);
    expect(BusinessRuleUtils.validateSelfOperation(seekerA.uid, ownerA.uid)).toBe(true);
  });

  test('BIZ-RULE-16: Admin email identification', () => {
    expect(BusinessRuleUtils.isAdminEmail('admin@nestmate-test.com')).toBe(true);
    expect(BusinessRuleUtils.isAdminEmail('seeker.ref@nestmate-test.com')).toBe(false);
  });

  test('BIZ-RULE-20: City alias normalization maps canonical names', () => {
    expect(BusinessRuleUtils.normalizeCityName('bangalore')).toBe('Bengaluru');
    expect(BusinessRuleUtils.normalizeCityName('bombay')).toBe('Mumbai');
    expect(BusinessRuleUtils.normalizeCityName('madras')).toBe('Chennai');
  });
});
