# NestMate - Launch Checklist
> Version: 1.0.0-rc1 | Date: 2026-08-04

This is the single-page operational checklist to run through before and after launch.

---

## Pre-Launch: Code and Build

- [ ] All unit tests pass: `cd app && npm test`
- [ ] TypeScript check passes: `cd app && npm run typecheck`
- [ ] ESLint passes without errors: `cd app && npm run lint`
- [ ] Production build succeeds: `cd app && npm run build`
- [ ] Build output size acceptable (check dist/assets/* sizes)
- [ ] No console.error in production build preview: `npm run preview`

---

## Pre-Launch: Firebase Setup

- [ ] Firebase project nestmate-eb562 confirmed active
- [ ] Firestore: production mode enabled (not test mode)
- [ ] Storage: production mode enabled (not test mode)
- [ ] Authentication: Email/Password enabled
- [ ] Authentication: Google Sign-In enabled
- [ ] Authentication: Authorized domains includes nestmate-eb562.web.app
- [ ] Authentication: (Optional) Add custom domain if applicable
- [ ] Firestore rules deployed: `firebase deploy --only firestore:rules`
- [ ] Storage rules deployed: `firebase deploy --only storage`
- [ ] Firestore indexes deployed: `firebase deploy --only firestore:indexes`

---

## Pre-Launch: Deployment

- [ ] .env.local has all 6 VITE_FIREBASE_* values
- [ ] Run full deploy: `cd app && npm run deploy:all`
- [ ] Deployment completes without errors
- [ ] Hosting URL available: https://nestmate-eb562.web.app

---

## Pre-Launch: Firebase Console Config

- [ ] Create config/admin document in Firestore with adminEmails array
- [ ] Create initial admin user or ensure admin@nestmate.com can sign up

---

## Post-Deploy: Smoke Tests

Run these manually in the browser after deployment:

### Public Access
- [ ] https://nestmate-eb562.web.app loads (landing page visible)
- [ ] /browse-rooms loads without login
- [ ] /browse-seekers loads without login
- [ ] /map loads and shows Leaflet map

### Authentication
- [ ] Sign up with a new email account
- [ ] Sign in with Google
- [ ] Verify redirect to /role-select for new users
- [ ] Verify existing user redirected to /dashboard or /owner-dashboard
- [ ] Logout works

### Core Flows
- [ ] Seeker onboarding completes (quiz + preferences)
- [ ] Owner onboarding completes (listing creation)
- [ ] Match cards visible on /dashboard
- [ ] Connect request sent from seeker to another user
- [ ] Chat room opens between two connected users
- [ ] Text message sent and received in real-time
- [ ] Profile edit saved successfully

### Admin
- [ ] /admin accessible with admin email
- [ ] Admin dashboard metrics load
- [ ] Admin can view users list

---

## Post-Deploy: Monitoring

- [ ] Firebase Console > Firestore > Usage shows incoming reads/writes
- [ ] Firebase Console > Authentication > Users shows test signups
- [ ] No unhandled errors in browser console during smoke tests
- [ ] Firebase Console > Hosting > Release shows new deployment

---

## Go/No-Go Decision

Sign off before flipping traffic:

| Check | Owner | Status |
|-------|-------|--------|
| All smoke tests pass | QA | |
| Security rules verified | Security | |
| Admin access confirmed | Release Manager | |
| Rollback plan ready | Release Manager | |

**GO** if all rows are signed off. **NO-GO** if any P0 smoke test fails.

---

## Rollback (If Needed)

1. Firebase Console > Hosting > Release History
2. Click the previous good release
3. Click Rollback

Estimated rollback time: 2-3 minutes.

---

## Contacts

| Role | Responsibility |
|------|---------------|
| Principal Engineer | Code issues, architecture questions |
| Release Manager | Deploy/rollback, go/no-go decision |
| QA | Smoke test sign-off |
| Security | Rules sign-off |

