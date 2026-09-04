# SPRINT 2B — TRUST & VERIFICATION QUALITY AUDIT

## 1. Existing Trust Signals (as found)

| Signal | Field(s) | Set by | Real event behind it | Verdict |
|---|---|---|---|---|
| Identity verified | `users.isVerified`, `verificationLevel`, `isAadhaarVerified`, `isStudentIdVerified` | Admin only (`useAdmin.approveVerification`; rules block client writes via `trustFieldsUnchanged`) | Admin reviews uploaded ID in `verifications/{id}` | REAL |
| Work email / corporate verified | `workEmailVerified`, `isWorkIdVerified` | Admin only (same flow, type `work_id`) | Admin reviews work-ID upload | REAL |
| Phone verified | NO field exists | — | Firebase phone-auth OTP proves ownership at signup for phone-provider users only | PARTIAL — see T1 |
| Email verified | none for login email | Firebase Auth may hold `emailVerified` token claim | Not surfaced anywhere | GAP — documented |
| Profile complete | derived in `ProfileCompleteness` | computed | deterministic weights | REAL but see T2 |
| Listing availability confirmed | `listings.lastConfirmedAt` (Sprint 2A) | owner action, server timestamp | explicit owner confirmation | REAL |
| Vouches/reviews | `reviews/{id}` | any authenticated user | self-interaction NOT required | WEAK — see T3 |
| Account status | `users.status` | admin moderation | suspension/ban | REAL |

## 2. Verification Flows

- **ID/work verification:** user uploads evidence → `verifications/{id}` (private:
  owner+admin read per rules; Storage documents private) → admin approves/rejects
  in AdminVerifications → rules permit ONLY admins to flip trust fields
  (`trustFieldsUnchanged()` blocks normal users). Sound.
- **Phone:** `signInWithPhoneNumber` OTP at signup (phone-provider accounts).
  Google/email accounts never verify a phone. No `phoneVerified` field exists;
  ownership is provable from `auth.providerData`.
- **Email:** login-email verification state exists in the Auth token
  (`emailVerified`) but is never displayed or used. No fabrication added.

## 3. Problems Found

| # | Problem | Severity |
|---|---|---|
| T1 | `TrustBadge.computeTrustScore` marks "Phone Verified" as `done: true` for EVERY signed-in user ("Every signed-in user has phone verified") — false for Google/email signups | P0 |
| T2 | `ProfileCompleteness` counts `!!profile.workEmail` (email merely PROVIDED) toward the "Verify Work/College Email" completion item — conflates provided with verified | P1 |
| T3 | Reviews: rules allow ANY authenticated user to create a review with ANY `reviewerId`/`targetUserId` (spoofing others' identities, reviewing anyone, arbitrary ratings/text). Client-side self/duplicate checks are bypassable | P0 |
| T4 | RoomDetail shows a permanent "Verified Room — photos and details manually reviewed for authenticity" badge and a "Safe · Verified · Trusted — every profile and room on NestMate is manually reviewed" banner. No such manual room review process exists | P0 |
| T5 | TrustBadge tier names imply more than they mean (e.g., "Silver" from profile fill-out could read as a safety endorsement); breakdown panel does help, but tier labels need precise meaning | P2 |
| T6 | Review content unvalidated (rating range, text length) at both client and rules level | P1 |

## 4. What is already correct (do not touch)

- Sprint 1 rules: trust fields (`isVerified`, `verificationLevel`, etc.) immutable
  by non-admins; `verifications` readable only by owner+admin; identity documents
  private in Storage; reports validated & admin-only to act on.
- Admin approve/reject writes go through rule-checked admin paths.
- Phone-sharing consent architecture untouched.
- Sprint 2A availability confirmation is independent of identity verification.

## 5. Recommended Minimum Trust Model

Independent, precisely-labeled signals (no opaque score changes):
1. **Identity verified** — admin-reviewed government/student ID (existing)
2. **Work verified** — admin-reviewed work/college credential (existing)
3. **Phone verified** — Firebase phone-auth OTP provider (derive from auth, fix T1)
4. **Profile complete %** — deterministic field weights, verification items counted
   ONLY when actually verified (fix T2)
5. **Availability confirmed** — listing freshness (Sprint 2A), labeled distinctly
6. **Community vouches** — hardened reviews (fix T3/T6)
7. **Moderation status** — internal only, never public

## 6. Implementation scope for this sprint

- Fix T1 (phone step derives from auth provider)
- Fix T2 (completeness counts only real verification)
- Fix T4 (replace fake "Verified Room"/manual-review claims with truthful
  "Availability confirmed" signal + honest safety copy)
- Harden T3/T6 (review validation lib + rules: reviewerId bound to auth,
  no self-reviews, rating 1–5, text length cap)
- Tests for all of the above; all existing suites must stay green.