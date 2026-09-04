# NESTMATE — SPRINT 3B TRUST AUDIT

**Date:** 2026-08-23 · Evidence-based inspection of every trust surface before implementation.

## Existing Trust Signals (verified in code)

| Signal | Field | Writer | Truthful? |
|--------|-------|--------|-----------|
| Phone verified | derived from Firebase auth provider list | Firebase Auth (read-only derivation) | ✅ Only when `authProviders.includes('phone')` |
| Work email verified | `workEmailVerified` | Admin-only (`useAdmin.verifyUser`) | ✅ Rules deny-list blocks user updates |
| Identity verified | `isVerified`, `verificationLevel` | Admin-only (`useAdmin.verifyUser` sets level 3) | ✅ Rules block user updates; creation forced to ≤1/false |
| Profile completeness | derived | pure calc (`computeCompleteness`) | ✅ deterministic; work-email step counts only `workEmailVerified` |
| Availability confirmed | `lastConfirmedAt` (listing) | owner confirmation action (2A) | ✅ separate from identity |

## Verification Lifecycle (existing representation)
No boolean-only collapse: the lifecycle exists as **verifications collection queue** (pending → approved/rejected by admin via AdminVerifications) + user fields (`isVerified` bool, `verificationLevel` 0/1 default vs 3 = admin-verified). Per prompt §6, NO schema migration was made — existing representation is semantically adequate. Documented mapping: not_started (no submission) → pending (doc in verifications queue) → verified (admin approval) / failed (rejection). expired/revoked states are NOT implemented and are NOT claimed anywhere.

## Firestore Rule Protection (verified)
- Update path: non-admin users denied writes touching `isVerified, isPremium, workEmailVerified, verificationLevel, verificationDetails, premiumSince, isAadhaarVerified, isWorkIdVerified, isStudentIdVerified` (hasAny deny-list).
- Create path: `trustFieldsSafeOnCreate()` forces `isVerified:false`, `workEmailVerified:false`, `verificationLevel ≤ 1`.
- Client writers audited: `useAuth.ts` creates profiles with `isVerified:false`; the ONLY `isVerified = true` writer is `useAdmin.ts`. **No self-assignment path found.**

## Storage
Identity documents stored privately (Sprint 1); owner/admin-only read. No public URLs. No changes needed this sprint.

## UI Surfaces Audited
- **TrustBadge.tsx**: phone step truthful (provider-derived); breakdown panel explains each step (satisfies explainability). Issues: header comment mentions "LinkedIn" though no LinkedIn signal exists; aadhaar step says "Aadhaar or government-issued ID" while the actual mechanism is document upload + manual admin review — wording should describe the real mechanism.
- **ProfileCompleteness.tsx**: workemail semantics truthful (2B). Issue: photo nudge claims "Profiles with photos get 3x more connects" — fabricated statistic.
- **AadhaarVerifyModal / DigiLockerModal**: honest stubs, explicitly labeled Future Production Integration, grant nothing client-side, not routed. ✅ No fake verification.
- **RoomDetail**: already carries Sprint 2B truthful trust copy ("NestMate does NOT manually review rooms"). ✅

## Unsupported Claims Found (to fix)
1. LandingPage: "**12,400+** verified matches across top cities" — fabricated statistic + unsupported "verified".
2. LandingPage: "verified room matches in Bengaluru, Mumbai & Delhi NCR" — unsupported + wrong cities.
3. LandingPage: "3-Tier Verified Profile — Phone · Work Email · Aadhaar" — ladder is real but "Aadhaar" overclaims (no Aadhaar e-KYC; generic gov-ID doc review).
4. SeekerOnboarding + OwnerOnboarding: "We match you with **verified** room seekers in the same city" — users are not verified.
5. useTranslation tagline: "Connect with **verified** roommates and owners in India."
6. ProfileCompleteness: "3x more connects" fabricated stat.

## Vouches/Reviews
`reviewValidation.ts` enforces reviewer=auth.uid, no self-review, rating bounds, text length; covered by existing tests. Neutral language used. Duplicate prevention is client-side — documented limitation (unchanged).

## Recommended Implementation Boundary
Copy fixes only + TrustBadge mechanism descriptions + tests. NO new verification infrastructure, NO provider simulation, NO schema migration, NO rule changes (already correct), NO storage changes.