# NestMate — Feature Inventory
_Classification: REACHABLE | CONDITIONALLY REACHABLE | IN CODE ONLY | UNCERTAIN_

---

## FEATURE SET 1: Authentication

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Google Sign-In | REACHABLE | signInWithPopup, GoogleAuthProvider |
| Email + Password Sign-In | REACHABLE | signInWithEmailAndPassword |
| Email + Password Sign-Up | REACHABLE | createUserWithEmailAndPassword |
| Password Reset Email | REACHABLE | sendPasswordResetEmail |
| Phone OTP Sign-In | REACHABLE | signInWithPhoneNumber + RecaptchaVerifier |
| Phone Number Linking | IN CODE | linkWithCredential -- UI flow unclear |
| Sign Out | REACHABLE | Available from all authenticated pages |
| Account Blocked Screen | CONDITIONALLY REACHABLE | Shown when user status=suspended/banned |

---

## FEATURE SET 2: Onboarding

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Role Selection | REACHABLE (auth required) | seeker or owner |
| Seeker Multi-Step Onboarding | REACHABLE (auth required) | 55KB file, requires 5+ quiz answers |
| Owner Multi-Step Onboarding | REACHABLE (auth required) | 52KB file, requires city |
| Profile Photo Upload | REACHABLE (during onboarding) | Firebase Storage |
| Lifestyle Quiz | REACHABLE | Part of seeker onboarding |

---

## FEATURE SET 3: Room Discovery (Seeker Primary Flow)

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Browse Listings (ExplorePage, tab=rooms) | REACHABLE (public) | No auth required |
| Room Listing Detail | REACHABLE (public) | /room/:id |
| Listing View Count Increment | REACHABLE (anyone) | Firestore rules allow anonymous increment |
| Room Filters (city, rent, flat type, gender) | REACHABLE (public) | Client-side via listingFilters.ts |
| Advanced Filters Modal | REACHABLE | AdvancedFiltersModal.tsx |
| Map View | REACHABLE | MapView.tsx and MapPreview.tsx |
| Compatibility Score Display | CONDITIONALLY REACHABLE | Requires auth + logged-in seeker profile |
| Save Room (savedRoomIds) | CONDITIONALLY REACHABLE | Requires auth |
| Send Interest / Connect (from room) | CONDITIONALLY REACHABLE | Requires onboarded seeker |
| Screening Questionnaire (before connecting) | CONDITIONALLY REACHABLE | If owner configured questions |

---

## FEATURE SET 4: Seeker Discovery (Owner Primary Flow)

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Browse Seeker Profiles (ExplorePage, tab=roommates) | REACHABLE (public) | |
| Flatmate/Seeker Profile Detail | REACHABLE (public) | /match/:id |
| Compatibility Score for Seeker | CONDITIONALLY REACHABLE | Requires onboarded user |
| Save Seeker Profile (savedProfileIds) | CONDITIONALLY REACHABLE | Requires auth |
| Skip Seeker | CONDITIONALLY REACHABLE | Adds to skippedUserIds |
| Send Connect Interest | CONDITIONALLY REACHABLE | Requires onboarded owner |

---

## FEATURE SET 5: Connections and Matching

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Send Connection Request | REACHABLE (onboarded) | Rate-limited by FREE_CONNECT_LIMIT |
| Accept Connection Request | REACHABLE (recipient only) | Creates acceptedPairs entries |
| Reject Connection Request | REACHABLE (recipient only) | |
| Block User | REACHABLE | Either participant |
| Withdraw Request | REACHABLE (sender) | Delete connection |
| View Connections Tab | CONDITIONALLY REACHABLE | Requires auth, in /explore?tab=connections |
| Real-time Connection Updates | REACHABLE | subscribeToMyConnections (dual listener) |
| Monthly Connect Limit Enforcement | CONDITIONALLY REACHABLE | Client-side only guard |

---

## FEATURE SET 6: Chat / Messaging

| Feature | Reachability | Notes |
|---------|-------------|-------|
| View Chat List | REACHABLE (onboarded) | /chat |
| Open Specific Chat Room | REACHABLE (onboarded) | /chat/:roomId |
| Send Text Message | REACHABLE (onboarded, participant) | |
| Mark Messages as Read | REACHABLE | |
| Edit Own Message | REACHABLE | Sender can edit own message |
| Share WhatsApp Contact | CONDITIONALLY REACHABLE | Only after connection accepted, from userContacts |
| Real-time Chat | REACHABLE | Firestore onSnapshot |

---

## FEATURE SET 7: Owner Dashboard

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Listings Tab | REACHABLE (owner) | /owner-dashboard?tab=listings |
| Applicants Tab | REACHABLE (owner) | /owner-dashboard?tab=applicants |
| Seekers Browse Tab | REACHABLE (owner) | /owner-dashboard?tab=seekers |
| Analytics Tab | UNCERTAIN | Mentioned in discovery, needs verification |
| Create New Listing | REACHABLE (owner) | /edit-listing/new or /create-listing redirect |
| Edit Existing Listing | REACHABLE (owner) | /edit-listing/:id |
| Pause / Close Listing | REACHABLE (owner) | Status change (paused, closed, filled) |
| Confirm Availability | REACHABLE (owner) | Sets lastConfirmedAt |
| Accept/Reject Applicant | REACHABLE (owner) | From connections |
| Applicant Screening Answers | CONDITIONALLY REACHABLE | If seeker answered screening questions |
| Applicant Compare | REACHABLE (owner) | /applicants/compare |

---

## FEATURE SET 8: Profile and Settings

| Feature | Reachability | Notes |
|---------|-------------|-------|
| View Own Profile | REACHABLE (onboarded) | /profile |
| Public Profile Preview | REACHABLE (onboarded) | /profile/preview |
| Edit Profile | REACHABLE (onboarded) | /edit-profile |
| Upload Profile Photo | REACHABLE | Firebase Storage |
| Add Social Links | REACHABLE | linkedin, instagram |
| Edit Lifestyle Quiz Answers | REACHABLE | Part of edit profile |
| Matching Preferences | REACHABLE (seeker only) | /preferences |
| Settings Page | REACHABLE (onboarded) | /settings |
| Dark Mode Toggle | REACHABLE | settings.darkMode in Firestore |
| Notifications Page | REACHABLE (onboarded) | /notifications |

---

## FEATURE SET 9: Verification and Trust

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Aadhaar Verification Modal | IN CODE | AadhaarVerifyModal.tsx (integration unclear) |
| DigiLocker Modal | IN CODE | DigiLockerModal.tsx (integration unclear) |
| Work Email Verification | CONDITIONALLY REACHABLE | Via edit profile |
| Owner Identity Verification Submission | REACHABLE (owner) | ownerVerifications collection |
| Owner Verification Status Display | REACHABLE | OwnerVerificationGate.tsx |
| Trust Badge Display | REACHABLE | TrustBadge.tsx component |
| Admin Approval of Owner | REACHABLE (admin) | /admin/verifications |

---

## FEATURE SET 10: Reviews and Vouches

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Write Review/Vouch | REACHABLE (authenticated) | Rating 1-5, optional text |
| View Reviews | REACHABLE (authenticated) | reviews collection |
| Edit Own Review | REACHABLE | By reviewer |
| Delete Own Review | REACHABLE | By reviewer |

---

## FEATURE SET 11: Reporting and Safety

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Report User/Listing | REACHABLE (active users) | Cannot self-report |
| Safety Center Page | REACHABLE (public) | /safety |
| Trust Center Page | REACHABLE (public) | /trust |
| Help and Support Page | REACHABLE (public) | /help |

---

## FEATURE SET 12: Admin Panel

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Admin Dashboard | REACHABLE (admin) | /admin -- metrics overview |
| User Management | REACHABLE (admin) | /admin/users -- suspend, ban, edit |
| Listings Management | REACHABLE (admin) | /admin/listings -- verify/approve listings |
| Owner Verifications | REACHABLE (admin) | /admin/verifications -- approve/reject docs |
| Reports Review | REACHABLE (admin) | /admin/reports |
| Admin Notifications | REACHABLE (admin) | /admin/notifications |
| Marketplace Management | REACHABLE (admin) | /admin/marketplace |
| Admin Settings | REACHABLE (admin) | /admin/settings |
| Nuclear Database Wipe | IN CODE | wipeEntireDatabase() in useAdmin.ts |
| Seed Demo Data | IN CODE | cleanDemoAndSeedData() in useAdmin.ts |

---

## FEATURE SET 13: Informational Pages

| Feature | Reachability | Notes |
|---------|-------------|-------|
| How It Works | REACHABLE (public) | /how-it-works |
| About Us | REACHABLE (public) | /about |
| Privacy Policy | REACHABLE (public) | /privacy |
| Terms of Service | REACHABLE (public) | /terms (uses PrivacyPolicy component) |
| Pricing / Plans | REACHABLE (public) | /pricing |

---

## FEATURE SET 14: Analytics and Tracking

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Active Status Tracking | REACHABLE (authenticated) | useActiveTracking hook updates lastActiveAt |
| Listing View Analytics | REACHABLE (anyone) | listingViews collection |
| Analytics Event Logging | REACHABLE (active users) | 12 whitelisted events |
| Performance Tracing | IN CODE | lib/perfTrace.ts |
| Push Notifications | UNCERTAIN | usePushNotifications.ts exists, integration depth unknown |

---

## FEATURE SET 15: Maps and Location

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Location Autocomplete | REACHABLE | LocationAutocomplete.tsx -- Google Places API |
| Map Preview (listing/profile) | REACHABLE | MapPreview.tsx |
| Full Map View | CONDITIONALLY REACHABLE | MapView.tsx -- requires active listings with coordinates |
| Geocoding | REACHABLE | useGeocoding.ts -- converts addresses to lat/lng |

---

## FEATURE SET 16: Developer / Utility

| Feature | Reachability | Notes |
|---------|-------------|-------|
| Seed Data Page | DEV ONLY | /dev/seed, only in import.meta.env.DEV builds |
| 25+ Unit Tests | IN CODE | lib/*.test.ts, run with Vitest |
| Admin Redirect Watcher | REACHABLE | AdminRedirectWatcher intercepts /path/admin URLs |
