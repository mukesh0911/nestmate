# NestMate — Final Unsolved Pain Points & Strategic Backlog
**Standard**: HONEST GAP ANALYSIS & RESIDUAL ROADMAP  
**Date**: 2026-08-26  

---

## 1. Summary of Residual Gaps

All **CRITICAL** and **HIGH** priority research pain points have been resolved in the current production codebase. The items below represent **MEDIUM** and **LOW** priority operational / third-party scaling enhancements planned for post-launch releases.

---

## 2. Residual Gap Register

### 1. [MEDIUM] Automated DigiLocker / Aadhaar e-KYC Gateway Integration
- **Original Pain Point**: Manual human document review introduces verification latency (hours to 1 day) during peak sign-up surges.
- **Current Behavior**: Users upload ID documents (Aadhaar, Work ID, Student ID) to private Cloud Storage; administrators review documents in `AdminVerifications.tsx` and approve/reject with notes.
- **Why Current Solution Is Insufficient for Ultra-High Scale**: Works cleanly for initial launch (up to ~500 verifications/day), but ultra-high volume (> 5,000/day) requires real-time automated API verification.
- **Exact Code Change Required for Future Phase**:
  - Integrate DigiLocker / Setu API Cloud Function endpoint (`api/verifyAadhaar`).
  - Add backend webhook listener to update `isVerified: true` automatically upon UIDAI OTP confirmation.
- **Acceptance Criteria**:
  - User submits Aadhaar number ➔ receives UIDAI OTP ➔ profile verified in < 30 seconds without admin intervention.

---

### 2. [MEDIUM] Dedicated Commercial Map Tile Infrastructure
- **Original Pain Point**: OpenStreetMap / Nominatim public tile endpoints enforce 1.1s rate limiting, which can throttle high-frequency map panning during massive concurrent user surges.
- **Current Behavior**: `useGeocoding.ts` enforces a 1.1-second global rate limit queue with local coordinate caching and hash fallbacks.
- **Why Current Solution Is Insufficient for Ultra-High Scale**: Under high concurrent load (> 10,000 simultaneous map users), OSM tile requests may experience intermittent rate limiting.
- **Exact Code Change Required for Future Phase**:
  - Provision dedicated Mapbox or Google Maps API key in `.env` (`VITE_MAPBOX_TOKEN`).
  - Update `MapView.tsx` tile layer URL to point to high-throughput commercial CDN.
- **Acceptance Criteria**:
  - Zero tile loading latency or throttling across 1,000+ concurrent map zoom/pan operations.

---

### 3. [LOW] Full Multi-Language Quiz Questionnaire Translation
- **Original Pain Point**: Non-English speakers in Tier 1/2 hubs prefer taking the 10-question compatibility quiz in their native language (Hindi, Tamil, Telugu).
- **Current Behavior**: `useTranslation.ts` provides complete translations for navigation, button labels, and status badges across English, Hindi, Tamil, and Telugu; the 10 quiz questions and options are currently in English.
- **Why Current Solution Is Insufficient for Full Multilingual Immersion**: Users must read quiz questions in English while UI controls are in regional languages.
- **Exact Code Change Required for Future Phase**:
  - Expand `staticData.ts` to support localized question text and answer option strings keyed by `language`.
  - Update `SeekerOnboarding.tsx` to render `q.translations[currentLang] || q.title`.
- **Acceptance Criteria**:
  - Selecting Hindi translates all 10 lifestyle questions, options, and quiz summaries seamlessly.

---

## 3. Impact Assessment

None of the residual backlog items block initial production deployment. The platform operates safely, securely, and truthfully across all core user flows.
