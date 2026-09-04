# SPRINT 2C — MATCHING & DISCOVERY AUDIT

## 1. Current Matching Architecture

Two independent discovery paths exist:

**Seeker → Owners/Rooms** (`useMatches.findMatches`)
```
onboardingComplete==true ∧ role==opposite ∧ city==target (limit 20, cursor paginated)
→ fallback: FULL users-collection scan filtered by role ONLY (city dropped!)
→ separately: listings where status=='active' (+city) → owner profiles injected
   (synthetic profile constructed if owner doc missing)
→ client-side scoring → client-side filters → sort
```

**Room browsing** (`useListings.getListings`, Sprint 2A-hardened)
```
status=='active' (+city) orderBy createdAt limit 100
→ expiry filtered via isDiscoverable() → client filters → premium/verified sort
```

## 2. Compatibility Inputs & Scoring Formula (`lib/matching.ts`)

Inputs: two quiz-answer maps (numeric-string answers) + optional cities.

- **Common-keys path:** for each key present in BOTH maps:
  similarity = 1 − min(|a−b|, 3)/3 → score = round(avg × 100)
- **No-common-keys path:** exact-match ratio over the UNION of keys.
- **Cross-city penalty:** both cities set and different → score = min(60, round(score×0.6)).
- **Missing values:** non-numeric answers compared by exact equality; missing keys
  are simply not counted (ignored, not penalized); empty-vs-empty → 0.
- Range 0–100, integer, deterministic. Tie behavior: stable sort input order.

## 3. Hard vs Soft (as actually implemented)

| Behavior | Fields | Type today |
|---|---|---|
| City | query `city ==` + cross-city score cap | HARD (query) |
| Role | query `role ==` opposite | HARD |
| Onboarding | `onboardingComplete == true` | HARD |
| Budget | client filter min/max (skipped when budget unknown) | SOFT-HARD hybrid |
| Gender | client filter (skipped when profile gender unknown) | SOFT-HARD hybrid |
| Localities / flatType / furnishing / amenities | client filters, listing-only | HARD when set |
| Quiz lifestyle answers | compatibility score only | SOFT |
| Verified-only toggle | client filter | HARD when set |

Note: budget/gender filters silently PASS profiles with missing data
(liquidity-preserving, but undocumented).

## 4. Ranking (actual)

- Rooms (BrowseRooms): premium owner > verified owner > (createdAt from Firestore).
- Matches (SeekerDashboard): premium > verified > compatibilityScore;
  'newest' mode = Firestore order; budget modes client-sorted.
- Owner dashboard applicants: connection creation order — NO compatibility,
  completeness, or trust ordering (owner sees "people who clicked").

## 5. False-Match Scenarios Found

| # | Scenario | Status |
|---|---|---|
| M1 | High compatibility + EXPIRED listing: `findMatches` fetches listings with only `status=='active'`; Sprint 2A expiry filtering was never applied here → stale rooms still appear as top matches | P0 |
| M2 | High compatibility + SUSPENDED owner: candidate profiles are not checked for `status` in findMatches | P0 |
| M3 | RoomDetail benefit card fabricates "85% Lifestyle Match" when compatibility is 0 (`BENEFIT_CARDS(compatibility > 0 ? compatibility : 85)`) | P0 |
| M4 | Zero-result city search silently retries with city removed (and clears filters.city) without telling the user results are now cross-city | P1 (liquidity trade-off, kept but must be surfaced later) |
| M5 | Fallback full-collection scans (users + listings) ignore city — pre-existing tech debt, priority documented | P2 |
| M6 | Owner-side applicant list has no suitability ordering or context | P1 (deferred — needs product design) |

## 6. Match Explanation (as found)

- SeekerDashboard compatibility modal: Lifestyle % / Budget overlap % /
  Location % bars — a real, data-backed explanation EXISTS there.
- Lifestyle tags (Early Bird, Veg, WFH…) on cards — real data.
- RoomDetail: percentage only, plus the (now fixed) fabricated 85% card.
- Gap: no textual "why" list anywhere; recommended `getMatchReasons`
  helper added this sprint and wired into the existing modal.

## 7. Empty States (as found)

Honest empty states exist for no-matches/no-rooms/no-saved (post-Sprint 1);
filter-reset CTAs correspond to real filters. No fake recommendations.

## 8. Performance

- N+1 owner-profile fetches inside the listing loop (one getDoc per new owner).
- Full-collection fallbacks (users, listings) — O(collection) reads; priority:
  replace AFTER launch-critical work; not rewritten this sprint.
- Compatibility recomputed per render in some components (cheap, pure).

## 9. Recommended Changes Implemented This Sprint

1. Eligibility gate in findMatches: drop listings that fail `isDiscoverable`
   (expired/closed/paused) BEFORE owner injection/scoring (fixes M1).
2. Exclude suspended/banned accounts from candidates (fixes M2).
3. Remove fabricated 85% lifestyle-match card; show the lifestyle-match
   benefit card only when a real score exists (fixes M3).
4. Add truthful `getMatchReasons()` explanation helper + tests; surface in the
   existing compatibility modal (fixes part of §6 gap without redesign).