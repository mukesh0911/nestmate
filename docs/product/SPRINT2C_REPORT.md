# NESTMATE — SPRINT 2C REPORT
## Match Quality & Discovery

---

## 1. Executive Summary

Sprint 2C began with a full audit of how NestMate actually decides "which room should this seeker see" and "which seeker should this owner see". The audit (see `SPRINT2C_MATCHING_AUDIT.md`) found that the existing compatibility engine is sound and deterministic — it was **not rewritten**. The real problems were in **eligibility before ranking**: expired listings, suspended accounts, and one fabricated score could still surface as high-quality matches.

Three P0 fixes were implemented, plus a truthful match-explanation layer. The matching algorithm itself was deliberately left intact.

**Verification: 86/86 tests passing across 9 suites · `tsc -b` clean · production build succeeds.**

## 2. Existing Matching Architecture

- Seeker discovery (`useMatches.findMatches`): Firestore query on `onboardingComplete ∧ role ∧ city`, limit 20 with cursor pagination; separate active-listings fetch whose owners are merged into candidates; client-side scoring/filtering/sorting.
- Room browsing (`useListings.getListings`): `status=='active'` (+city), Sprint 2A expiry filtering.
- Owner side: applicants listed by connection creation order — no suitability ranking.

## 3. Existing Discovery Architecture

UI → filters (global store) → findMatches → eligibility → scoring → filters → sort (premium > verified > compatibility) → cards/featured match → interest → connection → chat.

## 4. Compatibility Inputs

Quiz answer maps (numeric-string answers) + optional cities. Per-key similarity = 1 − min(|a−b|,3)/3; averaged over shared keys; cross-city capped at 60%.

## 5. Hard Constraints

City (query + score cap), role, onboardingComplete, localities/flatType/furnishing/amenities when set, verified-only toggle.

## 6. Soft Preferences

Lifestyle quiz answers (score only). Budget/gender are hybrid: hard when set, silently passed when data missing (liquidity-preserving; documented).

## 7. Current Scoring Formula

Documented exactly as implemented — see audit §2. No changes made.

## 8. Current Ranking

Rooms: premium > verified > createdAt. Matches: premium > verified > compatibility. Owner applicants: chronological only.

## 9. Filter Audit

Filters are client-side post-scoring; they interact correctly (AND semantics); amenities require ALL selected; flatType/furnishing apply only to listing-backed candidates; reset CTAs correspond to real filters. Filters survive navigation via the global store.

## 10. Missing Data Behavior

Missing quiz keys are ignored (not penalized); empty-vs-empty scores 0; budget/gender filters pass unknown values; cross-city requires both cities set. All now covered by tests.

## 11. Match Explanation Audit

A data-backed breakdown modal already existed (Lifestyle/Budget/Location bars). Gap: no textual "why". Added `getMatchReasons()` returning ONLY data-supported reasons and honest caveats ("Few overlapping quiz answers — score is low-confidence"), wired into the existing modal.

## 12. Owner-Side Matching

Audited; found weak (chronological applicant list, no compatibility/completeness context). **Deferred** — needs product design before implementation (Phase 12 recommendation documented).

## 13. Problems Found

| ID | Problem | Severity |
|---|---|---|
| M1 | Expired listings appeared as matches (findMatches never applied Sprint 2A freshness gate) | P0 |
| M2 | Suspended/banned accounts could appear as candidates | P0 |
| M3 | RoomDetail fabricated "85% Lifestyle Match" when compatibility was 0 | P0 |
| M4 | Zero-result city search silently retries without city, unannounced | P1 (kept for liquidity; must be surfaced later) |
| M5 | Fallback full-collection scans ignore city | P2 tech debt |
| M6 | No owner-side candidate ranking | P1 deferred |

## 14. Product Decisions

1. Eligibility BEFORE ranking: unavailable/closed/paused/expired listings and suspended/banned accounts are excluded from discovery entirely.
2. Compatibility score ≠ final ranking (premium/verified ordering retained).
3. No fabricated scores anywhere; missing data produces caveats, not invented reasons.
4. Silent city-expansion retry kept (marketplace liquidity at current scale) but flagged for future surfacing.
5. Matching algorithm NOT rewritten — audited as correct.
6. No opaque trust score introduced; explanations use only public, explainable signals.

## 15. Technical Changes

- `app/src/hooks/useMatches.ts`: added `isDiscoverable()` gate on listings (M1); `isAccountActive()` filter on candidates (M2).
- `app/src/lib/matching.ts`: added pure `getMatchReasons()` helper (truthful reasons + caveats).
- `app/src/pages/RoomDetail.tsx`: lifestyle-match benefit card renders only when a real score exists (M3).
- `app/src/pages/SeekerDashboard.tsx`: compat modal now shows truthful reason list + honest caveat chips.

## 16. Tests Added

New suite `app/src/lib/matchQuality.test.ts` (16 tests):
- Deterministic scoring; identical=100; max-diff=0; missing keys ignored; empty→0 (no fabricated compatibility); cross-city cap ≤60 with normalization.
- Explanation accuracy: same-city reason only when both known; zero fabricated reasons from missing data; budget close/far/unknown; shared-lifestyle counting; low-confidence flag.
- Eligibility: fresh discoverable; expired excluded despite status 'active'; closed/paused excluded; legacy listings not falsely excluded; suspended/banned ineligible.

## 17. Test Results

- `npm test`: **86/86 passed** (9 suites — up from 70/70; all prior suites still green)
- `npm run check` (tsc -b): **passing**
- `npm run build`: **passing**

## 18. Performance Findings

- N+1 owner-profile fetches inside the listing loop remain (one getDoc per new owner).
- Full-collection fallback scans (users, listings) remain O(collection); priority documented as post-launch debt — not materially blocking at current scale, not rewritten per architecture rules.

## 19. Product Metrics Recommended (for Sprint 2D)

Capturable today from existing collections: search→room-view rate (listing view events exist), room-view→interest rate (connections), interest→connection rate, connection→chat rate, chat→contact-share rate, no-result rate (empty findMatches results), average results per search, filter usage (filter state changes). Marked future: stale-listing exposure rate (needs exposure logging), match-explanation interaction (needs event tracking).

## 20. Remaining Risks

- Silent city-expansion retry can surprise users who explicitly picked a city (P1, deferred).
- Owner-side discovery remains chronological (P1, deferred).
- Fallback scans scale poorly with growth (P2).
- Explanations cover city/budget/lifestyle only; move-in timing and occupancy are not yet explanation inputs.
- Tests are unit-level; end-to-end Firestore-rule integration tests remain manual.

## 21. Deferred Work

- M4: surface cross-city fallback to users ("Showing results from other cities").
- M5: replace full-collection fallbacks with indexed queries/pagination.
- M6: owner-side candidate ranking with compatibility + completeness context.
- Freshness as a ranking factor (currently a hard eligibility gate only).
- STRICT/GOOD/POSSIBLE match tiers — evaluated and judged unnecessary at current liquidity levels; revisit after metrics exist.

## 22. Recommendation for Sprint 2D

Proceed to **SPRINT 2D — Marketplace Analytics & Product Measurement**: instrument the funnel metrics listed in §19 using existing collections/events, add a lightweight internal measurement surface, and use no-result-rate data to decide whether match tiers or filter relaxation are needed before the premium UI phase.

---
*Not claiming zero bugs. What was tested: scoring determinism, missing-data behavior, explanation truthfulness, eligibility exclusion (freshness/status/account), regression of all prior suites. What remains unknown: live Firestore behavior under concurrent edits, real-user filter interaction patterns, owner-side experience quality.*