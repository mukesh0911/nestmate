# SPRINT 2A — LISTING FRESHNESS & AVAILABILITY INTEGRITY AUDIT

## 1. Existing Listing Architecture (as found)

### Data model (`app/src/hooks/useListings.ts`)
- Collection: `listings`
- Status field: `status: 'active' | 'paused' | 'filled'` (no `closed`)
- Timestamps: `createdAt`, `updatedAt` only — **no availability-confirmation timestamp**
- `updatedAt` was bumped on *every* edit (photo/description/status), so it could not
  distinguish "owner says room is available" from "owner tweaked a photo"
- Analytics: `listingViews/{listingId}_{YYYY-MM-DD}` daily counters exist

### Lifecycle as implemented
1. Owner creates listing → `status: 'active'` (OwnerOnboarding / EditListing)
2. Discovery query: `where('status','==','active') orderBy('createdAt') limit(100)`
   + a fallback full-collection scan filtered client-side to active
3. Seeker opens `/room/:id` → detail page; Express Interest → connection
4. Owner can pause/resume (`status: 'paused'`) or delete (hard delete)
5. `filled` existed in the type but had NO UI path to set it

### Problems found
| # | Problem | Severity |
|---|---------|----------|
| F1 | No freshness concept: a listing created 6 months ago still shows as "LIVE" with no signal it may be gone | P0 |
| F2 | `updatedAt` conflates edits with availability confirmation | P0 |
| F3 | No owner action to say "room taken" other than hard delete (destroys history/analytics) | P1 |
| F4 | Direct links/saved rooms to closed/expired rooms render a full active-looking detail page | P0 |
| F5 | `filled` status unreachable from UI | P2 |
| F6 | Suspended owners could still edit listings at rules level (Sprint 1 covered writes generally via isActiveUser on some paths; listings update lacked it) | P1 |
| F7 | Status values were unvalidated in rules (client could write arbitrary strings) | P1 |

## 2. Product Decisions

- **Freshness anchor:** new explicit field `lastConfirmedAt` = "owner most recently
  confirmed this room is still available". NOT derived from edits.
- **Thresholds (configurable, single source of truth in
  `app/src/lib/listingFreshness.ts`):**
  - Stale after **14 days** without confirmation → "Availability needs confirmation"
    (still discoverable, flagged)
  - Expired after **45 days** without confirmation → hidden from discovery
- **State model:** conceptual states are DERIVED from `status` + `lastConfirmedAt`;
  no cron job or stored enum needed:
  - ACTIVE = status active ∧ fresh
  - NEEDS_CONFIRMATION = status active ∧ stale
  - EXPIRED = status active ∧ past expiry
  - CLOSED = status 'closed' or 'filled' (explicit owner action)
  - REMOVED = doc deleted (unchanged behavior)
- **Legacy handling:** docs without `lastConfirmedAt` fall back to
  `updatedAt ?? createdAt`. Valid legacy rooms edited recently do NOT disappear;
  truly ancient untouched ones naturally expire. No destructive migration required.
- **Connections:** existing accepted connections/chat are never destroyed by a
  status change; only NEW marketplace actions against unavailable inventory are blocked.
- **Saved rooms:** preserved (IDs stay in `savedRoomIds`); opening an unavailable
  saved room shows the clear "no longer available" state instead of a live-looking page.

## 3. Server-side integrity

Firestore rules for `listings` now enforce:
- create: authenticated + active user + self-owned + status ∈ {active, paused, filled, closed}
- update: owner (must be active user, valid status) OR views/updatedAt-only bump OR admin
  → a seeker cannot confirm/reactivate someone else's listing; a suspended owner cannot edit
- confirmation timestamps written via `serverTimestamp()` from the client hook,
  so clients cannot spoof freshness values

## 4. Files touched (implementation)

- `app/src/lib/listingFreshness.ts` (NEW) — policy config + pure functions
- `app/src/lib/listingFreshness.test.ts` (NEW) — 15 tests
- `app/src/hooks/useListings.ts` — schema, discovery filtering, confirmAvailability/closeListing
- `app/firestore.rules` — listing status validation + isActiveUser on updates
- `app/src/pages/RoomDetail.tsx` — direct-link unavailable state
- `app/src/pages/OwnerDashboard.tsx` — confirm/close actions + last-confirmed display