# SPRINT 2D — ANALYTICS AUDIT

## 1. Existing Analytics (found — no duplicates created)

| Asset | Location | Notes |
|---|---|---|
| `listings.views` counter | useListings.recordView | incremented on RoomDetail view |
| `listingViews/{listingId}_{YYYY-MM-DD}` daily docs | useListings.recordView / getWeeklyViews | per-listing daily view counts; rules: read=authenticated, create field-restricted, update/delete=admin |
| Owner weekly views chart | OwnerDashboard via getWeeklyViews | 7-day read of listingViews |
| Admin dashboard metrics | useAdmin.getMetrics → AdminDashboard | full-collection scans: users (signups today/yesterday, daily 30d trend, seekers/owners, top cities), listings (active/total), chatRooms (count) |
| Seed view analytics | SeedData.tsx | dev-only synthetic listingViews |

## 2. What Does NOT Exist Today

- No generic event collection (no search/no-result/interest/chat-start/contact-share events)
- No funnel conversion metrics anywhere
- No no-result-rate or average-results measurement
- No supply-quality metrics (fresh/stale/zero-interest listings)
- No filter-usage or match-explanation-usage tracking
- No idempotency on any analytics write (recordView upserts by date key — naturally idempotent per day)

## 3. Funnel Stages That Actually Exist

SEEKER: discovery/search (SeekerDashboard findMatches) → room impression (cards) → room detail view (RoomDetail + recordView) → express interest (sendRequest) → connection accepted (acceptRequest) → chat (getOrCreateChatRoom/ChatPage) → contact share (assignSharedPhones consent flow).

OWNER: listing created (EditListing) → listing views (recordView) → interest received (connections) → accept/reject → chat → contact share.

All stages exist; only measurement is missing.

## 4. Privacy Posture (existing)

- No behavioral events stored publicly; listingViews readable by authenticated users but contains only counts + IDs.
- getMetrics is invoked from admin pages behind AdminLayout (isAdmin check client-side + rules enforce admins-only writes elsewhere).
- No PII in existing analytics. Must keep it that way: never log phone numbers, message text, addresses, tokens.

## 5. Design Decisions for This Sprint

1. ONE new collection: `analyticsEvents` — small, validated, admin-read-only.
2. Pure metric helpers in `lib/analytics.ts` (unit-testable, no Firebase): event validation, funnel rates (null when denominator = 0 — never fabricate), no-result rate, city aggregation, supply metrics from listing snapshots.
3. Client dedupe helper for session-scoped events (search, chat start) to survive React effect re-runs and double navigation.
4. Instrumentation points (fire-and-forget, never block UI): search_performed (+resultCount+city), interest_sent, connection_accepted, chat_started, contact_shared, listing_created, availability_confirmed, listing_closed, match_explanation_viewed.
5. Rules: create = authenticated + schema-validated + actorId==auth.uid; read/update/delete = admin only.
6. New admin page `/admin/marketplace` computing all metrics from real data; "Insufficient data" when denominators are zero.