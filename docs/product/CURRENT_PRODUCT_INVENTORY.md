# NESTMATE — CURRENT PRODUCT INVENTORY

**Date:** 2026-08-23 · Evidence-based audit of the codebase as of commit after Sprint 2E hardening. Statuses: COMPLETE / PARTIAL / BROKEN / MISSING / TECH-DEBT / NEEDS VALIDATION.

## A. Authentication — COMPLETE
Email/password + phone OTP (PhoneLogin, OTPVerify). Phone verification derived from actual auth provider (2B) — no fabricated phoneVerified flags. AuthModal gating for anonymous users on high-intent actions.

## B. Onboarding — COMPLETE (enforcement NEEDS VALIDATION server-side)
RoleSelect → SeekerOnboarding / OwnerOnboarding. `onboardingComplete` flag gates discovery queries. Enforcement is query-level (Firestore `where('onboardingComplete','==',true)`) + client route guards; Firestore rules reviewed in Sprint 1. Direct-URL bypass leads to empty states rather than data corruption.

## C. Seeker functionality — COMPLETE
Dashboard matches (useMatches), Explore rooms/roommates tabs, Map discovery, saved rooms, filters (city/budget/gender/locality/flatType/furnishing/amenities), interest sending, chat, contact-share consent flow (phoneShare), skip/block.

## D. Owner functionality — PARTIAL (weakest product area)
- Listing CRUD: COMPLETE (create/edit/pause/close/delete, multiple listings per owner since 2E).
- Availability confirmation: COMPLETE (lastConfirmedAt, 14d stale / 45d expired).
- Incoming requests: chronological only (`subscribeToIncoming` orders by `createdAt desc`). **No compatibility, intent, budget-fit or trust surfacing. Owner cannot answer "who should I talk to first?"** → primary gap.
- Applicant context shown: name/avatar/basic profile fields only.

## E. Listings — COMPLETE
Model: status, lastConfirmedAt, images, amenities, partnerShare/totalRent, city/locality, flatType, furnishing, availableFrom, ownerId. Freshness derived not stored (no cron needed). Orphan policy = HIDE (2E hardening).

## F. Discovery — COMPLETE (consistency hardened in 2E)
Shared `marketplaceVisibility` helpers across Dashboard/Explore/Map. Cross-city fallback is explicit and disclosed. Blocked-user filtering present. Empty states honest (StateEmpty).

## G. Matching — COMPLETE (eligibility) / PARTIAL (two-sided)
Eligibility before ranking (2C): expired listings, suspended/banned, demo accounts excluded. Pagination + explicit cross-city widening. **Matching is seeker→owner only; owners receive no ranked applicants.**

## H. Compatibility — COMPLETE
Pure `calculateCompatibility` (quiz-overlap %, cross-city cap 60%). Reproducible from underlying data (Rule 16 satisfied).

## I. Trust — PARTIAL
Real signals: phone verification (auth-derived), availability confirmation freshness, review validation (reviewValidation.ts prevents spoofing), TrustBadge component. Missing: work/identity verification genuinely implemented end-to-end (DigiLocker/Aadhaar modals exist — NEEDS VALIDATION whether they write real verifiable state or are UI-only).

## J. Connections — COMPLETE
Connection model (fromUserId/toUserId/status/createdAt), request/accept/reject, relationship-state helper (getRelationshipState), monthly send-count limiting. Acceptance creates chat room + notification.

## K. Chat — COMPLETE
Chat rooms keyed by participant pair, ChatPage, message authorization reviewed Sprint 1. Real-time subscription.

## L. Contact sharing — COMPLETE
Consent-gated phone sharing (phoneShare lib + tests); numbers not exposed before mutual consent.

## M. Reviews/vouches — PARTIAL
Foundations exist (useReviews, reviewValidation, trustSignals). Vouches appear foundational only — NEEDS VALIDATION for real usage flows.

## N. Reports/blocks — COMPLETE
Report submission with validation (reportValidation.ts), admin reports queue (AdminReports), blocking with bidirectional discovery filtering.

## O. Analytics — COMPLETE
Closed taxonomy (analytics.ts), demo-account exclusion, privacy-safe events, funnel: search → view → interest → accept → chat → contact share; admin marketplace insights (AdminMarketplace).

## P. Admin — COMPLETE
Server-enforced admin role (Sprint 1), user management, verifications queue, listings moderation, reports, notifications, settings, marketplace insights.

## Q. Notifications — COMPLETE
In-app notifications (createNotification on connect etc.), NotificationsPage, push notification hooks, admin notifications console.

## R. Mobile experience — PARTIAL
Responsive layouts throughout (mobile variants in dashboards, map list-view toggle, bottom nav). Not systematically QA'd on real devices. NEEDS VALIDATION.

## S. Security — COMPLETE (as of Sprint 1 + 2E)
Firestore/Storage rules hardened, admin server-side, private ID document storage, seed routes protected, PII sanitization (sanitizePublicProfile), demo quarantine. Remaining risk documented in Sprint 1 report §Remaining Risks.

## T. Performance — TECH-DEBT
Known debts (measured impact pending):
1. Fallback full-collection scans in useMatches/BrowseSeekers when constrained queries fail or return empty.
2. MapView rooms mode: full `users` read for owner resolution (added 2E-hardening; acceptable at current scale).
3. N+1 owner-profile fetch loop in useMatches listing hydration.
4. BrowseSeekers loads all users (Layer 1) without pagination.

## Test infrastructure — COMPLETE
Vitest, 133 tests / 12 files passing, tsc strict clean, production build green.