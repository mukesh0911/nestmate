# NESTMATE — PRODUCTION INTEGRITY SPRINT REPORT (Sprint 1)

## 1. Executive Summary

Sprint 1 hardened NestMate's security foundation before any UI redesign work.
The sprint covered admin authorization, sensitive-data protection, reporting
integrity, removal of fake/fallback production data, dev-route isolation,
truthful verification claims, onboarding enforcement, Firestore/Storage rule
hardening, PII hygiene, account-status enforcement, and regression tests.

**Verification status at end of sprint:**
- Production build (`npm run build`): ✅ passes
- Typecheck (`npm run check` / `tsc -b`): ✅ passes
- Unit test suite (`npm test`, vitest): ✅ **39/39 tests pass across 6 suites**
- Full audit report: `docs/security/SPRINT1_AUDIT.md`

This report does NOT claim "zero bugs." It reports what was tested, what
passed, what remains unknown, and which risks remain.

---

## 2. Initial Audit Findings

Full audit is in `docs/security/SPRINT1_AUDIT.md`. Headline findings:

| # | Finding | Severity |
|---|---------|----------|
| A1 | Admin authorization relied partly on client-side checks; rules needed server-side `isAdmin()` enforcement | P0 |
| A2 | Identity-document / verification fields readable/writable too broadly; Storage paths under-restricted | P0 |
| A3 | Report submission had no validation layer; reporter spoofing possible client-side; rules did not validate reason/status | P0 |
| A4 | Fake "verified" fallback owners injected into match results when DB was empty (`useMatches.ts`) | P0 |
| A5 | Fake demo flatmates injected into BrowseSeekers when DB empty; synthetic owner profiles hard-coded `isVerified: true`; fabricated default compatibility score of 85% | P0 |
| A6 | `/dev/seed` route reachable in production builds; SeedData page had no environment guard | P0 |
| A7 | Verification badges ("Verified", "Corporate Verified", "ID Verified") driven by user-writable fields with no real verification event behind some claims; landing page claimed "Aadhaar Verified", "12.4K+ Verified", "96% Accuracy" — all fabricated | P0 |
| A8 | Onboarding bypass: App.tsx hard-coded `onboardingComplete: true` for every signed-in user regardless of the real DB field; dashboards never checked completion | P0 |
| A9 | Suspended/banned users could continue using interactive features (no status check anywhere in UI or guards) | P0 |
| A10 | Test infrastructure broken: entire vitest suite failed to run ("Cannot read properties of undefined (reading 'config')") | P0 |

---

## 3. P0 Issues Found

See table above (A1–A10). Each maps to a fix below.

## 4. P0 Issues Fixed

### P0-1 Admin authorization
- **Root cause:** admin capabilities were gated by UI + a client hook that could be trusted only if backed by server rules.
- **Files:** `app/firestore.rules`, `app/src/hooks/useAdmin.ts`, `app/src/lib/adminKeys.ts`
- **What changed:** rules enforce an `isAdmin()` helper reading `admins/{lowercased auth email}` (server-derived from the auth token — never client-supplied). Admin collections (admins, reports moderation, verifications, user suspension) are writable only by admins. Client `useAdmin()` reads the same source for UX gating.
- **Security impact:** a normal user cannot invoke any admin write even via direct SDK calls.
- **Tests:** unit coverage of helper logic + manual matrix (see §11). Automated emulator-based ADMIN/NORMAL/UNAUTH tests are listed as remaining work (§12).
- **Bootstrap:** create `admins/<email>` docs in the Firebase console (documented in audit).

### P0-2 ID documents / sensitive data
- **Files:** `app/firestore.rules`, `app/storage.rules`
- **What changed:** identity-document and verification-evidence fields are not publicly readable; document Storage objects are private (owner + admin read only); profile photos/listing images remain public-read; uploads restricted by path ownership, size, and content type.
- **Security impact:** no public URL exposure of government IDs; admin access goes through deliberate, rule-checked paths.

### P0-3 Reporting system
- **Files:** `app/src/lib/reportValidation.ts` (new), `app/src/hooks/useUserProfile.ts`, `app/firestore.rules`
- **What changed:** `validateReport()` validates reason against a canonical allow-list, rejects spoofed `reporterId` (must equal auth uid), self-reports, missing targets, and >2000-char descriptions. Rules re-validate authoritatively: `reporterId == request.auth.uid`, reason ∈ allow-list, status locked to `pending` on create; reports readable only by reporter (own) and admins; updates/deletes admin-only.
- **Tests:** 9 unit tests in `app/src/lib/security.test.ts` covering success, spoofed reporter, unauthenticated, self-report, invalid reasons (incl. XSS payload), over-long description.

### P0-4 Fake/fallback production data removed
- **Files:** `app/src/hooks/useMatches.ts`, `app/src/pages/BrowseSeekers.tsx`
- **What changed:** deleted `owner_fallback_1/2` fake verified owners from match results; deleted `demo_flatmate_1..4` fallback profiles from BrowseSeekers; removed fabricated `isVerified: true` on synthetic listing-owner profiles; replaced fabricated default compatibility score (85%) with 0 when preference data is missing. Empty results now render proper empty states ("No matching rooms yet" style).
- **Regression risk:** low — behavior change is intentional (empty state instead of fake data).

### P0-5 Dev/seed route protection
- **Files:** `app/src/App.tsx`, `app/src/pages/SeedData.tsx`
- **What changed:** `/dev/seed` route compiled out of production builds via `import.meta.env.DEV`; SeedData component itself returns a "Dev tools unavailable" screen when not in DEV (defense-in-depth).
- **Verified:** production bundle contains the guard; route unreachable in prod.

### P0-6 Verification claims made truthful
- **Files:** `app/src/components/HeroMatchShowcase.tsx`, `app/src/pages/BrowseSeekers.tsx`, `app/src/pages/OwnerDashboard.tsx`
- **What changed:** landing-page showcase now labeled "Example preview — not live listings"; removed fabricated stats (12.4K+ Verified, 96% Accuracy, ₹8.5K Avg Save) and replaced with true product facts (₹0 brokerage, consent-based contact sharing, lifestyle matching); "Aadhaar Verified" pill → "Private Phone Sharing"; sample-data "Aadhaar Verified" factor removed. Badges elsewhere render only from real DB fields (`isVerified`, `workEmailVerified`, `verificationLevel`) written through controlled flows/rules.
- **Note:** full backend verification workflows (DigiLocker/Aadhaar) remain partially implemented; UI copy no longer overclaims.

### P0-7 Onboarding enforcement
- **Files:** `app/src/App.tsx`
- **What changed:** `onboardingComplete` now read from the real Firestore field (`data.onboardingComplete === true`) instead of being hard-coded true; new `OnboardingGuard` redirects incomplete users to `/role-select` on ALL interactive routes (dashboards, chat, edit-listing, profile, settings, notifications); missing-profile and listener-error cases fail closed (treated as incomplete).
- **Server-side note:** matching queries already filter `onboardingComplete == true`; listing creation rules require completed profiles (see rules).

### P0-8 Firestore rules hardened
- Collection-by-collection audit performed (users, listings, connections, chatRooms/messages, reports, verifications, notifications, reviews/vouches, admins, privateUserData, analytics). No `allow read/write: if true` wildcards remain on sensitive collections; ownership validated via `request.auth.uid`; role/verification/status fields protected from client writes. See `app/firestore.rules`.

### P0-9 Storage rules hardened
- Path-scoped rules: `avatars/{uid}/*`, `listings/{ownerId}/*` (public read, owner write), `documents/{uid}/*` and verification evidence (private: owner + admin only), size/type limits. See `app/storage.rules`.

### P0-10 PII / privacy
- Public `users` documents carry no phone/email/workEmail (cleared on write; stored in owner-only `privateUserData/{uid}`); `sanitizePublicProfile` strips PII from every cross-user read path; phone sharing remains behind the existing consent flow; no PII persisted to localStorage.

### P0-11 Account status / ban enforcement
- **Files:** `app/src/lib/accountStatus.ts` (new), `app/src/App.tsx`, `app/firestore.rules`
- **What changed:** `status` field (`suspended`/`banned`) written by admin actions; `isActiveUser()` in rules blocks writes/interactions for non-active accounts; UI shows a full-screen "Account Restricted" notice with sign-out on all guarded routes; legacy accounts without `status` treated as active.
- **Tests:** 6 unit tests for `isAccountActive` / `blockedStatusMessage`.

### P0-12 Critical flow tests
- Unit suites now runnable and green (39 tests): compatibility engine, connection guards, phone-share assignment, role filtering, profile sanitization (PII), report validation, account status. See §10/§11.

### P0-13 Misleading product claims removed
- Covered under P0-6. No fabricated user counts, success rates, testimonials, or AI claims remain in shipped copy.

### Bonus fixes found during the sprint
- `BrowseSeekers.tsx`: undefined `pageTitle`/`pageSubtitle` references replaced with proper headings (would have crashed the standalone page).
- `OwnerDashboard.tsx`: invalid `title` prop on lucide icons fixed (type errors surfaced after dependency refresh).

---

## 5. Issues Intentionally Not Fixed

1. **Emulator-based integration tests for Firestore/Storage rules** — requires Firebase emulator setup in CI; deferred to next sprint rather than shipping flaky half-tests. Rules were reviewed manually collection-by-collection.
2. **Real Aadhaar/DigiLocker verification backend** — out of scope per sprint rules ("do not invent verification infrastructure unless required for security"); misleading claims removed instead.
3. **Seed data tooling kept but isolated** — `direct_seed.ts`, `clear_db.ts`, `scripts/wipe-firestore.mjs` remain as developer-only scripts (not wired into the app); acceptable since they cannot execute in production.
4. **Vitest runner quirk on this machine** — running vitest from `app/` fails with a runner bug ("reading 'config'") regardless of config format; standardized `npm test` on the proven-working invocation (`npx -y vitest@4.1.11 run` from repo root) and converted test imports to relative paths. Root cause unknown (suspected local node_modules/npm-cache interaction); documented as tech debt.
5. **Razorpay mock-key guard in PricingPage** — already correctly refuses mock keys; left as-is.

## 6. Files Changed

- `app/firestore.rules` — hardened (admin, reports, verification, status, ownership)
- `app/storage.rules` — hardened (private documents, scoped uploads)
- `app/src/App.tsx` — routing guards (onboarding, account status), dev-route gating
- `app/src/lib/accountStatus.ts` — NEW
- `app/src/lib/reportValidation.ts` — NEW
- `app/src/lib/adminKeys.ts`, `app/src/hooks/useAdmin.ts` — admin source-of-truth
- `app/src/hooks/useUserProfile.ts` — validated reportUser
- `app/src/hooks/useMatches.ts` — fake owners removed
- `app/src/pages/BrowseSeekers.tsx` — fake profiles/scores removed, heading bug fixed
- `app/src/pages/SeedData.tsx` — DEV-only guard
- `app/src/components/HeroMatchShowcase.tsx` — truthful marketing copy
- `app/src/pages/OwnerDashboard.tsx` — icon title-prop fix
- `app/src/lib/security.test.ts` — NEW (14 tests)
- `app/src/lib/*.test.ts` (5 files) — relative imports so suite runs config-free
- `package.json` — `test` script standardized
- `scripts/fix-test-imports.cjs` — one-off migration script (kept for reference)
- `docs/security/SPRINT1_AUDIT.md`, `docs/security/SPRINT1_REPORT.md` — documentation

## 7. Database / Firestore Changes

- New/changed rule helpers: `isAdmin()`, `isActiveUser()`.
- Protected fields: `role`, `isVerified`, `workEmailVerified`, `verificationLevel`, `status`, `connectsUsed` — not client-writable except through allowed flows.
- `reports`: create = authenticated, self-attributed, validated; read = author or admin; update/delete = admin only.
- Admin bootstrap: create `admins/{email-lowercase}` docs via console.

## 8. Storage Rule Changes

- `documents/`, verification evidence: private (owner + admin).
- `avatars/`, `listings/`: public read, owner-scoped write, size/type limits.

## 9. Authentication / Authorization Changes

- All admin writes require `admins/{auth-email}` doc.
- Reporter identity bound to auth token.
- Suspended/banned users blocked at rules level and routed to a restriction screen.
- Onboarding completion enforced from the DB field, fail-closed.

## 10. Tests Added

- `app/src/lib/security.test.ts` — 14 tests (report validation ×9, account status ×6 grouped)
- Existing suites repaired & runnable: compatibility (11), connectionGuards (8), phoneShare (2), roleFiltering (3), sanitizeProfile (1)

## 11. Test Results

```
Test Files  6 passed (6)
     Tests  39 passed (39)
```

Manual verification steps performed:
- Production build contains no `/dev/seed` route; SeedData renders "unavailable" outside DEV.
- Empty-database scenarios render empty states (no fake profiles possible — code paths deleted).
- Admin matrix reviewed against rules: NORMAL USER → denied on admin collections; ADMIN → allowed; UNAUTHENTICATED → denied (rule-level; automated emulator tests pending, see §12).

## 12. Remaining Risks

1. **Firestore/Storage rules lack automated emulator tests** — highest-priority follow-up. Manual review done; automated NORMAL/ADMIN/UNAUTH matrix not yet in CI.
2. **End-to-end flow tests** (signup→onboarding→listing→connect→chat→phone-share) are not yet automated; covered only by unit tests of pure logic + manual QA.
3. **Vitest runner quirk** — `npm test` depends on npx fetching vitest@4.1.11; pinning/local-install issue unresolved on this machine (works, but should be revisited).
4. **Verification backend gaps** — badges reflect DB flags, but the underlying verification workflows are partial; copy is now truthful but features like "ID Verified" depend on admin/manual processes.
5. **20 npm audit vulnerabilities reported** (1 critical) — dependency audit/remediation recommended next sprint.
6. **Unknowns:** real-device push notifications, map clustering under load, and concurrent-connection edge cases were not exercised this sprint.

## 13. Recommended Next Sprint

**MARKETPLACE QUALITY** (as planned), preceded by two quick security follow-ups:
1. Firebase emulator rule-test harness (admin/user/unauth matrix) in CI.
2. `npm audit` remediation (1 critical, 3 moderate).

Then proceed to listing freshness, availability confirmation, trust profiles, match explanations, ranking quality, and owner/seeker experience improvements.

— End of Sprint 1 report. Sprint 2 not started.