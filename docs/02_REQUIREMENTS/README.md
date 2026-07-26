# 02 — Requirements

> **Purpose**: Product requirements — functional, non-functional, and business rules  
> **Audience**: Product managers, developers, designers  
> **Dependencies**: [01 Product](../01_PRODUCT/README.md)  
> **Related**: [03 User Experience](../03_USER_EXPERIENCE/README.md) · [04 Features](../04_FEATURES/README.md)

---

## Functional Requirements

### FR-01: Authentication
| ID | Requirement | Status | Implementation |
|----|------------|--------|----------------|
| FR-01.1 | Email/password registration and login | ✅ | `useAuth.ts` → `signUp()`, `signIn()` |
| FR-01.2 | Google OAuth sign-in | ✅ | `useAuth.ts` → `signInWithGoogle()` |
| FR-01.3 | Phone OTP authentication | ✅ | `useAuth.ts` → `sendOTP()`, `verifyOTP()` |
| FR-01.4 | Persistent auth state across sessions | ✅ | `onAuthStateChanged` in `App.tsx` |
| FR-01.5 | Password reset via email | ✅ | `useAuth.ts` → `resetPassword()` |
| FR-01.6 | Auth-gated routes | ✅ | `PrivateRoute`, `OnboardingGuard` in `App.tsx` |

### FR-02: Onboarding
| ID | Requirement | Status | Implementation |
|----|------------|--------|----------------|
| FR-02.1 | Role selection (Seeker vs Owner) | ✅ | `RoleSelect.tsx` |
| FR-02.2 | Seeker: 19-step wizard (profile + 10-question quiz) | ✅ | `SeekerOnboarding.tsx` |
| FR-02.3 | Owner: 19-step wizard (profile + listing creation) | ✅ | `OwnerOnboarding.tsx` |
| FR-02.4 | Photo upload during onboarding | ✅ | `useStorage.ts` → `uploadProfilePicture()` |
| FR-02.5 | Skip completed profile steps if returning user | ✅ | Auto-skip to step 6 in `OwnerOnboarding.tsx` |
| FR-02.6 | Onboarding guard prevents dashboard access until complete | ✅ | `OnboardingGuard` in `App.tsx` |

### FR-03: Match Discovery
| ID | Requirement | Status | Implementation |
|----|------------|--------|----------------|
| FR-03.1 | View compatible matches filtered by city | ✅ | `useMatches.ts` → `findMatches()` |
| FR-03.2 | Compatibility scoring via lifestyle quiz | ✅ | `calculateCompatibility()` |
| FR-03.3 | Filter by gender, budget, locality, flat type, amenities | ✅ | `SeekerDashboard.tsx` client-side filtering |
| FR-03.4 | Sort by best match, newest, budget ascending/descending | ✅ | `SeekerDashboard.tsx` sort modes |
| FR-03.5 | Infinite scroll pagination (20 per page) | ✅ | `useMatches.ts` cursor-based pagination |
| FR-03.6 | Featured "Best Match Today" card | ✅ | `SeekerDashboard.tsx` first result |
| FR-03.7 | Grid and list view toggle | ✅ | `viewMode` state |
| FR-03.8 | Save/unsave profiles | ✅ | `useUserProfile.ts` → `toggleSavedProfile()` |
| FR-03.9 | Skip profiles with 5s undo | ✅ | `SeekerDashboard.tsx` → `handleSkip()` |
| FR-03.10 | Saved profiles tab | ✅ | `activeTab === 'saved'` |
| FR-03.11 | Saved search alerts | ✅ | `useUserProfile.ts` → `saveSearch()` |
| FR-03.12 | Full-text search by name, profession, locality, city | ✅ | Client-side search filter |

### FR-04: User Profiles
| ID | Requirement | Status | Implementation |
|----|------------|--------|----------------|
| FR-04.1 | View own profile | ✅ | `ProfilePage.tsx` |
| FR-04.2 | Edit profile fields | ✅ | `EditProfile.tsx` |
| FR-04.3 | Profile completeness meter | ✅ | `ProfileCompleteness.tsx` |
| FR-04.4 | Trust badge display | ✅ | `TrustBadge.tsx` |
| FR-04.5 | Block users | ✅ | `useUserProfile.ts` → `blockUser()` |
| FR-04.6 | Report users | ✅ | `useUserProfile.ts` → `reportUser()` |
| FR-04.7 | Active status tracking | ✅ | `useActiveTracking.ts` |
| FR-04.8 | Work email verification | ✅ | `EditProfile.tsx` + `emailOTPs` collection |
| FR-04.9 | Social links (LinkedIn, Instagram) | ✅ | `socialLinks` field on users |

### FR-05: Listings
| ID | Requirement | Status | Implementation |
|----|------------|--------|----------------|
| FR-05.1 | Create room listing | ✅ | `OwnerOnboarding.tsx` / `useListings.ts` |
| FR-05.2 | Edit listing | ✅ | `EditListing.tsx` |
| FR-05.3 | Upload up to 10 listing photos | ✅ | `useStorage.ts` → `uploadListingImages()` |
| FR-05.4 | Pause/resume listing | ✅ | `useListings.ts` → `updateListing()` |
| FR-05.5 | Delete listing | ✅ | `useListings.ts` → `deleteListing()` |
| FR-05.6 | View analytics (weekly views chart) | ✅ | `useListings.ts` → `getWeeklyViews()` |
| FR-05.7 | View count tracking | ✅ | `useListings.ts` → `recordView()` |
| FR-05.8 | Public listing browser | ✅ | `BrowseDashboard.tsx` |

### FR-06: Connections
| ID | Requirement | Status | Implementation |
|----|------------|--------|----------------|
| FR-06.1 | Send connection request | ✅ | `useConnections.ts` → `sendRequest()` |
| FR-06.2 | Accept/reject incoming requests | ✅ | `useConnections.ts` → `acceptRequest()`, `rejectRequest()` |
| FR-06.3 | Real-time incoming request notifications | ✅ | `subscribeToIncoming()` |
| FR-06.4 | Connection state machine (pending → accepted/rejected) | ✅ | `connections` collection |
| FR-06.5 | Monthly connection count tracking | ✅ | `getMonthlyConnectCount()` |

### FR-07: Chat
| ID | Requirement | Status | Implementation |
|----|------------|--------|----------------|
| FR-07.1 | Real-time messaging | ✅ | `useChat.ts` → `subscribeToMessages()` |
| FR-07.2 | Image sharing in chat | ✅ | `useStorage.ts` → `uploadChatImage()` |
| FR-07.3 | Typing indicators | ✅ | `useChat.ts` → `setTyping()` |
| FR-07.4 | Read receipts (double check) | ✅ | `markMessagesRead()` |
| FR-07.5 | Unread message counts per room | ✅ | Per-room subscription tracking |
| FR-07.6 | Phone number sharing protocol | ✅ | `requestPhoneShare()`, `acceptPhoneShare()` |
| FR-07.7 | System messages for events | ✅ | `senderId: 'system'` |
| FR-07.8 | Chat room search | ✅ | Client-side name filter |

### FR-08: Notifications
| ID | Requirement | Status | Implementation |
|----|------------|--------|----------------|
| FR-08.1 | In-app notification center | ✅ | `NotificationsPage.tsx` |
| FR-08.2 | Real-time unread count badge | ✅ | `Layout.tsx` subscription |
| FR-08.3 | Browser push notifications | ✅ | `usePushNotifications.ts` |
| FR-08.4 | Mark all as read | ✅ | `useNotifications.ts` |
| FR-08.5 | Notification types: match, message, connect, room, system | ✅ | `type` field |

### FR-09: Maps & Geocoding
| ID | Requirement | Status | Implementation |
|----|------------|--------|----------------|
| FR-09.1 | Full-page map view with listing pins | ✅ | `MapView.tsx` |
| FR-09.2 | Map preview on listing detail | ✅ | `MapPreview.tsx` |
| FR-09.3 | Geocoding of localities | ✅ | `useGeocoding.ts` |
| FR-09.4 | Rate-limited Nominatim API calls | ✅ | Global queue @ 1.1s |

### FR-10: Settings
| ID | Requirement | Status | Implementation |
|----|------------|--------|----------------|
| FR-10.1 | Dark mode toggle | ✅ | `SettingsPage.tsx` → `toggle('darkMode')` |
| FR-10.2 | Language selection (en, hi, ta, te) | ✅ | `useTranslation.ts` |
| FR-10.3 | Notification preferences | ✅ | Push matches/messages/requests toggles |
| FR-10.4 | Privacy controls (visibility, discoverability) | ✅ | `profilePublic`, `discoverable`, `showLastSeen` |
| FR-10.5 | Download personal data (GDPR) | ✅ | `SettingsPage.tsx` JSON export |
| FR-10.6 | Delete account | ✅ | Full data + auth cleanup |

### FR-11: Admin
| ID | Requirement | Status | Implementation |
|----|------------|--------|----------------|
| FR-11.1 | Admin dashboard with metrics | ✅ | `AdminDashboard.tsx` |
| FR-11.2 | User management (view, suspend, delete) | ✅ | `AdminUsers.tsx` |
| FR-11.3 | Listing moderation (approve, remove) | ✅ | `AdminListings.tsx` |
| FR-11.4 | Report handling | ✅ | `AdminReports.tsx` |
| FR-11.5 | Verification queue (Aadhaar, Work ID) | ✅ | `AdminVerifications.tsx` |
| FR-11.6 | Broadcast notifications | ✅ | `AdminNotifications.tsx` |
| FR-11.7 | Admin settings (admin email list) | ✅ | `AdminSettings.tsx` |

---

## Non-Functional Requirements

### NFR-01: Performance

| Requirement | Target | Implementation |
|------------|--------|----------------|
| Initial page load | < 3s on 3G | Lazy-loaded routes via `React.lazy()` |
| Bundle size | Optimized chunks | Vite manual chunks (firebase, react, charts, map) |
| Image loading | Progressive/lazy | `loading="lazy"` on all `<img>` tags |
| Loading states | Skeleton screens | `skeleton-shimmer` CSS class |
| Pagination | No full-list queries | Firestore cursor-based pagination (20/page) |

### NFR-02: Security
→ See [10 Security](../10_SECURITY/README.md) for full details

| Requirement | Implementation |
|------------|----------------|
| Authentication required for data mutation | Firestore rules: `request.auth != null` |
| User can only edit own data | `request.auth.uid == resource.data.ownerId` |
| Admin check | Email domain check: `@nestmate.com` |
| Phone numbers protected | Chat phone sharing protocol |
| Input validation | Client-side + Firestore rules |

### NFR-03: Accessibility

| Requirement | Implementation |
|------------|----------------|
| Skip navigation link | `index.html` → `<a href="#main-content">Skip to main content</a>` |
| Focus-visible rings | `index.css` → `:focus-visible` outline |
| ARIA labels | `aria-label` on icon buttons |
| Semantic HTML | `<main>`, `<nav>`, `<aside>`, `<section>` |
| iOS zoom prevention | Inputs set to `font-size: 16px` |
| Mobile breakpoint | 768px via `use-mobile.ts` |

### NFR-04: SEO

| Requirement | Implementation |
|------------|----------------|
| Meta tags | `index.html` → title, description, og:* |
| Robots.txt | `public/robots.txt` |
| Sitemap | `public/sitemap.xml` |
| Structured data | Open Graph tags |
| SPA routing | Firebase SPA rewrites |

### NFR-05: Internationalization

| Requirement | Implementation |
|------------|----------------|
| 4 Indian languages | `useTranslation.ts` (en, hi, ta, te) |
| User-selectable | Settings → Language dropdown |
| Fallback chain | Selected → English → key |
| 26 translated strings | Navigation labels, common UI terms |

---

## Business Rules

| Rule | Description | Source |
|------|------------|--------|
| BR-01 | Free users get 5 connection requests/month | `FREE_CONNECT_LIMIT = 5` in `useConnections.ts` |
| BR-02 | Currently all limits are unlimited (100% free) | Code comment: "Platform is 100% free" |
| BR-03 | Admin is determined by `@nestmate.com` email domain | `firestore.rules` + `useAdmin.ts` |
| BR-04 | Phone numbers hidden until mutual phone share | `phoneSharing` protocol in `useChat.ts` |
| BR-05 | Blocked users are excluded from match results | `blockedUserIds` array filter in `SeekerDashboard.tsx` |
| BR-06 | Skipped users are excluded from match results | `skippedUserIds` array filter in `useMatches.ts` |
| BR-07 | Only onboarding-complete users appear in matches | Firestore query: `onboardingComplete == true` |
| BR-08 | Premium users sort to top of match results | Triple sort in `findMatches()` |
| BR-09 | Image uploads are compressed client-side (1200px, 80% JPEG) | `imageCompressor.ts` |
| BR-10 | Nominatim requests rate-limited to 1.1s intervals | `useGeocoding.ts` global queue |
| BR-11 | Last active tracked every 5 minutes | `useActiveTracking.ts` throttle |
| BR-12 | Listings can be paused/resumed by owner | `status: 'active' | 'paused' | 'filled'` |
| BR-13 | Active status: < 15min = online, < 24h = recent, else = offline | `getActiveStatus()` in `useMatches.ts` |

---

*→ Next: [03 User Experience](../03_USER_EXPERIENCE/README.md)*
