# NESTMATE — REAL-TIME MULTI-USER E2E SCENARIO MATRIX

**Purpose**: Systematic execution matrix for multi-user, cross-role, real-time, and failure-injection scenarios.

---

## 1. MULTI-USER SCENARIO MATRIX (SCENARIOS A – J)

| Scenario ID | Scenario Name | Actors & Roles | Initial State | Trigger Action | Expected State Transformation | Real-Time Sync & Persistence | Result |
|---|---|---|---|---|---|---|---|
| **`SCEN-A`** | Seeker $\rightarrow$ Owner Connection Request | `User A` (Seeker), `User B` (Owner) | `User B` has active listing `lst_blr_001`. `User A` views `/room/lst_blr_001`. | `User A` clicks "Express Interest". | Connection doc created (`status: 'pending'`, `listingId: 'lst_blr_001'`). Notification doc created for `User B`. | `User B` receives in-app alert badge without page refresh. | **PASS** |
| **`SCEN-B`** | Owner Accepts $\rightarrow$ Seeker Notification & Chat | `User B` (Owner), `User A` (Seeker) | `User B` opens `/owner-dashboard?request={id}`. | `User B` clicks "Accept". | Connection doc updated to `status: 'accepted'`. Chat room created with `[User A, User B]`. Acceptance notification sent to `User A`. | Both users see the new chat room in `/chat`. Unread count updates. | **PASS** |
| **`SCEN-C`** | Two-Way Real-Time Chat | `User A`, `User B` | Both users are in active chat room `/chat/{roomId}`. | `User A` types message and clicks Send. | Message added to `chatRooms/{roomId}/messages`. | `User B` sees message immediately via `onSnapshot` without browser refresh. `User B` replies; `User A` receives reply in real time. | **PASS** |
| **`SCEN-D`** | Mutual Phone Sharing Consent Handshake | `User A`, `User B` | Active chat room `/chat/{roomId}` with masked contact numbers. | `User A` clicks "Share Phone" $\rightarrow$ `User B` receives in-chat prompt and clicks "Accept & Share". | `chatRooms.phoneSharing` status becomes `accepted`. Contact numbers fetched from `privateUserData/{uid}`. | Both users now see unmasked contact numbers. An unrelated `User C` cannot read either phone number. | **PASS** |
| **`SCEN-E`** | Peer Review & Vouch Lifecycle | `User A`, `User B` | Connection accepted between `User A` and `User B`. | `User A` visits `/match/{User B}` and submits a 5-star review. | Document created in `reviews` collection. Rating and review count recalculated. | Recipient profile displays vouch. Self-review blocked by Firestore rules. | **PASS** |
| **`SCEN-F`** | Listing Lifecycle while Active Viewer is Browsing | `User B` (Owner), `User A` (Seeker) | `User A` has `/room/lst_blr_001` open. | `User B` pauses listing in `/owner-dashboard`. | Listing `status` becomes `'paused'`. | Listing is immediately removed from public `/explore` discovery. Direct visits render graceful paused banner. | **PASS** |
| **`SCEN-G`** | Dynamic Role Switching | `User A` (Active Seeker) | `User A` on `/dashboard`. | `User A` switches role to Owner in Settings. | `users/{uid}.role` updated to `'owner'`. `App.tsx` onSnapshot receives update. | Immediately lands on `/owner-dashboard`. Refreshing retains Owner role with 0 redirect bounce. | **PASS** |
| **`SCEN-H`** | Notification Arrives on Unrelated Screen | `User A`, `User B` | `User A` browsing `/explore`. | `User B` sends a message or connection. | Notification created in Firestore. | Header notification bell increments unread count badge in real time. Clicking opens notification stream. | **PASS** |
| **`SCEN-I`** | Remote Firestore Data Modification | `User A` | `User A` viewing `/dashboard`. | Document `users/{User A}` updated externally (e.g. verified badge granted). | `onSnapshot` triggers state update. | UI instantly reflects verified badge without requiring a manual page refresh. | **PASS** |
| **`SCEN-J`** | Concurrent Mutation & Double-Click Protection | `User A` | `User A` on `/dashboard` or `/room/{id}`. | `User A` rapidly double-clicks "Connect" / "Accept". | State locks (`connectingId` / `processingApplicantId`). | Single connection document created; single notification dispatched. Zero duplicate records in Firestore. | **PASS** |

---

## 2. FAILURE INJECTION & RESILIENCE VALIDATION

| Injection Scenario | Simulated Fault | Expected System Behavior | Actual Result |
|---|---|---|---|
| **`FAIL-01`** | Direct visit to non-existent route `/invalid-route-xyz` | Renders `NotFound.tsx` with "Back to Home" CTA | **PASS (Graceful 404 recovery)** |
| **`FAIL-02`** | Direct visit to `/admin` by non-admin user | Renders `AdminLayout.tsx` "Access Denied" gate | **PASS (Denied without data leak)** |
| **`FAIL-03`** | Direct visit to `/dashboard` by unauthenticated visitor | Redirects to `/login` | **PASS (Redirected to login)** |
| **`FAIL-04`** | Rapid double-click on "Accept" in Owner Dashboard | Debounce guard ignores 2nd click | **PASS (1 chat room created)** |
| **`FAIL-05`** | Self-connection attempt (User A $\rightarrow$ User A) | Blocked by Firestore security rules | **PASS (Rule rejection: `fromUserId != toUserId`)** |
| **`FAIL-06`** | Self-review attempt (User A reviewing User A) | Blocked by Firestore security rules | **PASS (Rule rejection: `reviewerId != targetUserId`)** |
