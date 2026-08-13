import { describe, it, expect } from 'vitest';
import { filterProfilesByRole, type UserProfileLike } from './roleFiltering';

describe('filterProfilesByRole', () => {
  const sampleData: UserProfileLike[] = [
    { uid: 'owner1', role: 'owner', name: 'Owner One' },
    { uid: 'owner2', role: 'owner', name: 'Owner Two' },
    { uid: 'seeker1', role: 'seeker', name: 'Seeker One' },
  ];

  it('Owner login -> sees 1 Seeker profile (0 Owners, excluding self)', () => {
    const result = filterProfilesByRole(sampleData, 'owner1', 'owner');
    expect(result).toHaveLength(1);
    expect(result[0].uid).toBe('seeker1');
    expect(result[0].name).toBe('Seeker One');
  });

  it('Seeker login -> sees 2 Owner profiles (0 Seekers, excluding self)', () => {
    const result = filterProfilesByRole(sampleData, 'seeker1', 'seeker');
    expect(result).toHaveLength(2);
    const uids = result.map(r => r.uid);
    expect(uids).toContain('owner1');
    expect(uids).toContain('owner2');
    expect(uids).not.toContain('seeker1');
  });

  it('Excludes logged-in owner from listing if owner is in candidates list', () => {
    const result = filterProfilesByRole(sampleData, 'owner1', 'owner');
    expect(result.some(r => r.uid === 'owner1')).toBe(false);
  });
});
