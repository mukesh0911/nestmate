import { describe, expect, it } from 'vitest';
import { calculateCompatibility, getActiveStatus } from '@/lib/matching';

describe('calculateCompatibility', () => {
  it('returns 100 for identical numeric answers', () => {
    const a = { sleep_time: '1', food_pref: '2', pets: '0' };
    expect(calculateCompatibility(a, { ...a })).toBe(100);
  });

  it('gives partial credit for nearby ordinal answers', () => {
    const score = calculateCompatibility(
      { sleep_time: '0' },
      { sleep_time: '1' }
    );
    // diff 1 → similarity 2/3 → ~67%
    expect(score).toBe(67);
  });

  it('returns 0 for max distance (>=3) on a single question', () => {
    expect(
      calculateCompatibility({ sleep_time: '0' }, { sleep_time: '3' })
    ).toBe(0);
  });

  it('returns 0 when neither side has answers', () => {
    expect(calculateCompatibility({}, {})).toBe(0);
  });

  it('uses exact string match when values are non-numeric', () => {
    expect(
      calculateCompatibility({ food: 'veg' }, { food: 'veg' })
    ).toBe(100);
    expect(
      calculateCompatibility({ food: 'veg' }, { food: 'non_veg' })
    ).toBe(0);
  });

  it('is symmetric', () => {
    const a = { a: '0', b: '2' };
    const b = { a: '1', b: '2' };
    expect(calculateCompatibility(a, b)).toBe(calculateCompatibility(b, a));
  });
});

describe('getActiveStatus', () => {
  it('marks <15 min as online', () => {
    const ts = Date.now() - 5 * 60 * 1000;
    expect(getActiveStatus(ts).status).toBe('online');
  });

  it('marks <24h as recent', () => {
    const ts = Date.now() - 3 * 60 * 60 * 1000;
    expect(getActiveStatus(ts).status).toBe('recent');
    expect(getActiveStatus(ts).text).toContain('h ago');
  });

  it('marks older as offline', () => {
    const ts = Date.now() - 3 * 24 * 60 * 60 * 1000;
    expect(getActiveStatus(ts).status).toBe('offline');
  });

  it('handles missing timestamp', () => {
    expect(getActiveStatus(null).status).toBe('offline');
  });
});
