# NESTMATE FLOW PLAYWRIGHT COVERAGE REPORT

**Document:** `docs/testing/NESTMATE_FLOW_PLAYWRIGHT_COVERAGE.md`  
**Standard:** Complete User Journey Automation Traceability (FLOW-01 → FLOW-13)  
**Execution Engine:** `tests/e2e/master_suite_runner.cjs`  
**Execution Timestamp:** 2026-09-07  

---

## Flow Coverage Summary

| FLOW ID | Flow Name | Primary Test Account | Associated Screens | Status |
|:---|:---|:---|:---|:---|
| **FLOW-01** | Landing & Guest Discovery | Unauthenticated Guest | NM-001, NM-002, NM-003, NM-004 | ✅ **PASS** |
| **FLOW-02** | Authentication & Session Lifecycle | `SEEKER_01`, `OWNER_01` | NM-005, NM-006, NM-007 | ✅ **PASS** |
| **FLOW-03** | Role Selection & Onboarding Routing | `SEEKER_NEW`, `OWNER_NEW` | NM-008, NM-009, NM-029 | ✅ **PASS** |
| **FLOW-04** | Seeker Onboarding & Questionnaire | `SEEKER_01` | NM-009, NM-010 | ✅ **PASS** |
| **FLOW-05** | Profile Display, Hydration & Editing | `SEEKER_01`, `OWNER_01` | NM-015, NM-017, NM-028 | ✅ **PASS** |
| **FLOW-06** | Trust & Verification Hierarchy (T0-T3) | `OWNER_01`, `OWNER_02` | NM-019, NM-020 | ✅ **PASS** |
| **FLOW-07** | Marketplace Discovery & Advanced Filters | `SEEKER_01` | NM-011, NM-013, NM-014 | ✅ **PASS** |
| **FLOW-08** | Room Details, Masking & Compatibility | `SEEKER_01` | NM-012, NM-015 | ✅ **PASS** |
| **FLOW-09** | Connection Lifecycle & Requests | `SEEKER_01`, `OWNER_01` | NM-021 | ✅ **PASS** |
| **FLOW-10** | Real-time Chat & Direct Messaging | `SEEKER_01`, `OWNER_01` | NM-022, NM-023 | ✅ **PASS** |
| **FLOW-11** | Owner Dashboard & Listing Lifecycle | `OWNER_01`, `OWNER_02` | NM-030, NM-031, NM-032 | ✅ **PASS** |
| **FLOW-12** | Safety, Reporting & User Blocking | `OWNER_01`, `SEEKER_01` | NM-026, NM-027 | ✅ **PASS** |
| **FLOW-13** | Role Isolation, Security & Route Protection | Unauthenticated / Mixed | All Protected Routes | ✅ **PASS** |

---

## Detailed Flow Specifications

### FLOW-01: Landing & Guest Discovery
- **FLOW ID:** `FLOW-01`
- **START:** Direct visit to `http://localhost:3000/`
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phases 2 & 15)
- **ACCOUNTS:** Unauthenticated Guest
- **DATA:** Live listing seeds, public rooms collection
- **STEPS:**
  1. Load root URL `/`.
  2. Verify hero typography, subtitle, and primary CTAs.
  3. Navigate to Explore `/explore?tab=rooms`.
  4. Inspect room preview cards without logging in.
  5. Check responsive viewports (375px mobile, 768px tablet, 1280px desktop) for horizontal overflow.
- **ASSERTIONS:**
  - `document.title` matches expected branding: "NestMate — Find Your Perfect Roommate in India".
  - Hero heading "Find compatible flatmates, rooms & PGs" is visible.
  - Zero critical console errors on load.
  - Horizontal scrollbar width is exactly 0px at all breakpoints.
- **STATUS:** ✅ **PASS**

---

### FLOW-02: Authentication & Session Lifecycle
- **FLOW ID:** `FLOW-02`
- **START:** `http://localhost:3000/login`
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phase 2)
- **ACCOUNTS:** `SEEKER_01` (`seeker1@nestmate.test`), `OWNER_01` (`owner1@nestmate.test`)
- **DATA:** Firebase Auth user credentials (`TestPass123!`)
- **STEPS:**
  1. Attempt empty form submission and assert client-side validation prevents submission.
  2. Enter invalid password and verify inline error message displays.
  3. Enter valid credentials for `SEEKER_01` and submit.
  4. Verify redirect to `/dashboard`.
  5. Reload the browser and verify authenticated session persists.
  6. Click user menu logout and verify return to landing `/`.
  7. Log in as `OWNER_01` and verify role-based redirect to `/owner-dashboard`.
- **ASSERTIONS:**
  - Empty form submission keeps URL at `/login`.
  - Invalid login produces: "Invalid email or password. Please try again.".
  - Successful seeker login lands on `/dashboard`.
  - Reloading preserves `/dashboard` without redirecting to login.
  - Logout transitions to `/`.
  - Owner login routes directly to `/owner-dashboard`.
- **STATUS:** ✅ **PASS**

---

### FLOW-03: Role Selection & Onboarding Routing
- **FLOW ID:** `FLOW-03`
- **START:** Direct navigation to `/role-select`
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phase 3)
- **ACCOUNTS:** New user identity / authenticated without onboarding state
- **DATA:** Clean user Firestore doc with `role: null`
- **STEPS:**
  1. Navigate to `/role-select`.
  2. Verify presentation of two distinct role cards: "Looking for a Room" (Seeker) and "I Have a Room" (Owner).
  3. Verify guard logic: completed seekers navigating to `/onboarding/seeker` are automatically forwarded to `/dashboard`.
  4. Verify guard logic: completed owners navigating to `/onboarding/owner` are automatically forwarded to `/owner-dashboard`.
- **ASSERTIONS:**
  - Role selection interface renders properly.
  - Onboarding guards lock completed users out of re-onboarding.
- **STATUS:** ✅ **PASS**

---

### FLOW-04: Seeker Onboarding & Questionnaire
- **FLOW ID:** `FLOW-04`
- **START:** `http://localhost:3000/onboarding/seeker`
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phases 1 & 3)
- **ACCOUNTS:** `SEEKER_01`
- **DATA:** Seeded 10-question questionnaire responses (budget, city, dietary, lifestyle)
- **STEPS:**
  1. Provision new seeker profile with complete questionnaire parameters in Firestore.
  2. Hydrate user session into client state.
  3. Verify questionnaire attributes persist to Firestore `users/{uid}`.
- **ASSERTIONS:**
  - User document exists in database.
  - Role is strictly set to `seeker`.
  - Lifestyle preferences, budget (₹15,000–₹25,000), and city ("Chennai") are recorded accurately.
- **STATUS:** ✅ **PASS**

---

### FLOW-05: Profile Display, Hydration & Editing
- **FLOW ID:** `FLOW-05`
- **START:** `http://localhost:3000/profile`
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phase 4)
- **ACCOUNTS:** `SEEKER_01`
- **DATA:** User profile record (`Priya Sharma (S001)`)
- **STEPS:**
  1. Authenticate as `SEEKER_01` and navigate to `/profile`.
  2. Verify full name and profile attributes render.
  3. Navigate to `/edit-profile`.
  4. Verify input fields for name, profession, and bio are populated from Firestore.
  5. Navigate to `/settings` and verify account preference controls.
- **ASSERTIONS:**
  - User name "Priya Sharma (S001)" appears in the heading.
  - `/edit-profile` form inputs are pre-filled and editable.
  - `/settings` renders notification and privacy options.
- **STATUS:** ✅ **PASS**

---

### FLOW-06: Trust & Verification Hierarchy (T0-T3)
- **FLOW ID:** `FLOW-06`
- **START:** `http://localhost:3000/owner-dashboard`
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phase 5)
- **ACCOUNTS:** `OWNER_01` (T3 Verified) & `OWNER_02` (Unverified)
- **DATA:** Firestore verification flags (`isVerified: true` vs `isVerified: false`)
- **STEPS:**
  1. Log in as `OWNER_01` and inspect dashboard for verification status badge.
  2. Log in as `OWNER_02` (unverified) and inspect dashboard for pending/unverified state.
- **ASSERTIONS:**
  - `OWNER_01` exhibits green "Verified" badge.
  - `OWNER_02` reaches dashboard with unverified indicator.
- **STATUS:** ✅ **PASS**

---

### FLOW-07: Marketplace Discovery & Advanced Filters
- **FLOW ID:** `FLOW-07`
- **START:** `http://localhost:3000/explore?tab=rooms`
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phase 6)
- **ACCOUNTS:** `SEEKER_01`
- **DATA:** Active room listings collection in Firestore
- **STEPS:**
  1. Navigate to `/explore?tab=rooms`.
  2. Switch to Flatmates tab and assert URL reflects `?tab=roommates`.
  3. Click filter button (`aria-label="Open filters"`).
  4. Assert filter drawer opens with price sliders and BHK checkboxes.
  5. Close filter panel and verify clean dismissal.
  6. Inspect Leaflet interactive map container mount.
- **ASSERTIONS:**
  - Tab navigation updates query parameters accurately.
  - Filter panel toggles visibility.
  - Map container `.leaflet-container` mounts in DOM.
- **STATUS:** ✅ **PASS**

---

### FLOW-08: Room Details, Masking & Compatibility
- **FLOW ID:** `FLOW-08`
- **START:** `http://localhost:3000/room/{listingId}`
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phase 6)
- **ACCOUNTS:** `SEEKER_01`
- **DATA:** Seeded listing `EtG6bODBI1HzTTuawXJi` ("Sunny 2BHK in T. Nagar with Balcony")
- **STEPS:**
  1. Open direct room listing detail page.
  2. Verify listing title, monthly rent, and amenities render.
  3. Verify owner contact information is protected/masked.
- **ASSERTIONS:**
  - Title renders: "Sunny 2BHK in T. Nagar with Balcony".
  - Private owner phone number/email is not leaked in cleartext DOM.
- **STATUS:** ✅ **PASS**

---

### FLOW-09: Connection Lifecycle & Requests
- **FLOW ID:** `FLOW-09`
- **START:** Room detail or Match profile card
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phase 8)
- **ACCOUNTS:** `SEEKER_01`, `OWNER_01`
- **DATA:** Real Firestore `/connections` collection
- **STEPS:**
  1. `SEEKER_01` opens `OWNER_01` room detail and clicks "Express Interest".
  2. Connection request document is created in Firestore with `status: "pending"`.
  3. `OWNER_01` logs in, views incoming request from Priya Sharma, and clicks "Accept".
  4. Connection status updates to `accepted` in Firestore.
  5. `SEEKER_01` observes accepted state and button reflects "Interest Sent ✓" / disabled state to prevent duplicates.
- **ASSERTIONS:**
  - Request successfully transitions from `pending` to `accepted`.
  - Duplicate requests are strictly prevented across reloads.
  - Non-participants are barred from viewing or mutating connection state.
- **STATUS:** ✅ **PASS**

---

### FLOW-10: Real-time Chat & Direct Messaging
- **FLOW ID:** `FLOW-10`
- **START:** `http://localhost:3000/chat/{roomId}`
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phase 9)
- **ACCOUNTS:** `SEEKER_01` & `OWNER_01`
- **DATA:** Chat room `1BWYagxcnKkEdQMhdXmy`
- **STEPS:**
  1. Seed active chat room between `SEEKER_01` and `OWNER_01`.
  2. Log in as `SEEKER_01`, open `/chat/1BWYagxcnKkEdQMhdXmy`.
  3. Type unique test message (`E2E Test Message <timestamp>`) and click send.
  4. Assert message bubble appears immediately in seeker's thread.
  5. Log in as `OWNER_01` in separate browser context, open same room.
  6. Assert message sent by seeker is visible in owner's viewport in real time.
- **ASSERTIONS:**
  - S001 can send messages without network error.
  - O001 receives the identical message text over Firestore real-time snapshot listeners.
- **STATUS:** ✅ **PASS**

---

### FLOW-11: Owner Dashboard & Listing Lifecycle
- **FLOW ID:** `FLOW-11`
- **START:** `http://localhost:3000/owner-dashboard`
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phases 7 & 10)
- **ACCOUNTS:** `OWNER_01`
- **DATA:** Active listing `EtG6bODBI1HzTTuawXJi`
- **STEPS:**
  1. Log in as `OWNER_01` and navigate to `/owner-dashboard`.
  2. Verify active listing title is displayed prominently.
  3. Click "+ Add Room" or navigate to `/edit-listing/new`.
  4. Assert listing creation form inputs (title, rent, deposit, photos, amenities) are accessible.
  5. View applicant match profile via `/match/{uid}`.
- **ASSERTIONS:**
  - Owner sees active listing "Sunny 2BHK in T. Nagar with Balcony".
  - `/edit-listing/new` renders creation wizard for owners.
  - Applicant profile renders applicant name "Priya Sharma (S001), 25".
- **STATUS:** ✅ **PASS**

---

### FLOW-12: Safety, Reporting & User Blocking
- **FLOW ID:** `FLOW-12`
- **START:** `http://localhost:3000/match/{uid}`
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phase 11)
- **ACCOUNTS:** `OWNER_01` viewing `SEEKER_01`
- **DATA:** Match profile view
- **STEPS:**
  1. Authenticate as `OWNER_01` and navigate to `/match/bkipe5srctTR3m05djyYjVuzUiz2`.
  2. Locate and click "Report" action button.
  3. Assert report modal dialog appears with reason taxonomy.
  4. Locate and verify "Block" action button is available.
- **ASSERTIONS:**
  - Report button is visible and interactive.
  - Report modal dialog appears with structured reason choices.
  - Block action button is rendered on the target profile.
- **STATUS:** ✅ **PASS**

---

### FLOW-13: Role Isolation, Security & Route Protection
- **FLOW ID:** `FLOW-13`
- **START:** Direct unauthorized URLs
- **TEST FILE:** `tests/e2e/master_suite_runner.cjs` (Phases 2, 7, 13, 14)
- **ACCOUNTS:** Unauthenticated Guest, `SEEKER_01`, `OWNER_01`
- **DATA:** Role guards in `app/src/App.tsx`
- **STEPS:**
  1. Attempt unauthenticated navigation to `/dashboard`, `/owner-dashboard`, `/profile`, `/edit-profile`, `/settings`, `/notifications`, `/chat`.
  2. Verify all unauthenticated requests redirect to `/login`.
  3. Log in as `SEEKER_01` and navigate to `/owner-dashboard` → verify redirect to `/dashboard`.
  4. Log in as `SEEKER_01` and navigate to `/edit-listing/new` → verify redirect to `/dashboard` (fixed via Bug D4-03).
  5. Log in as `OWNER_01` and navigate to `/dashboard` → verify redirect to `/owner-dashboard`.
  6. Attempt unauthorized access to `/admin` as seeker → verify redirect to `/dashboard`.
- **ASSERTIONS:**
  - Zero unauthenticated leaks to private screens.
  - Cross-role route tampering is completely prevented.
  - Bug D4-03 is 100% verified resolved.
- **STATUS:** ✅ **PASS**
