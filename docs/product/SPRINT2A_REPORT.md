# NESTMATE — SPRINT 2A REPORT
## Listing Freshness & Availability Integrity

## 1. Executive Summary

Sprint 2A made NestMate's room inventory trustworthy: a seeker can no longer be
presented with a stale, expired, or closed room as though it were currently
available. Owners now have an explicit "confirm availability" action and a
non-destructive "room filled" close action. All changes extend the existing
architecture — no rewrite, no new services, no cron jobs.

**Verification at end of sprint:**
- `npm test` → **54/54 tests pass across 7 suites** (15 new freshness tests)
- `npm run check` (tsc) → passes
- `npm run build` (production) → passes
- Sprint 1 security work preserved and extended (listings rules hardened further)

This report does not claim "zero bugs." See §14 for what remains unknown.

## 2. Existing Listing Architecture

Detailed audit: `docs/product/SPRINT2A_LISTING_FRESHNESS_AUDIT.md`.

Summary of the as-found system:
- `listings` collection; status `'active' | 'paused' | 'filled'` (`filled` unreachable from UI)
- Only `createdAt`/`updatedAt`; discovery = `status=='active'` ordered by createdAt, limit 100, plus a fallback full-collection scan
- No freshness concept; direct links to dead listings rendered full active pages
- Existing analytics: `listingViews/{listingId}_{date}` daily counters

## 3. Problems Found

F1 stale listings shown as LIVE (P0) · F2 updatedAt conflated edits with
availability confirmation (P0) · F4 direct/saved links to unavailable rooms
looked active (P0) · F3 no non-destructive "room taken" action (P1) ·
F6 suspended owners could edit listings (P1) · F7 unvalidated status values in
rules (P1) · F5 `filled` unreachable (P2).

## 4. Product Decisions

| Decision | Choice |
|---|---|
| Freshness anchor | New explicit `lastConfirmedAt` ("owner last confirmed room is available") |
| Stale threshold | 14 days without confirmation → flagged "Availability needs confirmation", still discoverable |
| Expiry threshold | 45 days without confirmation → removed from discovery |
| State storage | Derived at read time from `status` + `lastConfirmedAt` — no cron, no stored enum |
| Close semantics | Soft close (`status:'closed'`) preserving history/analytics; hard delete unchanged |
| Legacy data | Fall back `lastConfirmedAt → updatedAt → createdAt`; recent legacy edits keep rooms visible; ancient untouched ones naturally expire. **No migration needed** (see §10) |
| Connections | Never destroyed by status change; only new marketplace actions blocked |
| Saved rooms | Preserved; opening an unavailable saved room shows the clear unavailable state |

Thresholds live in one place: `FRESHNESS_CONFIG` in `app/src/lib/listingFreshness.ts`.

## 5. Technical Changes

- **`app/src/lib/listingFreshness.ts` (NEW)** — policy config + pure functions:
  `getAvailabilityState`, `isDiscoverable`, `getFreshnessAnchorMs`,
  `availabilityLabel`, `formatRelativeDays`. Malformed/unknown statuses fail closed.
- **`app/src/hooks/useListings.ts`**
  - `Listing.lastConfirmedAt?: Timestamp`; status union adds `'closed'`
  - `createListing` sets `lastConfirmedAt: serverTimestamp()` (publish = first confirmation)
  - Discovery (both constrained query and fallback scan) filters out expired/closed via `isDiscoverable`
  - NEW `confirmAvailability(id)` — owner-only, server timestamp
  - NEW `closeListing(id)` — soft close
- **`app/src/pages/RoomDetail.tsx`** — direct-link guard: closed/expired/paused
  listings render "This room is no longer available" + Browse Rooms CTA instead
  of the full page; Express Interest is therefore unreachable for them.
- **`app/src/pages/OwnerDashboard.tsx`** — availability strip on the listing hero:
  state pill ("Available · confirmed X ago" / "Availability needs confirmation" /
  "No longer available"), "Confirm it's still available" button when stale/expired,
  "Room filled — mark unavailable" soft-close button (desktop + mobile).
- **`app/src/pages/EditListing.tsx`** — status type widened to include 'closed'.

## 6. Database Schema Changes

- `listings.lastConfirmedAt` (Timestamp, optional) added going forward.
- `listings.status` gains the value `'closed'`.
- No collections added/removed. No indexes required (no new query patterns).

## 7. Firestore Rule Changes

`match /listings/{listingId}`:
- create additionally requires `status ∈ {active, paused, filled, closed}`
- update: owner branch now requires `isActiveUser()` AND valid status;
  views-bump branch unchanged; admin override unchanged
- Effect: seekers cannot confirm/reactivate others' listings; suspended/banned
  owners cannot modify listings; arbitrary status strings rejected.
No Sprint 1 rule was weakened.

## 8. UI Changes

Minimal, existing design system only:
- Owner dashboard availability strip + confirm/close buttons
- RoomDetail unavailable empty-state for direct links
No premium redesign, no new badges on cards beyond the derived states already surfaced.

## 9. Discovery Changes

- ACTIVE → normal discovery
- NEEDS_CONFIRMATION → still discoverable (flagged on owner side); ranking boost
  for fresh listings is deferred to Sprint 2B/2C ranking work
- EXPIRED/CLOSED/PAUSED → excluded from discovery results (query-level for
  closed/paused/filled; derived filter for expiry)
- Direct links → clear unavailable state with alternatives CTA

## 10. Migration / Legacy Data Handling

**No backfill required.** Rationale:
- Old docs simply lack `lastConfirmedAt`; the anchor falls back to
  `updatedAt ?? createdAt`, so recently-edited legacy rooms remain discoverable
  and genuinely abandoned ones expire naturally.
- No destructive writes are performed; owners can adopt explicit confirmation
  organically via the dashboard button.
- Optional future improvement (deferred): a one-time script setting
  `lastConfirmedAt = updatedAt` for all legacy actives to make the anchor uniform.

## 11. Tests Added

`app/src/lib/listingFreshness.test.ts` — 15 tests covering:
brand-new listing; within-stale; stale→needs_confirmation; past-expiry→expired;
legacy fallback (recent edit stays visible, ancient expires); closed/filled
mapping; paused; malformed status fail-closed; discoverability matrix; anchor
precedence (lastConfirmedAt > updatedAt > createdAt); label copy; relative-day
formatting; timezone independence (millis-based derivation).

Sprint 1 suites (report validation, account status, compatibility, connection
guards, phone share, role filtering, profile sanitization) all continue to pass.

## 12. Test Results

```
Test Files  7 passed (7)
     Tests  54 passed (54)
npm run check  ✓
npm run build  ✓ (production bundle built successfully)
```

Manual verification steps:
- Rules reviewed against the ownership matrix: NORMAL SEEKER → cannot update
  another's listing (fails owner check); OWNER → can update own incl. confirm;
  UNAUTHENTICATED → denied; SUSPENDED OWNER → denied (isActiveUser).
- Emulator-based automated rule tests remain unavailable in CI (documented in
  Sprint 1 §12); this limitation persists.

## 13. Performance Considerations

- Expiry filtering happens over the ≤100-doc query result — negligible cost,
  no extra reads, no N+1 introduced.
- No new Firestore indexes needed (status/city queries unchanged).
- The pre-existing fallback full-collection scan remains a known tech-debt item
  (now also filtered by discoverability); replacing it with proper pagination
  is recommended but out of scope this sprint.

## 14. Remaining Risks

1. **Rule tests not automated** — emulator harness still pending (carried from Sprint 1).
2. **Expiry is client-derived** — a user with a very old cached app version sees
   old behavior until they reload; acceptable for a SPA.
3. **Owner adoption** — if owners never confirm, all listings eventually expire
   after 45 days; the dashboard nudge mitigates this. Thresholds may need tuning
   after real-world observation.
4. **Notifications for "needs confirmation"/"expired" not implemented** — the
   notification architecture exists but wiring these events was deliberately
   deferred (per sprint rules) to avoid scope creep; documented as follow-up.
5. **Analytics events** (availability_confirmed, listing_closed) are not yet
   recorded to `listingViews`-style collections; event capture deferred.
6. Unknowns: real-device behavior of the mobile confirm button layout, and
   concurrent confirm/edit races (both benign — last-write-wins on distinct fields).

## 15. Deferred Work

- Notification events: listing_needs_confirmation, listing_expired, listing_closed
- Analytics events: availability_confirmed, listing_closed, listing_reactivated
- Replace fallback full-collection scan with cursor pagination
- One-time legacy `lastConfirmedAt` backfill script (optional)
- Ranking boost for freshly confirmed listings (belongs to match-ranking sprint)

## 16. Recommendation for Sprint 2B

Proceed to **TRUST & VERIFICATION QUALITY** as planned:
make trust signals meaningful and truthful (verification levels, badge
semantics, vouches/reviews quality), building on the truthful-claims baseline
from Sprint 1. Suggested prerequisites to fold in: emulator rule-test harness
and npm audit remediation (still outstanding from Sprint 1).

— End of Sprint 2A report. Sprint 2B NOT started.