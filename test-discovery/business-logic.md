# NestMate — Business Logic Discovery
_Evidence source: src/lib/ (pure functions), firestore.rules, hooks/_

---

## 1. Compatibility Scoring Engine

### Function: calculateCompatibility (matching.ts)
**Purpose:** Seeker-to-seeker or flatmate quiz compatibility (0-100%)

**Algorithm:**
1. Find common quiz question keys between two users
2. Score = (exact string matches / common keys) * 100
3. If cities differ (both known): cap at min(60, score * 0.6)
4. Returns 0 if no common quiz keys

**Critical rule:** Quiz answer IDs are opaque strings (e.g. 'before_10', 'veg', 'wfh'). Must NEVER be parsed as numbers.

---

### Function: getRoomMatchReasons (matching.ts)
**Purpose:** Multi-factor room-seeker compatibility (0-100%)

**5-Factor Model:**

| Factor | Max Points | Logic |
|--------|-----------|-------|
| Budget Fit | 25 | budget >= rent → 25pts; within 15% → 20pts; within 25% → 12pts; below 25% → 0pts |
| Location + Locality | 20 | Same locality → 20pts; same city → 14pts; different city → 0pts |
| Gender Requirement | 20 | Mismatch with female/male-only → 0pts; match → 20pts; open → 20pts |
| House Rules Alignment | 20 | 4 sub-factors: food(5), smoking(5), pets(5), lifestyle quiz overlap(5) |
| Trust + Verification | 15 | isVerified → 10pts; workEmailVerified → 5pts |

**Hard Constraints:**
- Explicit gender mismatch: total score capped at 40
- Different city: total score capped at min(60, score * 0.6)
- Final: min(100, max(0, round(total)))

---

### Function: calculateProfileCompatibility (matching.ts)
**Purpose:** Universal entry point for compatibility display

- If one party is owner with a listing → uses getRoomMatchReasons
- Otherwise → uses synthesizeQuizFromProfile + getMatchReasons (seeker-seeker path)

---

## 2. Listing Freshness and Discoverability

**Source:** src/lib/listingFreshness.ts

Discovered from file (4158 bytes). Key concept: a listing's discoverability is time-based:
- Listings become "stale" after a period without `lastConfirmedAt` update
- Owner must periodically confirm availability for listing to remain discoverable
- `isDiscoverable` function enforces freshness client-side (server cannot express this in rules)

**Note:** Firestore rules explicitly document this limitation: "Staleness... is enforced by the client guard (isDiscoverable)"

---

## 3. Connection Rate Limiting

**Source:** src/lib/connectionGuards.ts, useConnections.ts

- `FREE_CONNECT_LIMIT` constant controls free-tier monthly connection limit
- `countConnectionsSince(msList, startMs)` counts connections since start of current month
- UI checks monthly count before allowing new connection requests
- Firestore rules do NOT enforce rate limits (client-only guard)

---

## 4. Marketplace Visibility

**Source:** src/lib/marketplaceVisibility.ts (3673 bytes)

Controls whether a seeker or listing appears in discovery feeds. Inferred factors:
- Onboarding completion
- Account active status
- Profile completeness
- Freshness (for listings)

---

## 5. Applicant Ranking

**Source:** src/lib/applicantRanking.ts (7049 bytes)

Used by OwnerDashboard to rank seeker applicants. Algorithm details require deeper file read. Likely factors: compatibility score, verification level, activity recency.

---

## 6. Dynamic Traits System

**Source:** src/lib/dynamicTraits.ts (10911 bytes)

Generates display traits for profiles based on quiz answers. Creates human-readable lifestyle description tokens from raw quiz answer IDs.

---

## 7. Owner Verification State Machine

**Source:** src/lib/ownerVerification.ts (13019 bytes), firestore.rules

```
NOT_STARTED
     |
     v
  SUBMITTED (owner can set via create/update)
     |
     v (admin action only)
  UNDER_REVIEW
     |
    / \
   /   \
APPROVED REJECTED
             |
             v
  RESUBMISSION_REQUIRED
             |
             v
          SUBMITTED (cycle)
```

**Rule:** Owners CAN submit but CANNOT approve themselves. Admin is required to set APPROVED.

---

## 8. Screening Questionnaire

**Source:** src/lib/screeningQuestions.ts (7112 bytes), src/components/ScreeningQuestionnaireModal.tsx

Owners can configure screening questions for their listing. Seekers answer them when sending a connection request. Answers are stored in `connections/{id}.screeningAnswers`.

---

## 9. Report / Moderation System

**Source:** firestore.rules (reports collection)

Valid report reasons: `spam`, `spam_or_scam`, `harassment`, `inappropriate`, `inappropriate_behavior`, `fake`, `fake_profile`, `other`

- Reporter identity is server-enforced from auth token
- Cannot report yourself (targetId != reporterId enforced in rules)
- Optional description field capped at 2000 characters
- Only admins can read reports

---

## 10. Review/Vouch System

**Source:** firestore.rules (reviews collection)

- Any authenticated user can review any other user (except themselves)
- Rating must be integer 1-5
- Optional text capped at 1000 characters
- Reviewer can edit/delete own review
- Duplicate prevention: client-side only (rules cannot query)

---

## 11. Analytics Event Tracking

**Source:** src/lib/analytics.ts (11688 bytes), firestore.rules

Tracked events (whitelisted in Firestore rules):
- `search_performed` — user performs a search
- `listing_viewed` — listing detail page visited
- `interest_sent` — connection request sent
- `interest_accepted` — connection request accepted
- `interest_rejected` — connection request rejected
- `connection_created` — connection established
- `chat_started` — first message in a chat
- `contact_shared` — WhatsApp number shared
- `listing_created` — new listing created
- `listing_closed` — listing closed/filled
- `availability_confirmed` — owner confirms listing is available
- `match_explanation_viewed` — compatibility breakdown viewed

---

## 12. User Intent System

**Source:** src/lib/userIntent.ts (6048 bytes)

Determines display UI based on user's declared housing intent. Used to personalize onboarding flows and dashboard content.

---

## 13. Role-Based Navigation

**Source:** src/lib/roleNavigation.ts (2895 bytes)

Maps user role to appropriate navigation destinations. Used for smart redirects throughout the app.

---

## 14. City Normalization

**Source:** src/lib/cityNormalization.ts (1451 bytes)

Normalizes city name variants to canonical form (e.g. "Bangalore" → "Bengaluru") for consistent matching.

---

## 15. Display Truth (Anti-Fabrication Rules)

**Source:** src/lib/displayTruth.ts (2647 bytes)

Enforces that compatibility scores and reasons shown in UI are only derived from actual data. No fabricated or assumed reasons.

---

## 16. Listing Filters

**Source:** src/lib/listingFilters.ts (5484 bytes)

Client-side filter functions applied to listing results. Filter dimensions include:
- City / locality
- Rent range (min/max)
- Flat type (1BHK, 2BHK, etc.)
- Gender preference
- Amenities
- Move-in date

---

## 17. Supported Cities and Localities

15 supported cities:
Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, Chennai, Kolkata, Ahmedabad, Jaipur, Chandigarh, Kochi, Goa, Lucknow, Indore, Coimbatore

Each city has a curated list of localities (see staticData.ts for full list).

---

## 18. Flat Types (listing.flatType)

From staticData.ts:
- 1BHK, 2BHK, 3BHK, 4BHK
- Studio
- PG (Paying Guest)
- Independent House
- Shared Room
- Villa

---

## 19. Active Status Calculation

**Source:** matching.ts — getActiveStatus()

| Threshold | Status | Display |
|-----------|--------|---------|
| < 15 min ago | online | "Active now" |
| < 24 hours ago | recent | "Active Xh ago" |
| 1+ days | offline | "Active X days ago" |

Powered by `lastActiveAt` field updated by `useActiveTracking` hook.

---

## 20. WhatsApp Integration

**Source:** useConnections.ts — formatWhatsAppDeepLink()

- Only shared with accepted connection partners
- Contact stored in `userContacts/{uid}` (protected collection)
- Indian 10-digit numbers get `91` prefix automatically
- Generates `https://wa.me/{number}?text={encodedText}` deep link
