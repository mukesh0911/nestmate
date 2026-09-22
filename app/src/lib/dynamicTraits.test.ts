import { describe, it, expect } from 'vitest';
import {
  formatLocationString,
  resolveState,
  getDynamicPreferences,
  getRoomHighlights,
  getUserHighlights,
} from './dynamicTraits';
import type { Listing } from '@/hooks/useListings';
import type { UserProfile } from '@/hooks/useAuth';

describe('dynamicTraits - 100% Dynamic Real Data Verification', () => {
  describe('formatLocationString & resolveState', () => {
    it('correctly maps known Indian cities to their respective states', () => {
      expect(resolveState('Chennai')).toBe('Tamil Nadu');
      expect(resolveState('Bengaluru')).toBe('Karnataka');
      expect(resolveState('Bangalore')).toBe('Karnataka');
      expect(resolveState('Hyderabad')).toBe('Telangana');
      expect(resolveState('Mumbai')).toBe('Maharashtra');
      expect(resolveState('Pune')).toBe('Maharashtra');
      expect(resolveState('Delhi')).toBe('Delhi');
    });

    it('formats location with city and resolved state without hardcoded Karnataka', () => {
      const chennaiLoc = formatLocationString('Anna Nagar', 'Chennai');
      expect(chennaiLoc).toBe('Anna Nagar, Chennai, Tamil Nadu, India');
      expect(chennaiLoc).not.toContain('Karnataka');

      const hydLoc = formatLocationString('Gachibowli', 'Hyderabad');
      expect(hydLoc).toBe('Gachibowli, Hyderabad, Telangana, India');
      expect(hydLoc).not.toContain('Karnataka');
    });

    it('respects explicitly provided state and does not duplicate it', () => {
      const puneLoc = formatLocationString('Kothrud', 'Pune', 'Maharashtra');
      expect(puneLoc).toBe('Kothrud, Pune, Maharashtra, India');
    });

    it('handles missing or blank location gracefully', () => {
      expect(formatLocationString('', '', '')).toBe('Location not specified');
      expect(formatLocationString(undefined, undefined, undefined)).toBe('Location not specified');
    });
  });

  describe('getDynamicPreferences', () => {
    it('returns empty array when user has not specified any quiz answers or expectations', () => {
      const badges = getDynamicPreferences({});
      expect(badges).toHaveLength(0);
    });

    it('extracts Early Bird for early wake times', () => {
      const badges = getDynamicPreferences({ quizAnswers: { wake_time: 'before_6' } });
      expect(badges.some(b => b.label === 'Early Bird')).toBe(true);
      expect(badges.some(b => b.label === 'Night Owl')).toBe(false);
    });

    it('extracts Night Owl for late wake times', () => {
      const badges = getDynamicPreferences({ quizAnswers: { wake_time: 'after_10' } });
      expect(badges.some(b => b.label === 'Night Owl')).toBe(true);
      expect(badges.some(b => b.label === 'Early Bird')).toBe(false);
    });

    it('extracts Vegetarian from quizAnswers or houseRules', () => {
      const quizVeg = getDynamicPreferences({ quizAnswers: { food_pref: 'veg' } });
      expect(quizVeg.some(b => b.label === 'Vegetarian')).toBe(true);

      const rulesVeg = getDynamicPreferences({ houseRules: ['Strictly veg only'] });
      expect(rulesVeg.some(b => b.label === 'Vegetarian')).toBe(true);
    });

    it('extracts Non-Smoker from smoking: "never" or householdExpectations', () => {
      const nonSmoker = getDynamicPreferences({ quizAnswers: { smoking: 'never' } });
      expect(nonSmoker.some(b => b.label === 'Non-Smoker')).toBe(true);

      const houseExpect = getDynamicPreferences({ householdExpectations: { smokingPolicy: 'no_smoking' } });
      expect(houseExpect.some(b => b.label === 'Non-Smoker')).toBe(true);
    });

    it('extracts WFH / Remote for remote workers', () => {
      const wfh = getDynamicPreferences({ quizAnswers: { work_mode: 'wfh' } });
      expect(wfh.some(b => b.label === 'WFH / Remote')).toBe(true);
    });

    it('does not duplicate badges even if multiple signals match', () => {
      const multi = getDynamicPreferences({
        quizAnswers: { wake_time: 'before_6', sleep_time: 'before_10' }
      });
      const earlyBirdCount = multi.filter(b => b.label === 'Early Bird' || b.label === 'Early Sleeper').length;
      expect(earlyBirdCount).toBe(1);
    });
  });

  describe('getRoomHighlights', () => {
    it('includes Verified Property when isVerified is true', () => {
      const mockRoom: Listing = {
        id: 'r1',
        title: 'Room in Chennai',
        locality: 'T Nagar',
        city: 'Chennai',
        rent: 8000,
        amenities: ['wifi', 'parking'],
      } as any;

      const verified = getRoomHighlights(mockRoom, true);
      expect(verified).toContain('Verified Property');
      expect(verified).toContain('High-speed WiFi');
      expect(verified).toContain('Dedicated Parking');
      expect(verified).not.toContain('Attached washroom'); // not present, so MUST not fabricate

      const unverified = getRoomHighlights(mockRoom, false);
      expect(unverified).not.toContain('Verified Property');
    });

    it('only flags attached washroom if actually present in amenities or description', () => {
      const roomWithBath: Listing = {
        id: 'r2',
        title: 'Master Bedroom',
        amenities: ['attached washroom'],
      } as any;
      expect(getRoomHighlights(roomWithBath, false)).toContain('Attached washroom');

      const roomWithoutBath: Listing = {
        id: 'r3',
        title: 'Standard Room',
        amenities: ['wifi'],
      } as any;
      expect(getRoomHighlights(roomWithoutBath, false)).not.toContain('Attached washroom');
    });
  });

  describe('getUserHighlights', () => {
    it('derives authentic user highlights from profile data', () => {
      const p: UserProfile = {
        uid: 'u1',
        name: 'Kavitha',
        isVerified: true,
        workEmailVerified: true,
        budget: 15000,
        profession: 'UI/UX Designer',
      } as any;

      const highlights = getUserHighlights(p, true, { smoking: 'never', food_pref: 'veg' });
      expect(highlights).toContain('Verified User');
      expect(highlights).toContain('Work Verified');
      expect(highlights).toContain('Non-Smoker');
      expect(highlights).toContain('Vegetarian Diet');
      expect(highlights).toContain('Budget ₹15,000');
      expect(highlights).toContain('UI/UX Designer');
    });
  });
});
