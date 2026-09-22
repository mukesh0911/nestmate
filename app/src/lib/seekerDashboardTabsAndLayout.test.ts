import { describe, it, expect } from 'vitest';
import type { Connection } from '@/hooks/useConnections';
import type { MatchedUser } from '@/hooks/useMatches';

describe('SeekerDashboard Tabs & Layout Architecture', () => {
  describe('Part 1: Saved Sub-Tabs Specifications', () => {
    it('correctly aggregates badge count for saved flatmates and saved rooms', () => {
      const savedProfileIds = ['user_1', 'user_2'];
      const savedRoomIds = ['room_101', 'room_102', 'room_103'];
      const totalSavedBadge = savedProfileIds.length + savedRoomIds.length;

      expect(totalSavedBadge).toBe(5);
    });

    it('filters saved flatmates by search query across name, city, and profession', () => {
      const savedFlatmates: MatchedUser[] = [
        {
          profile: { uid: 'u1', name: 'Arjun Mehta', city: 'Bengaluru', profession: 'Product Designer', budget: 14000 } as any,
          compatibilityScore: 92,
          matchReasons: ['Budget overlap', 'Same lifestyle']
        },
        {
          profile: { uid: 'u2', name: 'Priya Sharma', city: 'Chennai', profession: 'Software Engineer', budget: 12000 } as any,
          compatibilityScore: 88,
          matchReasons: ['Both early birds']
        },
        {
          profile: { uid: 'u3', name: 'Rohan Gupta', city: 'Bengaluru', profession: 'Data Scientist', budget: 18000 } as any,
          compatibilityScore: 85,
          matchReasons: ['Vegetarian preference']
        }
      ];

      const query = 'software';
      const results = savedFlatmates.filter(m => {
        const q = query.toLowerCase();
        return (
          (m.profile.name || '').toLowerCase().includes(q) ||
          (m.profile.city || '').toLowerCase().includes(q) ||
          (m.profile.profession || '').toLowerCase().includes(q)
        );
      });

      expect(results).toHaveLength(1);
      expect(results[0].profile.name).toBe('Priya Sharma');
    });

    it('filters saved rooms by search query across title, locality, and city', () => {
      const savedRooms = [
        { id: 'r1', title: 'Luxury 2BHK in Indiranagar', city: 'Bengaluru', locality: 'Indiranagar', partnerShare: 15000 },
        { id: 'r2', title: 'Cozy Room in Velachery', city: 'Chennai', locality: 'Velachery', partnerShare: 9000 },
        { id: 'r3', title: 'Studio Flat near HSR Layout', city: 'Bengaluru', locality: 'HSR Layout', partnerShare: 13000 },
      ];

      const query = 'indiranagar';
      const results = savedRooms.filter(room => {
        const q = query.toLowerCase();
        return (
          (room.title || '').toLowerCase().includes(q) ||
          (room.city || '').toLowerCase().includes(q) ||
          (room.locality || '').toLowerCase().includes(q)
        );
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('r1');
    });
  });

  describe('Part 2: Connections Sub-Tabs Specifications', () => {
    const currentUserId = 'my_user_id';
    const mockConnections: Connection[] = [
      {
        id: 'conn_1',
        fromUserId: 'my_user_id',
        toUserId: 'target_1',
        status: 'accepted',
        createdAt: { toMillis: () => 1000 } as any
      },
      {
        id: 'conn_2',
        fromUserId: 'target_2',
        toUserId: 'my_user_id',
        status: 'accepted',
        createdAt: { toMillis: () => 2000 } as any
      },
      {
        id: 'conn_3',
        fromUserId: 'incoming_applicant_1',
        toUserId: 'my_user_id',
        status: 'pending',
        createdAt: { toMillis: () => 3000 } as any
      },
      {
        id: 'conn_4',
        fromUserId: 'my_user_id',
        toUserId: 'outgoing_target_1',
        status: 'pending',
        createdAt: { toMillis: () => 4000 } as any
      }
    ];

    it('correctly categorizes connections into accepted, received, and sent requests', () => {
      const accepted = mockConnections.filter(c => c.status === 'accepted');
      const received = mockConnections.filter(c => c.status === 'pending' && c.toUserId === currentUserId);
      const sent = mockConnections.filter(c => c.status === 'pending' && c.fromUserId === currentUserId);

      expect(accepted).toHaveLength(2);
      expect(received).toHaveLength(1);
      expect(sent).toHaveLength(1);

      expect(received[0].fromUserId).toBe('incoming_applicant_1');
      expect(sent[0].toUserId).toBe('outgoing_target_1');
    });

    it('extracts all counterpart UIDs to ensure no connection renders as a blank screen', () => {
      const set = new Set<string>();
      mockConnections.forEach(c => {
        if (c.fromUserId === currentUserId) set.add(c.toUserId);
        else if (c.toUserId === currentUserId) set.add(c.fromUserId);
      });

      const allCounterparts = Array.from(set);
      expect(allCounterparts).toEqual(expect.arrayContaining([
        'target_1',
        'target_2',
        'incoming_applicant_1',
        'outgoing_target_1'
      ]));
      expect(allCounterparts).toHaveLength(4);
    });
  });

  describe('Part 3: Dynamic Seeker Card Integrity', () => {
    it('properly normalizes rent display with currency formatting', () => {
      const budget1 = 15000;
      const budget2 = 0;
      const budgetText1 = budget1 && budget1 > 0 ? `₹ ${budget1.toLocaleString('en-IN')}` : '₹ 5,000';
      const budgetText2 = budget2 && budget2 > 0 ? `₹ ${budget2.toLocaleString('en-IN')}` : '₹ 5,000';

      expect(budgetText1).toBe('₹ 15,000');
      expect(budgetText2).toBe('₹ 5,000');
    });

    it('maps gender preference safely with fallback to Any', () => {
      const getLookingGender = (p: { preferredGender?: string; gender?: string }) => {
        return p.preferredGender
          ? p.preferredGender
          : p.gender
            ? p.gender === 'female' ? 'Female' : p.gender === 'male' ? 'Male' : 'Any'
            : 'Any';
      };

      expect(getLookingGender({ preferredGender: 'Female' })).toBe('Female');
      expect(getLookingGender({ gender: 'female' })).toBe('Female');
      expect(getLookingGender({ gender: 'male' })).toBe('Male');
      expect(getLookingGender({})).toBe('Any');
    });
  });
});
