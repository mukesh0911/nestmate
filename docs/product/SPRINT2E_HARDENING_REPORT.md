# NESTMATE — SPRINT 2E HARDENING REPORT

**Date:** 2026-08-23 · **Scope:** Marketplace consistency gaps left open by Sprint 2E (per `SPRINT2E_REPORT.md` §5). No UI redesign, no new services, no matching-algorithm changes.

---

## 1. Findings (pre-hardening state)

| # | Finding | Severity |
|---|---------|----------|
| H1 | ExplorePage rooms tab (BrowseRooms) had NO demo exclusion and NO freshness (`isDiscoverable`) filtering — paused/stale listings rendered | P1 |
| H2 | ExplorePage roommates tab (BrowseSeekers) had NO demo/status filtering on the users query AND fabricated synthetic "Property Owner" profiles from listing metadata for orphaned listings | P0 |
| H3 | MapView people mode had NO demo/status filtering; rooms mode had no freshness or orphan handling | P1 |
| H4 | MapView people mode showed a hardcoded default compatibility of **85%** when the viewer had no quiz answers — a fabricated score | P1 |
| H5 | Visibility rules were duplicated per-surface (useMatches vs BrowseRooms vs BrowseSeekers vs MapView), allowing drift | P1 |
| H6 | ExplorePage subtitle claimed "Verified rooms & apartments" with no verification backing it | P2 |

## 2. Decisions

### Orphan policy (required decision): **HIDE**
Listings whose owner document no longer exists are **hidden from all discovery surfaces**. We never fabricate an owner identity from listing metadata. Rationale: rendering an invented "Property Owner" person violates the marketplace-integrity rule that production must never display fake people; hiding costs little because orphaned listings indicate data decay anyway. Direct deep-links (e.g. `/room/:id`) still render the listing itself — but no invented person.

### Consistency mechanism: single shared helper
New `lib/marketplaceVisibility.ts` is the single source of truth:
- `isPubliclyVisibleListing()` → wraps `isDiscoverable` (status active + availability freshness)
- `isPubliclyVisibleProfile()` → excludes incomplete onboarding, suspended/banned accounts, demo accounts
- `isOrphanedListing()` → documents the orphan predicate

Every discovery surface now routes through these helpers, so drift is structurally prevented rather than conventionally avoided.

## 3. Files Changed

| File | Change |
|------|--------|
| `app/src/lib/marketplaceVisibility.ts` | NEW — shared visibility helpers + documented orphan policy |
| `app/src/lib/marketplaceVisibility.test.ts` | NEW — 18 regression tests |
| `app/src/pages/BrowseRooms.tsx` | Rooms filtered via `isPubliclyVisibleListing` before search/blocked filters |
| `app/src/pages/BrowseSeekers.tsx` | Users filtered via `isPubliclyVisibleProfile`; synthetic-owner "Layer 2" removed entirely (orphan hide) |
| `app/src/pages/MapView.tsx` | People filtered via `isPubliclyVisibleProfile`; rooms filtered via `isPubliclyVisibleListing` + orphan check against real owner docs (one batched users read); map now shows the REAL owner name; fake 85% compat default replaced with 0 |
| `app/src/hooks/useMatches.ts` | Owner hydration uses `isPubliclyVisibleProfile`; orphan branch now hides instead of constructing a synthetic profile |
| `app/src/pages/ExplorePage.tsx` | Subtitle "Verified rooms…" → "Rooms & apartments across India" |

## 4. Cross-Surface Consistency Audit

| Surface | Listings rule | Profiles rule | Orphan handling |
|---------|--------------|---------------|-----------------|
| SeekerDashboard matches (`useMatches.findMatches`) | `isDiscoverable` ✓ | active+non-demo filter + `onboardingComplete` query ✓ | hidden ✓ |
| Explore → Rooms (BrowseRooms) | `isPubliclyVisibleListing` ✓ | n/a | n/a (listing-only cards) |
| Explore → Roommates (BrowseSeekers) | n/a | `isPubliclyVisibleProfile` ✓ | hidden (Layer 2 removed) ✓ |
| Map → People | n/a | `isPubliclyVisibleProfile` ✓ | n/a |
| Map → Rooms | `isPubliclyVisibleListing` ✓ | real owner doc required ✓ | hidden ✓ |
| RoomDetail / MatchDetail | direct deep-link pages — render by id, not discovery; no fabricated identity shown | | deliberate exception |

Deliberately NOT changed: `getMatchedUserProfiles`/`getProfilesByIds` in useMatches do not apply visibility filters because they serve already-established relationships (accepted connections), not discovery.

## 5. Tests Added

`marketplaceVisibility.test.ts` — 18 tests covering:
- Listing visibility: fresh/active shown; paused/filled/closed hidden; stale-but-unexpired (14–45d) still visible per policy; expired (>45d) hidden; malformed input safe
- Profile visibility: real onboarded shown; demo-flagged hidden; legacy `demo.` email-prefix hidden; suspended/banned hidden; incomplete onboarding hidden; legacy docs without fields treated as visible; malformed input safe
- Orphan handling: missing/undefined owner doc flagged; existing owner doc not flagged
- Cross-surface consistency: identical verdicts asserted across dashboard-matches/explore/map for fresh, expired, demo, and banned entities

One test initially failed because I assumed a 30-day expiry window; the actual documented policy is 14-day stale / 45-day expiry (`FRESHNESS_CONFIG`). The test was corrected to match the documented policy — the policy itself was not changed.

## 6. Test Results

- `npm test`: **12 files, 133 tests, all passing** (was 115; +18)
- `npm run check` (`tsc -b`): clean
- `npm run build`: succeeds (2564 modules)

## 7. Remaining Risks

- MapView rooms mode performs one extra full `users` collection read per load to resolve owners. Fine at current scale; revisit if listings/users grow large.
- Preloaded `MapViewState.items` passed by callers bypass the new filters (callers are trusted internal surfaces — SeekerDashboard/BrowseRooms — which already filter). Not verified end-to-end in this environment.
- RoomDetail remains reachable by direct URL for paused/stale/orphaned listings (deliberate deep-link exception); it shows listing data only.
- Manual E2E of Explore/Map with real Firestore data was not performed here; unit tests cover the rules, not the wiring.
- Unknown: whether any orphaned listings currently exist in production (no audit query was run against live data).

## 8. Deliberately Deferred

- Server-side enforcement of discovery filters (Firestore rules cannot express freshness logic; would require Cloud Functions — out of scope, no new architecture).
- Backfill/cleanup job for orphaned listings.
- Applying visibility helpers to admin surfaces (admins intentionally see everything).
- Any matching-algorithm change (scoring untouched; only candidate eligibility).

---
*Hardening sprint complete. Stopping here — Sprint 3 not started.*