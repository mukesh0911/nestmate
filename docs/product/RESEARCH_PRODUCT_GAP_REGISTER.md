# NestMate — Research-to-Product Gap Register
**Standard**: RESEARCH TRACEABILITY & PRODUCT COMPLETENESS  
**Date**: 2026-08-26  

---

## 1. Executive Summary

This Gap Register maps the pain points and user requirements identified during the original market, competitive, and user research for NestMate against the actual production implementation.

---

## 2. Master Gap & Completeness Matrix

| Gap / Finding ID | Research Source | Pain Point / Requirement | Priority | Implementation State | Research Resolution Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-001** | `01_PRODUCT` §3.1, `02_REQUIREMENTS` FR-03.2 | Lifestyle Incompatibility & Flatmate Conflicts | **CRITICAL** | 10-question lifestyle quiz + string-equality scoring engine (`matching.ts`) + match explanation modal (`getMatchReasons`) | 🟢 **FULLY SOLVED** |
| **GAP-002** | `01_PRODUCT` §3.1, `02_REQUIREMENTS` FR-04.4 | Unverified Strangers & Identity Uncertainty | **CRITICAL** | 4-tier trust ladder (`TrustBadge.tsx`), admin verification queue (`AdminVerifications.tsx`), rule-gated `isVerified` flag | 🟢 **FULLY SOLVED** |
| **GAP-003** | `01_PRODUCT` §3.1, `02_REQUIREMENTS` FR-07.6 | Contact PII Leaks & Unsolicited Spam | **CRITICAL** | Strict `privateUserData/{uid}` quarantine, owner-only rules, mutual consent handshake in chat (`phoneShare.ts`) | 🟢 **FULLY SOLVED** |
| **GAP-004** | `01_PRODUCT` §3.1, `03_USER_EXPERIENCE` Persona 3 | Gender Safety & Harassment Vulnerability | **CRITICAL** | Gender preference filters, verified trust badges, tamper-proof user report & block engine (`reportValidation.ts`) | 🟢 **FULLY SOLVED** |
| **GAP-005** | `02_REQUIREMENTS` FR-04.5/6, `10_SECURITY` §6 | Abusive Actors & Inability to Sanction | **CRITICAL** | Non-bypassable reporting queue (`reports/`), real-time account blocking (`BlockedAccountScreen`), admin moderation actions | 🟢 **FULLY SOLVED** |
| **GAP-006** | `GAP_MATRIX` #2, `08_BUSINESS_LOGIC` §3 | Stale / Abandoned / Already-Filled Listings | **HIGH** | `lastConfirmedAt` availability tracking, 14/45-day freshness decay, owner status toggles (`listingFreshness.ts`) | 🟢 **FULLY SOLVED** |
| **GAP-007** | `01_PRODUCT` §3.1, `02_REQUIREMENTS` FR-03.3 | Unaffordable Listings & Budget Mismatch | **HIGH** | Exact partner rent bounds filtering (`listingFilters.ts`), price sorting, budget overlap analysis in match reasons | 🟢 **FULLY SOLVED** |
| **GAP-008** | `GAP_MATRIX` #1, `08_BUSINESS_LOGIC` §2 | Owner Applicant Triage Bottleneck | **HIGH** | Explainable applicant ranking engine (`applicantRanking.ts`) sorting applicants by fit, budget, trust, and ties | 🟢 **FULLY SOLVED** |
| **GAP-009** | `02_REQUIREMENTS` FR-09.1-3, `03_UX` §4 | Disorganized Discovery Across Social Groups | **HIGH** | Unified Explore page (`ExplorePage.tsx`), Leaflet geocoded interactive map (`MapView.tsx`), combined room/flatmate tabs | 🟢 **FULLY SOLVED** |
| **GAP-010** | `01_PRODUCT` §11, `GAP_MATRIX` #7 | Pay-to-Message Barrier & Monetization Friction | **HIGH** | Core connection requests and real-time chat are 100% free with honest pricing disclosures (`PricingPage.tsx`) | 🟢 **FULLY SOLVED** |
| **GAP-011** | `02_REQUIREMENTS` FR-01.6, `03_UX` Flow 1 | Broken Onboarding Progression & Session State Loss | **HIGH** | Synchronized auth hydration, `OnboardingGuard` state locks, role-aware dashboards, and persistent Firestore profiles | 🟢 **FULLY SOLVED** |
| **GAP-012** | `01_PRODUCT` §11, `02_REQUIREMENTS` FR-02.2 | Ignoring India-Specific Cultural Nuances | **HIGH** | Veg/non-veg dietary preferences, smoking/drinking, house visitor rules, Indian metro city presets | 🟢 **FULLY SOLVED** |
| **GAP-013** | `GAP_MATRIX` #4, `08_BUSINESS_LOGIC` §4 | Misleading Verification Claims & Fake Badges | **HIGH** | Display truth architecture (`displayTruth.ts`) guaranteeing badges only render upon real provider/admin verification | 🟢 **FULLY SOLVED** |
| **GAP-014** | `GAP_MATRIX` #5, `08_BUSINESS_LOGIC` §1 | Opaque Compatibility Scores Without Context | **MEDIUM** | Real-time match reason and caveat breakdown (`getMatchReasons`) showing exact shared traits and location distance | 🟢 **FULLY SOLVED** |
| **GAP-015** | `02_REQUIREMENTS` FR-07.1-5 | Communication Latency & Message Ghosting | **MEDIUM** | Real-time Firestore chat subscriptions, typing indicators, double-check read receipts, and recency indicators | 🟢 **FULLY SOLVED** |
| **GAP-016** | `GAP_MATRIX` #8, `03_UX` Journey 2 | Offline Inspection Anxiety & Meeting Safety | **MEDIUM** | Clear in-app phone consent step, safety guidance, and active report/block options throughout chat | 🟢 **FULLY SOLVED** |
| **GAP-017** | `02_REQUIREMENTS` FR-05.4-7 | Inability to Manage Property Lifecycle | **MEDIUM** | Dedicated Owner Dashboard (`OwnerDashboard.tsx`), listing pause/fill toggles, weekly views analytics chart | 🟢 **FULLY SOLVED** |
| **GAP-018** | `02_REQUIREMENTS` FR-10.2 | Multi-Language Usability in Metro Hubs | **LOW** | `useTranslation.ts` supporting 4 Indian languages (English, Hindi, Tamil, Telugu) across core navigation | 🟢 **FULLY SOLVED** |
| **GAP-019** | `02_REQUIREMENTS` FR-03.9-10 | Accidental Swipe / Skip Recovery | **LOW** | 5-second undo toast window on profile skips and persistent saved bookmarks tab | 🟢 **FULLY SOLVED** |
| **GAP-020** | `01_PRODUCT` §15, `GAP_MATRIX` #4 | Automated Real-Time DigiLocker/Aadhaar e-KYC | **MEDIUM** | Manual document upload + Admin review queue implemented; automated API gateway integration planned for Phase 2 | ⚠️ **IMPLEMENTED (MANUAL QUEUE) / AUTOMATED GATEWAY FUTURE** |

---

## 3. Detailed Gap Register by Priority

### Priority 1: CRITICAL Gaps & Verifications

#### GAP-001: Lifestyle Incompatibility & Flatmate Conflicts
- **Research Source**: `docs/01_PRODUCT/README.md` §3.1, `docs/02_REQUIREMENTS/README.md` FR-03.2.
- **Pain Point**: Roommates experiencing conflict within weeks due to misaligned sleep, food, cleanliness, and WFH habits.
- **Priority**: **CRITICAL**.
- **Expected Solution**: Multi-dimensional lifestyle questionnaire producing an exact mathematical compatibility score with data-backed explanations.
- **Current Implementation**:
  - `SeekerOnboarding.tsx` enforces 10 lifestyle questions (sleep, diet, smoking, drinking, cleanliness, guests, work schedule, pets, cooking, noise).
  - `matching.ts` computes string-equality compatibility percentage with cross-city penalty cap (60%).
  - `getMatchReasons` extracts positive matching traits and honest caveats.
- **Verification Method**: Unit tests (`compatibility.test.ts`, `matchQuality.test.ts`), Master E2E Journey A & E.
- **Status**: 🟢 **FULLY SOLVED**.

---

#### GAP-002: Unverified Strangers & Identity Uncertainty
- **Research Source**: `docs/01_PRODUCT/README.md` §3.1, `docs/03_USER_EXPERIENCE/README.md` Persona 3.
- **Pain Point**: Lack of trust in online listings and fear of financial/physical fraud from fake profiles.
- **Priority**: **CRITICAL**.
- **Expected Solution**: Progressive trust ladder with real verification gates (Phone OTP, Work Email, Government ID moderation).
- **Current Implementation**:
  - `TrustBadge.tsx` calculates deterministic Bronze ➔ Silver ➔ Gold ➔ Verified Pro status.
  - `EditProfile.tsx` uploads government ID documents to private Storage.
  - `AdminVerifications.tsx` provides review queue for admins to approve (`isVerified: true`) or reject.
  - Firestore rules strictly block user-side self-elevation of trust fields.
- **Verification Method**: Unit tests (`trustSignals.test.ts`, `security.test.ts`), Adversarial E2E Phase 6.
- **Status**: 🟢 **FULLY SOLVED**.

---

#### GAP-003: Contact PII Leaks & Unsolicited Spam
- **Research Source**: `docs/01_PRODUCT/README.md` §3.1, `docs/02_REQUIREMENTS/README.md` FR-07.6.
- **Pain Point**: Mobile numbers posted publicly get scraped by brokers and scammers, causing harassment.
- **Priority**: **CRITICAL**.
- **Expected Solution**: Contact fields quarantined to private records; numbers shared only upon mutual consent.
- **Current Implementation**:
  - Contact information is isolated in `privateUserData/{uid}` with rule-level owner access only.
  - `useChat.ts` and `phoneShare.ts` enforce a two-way handshake (`requestPhoneShare` ➔ `acceptPhoneShare`) before revealing decrypted contact details.
- **Verification Method**: Unit tests (`phoneShare.test.ts`), Master E2E Journey E.
- **Status**: 🟢 **FULLY SOLVED**.

---

#### GAP-004: Gender Safety & Harassment Vulnerability
- **Research Source**: `docs/01_PRODUCT/README.md` §3.1, `docs/03_USER_EXPERIENCE/README.md` Persona 3 (Divya).
- **Pain Point**: Women relocating to metro cities face unsafe shared housing without verified gender preferences or female-only filters.
- **Priority**: **CRITICAL**.
- **Expected Solution**: Gender-specific filtering, female-only room badges, and robust user safety tools.
- **Current Implementation**:
  - `listingFilters.ts` and `SeekerDashboard.tsx` support female-only flatmate and room filtering.
  - Verification badges clearly show verified status.
  - `reportValidation.ts` and `useUserProfile.ts` provide instant blocking and reporting mechanisms.
- **Verification Method**: Unit tests (`roleFiltering.test.ts`, `connectionGuards.test.ts`), Master E2E.
- **Status**: 🟢 **FULLY SOLVED**.

---

### Priority 2: HIGH Gaps & Verifications

#### GAP-006: Stale / Abandoned / Already-Filled Listings
- **Research Source**: `docs/product/NESTMATE_PRODUCT_GAP_MATRIX.md` #2, `docs/08_BUSINESS_LOGIC/README.md` §3.
- **Pain Point**: Users waste time contacting owners whose rooms were filled weeks ago.
- **Priority**: **HIGH**.
- **Expected Solution**: Automated listing decay and owner availability confirmation.
- **Current Implementation**:
  - `listingFreshness.ts` computes freshness tiers (Fresh ≤ 14d, Active ≤ 45d, Stale > 45d).
  - Owner dashboard provides 1-tap "Confirm Available" action updating `lastConfirmedAt`.
  - Stale and inactive listings are excluded from marketplace discovery (`marketplaceVisibility.ts`).
- **Verification Method**: Unit tests (`listingFreshness.test.ts`, `marketplaceVisibility.test.ts`), Master E2E Journey B.
- **Status**: 🟢 **FULLY SOLVED**.

---

#### GAP-008: Owner Applicant Triage Bottleneck
- **Research Source**: `docs/product/NESTMATE_PRODUCT_GAP_MATRIX.md` #1, `docs/08_BUSINESS_LOGIC/README.md` §2.
- **Pain Point**: Room owners receive dozens of unranked inquiries and cannot identify the best flatmate match.
- **Priority**: **HIGH**.
- **Expected Solution**: Explainable applicant ranking engine on the Owner Dashboard.
- **Current Implementation**:
  - `applicantRanking.ts` ranks incoming connection requests by lifestyle compatibility score, budget alignment, location proximity, trust level, and recency.
  - Owner Dashboard displays badge-supported reasons and honest caveats per applicant.
- **Verification Method**: Unit tests (`applicantRanking.test.ts`), Master E2E Journey B.
- **Status**: 🟢 **FULLY SOLVED**.

---

## 4. Conclusion & Core Verdict

All **CRITICAL** and **HIGH** priority research requirements have been traced directly to authentic, working, tested implementations across the NestMate frontend, backend, security rules, and real-time synchronization layers.
