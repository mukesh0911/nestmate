# NestMate — Changelog

All notable product and engineering changes after the production baseline.

Format: newest first. Each entry should include what / why / files / testing when material.

---

## 2026-08-03 — Landing mobile alignment fix

### What changed
- Hero showcase: `no-scrollbar` → `scrollbar-hide`; tighter card padding; Connect CTA full-width then prev/Skip/next row; compatibility chips use `line-clamp-2`
- Landing: social proof wraps with `min-w-0`; mobile hides redundant Browse/Flatmates (search tabs cover them); Instant Demo kept; showcase column less padded on small screens

### Why
- Screenshot bugs: horizontal scrollbar, overlapping/“duplicated” Connect row, truncated chips, social-proof overflow, CTA clutter — without changing guest/auth/demo strategy

### Strategy preserved
- Guest browse / auth-on-action / Demo only on explicit click

### Testing / regression
- `npm run build` (Vite) — pass
- Layout classes reviewed for ~390 / 768 / 1280 (2-row CTA, desktop browse buttons restored at `sm+`)

### Files
- `app/src/components/HeroMatchShowcase.tsx`, `app/src/pages/LandingPage.tsx`
- `CHANGELOG.md`, `PROJECT_STATUS.md`, `MOBILE_DESIGN_AUDIT.md`

---

## 2026-08-03 — Mobile-first responsive audit

### What changed
- Safe-area + mobile shell utilities (`pb-safe`, `bottom-above-nav`, `h-app-mobile`, `touch-target`)
- Layout: overflow guard, safe-area main padding, larger bottom-nav touch targets; Demo remains explicit-only (no auto pulse)
- MatchDetail CTA + BrowseRooms map FAB cleared above bottom nav
- Chat/Map heights respect mobile bottom nav without double scroll
- AuthModal mobile bottom-sheet; Landing/BrowseSeekers/Settings spacing polish
- Smoke expanded: mobile browse, horizontal overflow check, tablet dashboard

### Why
- Fixed clipped CTAs, underlapped chat/map, missing safe-area, and uneven mobile padding without redesigning

### Strategy preserved
- Guest browse without forced login
- Auth modal only on account actions with redirect context
- Demo only on explicit Demo / demo buttons

### Testing / regression
- `tsc -b` + `npm test` — pass
- Local smoke — **33/33**, P0=0, P1=0 (desktop + mobile + tablet)
- Auth strategy untouched

### Files
- `app/src/index.css`, `Layout.tsx`, `AuthModal.tsx`
- `MatchDetail.tsx`, `BrowseRooms.tsx`, `BrowseSeekers.tsx`, `ChatPage.tsx`, `MapView.tsx`, `LandingPage.tsx`, `RoomDetail.tsx`, `SettingsPage.tsx`, `SeekerDashboard.tsx`
- `app/scripts/smoke-browser.ts`, `PROJECT_STATUS.md`

---

## 2026-08-03 — Hosting deploy: UI/UX polish

### What changed
- Built production bundle and deployed to Firebase Hosting (`nestmate-eb562`)
- Live client version: `index-D7-Bo4nk.js` + `index-DiyJV2-4.css`

### Why
- Ship the verified UI/UX polish pass so production matches the local polished build

### Deployment
- `npm run build` — exit 0
- `firebase deploy --only hosting` — success
- URL: https://nestmate-eb562.web.app

### Testing / regression
- Local vs prod asset hashes: **match**
- Production smoke: **30/30**, P0=0, P1=0

---

## 2026-08-03 — UI/UX polish pass

### What changed
- Shared NestMate UI primitives: `StateEmpty`, `StateLoading` / `StateSkeletonGrid`, `PageShell`
- `.btn-primary` aliased to `.btn-fire`
- Unified empty/loading chrome; practical `aria-label`s; subtle `page-transition`

### Testing / regression
- Local smoke 30/30; unit tests 21; tsc clean

---

## 2026-08-03 — Production baseline

Security hardening (trust locks, private PII), demo email auth, hosting + smoke verified. See prior session notes in `PROJECT_STATUS.md`.
