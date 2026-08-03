import { describe, expect, it } from 'vitest';
import {
  canSendConnect,
  countConnectionsSince,
  findExistingConnectionId,
  FREE_CONNECT_LIMIT,
} from '@/lib/connectionGuards';

describe('findExistingConnectionId', () => {
  const pairs = [
    { id: 'c1', fromUserId: 'a', toUserId: 'b' },
    { id: 'c2', fromUserId: 'c', toUserId: 'd' },
  ];

  it('finds forward direction', () => {
    expect(findExistingConnectionId(pairs, 'a', 'b')).toBe('c1');
  });

  it('finds reverse direction', () => {
    expect(findExistingConnectionId(pairs, 'b', 'a')).toBe('c1');
  });

  it('returns null when no pair exists', () => {
    expect(findExistingConnectionId(pairs, 'a', 'd')).toBeNull();
  });
});

describe('canSendConnect', () => {
  it('allows unlimited free when flag set', () => {
    expect(
      canSendConnect({ connectsUsedThisMonth: 99, isPremium: false, unlimitedFree: true })
    ).toBe(true);
  });

  it('allows premium always', () => {
    expect(
      canSendConnect({ connectsUsedThisMonth: 99, isPremium: true, unlimitedFree: false })
    ).toBe(true);
  });

  it('blocks free users at limit', () => {
    expect(
      canSendConnect({
        connectsUsedThisMonth: FREE_CONNECT_LIMIT,
        isPremium: false,
        unlimitedFree: false,
      })
    ).toBe(false);
  });

  it('allows free users under limit', () => {
    expect(
      canSendConnect({
        connectsUsedThisMonth: FREE_CONNECT_LIMIT - 1,
        isPremium: false,
        unlimitedFree: false,
      })
    ).toBe(true);
  });
});

describe('countConnectionsSince', () => {
  it('counts only timestamps in the current month window', () => {
    const start = Date.UTC(2026, 7, 1); // Aug 1 2026
    expect(
      countConnectionsSince([start - 1, start, start + 1000], start)
    ).toBe(2);
  });
});
