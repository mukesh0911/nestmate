# NestMate — Sprint 1 (Production Integrity) Audit Report

Date: 2026-08-23
Scope: Full codebase audit (`app/`, `scripts/`, CI workflows, Firebase config/rules).
Method: Static trace of UI → client logic → Firebase SDK calls → Firestore/Storage rules.
No code was modified before this report was produced.

---

## Severity Definitions

- **P0** — Exploitable security hole, broken critical flow, or fabricated production data. Must fix this sprint.
- **P1** — Real risk or integrity gap; fix now if small, otherwise schedule immediately after.
- **P2** — Hygiene / defense-in-depth.

---

## Findings

### F-01 — Admin authorization is an email-regex wildcard (P0)
- **Location:** `app/firestore.rules` (`isAdmin()`), `app/src/hooks/useAdmin.ts`
- **Current behavior:** `isAdmin()` grants full read/write on **every document** to any authenticated user whose email matches `.*@nestmate\.com$`. Client-side admin check additionally trusts hardcoded emails (`test@nestmate.com`, `admin@nestmate.com`).
- **Why risky:** Anyone can register `attacker@nestmate.com` with email/password auth and receive unrestricted read/write/delete over the entire database: all users, private contact data, verification documents, chats, reports. This is a total compromise vector.
- **Recommended fix:** Base admin authorization on the existence of an `admins/{email}` Firestore document (email taken from the verified auth token). Remove the email regex and hardcoded client emails. Bootstrap the founder's admin doc via console/script.
- **Code change required:** Yes (rules + useAdmin).
- **Tests:** NORMAL USER → DENIED; ADMIN → ALLOWED; UNAUTHENTICATED → DENIED.

### F-02 — Reports collection has no security rules; reporting is broken (P0)
- **Location:** `app/firestore.rules` (no `/reports` block), `app/src/hooks/useUserProfile.ts` (`reportUser`), `app/src/hooks/useAdmin.ts` (`getAllReports`)
- **Current behavior:** Users submit reports via `addDoc(collection(db,'reports'))`. No rule matches `reports`, so the only access is the admin wildcard. Result: **normal users' report submissions are denied** in production (permission-denied) and admins can read everything but users cannot file reports at all.
- **Why risky:** Broken safety feature; also when it "worked" in dev it relied on the wildcard hole (F-01).
- **Recommended fix:** Add explicit rules: create allowed for authenticated users with server-enforced `reporterId == request.auth.uid`, validated reason enum, length limits, `targetId != reporterId`; read/update/delete admin-only.
- **Code change required:** Yes (rules + client validation helper).
- **Tests:** Valid report accepted; spoofed reporterId denied; unauthenticated denied; non-admin cannot read/update reports.

### F-03 — Suspended/banned users can self-reinstate and keep using the marketplace (P0)
- **Location:** `app/firestore.rules` (`users` update), `app/src/hooks/useAdmin.ts`, app-level flows
- **Current behavior:** `trustFieldsUnchanged()` protects verification fields only. A suspended user can call `updateDoc(users/{uid}, { status: 'active' })` and instantly reinstate themselves. Nothing else checks `status`: suspended users can create listings, send connections, send messages.
- **Why risky:** Moderation actions are trivially reversible by the offender.
- **Recommended fix:** Rules: `status` field immutable except by admins. Rules: listing/connection/chat-message creation requires the caller's own user doc to have `status == 'active'` (missing status treated as active for legacy docs). Client: show blocked-account screen for suspended/banned users.
- **Code change required:** Yes (rules + App.tsx guard).
- **Tests:** Self-reinstate denied; suspended user cannot create listing/connection/message; admin can suspend/reinstate.

### F-04 — Identity documents readable by any authenticated user via Storage rules (P0)
- **Location:** `app/storage.rules` (`profiles/{userId}/{allPaths=**}`), upload path in `app/src/pages/EditProfile.tsx` (`profiles/{uid}/verifications/...`)
- **Current behavior:** Government-ID uploads live under `profiles/{uid}/verifications/**`, which inherits `allow read: if request.auth != null`. Any logged-in user who learns/guesses a path can download another user's ID document.
- **Why risky:** Direct PII leak of the most sensitive class of data.
- **Recommended fix:** Split Storage rules: `profiles/{userId}/verifications/**` → owner-only write/read (admin review continues to work through stored download URLs until a backend issues signed URLs; documented residual risk). Add content-type and size validation to all upload paths.
- **Code change required:** Yes (storage.rules).
- **Tests:** Owner upload OK; second authenticated user read of verification path denied.

### F-05 — Fake "verified" fallback owners injected into match feed (P0)
- **Location:** `app/src/hooks/useMatches.ts` (lines ~167–207)
- **Current behavior:** When no candidates are found, two fabricated owners ("Rohan Verma", "Karthik Iyer", UIDs `owner_fallback_1/2`) with `isVerified: true`, fake companies, Unsplash photos and hardcoded quiz answers are shown as real matches.
- **Why risky:** Fabricated marketplace data; fake verification badges; users may try to connect with nonexistent people.
- **Recommended fix:** Delete the fallback block; return empty results so UI shows a proper empty state.
- **Code change required:** Yes.
- **Tests:** Unit test that findMatches result contains no `owner_fallback_*` / fabricated profiles (logic-level guard).

### F-06 — Fake "verified" seeker profiles injected into Browse Seekers (P0)
- **Location:** `app/src/pages/BrowseSeekers.tsx` (`fallbackProfiles`, `demo_flatmate_1..4`)
- **Current behavior:** When the profile map is empty, four fabricated profiles with `isVerified: true` are rendered as real seekers.
- **Why risky:** Same as F-05.
- **Recommended fix:** Delete injection; render existing empty state.
- **Code change required:** Yes.

### F-07 — 1-click demo accounts created in production database (P0)
- **Location:** `app/src/components/AuthModal.tsx`
- **Current behavior:** Every visitor can create real Firebase Auth accounts (`demo.seeker.<ts>@nestmate.app`) with fake names ("Rohan (Demo Seeker)") that appear as real users to everyone else (`onboardingComplete: true`).
- **Why risky:** Pollutes production marketplace with fake users; unlimited free account creation bypassing signup friction.
- **Recommended fix:** Gate demo login behind `import.meta.env.DEV` (hidden entirely in production builds). Dev seed tooling stays available locally.
- **Code change required:** Yes.

### F-08 — `/dev/seed` route publicly accessible in production (P0)
- **Location:** `app/src/App.tsx` (route `/dev/seed`), `app/src/pages/SeedData.tsx`
- **Current behavior:** Any visitor (even unauthenticated) loads the seed tool; logged-in users can attempt mass writes/deletes. Seed writes of trust fields would be denied by rules for non-admins, but the route itself must never ship.
- **Why risky:** Development-only destructive/data-mutation tool exposed to production.
- **Recommended fix:** Render the route only when `import.meta.env.DEV`; production builds get NotFound.
- **Code change required:** Yes.
- **Tests:** Production build does not contain the seed chunk/route (build-level check + code guard).

### F-09 — Fake verification scaffold returns "VERIFIED" unconditionally (P0)
- **Location:** `app/src/api/router.ts`
- **Current behavior:** Dead code (no imports anywhere) but contains `verification.submitDoc()` that always returns `{ status: 'VERIFIED', method: 'DigiLocker e-KYC' }` and a fake match scorer returning a default 85.
- **Why risky:** Misleading verification logic; if ever wired up it would self-grant verification. Violates "marketing language must not exceed implementation".
- **Recommended fix:** Delete the file. Real verification flow is Edit Profile upload → `verifications` collection → admin review (which is genuine and stays).
- **Code change required:** Yes (delete).

### F-10 — Fabricated marketing statistics and fake profiles on landing page (P0)
- **Location:** `app/src/components/HeroMatchShowcase.tsx`, `app/src/pages/LandingPage.tsx`
- **Current behavior:** Hero showcase presents fabricated people (with "Aadhaar Verified" pill, "Replies in ~5 mins") as if real, plus invented metrics: "12.4K+ Verified", "96% Accuracy", "₹8.5K Avg Save". Landing page city cards claim "3,200+ Rooms", "2,800+ Rooms", etc. with zero backing data.
- **Why risky:** Unsupported product claims; fabricated activity numbers; fake verified badges.
- **Recommended fix:** Label showcase cards explicitly as illustrative examples; replace "Aadhaar Verified" pill with a truthful privacy pill; remove all fabricated numeric metrics and city room counts (keep honest copy like "Save on broker fees").
- **Code change required:** Yes.

### F-11 — Fabricated quiz answers used for compatibility scoring (P0/P1)
- **Location:** `app/src/hooks/useListings.ts` (`DEFAULT_OWNER_QUIZ`)
- **Current behavior:** Owners without quiz answers get hardcoded fabricated answers, producing realistic-looking compatibility scores from invented data.
- **Why risky:** Fabricated match claims (P0-6 adjacent).
- **Recommended fix:** Pass empty answers (score honestly computes to 0); UI already handles low scores.
- **Code change required:** Yes.

### F-12 — Onboarding bypass via direct URL (P0)
- **Location:** `app/src/App.tsx` (`OnboardingGuard`, authState), `app/firestore.rules`
- **Current behavior:** `onboardingComplete` is hardcoded `true` in authState even when the profile doc says otherwise or doesn't exist; dashboards don't check completion. A new user navigating directly to `/dashboard` or `/owner-dashboard` skips onboarding. Server-side, `onboardingComplete: true` can be written by the client with no data requirements.
- **Why risky:** Compatibility discovery depends on meaningful preferences; incomplete users pollute matching.
- **Recommended fix:** Track real `onboardingComplete` from the profile snapshot; OnboardingGuard redirects incomplete users to role-select/onboarding. Rules: setting `onboardingComplete == true` requires name, city, role, and ≥5 quiz answer keys.
- **Code change required:** Yes (App.tsx + rules).

### F-13 — Connection sender can self-accept their own request (P1)
- **Location:** `app/firestore.rules` (`connections` update)
- **Current behavior:** Both participants can update any field, so the sender can flip `status` to `accepted` without consent.
- **Recommended fix:** Status transitions to accepted/rejected restricted to recipient; either party may set `blocked`; sender withdraws via delete.
- **Code change required:** Yes (rules).

### F-14 — Broad/analytics collections over-exposed (P1)
- **Location:** `app/firestore.rules` (`listingViews`, `skippedUsers`, `agreementOTPs`, `ratings`)
- **Current behavior:** Any authenticated user can read/write all analytics docs, all skipped-user records, all agreement OTPs; ratings creatable without identity binding.
- **Recommended fix:** Tighten where cheap without breaking flows (agreementOTPs → participants pattern not verifiable client-side; scope skippedUsers reads to owner via query pattern is not enforceable per-doc without uid keys). Minimal: restrict `listingViews` writes to count/listingId/date fields; leave others documented as P1 follow-up requiring Cloud Functions.
- **Code change required:** Partial.

### F-15 — Chat rooms creatable with arbitrary participants (P1)
- **Location:** `app/firestore.rules` (`chatRooms` create)
- **Current behavior:** Any authenticated user can create a chatRoom containing any other user; victim sees an unsolicited conversation.
- **Recommended fix:** Require exactly 2 participants including the caller; message creation requires active status.
- **Code change required:** Yes (small).

### F-16 — CI workflow hardcodes Firebase web config as secret fallbacks (P2)
- **Location:** `.github/workflows/deploy-beta.yml`
- **Current behavior:** Firebase web API key/project ID embedded as fallback values. Web API keys are public identifiers by design, but committed fallbacks mask missing-secret failures and leak project identifiers.
- **Recommended fix:** Remove fallbacks; fail the build if secrets are absent.
- **Code change required:** Yes.

### F-17 — Legacy public PII in `users` docs (P1, migration)
- **Location:** `users/{uid}` documents, `privateUserData` architecture
- **Current behavior:** New writes strip phone/email/workEmail into `privateUserData` (good). Legacy documents may still carry public PII; `users` is world-readable.
- **Recommended fix:** One-time migration script (provided in scripts/) clearing legacy fields; rules unchanged (world-readable public profiles are intentional for browsing).
- **Code change required:** Script only.

### F-18 — Storage: listings/chats/agreements writable by any authenticated user (P1)
- **Location:** `app/storage.rules`
- **Current behavior:** Any authenticated user can overwrite/delete objects under `listings/**`, `chats/**` if paths are known; agreements readable by any authenticated user.
- **Recommended fix:** Add content-type/size validation now; path-ownership enforcement requires backend/custom claims (documented as next-sprint candidate). Verification docs fixed in F-04.
- **Code change required:** Yes (validation only).

---

## Verified-as-OK (no change)

- `privateUserData` owner-only rules; PII stripped from public profile writes (`stripPiiFromWrite`, `sanitizePublicProfile`).
- `verifications` Firestore rules: owner-create with `userId == auth.uid`, admin-only review. Client never self-grants `isVerified` (LB-01 comment honored in EditProfile).
- Phone-sharing consent flow stores numbers only in participant-readable chatRooms docs; hidden until mutual consent.
- `.env` files gitignored and untracked; no service-account keys in repo.
- Admin verification approval is the only writer of `isVerified`/`verificationLevel` (admin-gated once F-01 is fixed).
- Existing tests: `compatibility.test.ts`, `roleFiltering.test.ts` pass and cover pure logic.

## Test Plan (this sprint)

Vitest unit tests for new pure modules (report validation, account-status guards, admin-email key derivation, PII stripping, empty-quiz scoring). Emulator-based Firestore rules tests are provided but require Java + firebase-tools emulator; they auto-skip when the emulator is absent (documented run instructions included). This limitation is reported honestly in the final report.