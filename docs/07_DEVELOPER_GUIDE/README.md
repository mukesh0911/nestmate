# 07 — Developer Guide

> **Purpose**: Everything a developer needs to clone, run, understand, and contribute to NestMate  
> **Audience**: New developers, AI agents, contributors  
> **Dependencies**: [05 Architecture](../05_ARCHITECTURE/README.md)  
> **Related**: [06 Database](../06_DATABASE/README.md) · [10 Security](../10_SECURITY/README.md)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | ≥ 18.x | JavaScript runtime |
| **npm** | ≥ 9.x | Package manager |
| **Git** | Latest | Version control |
| **Firebase CLI** | Latest | Deploy, emulators | 
| **VS Code** (recommended) | Latest | IDE |

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd roomate/app

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your Firebase project credentials (see below)

# 4. Start development server
npm run dev
# → http://localhost:5173

# 5. (Optional) Deploy to Firebase Hosting
npm run deploy
```

---

## Environment Variables

Create `.env` in `app/` with these keys:

```env
# Firebase Configuration (required)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Razorpay (optional — mock checkout if missing)
VITE_RAZORPAY_KEY_ID=rzp_test_mockkey12345
```

**Note**: All environment variables must be prefixed with `VITE_` to be accessible in the client bundle (Vite requirement).

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server at `localhost:5173` |
| `build` | `tsc -b && vite build` | TypeScript check + production build |
| `preview` | `vite preview` | Preview production build locally |
| `lint` | `eslint .` | Run ESLint |
| `deploy` | `npm run build && firebase deploy --only hosting` | Build + deploy hosting |
| `deploy:all` | `npm run build && firebase deploy` | Deploy everything (hosting + rules + indexes) |
| `deploy:rules` | `firebase deploy --only firestore:rules,storage` | Deploy security rules only |
| `deploy:indexes` | `firebase deploy --only firestore:indexes` | Deploy Firestore indexes |

---

## Project Conventions

### File Naming
| Type | Convention | Example |
|------|-----------|---------|
| Pages | PascalCase | `SeekerDashboard.tsx` |
| Components | PascalCase | `TrustBadge.tsx` |
| Hooks | camelCase with `use` prefix | `useMatches.ts` |
| Utilities | camelCase | `imageCompressor.ts` |
| CSS | kebab-case or index | `index.css` |

### Import Aliases
- `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`)
- Example: `import { useAuth } from '@/hooks/useAuth'`

### Code Patterns

**Hooks for business logic**:
```typescript
// Every domain area has a dedicated hook
export function useFeature() {
  // Firebase SDK calls
  // Business logic functions
  // Return functions and reactive state
  return { functionA, functionB, stateC };
}
```

**Lazy-loaded routes**:
```typescript
const SeekerDashboard = lazy(() => import('./pages/SeekerDashboard'));
```

**Firestore real-time subscriptions**:
```typescript
useEffect(() => {
  const unsub = onSnapshot(query, (snapshot) => {
    // Process snapshot
  });
  return () => unsub(); // Always cleanup
}, [dependencies]);
```

---

## Key Dependencies

### Core
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19.2.0 | UI framework |
| `react-dom` | 19.2.0 | DOM rendering |
| `react-router-dom` | 7.14.1 | Client-side routing |
| `typescript` | 5.9.3 | Type safety |
| `vite` | 7.2.4 | Build tool + dev server |

### Firebase
| Package | Version | Purpose |
|---------|---------|---------|
| `firebase` | 12.12.1 | Auth + Firestore + Storage |

### UI
| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 3.4.19 | Utility CSS |
| `@radix-ui/*` | Various | Accessible UI primitives |
| `lucide-react` | 0.523.0 | Icon library |
| `sonner` | 2.0.3 | Toast notifications |
| `vaul` | 1.1.2 | Mobile drawer component |
| `recharts` | 2.15.4 | Charts (admin + owner) |
| `react-leaflet` | 5.0.0 | Map components |
| `leaflet` | 1.9.4 | Map engine |

### Forms
| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | 7.70.0 | Form state management |
| `@hookform/resolvers` | 5.0.1 | Validation integration |
| `zod` | 4.3.5 | Schema validation |

### State
| Package | Version | Purpose |
|---------|---------|---------|
| `zustand` | 5.0.12 | Lightweight state management |

---

## Architecture Rules

1. **No backend server** — All data flows through Firebase SDKs
2. **Hooks own business logic** — Pages are thin presentational components
3. **Zustand for UI state only** — No data caching in Zustand; Firestore is the source of truth
4. **Lazy load all pages** — Use `React.lazy()` for code splitting
5. **Firestore rules are the auth layer** — Don't rely solely on client-side checks
6. **Compress before upload** — All images go through `imageCompressor.ts`
7. **Rate limit external APIs** — All Nominatim calls go through the geocoding queue

---

## Firebase Setup

### Firestore Indexes
After deploying for the first time, ensure composite indexes are created:
```bash
firebase deploy --only firestore:indexes
```

12 composite indexes are defined in `firestore.indexes.json`. These are required for:
- User queries (city + role + onboarding status)
- Listing queries (status + city + creation date)
- Connection queries (user + status + date)
- Chat room queries (participant + last message date)
- Notification queries (user + date)
- Match queries (user + date)

### Firestore Rules
Security rules are defined in `firestore.rules` (146 lines). Deploy with:
```bash
firebase deploy --only firestore:rules
```

### Storage Rules
Storage rules are in `storage.rules` (31 lines). Deploy with:
```bash
firebase deploy --only storage
```

---

## Development Data

### Seed Data
The app includes a seeding mechanism at `/seed-data` (dev only):
- 6 mock room listings across 6 cities
- 5 mock seeker profiles
- Source: `lib/mockData.ts`
- Seeded via `scripts/seed-client.ts`

### Test Admin Access
- Any email ending in `@nestmate.com` gets admin access
- Admin routes: `/admin/*`
- No custom claims needed — enforced via Firestore rules email check

---

## Debugging Tips

| Issue | Solution |
|-------|---------|
| Firestore permission denied | Check `firestore.rules` + ensure user is authenticated |
| Missing indexes | Run `firebase deploy --only firestore:indexes` |
| Images not loading | Check `storage.rules` + verify Storage CORS config |
| Geocoding fails | Rate limit hit — check `useGeocoding.ts` queue |
| Dark mode not persisting | Check `settings.darkMode` in user's Firestore doc |
| Match list empty | Ensure seed data exists + onboarding is complete |
| OTP not sending | Check Firebase Auth Phone provider is enabled |

---

*→ Next: [08 Business Logic](../08_BUSINESS_LOGIC/README.md)*
