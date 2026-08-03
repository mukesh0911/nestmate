import { describe, expect, it } from 'vitest';
import { sanitizePublicProfile } from '@/lib/sanitizeProfile';

describe('sanitizePublicProfile', () => {
  it('clears phone, email, and workEmail', () => {
    const out = sanitizePublicProfile({
      uid: 'u1',
      name: 'Rohan',
      phone: '+919999900001',
      email: 'r@example.com',
      workEmail: 'r@corp.com',
      city: 'Chennai',
    });
    expect(out.phone).toBe('');
    expect(out.email).toBe('');
    expect(out.workEmail).toBe('');
    expect(out.name).toBe('Rohan');
    expect(out.city).toBe('Chennai');
  });
});
