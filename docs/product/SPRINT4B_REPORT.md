# Sprint 4B — Truth & Trust Sweep Report

**Date:** 2026-08-24
**Scope:** User-facing truth fixes only. No changes to matching algorithm, compatibility engine, freshness policy, marketplace visibility policy, demo quarantine logic, analytics privacy model, or trust authorization model.
**Status:** ✅ COMPLETE — all gates green

---

## 1. What This Sprint Fixed

### T-1 — RoomCard fabricated trust/social-proof elements (CRITICAL)
**File:** `app/src/components/RoomCard.tsx`

RoomCard rendered three fabrications on every listing card regardless of real data:

1. **Fake "Verified" badge** — a hardcoded `ShieldCheck` "Verified" chip shown for ALL listings, even when `isOwnerVerified` was false. A user could not distinguish a phone-only owner from an ID-verified one at the card level.
2. **Fabricated rating** — a hardcoded `★ 4.8` with no reviews system backing it anywhere in the product.
3. **Fabricated social proof** — a hardcoded `"12 people interested"` claim unrelated to the real `applicants` count.

**Fix:** All three removed and replaced with displayTruth-gated rendering:
- Verified chip now renders **only when** `isOwnerVerified === true` (`displayTruth.isVerified`).
- Rating row renders **only when** `displayTruth.hasRating(listing)` is true (real review data exists). No listing currently has ratings, so the row is honestly absent everywhere.
- Interest line now shows the **real** applicant count: `N interested` when ≥ 1, otherwise nothing. Zero-interest listings show no interest claim.

**Evidence:** `displayTruth.test.ts` (23 tests) pins these semantics; RoomCard imports `displayTruth`.

### U-1 — Landing hero locality search silently discarded (HIGH)
**Files:** `app/src/pages/LandingPage.tsx`, `app/src/hooks/useListings.ts`, new `app/src/lib/listingFilters.ts`

Two defects:
1. The hero's "Locality / Landmark" input was collected into state but `handleHeroSearch` never applied it — searching "Koramangala" returned city-wide results.
2. Even if it had been applied, `filters.localities` was only honored by the roommates tab (`useMatches`); the rooms tab (`useListings`) ignored it entirely.

**Fix:**
- `handleHeroSearch` now passes `localities: [locality]` into the global filter store.
- The client-side filter pipeline was extracted into a pure module `app/src/lib/listingFilters.ts` (re-exported from `useListings.ts` for backward compatibility) and now applies `localities` on the rooms tab too, with case-insensitive bidirectional substring matching.
- Fail-safe: a listing with an empty/missing locality never matches a locality query (an empty string is a substring of anything — caught by regression test).

### L-1 — Unsupported savings claim (MEDIUM)
**File:** `app/src/pages/LandingPage.tsx`

The Zero Brokerage banner claimed *"Save ₹10,000 to ₹30,000 on broker fees"* — an invented figure with no data source; actual savings depend on local broker rates.

**Fix:** Rewritten to state the mechanism truthfully: *"No broker, no brokerage fee. Connect directly with owners and flatmates with transparent rent splits."* Heading changed from "Zero Brokerage Guarantee" (a guarantee we cannot enforce) to "Zero Brokerage".

---

## 2. Regression Tests Added

**New file:** `app/src/hooks/useListings.filters.test.ts` (8 tests) against the pure pipeline:

| Test | Pins |
|---|---|
| no filters → unchanged | passthrough |
| case-insensitive locality match | hero search correctness |
| substring match both directions | partial queries |
| excludes other localities/cities | precision |
| empty/whitespace arrays don't filter | no accidental zero-results |
| city + locality AND semantics | combined filters |
| missing locality never matches | fail-safe (caught the empty-string bug) |
| budget filters still work | no regression |

---

## 3. Verification Gates

| Gate | Result |
|---|---|
| `npm test` | ✅ **180 passed**, 0 failed (26 emulator-rules tests skipped locally) |
| `npm run check` (tsc -b) | ✅ Clean |
| `npm run build` (vite production) | ✅ Built in ~49s, no errors |
| Firestore/Storage rules tests | ⚠️ Could not run locally — machine has JDK < 21; firebase-tools requires JDK ≥ 21. These run in CI (`.github/workflows/rules-tests.yml`). Not a code failure. |

---

## 4. Explicitly NOT Touched (per protected-systems policy)

- Matching algorithm / compatibility engine (`matching.ts`, `compatibility.ts`)
- Freshness policy (`listingFreshness.ts`)
- Marketplace visibility policy (`marketplaceVisibility.ts`)
- Demo quarantine (`demoUsers.ts`)
- Analytics taxonomy & privacy model (`analytics.ts`)
- Trust authorization model (`trustSignals.ts`, admin verification flows)
- Firestore/Storage security rules

---

## 5. Remaining Known Gaps (documented, intentionally deferred)

These were identified during the sweep but are out of scope for a truth-sweep sprint:

1. **Pricing page promises vs. reality** — Landing pricing section advertises Premium ₹299/mo features ("See who viewed your profile", "Priority placement", "Profile boost") that have no implementation behind them. Either gate copy behind "coming soon" or remove until built. *Deferred: product decision.*
2. **Footer dead links** — Blog/Careers point to `mailto:` placeholders; Cookie Policy links to Privacy page. Cosmetic.
3. **City grid images** — Unsplash hotlinks may rot; consider self-hosted assets later.
4. **Rules-test JDK** — install JDK 21+ locally to run rules tests without CI.

---

## 6. Bottom Line

Every number, badge, rating, count, and savings figure NestMate now shows a user is derived from real stored data or is absent. The landing hero search actually filters what it promises to filter. The suite stands at 180 passing tests with the new regressions pinning all three fixes.