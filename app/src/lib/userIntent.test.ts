import { describe, it, expect } from 'vitest';
import { getUserIntent, getPreferredRoommateGender, getUserInitials } from './userIntent';

describe('User Intent & Semantic Clarity Unit Tests', () => {
  describe('getUserIntent', () => {
    it('correctly classifies a room seeker without listing', () => {
      const seeker = {
        uid: 'user1',
        name: 'Mukeshram G',
        role: 'seeker' as const,
        budget: 6000,
        gender: 'male',
      };

      const intent = getUserIntent(seeker);
      expect(intent.type).toBe('room_seeker');
      expect(intent.badgeText).toBe('Looking for a Room');
      expect(intent.priceLabel).toBe('Budget');
      expect(intent.requirementValue).toBe('A Room');
      expect(intent.preferenceLabel).toBe('Preference');
      expect(intent.roleLabel).toBe('Room Seeker');
    });

    it('correctly classifies a team-up room seeker', () => {
      const seeker = {
        uid: 'user2',
        name: 'Aarav',
        role: 'seeker' as const,
        housingIntent: 'team_up',
        budget: 12000,
      };

      const intent = getUserIntent(seeker);
      expect(intent.type).toBe('room_seeker');
      expect(intent.badgeText).toBe('Teaming Up for a Room');
      expect(intent.requirementValue).toBe('Team-Up Flat');
      expect(intent.priceLabel).toBe('Budget');
    });

    it('correctly classifies an owner-flatmate offering a room', () => {
      const liveInHost = {
        uid: 'host1',
        name: 'Gowtham Pavan',
        role: 'owner' as const,
        ownerType: 'owner_flatmate',
        budget: 15000,
      };

      const intent = getUserIntent(liveInHost);
      expect(intent.type).toBe('roommate_seeker');
      expect(intent.badgeText).toBe('Room Available');
      expect(intent.priceLabel).toBe('Rent');
      expect(intent.requirementValue).toBe('A Roommate');
      expect(intent.roleLabel).toBe('Live-in Host');
    });

    it('correctly classifies a seeker who has an active listing attached', () => {
      const seekerWithListing = {
        uid: 'user3',
        name: 'Priya',
        role: 'seeker' as const,
      };
      const listing = {
        id: 'list1',
        totalRent: 18000,
      };

      const intent = getUserIntent(seekerWithListing, listing);
      expect(intent.type).toBe('roommate_seeker');
      expect(intent.badgeText).toBe('Room Available');
      expect(intent.priceLabel).toBe('Rent');
    });

    it('correctly classifies an absentee landlord / property host', () => {
      const landlord = {
        uid: 'landlord1',
        name: 'Suresh Kumar',
        role: 'owner' as const,
        ownerType: 'landlord',
      };

      const intent = getUserIntent(landlord);
      expect(intent.type).toBe('property_host');
      expect(intent.badgeText).toBe('Property Host');
      expect(intent.priceLabel).toBe('Rent');
      expect(intent.requirementValue).toBe('Room / Property');
    });
  });

  describe('getPreferredRoommateGender', () => {
    it('returns Any Gender when seeker has roommate_gender = any (never falls back to user male gender)', () => {
      const mukeshram = {
        name: 'Mukeshram G',
        gender: 'male',
        quizAnswers: {
          roommate_gender: 'any',
        },
      };

      const res = getPreferredRoommateGender(mukeshram);
      expect(res.raw).toBe('any');
      expect(res.label).toBe('Any Gender');
      // Must NOT be 'Male Only'
      expect(res.label).not.toContain('Male');
    });

    it('returns Female Only when seeker quiz answers roommate_gender = female', () => {
      const user = {
        name: 'Ananya',
        gender: 'female',
        quizAnswers: {
          roommate_gender: 'female',
        },
      };

      const res = getPreferredRoommateGender(user);
      expect(res.raw).toBe('female');
      expect(res.label).toBe('Female Only');
    });

    it('returns Male Only when owner has householdExpectations genderPref = male', () => {
      const owner = {
        name: 'Rahul',
        householdExpectations: {
          genderPref: 'male',
        },
      };

      const res = getPreferredRoommateGender(owner);
      expect(res.raw).toBe('male');
      expect(res.label).toBe('Male Only');
    });

    it('prioritizes listing preferredGender if provided', () => {
      const profile = {
        name: 'Host',
        quizAnswers: { roommate_gender: 'any' },
      };
      const listing = {
        preferredGender: 'Female',
      };

      const res = getPreferredRoommateGender(profile, listing);
      expect(res.raw).toBe('female');
      expect(res.label).toBe('Female Only');
    });

    it('defaults truthfully to Any Gender when no preference is recorded (never guesses user gender)', () => {
      const unknownUser = {
        name: 'John Doe',
        gender: 'male',
      };

      const res = getPreferredRoommateGender(unknownUser);
      expect(res.raw).toBe('any');
      expect(res.label).toBe('Any Gender');
    });
  });

  describe('getUserInitials', () => {
    it('extracts two initials from first and last name', () => {
      expect(getUserInitials('Mukeshram G')).toBe('MG');
      expect(getUserInitials('Gowtham Pavan')).toBe('GP');
    });

    it('extracts two characters for single word names', () => {
      expect(getUserInitials('Mukesh')).toBe('MU');
    });

    it('handles empty or missing names gracefully', () => {
      expect(getUserInitials(null)).toBe('U');
      expect(getUserInitials('')).toBe('U');
    });
  });
});
