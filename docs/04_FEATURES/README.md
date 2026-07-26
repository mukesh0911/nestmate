# 04 — Features

> **Purpose**: One-page summary per major feature area — 15 features total  
> **Audience**: Developers, product managers, AI agents  
> **Dependencies**: [02 Requirements](../02_REQUIREMENTS/README.md) · [03 User Experience](../03_USER_EXPERIENCE/README.md)  
> **Related**: [05 Architecture](../05_ARCHITECTURE/README.md) · [06 Database](../06_DATABASE/README.md) · [08 Business Logic](../08_BUSINESS_LOGIC/README.md)

---

## Feature Index

| # | Feature | Hook/Source | Status |
|---|---------|------------|--------|
| 1 | [Authentication](#1-authentication) | `useAuth.ts` | ✅ Complete |
| 2 | [Onboarding](#2-onboarding) | `SeekerOnboarding.tsx`, `OwnerOnboarding.tsx` | ✅ Complete |
| 3 | [Match Discovery](#3-match-discovery) | `useMatches.ts`, `SeekerDashboard.tsx` | ✅ Complete |
| 4 | [Compatibility Scoring](#4-compatibility-scoring) | `useMatches.ts` → `calculateCompatibility()` | ✅ Complete |
| 5 | [Room Listings](#5-room-listings) | `useListings.ts` | ✅ Complete |
| 6 | [Connection System](#6-connection-system) | `useConnections.ts` | ✅ Complete |
| 7 | [Real-Time Chat](#7-real-time-chat) | `useChat.ts`, `ChatPage.tsx` | ✅ Complete |
| 8 | [Phone Sharing Protocol](#8-phone-sharing-protocol) | `useChat.ts` | ✅ Complete |
| 9 | [Trust & Verification](#9-trust--verification) | `TrustBadge.tsx`, `ProfileCompleteness.tsx` | ✅ Complete |
| 10 | [Notifications](#10-notifications) | `useNotifications.ts`, `usePushNotifications.ts` | ✅ Complete |
| 11 | [Map & Geocoding](#11-map--geocoding) | `useGeocoding.ts`, `MapView.tsx`, `MapPreview.tsx` | ✅ Complete |
| 12 | [Search & Filtering](#12-search--filtering) | Zustand store, `SeekerDashboard.tsx` | ✅ Complete |
| 13 | [Settings & Privacy](#13-settings--privacy) | `SettingsPage.tsx` | ✅ Complete |
| 14 | [Admin Panel](#14-admin-panel) | `useAdmin.ts`, `pages/admin/` | ✅ Complete |
| 15 | [Internationalization](#15-internationalization) | `useTranslation.ts` | ✅ Partial |

---

## 1. Authentication

**Source**: [useAuth.ts](file:///d:/roomate/app/src/hooks/useAuth.ts) · [AuthPage.tsx](file:///d:/roomate/app/src/pages/AuthPage.tsx)

### Supported Methods
| Method | Provider | Implementation |
|--------|----------|----------------|
| Email/Password | Firebase Auth | `signUp()`, `signIn()` |
| Google OAuth | Firebase Auth | `signInWithGoogle()` |
| Phone OTP | Firebase Auth | `sendOTP()`, `verifyOTP()` |

### Auth State Machine
- **Primary source of truth**: `onAuthStateChanged` listener in `App.tsx`
- On auth state change → snapshot listener on `users/{uid}` for profile sync
- Profile data updates (dark mode, role) flow through the snapshot listener
- State managed in `useAuth` hook, exposed via `{ user, profile, isAuthenticated }`

### Route Guards
| Guard | Logic |
|-------|-------|
| `PrivateRoute` | Redirects to `/login` if not authenticated |
| `OnboardingGuard` | Enforces role → onboarding → dashboard progression |

---

## 2. Onboarding

**Source**: [SeekerOnboarding.tsx](file:///d:/roomate/app/src/pages/SeekerOnboarding.tsx) · [OwnerOnboarding.tsx](file:///d:/roomate/app/src/pages/OwnerOnboarding.tsx)

### Seeker Flow (19 steps)
`photo → name → gender → age → profession → city → localities → budget → moveIn → quiz×10 → loading → success`

### Owner Flow (19 steps)
`avatar → name → gender → age → profession → phone → city → locality → flat_type → furnishing → rent → partners → photos → amenities → available_from → pref_gender → house_rules → loading → success`

### Key Behaviors
- **Progress bar** at top showing % completion
- **Animated transitions** between steps (forward/backward direction)
- **Returning owners** auto-skip profile steps (jump to step 6)
- **Validation** per step before proceeding
- On completion: creates/updates Firestore documents, marks `onboardingComplete: true`

---

## 3. Match Discovery

**Source**: [useMatches.ts](file:///d:/roomate/app/src/hooks/useMatches.ts) · [SeekerDashboard.tsx](file:///d:/roomate/app/src/pages/SeekerDashboard.tsx)

### Pipeline
`Firestore query → filter blocked/skipped → enrich with listings → compute scores → client filters → sort → paginate`

→ See [08 Business Logic → Match Finding](../08_BUSINESS_LOGIC/README.md) for full algorithm

### UI Elements
- **Best Match card** — featured first result with expanded layout
- **Match grid** — card grid with avatar, score badge, lifestyle tags
- **Shared traits badge** — "X/10 matches" indicator
- **Sidebar** — filters, profile mini-card, saved alerts, preferences
- **Vaul drawer** — mobile filter panel

---

## 4. Compatibility Scoring

**Source**: [useMatches.ts → calculateCompatibility()](file:///d:/roomate/app/src/hooks/useMatches.ts)

→ Full algorithm documented in [08 Business Logic → Compatibility Algorithm](../08_BUSINESS_LOGIC/README.md)

### Summary
- 10-question lifestyle quiz
- Distance-based scoring (partial credit for similar answers)
- Produces 0–100% score
- Displayed as color-coded badge (≥90% = teal, <90% = fire/orange)

---

## 5. Room Listings

**Source**: [useListings.ts](file:///d:/roomate/app/src/hooks/useListings.ts) · [OwnerDashboard.tsx](file:///d:/roomate/app/src/pages/OwnerDashboard.tsx)

### CRUD Operations
| Operation | Function | Notes |
|-----------|----------|-------|
| Create | `createListing()` | During owner onboarding |
| Read | `getMyListings()`, `getListings()`, `getListingById()` | Owner + public queries |
| Update | `updateListing()` | Edit details, pause/resume |
| Delete | `deleteListing()` | With confirmation modal |

### Analytics
- **View tracking**: `recordView()` → daily counter in `listingViews` collection
- **Weekly chart**: `getWeeklyViews()` → Recharts bar chart on owner dashboard

### Listing States
| Status | Meaning |
|--------|---------|
| `active` | Visible in search results |
| `paused` | Hidden from search, preserved |
| `filled` | Room taken, archived |

---

## 6. Connection System

**Source**: [useConnections.ts](file:///d:/roomate/app/src/hooks/useConnections.ts)

→ Full state machine in [08 Business Logic → Connection Logic](../08_BUSINESS_LOGIC/README.md)

### Flow
1. Seeker sends connection request → `connections/` document created (status: `pending`)
2. Owner receives notification + real-time subscription update
3. Owner accepts → status: `accepted`, chat room auto-created
4. Owner rejects → status: `rejected`

### Button States on Match Cards
| State | Label | Action |
|-------|-------|--------|
| `connect` | "Connect" (fire button) | Send request |
| `pending` | "Request Sent" (disabled) | — |
| `chat` | "Chat" (teal button) | Navigate to chat |

---

## 7. Real-Time Chat

**Source**: [useChat.ts](file:///d:/roomate/app/src/hooks/useChat.ts) · [ChatPage.tsx](file:///d:/roomate/app/src/pages/ChatPage.tsx)

### Features
| Feature | Implementation |
|---------|---------------|
| Real-time messages | `onSnapshot` on `chatRooms/{id}/messages` |
| Typing indicators | `typingStatus` map on chat room document |
| Read receipts | `markMessagesRead()` updates `read` field |
| Unread counts | Per-room subscription tracking |
| Image sharing | `uploadChatImage()` → `imageUrl` field on message |
| System messages | `senderId: 'system'`, `isSystem: true` |
| Chat search | Client-side filter by participant name |

### Typing Indicator Debounce
- Writes `typingStatus.{uid}: true` on input
- Auto-resets after 3 seconds of inactivity
- Minimum 1.5s between Firestore writes (throttle)

---

## 8. Phone Sharing Protocol

**Source**: [useChat.ts → requestPhoneShare() / acceptPhoneShare()](file:///d:/roomate/app/src/hooks/useChat.ts)

### Two-Step Consent Flow
1. User A clicks "Share Phone" → system message + `phoneSharing.requestedBy` set
2. User B clicks "Accept" → both phone numbers written to chat room
3. System message announces: "Phone numbers are now shared"

### Privacy Guarantee
- Phone numbers **never** appear on profiles or match cards
- Only stored within the specific chat room's `phoneSharing` map
- Both parties must explicitly opt-in

---

## 9. Trust & Verification

**Source**: [TrustBadge.tsx](file:///d:/roomate/app/src/components/TrustBadge.tsx) · [ProfileCompleteness.tsx](file:///d:/roomate/app/src/components/ProfileCompleteness.tsx)

### Trust Ladder (4 Tiers)
| Tier | Points | Requirements | Badge Color |
|------|--------|-------------|-------------|
| Bronze | 0-44 | Phone verified (default) | `#CD7F32` |
| Silver | 45-74 | Profile photo + bio + profession | `#C0C0C0` |
| Gold | 75-99 | Work email verified | `#FFD700` |
| Verified Pro | 80+ | Government ID approved | `#0D9488` |

→ Full scoring in [08 Business Logic → Trust Score](../08_BUSINESS_LOGIC/README.md)

### Verification Types
| Type | Process | Admin Queue |
|------|---------|-------------|
| Aadhaar | Upload → Admin review → Approve/Reject | `AdminVerifications.tsx` |
| Work ID | Upload → Admin review | `AdminVerifications.tsx` |
| Student ID | Upload → Admin review | `AdminVerifications.tsx` |
| Work Email | OTP to corporate email → auto-verify | `emailOTPs` collection |

---

## 10. Notifications

**Source**: [useNotifications.ts](file:///d:/roomate/app/src/hooks/useNotifications.ts) · [usePushNotifications.ts](file:///d:/roomate/app/src/hooks/usePushNotifications.ts)

### In-App Notifications
- Real-time subscription via `onSnapshot`
- Unread count badge on navbar bell icon
- Types: `match`, `message`, `connect`, `room`, `agreement`, `verification`, `system`
- Mark all as read functionality

### Browser Push Notifications
- Service worker registered (`/sw.js`)
- Permission request flow with fallback
- Local notification broadcast for chat messages

---

## 11. Map & Geocoding

**Source**: [useGeocoding.ts](file:///d:/roomate/app/src/hooks/useGeocoding.ts) · [MapView.tsx](file:///d:/roomate/app/src/pages/MapView.tsx)

### Map Features
- Full-page Leaflet map with listing pins
- Map preview component for listing details
- Circle markers for locality-level precision
- OpenStreetMap tile layer

### Geocoding
- Nominatim API (free, rate-limited)
- Global queue: 1 request per 1.1 seconds
- Query: `"{locality}, {city}, India"`
- Results cached to Firestore documents (`geoLocation` field)

---

## 12. Search & Filtering

**Source**: Zustand store + [SeekerDashboard.tsx](file:///d:/roomate/app/src/pages/SeekerDashboard.tsx)

### Filter Dimensions
| Filter | Type | Range/Options |
|--------|------|--------------|
| City | single select | 6 cities |
| Localities | multi select | City-specific |
| Budget | range slider | ₹1,000 – ₹25,000 |
| Gender | single select | Any, Male, Female |
| Verified Only | toggle | boolean |
| Flat Type | multi select | 1BHK, 2BHK, 3BHK, Studio |
| Furnishing | multi select | Fully, Semi, Unfurnished |
| Amenities | multi select | 14 options |

### Search
- Full-text client-side search
- Searches: name, profession, city, localities

### Saved Searches
- Users can save current filter state as a named alert
- Alerts appear in sidebar with quick-apply
- Deleteable

---

## 13. Settings & Privacy

**Source**: [SettingsPage.tsx](file:///d:/roomate/app/src/pages/SettingsPage.tsx)

### Settings Tabs
| Tab | Controls |
|-----|---------|
| **Account** | Avatar upload, email display, phone display |
| **Privacy** | Profile visibility, last seen, discoverability |
| **Notifications** | Push for matches/messages/requests, email updates |
| **Appearance** | Dark mode, language (en/hi/ta/te) |

### Data & Account Actions
| Action | Implementation |
|--------|---------------|
| Download data | JSON export of profile, listings, connections |
| Delete account | Delete Firestore data → delete listings → delete connections → `deleteUser()` |

---

## 14. Admin Panel

**Source**: [useAdmin.ts](file:///d:/roomate/app/src/hooks/useAdmin.ts) · [pages/admin/](file:///d:/roomate/app/src/pages/admin)

→ Full documentation in [09 Admin](../09_ADMIN/README.md)

### Pages
| Page | Purpose |
|------|---------|
| Dashboard | Metrics: signups, users, listings, chats, city breakdown |
| Users | Browse, search, suspend, delete users |
| Listings | Moderate listings, toggle status |
| Reports | Review and resolve user reports |
| Verifications | Approve/reject ID documents (lightbox review) |
| Notifications | Send broadcast notifications to all users |
| Settings | Manage admin email whitelist |

---

## 15. Internationalization

**Source**: [useTranslation.ts](file:///d:/roomate/app/src/hooks/useTranslation.ts)

### Languages
| Code | Language | Status |
|------|----------|--------|
| `en` | English | ✅ Full (26 keys) |
| `hi` | Hindi | ✅ Full |
| `ta` | Tamil | ✅ Full |
| `te` | Telugu | ✅ Full |

### Scope
- Navigation labels (Dashboard, Messages, Profile, etc.)
- Common UI strings (Save, Logout, Search, etc.)
- **Not yet translated**: Page content, onboarding, error messages

---

*→ Next: [05 Architecture](../05_ARCHITECTURE/README.md)*
