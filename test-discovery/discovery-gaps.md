# NestMate — Discovery Gaps & Verification Boundaries
_Zero-Assumption Audit · Discovery Phase Only_

This document explicitly enumerates every feature, route, integration, or behavior that could **not** be fully verified end-to-end during this discovery audit, along with the precise technical rationale.

---

## 1. Third-Party & Carrier Services

### 1.1 Real SMS Carrier OTP Delivery
- **Observation:** `VerifyPhone.tsx` and `useAuth.ts` implement `signInWithPhoneNumber` and `RecaptchaVerifier`.
- **Gap:** Live carrier SMS dispatch could not be tested without consuming paid carrier quotas and physical SIM cards.
- **Evidence:** Code confirms standard Firebase phone auth integration; test phone numbers in Firebase Auth console are required for automated headless testing.

### 1.2 Push Notification Server Dispatch (FCM)
- **Observation:** `usePushNotifications.ts` requests browser notification permissions and writes `fcmToken` to `users/{uid}`.
- **Gap:** The repository is a pure client-side SPA (no backend server or Firebase Cloud Functions directory). There is no active server process in this repo to dispatch FCM push payloads when a user receives a new chat message or inquiry.
- **Evidence:** Code confirms client-side token acquisition only.

### 1.3 Government DigiLocker / Aadhaar Automated API
- **Observation:** `components/DigiLockerModal.tsx` and `components/AadhaarVerifyModal.tsx` exist in the codebase.
- **Gap:** Government DigiLocker OAuth / UIDAI OTP API endpoints are not connected to external gateways.
- **Evidence:** Active verification operates via document file upload (`OwnerVerificationGate.tsx` -> Firebase Storage `/verifications/{uid}/...`) followed by human administrative review in `AdminVerifications.tsx`.

---

## 2. Incomplete or Dormant Codebase Artifacts

### 2.1 Team Formation Component (`CreateTeamModal.tsx`)
- **Observation:** `src/components/CreateTeamModal.tsx` contains a multi-input modal for forming roommate groups (Team Name, Budget, Locality, Friends to Invite).
- **Gap:** There is no active button, menu link, or router entry point in the running application connecting to this modal.
- **Evidence:** The component exists in source code but is orphaned from the current user flows.

### 2.2 Digital Rental Agreement Multi-Party Flow
- **Observation:** `firestore.rules` contains definitions for `/agreements/{agreementId}` and `/agreementOTPs/{agreementId}`, and `jspdf` is installed.
- **Gap:** A complete end-to-end multi-party agreement drafting, OTP signing, and counter-signing flow is not exposed on user dashboards.
- **Evidence:** Rules and libraries exist in code, but the full UI pipeline is incomplete.

### 2.3 Legacy Phone Login Stubs
- **Observation:** Routes `/phone-login` and `/verify-otp` exist in `App.tsx` and redirect to `/login`.
- **Gap:** `src/pages/PhoneLogin.tsx` is an empty 105-byte stub.
- **Evidence:** Source code shows these were deprecated in favor of unified `/login` and `/verify-phone`.

---

## 3. Environment & Credential Specifics

### 3.1 Admin Password Login vs Google OAuth
- **Observation:** `mukvr46@gmail.com` is configured in `firestore.rules` and `useAdmin.ts` as an authorized administrator.
- **Gap:** Submitting `mukvr46@gmail.com` with password `mukesh@123` on `/login` returned a Firebase Auth credential conflict indicating the account is linked to Google OAuth or has an alternate password in the live Firebase project.
- **Evidence:** Admin dashboard was confirmed by code audit; Seeker login (`seeker@example.com` / `password123`) succeeded and verified all authenticated seeker/owner features.

### 3.2 EmailJS Usage
- **Observation:** `@emailjs/browser` is declared in `package.json`.
- **Gap:** Core email workflows (password reset) execute natively through Firebase Auth (`sendPasswordResetEmail`). Direct EmailJS dispatch triggers appear to be legacy or unused.

---

## 4. Verification Confidence Summary

| Area | Status | Evidence Level |
|------|--------|----------------|
| Routing and Navigation (43 Pages/Routes) | CONFIRMED | BOTH_CODE_AND_UI_CONFIRMED |
| Public Marketplace & Search (Rooms & Roommates) | CONFIRMED | BOTH_CODE_AND_UI_CONFIRMED |
| Advanced Filters (Budget, Locality, Gender, Furnishing) | CONFIRMED | BOTH_CODE_AND_UI_CONFIRMED |
| Authentication (Google, Email/Password, Reset) | CONFIRMED | BOTH_CODE_AND_UI_CONFIRMED |
| Seeker Onboarding & Lifestyle Quiz | CONFIRMED | BOTH_CODE_AND_UI_CONFIRMED |
| Dynamic Trait & 10-Point Compatibility Engine | CONFIRMED | BOTH_CODE_AND_UI_CONFIRMED |
| Owner Dashboard & Listing Creation (/edit-listing/new) | CONFIRMED | BOTH_CODE_AND_UI_CONFIRMED |
| Connection Requests & Connect Limit (5 Quota) | CONFIRMED | BOTH_CODE_AND_UI_CONFIRMED |
| Real-Time Chat & WhatsApp Unlocking Rules | CONFIRMED | BOTH_CODE_AND_UI_CONFIRMED |
| Firestore Security Rules (478 Lines, 20 Collections) | CONFIRMED | CODE_CONFIRMED |
| Admin Backoffice (Users, Listings, Reports, Verifications) | CONFIRMED | CODE_CONFIRMED |
| Responsive Layouts (Desktop vs Mobile Drawer/Bottom Sheets) | CONFIRMED | BOTH_CODE_AND_UI_CONFIRMED |
| Real SMS Carrier Dispatch | UNVERIFIED | UNCERTAIN (Requires Carrier SIMs) |
| Live FCM Push Notification Server Dispatch | PARTIAL | UNCERTAIN (No Backend Functions) |
| DigiLocker Government Gateway Integration | PARTIAL | CODE_CONFIRMED (Mock Only) |
