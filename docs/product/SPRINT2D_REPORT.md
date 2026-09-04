# Sprint 2D — Product Analytics & Marketplace Insights Report

**Scope:** Truthful, privacy-safe product measurement for the NestMate marketplace — event taxonomy, instrumentation, Firestore rules, and an admin insights page. **No fabricated metrics anywhere.**

---

## 1. Executive Summary

NestMate previously had **no product analytics**: the founder could not answer basic questions like "how many searches return zero results?", "where do users drop off between search → interest → chat?", or "which cities have demand but no supply?".

Sprint 2D adds a lightweight, privacy-conscious measurement layer:

- A **closed taxonomy of 12 events** covering the full marketplace funnel (search → view → interest → accept → chat → contact share) plus supply-side actions (listing created/closed, availability confirmed).
- **Privacy by design:** no PII fields are ever accepted into an event (client validation + defense-in-depth key blacklist + server rules). Phone numbers, message text, addresses, tokens are structurally impossible to log.
- **Server-enforced security:** `analyticsEvents` is create-only for active authenticated users (own UID as actor, whitelisted names, size-capped fields); readable **only by admins**; immutable (no update/delete).
- An **admin Marketplace Insights page** rendering real funnel metrics with explicit empty states — if there is no data, it says so instead of showing zeros dressed up as dashboards.
- All math lives in a **pure, unit-tested library** (`analytics.ts`): rates are `null` when denominators are zero — never fabricated.

## 2. What Was Built

| Piece | File | Notes |
|---|---|---|
| Event taxonomy + validation + funnel math | `app/src/lib/analytics.ts` | Pure functions, no Firebase |
| Write path (fire-and-forget, deduped) | `app/src/hooks/useAnalytics.ts` | Never blocks or breaks UX on failure |
| Instrumentation | `SeekerDashboard`, `RoomDetail`, `ChatPage`, `useListings` | see §3 |
| Server rules | `app/firestore.rules` | `analyticsEvents` block |
| Admin UI | `app/src/pages/admin/AdminMarketplace.tsx` | Route `/admin/marketplace`, gated by AdminLayout + rules |
| Tests | `app/src/lib/analytics.test.ts` | 23 tests |

## 3. Events Instrumented

| Event | Trigger point | Fields | Dedupe |
|---|---|---|---|
| `search_performed` | SeekerDashboard match load | city, resultCount (0 logged too) | per filter signature, 60s |
| `interest_sent` | sendRequest success (dashboard + room detail) | entityId, city | none (intentional action) |
| `interest_accepted` | acceptRequest success | entityId, city | none |
| `chat_started` | ChatPage active room change | roomId | per room, 60s |
| `contact_shared` | mutual phone-share consent COMPLETES | roomId only — **never phone numbers** | none |
| `listing_created` / `listing_closed` / `availability_confirmed` | owner lifecycle in `useListings` | listingId, city | none; actor = real auth UID |

Not instrumented this sprint: `listing_viewed` (RoomDetail already writes `listingViews/{id}_{date}` counters — duplicating would double-count), `interest_rejected`, `connection_created`, `match_explanation_viewed` is wired via compat-modal open.

## 4. Security & Privacy Design

**Firestore rules (`analyticsEvents`):**
- `create`: active authenticated user; `name` ∈ whitelist; `actorId == request.auth.uid`; optional `entityId` ≤128 chars, `city` 1–64 chars, `resultCount` ≥0 int. Suspended/banned users cannot write events.
- `read`: admin only (admins/{email} registry). Users cannot read even their own behavioral history.
- `update, delete: false` — events are immutable audit data.

**Client validation (`validateAnalyticsEvent`)** mirrors the rules and additionally rejects unknown names, oversized IDs, negative counts. **`isContextSafe`** blacklists PII keys (`phone`, `email`, `message`, `address`, …) as defense-in-depth for any future context param.

**Admin authorization:** the page relies on the same server-side admin model as the rest of the panel (AdminLayout gate is UX; the Firestore rules are the enforcement layer — a non-admin querying `analyticsEvents` gets permission-denied, which the page surfaces explicitly).

## 5. Test Results

```
10 test files, 109 tests passed (vitest)
  analytics.test.ts: 23 tests
    - validation (names, actor, sizes, closed taxonomy)
    - privacy key blacklist
    - funnel rates null-on-zero-denominator
    - computeMarketplaceMetrics: windowing, counting,
      zero-result tracking, null acceptRate, top cities, empty input
npm run build: ✓ production build succeeds
```

## 6. Honest Limitations & Remaining Risks

1. **No bot/abuse filtering.** Rules prevent identity spoofing but not a malicious authenticated user flooding synthetic events. Acceptable at current scale; revisit if metrics start driving decisions.
2. **Client-side dedupe is session-scoped.** Repeat navigations across sessions can double-count `search_performed`. Directional accuracy only.
3. **Rules not yet exercised against the emulator.** The `validAnalyticsEvent()` function should be validated with `@firebase/rules-unit-testing` before relying on it in anger (same status as prior sprints' rule blocks).
4. **`rules deploy` required.** The new collection block takes effect only after `firebase deploy --only firestore:rules`. Until then, default-deny keeps events unwritable (writes fail silently — fire-and-forget).
5. **5000-doc read cap** in the admin page; fine for months of early data, will need aggregation later.

## 7. Files Changed

- `app/src/lib/analytics.ts` (+`computeMarketplaceMetrics`, `AnalyticsEventDoc`)
- `app/src/lib/analytics.test.ts` (+6 tests)
- `app/src/hooks/useAnalytics.ts` (existing from earlier in sprint)
- `app/src/hooks/useListings.ts` (3 lifecycle events)
- `app/src/pages/SeekerDashboard.tsx` (search/interest/explanation events)
- `app/src/pages/RoomDetail.tsx` (interest_sent)
- `app/src/pages/ChatPage.tsx` (chat_started, contact_shared)
- `app/firestore.rules` (analyticsEvents block)
- `app/src/pages/admin/AdminMarketplace.tsx` (new)
- `app/src/App.tsx`, `app/src/pages/admin/AdminLayout.tsx` (route + nav)

## 8. Recommended Next

- Emulator-based rules tests for `analyticsEvents`.
- Wire `listing_viewed` after deprecating the legacy `listingViews` counters (single source of truth).
- Retention/daily-aggregation job once volume grows.