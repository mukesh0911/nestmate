# NestMate - Deployment Guide
> Version: 1.0.0-rc1 | Date: 2026-08-04 | Platform: Firebase Hosting

---

## Prerequisites

- Node.js 20+ and npm 9+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project: nestmate-eb562
- Firebase CLI logged in: `firebase login`

---

## Environment Variables

NestMate requires the following VITE_ prefixed environment variables set in `.env.local`:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=nestmate-eb562.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nestmate-eb562
VITE_FIREBASE_STORAGE_BUCKET=nestmate-eb562.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

VITE_ prefix means these are embedded at build time into the JS bundle. They are NOT secrets -- they are meant to be public, protected by Firestore security rules instead.

---

## Development

```bash
cd app
npm install
npm run dev       # http://localhost:5173
```

---

## Testing

```bash
cd app
npm test          # Run all unit tests (Vitest)
npm run typecheck # TypeScript check without emit
npm run lint      # ESLint check
```

---

## Build

```bash
cd app
npm run build     # Produces dist/ directory
```

Verify build output:
- dist/index.html exists
- dist/assets/ contains chunked JS and CSS
- No TypeScript errors

---

## Firebase Deployment

### Option 1: Hosting only (fastest)

```bash
cd app
npm run deploy
```

This runs: `npm run build && firebase deploy --only hosting`

### Option 2: Full deployment (rules + hosting + indexes)

```bash
cd app
npm run deploy:all
```

This runs: `npm run build && firebase deploy`

Which deploys:
- Firebase Hosting (dist/)
- Firestore security rules (firestore.rules)
- Firestore indexes (firestore.indexes.json)
- Storage security rules (storage.rules)

### Option 3: Rules only (no rebuild)

```bash
cd app
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only firestore:indexes
```

---

## Firebase Console Setup (First Deployment Only)

1. Authentication
   - Enable Email/Password sign-in method
   - Enable Google sign-in method
   - Add authorized domain: nestmate-eb562.web.app
   - Add authorized domain: your custom domain (if any)

2. Firestore
   - Start in production mode
   - Location: asia-south1 (Mumbai) recommended for India
   - Rules deployed via firebase deploy

3. Storage
   - Start in production mode
   - Rules deployed via firebase deploy

4. Hosting
   - Connected to nestmate-eb562 project
   - SPA config in firebase.json handles all routes

---

## Firebase Hosting Configuration (firebase.json)

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
          { "key": "X-Content-Type-Options", "value": "nosniff" }
        ]
      }
    ]
  }
}
```

Key points:
- All routes rewire to /index.html (SPA routing)
- Security headers: X-Frame-Options, X-Content-Type-Options
- dist/ is the build output directory

---

## Service Worker

The service worker at /sw.js is loaded by usePushNotifications.ts. It must exist at the root of the hosting domain for push notifications to work.

Verify /sw.js is included in the dist/ output after build.

---

## Custom Domain (Optional)

1. Firebase Console > Hosting > Add custom domain
2. Add DNS records as instructed
3. Add custom domain to Firebase Auth authorized domains

---

## Admin Setup (First Run)

1. Sign up with admin@nestmate.com or another admin email
2. Update config/admin document in Firestore:
   ```
   config/admin: { adminEmails: ["admin@nestmate.com"] }
   ```
3. Or add to admins collection:
   ```
   admins/{docId}: { email: "admin@nestmate.com", role: "admin" }
   ```

---

## Post-Deployment Verification

1. Open https://nestmate-eb562.web.app
2. Verify landing page loads without errors
3. Test Google Sign-In (requires auth domain setup)
4. Test email sign-up flow
5. Test admin login at /admin
6. Verify Firestore rules prevent unauthorized reads (test in Firebase console)

---

## Rollback

Firebase Hosting keeps deployment history:

```
firebase hosting:releases:list
firebase hosting:clone nestmate-eb562:live nestmate-eb562:live --version VERSION_ID
```

Or use Firebase Console: Hosting > Release History > Rollback.

---

## CI/CD (Recommended for RC2)

Add .github/workflows/deploy.yml:

```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd app && npm ci
      - name: Type check
        run: cd app && npm run typecheck
      - name: Run tests
        run: cd app && npm test
      - name: Build
        run: cd app && npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: nestmate-eb562
          channelId: live
```

