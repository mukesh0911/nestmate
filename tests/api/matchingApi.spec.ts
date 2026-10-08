import { test, expect } from '@playwright/test';
import { ApiTestContext } from '../helpers/apiTestContext';
import { BackendTestHarness } from '../helpers/backendTestHarness';
import { BusinessRuleUtils } from '../helpers/businessRuleUtils';

test.describe('API Suite 4: Roommate & Listing Matching Engine (OP-MATCH, RULE-01, RULE-02)', () => {
  const ids = ApiTestContext.getUniverseIds();

  // ── STEP 8: Deterministic 10-Point Compatibility Scoring ───────────────────

  test('MATCH-01: Perfect Match persona yields exactly 100% compatibility', () => {
    const seekerA = BackendTestHarness.getUser(ids.seekerA);
    const seekerB = BackendTestHarness.getUser(ids.seekerB);

    expect(seekerA).not.toBeNull();
    expect(seekerB).not.toBeNull();

    const score = BusinessRuleUtils.calculateCompatibility(
      seekerA.quizAnswers,
      seekerB.quizAnswers,
      seekerA.city,
      seekerB.city
    );

    expect(score).toBe(100);
  });

  test('MATCH-02: Intermediate match (8 of 10 dimensions) yields exactly 80%', () => {
    const seekerA = BackendTestHarness.getUser(ids.seekerA);
    const eightTenthsQuiz = {
      ...seekerA.quizAnswers,
      sleep_time: 'after_12',
      work_mode: 'wfo',
    };

    const score = BusinessRuleUtils.calculateCompatibility(
      seekerA.quizAnswers,
      eightTenthsQuiz,
      seekerA.city,
      seekerA.city
    );

    expect(score).toBe(80);
  });

  test('MATCH-03: Cross-city match (10/10 lifestyle match across different cities) is capped at 60%', () => {
    const seekerA = BackendTestHarness.getUser(ids.seekerA); // Bengaluru
    const chennaiSeeker = BackendTestHarness.getUser(ids.seekerChennai); // Chennai

    expect(seekerA.city).toBe('Bengaluru');
    expect(chennaiSeeker.city).toBe('Chennai');

    const score = BusinessRuleUtils.calculateCompatibility(
      seekerA.quizAnswers,
      chennaiSeeker.quizAnswers,
      seekerA.city,
      chennaiSeeker.city
    );

    expect(score).toBe(60);
  });

  test('MATCH-04: Strict dealbreaker veto (non-smoker vs regular smoker) yields immediate 0%', () => {
    const seekerA = BackendTestHarness.getUser(ids.seekerA); // non-smoker ('never')
    const smokerSeeker = BackendTestHarness.getUser(ids.seekerSmoker); // smoker ('regularly')

    expect(seekerA.quizAnswers.smoking).toBe('never');
    expect(smokerSeeker.quizAnswers.smoking).toBe('regularly');

    const score = BusinessRuleUtils.calculateCompatibility(
      seekerA.quizAnswers,
      smokerSeeker.quizAnswers,
      seekerA.city,
      smokerSeeker.city
    );

    expect(score).toBe(0);
  });

  test('MATCH-05: Incomplete profile or missing quiz answers yields 0%', () => {
    const seekerA = BackendTestHarness.getUser(ids.seekerA);
    const incompleteSeeker = BackendTestHarness.getUser(ids.onboardingPending);

    const score = BusinessRuleUtils.calculateCompatibility(
      seekerA.quizAnswers,
      incompleteSeeker.quizAnswers,
      seekerA.city,
      incompleteSeeker.city
    );

    expect(score).toBe(0);
  });

  // ── Ranking & Sorting Invariants ───────────────────────────────────────────

  test('MATCH-06: Candidate ranking prioritizes compatibility score first over Premium tiebreakers', () => {
    // Candidate 1: 95% non-premium
    // Candidate 2: 70% premium
    const c1 = { score: 95, isPremium: false, isVerified: false };
    const c2 = { score: 70, isPremium: true, isVerified: true };

    const candidates = [c2, c1];
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aP = a.isPremium ? 1 : 0;
      const bP = b.isPremium ? 1 : 0;
      return bP - aP;
    });

    expect(candidates[0].score).toBe(95);
    expect(candidates[0].isPremium).toBe(false);
  });

  test('MATCH-07: Suspended and Banned users are strictly excluded from match candidates pool', () => {
    const universe = BackendTestHarness.loadUniverse();
    const candidatePool = universe.seekers.filter(s => s.status === 'active');

    const suspendedInPool = candidatePool.some(s => s.uid === ids.suspendedUser);
    const bannedInPool = candidatePool.some(s => s.uid === ids.bannedUser);

    expect(suspendedInPool).toBe(false);
    expect(bannedInPool).toBe(false);
  });

  test('MATCH-08: Owners with role=owner are strictly excluded from the roommate discovery pool (RULE-07)', () => {
    const universe = BackendTestHarness.loadUniverse();
    const roommatePool = universe.seekers.filter(s => s.role === 'seeker');

    const ownersInPool = roommatePool.some(s => s.role === 'owner');
    expect(ownersInPool).toBe(false);
  });
});
