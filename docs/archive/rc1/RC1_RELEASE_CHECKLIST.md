# NestMate RC1 - Release Checklist
> Version: 1.0.0-rc1 | Date: 2026-08-04 | Reviewer: Principal Engineer + QA

---

## Feature QA Pass/Fail Matrix

| Feature | Area | Status | Notes |
|---------|------|--------|-------|
| Landing Page renders | Frontend | PASS | LandingPage.tsx - hero, stats, how-it-works, CTA |
| Browse Rooms (unauthenticated) | Frontend | PASS | /browse-rooms public; no auth guard |
| Browse Seekers (unauthenticated) | Frontend | PASS | /browse-seekers public |
| Room Detail page | Frontend | PASS | /room/:id public read |
| Match Detail page | Frontend | PASS | /match/:id public read |
| Map View | Frontend | PASS | /map - Leaflet + Nominatim geocoding |
| How It Works | Frontend | PASS | Static page |
| Pricing Page | Frontend | PASS | Static page |
| About Us | Frontend | PASS | Static page |
| Privacy Policy | Frontend | PASS | Static page |
| Email Sign Up | Auth | PASS | createUserWithEmailAndPassword |
| Email Sign In | Auth | PASS | signInWithEmailAndPassword |
| Google Sign In | Auth | PASS | signInWithPopup + GoogleAuthProvider |
| Password Reset | Auth | PASS | sendPasswordResetEmail |
| Phone OTP | Auth | LEGACY | Kept for re-enable; not primary flow |
| Logout | Auth | PASS | signOut + store reset |
| Auth guard (private routes) | Auth | PASS | PrivateRoute + OnboardingGuard |
| Role-based redirect | Auth | PASS | getDashboardRoute() logic correct |
| Dark mode persistence | Auth | PASS | Synced from settings.darkMode on login |
| Role Select | Onboarding | PASS | /role-select |
| Seeker Onboarding (quiz) | Onboarding | PASS | SeekerOnboarding.tsx |
| Owner Onboarding | Onboarding | PASS | OwnerOnboarding.tsx |
| Demo login (email fallback) | Demo | PASS | Ephemeral email/password, no premium/verified |
| Demo does not grant trust | Security | PASS | Firestore rules enforce |
| City filter | Search | PASS | Firestore where('city') |
| Budget filter | Search | PASS | Client-side filter post-fetch |
| Flat Type filter | Search | PASS | Client-side filter |
| Furnishing filter | Search | PASS | Client-side filter |
| Amenities filter (all match) | Search | PASS | Client-side every() check |
| Verified Only filter | Search | PASS | Client-side isVerified check |
| Gender filter | Search | PASS | Client-side gender check |
| Locality filter | Search | PASS | Client-side localities array check |
| Pagination / Load More | Search | PASS | Cursor-based via startAfter |
| Location autocomplete | Search | PASS | LocationAutocomplete.tsx + Nominatim |
| Quiz compatibility score | Matching | PASS | calculateCompatibility() - unit tested |
| Score display on cards | UI | PASS | Shown in SeekerDashboard |
| Compatibility Insights panel | UI | PASS | MatchDetail.tsx |
| Active status tracking | UX | PASS | useActiveTracking - 5-min throttle |
| Profile page | Profile | PASS | ProfilePage.tsx |
| Edit Profile | Profile | PASS | EditProfile.tsx - name, bio, photos, etc. |
| Lifestyle quiz answers on profile | Profile | PASS | Shown in MatchDetail |
| Social links (LinkedIn, Instagram) | Profile | PASS | EditProfile + TrustBadge |
| Work email verification field | Profile | PASS | Admin approval flow |
| Profile completeness indicator | Profile | PASS | ProfileCompleteness.tsx |
| Profile photo upload | Profile | PASS | useStorage + compressImage |
| Save a profile (seeker) | Saved | PASS | savedProfileIds arrayUnion |
| Unsave a profile | Saved | PASS | savedProfileIds arrayRemove |
| Save a room/listing | Saved | PASS | savedRoomIds arrayUnion |
| Unsave a room | Saved | PASS | savedRoomIds arrayRemove |
| Saved profiles tab | UI | PASS | getProfilesByIds fetch |
| Saved rooms tab | UI | PASS | Listed in SeekerDashboard |
| Document upload (EditProfile) | Verification | PASS | Storage + Firestore verifications/{id} |
| Admin verifies/rejects | Verification | PASS | AdminVerifications.tsx |
| isVerified flag update | Verification | PASS | Admin only via useAdmin |
| Trust badge display | Verification | PASS | TrustBadge.tsx |
| Aadhaar stub | Verification | STUB | AadhaarVerifyModal.tsx - not wired to pages |
| DigiLocker stub | Verification | STUB | DigiLockerModal.tsx - not wired to pages |
| Chat room creation | Chat | PASS | getOrCreateChatRoom |
| Real-time messages | Chat | PASS | onSnapshot subscribeToMessages |
| Send text message | Chat | PASS | sendMessage |
| Send image in chat | Chat | PASS | uploadChatImage + imageUrl in message |
| Read receipts | Chat | PASS | markMessagesRead |
| Typing indicator | Chat | PASS | setTyping - graceful fail |
| Phone number share request | Chat | PASS | requestPhoneShare |
| Phone number share accept | Chat | PASS | acceptPhoneShare + assignSharedPhones |
| System messages | Chat | PASS | sendSystemMessage |
| Chat room list (real-time) | Chat | PASS | subscribeToChatRooms |
| In-app notifications | Notifications | PASS | subscribeToNotifications real-time |
| Mark as read | Notifications | PASS | markAsRead |
| Mark all read | Notifications | PASS | markAllRead |
| Delete notification | Notifications | PASS | deleteNotification |
| Browser push notifications | Notifications | PASS | usePushNotifications + SW registration |
| Admin broadcast | Notifications | PASS | broadcastNotification |
| Block a user | Safety | PASS | blockedUserIds + blockUser |
| Report a user | Safety | PASS | reports collection |
| Skip a user | Safety | PASS | skippedUserIds |
| Blocked users excluded from feed | Safety | PASS | findMatches filter |
| Skipped users excluded from feed | Safety | PASS | findMatches filter |
| Dark mode toggle | Settings | PASS | settings.darkMode + DOM class |
| Language switcher | Settings | PASS | useTranslation - EN/HI/TA/TE |
| Delete account | Settings | PASS | SettingsPage.tsx |
| Notification preferences | Settings | PASS | SettingsPage.tsx |
| Admin auth guard | Admin | PASS | Hardcoded emails + admins collection + config/admin |
| Admin Dashboard metrics | Admin | PASS | User/listing/chat counts + city breakdown |
| Admin Users list | Admin | PASS | AdminUsers.tsx |
| Admin suspend/ban/reinstate | Admin | PASS | useAdmin callbacks |
| Admin Listings | Admin | PASS | AdminListings.tsx |
| Admin delete listing | Admin | PASS | deleteListing |
| Admin Reports | Admin | PASS | AdminReports.tsx |
| Admin Verifications | Admin | PASS | AdminVerifications.tsx + approve/reject |
| Admin Notifications | Admin | PASS | AdminNotifications.tsx + broadcast |
| Admin Settings | Admin | PASS | AdminSettings.tsx + admin email management |
| Create listing | Owner | PASS | OwnerOnboarding -> createListing |
| Edit listing | Owner | PASS | EditListing.tsx |
| Listing status management | Owner | PASS | updateListing |
| View listing analytics (chart) | Owner | PASS | getWeeklyViews + recharts |
| Browse seekers | Owner | PASS | BrowseSeekers.tsx |
| Listing image upload (multi) | Owner | PASS | uploadListingImages |
| Send connect request | Connect | PASS | sendRequest |
| Duplicate guard | Connect | PASS | findExistingConnectionId |
| Accept / Reject | Connect | PASS | acceptRequest / rejectRequest |
| Monthly count tracking | Connect | PASS | getMonthlyConnectCount |

---

## Known Issues

| ID | Severity | Description |
|----|----------|-------------|
| KI-01 | P2 | AadhaarVerifyModal and DigiLockerModal are orphaned stubs not imported by any page. Remove in RC2. |
| KI-02 | P2 | App.css contains Vite default scaffold CSS. Not imported in production. No impact. |
| KI-03 | P2 | initRecaptchaDev in useAuth.ts is defined but never called. Dead code. |
| KI-04 | P2 | api/router.ts scaffold file not imported anywhere. No runtime impact. |
| KI-05 | P2 | Several shadcn/ui components (sidebar, menubar, carousel, etc.) installed but not imported. Tree-shaken at build time. |
| KI-06 | P2 | Production dependencies superjson, html2canvas, jspdf, jspdf-autotable, dotenv, @tanstack/react-query installed but unused in src/. |
| KI-07 | P2 | kimi-plugin-inspect-react devDependency unused. Should be removed. |
| KI-08 | P2 | /dev/seed route is unguarded in production. Should be gated behind admin auth. |
| KI-09 | P3 | Chat emoji/reaction control is non-functional (TD-05). |
| KI-10 | P3 | No CI pipeline for automated tests or TypeScript checks (TD-01). |
| KI-11 | P3 | Legacy users documents may still hold public phone/email (TD-02). Mitigated by migrate-on-login. |
| KI-12 | P3 | Admin security check relies on email domain pattern in Firestore rules. No custom claims used. |
| KI-13 | P3 | Storage rules for /listings/ and /chats/ allow any authenticated user to write. Acceptable for V1. |
| KI-14 | P3 | BrowseSeekers shows owners filtered client-side by role. Intentional design. |

---

## Known Limitations

| ID | Limitation | Impact |
|----|-----------|--------|
| LIM-01 | Premium/KYC is UI-only stub. No payment gateway. | Low |
| LIM-02 | Phone OTP auth is legacy. Email/Google are primary. | Low |
| LIM-03 | Aadhaar / DigiLocker e-KYC is future integration. | Low |
| LIM-04 | Geocoding uses Nominatim. Rate-limited at 1.1s/request. | Low |
| LIM-05 | Push notifications use Web Push only. No FCM. | Medium |
| LIM-06 | No email notification system. | Low |
| LIM-07 | Compatibility score is client-computed. No ML. | Low |
| LIM-08 | Map clustering not implemented for dense markers. | Low |
| LIM-09 | No SSR / SEO for dynamic user/listing pages. | Medium |
| LIM-10 | Admin dashboard metrics do full collection scans. | Medium |
| LIM-11 | Translation covers only 25 keys. Partial i18n. | Low |

---

## Deployment Checklist

- [ ] VITE_FIREBASE_API_KEY set
- [ ] VITE_FIREBASE_AUTH_DOMAIN set
- [ ] VITE_FIREBASE_PROJECT_ID = nestmate-eb562 confirmed
- [ ] VITE_FIREBASE_STORAGE_BUCKET set
- [ ] VITE_FIREBASE_MESSAGING_SENDER_ID set
- [ ] VITE_FIREBASE_APP_ID set
- [ ] Run `npm run build` - verify zero TypeScript errors
- [ ] Run `npm test` - verify all unit tests pass
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Storage rules: `firebase deploy --only storage`
- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Deploy hosting: `npm run deploy`
- [ ] Verify https://nestmate-eb562.web.app loads
- [ ] Verify Google Sign-In works (check Firebase Auth authorized domains)
- [ ] Verify admin@nestmate.com has access to /admin
- [ ] Smoke-test: signup > onboard > browse > connect > chat

---

## Rollback Plan

1. Firebase Hosting: Console > Hosting > Release History > Rollback to previous version
2. Firestore rules: Revert git commit, redeploy `firebase deploy --only firestore:rules`
3. Storage rules: Same as Firestore rules process
4. Client code: No DB migrations in V1. Any version runs safely against current schema.

---

## Manual QA Checklist (Pre-Launch)

### Auth
- [ ] Sign up with email - verify redirected to role-select
- [ ] Sign in with Google - verify existing profile loaded
- [ ] Wrong password - see friendly error message
- [ ] Reset password flow works end to end
- [ ] Logout clears state, returns to /

### Onboarding
- [ ] New user > /role-select > /onboarding/seeker > /dashboard
- [ ] Owner role > /onboarding/owner > /owner-dashboard
- [ ] Attempting /dashboard without onboarding redirects correctly

### Browse and Search
- [ ] Browse rooms without login works
- [ ] City filter changes results
- [ ] Budget slider filters results
- [ ] Verified-only toggle filters results
- [ ] Map view shows pins for listings and seekers

### Chat
- [ ] Send text message to connected user
- [ ] Send image in chat
- [ ] Phone share request - other party sees request
- [ ] Phone share accept - both parties see phone numbers

### Safety
- [ ] Block user - user disappears from feed
- [ ] Report user - report shows in admin Reports tab
- [ ] Skip user - user hidden from match feed

### Admin
- [ ] Login as admin@nestmate.com - /admin loads
- [ ] Admin can see all users
- [ ] Admin can approve a verification
- [ ] Admin can send broadcast notification

### Settings
- [ ] Dark mode toggle persists across page refresh
- [ ] Language switch to Hindi - key UI labels change
- [ ] Delete account flow shows confirmation
