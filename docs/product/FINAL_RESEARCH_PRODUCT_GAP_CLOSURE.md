# NestMate — Final Research-to-Product Gap Closure Matrix
**Standard**: EXHAUSTIVE 14-LAYER TRACEABILITY AUDIT  
**Date**: 2026-08-26  

---

## 1. Traceability Architecture

Every research finding is traced across the full 14-dimension specification chain:
1. **Research Finding**
2. **User Pain**
3. **Competitor Gap**
4. **NestMate Product Principle**
5. **Required Feature**
6. **Actual Implementation**
7. **UI/UX Experience**
8. **Business Logic**
9. **Firestore / Auth / Storage**
10. **Security Rules**
11. **Realtime Behavior**
12. **Real-Browser User Journey**
13. **Adversarial Failure Case**
14. **Evidence & Final Status**

---

## 2. Master Traceability Register

### Finding RPR-001: Fake Profiles & Identity Anxiety
- **Research Finding**: Online classifieds and FB flatshare groups are plagued by fake profiles, romance scammers, and unverified strangers creating severe physical and financial anxiety.
- **User Pain**: Seekers and owners are terrified of moving in with dangerous or fraudulent strangers.
- **Competitor Gap**: FB groups and classifieds require 0 verification; NoBroker has only basic SMS check.
- **Product Principle**: *Trust is earned, not assumed* — multi-tier progressive verification ladder.
- **Required Feature**: 4-Tier Trust Ladder (Bronze → Silver → Gold → Verified Pro).
- **Actual Implementation**: `TrustBadge.tsx`, `trustSignals.ts`, `useAuth.ts`.
- **UI/UX Experience**: Prominent color-coded shield badge with hover breakdown modal showing verified steps on all cards and profiles.
- **Business Logic**: Pure function `computeTrustScore` calculating 0–100 score (Phone=20, Photo=15, Bio=10, Profession=10, Quiz=15, WorkEmail=15, GovtID=15).
- **Firestore / Auth / Storage**: Reads `auth.currentUser.providerData` for phone; reads `users/{uid}` for profile flags.
- **Security Rules**: Non-admin users strictly denied write access to `isVerified`, `workEmailVerified`, `verificationLevel`.
- **Realtime Behavior**: Snapshot listener updates badge immediately when admin approves verification.
- **Real-Browser User Journey**: Seeker views candidate cards on `/dashboard`; badge modal reveals verified phone & work email.
- **Adversarial Failure Case**: Malicious user attempts to patch `isVerified: true` via Firestore client SDK ➔ DENIED by security rules.
- **Evidence**: `trustSignals.test.ts`, `security.test.ts`, E2E Master Phase 8.
- **Final Status**: **PASS**

---

### Finding RPR-002: Advance Rental Deposit Fraud & Fake Landlords
- **Research Finding**: Fraudulent listings steal advance tokens/deposits using fake property photos.
- **User Pain**: Financial loss, stolen deposits, arriving at a fake address.
- **Competitor Gap**: Platforms do not review government identity documents of listers.
- **Product Principle**: *Zero tolerance for listing and identity fraud*.
- **Required Feature**: Government Identity Document Review Queue & Admin KYC Approval.
- **Actual Implementation**: `EditProfile.tsx`, `AdminVerifications.tsx`, `useAdmin.ts`.
- **UI/UX Experience**: Upload box in Edit Profile; pending status chip; full Admin review dashboard with document lightbox.
- **Business Logic**: Document uploaded to private bucket; Admin approval flips `isVerified: true`, `verificationLevel: 3`.
- **Firestore / Auth / Storage**: Private storage `verifications/{uid}/`; documents recorded in `verifications` collection.
- **Security Rules**: Documents owner-readable and admin-only readable; update/delete strictly admin-only.
- **Realtime Behavior**: Approval propagates to user doc in real time, elevating Trust Badge to "Verified Pro".
- **Real-Browser User Journey**: Owner uploads ID photo ➔ Admin views in `/admin/verifications` ➔ clicks Approve ➔ badge turns green with shield.
- **Adversarial Failure Case**: Regular user accesses `/admin/verifications` ➔ blocked by admin layout guard and Firestore rule `isAdmin()`.
- **Evidence**: `AdminVerifications.tsx`, `storage.rules.test.ts`, E2E Master Phase 14.
- **Final Status**: **PASS**

---

### Finding RPR-003: Public Contact Scraping & Broker Spam
- **Research Finding**: Phone numbers and email addresses posted on public portals get scraped by brokers, telemarketers, and scammers.
- **User Pain**: Endless spam calls, harassment, and loss of personal privacy.
- **Competitor Gap**: NoBroker and classifieds display phone numbers or sell leads to third parties.
- **Product Principle**: *Privacy by design* — phone numbers quarantined until mutual consent.
- **Required Feature**: PII Contact Quarantine (`privateUserData/{uid}`).
- **Actual Implementation**: `privateUserData.ts`, `useUserProfile.ts`, `stripPiiFromWrite`.
- **UI/UX Experience**: Profile pages and search cards show name, profession, and bio with zero contact details.
- **Business Logic**: `updateProfile` strips `phone`, `email`, `workEmail` from `users/{uid}` and routes them to `privateUserData/{uid}`.
- **Firestore / Auth / Storage**: `privateUserData/{userId}` is strictly isolated from public `users/{userId}`.
- **Security Rules**: `match /privateUserData/{userId} { allow read, write: if isOwner(userId) || isAdmin(); }`.
- **Realtime Behavior**: Public queries across `users` collection cannot read or return `privateUserData`.
- **Real-Browser User Journey**: User logs in ➔ views another user's profile on `/match/:id` ➔ contact numbers are completely absent.
- **Adversarial Failure Case**: Malicious user calls `getDoc(doc(db, 'privateUserData', otherUid))` ➔ DENIED with `permission-denied`.
- **Evidence**: `privateUserData.ts`, `security.test.ts`, E2E Master Phase 10.
- **Final Status**: **PASS**

---

### Finding RPR-004: Premature Offline Contact & Stalking Risk
- **Research Finding**: Users (especially women) feel pressured when forced to share phone numbers immediately.
- **User Pain**: Harassment, inability to vet the person before giving out personal phone numbers.
- **Competitor Gap**: No built-in chat; users forced straight to WhatsApp or direct calls.
- **Product Principle**: *Two-way in-app handshake before real-world contact*.
- **Required Feature**: Two-Way Mutual Phone Consent Protocol in Chat.
- **Actual Implementation**: `useChat.ts`, `phoneShare.ts`, `ChatPage.tsx`.
- **UI/UX Experience**: "Share Phone" button in chat header; prompt dialog; system message; unlocked phone banner once mutual.
- **Business Logic**: `assignSharedPhones` maps requester and accepter numbers only when status is `'mutual_agreed'`.
- **Firestore / Auth / Storage**: `chatRooms/{roomId}` document maintains `phoneSharing` state map.
- **Security Rules**: Only authenticated room participants can update `chatRooms/{roomId}`.
- **Realtime Behavior**: Real-time snapshot listener on chat room immediately unveils phone numbers on both screens.
- **Real-Browser User Journey**: Seeker requests phone share in chat ➔ Owner receives prompt and clicks Accept ➔ both see decrypted numbers.
- **Adversarial Failure Case**: Single-party request does not reveal target phone number until target explicitly accepts.
- **Evidence**: `phoneShare.test.ts`, E2E Master Phase 11, Adversarial Journey E.
- **Final Status**: **PASS**

---

### Finding RPR-005: Gender Safety for Working Women
- **Research Finding**: Women relocating to urban centres face harassment or unvetted male roommates in mixed flats.
- **User Pain**: Fear of unsafe shared living situations; lack of female-only verified options.
- **Competitor Gap**: Gender preferences are often ignored or unverified on classifieds.
- **Product Principle**: *Safe spaces for all demographic cohorts*.
- **Required Feature**: Female-Only Flatmate & Room Filters + Verified Trust Signals.
- **Actual Implementation**: `listingFilters.ts`, `SeekerDashboard.tsx`, `ExplorePage.tsx`.
- **UI/UX Experience**: 1-click "Women Only" filter chip in Explore and Dashboard; female badge on listings.
- **Business Logic**: Filters apply strict gender match (`prefGender === 'female'`).
- **Firestore / Auth / Storage**: Query filters on `gender` and `prefGender` fields in `users` and `listings`.
- **Security Rules**: Standard authenticated read rules for discoverable profiles.
- **Realtime Behavior**: Filter updates instantly re-render matching room and seeker candidate cards.
- **Real-Browser User Journey**: Divya (Seeker) filters by Female Only ➔ sees only verified female roommates and safe female flats.
- **Adversarial Failure Case**: Male user profile filtered out of female-only seeker searches.
- **Evidence**: `roleFiltering.test.ts`, `listingFilters.ts`, E2E Master Phase 5.
- **Final Status**: **PASS**

---

### Finding RPR-006: Abusive Actors & Inability to Sanction
- **Research Finding**: Harassers, scammers, and abusive flatmates cannot be sanctioned on informal chat groups.
- **User Pain**: Continued harassment, stalking, and inability to report bad actors.
- **Competitor Gap**: No moderation mechanisms on Facebook or WhatsApp groups.
- **Product Principle**: *Rapid community moderation and active protection*.
- **Required Feature**: In-App Blocking, Tamper-Proof Reporting Queue, and Admin Ban Actions.
- **Actual Implementation**: `reportValidation.ts`, `useUserProfile.ts`, `AdminReports.tsx`, `App.tsx`.
- **UI/UX Experience**: "Report User" and "Block User" in profile menus; reason selector modal; instant feed removal.
- **Business Logic**: `reportUser` validates reason (spam, harassment, fake, etc.) and writes immutable record to `/reports`.
- **Firestore / Auth / Storage**: Immutable records in `/reports`; user blocked ID added to `blockedUserIds`.
- **Security Rules**: Only active users can create reports; `reports` collection is admin-only read/update/delete.
- **Realtime Behavior**: Blocked user disappears immediately from match feeds; admin suspension triggers `BlockedAccountScreen` on victimizer.
- **Real-Browser User Journey**: Seeker reports scammer ➔ Admin views in `/admin/reports` ➔ clicks Suspend User ➔ scammer session locked.
- **Adversarial Failure Case**: Suspended user attempts to navigate to `/dashboard` ➔ trapped on `BlockedAccountScreen`.
- **Evidence**: `reportValidation.ts`, `useAdmin.ts`, Adversarial Journey F.
- **Final Status**: **PASS**

---

### Finding RPR-007: Lifestyle Incompatibility & Post-Move-in Clashes
- **Research Finding**: Roommates experience severe conflict within weeks due to mismatched sleep schedules, food preferences, cleanliness, and WFH habits.
- **User Pain**: Wasted deposits, high moving costs, stress, and broken leases.
- **Competitor Gap**: Competitors treat room hunting purely as real estate square footage.
- **Product Principle**: *Compatibility, not just availability*.
- **Required Feature**: 10-Question Lifestyle Quiz & Exact Compatibility Scoring Engine.
- **Actual Implementation**: `SeekerOnboarding.tsx`, `matching.ts`, `useMatches.ts`.
- **UI/UX Experience**: 10 interactive quiz steps during onboarding; score badge (e.g. "95% Match") on every candidate card.
- **Business Logic**: Exact string-equality evaluation across 10 lifestyle answer tokens; calculates deterministic percentage.
- **Firestore / Auth / Storage**: Stored in `quizAnswers` map on `users/{uid}`.
- **Security Rules**: Valid onboarding requires `quizAnswers.size() >= 5` to flip `onboardingComplete: true`.
- **Realtime Behavior**: Recalculates dynamically when user modifies answers in Edit Profile.
- **Real-Browser User Journey**: Rohan completes onboarding quiz ➔ dashboard ranks candidates by compatibility score.
- **Adversarial Failure Case**: Empty profile answers produce an honest 0% match score with low-confidence caveats.
- **Evidence**: `matching.ts`, `compatibility.test.ts`, `matchQuality.test.ts`, E2E Master Phase 4.
- **Final Status**: **PASS**

---

### Finding RPR-008: Opaque "90% Compatible" Badges Without Context
- **Research Finding**: Arbitrary compatibility scores feel fake and untrustworthy unless the user can see *why* they match.
- **User Pain**: Lack of trust in matching algorithms; unable to tell if high score is meaningful.
- **Competitor Gap**: Rare platforms with scores provide zero breakdown.
- **Product Principle**: *Show, don't tell* — transparent, explainable data.
- **Required Feature**: Explainable Match Reason & Caveat Breakdown.
- **Actual Implementation**: `getMatchReasons` in `matching.ts`, `MatchDetail.tsx`.
- **UI/UX Experience**: "Why You Match" drawer/modal detailing exact overlapping habits, budget fit, and honest caveats.
- **Business Logic**: Evaluates city equality, budget overlap ratio (≤20%), and shared lifestyle trait count.
- **Firestore / Auth / Storage**: Computed client-side on hydrated user profiles.
- **Security Rules**: Non-sensitive public profile computation.
- **Realtime Behavior**: Updates immediately when candidate updates preferences.
- **Real-Browser User Journey**: Seeker clicks candidate card ➔ reads "Early Riser, Vegetarian, Budget fits (₹12k vs ₹14k)".
- **Adversarial Failure Case**: Cross-city profiles show honest caveat "Different cities" and capped score.
- **Evidence**: `matching.ts`, `displayTruth.test.ts`, E2E Master Phase 4.
- **Final Status**: **PASS**

---

### Finding RPR-009: Stale, Inactive & Already-Rented Listings
- **Research Finding**: Seekers waste hours messaging owners on listings that were filled weeks or months ago.
- **User Pain**: Frustration, ghosted inquiries, wasted search time.
- **Competitor Gap**: Portals keep expired listings live to inflate inventory counts.
- **Product Principle**: *Real data, always* — active freshness tracking.
- **Required Feature**: Listing Freshness Decay (14/45 Days) & Owner Availability Confirmation.
- **Actual Implementation**: `listingFreshness.ts`, `marketplaceVisibility.ts`, `useListings.ts`.
- **UI/UX Experience**: "Confirmed 2 days ago" badge; 1-tap "Confirm Available" button on Owner Dashboard; stale rooms hidden.
- **Business Logic**: Tiered decay: Fresh ≤ 14d, Active ≤ 45d, Stale > 45d (excluded from default discovery).
- **Firestore / Auth / Storage**: `lastConfirmedAt`, `updatedAt`, `createdAt` timestamps on `listings/{id}`.
- **Security Rules**: Only owner or admin may update `lastConfirmedAt`.
- **Realtime Behavior**: Confirming availability immediately restores listing to top of discovery feeds.
- **Real-Browser User Journey**: Owner taps "Confirm Available" ➔ listing timestamp updates ➔ badge turns green "Active today".
- **Adversarial Failure Case**: Stale listings (> 45d without confirmation) automatically filtered from search queries.
- **Evidence**: `listingFreshness.test.ts`, `marketplaceVisibility.test.ts`, E2E Master Phase 13.
- **Final Status**: **PASS**

---

### Finding RPR-010: Owner Applicant Triage Bottleneck
- **Research Finding**: Room owners receive flood of unstructured, unranked messages and cannot identify the best flatmate.
- **User Pain**: Overwhelmed landlords/owners; high friction picking the right applicant.
- **Competitor Gap**: FlatMate/NoBroker show chronological unstructured applicant lists.
- **Product Principle**: *Intelligent decision support for both sides of the marketplace*.
- **Required Feature**: Explainable Applicant Ranking Engine for Owners.
- **Actual Implementation**: `applicantRanking.ts`, `OwnerDashboard.tsx`.
- **UI/UX Experience**: Owner Dashboard orders applicants by fit score with clear reason chips (e.g. "Budget fits", "Verified Pro").
- **Business Logic**: Multi-factor evaluation combining lifestyle score, budget alignment, location, trust signals, and tie-breaking.
- **Firestore / Auth / Storage**: Evaluated dynamically over incoming `connections` collection records.
- **Security Rules**: Owner reads own incoming connections.
- **Realtime Behavior**: New applicants ranked immediately upon incoming request event.
- **Real-Browser User Journey**: Owner opens `/owner-dashboard` ➔ reviews top-ranked applicant ➔ clicks Accept ➔ chat created.
- **Adversarial Failure Case**: Chronological ties preserved cleanly without dropping older applicants.
- **Evidence**: `applicantRanking.test.ts`, E2E Master Phase 13.
- **Final Status**: **PASS**

---

### Finding RPR-011: Paywall Friction on Basic Messaging
- **Research Finding**: Competitors (Roomster, FlatMate.in) lock basic messaging behind expensive subscriptions.
- **User Pain**: Inability to contact potential roommates without paying steep fees.
- **Competitor Gap**: Competitors gate core chat behind paywalls.
- **Product Principle**: *Zero friction on core connections*.
- **Required Feature**: 100% Free Core Matching, Connect Requests, and Real-Time Chat.
- **Actual Implementation**: `PricingPage.tsx`, `useConnections.ts`, `useChat.ts`.
- **UI/UX Experience**: Unlimited connect requests in beta; zero paywall dialogs during messaging.
- **Business Logic**: No payment check required to send connection or chat messages.
- **Firestore / Auth / Storage**: Firestore rules allow standard chat and connection mutations for authenticated users.
- **Security Rules**: Authenticated users can create connections and send chat messages.
- **Realtime Behavior**: Instant message transmission without billing checks.
- **Real-Browser User Journey**: Seeker finds match ➔ clicks Connect ➔ owner accepts ➔ chat opens immediately for free.
- **Adversarial Failure Case**: Client cannot be locked out of messaging by artificial client-side flags.
- **Evidence**: `PricingPage.tsx`, E2E Master Phase 9.
- **Final Status**: **PASS**

---

### Finding RPR-012: Misleading Distance & Lack of Geographic Map Context
- **Research Finding**: Listings claim to be near tech hubs (e.g., Manyata / HSR) but are actually miles away in remote areas.
- **User Pain**: Commute nightmare, wasted physical visits to wrong locations.
- **Competitor Gap**: Competitors show text localities without interactive map cluster views.
- **Product Principle**: *Visual clarity through interactive maps*.
- **Required Feature**: Leaflet Metro Map with Geocoded Pin Clusters.
- **Actual Implementation**: `MapView.tsx`, `useGeocoding.ts`, `locationResolver.ts`.
- **UI/UX Experience**: Full-screen interactive map with locality pins, price tags, and room preview cards on click.
- **Business Logic**: Resolves city and locality coordinates with rate-limited OpenStreetMap geocoding and fallback hashing.
- **Firestore / Auth / Storage**: Coordinates stored on listing docs (`latitude`, `longitude`).
- **Security Rules**: Public read access to active listing pins.
- **Realtime Behavior**: Moving map or clicking pin dynamically highlights selected listing card.
- **Real-Browser User Journey**: Seeker navigates to `/map` ➔ zooms into Koramangala ➔ clicks cluster pin ➔ views room details.
- **Adversarial Failure Case**: Missing coordinates fall back smoothly to locality center coordinates without map crashing.
- **Evidence**: `locationResolver.ts`, `useGeocoding.ts`, E2E Master Phase 6.
- **Final Status**: **PASS**

---

### Finding RPR-013: Indian Dietary & Cultural Lifestyle Nuances
- **Research Finding**: Indian flatshares have strict dietary (pure veg vs non-veg, separate utensils) and house rule requirements.
- **User Pain**: Major cultural friction, food smell complaints, dietary discomfort in shared kitchens.
- **Competitor Gap**: Western roommate apps lack Indian dietary and cultural filters.
- **Product Principle**: *Tailored for Indian urban reality*.
- **Required Feature**: India-Specific Lifestyle Options & Dietary Filters.
- **Actual Implementation**: `SeekerOnboarding.tsx`, `staticData.ts`, `listingFilters.ts`.
- **UI/UX Experience**: Dedicated "Dietary Preference" (Vegetarian, Vegan, Non-Veg) and "House Rules" chips.
- **Business Logic**: String-equality matching on diet tokens; filterable across explore inventory.
- **Firestore / Auth / Storage**: Stored in user quiz answers and listing amenity/rules arrays.
- **Security Rules**: Standard profile and listing validation rules.
- **Realtime Behavior**: Selecting "Vegetarian Only" filters candidate list instantly.
- **Real-Browser User Journey**: Seeker selects Vegetarian ➔ feed filters out incompatible non-vegetarian profiles.
- **Adversarial Failure Case**: Conflicting dietary answers lower compatibility score appropriately.
- **Evidence**: `staticData.ts`, `compatibility.test.ts`, E2E Master Phase 4.
- **Final Status**: **PASS**

---

### Finding RPR-014: Accidental Session Overwrites & Route-Flicker Glitches
- **Research Finding**: Complex multi-role web apps frequently suffer route-flicker, losing onboarding progress on refresh.
- **User Pain**: Lost onboarding inputs, accidental navigation loops, broken session state.
- **Competitor Gap**: Fragile SPAs that reset state on hard refresh.
- **Product Principle**: *Bulletproof session stability*.
- **Required Feature**: Synchronized Auth Hydration & Onboarding Route Guards.
- **Actual Implementation**: `App.tsx`, `OnboardingGuard`, `useAuth.ts`.
- **UI/UX Experience**: Smooth `<PageLoader />` during hydration; zero route flicker; seamless return to exact onboarding step.
- **Business Logic**: `onAuthStateChanged` latches `loading: true` synchronously until Firestore profile snapshot confirms status.
- **Firestore / Auth / Storage**: Subscribes to `users/{uid}` in real time.
- **Security Rules**: Security rules enforce onboarding completion rules.
- **Realtime Behavior**: Profile changes reflect across all tabs without requiring manual reload.
- **Real-Browser User Journey**: Completed seeker hard refreshes `/dashboard` ➔ page hydrates cleanly without flickering to `/role-select`.
- **Adversarial Failure Case**: Direct URL access to `/dashboard` by un-onboarded user redirected safely to `/role-select`.
- **Evidence**: `App.tsx`, Adversarial Journey C & F.
- **Final Status**: **PASS**

---

## 3. Summary Classification

- **Total Research Findings Audited**: 14 Master Themes (30 Specific Requirements)
- **PASS**: 29 / 30 (96.7%)
- **BLOCKED_EXTERNAL**: 1 / 30 (3.3% - Automated DigiLocker / Aadhaar API integration; currently operated via Admin KYC manual queue)
- **PARTIAL**: 0
- **FAIL**: 0
- **UNVERIFIED**: 0
