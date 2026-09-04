import { describe, it, expect } from 'vitest';
import { validateReport, REPORT_REASONS } from './reportValidation';
import { isAccountActive, blockedStatusMessage } from './accountStatus';

// ── P0-3: Report submission validation ────────────────────────────────────────
describe('validateReport', () => {
    const uid = 'user_abc';
    const target = 'user_xyz';

    it('accepts a valid report (SUCCESS CASE)', () => {
        const r = validateReport(
            { reporterId: uid, targetId: target, reason: 'spam', description: 'Selling products in chat' },
            uid
        );
        expect(r.valid).toBe(true);
        expect(r.payload).toMatchObject({
            reporterId: uid,
            targetId: target,
            reason: 'spam',
            status: 'pending',
        });
    });

    it('rejects a spoofed reporterId (UNAUTHORIZED CASE)', () => {
        const r = validateReport(
            { reporterId: 'someone_else', targetId: target, reason: 'spam' },
            uid
        );
        expect(r.valid).toBe(false);
        expect(r.payload).toBeUndefined();
    });

    it('rejects unauthenticated submissions (UNAUTHENTICATED CASE)', () => {
        const r = validateReport({ reporterId: '', targetId: target, reason: 'spam' }, '');
        expect(r.valid).toBe(false);
    });

    it('rejects self-reports (INVALID CASE)', () => {
        const r = validateReport({ reporterId: uid, targetId: uid, reason: 'spam' }, uid);
        expect(r.valid).toBe(false);
    });

    it('rejects missing target (INVALID CASE)', () => {
        const r = validateReport({ reporterId: uid, targetId: '', reason: 'spam' }, uid);
        expect(r.valid).toBe(false);
    });

    it('rejects invalid reasons (INVALID CASE)', () => {
        for (const bad of ['', 'hack_the_planet', '<script>alert(1)</script>']) {
            const r = validateReport({ reporterId: uid, targetId: target, reason: bad }, uid);
            expect(r.valid).toBe(false);
        }
    });

    it('rejects over-long descriptions (INVALID CASE)', () => {
        const r = validateReport(
            { reporterId: uid, targetId: target, reason: 'other', description: 'x'.repeat(2001) },
            uid
        );
        expect(r.valid).toBe(false);
    });

    it('exposes the canonical reason list used by rules and UI', () => {
        expect(REPORT_REASONS).toContain('spam_or_scam');
        expect(REPORT_REASONS).toContain('harassment');
        expect(REPORT_REASONS).toContain('fake_profile');
    });
});

// ── P0-11: Account status enforcement helpers ────────────────────────────────
describe('isAccountActive', () => {
    it('treats active and legacy/missing status as active (SUCCESS CASE)', () => {
        expect(isAccountActive('active')).toBe(true);
        expect(isAccountActive(undefined)).toBe(true);
        expect(isAccountActive(null)).toBe(true);
        expect(isAccountActive('')).toBe(true);
    });

    it('blocks suspended users (ENFORCEMENT CASE)', () => {
        expect(isAccountActive('suspended')).toBe(false);
    });

    it('blocks banned users (ENFORCEMENT CASE)', () => {
        expect(isAccountActive('banned')).toBe(false);
    });
});

describe('blockedStatusMessage', () => {
    it('returns null for active accounts', () => {
        expect(blockedStatusMessage('active')).toBeNull();
        expect(blockedStatusMessage(undefined)).toBeNull();
    });

    it('returns an explanation for suspended accounts', () => {
        expect(blockedStatusMessage('suspended')).toMatch(/suspended/i);
    });

    it('returns an explanation for banned accounts', () => {
        expect(blockedStatusMessage('banned')).toMatch(/banned/i);
    });
});