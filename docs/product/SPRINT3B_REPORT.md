# NESTMATE — SPRINT 3B REPORT: TRUTHFUL TRUST SIGNALS

Sprint: 3B — Trust & Verification Honesty
Scope: Trust surfaces must never claim more than the underlying mechanism proves.
Status: COMPLETE (with documented residual risks)

---

## 1. Executive Summary

Sprint 3B audited every trust surface in NestMate and removed all claims that
exceeded what the underlying mechanisms actually prove. The core finding was
systemic: **the product's trust language described an aspirational verification
infrastructure, not the implemented one.** No security hole allowed a user to
*earn* a badge they didn't deserve (admin-only writes were already enforced),
but users were *told* things had been verified when they had not.

Key outcomes:
- Phone-verification claims are now derived from actual Firebase Auth providers, not assumed.
- "Verified" badges now map 1:1 to admin-set Firestore flags with rules-enforced write protection.
- Profile completeness no longer counts provided-but-unverified emails.
- All fabricated marketing claims (#1 platform, 12,000+ members, city room counts, testimonials, "100% Trusted", "Every profile is verified") were removed from the landing page.
- A real robustness bug found by new tests (crash on malformed avatar; fabricated quiz points from string fields) was fixed in `computeTrustScore`.

## 2. Audit Findings (SPRINT3B_TRUST_AUDIT.md)

See `docs/product/SPRINT3B_TRUST_AUDIT.md` for the full audit. Summary:

| # | Finding | Severity | Fixed |
|---|---------|----------|-------|
| T1 | Phone badge shown for Google signups (no OTP ever performed) | P1 | ✅ |
| T2 | Completeness counted *provided* work email as verified (+15%) | P1 | ✅ |
| T3 | Review/vouch validation existed; rules restrict writes correctly | OK | n/a |
| T4 | Landing page: "#1 Platform", "12,000+", city room counts, testimonials, "Every profile is verified", "100% Trusted" — all unsupported | P1 | ✅ |
| T5 | Onboarding copy claimed mandatory Aadhaar/DigiLocker that is optional | P2 | ✅ |
| T6 | Rules: `isVerified`, `workEmailVerified`, `verificationLevel` not client-writable (admin-only) — verified correct | OK | n/a |
| T7 | `computeTrustScore` crashed on non-string avatar; `Object.keys` on a string field granted quiz points | P2 | ✅ |

## 3. Changes Made

### Truthful copy
- `app/src/pages/SeekerOnboarding.tsx` — ID verification step now labeled "(Optional)"; honest description of manual review timeline.
- `app/src/pages/OwnerOnboarding.tsx` — same treatment for owner flow.
- `app/src/components/ProfileCompleteness.tsx` — work-email step requires `workEmailVerified` flag, not mere presence of `workEmail`.
- `app/src/components/TrustBadge.tsx` — phone step derives from `authProviders.includes('phone')`; header comment documents tier semantics truthfully; hardened against malformed input.
- `app/src/hooks/useTranslation.ts` — tagline no longer claims "verified" roommates (all 4 languages' English fallback).
- `app/src/pages/LandingPage.tsx`:
  - Removed "India's #1 Roommate & Flat Finder Platform" superlative.
  - Removed "Verified profiles" / "Every profile is verified. Every connection is safe." claims → replaced with accurate trust-ladder description.
  - Removed "100% Trusted" → "Consent-based contact".
  - Removed "Explore verified 1BHK…" → "Explore 1BHK…".
  - Removed fabricated city room counts ("3,200+ Rooms" etc.) → neutral "Explore rooms".
  - Removed "Join 12,000+ people…" fabricated member count.
  - **Deleted the entire fabricated testimonials section** (invented people, photos, quotes).

### Robustness fix (found by tests)
- `computeTrustScore`: avatar step now type-checks (`typeof === 'string'`); quiz step only accepts plain objects (previously a string value like `"not-an-object"` yielded ≥5 keys via `Object.keys` and granted 15 points).

## 4. Tests Added

`app/src/lib/trustSignals.test.ts` — new describe block "malformed input & zero-data honesty (Sprint 3B)", 6 tests:
1. Null profile → score 0, no steps fabricated.
2. Malformed profile (number avatar, object bio, string quizAnswers, string isVerified) → deterministic, bounded score, no throw.
3. Zero-data user → 0% completeness (no default percentage).
4. Provided email ≠ verified email for completeness; verified flag = +15.
5. Document upload alone does NOT complete the identity step.
6. Listing availability confirmation does NOT grant identity trust or Pro tier.

## 5. Test Results

```
Test Files  13 passed (13)
Tests       149 passed (149)
tsc -b      pass (npm run check)
vite build  pass (npm run build)
```

## 6. Root Cause Analysis

The root cause across all findings was one pattern: **UI copy and scoring logic
were written against the intended product, not the shipped product.** The fix
strategy was to make every displayed claim derive from a specific database
field whose write path is protected by Firestore rules:

| Claim | Now derived from | Write protection |
|-------|------------------|------------------|
| Phone Verified | Firebase Auth provider IDs | Auth system |
| Work Email Verified | `users.workEmailVerified` | Admin-only (rules) |
| Government ID Verified | `users.isVerified` | Admin-only (rules) |
| Profile % | Weighted field checklist incl. verified flags | Client-computed display only |

## 7. Regression Risk

- LOW: All changes are copy/display-layer except the two `computeTrustScore` guards, which only narrow acceptance (no previously-valid input now scores higher).
- The testimonial section removal changes landing-page layout (section gone). This is intentional per §13/P0-4.
- Translation files: Hindi/Tamil/Telugu taglines still contain the word "verified" in their native strings (English fallback fixed). Flagged as residual risk below.

## 8. Residual Risks & What Remains Unknown

1. Non-English taglines (hi/ta/te) may still translate to "verified roommates" — needs native-speaker review next sprint.
2. Trust tiers Silver/Gold/Pro labels are shown to end users; while each maps to real signals, the *tier names themselves* ("Gold", "Pro") are marketing-flavored. Acceptable for now; revisit if user research shows confusion.
3. Manual review SLA copy says "typically within a few days" — this is an operational commitment, not a technical guarantee; it depends on admin availability.
4. Rules enforcement for admin flags was verified by code inspection and existing rule tests, but full emulator-based rule suite coverage remains a Sprint-1 follow-up item.

## 9. Next Sprint

MARKETPLACE QUALITY (as planned) — do not start automatically.