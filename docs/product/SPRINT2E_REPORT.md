# NESTMATE — SPRINT 2E REPORT: MARKETPLACE QUALITY

**Date:** 2026-08-23 · **Scope:** Marketplace integrity only (no UI redesign, no new features, no matching-algorithm changes)

---

## 1. Executive Summary

Sprint 2E closed the remaining integrity gaps between NestMate's marketplace surfaces and reality:

1. **Demo accounts are quarantined.** The 1-click demo login still works for evaluation, but demo profiles can no longer appear as matches to real users, and their activity no longer writes analytics events.
2. **Search is honest.** Cross-city widening still helps cold-start markets, but it is now disclosed to the user instead of silently replacing their city choice.
3. **Owners can list directly.** An onboarded owner publishes additional rooms via `/edit-listing/new` without re-running the onboarding wizard.
4. **Copy claims were made truthful** ("verified flatmates", "3x more applicants" removed).

Verification: **115/115 unit tests pass**, `tsc -b` clean, production build succeeds.

## 2. Initial Audit Findings

See `docs/product/SPRINT2E_MARKETPLACE_AUDIT.md` (F1–F5) for locations, current behavior, risk, severity, and fix plan per finding.

## 3. P0 Issues Found

| ID | Issue | Severity |
|----|-------|----------|
| F1 | Demo accounts (fabricated profiles) surfaced in discovery/matching | P0 |
| F2 | Demo activity polluted analytics aggregates | P0 |
| F3 | Silent cross-city fallback changed user intent without disclosure | P1 |
| F4 | Owner forced through onboarding rerun to add a listing | P1 |
| F5 | Unsupported copy claims ("verified flatmates", "3x more applicants") | P2 |

## 4. P0 Issues Fixed

- **F1:** `isDemo: true` written at demo-account creation (`AuthModal.tsx`); `lib/demoUsers.ts` provides dual detection (flag OR `demo.` email prefix); `useMatches.findMatches` excludes demo candidates AND skips demo owners when hydrating listing-owner profiles.
- **F2:** `useAnalytics.logEvent` drops events from demo actors before any Firestore write.
- **F3:** Explicit `onCrossCityFallback` callback; SeekerDashboard shows: *"No matches in {city} yet — showing relevant people from other cities."* Empty state names the filtered city.
- **F4:** EditListing `new` mode with required-field validation, create-before-upload image ordering, and guards preventing writes/deletes against the placeholder id; all OwnerDashboard create CTAs route to `/edit-listing/new`.
- **F5:** Both claims reworded truthfully; no fabricated replacements.

## 5. Issues Intentionally Not Fixed

- **Synthetic owner profiles for listings whose owner doc was deleted** still appear (built from listing metadata). These derive from REAL listing data, not fabrication; removing them would hide genuine supply. Flagged for Sprint 3 review.
- **ExplorePage/MapView do not yet apply the demo filter** in their independent queries. Primary matching surface is covered; browse surfaces need the same treatment next sprint (small, mechanical change reusing `isDemoProfile`).
- **Existing demo accounts created before this sprint** keep fabricated data until they expire naturally; they are now excluded from all covered surfaces via email-prefix detection.
- **Matching algorithm untouched** per architecture rules.

## 6. Files Changed

| File | Change |
|------|--------|
| `app/src/lib/demoUsers.ts` | NEW — pure demo-detection helpers |
| `app/src/lib/demoUsers.test.ts` | NEW — 6 tests |
| `app/src/components/AuthModal.tsx` | `isDemo: true` on demo user creation |
| `app/src/hooks/useMatches.ts` | Demo exclusion (candidates + owner hydration), explicit cross-city fallback callback |
| `app/src/hooks/useAnalytics.ts` | Drop events from demo actors |
| `app/src/pages/SeekerDashboard.tsx` | Expansion notice banner, city-named empty state |
| `app/src/pages/EditListing.tsx` | `new` mode (create listing), validation, isNew guards |
| `app/src/pages/OwnerDashboard.tsx` | Create CTAs → `/edit-listing/new`; removed "3x" claim |
| `app/src/components/Layout.tsx` | "verified flatmates" → "compatible flatmates" |
| `docs/product/SPRINT2E_MARKETPLACE_AUDIT.md` | NEW — Phase 1 audit |
| `docs/product/SPRINT2E_REPORT.md` | NEW — this report |

## 7. Database / Firestore Changes

No schema or rules changes. New optional field `isDemo: true` on demo-created user documents only.

## 8. Storage Rule Changes

None required this sprint.

## 9. Authentication / Authorization Changes

None. Demo accounts remain real (rate-limited) auth users by design; quarantine is content-level, not access-level.

## 10. Tests Added

`app/src/lib/demoUsers.test.ts` — 6 tests: prefix detection (incl. case-insensitivity), malformed-input safety, flag-based detection, legacy email-only detection, non-flagging of real users, canonical prefix export.

## 11. Test Results

- `npm test`: **11 files, 115 tests, all passing** (was 109; +6)
- `npm run check` (`tsc -b`): **clean**
- `npm run build`: **succeeds** (2563 modules, no errors)

## 12. Remaining Risks

- Explore/Map browse surfaces may still show demo-derived listings until the follow-up filter lands (low likelihood: demo owners rarely create listings).
- Cross-city expansion doubles query cost on zero-result cities (acceptable; bounded to one extra query).
- Manual E2E of the new-listing flow (image upload ordering) not performed in this environment — recommend one manual pass before deploy.
- Unknown: real-world zero-result frequency per city; monitor `search_performed` resultCount after deploy.

## 13. Recommended Next Sprint

**MARKETPLACE QUALITY II / TRUST DEPTH**
1. Apply `isDemoProfile` filter to ExplorePage + MapView queries.
2. Decide policy for orphaned-listing synthetic owners (require owner doc vs. richer listing-card rendering).
3. Listing freshness enforcement rollout to Explore/Map (currently matching-only).
4. Match-explanation surfacing on cards (data exists from Sprint 2C).
5. Monitor analytics post-deploy for zero-result rate by city to prioritize supply growth.

---
*Sprint 2E complete. Not starting Sprint 3.*