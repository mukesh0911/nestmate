# NestMate — Master Test Environment Foundation Guide

---

## 1. Architecture
The NestMate automated test architecture provides a completely isolated, deterministic, and reproducible testing foundation that bridges:
- **Client Application**: React 18, Vite, React Router 6, Zustand, Tailwind CSS running locally at `http://localhost:3000`.
- **Database & Storage**: Google Cloud Firestore & Firebase Storage with strict security rules (`app/firestore.rules`, `app/storage.rules`).
- **Test Orchestration**: Playwright Test (Desktop Chromium & Mobile Chrome) with zero external network dependencies for auth mock sessions and local emulator compatibility for rules tests.
- **Fail-Fast Gateways**: Automated environment verification and data integrity checks that stop test runs instantly upon detecting configuration defects or production environment violations.

---

## 2. Test Firebase Project & Environment Isolation
- **Active Test / Development Backend**: `nestmate-eb562` (or local emulator `demo-nestmate` via `firebase-tools emulators:exec`).
- **Base URL**: `http://localhost:3000`.
- **Hard Isolation Guards**:
  - `tests/helpers/environmentGuard.cjs` & `tests/helpers/environmentGuard.ts` intercept all seed, reset, and wipe commands.
  - Any run with `NODE_ENV=production`, `NEST_ENV=production`, or pointing to prohibited production aliases (`nestmate-prod`, `nestmate-production`) terminates immediately with a critical security error.

---

## 3. Authentication Strategy
NestMate supports multiple authentication pathways audited for automated testability:
| Auth Pathway | Production Mechanism | Automated Test Strategy | Classification |
| :--- | :--- | :--- | :--- |
| **Email / Password** | Firebase Auth `signInWithEmailAndPassword` | Real form fill & automated account registration / login | **ACTIVE TESTABLE** |
| **Google OAuth** | Firebase Auth popup `signInWithPopup` | Fast, deterministic Playwright `storageState` sessions & mock auth | **TEST-ONLY MOCK REQUIRED** |
| **Phone OTP** | Firebase Phone Auth (reCAPTCHA + SMS) | Deprecated in UI (redirects to `/login`); mock-capable | **EXTERNAL / DEPRECATED** |
| **Password Reset** | `sendPasswordResetEmail` | UI validation & mock email dispatch | **ACTIVE TESTABLE** |
| **Logout** | Firebase `signOut` + store reset | Clears storageState, resets Zustand store, redirects to `/` | **ACTIVE TESTABLE** |
| **Session Persistence** | `localStorage` / IndexedDB | Validated across browser refreshes | **ACTIVE TESTABLE** |

---

## 4. Test Accounts & Personas (The 12 Core Identities)
Every test identity has a 1-to-1 mapping across `Firebase Auth UID = Firestore users/{uid} = Application profile UID`:

| # | Identity Key | UID | Email | Role | Verification & Account Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `SEEKER_A` | `test_user_ref` | `seeker.ref@nestmate-test.com` | Seeker | Active, Onboarded, Level 1 Verified |
| 2 | `SEEKER_B` | `test_user_perfect_match` | `seeker.perfect@nestmate-test.com` | Seeker | Active, Onboarded, 100% Match Profile |
| 3 | `OWNER_A` | `test_user_owner_01` | `owner.verified@nestmate-test.com` | Owner | Active, Onboarded, Level 3 Verified (`APPROVED`) |
| 4 | `OWNER_B` | `test_user_owner_02` | `owner.unverified@nestmate-test.com` | Owner | Active, Onboarded, Unverified (Level 0) |
| 5 | `ADMIN` | `test_user_admin` | `admin@nestmate-test.com` | Seeker / Admin | Active, Superadmin authorized |
| 6 | `ONBOARDING_PENDING` | `test_user_onboarding_pending` | `incomplete@nestmate-test.com` | None (`null`) | Active, `onboardingComplete: false` |
| 7 | `SUSPENDED_USER` | `test_user_suspended` | `suspended@nestmate-test.com` | Seeker | `status: 'suspended'` |
| 8 | `BANNED_USER` | `test_user_banned` | `banned@nestmate-test.com` | Seeker | `status: 'banned'` |
| 9 | `OWNER_PENDING_VERIF` | `test_user_owner_03` | `owner.pending@nestmate-test.com` | Owner | Active, `status: 'UNDER_REVIEW'` |
| 10 | `OWNER_APPROVED` | `test_user_owner_01` | `owner.verified@nestmate-test.com` | Owner | Active, Level 3 Verified (`APPROVED`) |
| 11 | `OWNER_REJECTED` | `test_user_owner_rejected` | `owner.rejected@nestmate-test.com` | Owner | Active, Level 0, Verification `REJECTED` |
| 12 | `PREMIUM_USER` | `test_user_pro_user` | `seeker.pro@nestmate-test.com` | Seeker | Active, `isPremium: true`, Unlimited connects |

---

## 5. Deterministic Data Universe
Seeded deterministically to `tests/data/seed-universe.json`:
- **Users**: 16 user profiles (10 Seekers, 5 Owners, 1 Admin).
- **Listings (All 7 States)**:
  - `test_listing_live_01` (`active`) — Koramangala 2BHK
  - `test_listing_pend_01` (`pending_verification`) — Indiranagar 1BHK
  - `test_listing_draft_01` (`draft`) — HSR Layout Studio
  - `test_listing_pause_01` (`paused`) — Whitefield 3BHK
  - `test_listing_fill_01` (`filled`) — BTM Layout Room
  - `test_listing_close_01` (`closed`) — Electronic City Flat
  - `test_listing_exp_01` (`active` stale >30 days) — Koramangala
- **Connections (All 4 States)**:
  - `test_conn_p01` (`pending`): Seeker A → Owner A
  - `test_conn_a01` (`accepted`): Seeker B → Owner A
  - `test_conn_r01` (`rejected`): Seeker Night Owl → Owner A
  - `test_conn_b01` (`blocked`): Suspended Seeker → Owner A
- **Chat Rooms & Messages**:
  - `test_chat_crm_01`: Seeker B & Owner A accepted pairing with 3 threaded messages (read & unread).
- **Notifications**:
  - `test_notif_01` (connection request), `test_notif_02` (accepted), `test_notif_03` (chat message).
- **Reports & Verifications**:
  - Reports: Spam report (open), Harassment report (resolved).
  - Verifications: All 5 states (`APPROVED`, `SUBMITTED`, `UNDER_REVIEW`, `RESUBMISSION_REQUIRED`, `REJECTED`).
- **Integrity**: 0 orphan records, 0 broken foreign-key references.

---

## 6. Seed, Reset & Verification Commands

```bash
# 1. Reset Test Environment (cleans seed-universe.json & .auth states, preserves production accounts)
npm run test:reset

# 2. Seed Test Universe (generates complete dataset & creates .auth storage states)
npm run test:seed

# 3. Verify Environment Health & Foreign Key Relationships
npm run test:verify
```

Executing `npm run test:reset; npm run test:seed; npm run test:verify` produces the exact same deterministic dataset every time.

---

## 7. Playwright Authentication States
Located in `tests/.auth/`:
- `tests/.auth/seekerA.json` (Aditi Sharma)
- `tests/.auth/seekerB.json` (Pooja Iyer)
- `tests/.auth/ownerA.json` (Ramesh Gupta)
- `tests/.auth/ownerB.json` (Siddharth Rao)
- `tests/.auth/admin.json` (Administrator)

Playwright tests inject these storage states directly via `use: { storageState: 'tests/.auth/<role>.json' }` or `browser.newContext({ storageState })`, enabling instant authenticated page loads without repetitive UI login delays.

---

## 8. Session Isolation & Multi-User Testing
User A and User B maintain 100% isolated sessions when executed within separate Playwright browser contexts:
```typescript
// Context 1: Seeker A sends connection request
const seekerContext = await browser.newContext({ storageState: 'tests/.auth/seekerA.json' });
const seekerPage = await seekerContext.newPage();
await seekerPage.goto('/explore');

// Context 2: Owner A inspects incoming request and accepts
const ownerContext = await browser.newContext({ storageState: 'tests/.auth/ownerA.json' });
const ownerPage = await ownerContext.newPage();
await ownerPage.goto('/owner-dashboard?tab=applicants');

// Zero cross-context state leakage
await seekerContext.close();
await ownerContext.close();
```

---

## 9. API Testing Preparation
The API test foundation is encapsulated in `tests/helpers/apiTestContext.ts`:
- **`ApiTestContext.createSeekerContext()`**: Instantiates authenticated `APIRequestContext` for Seeker A.
- **`ApiTestContext.createOwnerContext()`**: Instantiates authenticated `APIRequestContext` for Owner A.
- **`ApiTestContext.createAdminContext()`**: Instantiates authenticated `APIRequestContext` for Administrator.
- **`ApiTestContext.getUniverseIds()`**: Exposes uniform entity IDs (`seekerA`, `activeListing`, `acceptedConnection`, etc.) guaranteeing parity between UI and API test coverage.

---

## 10. Environment Variables Configuration
Configured in `app/.env`:
```ini
VITE_FIREBASE_API_KEY=AIzaSyAbOt1hpqV056G_TkCRt916WbvIJzV7QlA
VITE_FIREBASE_AUTH_DOMAIN=nestmate-eb562.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nestmate-eb562
VITE_FIREBASE_STORAGE_BUCKET=nestmate-eb562.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=647447840013
VITE_FIREBASE_APP_ID=1:647447840013:web:7b3952e07060ab3f5d5c44
```

---

## 11. Production Safety Guards
- **Protected Administrative Accounts**:
  - `mukvr46@gmail.com`
  - `mukesh@nestmate.in`
  Strict Zero-Touch Policy: Immune to automated reset, deletion, or modification.
- **Hard Execution Barrier**:
  Any script attempting to operate against production Firebase credentials fails immediately with `[CRITICAL SECURITY VIOLATION]`.

---

## 12. Headed Browser & Visual Testing
To run tests visually in interactive headed mode:
```bash
# Run all tests in headed browser
npm run test:e2e:headed

# Run targeted suite in headed mode
npx playwright test tests/auth/authGatewayHealth.spec.ts --headed

# Run in debug mode with Playwright Inspector
npx playwright test --debug
```

---

## 13. Health Check Suites
- **Environment & Data Health Check**: `tests/unit/environmentHealth.spec.ts` (10 Gateways).
- **Authentication Gateway Health Check**: `tests/auth/authGatewayHealth.spec.ts` (AUTH-01 to AUTH-12).
