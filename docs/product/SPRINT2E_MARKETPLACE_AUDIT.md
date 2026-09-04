# Sprint 2E — Marketplace Quality Audit (Phase 1)

**Scope:** Marketplace integrity — demo data leakage, empty states, owner listing flow, search intent honesty, truthfulness of copy.
**Method:** Full read of discovery/matching/listing code paths (`useMatches.ts`, `SeekerDashboard.tsx`, `ExplorePage.tsx`, `MapView.tsx`, `EditListing.tsx`, `OwnerDashboard.tsx`, `AuthModal.tsx`, `Layout.tsx`, `LandingPage.tsx`, `HeroMatchShowcase.tsx`) plus grep sweeps for `demo`, `fallback`, `verified`, hardcoded numbers.

---

## Findings

### F1 — Demo accounts leak into production discovery & matching (P0)
- **Location:** `app/src/components/AuthModal.tsx` (creation), `app/src/hooks/useMatches.ts` (candidates + synthetic-owner path)
- **Current behavior:** The 1-click demo login creates REAL auth users with fabricated names ("Rohan (Demo Seeker)", "Priya (Demo Owner)") and fake phone numbers. `findMatches` queries all onboarded users and listings with no demo exclusion, so fabricated profiles surface as "matches" to real users.
- **Risk:** Production marketplace silently displays fake people. Violates "never display fake users" rule.
- **Fix:** Write `isDemo: true` at creation; exclude via `isDemoProfile()` in candidate filter AND when hydrating owner profiles from listings. Dual detection (flag + `demo.` email prefix) covers pre-existing demo accounts.
- **Code change:** Yes. **Tests:** `demoUsers.test.ts`.

### F2 — Demo activity pollutes analytics aggregates (P0)
- **Location:** `app/src/hooks/useAnalytics.ts`
- **Current behavior:** Demo accounts write real `analyticsEvents` (search_performed, interest_sent…), fabricating funnel metrics.
- **Risk:** Admin marketplace metrics show inflated/fake activity.
- **Fix:** `logEvent` early-returns when actor profile is a demo profile.
- **Code change:** Yes.

### F3 — Silent cross-city fallback changes user intent without disclosure (P1)
- **Location:** `app/src/hooks/useMatches.ts` (end of `findMatches`)
- **Current behavior:** When a city-scoped search returns zero results, the hook silently re-runs unconstrained across ALL cities. The user searched "Chennai" but sees Bangalore rooms with no explanation.
- **Risk:** Dishonest search behavior; user cannot tell whether results match their city.
- **Fix:** Keep the widening (good for cold-start) but make it EXPLICIT: new optional `onCrossCityFallback(requestedCity)` callback; SeekerDashboard renders an amber notice: "No matches in {city} yet — showing relevant people from other cities." Empty-state title also names the city.
- **Code change:** Yes. Backward compatible (optional param).

### F4 — Owners must re-run onboarding wizard to add a second listing (P1)
- **Location:** `app/src/pages/EditListing.tsx`, `app/src/pages/OwnerDashboard.tsx`
- **Current behavior:** EditListing only supports editing an existing id (`if (!id) return`). All "create listing" CTAs routed to `/onboarding/owner`, forcing already-onboarded owners through the preference quiz again to publish another room.
- **Risk:** Listing-supply friction; owners abandon second listings.
- **Fix:** Add `new` mode to EditListing (`/edit-listing/new`): blank form, required-field validation (title/city/locality/rent), create-first-then-upload-images ordering, delete/status-toggle disabled for placeholder id. All OwnerDashboard create CTAs now route here.
- **Code change:** Yes.

### F5 — Unsupported copy claims (P2)
- **Locations:** `Layout.tsx` ("find verified flatmates" — no verification backs this), `OwnerDashboard.tsx` mobile tip ("Fast responses get 3x more applicants!" — fabricated statistic).
- **Fix:** Reworded to truthful equivalents ("compatible flatmates", qualitative response-rate advice). No replacement numbers invented.
- **Code change:** Yes.

## Verified non-issues
- Empty states exist and render honest messages (improved city naming in F3).
- No hardcoded fake rooms/testimonials/user counts found in Landing/Hero beyond previously remediated sprints.
- Seed utilities (`direct_seed.ts`, `clear_db.ts`, `SeedData.tsx`, `wipe-firestore.mjs`) remain dev-only scripts, not wired into production routes (Sprint 1 verified route protection).