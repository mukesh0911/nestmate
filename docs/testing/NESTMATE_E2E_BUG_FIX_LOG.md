# NESTMATE E2E BUG FIX LOG

**Document:** `docs/testing/NESTMATE_E2E_BUG_FIX_LOG.md`  
**Standard:** Continuous Autonomous Bug Resolution Log  
**System Under Test:** NestMate Web Application (`app/src`)  

---

## Bug Fix Summary Table

| BUG ID | Severity | Flow | Screen | File Changed | Status | Test Result |
|:---|:---|:---|:---|:---|:---|:---|
| **BUG-E2E-01** (D4-03) | **CRITICAL** | FLOW-07 / FLOW-13 | SCR-24 (`/edit-listing/:id`) | `app/src/App.tsx` | RESOLVED | **PASS** |
| **BUG-E2E-02** | MEDIUM | FLOW-04 | SCR-13 (`/explore`) | `tests/pages/page-objects.cjs` & runner | RESOLVED | **PASS** |
| **BUG-E2E-03** | MEDIUM | FLOW-07 | SCR-23 (`/owner-dashboard`) | `tests/e2e/master_suite_runner.cjs` | RESOLVED | **PASS** |
| **BUG-E2E-04** | MINOR | FLOW-05 | SCR-16 (`/match/:uid`) | `tests/pages/page-objects.cjs` | RESOLVED | **PASS** |
| **BUG-E2E-05** | **HIGH** | FLOW-13 (Admin RBAC) | `/admin` | `app/src/hooks/useAdmin.ts`, `AdminLayout.tsx` | RESOLVED | **PASS** |
| **BUG-E2E-06** | **HIGH** | FLOW-09 / FLOW-12 | Connections & Notifications | `app/src/hooks/useConnections.ts`, `useNotifications.ts` | RESOLVED | **PASS** |
| **BUG-E2E-07** | MEDIUM | FLOW-09 | `/room/:id` | `app/src/pages/RoomDetail.tsx` | RESOLVED | **PASS** |
| **BUG-E2E-08** | MINOR | FLOW-12 | `/notifications` | `app/src/pages/NotificationsPage.tsx` | RESOLVED | **PASS** |

---

## Detailed Bug Reports

### BUG-E2E-01 (Legacy Reference: D4-03)
- **BUG ID:** `BUG-E2E-01`
- **FLOW:** FLOW-07 (Owner Listing Creation) & FLOW-13 (Security / Role Enforcement)
- **SCREEN:** SCR-24 (Create / Edit Listing: `/edit-listing/:id`)
- **TEST:** `[P7] SECURITY: Seeker blocked from /edit-listing/new`
- **ROOT CAUSE:** In `app/src/App.tsx`, the route definition for `/edit-listing/:id` was protected by `<OnboardingGuard>` without the `expectedRole="owner"` property. While unauthenticated visitors were redirected to `/login`, authenticated users with the `seeker` role who bypassed the navigation links could navigate directly to `/edit-listing/new` and view the listing creation form.
- **FILE:** `app/src/App.tsx` (Line 336)
- **FIX:**
  ```tsx
  // Before:
  <Route path="/edit-listing/:id" element={<OnboardingGuard isAuthenticated={isAuthenticated} authState={authState}><EditListing /></OnboardingGuard>} />

  // After:
  <Route path="/edit-listing/:id" element={<OnboardingGuard isAuthenticated={isAuthenticated} authState={authState} expectedRole="owner"><EditListing /></OnboardingGuard>} />
  ```
- **TEST RESULT:** **PASS**. When authenticated seeker `S001` navigates to `http://localhost:3000/edit-listing/new`, the guard redirects to `http://localhost:3000/dashboard`.

---

### BUG-E2E-02
- **BUG ID:** `BUG-E2E-02`
- **FLOW:** FLOW-04 (Discovery & Advanced Filters)
- **SCREEN:** SCR-13 (Discovery Explore View: `/explore`)
- **TEST:** `[P6] DISCOVER: Filter drawer opens & closes`
- **ROOT CAUSE:** Test automation script targeted a generic role button (`button:has-text("Filters")`), but the actual UI button in `BrowseRooms.tsx` uses an accessible SVG icon button with `aria-label="Open filters"`.
- **FILE:** `tests/e2e/master_suite_runner.cjs`
- **FIX:** Updated the selector in both the Page Object and master suite runner to query `button[aria-label="Open filters"], button:has-text("Filter")`.
- **TEST RESULT:** **PASS**. Filter panel opens, toggles visibility, and closes cleanly without timeout.

---

### BUG-E2E-03
- **BUG ID:** `BUG-E2E-03`
- **FLOW:** FLOW-07 (Owner Operations)
- **SCREEN:** SCR-23 (Owner Dashboard: `/owner-dashboard`)
- **TEST:** `[P7] OWNER: O001 listing visible in dashboard`
- **ROOT CAUSE:** The test looked for multiple `.listing-card` class items, whereas `OwnerDashboard.tsx` renders a dedicated single active listing card header using `h2` with typography styling and status badges (`Active`, `Published`).
- **FILE:** `tests/e2e/master_suite_runner.cjs`
- **FIX:** Updated test assertion to inspect the dashboard header hierarchy for the exact seeded listing title and status pill.
- **TEST RESULT:** **PASS**. Listing detected with title, rent, and active badges verified.

---

### BUG-E2E-04
- **BUG ID:** `BUG-E2E-04`
- **FLOW:** FLOW-05 (Compatibility Calculation & Match Profiles)
- **SCREEN:** SCR-16 (Seeker / Match Profile: `/match/:uid`)
- **TEST:** `[P4] Profile & Compatibility score extraction`
- **ROOT CAUSE:** In `tests/pages/page-objects.cjs`, a regex expression `text=/%/` was written without valid Playwright selector escaping, causing a syntax parsing error during module initialization.
- **FILE:** `tests/pages/page-objects.cjs`
- **FIX:** Replaced invalid regex selector with safe attribute query `[class*="compatibility"], [class*="match"]`.
- **TEST RESULT:** **PASS**. Page objects load and evaluate compatibility attributes safely.

---

### BUG-E2E-05
- **BUG ID:** `BUG-E2E-05`
- **FLOW:** FLOW-13 (Admin RBAC & Route Guard)
- **SCREEN:** `/admin` (Admin Dashboard)
- **TEST:** `[P13] ADMIN: Admin user accesses /admin route`
- **ROOT CAUSE:** In `useAdmin.ts`, `isAdmin` was prematurely evaluated and returned as `false` while `authLoading` was still in progress before the Firebase user profile document could be fetched from Firestore. Additionally, `AdminLayout.tsx` immediately redirected to `/dashboard` if `!isAdmin` without waiting for `authLoading` to resolve.
- **FILES:** `app/src/hooks/useAdmin.ts`, `app/src/pages/admin/AdminLayout.tsx`
- **FIX:** Updated `useAdmin.ts` to coordinate `authLoading` state, and updated `AdminLayout.tsx` to display `<PageLoader />` while `checking || authLoading` is true before making a routing determination.
- **TEST RESULT:** **PASS**. Authenticated Admin reaches `/admin` and dashboard UI renders completely.

---

### BUG-E2E-06
- **BUG ID:** `BUG-E2E-06`
- **FLOW:** FLOW-09 (Connections) & FLOW-12 (Notifications)
- **SCREEN:** `/owner-dashboard`, `/notifications`
- **TEST:** `[P8] CONN: O001 sees pending connection`, `[P12] NOTIF: Notifications are listed`
- **ROOT CAUSE:** In `useConnections.ts` and `useNotifications.ts`, queries combining `where('toUserId', '==', ...)` or `where('userId', '==', ...)` with `orderBy('createdAt', 'desc')` caused Firestore client errors demanding manual composite index generation: `The query requires an index`.
- **FILES:** `app/src/hooks/useConnections.ts`, `app/src/hooks/useNotifications.ts`
- **FIX:** Removed `orderBy('createdAt', 'desc')` from the Firestore query parameter and sorted incoming array in-memory using `createdAt.toMillis()`.
- **TEST RESULT:** **PASS**. Connections and notifications hydrate instantly without missing-index runtime errors.

---

### BUG-E2E-07
- **BUG ID:** `BUG-E2E-07`
- **FLOW:** FLOW-09 (Connection Lifecycle & Duplicate Prevention)
- **SCREEN:** `/room/:id` (Room Detail)
- **TEST:** `[P8] CONN: Duplicate connection prevented — Connect state changed`
- **ROOT CAUSE:** In `RoomDetail.tsx`, the `requestSent` state was purely local React state initialized to `false`. If a user reloaded the page, navigated back, or refreshed their session, the button reset to "Express Interest", allowing duplicate connection attempts.
- **FILE:** `app/src/pages/RoomDetail.tsx`
- **FIX:** Added real-time subscription via `subscribeToMyConnections` in `RoomDetail.tsx` to automatically set `requestSent = true` if an active connection already exists between `user.uid` and the listing owner.
- **TEST RESULT:** **PASS**. "Interest Sent ✓" state accurately reflects existing connections across sessions and page reloads.

---

### BUG-E2E-08
- **BUG ID:** `BUG-E2E-08`
- **FLOW:** FLOW-12 (Notifications Center)
- **SCREEN:** `/notifications`
- **TEST:** `[P12] NOTIF: Notifications are listed`
- **ROOT CAUSE:** Notification elements rendered dynamically in `NotificationsPage.tsx` lacked test identifiers, making automated counts fragile against layout CSS changes.
- **FILE:** `app/src/pages/NotificationsPage.tsx`
- **FIX:** Added `data-testid="notification-item"` to each rendered notification card.
- **TEST RESULT:** **PASS**. Notification items detected and counted reliably.
