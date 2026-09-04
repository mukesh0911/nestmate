# App Check — Audit & Enablement Plan (Sprint FINAL)

## Current state (verified in code)

- **No `initializeAppCheck` call exists anywhere in `app/src`.**
  The only reCAPTCHA usage is Firebase **phone-auth**'s invisible
  `RecaptchaVerifier` (`useAuth.ts`, `PhoneLogin.tsx`) — that is an auth
  mechanism, NOT App Check.
- Services in use: Firebase Auth, Cloud Firestore, Cloud Storage,
  Hosting. No Cloud Functions backend.
- Enforcement status: **not enabled anywhere** (nothing to disable).

## Why it matters

App Check helps ensure requests to Firestore/Storage originate from this
legitimate web app, not scripted abuse. It complements — never replaces —
Security Rules, which remain the authorization boundary.

## Recommended provider

`ReCaptchaEnterpriseProvider` (web). reCAPTCHA Enterprise has a free tier
(10k assessments/month) sufficient for a pre-scale marketplace.

## Enablement plan (requires human/project access — NOT done automatically)

1. **Firebase console**: register the web app for App Check with
   reCAPTCHA Enterprise; obtain the site key.
2. Store the site key as a PUBLIC config value (it is not a secret):
   e.g. `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` in `.env`.
3. Initialize early in the app bootstrap (before any Firestore/Storage use):

   ```ts
   import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
   initializeAppCheck(app, {
     provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY),
     isTokenAutoRefreshEnabled: true,
   });
   ```

4. **Monitor first, enforce later** (per current Firebase guidance):
   - Run with App Check in monitoring mode.
   - Review Firestore/Storage → App Check → **Metrics** in the console;
     confirm verified traffic matches real users and identify any
     unverified legitimate sources (e.g., admin scripts).
5. Only after metrics look clean, flip enforcement ON per service
   (Firestore, Storage) in the console.

## Explicitly NOT done in this sprint

- No initialization code committed (site key does not exist yet).
- No enforcement toggled (would risk locking out legitimate users before
  metrics review).
- Debug provider was not wired into CI (no CI runtime exercising Firebase).

## Residual risk while disabled

Firestore/Storage Rules fully authorize every request regardless of client
origin, so data remains protected. Without App Check, a determined attacker
can still *call* the API surface directly (subject to rules) at higher
volume than the UI allows. Acceptable pre-launch; revisit before public
marketing push.