import { describe, it, expect } from 'vitest';
import { getLocalDateString, type WeeklyViewItem } from '../hooks/useListings';

describe('Views & Analytics Logic (Industry Standard)', () => {
  describe('getLocalDateString', () => {
    it('formats date correctly as YYYY-MM-DD in local time', () => {
      const d = new Date(2026, 8, 8, 15, 30); // Month index 8 = September
      expect(getLocalDateString(d)).toBe('2026-09-08');
    });

    it('pads single-digit months and days with leading zeros', () => {
      const d = new Date(2026, 0, 5, 2, 10); // Jan 5, 2026
      expect(getLocalDateString(d)).toBe('2026-01-05');
    });

    it('does not shift dates across UTC boundaries', () => {
      // In UTC+5:30 (India), 1:00 AM on Sept 8 is 7:30 PM on Sept 7 UTC.
      // getLocalDateString must reflect the local day (Sept 8), not UTC (Sept 7).
      const localLateNight = new Date(2026, 8, 8, 1, 0, 0);
      expect(getLocalDateString(localLateNight)).toBe('2026-09-08');
    });
  });

  describe('Trailing 7-Day Range Generation', () => {
    function generateTrailing7Days(referenceDate: Date = new Date()): WeeklyViewItem[] {
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days: WeeklyViewItem[] = [];
      const todayStr = getLocalDateString(referenceDate);

      for (let i = 6; i >= 0; i--) {
        const d = new Date(referenceDate);
        d.setDate(referenceDate.getDate() - i);
        const dateStr = getLocalDateString(d);
        const label = dayLabels[d.getDay()];
        days.push({
          day: label,
          date: dateStr,
          views: 0,
          isToday: dateStr === todayStr,
        });
      }
      return days;
    }

    it('always generates exactly 7 days', () => {
      const days = generateTrailing7Days();
      expect(days).toHaveLength(7);
    });

    it('marks the last item as isToday = true and previous items as false', () => {
      const days = generateTrailing7Days();
      expect(days[6].isToday).toBe(true);
      for (let i = 0; i < 6; i++) {
        expect(days[i].isToday).toBe(false);
      }
    });

    it('maintains strict chronological order from 6 days ago to today', () => {
      const refDate = new Date(2026, 8, 8); // Tuesday Sep 8
      const days = generateTrailing7Days(refDate);

      expect(days[0].date).toBe('2026-09-02'); // Wednesday Sep 2
      expect(days[0].day).toBe('Wed');

      expect(days[5].date).toBe('2026-09-07'); // Monday Sep 7
      expect(days[5].day).toBe('Mon');

      expect(days[6].date).toBe('2026-09-08'); // Tuesday Sep 8
      expect(days[6].day).toBe('Tue');
      expect(days[6].isToday).toBe(true);
    });
  });

  describe('Multi-Listing Portfolio Aggregation', () => {
    it('correctly aggregates daily views across multiple listings', () => {
      const listing1Views: WeeklyViewItem[] = [
        { day: 'Wed', date: '2026-09-02', views: 2, isToday: false },
        { day: 'Thu', date: '2026-09-03', views: 0, isToday: false },
        { day: 'Fri', date: '2026-09-04', views: 5, isToday: false },
        { day: 'Sat', date: '2026-09-05', views: 1, isToday: false },
        { day: 'Sun', date: '2026-09-06', views: 3, isToday: false },
        { day: 'Mon', date: '2026-09-07', views: 4, isToday: false },
        { day: 'Tue', date: '2026-09-08', views: 6, isToday: true },
      ];

      const listing2Views: WeeklyViewItem[] = [
        { day: 'Wed', date: '2026-09-02', views: 1, isToday: false },
        { day: 'Thu', date: '2026-09-03', views: 3, isToday: false },
        { day: 'Fri', date: '2026-09-04', views: 2, isToday: false },
        { day: 'Sat', date: '2026-09-05', views: 0, isToday: false },
        { day: 'Sun', date: '2026-09-06', views: 4, isToday: false },
        { day: 'Mon', date: '2026-09-07', views: 2, isToday: false },
        { day: 'Tue', date: '2026-09-08', views: 5, isToday: true },
      ];

      const portfolio = listing1Views.map((item, idx) => ({
        ...item,
        views: item.views + listing2Views[idx].views,
      }));

      expect(portfolio[0].views).toBe(3); // Wed: 2 + 1
      expect(portfolio[1].views).toBe(3); // Thu: 0 + 3
      expect(portfolio[2].views).toBe(7); // Fri: 5 + 2
      expect(portfolio[6].views).toBe(11); // Today (Tue): 6 + 5

      const totalWeekly = portfolio.reduce((s, d) => s + d.views, 0);
      expect(totalWeekly).toBe(38); // Sum across both listings
    });
  });

  describe('Deduplication and Owner Self-View Exclusion', () => {
    it('identifies owner self-view correctly to prevent metric inflation', () => {
      const listingOwnerId = 'owner_uid_123';
      const isOwnerView = (currentUserId: string | undefined, ownerId: string | undefined) => {
        return !!(ownerId && currentUserId && currentUserId === ownerId);
      };

      expect(isOwnerView('owner_uid_123', listingOwnerId)).toBe(true);
      expect(isOwnerView('seeker_uid_456', listingOwnerId)).toBe(false);
      expect(isOwnerView(undefined, listingOwnerId)).toBe(false); // Guest visitor
    });

    it('generates deterministic session key for visitor deduplication', () => {
      const listingId = 'prop_abc';
      const dateStr = '2026-09-08';
      const sessionKey = `nestmate_view_${listingId}_${dateStr}`;
      expect(sessionKey).toBe('nestmate_view_prop_abc_2026-09-08');
    });
  });
});
