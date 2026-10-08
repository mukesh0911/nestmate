# NestMate — Application Overview
_Discovery Phase · Evidence-Based Audit · Zero Assumptions_

---

## 1. What Is NestMate?

NestMate is a co-living and roommate-matching web app targeting the Indian urban rental market. It connects two kinds of users:

| Role | Description |
|------|-------------|
| Seeker | Person looking for a room or a flatmate |
| Owner | Person who has a room / is an owner-flatmate looking to fill a vacancy |

The product is built as a client-side SPA (Vite + React 18 + TypeScript) backed entirely by Firebase (Authentication, Firestore, Storage). There is no custom backend server; all business logic runs in the browser or is enforced by Firestore security rules.

---

## 2. Tech Stack (Verified from codebase)

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (Vite) |
| Routing | react-router-dom v6 |
| State | Zustand (useStore.ts) |
| Server state | React Query |
| Styling | Tailwind CSS |
| Backend | Firebase Auth + Firestore + Storage |
| Notifications | Sonner (toast) |
| Maps | Google Maps / Geocoding API (useGeocoding.ts, MapPreview.tsx, MapView.tsx) |
| Analytics | Custom (lib/analytics.ts) + Firebase Analytics |
| i18n | Custom useTranslation.ts hook |
| Push Notifications | usePushNotifications.ts (Firebase Cloud Messaging) |
| Testing | Vitest (.test.ts files in lib/) |

---

## 3. User Roles and Access Model

```
Anonymous  --> public browsing (/, /explore, /room/:id, /match/:id, informational pages)
               No account creation required to browse listings

Authenticated --> PrivateRoute guard (auth check only)
                   /role-select, /onboarding/seeker, /onboarding/owner

Onboarded Seeker --> OnboardingGuard (auth + onboarding + role=seeker)
                      /explore, /chat, /profile, /edit-profile, /preferences,
                      /settings, /notifications, /profile/preview

Onboarded Owner --> OnboardingGuard (auth + onboarding + role=owner)
                     /owner-dashboard, /edit-listing/:id, /applicants/compare,
                     /chat, /profile, /edit-profile, /settings, /notifications

Admin --> isAdmin() (Firestore rule: admins/{email} doc OR hardcoded email list)
          /admin/* -- full platform management
```

---

## 4. Application Health (at time of discovery)

| Item | Status |
|------|--------|
| Dev server running | CONFIRMED (Vite v7.3.0 running at http://localhost:3000) |
| Browser exploration | CONFIRMED (Audited in real browser on desktop & mobile viewports) |
| Firebase configured | Via .env VITE_FIREBASE_* vars |
| Firestore rules deployed | firestore.rules -- 478 lines, 20 collections |
| Storage rules deployed | storage.rules -- 83 lines, 5 storage paths |
| Unit test suite | 25+ test suites in lib/ |
| Admin authorization | firestore.rules isAdmin() + admins/{email} doc + known admin fallbacks |

---

## 5. Discovery Confidence Level

| Area | Confidence |
|------|-----------|
| Routes and navigation | BOTH_CODE_AND_UI_CONFIRMED |
| Firestore & Storage schema | BOTH_CODE_AND_UI_CONFIRMED |
| Auth & onboarding flows | BOTH_CODE_AND_UI_CONFIRMED |
| Business & matching logic | BOTH_CODE_AND_UI_CONFIRMED |
| UI elements & interactions | BOTH_CODE_AND_UI_CONFIRMED |
| Responsive UI (Desktop/Mobile) | BOTH_CODE_AND_UI_CONFIRMED |
| Feature flags & status | BOTH_CODE_AND_UI_CONFIRMED |
| Cross-feature dependencies | BOTH_CODE_AND_UI_CONFIRMED |

