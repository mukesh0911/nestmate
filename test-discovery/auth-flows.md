# NestMate — Authentication and Authorization Flows
_Evidence source: src/hooks/useAuth.ts, src/App.tsx, firestore.rules_

---

## 1. Auth Providers (Discovered in useAuth.ts)

| Provider | Method | Status |
|---------|--------|--------|
| Google OAuth | `signInWithPopup(GoogleAuthProvider)` | DISCOVERED AND REACHABLE |
| Phone (OTP) | `signInWithPhoneNumber` + `RecaptchaVerifier` | DISCOVERED AND REACHABLE |
| Email + Password | `signInWithEmailAndPassword` / `createUserWithEmailAndPassword` | DISCOVERED AND REACHABLE |
| Email Password Reset | `sendPasswordResetEmail` | DISCOVERED AND REACHABLE |
| Phone Link | `linkWithCredential` (links phone to existing account) | DISCOVERED IN CODE |

---

## 2. Auth State Machine (App.tsx)

```
Firebase Auth Change
       |
       v
  onAuthStateChanged()
       |
  [User exists?]
   /          \
  YES          NO
  |             |
  v             v
onSnapshot(     authState = {
  users/{uid}   uid: null,
)               role: null,
  |             loading: false
  |           }
  v
[Snapshot exists + server?]
  |
  v
authState = {
  uid, role, onboardingComplete,
  status, hasPhone
}
```

### Key Auth State Fields

| Field | Description |
|-------|-------------|
| `uid` | Firebase user UID (null if not logged in) |
| `role` | 'seeker' or 'owner' (from Firestore profile) |
| `onboardingComplete` | boolean (from Firestore, trusted from server snapshot only) |
| `status` | 'active' / 'suspended' / 'banned' |
| `hasPhone` | true if phoneVerified or phone present or Firebase phone auth |
| `loading` | true while waiting for Firestore profile |

### Fallback Timer
If Firestore does not respond within 2500ms:
- Sets loading=false, role=null, onboardingComplete=false
- User treated as having no profile (sent to role-select or onboarding)

---

## 3. Route Guard Logic

### PrivateRoute
- Checks: `isAuthenticated` (uid !== null)
- Checks: `isAccountActive(status)` -- if suspended/banned, shows BlockedAccountScreen
- If not authenticated: redirect to `/login?redirect={currentPath}`

### OnboardingGuard (used for all interactive features)
1. If loading → show PageLoader
2. If not authenticated → redirect to `/login`
3. If account not active → show BlockedAccountScreen
4. If `onboardingComplete === false`:
   - If role=seeker → redirect to `/onboarding/seeker`
   - If role=owner → redirect to `/onboarding/owner`
   - If no role → redirect to `/role-select`
5. If `expectedRole` doesn't match `authState.role` → redirect to correct dashboard
6. Otherwise → render children

### LoginRoute (smart login redirect)
- If authenticated AND redirect param contains `/admin` → go to admin
- If authenticated → go to getDashboardRoute()
- If not authenticated → render AuthPage

### getDashboardRoute()
- owner → `/owner-dashboard`
- seeker → `/explore?tab=rooms`
- not authenticated → `/login`

---

## 4. Account Status Enforcement

Enforced at two layers:

**Client (App.tsx):**
- `isAccountActive(status)` function called in PrivateRoute and OnboardingGuard
- Blocked accounts see a full-screen `BlockedAccountScreen` with sign-out button

**Server (firestore.rules):**
- `isActiveUser()` checks `users/{uid}.status == 'active'`
- Required for: listing create/update, connection create, chat create/send, analytics events

---

## 5. Onboarding Flow

### Seeker Onboarding (src/pages/SeekerOnboarding.tsx)
Required by Firestore rule: `quizAnswers.size() >= 5`

Multi-step form. Steps discovered from file size (55KB) suggest:
1. Name / basic info
2. City / location preferences
3. Budget / move-in date
4. Lifestyle quiz (minimum 5 answers required)
5. Profile photo upload
6. Complete (sets `onboardingComplete: true`)

### Owner Onboarding (src/pages/OwnerOnboarding.tsx)
Required by Firestore rule: `city.size() > 0`

Steps inferred from file size (52KB):
1. Name / basic info
2. City / owner type (owner_flatmate vs landlord)
3. Property basics
4. Household expectations
5. Complete (sets `onboardingComplete: true`)

---

## 6. Admin Authentication

**NOT enforced by client-side route guards** -- /admin routes use only `PrivateRoute` (any logged-in user).

Real enforcement is at the Firestore security rules level:
- Admin reads/writes require `isAdmin()` -- which checks the `admins/{email}` collection
- Any non-admin user who navigates to /admin can view the UI but all Firestore queries will fail

**Hardcoded admin emails (bypass admins collection check):**
- `mukvr46@gmail.com`
- `admin@nestmate.in`
- `admin@nestmate-test.com`

---

## 7. Phone Authentication Details

- Uses Firebase `signInWithPhoneNumber` + invisible reCAPTCHA
- `window.recaptchaVerifier` stored globally to survive re-renders
- OTP verification via `confirmationResult.confirm(code)`
- Phone can be linked to existing account via `linkWithCredential`
- Indian 10-digit numbers get country code +91 prepended for WhatsApp links

---

## 8. Google OAuth Details

- Uses `signInWithPopup` with `GoogleAuthProvider`
- `getAdditionalUserInfo` extracts profile picture
- Google photo URL upgraded from `=s96-c` to `=s400-c` for higher resolution
- On new user: creates profile in Firestore via `persistPublicUser`

---

## 9. Data Privacy Architecture

PII is split across collections:
- `users/{uid}` — public profile (email/phone stored as empty strings)
- `privateUserData/{uid}` — PII (phone, email, workEmail) owner+admin only
- `userContacts/{uid}` — WhatsApp number, shared only with accepted connection partners
