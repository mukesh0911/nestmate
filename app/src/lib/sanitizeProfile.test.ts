import { describe, expect, it } from 'vitest';
import { sanitizePublicProfile } from './sanitizeProfile';

describe('sanitizePublicProfile', () => {
  it('clears phone, email, workEmail, and whatsappNumber', () => {
    const out = sanitizePublicProfile({
      uid: 'u1',
      name: 'Rohan',
      phone: '+919999900001',
      email: 'r@example.com',
      workEmail: 'r@corp.com',
      whatsappNumber: '+919876543210',
      city: 'Chennai',
    });
    expect(out.phone).toBe('');
    expect(out.email).toBe('');
    expect(out.workEmail).toBe('');
    expect(out.whatsappNumber).toBe('');
    expect(out.name).toBe('Rohan');
    expect(out.city).toBe('Chennai');
  });
});
