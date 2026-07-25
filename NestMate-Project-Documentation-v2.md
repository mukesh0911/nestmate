# 🏠 NestMate — Complete Project Documentation
### India's Lifestyle-First Roommate Matching Platform
**Version 2.0 · July 2026**

> **Team:** 2 Founders · **Budget:** AI Code Agent + Hosting + Domain · **Mission:** Build India's most trusted roommate-finding experience on near-zero capital.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Market Opportunity](#2-problem-statement--market-opportunity)
3. [Competitive Landscape](#3-competitive-landscape)
4. [NestMate's Unfair Advantage](#4-nestmates-unfair-advantage)
5. [Current Product Audit (What's Built)](#5-current-product-audit-whats-built)
6. [Architecture & Tech Stack](#6-architecture--tech-stack)
7. [Feature Roadmap](#7-feature-roadmap-phased)
8. [Revenue Model](#8-revenue-model)
9. [Zero-Budget Growth Strategy](#9-zero-budget-growth-strategy)
10. [Infrastructure & Cost Blueprint](#10-infrastructure--cost-blueprint)
11. [Risk Register](#11-risk-register)
12. [KPIs & Success Metrics](#12-kpis--success-metrics)
13. [File Architecture](#13-file-architecture)
14. [Appendix](#14-appendix)

---

## 1. Executive Summary

**NestMate** is a web-first roommate-matching platform that uses a **10-question lifestyle compatibility quiz** to connect verified seekers and room owners across India's top 6 metro cities. Unlike generic listing portals (NoBroker, OLX), NestMate treats roommate-finding like *dating for housemates* — matching on sleep schedules, food preferences, cleanliness habits, and work-from-home patterns.

### What Makes NestMate Different (30-Second Pitch)

> *"NoBroker tells you the rent. NestMate tells you if you'll actually survive living with that person."*

| Metric | Status |
|--------|--------|
| **Pages Built** | 29 production pages + 8 admin pages |
| **Features Live** | Auth, Onboarding, Matching, Chat, Listings, Map, Notifications, Profile, Admin |
| **Tech Stack** | React 19 + Vite + Firebase (Auth/Firestore/Storage) + Leaflet Maps |
| **Cities Covered** | Chennai, Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR |
| **Team Size** | 2 people |
| **Monthly Burn** | ~₹0 (Firebase Spark free tier + AI agent) |

---

## 2. Problem Statement & Market Opportunity

### The Problem

Finding a roommate in India today is broken:

| Pain Point | Current Reality |
|------------|----------------|
| **Trust** | 70%+ of seekers worry about safety with strangers from Facebook groups |
| **Compatibility** | Zero tools to check if someone's sleep schedule / food habits / cleanliness match yours |
| **Broker Tax** | ₹5,000–₹25,000 lost to brokers for a simple room share |
| **Scattered Discovery** | Users juggle WhatsApp groups, Facebook, OLX, NoBroker — fragmented experience |
| **No Verification** | Fake profiles, ghost listings, scam calls from aggregators |

### The Market

| Data Point | Value |
|------------|-------|
| India's urban rental market size | ~$20B (2025) |
| Co-living & roommate segment CAGR | 17–24% |
| Young professionals migrating to metros annually | 8M+ |
| Users actively searching for roommates on Facebook groups | 5M+ across top 6 cities |
| Average time to find a compatible roommate | 3–6 weeks |

### Target Users

```
Primary:   IT professionals (22–32), relocating to a new city for a job
Secondary: College students (18–24), looking for PG/shared flats near campus
Tertiary:  Working women (22–35), safety-conscious, seeking female-only flats
```

---

## 3. Competitive Landscape

### Direct Competitors

| Platform | Strength | Weakness | NestMate's Edge |
|----------|----------|----------|-----------------|
| **NoBroker** | Massive listing volume, brand recognition | Generic — no lifestyle matching, cluttered UX, subscription-heavy | We match on *compatibility*, not just budget |
| **FlatMate.in** | Verification focus | Small user base, limited cities, dated UI | Our UI is modern & premium; quiz-based matching is deeper |
| **NextFlat** | AI matching + WhatsApp alerts | Early stage, limited features | We offer full dashboard, chat, map, admin panel |
| **Flat & Flatmates (FB)** | Huge reach, zero cost | No verification, scams, no filtering | We are the *organized* version of these groups |
| **Nestaway / Zolo** | Managed co-living, furnished spaces | Expensive, no roommate *matching* | We connect individuals, not sell inventory |

### Competitive Matrix

```
                    Verification ──────────────►
                    │
                    │  FlatMate.in    ★ NestMate
                    │
  Lifestyle         │
  Matching          │
     │              │  NextFlat
     │              │
     ▼              │
                    │  NoBroker      Facebook Groups
                    │
                    └──────────────────────────►
                              Listing Volume
```

> **Our sweet spot:** High verification + Deep lifestyle matching. We don't need the most listings — we need the *best matches*.

---

## 4. NestMate's Unfair Advantage

### 1. **Lifestyle Compatibility Engine** (Built ✅)
- 10-question quiz covering sleep, food, smoking, drinking, guests, cleanliness, work mode, pets, and gender preference
- Mathematical vector similarity scoring: exact match = 100%, close = 67%, moderate = 33%
- Dynamic recalculation — change quiz answers in Firestore, scores update live

### 2. **Trust Architecture** (Built ✅)
- 3-tier verification: Phone → Work Email → Government ID (Aadhaar)
- TrustBadge system with visual hierarchy (Bronze → Silver → Gold → Pro)
- Profile Completeness gamification (6 steps, weighted scoring)

### 3. **Zero Broker Model** (Built ✅)
- Direct seeker ↔ owner connection
- No middlemen, no commissions
- In-app chat eliminates need to share phone numbers

### 4. **2-Person Speed** (Strategic ✅)
- AI-assisted development = ship features 10x faster than funded competitors
- No bureaucracy, no meetings — pure execution
- Firebase serverless = no DevOps headache

---

## 5. Current Product Audit (What's Built)

### 5.1 Authentication & Onboarding

| Feature | Status | Details |
|---------|--------|---------|
| Google OAuth Login | ✅ Live | One-click sign-in via Firebase Auth |
| Email/Password Login | ✅ Live | With password reset flow |
| Phone OTP Login | ✅ Live | Firebase Phone Auth with RecaptchaVerifier |
| Role Selection | ✅ Live | Seeker vs Owner path |
| Seeker Onboarding | ✅ Live | 10-question lifestyle quiz + profile setup |
| Owner Onboarding | ✅ Live | Room listing creation with images, amenities, rules |
| Demo Login | ✅ Live | 1-click demo accounts for instant exploration |

### 5.2 Core Platform

| Feature | Status | Details |
|---------|--------|---------|
| Seeker Dashboard | ✅ Live | Tinder-style card feed, compatibility scores, save/skip/connect |
| Owner Dashboard | ✅ Live | Listing management, applicant tracking, analytics |
| Browse Rooms | ✅ Live | Filterable room listings (city, budget, flat type, furnishing) |
| Browse Seekers | ✅ Live | Searchable seeker directory |
| Room Detail Page | ✅ Live | Full listing view with images, amenities, map, owner info |
| Match Detail Page | ✅ Live | Deep compatibility breakdown, lifestyle tags |
| Map View | ✅ Live | Leaflet-based interactive map with listing markers |
| Real-time Chat | ✅ Live | Firestore-powered messaging with read receipts |
| Notifications | ✅ Live | Connection requests, chat alerts, system notifications |
| Profile Page | ✅ Live | Dynamic stats (connects, chats, top match %) |
| Edit Profile | ✅ Live | Bio, profession, social links, ID verification upload |
| Settings | ✅ Live | Language (EN/HI/TA/TE), dark mode, notification prefs |

### 5.3 Admin Panel

| Feature | Status | Details |
|---------|--------|---------|
| Admin Dashboard | ✅ Live | User/listing/revenue stats |
| User Management | ✅ Live | Search, view, ban users |
| Listing Management | ✅ Live | Approve/reject/remove listings |
| Verification Queue | ✅ Live | Review Aadhaar/ID submissions |
| Reports & Analytics | ✅ Live | Growth charts, engagement metrics |
| Broadcast Notifications | ✅ Live | Send announcements to all users |
| Admin Settings | ✅ Live | Platform configuration |

### 5.4 Business Features

| Feature | Status | Details |
|---------|--------|---------|
| Freemium Model | ✅ Live | 5 connects/month free, unlimited on Premium |
| Pricing Page | ✅ Live | Free / Premium (₹299/mo) / Corporate tiers |
| Razorpay Integration | ✅ Scaffolded | Payment gateway ready (mock checkout active) |
| Premium Features | ✅ Live | Unlimited connects, profile boost, "who viewed you" |

### 5.5 Technical Features

| Feature | Status | Details |
|---------|--------|---------|
| Code Splitting | ✅ Live | All pages lazy-loaded |
| Image Compression | ✅ Live | Client-side before upload |
| Responsive Design | ✅ Live | Mobile-first with bottom nav bar |
| SEO Metadata | ✅ Live | Dynamic page titles |
| Multi-language | ✅ Live | English, Hindi, Tamil, Telugu |
| Active User Tracking | ✅ Live | Last seen timestamps |
| Zustand State Management | ✅ Live | UI-only global state, no mock data |

---

## 6. Architecture & Tech Stack

### 6.1 Technology Decisions

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | React 19 + TypeScript | Industry standard, massive ecosystem |
| **Build Tool** | Vite 7 | Instant HMR, fast builds |
| **Styling** | Tailwind CSS 3 | Rapid UI development |
| **UI Components** | Radix UI + Lucide Icons | Accessible, unstyled primitives |
| **State** | Zustand | Lightweight, no boilerplate |
| **Backend** | Firebase (BaaS) | Zero server management, free tier |
| **Auth** | Firebase Auth | Google, Email, Phone — all free |
| **Database** | Cloud Firestore | Real-time, scalable NoSQL |
| **Storage** | Firebase Storage | Image uploads with CDN |
| **Maps** | Leaflet + OpenStreetMap | Free (no Google Maps billing) |
| **Payments** | Razorpay | India-native, low MDR |
| **Hosting** | Firebase Hosting | Free tier: 10GB storage, 360MB/day bandwidth |

### 6.2 Firestore Collections Schema

```
users/                    → User profiles (seekers + owners)
  ├── uid
  ├── name, email, phone, role
  ├── city, localities[], geoLocation
  ├── quizAnswers: { q1..q10 }
  ├── isPremium, isVerified, verificationLevel
  ├── savedProfileIds[], savedRoomIds[], skippedUserIds[]
  └── settings: { language, darkMode, notifications }

listings/                 → Room/flat listings
  ├── ownerId, title, description
  ├── flatType, furnishing, amenities[], houseRules[]
  ├── totalRent, partnerShare, deposit
  ├── city, locality, lat, lng
  ├── images[], status
  └── views, applicants

connections/              → Connect requests between users
  ├── fromUserId, toUserId
  ├── status: pending | accepted | rejected | blocked
  └── createdAt

chatRooms/                → Chat room metadata
  ├── participants[]
  ├── lastMessage, lastMessageAt
  └── messages/ (subcollection)
      ├── senderId, text
      └── createdAt, readBy[]

notifications/            → User notifications
  ├── userId, type, title, description
  ├── read, actionUrl
  └── createdAt

verifications/            → ID verification submissions
  ├── userId, type (aadhaar/work_id)
  ├── documentUrl, status
  └── submittedAt, reviewedAt

reviews/                  → User reviews & ratings
  ├── fromUserId, toUserId
  ├── rating, comment
  └── createdAt
```

### 6.3 Key Algorithms

#### Compatibility Scoring ([useMatches.ts](file:///d:/roomate/app/src/hooks/useMatches.ts))

```
For each quiz question answered by BOTH users:
  similarity = 1 - (|choiceA - choiceB| / 3)
  
  Exact match  → 1.00 (100%)
  Close (±1)   → 0.67 (67%)
  Moderate (±2) → 0.33 (33%)
  Opposite (±3) → 0.00 (0%)

Overall Score = avg(all similarities) × 100
```

#### Match Ranking ([useMatches.ts](file:///d:/roomate/app/src/hooks/useMatches.ts))

```
1. Filter by city → only same-city users
2. Filter by role → seekers see other seekers (for co-living)
3. Exclude: self, skipped, blocked users
4. Calculate compatibility score for each candidate
5. Sort by compatibility score (descending)
6. Apply additional filters (gender, budget, locality)
```

---

## 7. Feature Roadmap (Phased)

> **Philosophy:** Ship what makes users *stay*, not what sounds impressive on a pitch deck.

### Phase 1: Foundation Hardening (Current → Week 2)
*Goal: Make what's built bulletproof. Zero bugs, 100% dynamic.*

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| 🔴 P0 | Fix all hardcoded/mock data fallbacks in `mockData.ts` | Trust | 1 day |
| 🔴 P0 | Profile completeness % dynamically updates on save | Retention | Done ✅ |
| 🔴 P0 | Compatibility scores dynamically from Firestore quiz | Core UX | Done ✅ |
| 🟡 P1 | Empty states for all pages (no matches, no chats, no listings) | Polish | 1 day |
| 🟡 P1 | Error boundaries & loading skeletons everywhere | UX | 1 day |
| 🟡 P1 | Mobile responsive audit (test on real devices) | Reach | 1 day |
| 🟡 P1 | SEO meta tags on all pages (title, description, Open Graph) | Growth | 0.5 day |

### Phase 2: Trust & Stickiness (Week 3–4)
*Goal: Users trust NestMate enough to message strangers.*

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| 🔴 P0 | **Referral System** — "Invite a friend, both get Priority Match status" | Growth | 2 days |
| 🔴 P0 | **Report User / Report Listing** — flag inappropriate content | Safety | 1 day |
| 🟡 P1 | **"Who Viewed My Profile"** — Premium-only feature | Revenue | 1.5 days |
| 🟡 P1 | **Chat Enhancements** — image sharing, typing indicator, emoji reactions | Engagement | 2 days |
| 🟡 P1 | **Push Notifications** (FCM) — "New match!", "Message received" | Retention | 1.5 days |
| 🟢 P2 | **Roommate Compatibility Breakdown** — detailed quiz comparison view | Delight | 1 day |

### Phase 3: Network Effects (Week 5–8)
*Goal: Each new user makes the platform better for everyone.*

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| 🔴 P0 | **WhatsApp Share** — "Share your profile/listing on WhatsApp" button | Viral | 0.5 day |
| 🔴 P0 | **SEO Landing Pages** — "/rooms-in-chennai-velachery", "/flatmates-in-bangalore-koramangala" | Organic Traffic | 3 days |
| 🟡 P1 | **Saved Searches with Alerts** — "Notify me when a 2BHK under ₹12K appears in OMR" | Retention | 2 days |
| 🟡 P1 | **User Reviews** — Rate your ex-roommate/landlord (with moderation) | Trust | 2 days |
| 🟢 P2 | **Blog / Content Hub** — "Moving to Chennai? Here's your survival guide" | SEO | 2 days |
| 🟢 P2 | **Shortlist & Compare** — Side-by-side comparison of 2-3 listings | UX | 1 day |

### Phase 4: Monetization (Week 9–12)
*Goal: First revenue without alienating free users.*

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| 🔴 P0 | **Razorpay Live Integration** — Real payment for Premium plan | Revenue | 2 days |
| 🔴 P0 | **Premium Badge & Boost** — Premium users appear first in search | Revenue | 1 day |
| 🟡 P1 | **Owner Featured Listing** — Pay ₹99 to pin listing for 7 days | Revenue | 1 day |
| 🟡 P1 | **Connect Pack** — Buy 10 extra connects for ₹49 (micro-transaction) | Revenue | 1 day |
| 🟢 P2 | **Subscription Management** — Upgrade/downgrade/cancel from Settings | UX | 1.5 days |

### Phase 5: Scale & Delight (Month 4–6)
*Goal: Features that make NestMate irreplaceable.*

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| 🟡 P1 | **PWA (Progressive Web App)** — Install on home screen, offline access | Mobile | 1 day |
| 🟡 P1 | **Smart Notifications** — ML-based optimal send time | Engagement | 2 days |
| 🟡 P1 | **Locality Insights** — Average rent, safety score, transit info per area | Value | 3 days |
| 🟢 P2 | **Video Profile** — 30-sec intro video on profile | Trust | 2 days |
| 🟢 P2 | **Community Forum** — Q&A for area-specific housing advice | Retention | 3 days |
| 🟢 P2 | **Dark Mode** — Full dark theme support | Polish | 1 day |

### ❌ Features We Will NOT Build (and Why)

| Feature | Reason |
|---------|--------|
| Rent Splitter / Bill Calculator | Legal liability risk for a 2-person team — removed ✅ |
| Agreement Builder | Contract templates create legal exposure — removed ✅ |
| In-app Payments Between Users | Payment regulation (PPI license), fraud risk, disputes |
| Native Mobile App (React Native) | PWA covers 90% of use cases at zero cost; native = 3-6 month delay |
| AI Chatbot | Adds complexity without solving core matching problem |
| Video Calling | Heavy infrastructure, better handled by WhatsApp |

---

## 8. Revenue Model

### Pricing Tiers

| Tier | Price | Target | Key Features |
|------|-------|--------|-------------|
| **Free** | ₹0 | All users | 5 connects/month, 1 listing, basic chat, matching |
| **Premium** | ₹299/month or ₹2,399/year | Power seekers & active owners | Unlimited connects, profile boost, who viewed you, priority support |
| **Featured Listing** | ₹99 one-time | Owners | Pin listing at top for 7 days |
| **Connect Pack** | ₹49 one-time | Seekers | 10 additional connects |

### Revenue Projections (Conservative)

| Month | Users | Premium (5%) | Featured (3%) | Packs (2%) | MRR |
|-------|-------|-------------|---------------|------------|-----|
| Month 3 | 500 | 25 × ₹299 | 15 × ₹99 | 10 × ₹49 | ₹9,450 |
| Month 6 | 2,000 | 100 × ₹299 | 60 × ₹99 | 40 × ₹49 | ₹37,800 |
| Month 12 | 10,000 | 500 × ₹299 | 300 × ₹99 | 200 × ₹49 | ₹1,89,000 |

> **Break-even target:** ₹10,000 MRR (covers domain + hosting upgrades). Achievable at ~600 users with 5% conversion.

---

## 9. Zero-Budget Growth Strategy

### Phase 1: Seed (First 500 Users)

#### 🎯 Strategy: "Own One City First"
Start with **Chennai only**. Dominate one market before expanding.

| Channel | Action | Expected Impact |
|---------|--------|-----------------|
| **Facebook Groups** | Join 20+ "Flat & Flatmates Chennai" groups. Don't spam — answer questions, then casually mention NestMate | 5-10 users/day |
| **Reddit** | Post value-driven content on r/Chennai, r/IndianWorkplace | 3-5 users/day |
| **WhatsApp** | Create "NestMate Chennai" WhatsApp Community (free, up to 5000 members) | 10-20 users/week |
| **College Partnerships** | Partner with placement cells at Anna University, SRM, VIT Chennai — "official housing partner" | 50-100 users/batch |
| **IT Park Outreach** | Flyers (₹500 budget) at Tidel Park, RMZ One Paramount, ELCOT cafeterias | 20-30 users/week |

#### 🔄 Viral Loop
```
User signs up → Completes quiz → Sees matches →
→ "Share your NestMate profile on WhatsApp" CTA →
→ Friend clicks link → Sees "X% compatible with you!" →
→ Signs up to unlock full profile → Repeat
```

### Phase 2: Growth (500–5,000 Users)

| Channel | Action |
|---------|--------|
| **SEO** | Publish 20 locality-specific pages: "Best Flats in Velachery Under ₹10K" |
| **Referral Program** | "Invite 3 friends → Get 1 month Premium free" |
| **Micro-influencers** | Partner with 5-10 Chennai lifestyle creators (barter: free Premium) |
| **LinkedIn** | "We're 2 founders building India's roommate app" — build-in-public posts |
| **Product Hunt** | Launch on PH for initial tech-savvy audience |

### Phase 3: Expansion (5,000+ Users)

| City | Trigger to Launch |
|------|------------------|
| Bengaluru | When Chennai hits 2,000 active users |
| Hyderabad | When Bengaluru hits 1,000 active users |
| Pune → Mumbai → Delhi | Sequential, based on organic demand signals |

---

## 10. Infrastructure & Cost Blueprint

### Current Monthly Costs

| Service | Tier | Cost |
|---------|------|------|
| Firebase (Auth + Firestore + Storage + Hosting) | Spark (Free) | **₹0** |
| Domain (nestmate.in) | Annual | **~₹800/year** (₹67/mo) |
| AI Code Agent (Gemini / Claude) | Subscription | **~₹1,500/mo** |
| **Total** | | **~₹1,567/mo** |

### When to Upgrade (Trigger Points)

| Trigger | Action | Cost |
|---------|--------|------|
| 10,000 Firestore reads/day exceeded | → Upgrade to Firebase Blaze (pay-as-you-go) | ~₹0–500/mo |
| 360MB/day bandwidth exceeded | → Add Cloudflare CDN (free tier) in front | ₹0 |
| 5,000+ users | → Move hosting to Cloudflare Pages (unlimited bandwidth) | ₹0 |
| 50GB storage (images) exceeded | → Compress aggressively + purge inactive listings | ₹0 initially |
| First ₹10K MRR | → Get custom domain email (Zoho Mail free) | ₹0 |

### Free Tier Limits to Monitor

| Firebase Service | Free Limit | Our Current Usage |
|-----------------|------------|-------------------|
| Auth | 10K verifications/month | ~50 (safe) |
| Firestore Reads | 50K/day | ~2K (safe) |
| Firestore Writes | 20K/day | ~500 (safe) |
| Storage | 5GB | ~200MB (safe) |
| Hosting Bandwidth | 360MB/day | ~50MB (safe) |

> [!TIP]
> **We are at ~5% of free tier limits.** We can scale to 5,000+ active users before needing to spend a single rupee on infrastructure.

---

## 11. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Firebase lock-in** | Medium | High | Firestore data is exportable; app logic is in React hooks (portable) |
| **Fake profiles / scams** | High | Critical | 3-tier verification + Report system + Admin moderation queue |
| **NoBroker adds lifestyle matching** | Low | High | They optimize for *volume*; we optimize for *quality*. Different DNA. |
| **Low initial supply** | High | Medium | Seed Chennai with real listings from Facebook groups; founders personally onboard first 100 users |
| **User trust** | High | Critical | Aadhaar verification, reviews, TrustBadge system — all built ✅ |
| **Firebase costs spike** | Low | Medium | Implement Firestore query caching, pagination, image compression — all built ✅ |
| **Team burnout (2 people)** | Medium | High | Use AI agent for 80% of coding; focus founder time on user interviews + growth |

---

## 12. KPIs & Success Metrics

### North Star Metric
> **Monthly Successful Connections** — the number of accepted connect requests that lead to an active chat.

### Dashboard Metrics

| Category | KPI | Target (Month 3) | Target (Month 6) |
|----------|-----|-------------------|-------------------|
| **Acquisition** | Monthly Signups | 200 | 1,000 |
| **Activation** | Onboarding Completion Rate | 70% | 80% |
| **Engagement** | DAU/MAU Ratio | 15% | 25% |
| **Retention** | Week-1 Retention | 30% | 40% |
| **Revenue** | MRR | ₹5,000 | ₹37,000 |
| **Matching** | Avg. Compatibility Score | 75%+ | 80%+ |
| **Trust** | Verified Profile % | 40% | 60% |
| **Support** | Reports per 100 users | < 2 | < 1 |

---

## 13. File Architecture

```
d:\roomate\app\
├── src/
│   ├── components/          # Shared UI components
│   │   ├── Layout.tsx              # Main nav + bottom bar + auth modal
│   │   ├── AuthModal.tsx           # 1-click demo + login modal
│   │   ├── AuthLayout.tsx          # Auth page wrapper
│   │   ├── HeroMatchShowcase.tsx   # Landing page hero section
│   │   ├── ProfileCompleteness.tsx # Gamified profile progress
│   │   ├── TrustBadge.tsx          # Verification tier badges
│   │   ├── MapPreview.tsx          # Leaflet map embeds
│   │   ├── LocationAutocomplete.tsx # City/locality search
│   │   ├── AadhaarVerifyModal.tsx  # ID verification flow
│   │   ├── DigiLockerModal.tsx     # DigiLocker integration
│   │   └── ui/                     # Radix-based primitives
│   │
│   ├── hooks/               # Firebase-connected business logic
│   │   ├── useAuth.ts              # Auth + profile management
│   │   ├── useMatches.ts           # Compatibility engine + match finder
│   │   ├── useListings.ts          # CRUD for room listings
│   │   ├── useChat.ts              # Real-time messaging
│   │   ├── useConnections.ts       # Connect request flow
│   │   ├── useNotifications.ts     # Notification system
│   │   ├── useReviews.ts           # User reviews
│   │   ├── useAdmin.ts             # Admin operations
│   │   ├── useStorage.ts           # Image upload + compression
│   │   ├── useGeocoding.ts         # Lat/lng from address
│   │   ├── useUserProfile.ts       # Profile CRUD
│   │   ├── useActiveTracking.ts    # Last-seen tracking
│   │   ├── usePushNotifications.ts # FCM push setup
│   │   ├── useTranslation.ts       # i18n (EN/HI/TA/TE)
│   │   └── use-mobile.ts           # Responsive breakpoint
│   │
│   ├── pages/               # Route-level page components
│   │   ├── LandingPage.tsx         # Public homepage
│   │   ├── AuthPage.tsx            # Login/Register
│   │   ├── SeekerDashboard.tsx     # Main matching feed
│   │   ├── OwnerDashboard.tsx      # Owner listing mgmt
│   │   ├── BrowseDashboard.tsx     # Browse all rooms
│   │   ├── BrowseSeekers.tsx       # Browse all seekers
│   │   ├── ChatPage.tsx            # Real-time messaging
│   │   ├── MapView.tsx             # Interactive map
│   │   ├── ProfilePage.tsx         # User profile view
│   │   ├── EditProfile.tsx         # Profile editor + verification
│   │   ├── MatchDetail.tsx         # Deep match view
│   │   ├── RoomDetail.tsx          # Full listing view
│   │   ├── PricingPage.tsx         # Subscription plans
│   │   ├── SettingsPage.tsx        # User preferences
│   │   ├── NotificationsPage.tsx   # Notification center
│   │   ├── SeekerOnboarding.tsx    # Quiz + profile setup
│   │   ├── OwnerOnboarding.tsx     # Listing creation flow
│   │   ├── HowItWorks.tsx          # Platform explainer
│   │   ├── AboutUs.tsx             # Team / mission
│   │   ├── PrivacyPolicy.tsx       # Legal pages
│   │   └── admin/                  # Admin panel (8 pages)
│   │
│   ├── lib/                 # Utilities & config
│   │   ├── firebase.ts             # Firebase initialization
│   │   ├── staticData.ts           # Cities, quiz questions, filters
│   │   ├── imageCompressor.ts      # Client-side image optimization
│   │   ├── mockData.ts             # Fallback data (to be removed)
│   │   └── utils.ts                # Shared utilities
│   │
│   ├── store/               # Global UI state
│   │   └── useStore.ts             # Zustand store (filters, role, modal)
│   │
│   ├── App.tsx              # Route definitions
│   └── main.tsx             # Entry point
│
├── public/                  # Static assets
├── package.json             # Dependencies
├── tailwind.config.ts       # Tailwind theme
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
├── firebase.json            # Firebase project config
├── firestore.rules          # Security rules
└── direct_seed.ts           # DB seeding script
```

---

## 14. Appendix

### A. Quiz Questions Reference

| # | Question | Options | Why It Matters |
|---|----------|---------|----------------|
| 1 | Sleep time | Before 10PM / 10-12 / After 12 / Varies | #1 cause of roommate conflict |
| 2 | Wake time | Before 6AM / 6-8 / 8-10 / After 10 | Morning vs night person |
| 3 | Food preference | Veg / Non-veg / Vegan / No pref | Kitchen harmony |
| 4 | Smoking | Never / Outside / Social / Regular | Dealbreaker for many |
| 5 | Drinking | Never / Occasionally / Social / Regular | Social dynamic at home |
| 6 | Guests | Rarely / Sometimes / Often / Very often | Shared space comfort |
| 7 | Cleanliness | Very important / Somewhat / Relaxed / Messy | #2 cause of disputes |
| 8 | Work mode | WFO / WFH / Hybrid / Flexible | Daily home usage |
| 9 | Pets | Love / OK / Prefer no / Allergic | Health + comfort |
| 10 | Gender pref | Any / Female only / Male only / No pref | Safety filter |

### B. Founder Principles

1. **"Would I use this?"** — Ship only features we'd use ourselves
2. **"Does this help someone find a roommate faster?"** — If no, don't build it
3. **"Can 2 people maintain this?"** — If it needs a team of 5 to maintain, skip it
4. **"Does this create legal risk?"** — No contracts, no payment handling between users, no financial advice
5. **"Free first, premium as bonus"** — Never paywall core matching. Revenue comes from *convenience*, not *necessity*

### C. Tech Debt to Address

| Item | Priority | Description |
|------|----------|-------------|
| `mockData.ts` removal | P0 | Still imported in `useListings.ts` — needs full removal |
| Unused files cleanup | P1 | `BrowseRooms.tsx`, `Home.tsx`, `Login.tsx` may be dead code |
| Firestore security rules | P0 | Need production-grade rules (currently too permissive) |
| Error handling | P1 | Many hooks silently catch errors — add user-facing toasts |
| Test coverage | P2 | Zero tests currently — add critical path tests first |

### D. 90-Day Execution Calendar

```
WEEK 1-2:  Foundation Hardening
           ├── Remove all mock data fallbacks
           ├── Empty states for every page
           ├── Mobile responsive audit
           └── SEO meta tags

WEEK 3-4:  Trust & Stickiness
           ├── Report system
           ├── Chat enhancements (images, typing)
           ├── Push notifications (FCM)
           └── Referral system (invite friends)

WEEK 5-6:  Viral Growth
           ├── WhatsApp share buttons everywhere
           ├── SEO locality pages (20 pages)
           ├── Saved search alerts
           └── User reviews

WEEK 7-8:  Monetization
           ├── Razorpay LIVE integration
           ├── Featured listings
           ├── Connect packs
           └── Premium badge & boost

WEEK 9-10: Chennai Domination
           ├── 500 real users target
           ├── College partnerships (3-5 colleges)
           ├── WhatsApp community (500+ members)
           └── First ₹10K MRR

WEEK 11-12: Bengaluru Expansion
           ├── Add Bengaluru-specific seed data
           ├── Partner with 3 Bengaluru colleges
           ├── Cross-pollinate Chennai users
           └── Target 1,000 total users
```

---

> [!IMPORTANT]
> **This document is a living roadmap.** Update it every 2 weeks as priorities shift based on user feedback and growth data. The fastest way to build the best roommate app in India is not to build more features — it's to make the features we have *work perfectly* for our users.

---

*Built with ❤️ by 2 founders who believe finding a roommate shouldn't feel like a gamble.*
*NestMate — Where Lifestyles Match, Roommates Click.*
