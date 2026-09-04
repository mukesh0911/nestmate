# NESTMATE — MACHINE-READABLE E2E FEATURE REGISTRY

**Scope**: Complete Platform Screen, Action, Mutation, and Rule Topology  
**Repository**: NestMate Core Web Platform (`d:\roomate\app`)  
**Authority**: Live Source Code Inspection

---

## 1. PUBLIC DISCOVERY & GUEST FEATURES

| Feature ID | Screen / Component | User Role | Inputs | Expected Output | Firestore / Storage | Security Rules | Downstream Dependencies |
|---|---|---|---|---|---|---|---|
| `PUB-001` | `LandingPage.tsx` | Guest | Search area string, City dropdown | Navigates to `/explore?tab=rooms` with pre-filled filters | None | Public | `PUB-002`, `PUB-003` |
| `PUB-002` | `ExplorePage.tsx` (`BrowseRooms.tsx`) | Guest / Seeker | City, locality search, budget slider, amenities checkboxes | Filtered list of active listings matching criteria | `listings` (read) | `allow read: if true;` | `PUB-004`, `PUB-006` |
| `PUB-003` | `ExplorePage.tsx` (`BrowseSeekers.tsx`) | Guest / Owner | City filter, locality search, gender/profession filter | Filtered list of discoverable seeker profiles | `users` (read sanitized) | `allow read: if true;` (PII stripped) | `PUB-005` |
| `PUB-004` | `RoomDetail.tsx` | Guest / Seeker | Listing ID in URL parameter | Full listing detail, photo gallery, rent/deposit split, amenities, owner trust card | `listings/{id}`, `users/{ownerId}` | `allow read: if true;` | `CONN-001` |
| `PUB-005` | `MatchDetail.tsx` | Guest / Seeker / Owner | User UID in URL parameter | Lifestyle quiz comparison, verified badges, vouch reviews | `users/{uid}`, `reviews` | Public user profile read | `CONN-001`, `REV-001` |
| `PUB-006` | `MapView.tsx` | Guest / Seeker | City dropdown, map pan/zoom | Interactive Leaflet pins with pricing popups | `listings`, `locationResolver.ts` | Public read | `PUB-004` |

---

## 2. AUTHENTICATION & ONBOARDING

| Feature ID | Screen / Component | User Role | Inputs | Expected Output | Firestore / Storage | Security Rules | Downstream Dependencies |
|---|---|---|---|---|---|---|---|
| `AUTH-001` | `AuthPage.tsx` | Guest | Email, Password | Authenticated session, onSnapshot listener | Firebase Auth, `users/{uid}` | Firebase Auth verification | `ROLE-001`, `DASH-001` |
| `AUTH-002` | `AuthPage.tsx` (Google) | Guest | Google OAuth Popup | Authenticated session, user profile sync | Firebase Auth, `users/{uid}` | Firebase Auth verification | `ROLE-001`, `DASH-001` |
| `AUTH-003` | `PhoneLogin.tsx` & `OTPVerify.tsx` | Guest | Phone Number, 6-digit SMS OTP | Phone authentication, profile hydration | Firebase Auth reCAPTCHA | Firebase Phone Auth | `ROLE-001` |
| `ROLE-001` | `RoleSelect.tsx` | New User | Role choice ('seeker' vs 'owner') | Persists `role` field in `users/{uid}`, routes to onboarding | `users/{uid}.role` | `isOwner(userId)` | `ONB-001`, `ONB-002` |
| `ONB-001` | `SeekerOnboarding.tsx` | Seeker | 10-step wizard: Name, Gender, Age, Profession, City, Area, Budget, Date, 10 Quiz tokens | Sets `onboardingComplete: true`, sets quiz answers, lands on `/dashboard` | `users/{uid}` | `onboardingFlipValid()` | `DASH-001`, `MATCH-001` |
| `ONB-002` | `OwnerOnboarding.tsx` | Owner | Property details, rent, deposit, photos, house rules, 10 Quiz tokens | Creates `listings` doc, sets `onboardingComplete: true`, lands on `/owner-dashboard` | `listings`, `users/{uid}` | `listingStatusValid()` | `DASH-002`, `LIST-001` |

---

## 3. MATCHING & DASHBOARDS

| Feature ID | Screen / Component | User Role | Inputs | Expected Output | Firestore / Storage | Security Rules | Downstream Dependencies |
|---|---|---|---|---|---|---|---|
| `MATCH-001`| `matching.ts` | System | 10 Quiz token answer maps of User A and User B | Exact integer percentage (0-100%) based on string token equality | `users/{uid}.quizAnswers` | Pure computation | `DASH-001`, `DASH-002` |
| `DASH-001`| `SeekerDashboard.tsx` | Seeker | Filter criteria, search string, sort order | Ranked candidate list with Best Match showcase, city scope notice | `users`, `connections` | Public profile reads | `CONN-001`, `PUB-005` |
| `DASH-002`| `OwnerDashboard.tsx` | Owner | Applicant list, availability confirmation | Explainable applicant ranking with match reasons, listing status controls | `listings`, `connections`, `users` | Owner-bound reads | `CONN-002`, `LIST-002` |

---

## 4. CONNECTIONS & REAL-TIME CHAT

| Feature ID | Screen / Component | User Role | Inputs | Expected Output | Firestore / Storage | Security Rules | Downstream Dependencies |
|---|---|---|---|---|---|---|---|
| `CONN-001`| `useConnections.ts` | Seeker / Owner | Target UID, optional Listing ID | Creates `connections` doc (`status: 'pending'`), sends in-app notification | `connections`, `notifications` | Sender bound, no self-connect | `NOTIF-001`, `CONN-002` |
| `CONN-002`| `OwnerDashboard.tsx` / `MatchDetail.tsx` | Recipient | Accept / Reject button click | Updates `connections.status`, creates `chatRooms` doc, sends acceptance notification | `connections`, `chatRooms`, `notifications` | Recipient only can accept/reject | `CHAT-001`, `NOTIF-001` |
| `CHAT-001`| `ChatPage.tsx` | Participant | Room ID, message text input, image file | Real-time message synchronization across participants without refresh | `chatRooms/{id}/messages`, `storage: chats/{id}` | Room participants only | `CHAT-002`, `NOTIF-001` |
| `CHAT-002`| `ChatPage.tsx` (`phoneShare.ts`)| Participant | Share Phone request / Accept | Mutual consent unmasks phone from `privateUserData` | `chatRooms/{id}.phoneSharing`, `privateUserData` | Participant-only consent | None |

---

## 5. PROFILE, SETTINGS & TRUST

| Feature ID | Screen / Component | User Role | Inputs | Expected Output | Firestore / Storage | Security Rules | Downstream Dependencies |
|---|---|---|---|---|---|---|---|
| `PROF-001`| `ProfilePage.tsx` | Authenticated | View own profile | Trust badge (Level 0-3), completeness widget, role switch CTA | `users/{uid}`, `reviews` | `isOwner(userId)` | `PROF-002`, `SETT-001` |
| `PROF-002`| `EditProfile.tsx` | Authenticated | Bio, socials, lifestyle quiz retake, verification document upload | Persists fields in `users/{uid}`, uploads ID to `verifications/{uid}` in Storage | `users/{uid}`, `verifications`, Storage | `trustFieldsUnchanged()` | `PROF-001`, `ADM-002` |
| `SETT-001`| `SettingsPage.tsx` | Authenticated | Dark mode toggle, privacy switches, data export JSON | Toggles CSS class, updates settings map, downloads GDPR export | `users/{uid}.settings` | `isOwner(userId)` | None |
| `SETT-002`| `SettingsPage.tsx` | Authenticated | Confirm text "DELETE" | Cascading deletion of listings, connections, notifications, chat rooms, and auth | Multi-collection delete | Owner deletion allowed | None |
| `REV-001` | `useReviews.ts` | Authenticated | Target UID, rating (1-5), text review | Creates `reviews` record, updates recipient's average rating | `reviews` | Caller bound, no self-reviews | `PROF-001`, `PUB-005` |

---

## 6. ADMIN PORTAL

| Feature ID | Screen / Component | User Role | Inputs | Expected Output | Firestore / Storage | Security Rules | Downstream Dependencies |
|---|---|---|---|---|---|---|---|
| `ADM-001` | `AdminLayout.tsx` | Admin | Token email verification | Verified access to admin panel | `admins/{lowercased_email}` | `isAdmin()` rule | `ADM-002`, `ADM-003` |
| `ADM-002` | `AdminVerifications.tsx` | Admin | Approve / Reject document | Updates user verification level (Level 2/3), dispatches status alert | `verifications`, `users/{uid}` | `isAdmin()` rule | `PROF-001` |
| `ADM-003` | `AdminUsers.tsx` | Admin | Suspend / Ban / Reinstate user | Updates user status to `suspended`/`banned`, blocking app access | `users/{uid}.status` | `isAdmin()` rule | `App.tsx` BlockedScreen |
