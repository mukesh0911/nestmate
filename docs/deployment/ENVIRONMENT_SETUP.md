# NestMate - Environment Setup
> Version: 1.0.0-rc1 | Date: 2026-08-04

---

## Required Tools

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | LTS recommended |
| npm | 9+ | Bundled with Node |
| Firebase CLI | latest | `npm install -g firebase-tools` |
| Git | any | For version control |

---

## Repository Structure

```
d:\roomate\
  app\                    <- Vite React app (main workspace)
    src\
      components\         <- Shared + page-specific components
      hooks\              <- Firebase + business logic hooks
      lib\                <- Pure utility functions
      pages\              <- Route-level page components
        admin\            <- Admin-only pages
      api\                <- tRPC scaffold (router.ts only, not wired)
    public\               <- Static assets (sw.js, favicon)
    firestore.rules        <- Firestore security rules
    firestore.indexes.json <- Firestore composite indexes
    storage.rules          <- Firebase Storage rules
    firebase.json          <- Hosting + emulator config
    .firebaserc            <- Project alias (nestmate-eb562)
    package.json
    vite.config.ts
    tsconfig*.json
    .env.local             <- NOT committed to git (create from .env.example)
  CHANGELOG.md
  TECHNICAL_DEBT.md
  SYSTEM_ARCHITECTURE.md  <- Created by RC1 review
  DATABASE_SCHEMA.md      <- Created by RC1 review
  API_REFERENCE.md        <- Created by RC1 review
  DEPLOYMENT_GUIDE.md     <- Created by RC1 review
  ENVIRONMENT_SETUP.md    <- This file
  KNOWN_LIMITATIONS.md    <- Created by RC1 review
  RC1_RELEASE_CHECKLIST.md <- Created by RC1 review
  FINAL_RELEASE_REPORT.md <- Created by RC1 review
  LAUNCH_CHECKLIST.md     <- Created by RC1 review
```

---

## Environment Variables

Create `app/.env.local` (never commit this file):

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=nestmate-eb562.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nestmate-eb562
VITE_FIREBASE_STORAGE_BUCKET=nestmate-eb562.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123...
```

### Where to find these values

1. Firebase Console (console.firebase.google.com)
2. Select project: nestmate-eb562
3. Project Settings (gear icon) > General
4. Scroll to "Your apps" section
5. Click Web app > Firebase SDK snippet > Config

---

## Local Development Setup

```bash
# 1. Clone repository
git clone <repo-url> roomate
cd roomate/app

# 2. Install dependencies
npm install

# 3. Create .env.local with Firebase values (see above)

# 4. Start dev server
npm run dev
# Open http://localhost:5173
```

---

## Firebase Emulator Setup (Optional, for local testing)

```bash
# Install Java (required for Firestore emulator)
# https://adoptium.net/

# Start emulators
cd app
firebase emulators:start
```

Emulator ports (from firebase.json):
- Authentication: 9099
- Firestore: 8080
- Storage: 9199
- Hosting: 5000
- Emulator UI: 4000

To use emulators in the app, add to .env.local:
```
VITE_USE_EMULATORS=true
```

Note: useEmulators integration not currently wired. Add to lib/firebase.ts if needed.

---

## Installed Dependencies

### Production Dependencies

| Package | Purpose |
|---------|---------|
| react + react-dom | UI framework |
| react-router-dom | Client-side routing |
| firebase | Firebase SDK |
| zustand | Global UI state |
| @radix-ui/* | Accessible UI primitives (shadcn/ui) |
| leaflet + react-leaflet | Map rendering |
| recharts | Analytics charts |
| react-hook-form | Form state management |
| @hookform/resolvers | Zod validation integration |
| zod | Schema validation |
| sonner | Toast notifications |
| lucide-react | Icon library |
| class-variance-authority | Component variant styling |
| clsx + tailwind-merge | Class name utilities |
| date-fns | Date formatting |
| embla-carousel-react | Carousel (installed, not yet used) |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| vite | Build tool |
| typescript | Type checking |
| @vitejs/plugin-react | React Vite plugin |
| vitest | Unit testing |
| eslint 9 + plugins | Code linting |
| prettier | Code formatting |
| tailwindcss | CSS utility framework |
| autoprefixer | CSS vendor prefixes |

---

## Scripts Reference

```bash
npm run dev         # Start development server (port 5173)
npm run build       # Production build to dist/
npm run preview     # Preview production build locally
npm run lint        # ESLint check
npm run typecheck   # TypeScript check (tsc -b, no emit)
npm test            # Run all Vitest unit tests
npm run deploy      # Build + deploy hosting only
npm run deploy:all  # Build + deploy hosting + rules + indexes
```

---

## Admin Access Setup

After deploying, set up admin access:

1. Sign up with admin@nestmate.com
2. In Firebase Console > Firestore > Create document:
   ```
   Collection: config
   Document ID: admin
   Fields: { adminEmails: ["admin@nestmate.com"] }
   ```
3. Or create in admins collection:
   ```
   Collection: admins
   Document ID: (auto)
   Fields: { email: "admin@nestmate.com", role: "admin", name: "Admin" }
   ```

---

## .gitignore Checklist

Ensure these are in .gitignore:
- .env.local
- .env.*.local
- node_modules/
- dist/
- .firebase/

