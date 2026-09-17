import { describe, it, expect } from 'vitest';
import { filterProfilesByRole, filterFlatmateProfiles, type UserProfileLike } from './roleFiltering';

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

describe('filterFlatmateProfiles (DISC-03 discovery logic)', () => {
  const candidatePool: UserProfileLike[] = [
    { uid: 'seeker1', role: 'seeker', name: 'Aarav (Seeker 1)' },
    { uid: 'seeker2', role: 'seeker', name: 'Diya (Seeker 2)' },
    { uid: 'seeker3', role: 'seeker', name: 'Karan (Seeker 3)' },
    { uid: 'owner1', role: 'owner', name: 'Rajesh (Owner 1)' },
    { uid: 'owner2', role: 'owner', name: 'Priya (Owner 2)' },
  ];

  it('Seeker login -> discovers OTHER Seekers (excludes self and excludes owners)', () => {
    const result = filterFlatmateProfiles(candidatePool, 'seeker1', 'seeker');
    const uids = result.map(r => r.uid);
    expect(uids).toEqual(['seeker2', 'seeker3']);
    expect(uids).not.toContain('seeker1');
    expect(uids).not.toContain('owner1');
    expect(uids).not.toContain('owner2');
  });

  it('Owner login -> discovers Seekers on the seekers tab (excludes owners and self)', () => {
    const result = filterFlatmateProfiles(candidatePool, 'owner1', 'owner');
    const uids = result.map(r => r.uid);
    expect(uids).toEqual(['seeker1', 'seeker2', 'seeker3']);
    expect(uids).not.toContain('owner1');
    expect(uids).not.toContain('owner2');
  });

  it('Handles case-insensitivity in seeker role field', () => {
    const mixedCase: UserProfileLike[] = [
      { uid: 's1', role: 'SEEKER', name: 'Upper' },
      { uid: 's2', role: 'Seeker', name: 'Title' },
      { uid: 'o1', role: 'OWNER', name: 'Owner' },
    ];
    const result = filterFlatmateProfiles(mixedCase, 'caller');
    expect(result.map(r => r.uid)).toEqual(['s1', 's2']);
  });

  it('Returns empty array if no other seekers exist', () => {
    const onlySelf: UserProfileLike[] = [
      { uid: 'seeker1', role: 'seeker', name: 'Only Me' },
      { uid: 'owner1', role: 'owner', name: 'Owner' },
    ];
    const result = filterFlatmateProfiles(onlySelf, 'seeker1', 'seeker');
    expect(result).toHaveLength(0);
  });
});

