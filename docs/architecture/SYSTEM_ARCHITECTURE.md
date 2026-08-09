# NestMate - System Architecture
> Version: 1.0.0-rc1 | Date: 2026-08-04

---

## Overview

NestMate is a fully client-side Firebase SPA (Single-Page Application) for roommate matching in India. There is no traditional backend server. All business logic runs in the browser, all data lives in Firebase services.

```
Browser (React SPA)
       |
       v
Firebase SDK (firebase@12.x)
  |-- Firebase Auth (Email/Password, Google OAuth)
  |-- Cloud Firestore (database)
  |-- Firebase Storage (images, documents)
       |
       v
Firebase Hosting (CDN delivery of dist/)
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.x |
| Language | TypeScript | 5.9.x |
| Build tool | Vite | 7.x |
| Routing | react-router-dom | 7.x |
| State (global) | Zustand | 5.x |
| UI components | shadcn/ui (Radix) | latest |
| Styling | Tailwind CSS | 3.x |
| Maps | Leaflet + react-leaflet | 1.9.x + 5.x |
| Geocoding | Nominatim (OpenStreetMap) | Free, no key |
| Database | Cloud Firestore | Firebase SDK |
| Auth | Firebase Authentication | Firebase SDK |
| File storage | Firebase Storage | Firebase SDK |
| Charts | Recharts | 2.x |
| Forms | React Hook Form + Zod | 7.x + 4.x |
| Toasts | Sonner | 2.x |
| Testing | Vitest | 4.x |
| Linting | ESLint 9 + typescript-eslint | latest |
| Formatting | Prettier | 3.x |
| Deployment | Firebase Hosting | latest |

---

## Application Entry Points

```
index.html
  -> main.tsx (React root, BrowserRouter)
     -> App.tsx (AppRoutes, auth state, lazy routes)
        -> Pages (code-split lazy chunks)
```

---

## Code Splitting Strategy

All pages are lazy-loaded via React.lazy() + Suspense. Vendor chunks split in vite.config.ts:

| Chunk | Contents |
|-------|---------|
| vendor-firebase | firebase/app, firebase/auth, firebase/firestore, firebase/storage |
| vendor-react | react, react-dom, react-router-dom |
| vendor-charts | recharts |
| vendor-map | leaflet, react-leaflet |

---

## Authentication Flow

```
User visits /login
  -> AuthPage.tsx (Email/Password or Google)
  -> useAuth.ts -> Firebase Auth
  -> onAuthStateChanged in App.tsx -> sets authState
  -> OnboardingGuard checks role + onboardingComplete
  -> Redirect to /dashboard or /owner-dashboard
```

### PII Isolation Architecture

Contact PII (phone, email, workEmail) is NEVER stored in the public `users/{uid}` document.

```
users/{uid}           (publicly readable)
  - name, age, gender, role, city, localities
  - isVerified, isPremium, verificationLevel
  - quizAnswers, avatar, bio, profession
  - savedProfileIds, savedRoomIds, blockedUserIds

privateUserData/{uid}  (owner or admin only)
  - phone
  - email
  - workEmail
```

Migration: hydrateOwnProfile() detects legacy PII on public docs and migrates it on login.

---

## State Management

| State | Location | Mechanism |
|-------|---------|-----------|
| Auth user + Firebase token | App.tsx | onAuthStateChanged listener |
| User profile + private data | useAuth.ts | useState + Firestore read |
| Global UI state | useStore.ts | Zustand |
| Listings | useListings.ts | useState + Firestore getDocs |
| Matches/feed | useMatches.ts | useState + Firestore getDocs |
| Chat rooms | useChat.ts | onSnapshot subscription |
| Notifications | useNotifications.ts | onSnapshot subscription |
| Connections | useConnections.ts | Firestore getDocs |

---

## Routing Architecture

### Public Routes (no auth)
- / (LandingPage)
- /browse-rooms (BrowseDashboard)
- /browse-seekers (BrowseSeekers)
- /room/:id (RoomDetail)
- /match/:id (MatchDetail)
- /map (MapView)
- /how-it-works, /pricing, /about, /privacy, /terms

### Auth Routes (redirect to dashboard if logged in)
- /login (AuthPage)
- /phone-login (PhoneLogin)
- /verify-otp (OTPVerify)

### Protected Routes (PrivateRoute guard)
- /role-select, /onboarding/seeker, /onboarding/owner
- /dashboard (seeker only - OnboardingGuard + role check)
- /owner-dashboard (owner only - OnboardingGuard + role check)
- /chat, /chat/:roomId
- /profile, /edit-profile
- /settings, /notifications
- /edit-listing/:id

### Admin Routes (/admin/*)
- AdminLayout (separate layout, no auth guard - relies on useAdmin hook check)
- /admin, /admin/users, /admin/listings, /admin/reports
- /admin/verifications, /admin/notifications, /admin/settings

### Dev Routes (unguarded - KI-08)
- /dev/seed (SeedData.tsx)

---

## Security Model

### Firestore Rules Summary
- users: public read; owner write (no trust field changes); admin unrestricted
- privateUserData: owner or admin only
- listings: public read; auth create; owner or admin update/delete
- connections: participants or admin read/write
- chatRooms + messages: participants or admin
- notifications: recipient or admin read/update/delete
- verifications: submitter read; admin update/delete
- reports: any auth create; admin manage
- ratings/reviews: any auth read; any auth create
- agreements/agreementOTPs: participants or admin

### Admin Authentication
- Firestore rule: email matches .*@nestmate.com$ domain
- App-level: useAdmin checks hardcoded emails + admins collection + config/admin.adminEmails

### Trust Fields (isVerified, isPremium, etc.)
- Cannot be set by users via Firestore rules (trustFieldsUnchanged + trustFieldsSafeOnCreate)
- Only admins can update via useAdmin.approveVerification()

---

## Firestore Collections

| Collection | Purpose |
|-----------|---------|
| users | Public profiles |
| privateUserData | PII (phone, email) |
| listings | Room listings |
| connections | Match/connection requests |
| chatRooms | Chat metadata + phone sharing |
| chatRooms/{id}/messages | Chat messages |
| notifications | In-app notifications |
| verifications | ID verification submissions |
| reports | User reports |
| reviews | User reviews/vouches |
| ratings | Numeric ratings |
| skippedUsers | Legacy skip tracking |
| listingViews | Daily listing analytics |
| agreements | Rent agreements |
| agreementOTPs | OTP tokens for agreements |
| emailOTPs | Email verification OTPs |
| admins | Admin user records |
| config/admin | Admin email list config |

---

## Firebase Storage Structure

```
profiles/{userId}/avatar.{ext}     - Profile pictures
listings/{listingId}/image_{n}.{ext} - Listing photos
chats/{roomId}/{timestamp}_{random}.{ext} - Chat images
agreements/{agreementId}/**        - Agreement documents (20MB limit)
```

---

## Build and Deployment

```
npm run build
  -> Vite bundles to dist/
  -> Firebase Hosting serves dist/
  -> All routes -> /index.html (SPA rewrite)

npm run deploy
  -> npm run build && firebase deploy --only hosting

npm run deploy:all
  -> npm run build && firebase deploy (hosting + rules + indexes)
```

---

## Hooks Architecture

```
useAuth.ts          - Firebase Auth + profile lifecycle (637 lines)
useMatches.ts       - Match feed + compatibility scoring
useListings.ts      - Listing CRUD + analytics
useChat.ts          - Chat rooms + messages + phone sharing
useConnections.ts   - Connect requests + blocking
useNotifications.ts - In-app notifications
usePushNotifications.ts - Web Push + SW registration
useUserProfile.ts   - Profile CRUD + save/block/report
useAdmin.ts         - Admin panel data + actions
useStorage.ts       - Firebase Storage uploads
useGeocoding.ts     - Nominatim geocoding with rate limiting
useReviews.ts       - User reviews/vouches
useTranslation.ts   - Simple key-based i18n (EN/HI/TA/TE)
useActiveTracking.ts - lastActiveAt ping (5-min throttle)
use-mobile.ts       - Responsive breakpoint hook
```

---

## Testing

```
src/lib/compatibility.test.ts   - calculateCompatibility() unit tests
src/lib/connectionGuards.test.ts - canSendConnect(), countConnectionsSince() tests
src/lib/phoneShare.test.ts      - assignSharedPhones() unit tests
src/lib/sanitizeProfile.test.ts - sanitizePublicProfile() unit tests
```

Run: `npm test` (vitest run)

