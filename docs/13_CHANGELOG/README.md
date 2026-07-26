# 13 — Changelog

> **Purpose**: Version history, release logs, and record of breaking changes  
> **Audience**: Developers, platform operators, product managers  
> **Dependencies**: All previous documents  
> **Related**: [11 Operations](../11_OPERATIONS/README.md) · [00 Master Index](../00_MASTER_INDEX.md)

---

## Version History

### [1.0.0] — 2026-07-26 (Current Production State)

#### 🚀 Major Features Implemented
- **Compatibility Engine**: 10-question lifestyle quiz with distance-based vector similarity matching (`calculateCompatibility`).
- **Match Discovery**: Seeker & Owner discovery feeds with city/locality filters, budget ranges, and pagination (`useMatches.ts`).
- **Multi-Tier Trust System**: 4-tier verification ladder (Bronze → Silver → Gold → Verified Pro) with dynamic trust scoring (`TrustBadge.tsx`).
- **Profile Completeness Meter**: Real-time progress bar with field-level conversion nudges (`ProfileCompleteness.tsx`).
- **Dual Onboarding Flows**: 19-step interactive wizards for both Room Seekers and Room Owners (`SeekerOnboarding.tsx`, `OwnerOnboarding.tsx`).
- **Real-Time Communication**: Built-in chat rooms with typing indicators, read receipts, and image attachments (`useChat.ts`).
- **Phone Sharing Protocol**: Secure, mutual-consent phone number exchange mechanism in chat.
- **Listing Management & Analytics**: Room listing CRUD, status toggling, and weekly view tracking with Recharts analytics (`useListings.ts`).
- **Admin Control Panel**: 7-section admin suite covering dashboard metrics, user suspension, listing moderation, report resolution, ID verification queue, and system broadcasts (`useAdmin.ts`).
- **Geocoding & Maps**: Integrated Leaflet interactive maps and Nominatim location geocoding with a global rate-limited request queue (`useGeocoding.ts`).
- **Notification Center**: Real-time in-app alerts and browser push notification integration (`usePushNotifications.ts`).
- **i18n & Localization**: Multilingual UI support for English, Hindi, Tamil, and Telugu (`useTranslation.ts`).
- **Dark Mode**: Persistent dark theme implementation across all core screens (`SettingsPage.tsx`).

#### 🛠️ Architectural & Technical Enhancements
- React 19 SPA powered by Vite 7 and TypeScript 5.
- Firebase Auth state machine with snapshot listener on `users/{uid}`.
- Serverless architecture utilizing Cloud Firestore (13 collections) and Firebase Storage.
- Client-side Canvas HTML5 image compression before upload (`imageCompressor.ts`).
- Single-city filter auto-selection on match feed initialization.
- Skip-with-undo functionality (5-second grace period toast) for match discovery.

---

### [0.9.0] — 2026-07-20 (Beta Release)
- Initial release of Seeker Dashboard and basic room listing cards.
- Integrated Firebase Authentication with Email/Password and Google OAuth.
- Initial Firestore security rules and index definitions.
- Basic navigation shell and responsive layout setup.

---

## Record of Breaking Changes & Migrations

| Date | Version | Area | Change Description | Impact / Action Required |
|------|---------|------|--------------------|--------------------------|
| 2026-07-24 | 0.9.5 | Auth | Switched from local state to snapshot listener on `users/{uid}` in `App.tsx` | Ensures profile updates (e.g., admin verifications) sync in real time across tabs without re-login. |
| 2026-07-22 | 0.9.2 | Firestore | Refactored `connections` schema to track requester and recipient explicitly | Required updating index queries to use `fromUserId` and `toUserId`. |
| 2026-07-18 | 0.8.0 | Geocoding | Replaced direct Nominatim API calls with `globalGeocodeQueue` | Added 1.1s rate limiting to prevent 429 rate limit errors from OpenStreetMap. |

---

## Release Process & Guidelines

1. **Versioning Scheme**: NestMate follows [Semantic Versioning 2.0.0](https://semver.org/) (`MAJOR.MINOR.PATCH`).
2. **Pre-Deploy Check**: Run `npm run build` to ensure zero TypeScript or Vite bundle errors.
3. **Deployment**:
   - Web application: `npm run deploy` (deploys hosting bundle).
   - Rules & Indexes: `npm run deploy:all` (deploys hosting, Firestore/Storage rules, and composite indexes).
