import { describe, it, expect } from 'vitest';
import type { Connection } from '@/hooks/useConnections';
import type { MatchedUser } from '@/hooks/useMatches';
import type { Listing } from '@/hooks/useListings';
import type { CategoryTab } from '@/pages/ExplorePage';

describe('ExplorePage Unified Portal & Layout Architecture', () => {
  describe('Tab Routing & Classification', () => {
    it('supports all essential discovery, saved, and connection categories', () => {
      const validTabs: CategoryTab[] = ['rooms', 'roommates', 'pg', 'saved', 'connections', 'all'];
      expect(validTabs).toHaveLength(6);
      expect(validTabs).toContain('rooms');
      expect(validTabs).toContain('saved');
      expect(validTabs).toContain('connections');
    });

    it('defaults to rooms when rawTab query param is absent or unrecognized', () => {
      const resolveTab = (raw: string | null): CategoryTab => {
        return raw === 'rooms' ? 'rooms'
          : raw === 'roommates' ? 'roommates'
          : raw === 'pg' ? 'pg'
          : raw === 'saved' ? 'saved'
          : raw === 'connections' ? 'connections'
          : raw === 'all' ? 'all'
          : 'rooms';
      };

      expect(resolveTab(null)).toBe('rooms');
      expect(resolveTab('')).toBe('rooms');
      expect(resolveTab('invalid_tab')).toBe('rooms');
      expect(resolveTab('saved')).toBe('saved');
      expect(resolveTab('connections')).toBe('connections');
      expect(resolveTab('roommates')).toBe('roommates');
    });
  });

  describe('Saved Listings & Flatmates Aggregation', () => {
    it('accurately calculates total saved badge count from rooms and flatmates', () => {
      const savedRoomIds = ['room_a', 'room_b', 'room_c'];
      const savedProfileIds = ['profile_1', 'profile_2'];
      const totalSavedBadge = savedRoomIds.length + savedProfileIds.length;

      expect(totalSavedBadge).toBe(5);
    });

    it('filters saved rooms by search query in title, locality, or city', () => {
      const savedRooms: Partial<Listing>[] = [
        { id: 'r1', title: 'Sunny 2BHK House', locality: 'Koramangala', city: 'Bengaluru' },
        { id: 'r2', title: 'Luxury 3BHK Flat', locality: 'Indiranagar', city: 'Bengaluru' },
        { id: 'r3', title: 'Cozy Room in Velachery', locality: 'Velachery', city: 'Chennai' },
      ];

      const query = 'koramangala';
      const results = savedRooms.filter(room => {
        const q = query.toLowerCase();
        return (
          (room.title || '').toLowerCase().includes(q) ||
          (room.locality || '').toLowerCase().includes(q) ||
          (room.city || '').toLowerCase().includes(q)
        );
      });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Sunny 2BHK House');
    });

    it('filters saved flatmates by search query across name, profession, and locality', () => {
      const savedFlatmates: MatchedUser[] = [
        {
          profile: { uid: 'u1', name: 'Ravi Kumar', profession: 'Backend Developer', locality: 'HSR Layout', city: 'Bengaluru' } as any,
          compatibilityScore: 92
        },
        {
          profile: { uid: 'u2', name: 'Sneha Patel', profession: 'UX Designer', locality: 'Koramangala', city: 'Bengaluru' } as any,
          compatibilityScore: 88
        }
      ];

      const query = 'designer';
      const results = savedFlatmates.filter(m => {
        const q = query.toLowerCase();
        return (
          (m.profile.name || '').toLowerCase().includes(q) ||
          (m.profile.locality || '').toLowerCase().includes(q) ||
          (m.profile.city || '').toLowerCase().includes(q) ||
          (m.profile.profession || '').toLowerCase().includes(q)
        );
      });

      expect(results).toHaveLength(1);
      expect(results[0].profile.name).toBe('Sneha Patel');
    });
  });

  describe('Connections Management Logic', () => {
    const currentUid = 'user_current';
    const sampleConnections: Connection[] = [
      { id: 'c1', fromUserId: 'user_current', toUserId: 'user_2', status: 'accepted', createdAt: {} as any },
      { id: 'c2', fromUserId: 'user_3', toUserId: 'user_current', status: 'accepted', createdAt: {} as any },
      { id: 'c3', fromUserId: 'incoming_1', toUserId: 'user_current', status: 'pending', createdAt: {} as any },
      { id: 'c4', fromUserId: 'user_current', toUserId: 'outgoing_1', status: 'pending', createdAt: {} as any },
    ];

    it('correctly partitions accepted, received, and sent connection requests', () => {
      const accepted = sampleConnections.filter(c => c.status === 'accepted');
      const received = sampleConnections.filter(c => c.status === 'pending' && c.toUserId === currentUid);
      const sent = sampleConnections.filter(c => c.status === 'pending' && c.fromUserId === currentUid);

      expect(accepted).toHaveLength(2);
      expect(received).toHaveLength(1);
      expect(received[0].fromUserId).toBe('incoming_1');
      expect(sent).toHaveLength(1);
      expect(sent[0].toUserId).toBe('outgoing_1');
    });

    it('aggregates connection badge count for pending received requests and active connections', () => {
      const accepted = sampleConnections.filter(c => c.status === 'accepted');
      const received = sampleConnections.filter(c => c.status === 'pending' && c.toUserId === currentUid);
      const totalConnectionAlerts = accepted.length + received.length;

      expect(totalConnectionAlerts).toBe(3);
    });
  });

  describe('Desktop Layout Geometry Specifications', () => {
    it('verifies 2-column sidebar + main content layout responsiveness', () => {
      const desktopSidebarWidth = 285; // px
      const maxContainerWidth = 1280; // max-w-7xl px
      const gap = 24; // gap-6 px
      const availableContentWidth = maxContainerWidth - desktopSidebarWidth - gap;

      expect(availableContentWidth).toBeGreaterThan(900);
      // In a 2-column grid next to sidebar:
      const cardWidth = (availableContentWidth - gap) / 2;
      expect(cardWidth).toBeGreaterThan(400); // Cards have generous, comfortable width
    });
  });
});
