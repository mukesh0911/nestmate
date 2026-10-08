# NestMate — Complete Feature Test Matrix

**Certified Test Architecture Specification**  
**Document Status:** Complete & Verified Against Production Codebase  
**Target Environment:** Isolated Test Project (`nestmate-eb562`)  
**Base URL:** `http://localhost:3000`

---

## 1. System Inventory Summary

### 1.1 Production Routes
| Route | Component | Access Gate | Description |
|---|---|---|---|
| `/` | `LandingPage` | Public | Marketing landing page with hero, search teaser, features |
| `/login` | `AuthPage` | Public | Email and Google authentication portal |
| `/role-select` | `RoleSelect` | Authenticated (Incomplete Onboarding) | Step 1 onboarding role selector (Seeker vs. Owner) |
| `/onboarding/seeker` | `SeekerOnboarding` | Authenticated (Seeker role) | Seeker profile setup & lifestyle quiz |
| `/onboarding/owner` | `OwnerOnboarding` | Authenticated (Owner role) | Owner profile setup & property basics |
| `/explore` | `ExplorePage` | Authenticated / Public (read-only) | Core marketplace for rooms, flatmates, and connections |
| `/room/:id` | `RoomDetail` | Public / Authenticated | Detailed room view with gallery, amenities, connect CTA |
| `/match/:id` | `MatchDetail` | Authenticated | Flatmate compatibility profile with lifestyle comparison |
| `/connections` | `ExplorePage` (tab redirect) | Authenticated | Sent and received connection requests |
| `/owner-dashboard` | `OwnerDashboard` | Authenticated (Owner role) | Listings management, applicants, analytics |
| `/edit-listing/:id` | `EditListing` | Authenticated (Listing owner) | Property details editor and lifecycle manager |
| `/chat` | `ChatPage` | Authenticated | Direct messaging list and conversation hub |
| `/chat/:roomId` | `ChatPage` | Authenticated (Room participant) | Real-time chat thread |
| `/profile` | `ProfilePage` | Authenticated | User identity, verification status, contact info |
| `/edit-profile` | `EditProfile` | Authenticated | Personal info, habits, and verification uploader |
| `/preferences` | `PreferencesPage` | Authenticated (Seeker role) | Budget and lifestyle search preference editor |
| `/notifications` | `NotificationsPage` | Authenticated | System alerts and activity notifications |
| `/settings` | `SettingsPage` | Authenticated | Account preferences, dark mode, privacy |
| `/admin` | `AdminDashboard` | Authenticated (Admin email) | Platform overview, KPIs, system health |
| `/admin/users` | `AdminUsers` | Authenticated (Admin email) | User management, suspend, ban, reinstate |
| `/admin/listings` | `AdminListings` | Authenticated (Admin email) | Listing moderation, verify, pause, remove |
| `/admin/verifications` | `AdminVerifications` | Authenticated (Admin email) | Document review queue (Approve/Reject) |
| `/admin/reports` | `AdminReports` | Authenticated (Admin email) | Trust & safety flag resolutions |

---

## 2. Feature-by-Feature Matrix

---

### FEATURE 1: Authentication & Session Gateways
- **Route:** `/login`, `/role-select`, `/`
- **Components:** `AuthPage.tsx`, `useAuth.ts`, `App.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Auth: Email Login | Email input, Password input, Submit button | 1. Seeker submits valid credentials | Session stored in localStorage, navigates to `/explore?tab=rooms` | Auth credential | `SEEKER_A` | None | `request.auth != null` |
| Auth: Role Routing | Login route handler | 2. Owner logs in | Navigates directly to `/owner-dashboard` | Owner profile in Firestore | `OWNER_A` | None | Role check in `App.tsx` |
| Auth: Incomplete User | Login route handler | 3. User with incomplete onboarding logs in | Intercepted and routed to `/role-select` | User with `onboardingComplete: false` | `ONBOARDING_PENDING` | None | `OnboardingGuard` |
| Auth: Suspended Account | Route guards | 4. Suspended user attempts access | Renders `BlockedAccountScreen` with restriction notice | User with `status: 'suspended'` | `SUSPENDED_USER` | None | `isActiveUser()` |
| Auth: Logout | Header avatar, Logout button | 5. Authenticated user clicks Logout | Storage cleared, auth state invalidated, redirected to `/` | Valid storageState | `SEEKER_A` | Local cache purged | Session destroyed |

---

### FEATURE 2: Role Selection & Onboarding
- **Route:** `/role-select`, `/onboarding/seeker`, `/onboarding/owner`
- **Components:** `RoleSelect.tsx`, `SeekerOnboarding.tsx`, `OwnerOnboarding.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Role Select: Choice | Seeker card button, Owner card button | 1. User clicks "I am looking for a room" | Selected role set in Firestore, navigated to `/onboarding/seeker` | Incomplete user doc | `ONBOARDING_PENDING` | `users/{uid}.role = 'seeker'` | `request.auth.uid == uid` |
| Seeker Quiz | Budget slider, Locality pills, Habit radio buttons | 2. Seeker fills quiz & submits | `onboardingComplete` becomes `true`, navigated to `/explore` | User in role 'seeker' | `ONBOARDING_PENDING` | `onboardingComplete = true`, `quizAnswers` saved | `request.auth.uid == uid` |
| Completed User Guard | Route guard | 3. Fully onboarded user opens `/role-select` | Bounced back to active dashboard | Onboarded user | `SEEKER_A` | None | Client guard prevents double onboarding |

---

### FEATURE 3: Explore — Rooms & Listings Discovery
- **Route:** `/explore?tab=rooms`
- **Components:** `ExplorePage.tsx`, `BrowseRooms.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Search: Locality | Search bar input | 1. User searches "Koramangala" | Grid filters to Koramangala listings | Active listings in Koramangala | `SEEKER_A` | None | `resource.data.status == 'active'` |
| Filter: Budget | Budget min/max inputs | 2. Filter rent <= 15000 | Only listings with partner share <= 15000 displayed | Range of listings | `SEEKER_A` | None | Public read for active listings |
| Filter: Verification | "Verified Only" toggle | 3. Toggle verified filter | Unverified listings excluded from grid | Verified & unverified listings | `SEEKER_A` | None | `resource.data.ownerVerified == true` |
| Sort: Price | Sort dropdown (Low to High) | 4. Select price low to high | Listings ordered ascending by rent | Multiple listings | `SEEKER_A` | None | Client sort |
| Lifecycle Filter | Grid render | 5. Paused / Filled / Draft listings hidden | Inactive states never leak to explore feed | Paused, filled, draft listings | `SEEKER_A` | None | `status == 'active'` rule enforced |

---

### FEATURE 4: Explore — Roommate Compatibility
- **Route:** `/explore?tab=roommates`
- **Components:** `ExplorePage.tsx`, `BrowseSeekers.tsx`, `matchQuality.ts`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Match Score | Compatibility badge on seeker cards | 1. Seeker views candidate cards | Match percentage calculated from quiz answers | Seeker profiles with quiz answers | `SEEKER_A` | None | Public read on active profiles |
| Cleanliness / Habits | Habit tag chips (Veg, Non-smoker) | 2. Filter by food preference (Veg) | Non-vegetarian candidates filtered out | Diverse seeker profiles | `SEEKER_A` | None | Client filter |
| Self-Exclusion | Seeker grid | 3. User browses roommates | Own profile excluded from match grid | Active user profile | `SEEKER_A` | None | Filter `u.uid !== currentUserId` |

---

### FEATURE 5: Listing Details & Actions
- **Route:** `/room/:id`
- **Components:** `RoomDetail.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Listing Render | Image gallery, Amenities list, Pricing box | 1. Open active listing | All details match Firestore document | Active listing document | `SEEKER_A` | None | Read active listing |
| Send Interest | "Send Interest" / "Connect" button | 2. Eligible seeker clicks Send Interest | Button updates to "Request Sent", connection created | Active listing, no prior connection | `SEEKER_A` | Document added to `connections` | `request.auth.uid == fromUserId` |
| Quota Exceeded | Connect button | 3. Free user with 5 used connects clicks | Error modal / upgrade prompt, request blocked | User with `connectsUsed: 5` | `QUOTA_FULL_USER` | None | Client & rule quota gate |
| Self-Listing Lock | Action CTA | 4. Owner views own listing | "Edit Listing" button shown instead of "Send Interest" | Owner's own listing | `OWNER_A` | None | `currentUserId == ownerId` check |

---

### FEATURE 6: Flatmate Details & Compatibility Breakdown
- **Route:** `/match/:id`
- **Components:** `MatchDetail.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Quiz Comparison | Radar/Comparison indicators | 1. View match breakdown | Highlights matching & differing lifestyle preferences | Compatible seeker | `SEEKER_A` | None | Read profile |
| Send Flatmate Request | "Connect as Flatmate" button | 2. Send request to peer seeker | Request sent state, connection created | Peer seeker | `SEEKER_A` | Document in `connections` | `request.auth.uid == fromUserId` |

---

### FEATURE 7: Connections Management
- **Route:** `/explore?tab=connections`
- **Components:** `ExplorePage.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Sent Requests | "Sent Requests" sub-tab | 1. View outgoing connections | Lists pending and accepted requests sent by user | Seeded connection `test_conn_p01` | `SEEKER_A` | None | `fromUserId == request.auth.uid` |
| Received Requests | "Received" sub-tab | 2. Owner views incoming requests | Lists requests received with Seeker profiles | Connection where `toUserId == OWNER_A` | `OWNER_A` | None | `toUserId == request.auth.uid` |
| Accept Connection | "Accept" button | 3. Owner accepts pending request | Status changes to `accepted`, "Start Chat" enabled | Pending connection | `OWNER_A` | `connections/{id}.status = 'accepted'` | `request.auth.uid == toUserId` |
| Reject Connection | "Decline" button | 4. Owner rejects request | Status changes to `rejected` | Pending connection | `OWNER_A` | `connections/{id}.status = 'rejected'` | `request.auth.uid == toUserId` |

---

### FEATURE 8: Owner Dashboard & Listings Management
- **Route:** `/owner-dashboard`, `/edit-listing/:id`
- **Components:** `OwnerDashboard.tsx`, `EditListing.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| My Listings Tab | Listings cards grid | 1. Owner views properties | Shows all listings owned by user with status pills | Multiple listings for Owner A | `OWNER_A` | None | `resource.data.ownerId == uid` |
| Pause Listing | Status dropdown / Pause button | 2. Owner pauses active listing | Status pill becomes "Paused", hidden from explore | Active listing | `OWNER_A` | `listings/{id}.status = 'paused'` | `ownerId == request.auth.uid` |
| Edit Listing Price | Price input, Save button | 3. Owner updates partner share | New price reflected immediately in UI and DB | Editable listing | `OWNER_A` | `listings/{id}.partnerShare = newPrice` | `ownerId == request.auth.uid` |
| Applicants Tab | Applicants comparison table | 4. Owner reviews applicant profiles | Shows quiz match score, budget, message | Accepted/pending connections | `OWNER_A` | None | `toUserId == request.auth.uid` |

---

### FEATURE 9: Direct Messaging / Chat
- **Route:** `/chat`, `/chat/:roomId`
- **Components:** `ChatPage.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Chat Conversations | Conversation sidebar list | 1. Open chat hub | Displays accepted connection rooms with last message | Active chat room `test_chat_crm_01` | `SEEKER_B` | None | `request.auth.uid in participants` |
| Send Message | Text input, Send button | 2. Participant sends message | Message appears in thread and added to subcollection | Active room | `SEEKER_B` | New doc in `chatRooms/{id}/messages` | `senderId == request.auth.uid` |
| Real-time Updates | Thread view | 3. Incoming message received | Thread updates automatically via onSnapshot | Chat room with messages | `OWNER_A` | Read status updated | `request.auth.uid in participants` |
| Unauthorized Access | Route access `/chat/unauthorized` | 4. Third-party accesses private chat | Access denied / redirected | Private room | `SEEKER_A` | None | `request.auth.uid in participants` rule |

---

### FEATURE 10: Profile & Preferences Management
- **Route:** `/profile`, `/edit-profile`
- **Components:** `ProfilePage.tsx`, `EditProfile.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| View Profile | Profile card, Badges, Bio | 1. View own profile | Name, role, verification badge, quiz answers displayed | Seeded profile | `SEEKER_A` | None | Read profile |
| Edit Bio | Bio textarea, Save Changes | 2. Update bio text | Bio updated in UI and persisted in Firestore | Seeded profile | `SEEKER_A` | `users/{uid}.bio = newBio` | `request.auth.uid == uid` |
| Verification Tab | Document upload form | 3. Owner submits electric bill | Verification state changes to SUBMITTED | Unverified owner | `OWNER_B` | Doc created in `ownerVerifications` | `request.auth.uid == uid` |

---

### FEATURE 11: Moderation & Abuse Reporting
- **Route:** Modal across `/room/:id`, `/match/:id`
- **Components:** `ReportModal.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Flag Listing | "Report this listing" button | 1. Seeker submits spam report | Report dialog confirms submission | Active listing | `SEEKER_A` | New doc created in `reports` | `reporterId == request.auth.uid` |
| Flag User | "Report profile" button | 2. User reports harassment | Report stored with open status | Peer user | `SEEKER_B` | New doc created in `reports` | `reporterId == request.auth.uid` |

---

### FEATURE 12: Admin Control Center
- **Route:** `/admin`, `/admin/users`, `/admin/listings`, `/admin/verifications`, `/admin/reports`
- **Components:** `AdminLayout.tsx`, `AdminDashboard.tsx`, `AdminVerifications.tsx`, `AdminUsers.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Non-Admin Rejection | Route guard | 1. Seeker opens `/admin` | Redirected away to `/dashboard` | Seeker session | `SEEKER_A` | None | Admin email gate |
| Approve Verification | "Approve" button | 2. Admin approves owner document | Verification status APPROVED, owner badge set | Submitted verification | `ADMIN` | `ownerVerifications` APPROVED, user verified | `isAdmin()` |
| Suspend User | "Suspend" action | 3. Admin suspends violator | User status set to `suspended`, user quarantined | Target user | `ADMIN` | `users/{uid}.status = 'suspended'` | `isAdmin()` |
| Resolve Report | "Mark Resolved" button | 4. Admin resolves abuse report | Report status becomes `resolved` | Open report | `ADMIN` | `reports/{id}.status = 'resolved'` | `isAdmin()` |

---

### FEATURE 13: Notifications Feed & Activity Alerts
- **Route:** `/notifications`
- **Components:** `NotificationsPage.tsx`, `useNotifications.ts`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Notification List | Activity list items, Unread badge | 1. View notification feed | Seeded alerts and system notices render | Seeded notifications | `SEEKER_A` | None | `recipientId == request.auth.uid` |
| Filter Tabs | "All" tab, "Unread" tab | 2. Switch to Unread tab | Unread activity filtered with empty state or item list | Seeded notifications | `SEEKER_A` | None | Client-side filter |
| Mark Read / Clear | Clear/Mark read action buttons | 3. Toggle read status | Notifications marked as read, badge updates | Unread notifications | `SEEKER_A` | `read: true` update | `recipientId == request.auth.uid` |

---

### FEATURE 14: Settings & Account Management
- **Route:** `/settings`
- **Components:** `SettingsPage.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Account Identity | Name, email display, role badge | 1. Open settings hub | User identity and account details accurately shown | Seeded profile | `SEEKER_A` | None | User profile read |
| Settings Tabs | Account, Privacy, Notifications, Appearance tabs | 2. Switch settings categories | Sub-panel switches smoothly without errors | Seeded profile | `SEEKER_A` | None | Client tab state |
| Preferences Toggles | Push alerts, privacy toggles | 3. Flip privacy or notification switch | State toggles interactively | Seeded profile | `SEEKER_A` | UI state toggled | User profile update |

---

### FEATURE 15: Plans & Pricing
- **Route:** `/pricing`
- **Components:** `PricingPage.tsx`

| FEATURE | ELEMENTS | SCENARIOS | EXPECTED RESULT | REQUIRED SEED DATA | REQUIRED PERSONA | BACKEND STATE CHANGE | SECURITY RULE |
|---|---|---|---|---|---|---|---|
| Pricing Cards | Free, Basic, Pro tier cards | 1. Inspect pricing plans | Tier cards, feature lists, pricing figures render | None | `SEEKER_A` | None | Public read |
| Billing Interval | Monthly vs. Annual toggle | 2. Toggle annual billing | Price updates with annual discounted rate | None | `SEEKER_A` | None | Client state toggle |
| FAQ Accordion | FAQ question headers and body | 3. Expand FAQ question | FAQ details expand and collapse smoothly | None | `SEEKER_A` | None | Accordion expansion |

