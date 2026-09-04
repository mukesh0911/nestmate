import { describe, it, expect } from 'vitest';
import { calculateCompatibility, getMatchReasons } from './matching';
import { applyClientFilters } from './listingFilters';
import { evaluateApplicantFit, rankApplicants } from './applicantRanking';

describe('Controlled E2E Data Universe — Mathematical Score & Ranking Validation', () => {
  // Reference Seeker S_REF
  const S_REF = {
    uid: 'usr_seeker_ref',
    city: 'Bengaluru',
    budget: 15000,
    quizAnswers: {
      sleep_time: 'before_10',
      wake_time: '6_to_8',
      food_pref: 'veg',
      smoking: 'never',
      drinking: 'never',
      guests: 'rarely',
      cleanliness: 'very',
      work_mode: 'hybrid',
      pets: 'ok',
      roommate_gender: 'any',
    },
  };

  // Seeker dataset S001..S010
  const seekers = [
    {
      id: 'S001',
      name: 'Priya Sharma',
      city: 'Bengaluru',
      budget: 14500,
      quizAnswers: { ...S_REF.quizAnswers }, // 10/10 matches
      expectedScore: 100,
    },
    {
      id: 'S002',
      name: 'Rohan Verma',
      city: 'Bengaluru',
      budget: 15000,
      quizAnswers: { ...S_REF.quizAnswers, sleep_time: '10_to_12', work_mode: 'wfo' }, // 8/10 matches
      expectedScore: 80,
    },
    {
      id: 'S003',
      name: 'Ananya Roy',
      city: 'Bengaluru',
      budget: 16000,
      quizAnswers: {
        ...S_REF.quizAnswers,
        sleep_time: 'after_12',
        wake_time: '8_to_10',
        food_pref: 'non_veg',
        smoking: 'socially',
      }, // 6/10 matches
      expectedScore: 60,
    },
    {
      id: 'S004',
      name: 'Vikram Patel',
      city: 'Chennai',
      budget: 14000,
      quizAnswers: { ...S_REF.quizAnswers }, // 10/10 matches, but different city -> capped at 60%
      expectedScore: 60,
    },
    {
      id: 'S005',
      name: 'Neha Gupta',
      city: 'Bengaluru',
      budget: 28000,
      quizAnswers: {
        ...S_REF.quizAnswers,
        cleanliness: 'messy',
        smoking: 'regularly',
        drinking: 'regularly',
        guests: 'very_often',
        food_pref: 'non_veg',
        sleep_time: 'after_12',
      }, // 4/10 matches
      expectedScore: 40,
    },
    {
      id: 'S006',
      name: 'Rahul Sen',
      city: 'Bengaluru',
      budget: 12000,
      quizAnswers: {
        sleep_time: 'varies',
        wake_time: 'after_10',
        food_pref: 'non_veg',
        smoking: 'regularly',
        drinking: 'regularly',
        guests: 'very_often',
        cleanliness: 'messy',
        work_mode: 'wfo',
        pets: 'allergic',
        roommate_gender: 'female',
      }, // 0/10 matches
      expectedScore: 0,
    },
    {
      id: 'S007',
      name: 'Sneha Nair',
      city: 'Hyderabad',
      budget: 13000,
      quizAnswers: {
        ...S_REF.quizAnswers,
        sleep_time: 'after_12',
        wake_time: 'after_10',
        food_pref: 'non_veg',
        smoking: 'regularly',
        drinking: 'regularly',
      }, // 5/10 matches (50%) in Hyderabad -> 50% * 0.6 = 30%
      expectedScore: 30,
    },
    {
      id: 'S008',
      name: 'Arjun Reddy',
      city: 'Bengaluru',
      budget: 15000,
      quizAnswers: {}, // Incomplete (0 tokens)
      expectedScore: 0,
    },
    {
      id: 'S009',
      name: 'Kavya Iyer',
      city: 'Bengaluru',
      budget: 15500,
      quizAnswers: { ...S_REF.quizAnswers, pets: 'no' }, // 9/10 matches
      expectedScore: 90,
    },
    {
      id: 'S010',
      name: 'Manish Joshi',
      city: 'Bengaluru',
      budget: 15000,
      quizAnswers: {
        ...S_REF.quizAnswers,
        sleep_time: '10_to_12',
        food_pref: 'non_veg',
        work_mode: 'wfo',
      }, // 7/10 matches
      expectedScore: 70,
    },
  ];

  it('Phase 3: validates exact mathematical compatibility scores for all candidates', () => {
    for (const seeker of seekers) {
      const score = calculateCompatibility(
        S_REF.quizAnswers,
        seeker.quizAnswers,
        S_REF.city,
        seeker.city
      );
      expect(score).toBe(seeker.expectedScore);
    }
  });

  it('Phase 3: validates match explanation reasons & caveats', () => {
    const reasonsS001 = getMatchReasons(S_REF.quizAnswers, seekers[0].quizAnswers, {
      myCity: S_REF.city,
      theirCity: seekers[0].city,
      myBudget: S_REF.budget,
      theirBudget: seekers[0].budget,
    });
    expect(reasonsS001.score).toBe(100);
    expect(reasonsS001.reasons).toContain('Same city (Bengaluru)');
    expect(reasonsS001.reasons).toContain('Budgets are close');
    expect(reasonsS001.reasons).toContain('10 lifestyle preferences in common');
    expect(reasonsS001.caveats).toHaveLength(0);

    const reasonsS004 = getMatchReasons(S_REF.quizAnswers, seekers[3].quizAnswers, {
      myCity: S_REF.city,
      theirCity: seekers[3].city,
      myBudget: S_REF.budget,
      theirBudget: seekers[3].budget,
    });
    expect(reasonsS004.score).toBe(60);
    expect(reasonsS004.caveats).toContain('Different cities');
  });

  it('Phase 4: validates compatibility ranking order for Seeker Dashboard', () => {
    const scoredSeekers = seekers.map(s => ({
      id: s.id,
      score: calculateCompatibility(S_REF.quizAnswers, s.quizAnswers, S_REF.city, s.city),
    }));

    scoredSeekers.sort((a, b) => b.score - a.score);
    const orderedIds = scoredSeekers.map(s => s.id);

    // Expected order: S001 (100) -> S009 (90) -> S002 (80) -> S010 (70) -> S003/S004 (60) -> S005 (40) -> S007 (30) -> S006/S008 (0)
    expect(orderedIds.slice(0, 4)).toEqual(['S001', 'S009', 'S002', 'S010']);
    expect(orderedIds.slice(4, 6)).toEqual(expect.arrayContaining(['S003', 'S004']));
    expect(orderedIds[6]).toBe('S005');
    expect(orderedIds[7]).toBe('S007');
    expect(orderedIds.slice(8, 10)).toEqual(expect.arrayContaining(['S006', 'S008']));
  });

  it('Phase 4: validates filtering listings by city, budget, and amenities', () => {
    const mockListings = [
      { id: 'L1', city: 'Bengaluru', locality: 'Koramangala', totalRent: 30000, partnerShare: 15000, status: 'active', amenities: ['WiFi', 'AC'], flatType: '2BHK' },
      { id: 'L2', city: 'Bengaluru', locality: 'HSR Layout', totalRent: 24000, partnerShare: 12000, status: 'active', amenities: ['WiFi', 'Gym'], flatType: '2BHK' },
      { id: 'L3', city: 'Chennai', locality: 'Velachery', totalRent: 20000, partnerShare: 10000, status: 'active', amenities: ['WiFi'], flatType: '1BHK' },
      { id: 'L4', city: 'Bengaluru', locality: 'Whitefield', totalRent: 28000, partnerShare: 14000, status: 'paused', amenities: ['WiFi', 'AC'], flatType: '2BHK' },
      { id: 'L5', city: 'Bengaluru', locality: 'Indiranagar', totalRent: 40000, partnerShare: 20000, status: 'active', amenities: ['WiFi', 'AC', 'TV'], flatType: '3BHK' },
    ];

    // Filter by city: Bengaluru
    const blrOnly = applyClientFilters(mockListings as any, { city: 'Bengaluru' });
    expect(blrOnly.map(l => l.id)).toEqual(['L1', 'L2', 'L4', 'L5']);

    // Filter by max budget: 15000
    const under15k = applyClientFilters(mockListings as any, { city: 'Bengaluru', budgetMax: 15000 });
    expect(under15k.map(l => l.id)).toEqual(['L1', 'L2', 'L4']);

    // Filter by amenity: Gym
    const withGym = applyClientFilters(mockListings as any, { amenities: ['Gym'] });
    expect(withGym.map(l => l.id)).toEqual(['L2']);
  });
});
