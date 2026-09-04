# Sprint 2E — Marketplace Conversion & Experience Audit

**Date:** 2026-08-23 · **Method:** Static code audit of the current codebase + prior sprint reports (1, 2A–2D). No production code was modified in this sprint.
**Verification baseline:** `npm run check` ✓ (tsc clean) · `npm test` ✓ (10 files, 109 tests) · `npm run build` ✓ (vite production build).

**Evidence legend:** ✅ Verified fact (code read directly) · 🔎 Code observation (inferred behavior) · ⚠️ Inferred UX risk · ❓ Unknown — requires manual testing.

---

## 1. Feature Inventory & Classification

Legend: A=Implemented+reachable · B=Implemented, not reachable · C=Partial · D=UI exists, functionality incomplete · E=Backend exists, UI missing · F=UI exists, backend incomplete · G=Planned/deferred · H=Dead/unused · I=Unknown

| Feature | Class | Evidence |
|---|---|---|
| Email signup/login | A | AuthPage/AuthModal; rules enforce profile creation |
| Phone OTP login | A | PhoneLogin + OTPVerify routes |
| 1-click demo accounts | C | AuthModal creates REAL auth users w/ fabricated names+phones — see §6-1 |
| Role select | A | RoleSelect route, PrivateRoute-guarded |
| Seeker onboarding | A | SeekerOnboarding; App.tsx gates interactive routes on `onboardingComplete===true` |
| Owner onboarding | A | OwnerOnboarding; same gate |
| Compatibility matching | A | matching.ts + useMatches; Sprint 2C added explanations |
| Discovery (ExplorePage tabs rooms/roommates) | A | Routes wired; /browse-* redirect into it |
| Filters/search | A | ExplorePage + roleFiltering.ts (tested) |
| Room card/detail | A | RoomCard, RoomDetail; closed/expired handled via isDiscoverable ✅ |
| Match detail page | A | MatchDetail with connect/report/block |
| Express interest | A | SeekerDashboard + RoomDetail + BrowseSeekers paths; rules-enforced state machine |
| Accept/reject | A | OwnerDashboard handleAccept/handleReject; connectionGuards tested |
| Chat | A | ChatPage + useChat; rules restrict to connected participants |
| Mutual phone-share consent | A | ChatPage request/accept modal; rules require mutual consent before phone exposure |
| Block user | A | SeekerDashboard + MatchDetail; blocked filtered from matches |
| Report user | A | reportValidation.ts + rules (Sprint 1); admin queue |
| Saved rooms/profiles | A | useUserProfile toggleSaved* |
| Listing create | A | via /onboarding/owner wizard completion |
| Listing edit | A | EditListing route /edit-listing/:id from OwnerDashboard |
| Availability confirmation | A | OwnerDashboard confirm button (Sprint 2A freshness) |
| Close listing ("Room filled") | A | OwnerDashboard closeListing |
| Weekly views | A | getWeeklyViews on OwnerDashboard |
| Notifications | A | NotificationsPage + useNotifications |
| Map view | A | MapView route; explicit empty/error states ✅ |
| Reviews/vouches | C | TrustBadge + reviewValidation (Sprint 2B); submission UX thin — manual verify needed ❓ |
| Admin panel (users/listings/reports/verifications/marketplace/settings) | A | Server-side admin model (Sprint 1) |
| Product analytics funnel | A | Sprint 2D instrumentation |
| Connect limits / premium gating | G | FREE_CONNECT_LIMIT=5 + canSendConnect exist and are tested, but `unlimitedFree=true` bypasses them everywhere; no premium flag ever set client-side (rules block it) |
| Payments | G | PricingPage references Razorpay key; ProfilePage comment says Cloud Function must set isPremium — not built |
| Agreements (rental agreement notifications) | E | Notification type + Firestore rules for agreementOTPs exist; **no UI anywhere creates an agreement** |
| DigiLocker / Aadhaar verification modals | H | Components defined, imported nowhere |
| BrowseRooms / BrowseSeekers / BrowseDashboard pages | H | Zero imports; routes redirect to /explore |
| direct_seed.ts / clear_db.ts (app root) | H | Not referenced by app runtime; dev scripts |
| i18n (useTranslation) | C | Hook used only in Layout; single-language product in practice |

## 2. Seeker Journey Map (with failure points)

Sign up ✅ → Role select ✅ → Onboarding (multi-step, photo encouraged) ✅ → Dashboard:
- Matches load by city + preferences; loading skeleton ✅, empty state ✅ ("No matches yet" style StateEmpty), blocked users filtered ✅.
- Filter chips + city change re-query; "load more" pagination ✅.
- Real-time connection subscription updates buttons without refresh ✅.
- Card menu: save/skip/block/report ✅.
→ RoomDetail (via card): intro message prefilled, Express Interest with Sending…/Sent ✓ states ✅; unauthenticated → AuthModal with redirect back ✅; closed/expired listing → dedicated unavailable screen with browse CTA ✅.
→ Interest sent → owner accepts → chat room auto-created (seeker side navigates to /chat/:roomId) ✅.
→ Chat: Share Phone request/accept modal; contact_shared analytics fires only at mutual consent ✅.

⚠️ Friction points:
1. **City-mismatch dead end**: matches are keyed on `profile.city`. A seeker whose city has no owners sees an empty dashboard; the empty state suggests browsing but the primary CTA loop doesn't offer "change my city" inline (🔎 inferred from filter structure — verify copy).
2. **Demo-account contamination**: demo seekers ("Rohan (Demo Seeker)", fake phone) become real user docs that appear in *other seekers'* roommate discovery and can receive real interests. Owners who accept a demo seeker connect into a dead-end chat. This is the single largest conversion-integrity risk found (✅ code-verified).
3. **Re-onboarding trap**: none for seekers (good), but see owner flow §3.
4. ⚠️ Network failure during interest send: toast error path exists in hooks; retry affordance is just re-tapping the button — acceptable, but no offline queue (❓ manual test recommended).

## 3. Owner Journey Map

Sign up ✅ → Role select ✅ → OwnerOnboarding wizard → ends creating first listing ✅ → OwnerDashboard:
- Hero card shows listing photo, availability badge (fresh/needs_confirmation/expired), Confirm-Availability and "Room filled — mark unavailable" buttons ✅ (Sprint 2A).
- Edit → /edit-listing/:id ✅. Delete exists in useListings (admin + owner paths) ✅.
- Pending Requests list with accept/reject; accept creates chat room immediately ✅; highlighted request deep-link (`request-{id}` scroll) ✅.
- Accepted connections section + chat entry ✅. Weekly views stat ✅.
- Empty states: "No pending requests — Create a listing…" with CTA ✅.

⚠️ Friction points:
1. **"Create Listing" re-runs the entire onboarding wizard** (`navigate('/onboarding/owner')` from all four CTAs). An owner with an active listing who wants a *second* listing must redo every personal quiz step. ⚠️ conversion friction (✅ code-verified navigation target).
2. **Single-listing assumption**: dashboard renders one `myListing` hero; multiple listings' management surface is unclear (🔎 pendingApplicants subscribe appears keyed to incoming connections generally, but the hero shows one listing). ❓ verify multi-listing behavior manually.
3. Reject gives no reason capture and (🔎) likely no notification to the rejected seeker beyond state change — silent rejection is fine for safety but the seeker's UI shows generic "connect" retry state rather than "declined" (🔎 inferred from `'connect'; // rejected/blocked — allow retry` comment in SeekerDashboard).
4. Expired listing (>45d): shown as expired with confirm CTA ✅; but seekers hitting its old link get the unavailable screen ✅ — good.

## 4. Screen-by-Screen Audit (condensed)

| Screen | Loading | Empty | Error | Notes |
|---|---|---|---|---|
| Landing | n/a | n/a | n/a | Demo CTAs prominent; "India's first people-first…" claim = marketing superlative, unverifiable ⚠️ |
| Auth/OTP | ✅ | n/a | toast | resend returns to /login with prefilled phone ✅ |
| Onboarding (both) | ✅ steps | n/a | inline error prop | photo step builds trust; skippable? ❓ |
| SeekerDashboard | skeleton ✅ | StateEmpty ✅ | toast/catch ✅ | unlimited-connects widget truthful (unlimitedFree=true) ✅ |
| ExplorePage | ✅ | ✅ | ✅ | merged browse experience |
| RoomDetail | ✅ | n/a | ✅ | unavailable-listing screen ✅; ProfileCompleteness nudge ✅ |
| MatchDetail | ✅ | StateEmpty ✅ | ✅ | block/report present ✅ |
| OwnerDashboard | ✅ | "create listing" CTA ✅ | try/catch around actions ✅ | see friction above |
| EditListing | ✅ | n/a | ✅ | status select incl. paused/filled/closed ✅ |
| ChatPage | ✅ | StateEmpty ✅ | ✅ | phone modal ✅; mobile height uses safe-area inset ✅ |
| MapView | ✅ | ✅ | sets [] on error, never stale ✅ |
| Notifications | ✅ | StateEmpty ✅ | ✅ | includes 'agreement' icon type that can never occur today ⚠️ misleading |
| Profile/Settings/EditProfile | ✅ | ✅ | ✅ | premium section shows deferred Razorpay note ⚠️ visible to users? ❓ |
| Admin pages | ✅ | ✅ | permission-denied surfaced ✅ | server-gated ✅ |

## 5. Code-vs-UI Mismatches (UI implying non-existent functionality)

1. **Notifications 'agreement' icon/type** — implies rental-agreement feature that does not exist. (D/E)
2. **PricingPage** — presents plans/prefilled-details mock while payments are unbuilt; ProfilePage premium note says client flips are rules-blocked (true), but the page itself may imply purchasable premium today. ⚠️ verify copy honesty.
3. **Layout AuthModal subtitle "find verified flatmates"** — "verified" exceeds implementation unless TrustBadge criteria are genuinely enforced (Sprint 2B made badges data-driven; the word "verified" in marketing copy should still be audited against what badges actually assert).
4. **LandingPage "India's first people-first roommate matching platform"** — unverifiable superlative; low risk, but not evidence-based.

## 6. Broken / Degraded Flow List

1. **Demo account lifecycle (P0)** — created via createUserWithEmailAndPassword with fabricated name/phone; persists forever in prod DB; discoverable by real users; chats with demo users dead-end; no cleanup outside dev-only SeedData wipe. ✅ verified.
2. **Owner second-listing path (P1)** — full onboarding rerun. ✅ verified.
3. **Agreement notifications impossible (P2)** — dead notification class.
4. **Rejected-interest UX (P2)** — seeker cannot distinguish "pending", "rejected", "never seen"; button silently resets to connectable. 🔎
5. **Multi-listing owner dashboard (P2/I)** — hero assumes one listing. ❓

## 7. UX Friction List (prioritized)

1. Demo CTAs are visually co-equal with signup on Landing/Layout/RoomDetail — drives contaminated signups (P0-adjacent).
2. Owner create-listing rerun (P1).
3. No inline "change city" recovery on empty seeker dashboard (P1).
4. Rejected-state opacity (P2).
5. Onboarding photo step wording implies requirement ("Add your photo… instant trust") — if skippable, copy overstates (P3). ❓
6. Mobile bottom nav includes Demo button as a primary tab-equivalent (Layout) — unusual IA; pushes real login out of thumb reach (P2). ✅ code shows Demo as bottom-nav item.

## 8. Missing States Audit

Present almost everywhere (verified): loading skeletons, StateEmpty, toasts, permission-denied surfacing in admin, unavailable-listing screen, map error reset.
Missing/unverified: offline/network-lost banner (none found — P2), optimistic-vs-server conflict on double-tap interest (guards exist in connection state machine; race window small — ❓ emulator test), stale-data: dashboards re-query on focus? not verified ❓.

## 9. Mobile-Specific Issues

- Chat height handles safe-area insets ✅; admin sidebar has mobile drawer ✅; bottom nav min touch targets 44px+ ✅ (code shows min-h-[44px]).
- Lightbox (SeekerDashboard images) present ✅.
- ❓ No manual device testing done this sprint — all mobile findings are code-level.

## 10. Security/Trust UX Issues

- Server-side enforcement throughout core flows (Sprints 1–2A rules) — trust UX rests on real state machines ✅.
- Demo users with fake phone numbers erode the phone-consent promise when matched accidentally (P0, same root as §6-1).
- "Verified flatmates" copy risk (§5-3).

## 11. Conversion Blockers (ranked)

1. Empty-market cold start in any city → both sides see empty states with weak cross-side CTA (supply/demand loop not closed in-product).
2. Demo contamination degrading early marketplace credibility.
3. Owner second-listing friction limiting supply growth per owner.
4. Interest rejection silence reducing seeker retry/confidence.

## 12. Analytics Instrumentation Gaps

Instrumented (Sprint 2D): search_performed, interest_sent/accepted, chat_started, contact_shared, listing lifecycle events.
Gaps: listing_viewed (deferred — legacy counters), interest_rejected, connection_created, match_explanation_viewed partially wired, no funnel event for onboarding step drop-off, no demo-account marker on events (demo activity pollutes funnel metrics).

## 13. Priority Matrix

| Pri | Item |
|---|---|
| **P0** | Demo-account lifecycle: stop creating fabricated-profile users in prod OR quarantine them (excluded from discovery, marked `isDemo`, TTL cleanup); keep demo behind explicit label-only preview mode |
| **P1** | Owner "Create Listing" → direct listing editor instead of full onboarding rerun |
| **P1** | Inline city-change recovery on empty seeker dashboard |
| **P1** | Remove/qualify "verified flatmates" copy; remove dead 'agreement' notification icon or hide until feature exists |
| **P2** | Rejected-interest distinct state (or explicit "no update yet" after N days) |
| **P2** | Offline/network-error banner; PricingPage honesty pass |
| **P2** | Multi-listing owner dashboard support |
| **P3** | Dead code removal (BrowseRooms/BrowseSeekers/BrowseDashboard, DigiLockerModal, AadhaarVerifyModal, direct_seed/clear_db at app root, unused i18n scaffolding) |
| **P3** | Onboarding photo-step copy accuracy; landing superlative claim |

## 14. Recommended Fixes (implementation notes)

- Demo fix (smallest safe change): add `isDemo: true` to demo user docs + exclude from all discovery queries (`findMatches`, ExplorePage, MapView) + exclude from analytics actor metrics; optionally scheduled cleanup of `demo.*@nestmate.app` accounts.
- Create-listing: navigate to `/edit-listing/new` (EditListing already supports unsaved draft shape) or add a lightweight "new listing" mode that skips profile quiz.
- Copy fixes are one-line changes each.

## 15. Features That Should NOT Be Built Yet

- Payments/premium (scaffolding exists; do not activate without server-side entitlement).
- Rental agreements (rules exist; product flow undefined).
- DigiLocker/Aadhaar verification (components dead; regulatory/ops burden high).
- i18n rollout (single language suffices).
- Connect limits/premium gating (keep unlimitedFree=true until monetization decision).

## 16. Recommended Sprint 2E Implementation Scope

1. **P0 demo quarantine** (discovery exclusion + analytics exclusion + doc flag). Tests: demo users never returned by matching/discovery helpers; real users unaffected.
2. **P1 owner create-listing shortcut.**
3. **P1/P2 copy truthfulness fixes** (verified claim, agreement icon, pricing framing).
4. **P3 dead-code deletion** (six files + root scripts), keeping git history as archive.
5. Manual QA checklist document for the ❓ items (device testing, multi-listing, offline).

Estimated: small, isolated diffs; no architecture change; no redesign.

---

### Unknowns requiring manual verification (❓ summary)
Multi-listing owner behavior · onboarding photo skip semantics · ProfilePage premium-section visibility · offline behavior · rejected-notification delivery · reviews/vouches end-to-end UX · iOS Safari safe-area rendering · push notification delivery (usePushNotifications configured but untested here).