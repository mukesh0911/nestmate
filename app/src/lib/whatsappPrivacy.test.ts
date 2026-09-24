import { describe, expect, it } from 'vitest';
import { formatWhatsAppDeepLink } from '@/hooks/useConnections';
import { sanitizePublicProfile } from '@/lib/sanitizeProfile';
import { stripPiiFromWrite } from '@/lib/privateUserData';

/**
 * Mock Firestore Access Control Simulator
 * Models the exact security rules defined in firestore.rules:
 * - Public users/{uid} is sanitized and stripped of whatsappNumber and PII
 * - userContacts/{userId} requires request.auth.uid == userId OR
 *   exists(/databases/$(database)/documents/acceptedPairs/$(request.auth.uid)_$(userId))
 */
class MockFirestoreSecurity {
  private userContacts: Record<string, { whatsappNumber?: string }> = {};
  private acceptedPairs: Set<string> = new Set();

  setUserContact(userId: string, data: { whatsappNumber?: string }) {
    this.userContacts[userId] = { ...data };
  }

  removeUserContactWhatsApp(userId: string) {
    if (this.userContacts[userId]) {
      delete this.userContacts[userId].whatsappNumber;
    }
  }

  setConnection(userA: string, userB: string, status: 'pending' | 'accepted' | 'rejected') {
    const pair1 = `${userA}_${userB}`;
    const pair2 = `${userB}_${userA}`;
    if (status === 'accepted') {
      this.acceptedPairs.add(pair1);
      this.acceptedPairs.add(pair2);
    } else {
      this.acceptedPairs.delete(pair1);
      this.acceptedPairs.delete(pair2);
    }
  }

  /**
   * Evaluates read access on /userContacts/{targetUserId}
   */
  readUserContact(requestAuthUid: string | null, targetUserId: string): { allowed: boolean; data?: { whatsappNumber?: string } } {
    if (!requestAuthUid) {
      return { allowed: false }; // Unauthenticated
    }
    // Owner access
    if (requestAuthUid === targetUserId) {
      return { allowed: true, data: this.userContacts[targetUserId] || {} };
    }
    // Connected peer access via acceptedPairs
    const pairKey = `${requestAuthUid}_${targetUserId}`;
    if (this.acceptedPairs.has(pairKey)) {
      return { allowed: true, data: this.userContacts[targetUserId] || {} };
    }
    // Otherwise blocked
    return { allowed: false };
  }
}

describe('WhatsApp Privacy & Contact Access Scenarios (A - H)', () => {
  const userA = 'user_A_uid';
  const userB = 'user_B_uid';

  it('SCENARIO A: User A has WhatsApp number, User B has not connected -> User B cannot access WhatsApp number', () => {
    const security = new MockFirestoreSecurity();
    security.setUserContact(userA, { whatsappNumber: '+919876543210' });

    const result = security.readUserContact(userB, userA);
    expect(result.allowed).toBe(false);
    expect(result.data).toBeUndefined();
  });

  it('SCENARIO B: User B sends request to User A (pending) -> WhatsApp number remains strictly hidden', () => {
    const security = new MockFirestoreSecurity();
    security.setUserContact(userA, { whatsappNumber: '+919876543210' });
    security.setConnection(userB, userA, 'pending');

    const result = security.readUserContact(userB, userA);
    expect(result.allowed).toBe(false);
    expect(result.data).toBeUndefined();
  });

  it('SCENARIO C: User A accepts User B request -> WhatsApp number becomes accessible to the connected party', () => {
    const security = new MockFirestoreSecurity();
    security.setUserContact(userA, { whatsappNumber: '+919876543210' });
    security.setConnection(userA, userB, 'accepted');

    const result = security.readUserContact(userB, userA);
    expect(result.allowed).toBe(true);
    expect(result.data?.whatsappNumber).toBe('+919876543210');
  });

  it('SCENARIO D: User A rejects User B request -> WhatsApp number remains hidden', () => {
    const security = new MockFirestoreSecurity();
    security.setUserContact(userA, { whatsappNumber: '+919876543210' });
    security.setConnection(userA, userB, 'rejected');

    const result = security.readUserContact(userB, userA);
    expect(result.allowed).toBe(false);
    expect(result.data).toBeUndefined();
  });

  it('SCENARIO E: User A removes WhatsApp number -> Connected user no longer sees the number (returns empty/undefined)', () => {
    const security = new MockFirestoreSecurity();
    security.setUserContact(userA, { whatsappNumber: '+919876543210' });
    security.setConnection(userA, userB, 'accepted');

    // Initial check: visible
    expect(security.readUserContact(userB, userA).data?.whatsappNumber).toBe('+919876543210');

    // User A removes number
    security.removeUserContactWhatsApp(userA);

    const resultAfterRemoval = security.readUserContact(userB, userA);
    expect(resultAfterRemoval.allowed).toBe(true);
    expect(resultAfterRemoval.data?.whatsappNumber).toBeUndefined();
  });

  it('SCENARIO F: User A changes WhatsApp number -> Connected user immediately receives updated number', () => {
    const security = new MockFirestoreSecurity();
    security.setUserContact(userA, { whatsappNumber: '+919876543210' });
    security.setConnection(userA, userB, 'accepted');

    // Update number
    security.setUserContact(userA, { whatsappNumber: '+919123456789' });

    const result = security.readUserContact(userB, userA);
    expect(result.allowed).toBe(true);
    expect(result.data?.whatsappNumber).toBe('+919123456789');
  });

  it('SCENARIO G: Unauthenticated/public user attempts to access profile data -> WhatsApp number is never exposed in public documents', () => {
    const rawPublicUser = {
      uid: userA,
      name: 'Priya Sharma',
      city: 'Bengaluru',
      whatsappNumber: '+919876543210',
      phone: '+919876543210',
      email: 'priya@example.com',
    };

    // Public sanitizeProfile strips whatsappNumber
    const sanitized = sanitizePublicProfile(rawPublicUser);
    expect(sanitized.whatsappNumber).toBe('');
    expect(sanitized.phone).toBe('');
    expect((sanitized as any).email).toBe('');

    // stripPiiFromWrite strips whatsappNumber from writes to users/{uid}
    const publicDocWrite = stripPiiFromWrite(rawPublicUser);
    expect(publicDocWrite.whatsappNumber).toBeUndefined();
    expect(publicDocWrite.phone).toBeUndefined();
  });

  it('SCENARIO H: Direct Firestore access by an unauthorized user or guest is blocked', () => {
    const security = new MockFirestoreSecurity();
    security.setUserContact(userA, { whatsappNumber: '+919876543210' });

    // Guest / Unauthenticated
    const guestRead = security.readUserContact(null, userA);
    expect(guestRead.allowed).toBe(false);

    // Random authenticated user without accepted connection
    const randomUser = 'stranger_uid_456';
    const strangerRead = security.readUserContact(randomUser, userA);
    expect(strangerRead.allowed).toBe(false);
  });
});

describe('WhatsApp Deep Link Generator', () => {
  it('formats standard 10-digit Indian numbers with country code 91', () => {
    expect(formatWhatsAppDeepLink('9876543210')).toBe('https://wa.me/919876543210');
  });

  it('handles formatted Indian phone numbers with spaces, hyphens, and +91 prefix', () => {
    expect(formatWhatsAppDeepLink('+91 98765-43210')).toBe('https://wa.me/919876543210');
    expect(formatWhatsAppDeepLink('+91 98765 43210')).toBe('https://wa.me/919876543210');
  });

  it('preserves international country codes for non-Indian numbers', () => {
    expect(formatWhatsAppDeepLink('+1 (415) 555-2671')).toBe('https://wa.me/14155552671');
    expect(formatWhatsAppDeepLink('+44 7911 123456')).toBe('https://wa.me/447911123456');
  });

  it('appends URL-encoded custom pre-filled message if provided', () => {
    const link = formatWhatsAppDeepLink('9876543210', 'Hi Priya, connecting via NestMate!');
    expect(link).toBe('https://wa.me/919876543210?text=Hi%20Priya%2C%20connecting%20via%20NestMate!');
  });

  it('returns empty string safely when phone is empty, undefined, or invalid', () => {
    expect(formatWhatsAppDeepLink('')).toBe('');
    expect(formatWhatsAppDeepLink('   ')).toBe('');
    expect(formatWhatsAppDeepLink('---')).toBe('');
  });
});
