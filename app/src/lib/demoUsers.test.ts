import { describe, it, expect } from 'vitest';
import { isDemoEmail, isDemoProfile, DEMO_EMAIL_PREFIX } from './demoUsers';

describe('demo user quarantine', () => {
    it('detects demo emails by prefix', () => {
        expect(isDemoEmail('demo.seeker.123@nestmate.app')).toBe(true);
        expect(isDemoEmail('DEMO.OWNER.99@nestmate.app')).toBe(true); // case-insensitive
        expect(isDemoEmail('realuser@gmail.com')).toBe(false);
    });

    it('handles missing/malformed emails safely', () => {
        expect(isDemoEmail(null)).toBe(false);
        expect(isDemoEmail(undefined)).toBe(false);
        expect(isDemoEmail('')).toBe(false);
        expect(isDemoEmail(42 as any)).toBe(false);
    });

    it('detects demo profiles via explicit flag', () => {
        expect(isDemoProfile({ isDemo: true })).toBe(true);
        expect(isDemoProfile({ isDemo: false, email: 'x@gmail.com' })).toBe(false);
    });

    it('detects legacy demo profiles via email even without the flag', () => {
        expect(isDemoProfile({ email: 'demo.seeker.1700000000@nestmate.app' })).toBe(true);
    });

    it('never flags real users', () => {
        expect(isDemoProfile({ isDemo: false, email: 'mukesh@example.com' })).toBe(false);
        expect(isDemoProfile({})).toBe(false);
        expect(isDemoProfile(null)).toBe(false);
        expect(isDemoProfile(undefined)).toBe(false);
    });

    it('exposes the canonical prefix so writers stay in sync', () => {
        expect(DEMO_EMAIL_PREFIX).toBe('demo.');
    });
});