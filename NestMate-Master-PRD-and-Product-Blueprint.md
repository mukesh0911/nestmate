# 📜 NestMate — Master Product Requirements Document (PRD) & Engineering Blueprint
### Industry-Standard Product Specification & Technical Reference Document
**Document ID:** PRD-2026-v3.0  
**Version:** 3.0 (Production Release & Growth Roadmap)  
**Target Audience:** Founders, Senior Developers, QA Engineers, Product Managers, Investors  
**Status:** Approved & Live  

---

## Table of Contents
1. [Product Overview & Strategic Vision](#1-product-overview--strategic-vision)
2. [Target Audience & User Personas](#2-target-audience--user-personas)
3. [System Architecture & Technology Stack](#3-system-architecture--technology-stack)
4. [Database & Data Schema Specification](#4-database--data-schema-specification)
5. [Module-by-Module Functional & Technical Specs](#5-module-by-module-functional--technical-specs)
6. [Lifestyle Compatibility Engine Mathematical Specification](#6-lifestyle-compatibility-engine-mathematical-specification)
7. [Developer Implementation & Handoff Guide](#7-developer-implementation--handoff-guide)
8. [Phased Product Roadmap & Future Feature Backlog](#8-phased-product-roadmap--future-feature-backlog)
9. [Competitive Teardown & Feature Differentiation Matrix](#9-competitive-teardown--feature-differentiation-matrix)
10. [Quality Assurance, Security & Governance](#10-quality-assurance-security--governance)

---

## 1. Product Overview & Strategic Vision

### 1.1 Executive Summary
**NestMate** is India's first lifestyle-centric roommate-matching platform. While traditional real estate applications (e.g., NoBroker, MagicBricks, Housing.com) treat shared housing strictly as a property listing service, NestMate flips the paradigm by treating roommate discovery like **compatibility-based social matching** combined with hyper-local property discovery.

NestMate solves the **"Stranger Danger"** and **"Lifestyle Mismatch"** problems by assessing 10 core lifestyle vectors (sleep schedule, food preferences, cleanliness, work mode, guest policies, smoking/alcohol habits, and pet preferences) to generate a dynamic 0–100% lifestyle compatibility score before users initiate contact.

### 1.2 Problem Statement
In major Indian tech hubs (Bengaluru, Chennai, Hyderabad, Pune, Mumbai, Delhi NCR), over 8 million young professionals and college students migrate annually. They face three main issues:
1. **High Brokerage Fees:** Renters lose ₹10,000–₹35,000 per transaction to unorganized brokers.
2. **Lifestyle Mismatches:** 68% of shared-flat arrangements collapse within 6 months due to incompatible living habits (e.g., night owls vs. early risers, vegetarian vs. non-vegetarian kitchen conflicts).
3. **Safety & Fraud Anxiety:** Unverified posts on Facebook/WhatsApp groups expose users to rental deposit scams, fake brokers, and unvetted strangers.

### 1.3 The Solution & Value Proposition
- **Direct Seeker ↔ Owner Connections:** Zero brokers, zero middleman commissions.
- **Dynamic Compatibility Vector Algorithm:** Pure mathematical distance vector scoring across 10 lifestyle parameters.
- **3-Tiered Verification System:** Phone OTP verification + Institutional/Work Email validation + Government ID (Aadhaar) authentication.
- **Privacy-First Communication:** In-app real-time messaging with mutual phone number release approval.

---

## 2. Target Audience & User Personas

### Persona 1: The Relocating Tech Professional (Primary Seeker)
- **Profile:** Ananya, 24, Software Engineer moving from Kolkata to HSR Layout, Bengaluru.
- **Needs:** Safe accommodation near her office, a female flatmate with a similar work-from-home schedule, vegetarian kitchen, clean living space.
- **Pain Point:** Terrified of deposit scams on unmoderated Facebook groups; doesn't want to pay ₹20,000 brokerage fees.

### Persona 2: The Room Owner / Primary Tenant (Listing Owner)
- **Profile:** Karthik, 27, Senior Product Analyst living in a 3BHK flat in Velachery, Chennai. One roommate moved out.
- **Needs:** Find a quiet, non-smoking replacement roommate to split ₹12,000 rent share within 14 days.
- **Pain Point:** Received 50+ random calls from brokers on traditional listing portals; wants to pre-screen flatmates before sharing flat location.

---

## 3. System Architecture & Technology Stack

### 3.1 Technology Stack Architecture
NestMate is engineered as a zero-server-maintenance, highly responsive Single Page Application (SPA) designed for rapid execution and low operational costs.

```
+-----------------------------------------------------------------------+
|                           CLIENT LAYER                                |
|  React 19 | TypeScript | Vite 7 | Tailwind CSS 3 | Radix UI | Lucide  |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                         STATE & ROUTING LAYER                         |
|  React Router 7 | Zustand (UI State) | Custom React Hooks (Data)     |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    BACKEND AS A SERVICE (FIREBASE)                    |
|  Firebase Auth | Cloud Firestore NoSQL | Firebase Storage | Hosting   |
+-----------------------------------------------------------------------+
```

| Layer | Technology | Selection Rationale |
| :--- | :--- | :--- |
| **Frontend Core** | React 19 + TypeScript | Type safety, reactive UI state, component reusability. |
| **Build Engine** | Vite 7 | Sub-second HMR, optimized tree-shaking, production bundling. |
| **Styling System** | Tailwind CSS 3 + Radix UI | Accessible primitives, custom design system tokens, responsive design. |
| **Global State** | Zustand | Lightweight UI-only state (filters, role, active modals). |
| **Backend & Database** | Firebase Cloud Firestore | Serverless NoSQL, real-time snapshot listeners (`onSnapshot`), instant query execution. |
| **Authentication** | Firebase Auth | Phone OTP (RecaptchaVerifier), Google OAuth, Email/Password. |
| **Storage** | Firebase Storage | Secure CDN asset storage for avatars, room photos, and ID documents. |
| **Mapping & GIS** | Leaflet.js + OpenStreetMap | Free, interactive vector maps without Google Maps API licensing costs. |

---

## 4. Database & Data Schema Specification

NestMate utilizes Cloud Firestore NoSQL. Below are the canonical schema contracts required for development.

### 4.1 `users` Collection Schema
```json
{
  "uid": "string (Primary Key, matches Firebase Auth UID)",
  "name": "string",
  "email": "string",
  "phone": "string",
  "role": "seeker | owner | null",
  "city": "string (e.g. 'Chennai', 'Bengaluru')",
  "localities": ["array of strings"],
  "budget": "number (INR)",
  "moveInDate": "ISO String (YYYY-MM-DD)",
  "profession": "string",
  "company": "string",
  "bio": "string",
  "age": "number",
  "gender": "string ('Male' | 'Female' | 'Other')",
  "avatar": "string (Storage URL or Dicebear avatar)",
  "quizAnswers": {
    "q1": "string ('1'|'2'|'3'|'4')",
    "q2": "string ('1'|'2'|'3'|'4')",
    "q3": "string ('1'|'2'|'3'|'4')",
    "q4": "string ('1'|'2'|'3'|'4')",
    "q5": "string ('1'|'2'|'3'|'4')",
    "q6": "string ('1'|'2'|'3'|'4')",
    "q7": "string ('1'|'2'|'3'|'4')",
    "q8": "string ('1'|'2'|'3'|'4')",
    "q9": "string ('1'|'2'|'3'|'4')",
    "q10": "string ('1'|'2'|'3'|'4')"
  },
  "onboardingComplete": "boolean",
  "isPremium": "boolean",
  "isVerified": "boolean",
  "verificationLevel": "number (0: Unverified, 1: Basic, 2: Work Verified, 3: Aadhaar Verified)",
  "savedProfileIds": ["array of target user UIDs"],
  "savedRoomIds": ["array of target listing IDs"],
  "skippedUserIds": ["array of target user UIDs"],
  "blockedUserIds": ["array of target user UIDs"],
  "workEmail": "string",
  "workEmailVerified": "boolean",
  "lastActiveAt": "Timestamp",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### 4.2 `listings` Collection Schema
```json
{
  "id": "string (Firestore Auto-ID)",
  "ownerId": "string (FK -> users.uid)",
  "ownerName": "string",
  "ownerAvatar": "string",
  "title": "string",
  "description": "string",
  "flatType": "string ('1BHK' | '2BHK' | '3BHK' | 'Studio')",
  "furnishing": "string ('Fully Furnished' | 'Semi-Furnished' | 'Unfurnished')",
  "city": "string",
  "locality": "string",
  "address": "string",
  "totalRent": "number (INR)",
  "partnerShare": "number (INR)",
  "partnersNeeded": "number",
  "deposit": "number (INR)",
  "amenities": ["array of strings"],
  "houseRules": ["array of strings"],
  "images": ["array of Firebase Storage image URLs"],
  "availableFrom": "ISO String",
  "lat": "number (Latitude)",
  "lng": "number (Longitude)",
  "status": "string ('active' | 'paused' | 'filled')",
  "applicants": "number",
  "views": "number",
  "isOwnerVerified": "boolean",
  "isOwnerPremium": "boolean",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

### 4.3 `connections` Collection Schema
```json
{
  "id": "string (Firestore Auto-ID)",
  "fromUserId": "string (FK -> users.uid)",
  "toUserId": "string (FK -> users.uid)",
  "status": "string ('pending' | 'accepted' | 'rejected' | 'blocked')",
  "createdAt": "Timestamp"
}
```

### 4.4 `chatRooms` & `messages` Collection Schema
```json
// chatRooms/{roomId}
{
  "id": "string",
  "participants": ["array of 2 user UIDs"],
  "matchId": "string",
  "lastMessage": "string",
  "lastMessageAt": "Timestamp",
  "createdAt": "Timestamp",
  "phoneSharing": {
    "requestedBy": "string | null",
    "acceptedBy": "string | null",
    "ownerPhone": "string | null",
    "seekerPhone": "string | null"
  }
}

// chatRooms/{roomId}/messages/{messageId}
{
  "id": "string",
  "senderId": "string",
  "content": "string",
  "read": "boolean",
  "createdAt": "Timestamp",
  "imageUrl": "string (optional)",
  "isSystem": "boolean (optional)"
}
```

---

## 5. Module-by-Module Functional & Technical Specs

### 5.1 Auth & Role-Based Access Control (RBAC) Module
- **Pages:** `LandingPage.tsx`, `AuthPage.tsx`, `PhoneLogin.tsx`, `OTPVerify.tsx`, `RoleSelect.tsx`.
- **Hooks:** `useAuth.ts`.
- **Functionality:**
  - Standard OAuth via Google + Email/Password + Phone OTP verification.
  - Role selection forces state routing to `/onboarding/seeker` or `/onboarding/owner`.
  - Automatic `OnboardingGuard` checks `onboardingComplete` boolean on every protected route.

### 5.2 Seeker Matching & Discovery Feed Module
- **Pages:** `SeekerDashboard.tsx`, `MatchDetail.tsx`, `BrowseSeekers.tsx`.
- **Hooks:** `useMatches.ts`, `useConnections.ts`.
- **Functionality:**
  - Tinder-style swipeable/actionable candidate profiles.
  - Multi-mode display: Grid View vs. List View.
  - Multi-parameter dynamic filtering (City, Budget, Locality, Gender, Verification Status).
  - Monthly connection limit enforcement (`FREE_CONNECT_LIMIT = 5`).

### 5.3 Owner Listing & Applicant Management Module
- **Pages:** `OwnerDashboard.tsx`, `OwnerOnboarding.tsx`, `EditListing.tsx`.
- **Hooks:** `useListings.ts`.
- **Functionality:**
  - Create/Edit 3-step listing builder with client-side image compression (`imageCompressor.ts`).
  - Active listing control (Toggle Active / Paused / Filled).
  - Real-time applicant viewer and chat launcher.

### 5.4 Privacy-First Real-Time Messaging Module
- **Pages:** `ChatPage.tsx`.
- **Hooks:** `useChat.ts`.
- **Functionality:**
  - Real-time snapshot listener on sub-collection `chatRooms/{roomId}/messages`.
  - Mutual phone number release workflow: Option to request contact number; number is only unmasked when recipient accepts the in-chat prompt.

### 5.5 Map View & Geographical Discovery Module
- **Pages:** `MapView.tsx`, `RoomDetail.tsx`.
- **Components:** `MapPreview.tsx`, `LocationAutocomplete.tsx`.
- **Functionality:**
  - Renders spatial listings using Leaflet tile layers.
  - Geocoding utility (`useGeocoding.ts`) converts Indian addresses/localities to spatial coordinates (`lat`, `lng`).

---

## 6. Lifestyle Compatibility Engine Mathematical Specification

NestMate implements a pure mathematical vector comparison model. Unlike competitor applications that hardcode arbitrary scores or return uniform percentages, NestMate calculates compatibility dynamically based on Firestore quiz vector data.

### 6.1 Mathematical Formulation

Let User $A$ and User $B$ have lifestyle quiz answer vectors:
$$V_A = (a_1, a_2, \dots, a_{10}), \quad a_k \in \{1, 2, 3, 4\}$$
$$V_B = (b_1, b_2, \dots, b_{10}), \quad b_k \in \{1, 2, 3, 4\}$$

For each common question $k$ answered by both profiles:
$$\text{Distance}_k = |a_k - b_k| \in \{0, 1, 2, 3\}$$

The per-question similarity ratio $S_k$ is:
$$S_k = 1 - \frac{|a_k - b_k|}{3}$$

The overall raw compatibility score $C(A, B)$ is the normalized average across all $N$ common questions:
$$C(A, B) = \left( \frac{1}{N} \sum_{k=1}^{N} S_k \right) \times 100$$

### 6.2 Score Interpretation & Mapping Table

| Per-Question Distance $|a_k - b_k|$ | Similarity Value $S_k$ | Lifestyle Meaning |
| :---: | :---: | :--- |
| **0** | $1.00$ ($100\%$) | **Exact Match** (e.g. both sleep before 10 PM) |
| **1** | $0.67$ ($67\%$) | **Close Match** (e.g. 10 PM vs 11 PM) |
| **2** | $0.33$ ($33\%$) | **Moderate Mismatch** (e.g. 10 PM vs 12 AM) |
| **3** | $0.00$ ($0\%$) | **Direct Conflict** (e.g. Early riser vs Night owl) |

*If a user modifies any answer in Firestore, the compatibility percentage instantly recalculates across all match feeds.*

---

## 7. Developer Implementation & Handoff Guide

### 7.1 Local Development Setup
1. **Repository Setup:**
   ```bash
   git clone <repository-url>
   cd roomate/app
   npm install
   ```
2. **Environment Variables Config (`.env`):**
   Create `d:\roomate\app\.env` with the following variables:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_RAZORPAY_KEY_ID=rzp_test_mockkey12345
   ```
3. **Execution Commands:**
   ```bash
   npm run dev      # Launch Vite development server on http://localhost:3000
   npm run check    # Run TypeScript strict type-checking compiler (npx tsc -b)
   npm run build    # Produce production bundle in app/dist
   ```

---

## 8. Phased Product Roadmap & Future Feature Backlog

```
Phase 1 (Done)     Phase 2 (Next 30 Days)   Phase 3 (60 Days)    Phase 4 (90 Days+)
+---------------+  +---------------------+  +------------------+  +-------------------+
| Core Matching |  | WhatsApp Virality   |  | PWA Conversion   |  | AI Match Assistant|
| 3-Tier Auth   |  | FCM Push Alerts     |  | Locality SEO     |  | Video Intro Cards |
| Real-time Chat|  | Dealbreaker Filters |  | Referral Loops   |  | Group Team Finder |
+---------------+  +---------------------+  +------------------+  +-------------------+
```

### 8.1 Phase 2: Trust & Engagement (Next 30 Days)
- **WhatsApp Direct Share Engine:** 1-tap WhatsApp sharing for user profiles, room listings, and compatibility cards (`wa.me/?text=...`).
- **FCM Web Push Notifications:** Instant browser notifications for connection requests and chat messages via `usePushNotifications.ts`.
- **Hard Dealbreaker Filters:** Instant filtering mechanism to eliminate candidates matching specific dealbreakers (e.g., Strict Veg, Non-Smoker only).

### 8.2 Phase 3: Network Growth & SEO (60 Days)
- **PWA (Progressive Web App) Enablement:** Add `manifest.json` and service worker caching for offline access and home screen installation.
- **Locality-Specific SEO Landing Pages:** Static route generation for top search intents (`/rooms-in-velachery-chennai`, `/flatmates-in-hsr-layout`).
- **Referral Rewards Loop:** Grant 7 days of "Priority Match" profile boosting for referring friends.

### 8.3 Phase 4: AI & Advanced Innovation (90 Days+)
- **30-Second Video Profile Cards:** Native video recording/uploading for profile introductions.
- **"Create a Team" Multi-Seeker Finder:** Allows 2-3 room seekers to pair up and apply for 2BHK/3BHK flats as a unified group.
- **AI Compatibility Breakdown Assistant:** Natural language explanation of compatibility Strengths & Conflicts between two candidate profiles.

---

## 9. Competitive Teardown & Feature Differentiation Matrix

| Feature | NoBroker | FlatMate.in | NextFlat | NestMate |
| :--- | :---: | :---: | :---: | :---: |
| **Lifestyle Compatibility Engine** | ❌ None | ⚠️ Basic | ❌ None | ✅ **Deep Vector Math (10 Params)** |
| **Zero Brokerage Model** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **100% Direct Connect** |
| **Verification System** | ⚠️ Paid Service | ⚠️ Optional | ⚠️ Manual | ✅ **3-Tier (Work Email + Aadhaar)** |
| **Interactive Map Search** | ⚠️ Limited | ❌ No | ❌ No | ✅ **Leaflet Spatial Discovery** |
| **Mutual Phone Sharing Flow** | ❌ Direct Show | ❌ Direct Show | ❌ Direct Show | ✅ **In-Chat Permission Lock** |
| **Multi-Language Support** | ❌ English Only | ❌ English Only | ❌ English Only | ✅ **4 Languages (EN, HI, TA, TE)** |
| **Admin Governance Panel** | ✅ Internal | ❌ No | ❌ No | ✅ **Full 8-Page Management Suite** |

---

## 10. Quality Assurance, Security & Governance

1. **Security Standards:**
   - All database reads/writes strictly governed by Firestore Security Rules.
   - User phone numbers masked by default; exposed only upon mutual consent.
2. **Performance Constraints:**
   - Client-side image compression reduces upload sizes by ~80% before Storage dispatch (`imageCompressor.ts`).
   - Page route lazy-loading ensures initial bundle size remains $< 1.5$ MB.
3. **Compliance & Moderation:**
   - Real-time user block & report queue enabled in Admin Panel (`AdminReports.tsx`).

---

*This document serves as the official master product specification for NestMate v3.0.*
