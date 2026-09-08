# NESTMATE — COMPLETE END-TO-END SCREEN-BY-SCREEN WIREFRAME

**Version:** 1.0 — Locked · **Date:** 2026-09-05
**Scope:** End-to-end user flow + functional wireframes for all 49 approved screens. This document shows exactly how the user moves through NestMate, screen by screen, from the first visit to the final meaningful outcome.
**Source of truth:** the approved NestMate product documentation (Product Build Bible + Master Documentation). No new features, no redesign, no current-implementation analysis, no technical architecture.
**Screen ID system:** `NM-001 … NM-049` — one ID per screen, unique and stable. Wireframes are numbered `W-01 … W-49`, one per screen, with the fixed 1:1 mapping **W-XX ↔ NM-XXX** preserved from the approved wireframe specification.

**How each screen is documented (Section 03):** Role → Purpose → Entry → Wireframe (functional ASCII) → User Actions (action → response → next screen) → Navigation (entry → action → response → next, plus back/close/cancel/save/exit/deep-link/auth-wall behaviour) → States (what the user sees → can do → where they go next) → Branches (where a screen has major branch points).

**Notation inside wireframes**

```text
[ ]  button — ( ( ) ) marks the primary CTA        ♡ / ★  save toggle
( )  radio / segmented choice                      🔒     masked / privacy-protected
⋯    overflow menu                                 ⚑     system card (platform voice)
[B-4] trust badge (B-1…B-5)                        🕒     freshness stamp ("Confirmed Xd ago")
C-01…C-08  shared components (listing card, flatmate card, connect sheet,
           consent card, empty state, badge row, auth wall, wizard skeleton)
EC-xx      edge-case behaviours from the approved edge-case register
```

**Global defaults (apply to every screen unless overridden):** skeleton loading ≤300ms perceived · inline errors that never clear entered data · empty states = one honest sentence + one next action (C-05) · offline banner where cache exists · one primary CTA per screen/state · destructive actions live in overflow menus, never swipe · bottom navigation only on the two role shells · security/privacy enforcement is server-side (stated as behaviour, never as implementation).

---

# 01 — MASTER END-TO-END FLOW

How NestMate works from the first visit to the final meaningful outcome — the actual approved screen system, with the branch points that matter. Two lanes (Seeker, Owner) share one entry, one trust layer, and one safety/account rail.

```text
NM-001 Landing
   │ "Find a room"                        "I have a room to offer"
   ▼                                              │
NM-002 Room Search (public, masked)               │
   │ card tap                                    │
   ▼                                              │
NM-003 Room Detail (public, masked)               │
   │ Connect / Save tap → AUTH WALL (C-07,       │
   │ original action carried — EC-05)            │
   ├──────────────────────────────────────────────┤
   ▼                                              ▼
NM-005 Signup ──────────────────► NM-007 OTP Verification ──► T0 granted
   │ (number exists? → NM-006 Login, EC-02)      │ (wrong ×5 → 30-min lock, EC-03)
   ▼                                             ▼
NM-008 Role & Intent Selection  ◄──────── returning users skip to NM-010/NM-030
   │ "I'm looking"              │ "I have a room"      │ "Both" → seeker path first
   ▼                            ▼
NM-009 Seeker Onboarding      NM-029 Owner Onboarding
   │ (6 steps, resumable EC-01)  │ (4 steps + verification explainer)
   ▼                            ▼
NM-010 Seeker Home            NM-019 Verification (T2 ID + T3 ownership proof)
   │ matches visible             ▼
   │                           NM-020 Verification Status (In review <24h)
   ▼                            │ approved → badges B-3/B-4
NM-011 Room Search   NM-014     │ rejected → reason + fix → resubmit (EC-07)
   │ (authed)        Flatmate    ▼
   │ Advanced? → NM-013 Discovery  NM-031 Listing Creation Wizard (6 steps)
   │ filters → back                 │ Publish → T3 GATE (unverified → NM-019 interstitial)
   ▼                                │ auto-checks → Pending ──flag──► admin review
NM-012 Room Detail                  ▼        (approve / edit-require / unlist)
   │ facts · owner trust ·        Active
   │ occupant fit · freshness       │
   │ Save → NM-016 Saved Items      ▼
   │ Connect → intro-note sheet   NM-030 Owner Dashboard (analytics, nudges)
   ▼                                │
NM-021 Connections (pending,        ▼
   │  14-day TTL)                 NM-034 Applicant Pipeline
   │ accept (or decline: silent,    │ (New → Shortlisted → Chatting → Met)
   │ 90d EC-08 / expire / withdraw) │ card tap → NM-035 Detail & Compare (≤3)
   ▼                                │ SELECT → fill cascade (R-09)
NM-023 Chat Thread                  │ listing Filled on NM-033 · hidden everywhere ·
   │ masked · context anchor        │ non-selected politely closed · NM-016 rows "Filled"
   │ "Share phone number"           ▼
   │ → C-04 consent card ── BOTH consent? ──► numbers revealed once in-thread
   │         │ no → CTA sleeps 7 days, chat continues      + pre-meet safety card
   ▼                                             ▼
REAL-WORLD MEETING (off-platform by design) ── outcome feeds owner lane above
   │ room filled / pair formed / seeker keeps searching
   ▼
OUTCOME

CROSS-CUTTING RAILS (reachable from any screen)
  TRUST:   any "Verify" CTA → NM-019 → NM-020 → badges → trust-weighted re-ranking
  SAFETY:  ⋯ Report anywhere → NM-027 (reason → evidence → block) → protections →
           NM-047 triage (S1/S2 <12h) → disposition → closure notice (NM-024)
           NM-026 Safety Center always available
  RETURN:  NM-006 Login → NM-010/NM-030 → NM-024 → deep link to the exact object
           (NM-022 Chat List rows · NM-021 requests · NM-020 status · NM-033/NM-012 rooms)
           expired object → state banner + nearest healthy screen, EC-12
  ACCOUNT: NM-037 Settings → roles (→ NM-008) · NM-025 notifications · NM-038 privacy
           · NM-039 help · NM-040 deactivate / delete (14-day grace)
  ADMIN:   NM-041 → NM-042 queues → NM-043/044 verify · NM-045/046 moderate ·
           NM-047 reports · NM-048 users · NM-049 metrics (V1) — internal, never linked
```

**Dead-end audit:** every arrow above is a specified transition owned by a screen in Section 03; every terminal state offers a next action. The auth wall always re-executes the original action after onboarding (EC-05) — the user never re-navigates manually.

---

# 02 — COMPLETE SCREEN INVENTORY

Every approved screen, exactly once: NM-001 → NM-049. "Previous Screen" lists the primary entry paths; "Next Screen" lists the primary onward paths — the full branch logic lives in Sections 03 and 04.

| Screen ID | Screen Name | Role | Previous Screen | Next Screen |
|---|---|---|---|---|
| NM-001 | Landing / Home | Guest (unauthenticated) | Direct URL · SEO · shared links | NM-002 · NM-005 · NM-004 |
| NM-002 | Room Search (Public Browse) | Guest (unauthenticated) | NM-001 · SEO locality pages · shared search links | NM-003 · NM-005 (auth wall) |
| NM-003 | Room Detail (Public, Masked) | Guest (unauthenticated) | NM-002 · shared cards · SEO | NM-005 (auth wall) · NM-002 · NM-004 |
| NM-004 | Trust & Safety Center (Public) | Guest (unauthenticated) | NM-001 footer · NM-003 pointer · ads | NM-005 · NM-027 (guest report · listing pre-carried) |
| NM-005 | Signup | Guest (new account) | All auth walls (context carried) · NM-001 · NM-004 | NM-007 |
| NM-006 | Login | Returning / existing user | NM-001 · NM-005 · session-expiry redirects | NM-007 |
| NM-007 | OTP Verification | New or returning user (pre-T0) | NM-005 · NM-006 | NM-008 (new user) · return path (login) |
| NM-008 | Role & Intent Selection | New user (role choice) / existing user (role add) | NM-007 success · NM-037 (role add) | NM-009 · NM-029 · NM-010 (skip → seeker default) |
| NM-009 | Seeker Onboarding Wizard | New seeker (T0) | NM-008 · resume banner on NM-010 | NM-010 (personalized immediately) |
| NM-010 | Seeker Home (Personalized) | Authenticated user — seeker mode | Bottom nav · login default · deep links | NM-011 · NM-012 · NM-014 |
| NM-011 | Room Search (Authenticated) | Authenticated user — seeker mode | NM-010 · nav Search · NM-016 | NM-012 · NM-013 · NM-016 |
| NM-012 | Room Detail (Authenticated) | Authenticated user — seeker mode | NM-011 · NM-010 rails · NM-016 | Connect sheet · NM-016 save · NM-015 (owner card) |
| NM-013 | Advanced Filters | Authenticated user — seeker mode | NM-011 "Advanced filters" | NM-011 (results re-ranked) |
| NM-014 | Flatmate Discovery | Authenticated user — seeker mode | NM-010 rail · nav Flatmates · NM-016 | NM-015 · connect sheet |
| NM-015 | Flatmate Profile Detail | Authenticated user — seeker mode | NM-014 · NM-023 header · NM-034 (read-only) | Connect sheet · NM-023 (if connected) · NM-027 |
| NM-016 | Saved Items | Authenticated user — seeker mode | NM-010 rail · nav | NM-012 · NM-015 · NM-011 |
| NM-017 | My Profile (Edit) | Any authenticated user (own profile) | Nav Profile · NM-009 return · NM-010 meter | NM-019 · NM-028 · NM-038 |
| NM-018 | Preferences (Edit) | Authenticated user — seeker mode | NM-017 · NM-014 chips · NM-024 deep link | NM-014 / NM-011 (matches recompute) |
| NM-019 | Verification Submission (T2/T3) | Any authenticated user (T2) · owner for T3 | NM-017 / NM-020 CTAs · NM-029 · NM-031 gate | NM-020 (in review) |
| NM-020 | Verification Status | Any authenticated user (T2) · owner for T3 | NM-017 card · NM-030 gate · notifications | NM-019 resubmit · NM-026 |
| NM-021 | Connections | Connected users (both roles) | NM-010 pill · NM-024 deep link · nav | NM-023 (accept) · NM-015 (view profile) |
| NM-022 | Chat List | Connected users (both roles) | Nav Chats · NM-024 deep link | NM-023 |
| NM-023 | Chat Thread | Connected users (both roles) | NM-022 · NM-021 accept · NM-012 "Open chat" | Reveal → off-platform · NM-027 report |
| NM-024 | Notifications Center | All authenticated users | Top-bar bell · deep links | NM-021 · NM-023 · NM-034 |
| NM-025 | Notification Settings | All authenticated users | NM-037 · NM-024 | Auto-save · back |
| NM-026 | Safety Center (Authenticated) | All authenticated users | NM-004 (logged-in) · chat cards · NM-027 confirm | NM-027 · NM-039 |
| NM-027 | Report / Block Flow | All authenticated users (reporter) | Overflow menus everywhere · NM-026 | NM-026 confirmation |
| NM-028 | Profile Public Preview | Any authenticated user (own preview) | NM-017 · NM-038 | NM-038 (adjust) |
| NM-029 | Owner Onboarding Wizard | New owner (T0) | NM-008 ("Offer") · NM-037 (role add) | NM-019 (owner variant) |
| NM-030 | Owner Dashboard | Authenticated user — owner mode | Bottom nav (owner mode) · login default · deep links | NM-031 · NM-032 · NM-034 |
| NM-031 | Listing Creation Wizard | Authenticated user — owner mode | NM-030 · NM-032 "New" · post-verification | Publish → NM-030 (Active) · NM-019 gate |
| NM-032 | Listings Management | Authenticated user — owner mode | NM-030 · nav Listings | NM-033 · quick actions |
| NM-033 | Listing Detail (Owner View) | Authenticated user — owner mode | NM-032 row · NM-030 card | NM-034 · edit · Mark Filled |
| NM-034 | Applicant Pipeline | Authenticated user — owner mode | NM-030 · nav Applicants · NM-033 | NM-035 · NM-023 |
| NM-035 | Applicant Detail & Compare | Authenticated user — owner mode | NM-034 card | Stage actions · NM-023 · NM-034 |
| NM-036 | Owner Profile (Edit) | Authenticated user — owner mode | Nav Profile (owner mode) | NM-019 · NM-028 preview |
| NM-037 | Settings | All authenticated users | Nav Profile → Settings | NM-025 · NM-038 · NM-020 |
| NM-038 | Privacy & Visibility Controls | All authenticated users | NM-037 · NM-028 | NM-028 (live preview) |
| NM-039 | Help & Support | All authenticated users | NM-037 · footer · error states | Ticket created → NM-026 |
| NM-040 | Account Deactivation / Deletion | All authenticated users | NM-037 danger zone | NM-006 (reactivation) · NM-005 (post-deletion) |
| NM-041 | Admin Login | Admin (internal — founding team only) | Direct `/admin` route (never linked) | NM-042 |
| NM-042 | Admin Dashboard | Admin (internal — founding team only) | NM-041 | NM-043 · NM-045 · NM-047 |
| NM-043 | Verification Review Queue | Admin (internal — founding team only) | NM-042 | NM-044 |
| NM-044 | Verification Case Detail | Admin (internal — founding team only) | NM-043 | Decision → back to NM-043 |
| NM-045 | Listing Moderation Queue | Admin (internal — founding team only) | NM-042 | NM-046 |
| NM-046 | Listing Moderation Detail | Admin (internal — founding team only) | NM-045 | Action → back to NM-045 |
| NM-047 | Report Queue & Case Management | Admin (internal — founding team only) | NM-042 | Disposition → back |
| NM-048 | User Management | Admin (internal — founding team only) | NM-042 | Action → back |
| NM-049 | Platform Metrics | Admin (internal — founding team only) | NM-042 (V1 release) | Export |

**Traceability note.** The Product Build Bible identifies the same 49 screens with area-prefixed IDs; the correspondence is fixed 1:1: NM-001…004 = PUB-01…04 (public) · NM-005…008 = AUTH-01…04 (authentication) · NM-009, NM-029 = ONB-01/02 (onboarding) · NM-010, NM-030 = HOME-01/02 (role shells) · NM-011…013, NM-016 = DISC-01/02/03/04 · NM-012 = ROOM-01 · NM-014 = DISC-03 · NM-015, NM-017, NM-028 = PROF-01/02/03 · NM-018 = PREF-01 · NM-019/020 = VER-01/02 · NM-021 = CONN-01 · NM-022/023 = CHAT-01/02 · NM-024/025 = NOTIF-01/02 · NM-026/027 = SAFE-01/02 · NM-031…036 = OWN-01…06 · NM-037…040 = ACCT-01…04 · NM-041…049 = ADM-01…09. Edge-case IDs (EC-xx), components (C-01…C-08), badges (B-1…B-5), and rules (R-xx) are shared ID systems used by both documents.

# 03 — SCREEN-BY-SCREEN WIREFRAMES (W-01 → W-49)

All 49 screens in product-area order, nothing skipped. Per screen: **Role · Purpose · Entry · Wireframe** (functional structure — blocks, CTAs, navigation, trust/privacy markers), then **User Actions** (every CTA with its destination), **Navigation** (entry → action → response → next, plus back/cancel/save/exit/deep-link/auth-wall behaviour), **States** (sees → can do → where next), and **Branches** for screens with major branch points.

## W-01 — NM-001 — Landing / Home

### Role

Guest (unauthenticated)

### Purpose

Communicate the NestMate promise — verified people, explained compatibility, fresh listings — and funnel guests into public browse or signup within 10 seconds.

### Entry

- Direct URL / SEO / campaign links
- Shared links (public-safe projections, `?ref=` attribution variant)
- Logout from any authenticated screen (returns here)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ [Logo] NestMate          Trust  Login      │ ← Trust → NM-004 (pre-commitment)
├────────────────────────────────────────────┤
│  Find a room you'll actually like.        │
│  Verified people. Real fit. Fresh rooms.   │
│                                            │
│  [ Find a room in Bangalore → ]  (primary) │ ← city-aware CTA; browse w/o signup
│  [ I have a room to offer ]      (ghost)   │ ← owner funnel → NM-008 (Offer preselected)
├────────────────────────────────────────────┤
│ 1,240 active rooms · 92% owner-verified ·  │ ← honest live stats (cached 5 min)
│ listings confirmed every 30 days           │   <20 listings: hide stats → "launching"
├────────────────────────────────────────────┤   + waitlist capture
│ Fresh rooms near you                       │
│ ┌────────┐ ┌────────┐ ┌────────┐ →         │ ← reuses listing card C-01
│ │card    │ │card    │ │card    │           │   (public projection — no owner identity)
│ │₹/loc/f │ │…       │ │…       │           │
│ │✓verified│ │…      │ │…       │           │
│ └────────┘ └────────┘ └────────┘           │
├────────────────────────────────────────────┤
│ How it works          [Seeker | Owner]     │
│ 1 Verify → 2 Match → 3 Meet                │
├────────────────────────────────────────────┤
│ Trust & safety band (3 badges explainer)   │ ← links NM-004; scam-literacy teaser
├────────────────────────────────────────────┤
│ FAQ teaser · footer (ToS · Privacy · Help) │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap "Find a room in Bangalore" | Opens public browse | NM-002 |
| Tap "I have a room to offer" | Opens signup with owner intent pre-carried | NM-005 |
| Tap a role tab | Switches how-it-works content (no nav change) | NM-001 |
| Tap a room preview card | Opens public masked detail | NM-003 |
| Tap a trust pillar card | Opens Trust & Safety Center | NM-004 |
| Tap Login | Opens login; post-login returns to prior intent | NM-006 |
| Tap FAQ teaser | Expands inline answers | NM-001 |

### Navigation

```text
ENTRY ← Direct URL · SEO · shared links
  ↓
NM-001 — Landing / Home
  ↓
PRIMARY ACTION → Tap "Find a room in Bangalore"
  ↓
SYSTEM RESPONSE → Opens public browse
  ↓
NEXT SCREEN → NM-002
```

No back stack (root screen) — device back exits gracefully. No bottom nav (public shell). Any deep link landing here resolves to this screen with attribution preserved. All gated taps downstream are intercepted by the auth wall (C-07) with the original action carried.

### States

```text
DEFAULT
↓
Full page: hero, live stat band, fresh-room strip, how-it-works, trust band
↓
Tap any CTA, card, tab, or the trust band
↓
NM-002 / NM-003 / NM-005 / NM-004 per the action table

LOADING
↓
Hero static; stat band + card strip skeletonized (≤300ms perceived)
↓
Wait — no action required
↓
Screen arrives in place (no navigation)

EMPTY (no supply yet)
↓
Stat band shows honest zeros; strip: "No live rooms yet — be first to see them" + signup CTA
↓
Tap the signup CTA
↓
NM-005 (never blank, never fake numbers)

ERROR (stats or cards fail)
↓
Hero + how-it-works still render; band/strip degrade with a retry link
↓
Retry, or continue into browse/signup
↓
Stays on NM-001 (page never blocks on data failure)
```

---

## W-02 — NM-002 — Room Search (Public Browse)

### Role

Guest (unauthenticated)

### Purpose

Let guests evaluate real Bangalore supply before committing to signup — the product's honest shop window and its SEO surface.

### Entry

- NM-001 "Find a room in Bangalore"
- SEO locality pages (rooms in Bangalore by locality)
- Shared/saved search links (public projection); direct URL; back from NM-003

### Wireframe

```text
┌────────────────────────────────────────────┐
│ NestMate     [Bangalore ▾]       Login     │ ← public shell: no bottom nav
├────────────────────────────────────────────┤
│ 🔍 Locality, area…           [Filters ⚙]   │ ← public filter subset: locality/rent/type
│ [Rent▾][Move-in▾][Type▾]                   │
├────────────────────────────────────────────┤
│ 24 rooms · Sorted: Freshest ▾              │ ← freshness is the default sort
├────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ [photo]                                │ │ ← C-01 card, public projection:
│ │ ₹16,000/mo · Deposit from ₹40k         │ │   rent, deposit-range, type, locality,
│ │ Private room · 2BHK · Indiranagar      │ │   freshness stamp, B-4 badge.
│ │ ✓ Owner verified  · 🕒 Confirmed 2d ago│ │   NO compatibility chip (needs profile)
│ └────────────────────────────────────────┘ │
│ ┌ …card … ┐                                │ ← infinite scroll w/ skeletons
├────────────────────────────────────────────┤
│ ( Sign up to see which rooms match you )   │ ← sticky pill appears after 3 card views
└────────────────────────────────────────────┘   tap → NM-005 with return path (EC-05)
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap a room card | Public masked detail opens | NM-003 |
| Apply or change a filter | Result list refreshes in place; count updates | NM-002 |
| Change sort | List re-ranks (freshness is default) | NM-002 |
| Tap any contact/connect affordance | Auth-wall sheet restates the original action (C-07) | NM-005 (context carried) |
| Scroll past 3 cards | Signup pill appears once per session | Optional → NM-005 |

### Navigation

```text
ENTRY ← NM-001 · SEO locality pages · shared search links
  ↓
NM-002 — Room Search (Public Browse)
  ↓
PRIMARY ACTION → Tap a room card
  ↓
SYSTEM RESPONSE → Public masked detail opens
  ↓
NEXT SCREEN → NM-003
```

Previous: NM-001, external, or deep link. Back from NM-003 restores scroll position and filters. No bottom nav (public shell). A guest who deep-links the authenticated search (NM-011) is redirected here with the same query in public projection; top-bar Login returns here after authentication.

### States

```text
LOADING
↓
Skeleton cards in the final list layout (≤300ms perceived)
↓
Wait
↓
Results render in place

EMPTY (no match)
↓
"No rooms match yet — new listings land daily" + [Get alerts] (C-05)
↓
Tap Get alerts → signup with this search carried (EC-05)
↓
NM-005

EXPIRED (card ages out mid-scroll, EC-12)
↓
That card swaps to its expired variant (dimmed, "expired Xd ago")
↓
Keep scrolling; expired cards are not tappable as live rooms
↓
Stays on NM-002 (list stays usable — no dead rows)

RESTRICTED (scrape-like abuse, EC-28)
↓
Temporary block page with an appeal link
↓
Appeal, or return later
↓
NM-039 (appeal) / back to NM-001 after the block lifts
```

---

## W-03 — NM-003 — Room Detail (Public, Masked)

### Role

Guest (unauthenticated)

### Purpose

Present complete, honest decision facts for one room with all identity masked, and convert interest into signup at the moment intent peaks.

### Entry

- NM-002 card tap
- Shared public cards (WhatsApp/DM) and deep links
- SEO

### Wireframe

```text
┌────────────────────────────────────────────┐
│ [photo gallery — swipe, 1/5 dots]   [⤴][♡] │ ← ♡ = auth-walled save; ⤴ share public card
├────────────────────────────────────────────┤   (OG: photo+rent+locality+badges+freshness)
│ Private room in 2BHK · Indiranagar         │
│ ₹16,000/mo · Deposit ₹40,000 · Move-in Aug │
│ Furnished · Attached bath · 2 occupants    │
├────────────────────────────────────────────┤
│ ✓ Owner verified (Mar 2026)  🕒 Confirmed  │ ← trust block BEFORE rules; never scroll-hunted
│   2 days ago                               │
│ "Every NestMate owner is ID & ownership    │ ← safety pointer → NM-004
│  verified — how it works →"                │
├────────────────────────────────────────────┤
│ Who lives here: 2 residents (1M·1F)        │ ← composition only — never identities
├────────────────────────────────────────────┤
│ Amenities: WiFi ✓ Geyser ✓ Washing m/c ✗…  │
│ House rules: Veg kitchen · No smoking ·    │
│ Guests: weekends ok                        │
│ About the area (locality pin — approximate)│ ← jittered to locality centroid
├────────────────────────────────────────────┤
│ Listed by [photo] Priya · ✓ ID verified    │ ← display name only if owner opted in
│ Replies within a few hours                 │   (response tier F-068 when owner)
├────────────────────────────────────────────┤
│ [    Connect with owner      ] (sticky CTA)│ ← auth wall → NM-005, action resumes (EC-05)
│  Ask a question · Report                   │   guests report via NM-004 form
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap "Connect with owner" / "Ask a question" | Auth wall restates the action (C-07); after onboarding it auto-executes — the question rides into the intro note (C-03, EC-05) | NM-005 → action resumes |
| Tap share | Public-safe share card generated (photo, rent, locality, badges, freshness) | Share sheet |
| Tap overflow → Report | Guest report path opens, listing-scoped | NM-004 → NM-027 |
| Tap Save | Auth wall (C-07), save context carried | NM-005 |
| Tap safety pointer | Trust & Safety Center opens | NM-004 |

### Navigation

```text
ENTRY ← NM-002 · shared cards · SEO
  ↓
NM-003 — Room Detail (Public, Masked)
  ↓
PRIMARY ACTION → Tap "Connect with owner" / "Ask a question"
  ↓
SYSTEM RESPONSE → Auth wall restates the action (C-07); after onboarding it auto-executes — the question rides into the intro note (C-03, EC-05)
  ↓
NEXT SCREEN → NM-005 → action resumes
```

Previous: NM-002 or deep link. Deep links land here directly in the guest projection. Back always restores NM-002 state (scroll, filters). No bottom nav.

### States

```text
DEFAULT
↓
All facts + ≥3 photos; owner trust row above the fold
↓
Gallery, facts, trust block, Connect / Save / Share
↓
Per action table (Connect → auth wall → NM-005)

EXPIRED / UNAVAILABLE (EC-12)
↓
State banner (paused / expired / filled) + similar live rooms
↓
Browse similar rooms, or go back to search
↓
NM-002 (deep links resolve to this state — never a 404)

DISABLED (photos removed by moderation, EC-15)
↓
Gallery re-validated to ≥1 photo, or the listing auto-pauses with a banner
↓
Continue with the remaining facts, or return to search
↓
Stays on NM-003 / NM-002

PENDING (owner verification under review)
↓
Explanatory banner on the trust row; badge withheld until review resolves
↓
Continue evaluating the masked facts
↓
Stays on NM-003
```

---

## W-04 — NM-004 — Trust & Safety Center (Public)

### Role

Guest (unauthenticated)

### Purpose

Explain the trust model before any commitment — how graduated verification works, what badges mean, how reports are handled — turning skeptics into signups.

### Entry

- NM-001 footer and trust-pillar cards
- NM-003 safety pointer and guest report path
- Ads / social bios
- NM-026 (authenticated users crossing over)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Trust & Safety                           │
├────────────────────────────────────────────┤
│ [How verification works] [Badges] [Scams]  │ ← TOC chips; anchors scroll
│ [Meet safely] [Your privacy]               │
├────────────────────────────────────────────┤
│ Verification tiers (plain language)        │
│ T0 Phone verified  — everyone starts here  │
│ T1 Profile complete — real, detailed human │
│ T2 ID verified     — govt ID + selfie      │
│ T3 Owner verified  — ID + room control     │
│ ⚑ "Verification ≠ endorsement. Always     │ ← mandatory disclaimer
│    meet in person before paying."          │
├────────────────────────────────────────────┤
│ Badge gallery: B-1…B-5 cards w/ meaning    │
├────────────────────────────────────────────┤
│ Scam patterns (tap to expand)              │
│ ▸ "Visiting pass" ₹2–3k before you see…    │ ←  patterns in local context
│ ▸ Deposit demanded before visit…           │
│ ▸ Owner refuses video/meet…                │
├────────────────────────────────────────────┤
│ Meet-safe checklist (5 items)              │ ← PP-08 content
├────────────────────────────────────────────┤
│ Privacy promise: numbers stay hidden until │ ← D-07 in one sentence
│ both people agree to share.                │
├────────────────────────────────────────────┤
│ (  Create your verified profile  )         │ ← primary CTA band after safety content
│ How we handle reports: safety <12h · other │
│ <48h · every report gets an outcome.       │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap "Create your verified profile" | Signup opens with trust context carried | NM-005 |
| Tap / expand a scam pattern | Detail reveals in place | NM-004 |
| Tap an anchor chip | Scrolls to that section | NM-004 |
| (Logged-in) tap safety links | Authenticated Safety Center opens | NM-026 |

### Navigation

```text
ENTRY ← NM-001 footer · NM-003 pointer · ads
  ↓
NM-004 — Trust & Safety Center (Public)
  ↓
PRIMARY ACTION → Tap "Create your verified profile"
  ↓
SYSTEM RESPONSE → Signup opens with trust context carried
  ↓
NEXT SCREEN → NM-005
```

Previous: NM-001/NM-003/external; back returns to the prior position. No bottom nav. The logged-in variant swaps the CTA band for authenticated links (NM-026) — same content, one narrative.

### States

```text
DEFAULT
↓
Full article: verification tiers, badges, scam literacy, meet-safely, privacy
↓
Read; use TOC chips; tap report/signup CTAs
↓
NM-005 / guest report path → NM-027 (listing pre-carried from NM-003)

LOADING
↓
Section skeleton (≤300ms perceived)
↓
Wait
↓
Article renders in place

ERROR (content fails)
↓
Inline retry; article chrome still renders
↓
Retry the failed section
↓
Stays on NM-004 (page never blocks entirely)
```

---

## W-05 — NM-005 — Signup

### Role

Guest (new account)

### Purpose

Phone-first account creation with minimal friction: one field, two consents, one tap — then straight into OTP.

### Entry

- Every auth wall (C-07) with the interrupted action carried (EC-05)
- NM-001 and NM-004 CTAs
- NM-006 "Create an account"
- NM-007 "Change number"

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Create your account                      │ ← context banner if auth-walled:
├────────────────────────────────────────────┤   "Continue connecting with Priya →"
│ We'll text you a code. No passwords.       │
│                                            │
│  Phone number                              │
│ ┌─────┬──────────────────────────────┐     │
│ │ +91 │ 98••••••••                   │     │ ← country locked; +91 validation
│ └─────┴──────────────────────────────┘     │
│                                            │
│ [x] I agree to the Terms        (blocking) │ ← unchecked = disabled CTA;
│ [x] I agree to the Privacy Policy (block.) │   links open in sheet, consent versioned
│                                            │
│ (          Continue          )             │ ← primary; ≤1s transition to OTP
│                                            │
│  I already have an account → NM-006        │
│  Email login coming soon (V1.1)            │ ← expectation note
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Enter valid phone + both consents + Continue | OTP dispatched (rate-limited); transition ≤1s | NM-007 |
| Enter a number that already has an account | No enumeration error — gentle sheet: "This number already has an account — Log in", number prefilled (EC-02) | NM-006 |
| Hit the send rate limit | Cooldown message with a live timer | NM-005 |
| Continue with a consent unticked | CTA stays disabled until both are ticked | NM-005 |
| Tap "I already have an account" | Login opens with the number carried | NM-006 |

### Navigation

```text
ENTRY ← All auth walls (context carried) · NM-001 · NM-004
  ↓
NM-005 — Signup
  ↓
PRIMARY ACTION → Enter valid phone + both consents + Continue
  ↓
SYSTEM RESPONSE → OTP dispatched (rate-limited); transition ≤1s
  ↓
NEXT SCREEN → NM-007
```

Back always returns to the interrupted context (NM-003/NM-002/etc.) — never to a dead start. No bottom nav. Leaving via device back preserves the carried action for return.

### States

```text
DEFAULT
↓
Phone field, consent checkboxes, CTA disabled until valid
↓
Enter number, accept consents, submit
↓
NM-007

ERROR (invalid number)
↓
Field-level message naming the fix; entered data never cleared (EC-16)
↓
Correct the number and resubmit
↓
NM-007

RESTRICTED (rate-limited)
↓
Cooldown message with a live timer
↓
Wait out the timer, then retry
↓
NM-007 (after cooldown)

EXISTING NUMBER (EC-02)
↓
Gentle login sheet with the number prefilled — never an error wall
↓
Continue to login
↓
NM-006
```

### Branches

```text
```text
SUCCESS (new number) → NM-007
EXISTING NUMBER (EC-02) → gentle login sheet, prefilled → NM-006 (never an error wall)
CANCEL/ABANDON → guest state preserved → origin public screen still reachable
```
```

---

## W-06 — NM-006 — Login

### Role

Returning / existing user

### Purpose

Fast returning access via one phone number and an OTP — no passwords anywhere.

### Entry

- NM-001 "Login"
- NM-005 "I already have an account" (number prefilled)
- Session-expiry redirects (return target preserved)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Welcome back                             │
├────────────────────────────────────────────┤
│  Phone number                              │
│ ┌─────┬──────────────────────────────┐     │
│ │ +91 │ 98••••••••                   │     │ ← remembered device: masked hint row
│ └─────┴──────────────────────────────┘     │   "Use +91 98•••••21 (this device)"
│ (        Send code           )             │
│                                            │
│  New here? Create an account → NM-005      │
│  Need help? → NM-039                       │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Enter phone + Send code | OTP dispatched (rate-limited) | NM-007 |
| Tap the remembered-number hint | Number prefilled; one tap to send | NM-007 |
| Log in on a suspended account | State screen: status + appeal path; no enforcement detail (EC-20) | Suspended state screen |
| Tap "Create an account" | Signup opens | NM-005 |
| Tap "Need help?" | — | NM-039 |

### Navigation

```text
ENTRY ← NM-001 · NM-005 · session-expiry redirects
  ↓
NM-006 — Login
  ↓
PRIMARY ACTION → Enter phone + Send code
  ↓
SYSTEM RESPONSE → OTP dispatched (rate-limited)
  ↓
NEXT SCREEN → NM-007
```

Previous: NM-001/NM-005/redirect. Next: NM-007, then the preserved return target (NM-010, NM-030, or the resumed deep link). No bottom nav.

### States

```text
DEFAULT
↓
Phone field + hint chip — one fast entry path
↓
Enter number, submit
↓
NM-007

ERROR (invalid number)
↓
Field-level message naming the fix; data preserved
↓
Correct and resubmit
↓
NM-007

RESTRICTED (suspended account, EC-20)
↓
Status screen with the account state + appeal link — same response shape whether or
not the number exists (no enumeration)
↓
Appeal, or contact support
↓
NM-039 (no app access)

DISABLED (deleted past grace)
↓
"This account was deleted" notice
↓
Start fresh
↓
NM-005

ERROR (generic failure)
↓
Retry message with no system detail leaked
↓
Retry
↓
Stays on NM-006
```

---

## W-07 — NM-007 — OTP Verification

### Role

New or returning user (pre-T0)

### Purpose

Prove phone ownership — the act that grants T0, the trust floor every account starts from.

### Entry

- NM-005 Continue
- NM-006 Send code

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Enter your code                          │
├────────────────────────────────────────────┤
│ Sent to +91 98•••• ••21   [Change number]  │ ← change → NM-005 (number kept)
│                                            │
│ ┌──┬──┬──┬──┬──┬──┐                        │ ← segmented input; paste supported;
│ │ 4│ 8│ 2│  │  │  │                        │   auto-submit on 6th digit
│ └──┴──┴──┴──┴──┴──┘                        │
│                                            │
│ (        Verify            )               │
│                                            │
│ Resend in 0:42        (chip, 60s cooldown) │ ← max 3/hour
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Enter correct code | Session created; T0 recorded silently | NM-008 (new user) or preserved return path |
| Enter wrong code | Inline error; boxes clear; retry | NM-007 |
| Code expired | Resend prompt replaces the input error | NM-007 |
| Tap Resend | New OTP after the 60s cooldown (max 3/hour) | NM-007 |
| 5 consecutive failures | 30-minute lock with a support link (EC-03) | Lock state |
| Tap "Change number" | Number kept for editing | NM-005 |

### Navigation

```text
ENTRY ← NM-005 · NM-006
  ↓
NM-007 — OTP Verification
  ↓
PRIMARY ACTION → Enter correct code
  ↓
SYSTEM RESPONSE → Session created; T0 recorded silently
  ↓
NEXT SCREEN → NM-008 (new user) or preserved return path
```

Previous: NM-005/NM-006. Next: NM-008 (new accounts) or the preserved return path (login and deep-link flows). Back re-enters the preceding auth screen without losing the number. No bottom nav.

### States

```text
DEFAULT
↓
Segmented 6-digit input, countdown, masked target number; SMS auto-read attempted
↓
Enter / auto-read the code, or request resend (60s cooldown, max 3/hour)
↓
NM-008 (new user) / preserved return target (login)

ERROR (wrong code)
↓
Inline error; input clears for retry; attempt counter honest
↓
Re-enter the code
↓
NM-007 (×5 → locked, EC-03)

EXPIRED
↓
Expiry message; resend becomes the primary action
↓
Tap resend
↓
NM-007 (fresh code)

RESTRICTED (locked after 5 failures, EC-03)
↓
30-minute lock with a support link
↓
Wait out the lock, or contact support
↓
NM-039 / retry after lock expiry

SUCCESS
↓
T0 Phone Verified granted (B-1) automatically (R-01)
↓
Continue
↓
NM-008 or the preserved auth-wall target (EC-05)
```

### Branches

```text
```text
SUCCESS → T0 granted (B-1) → NM-008 (new user) / preserved return target (login, EC-05)
WRONG CODE → inline retry, honest counter → NM-007 (×5 → 30-min lock, EC-03)
EXPIRED CODE → resend becomes primary (60s cooldown, max 3/hour) → NM-007
LOCKED (EC-03) → support link → NM-039 → retry after the lock expires
CANCEL → guest state preserved → origin screen
```
```

---

## W-08 — NM-008 — Role & Intent Selection

### Role

New user (role choice) / existing user (role add)

### Purpose

Route every freshly verified user into the correct product half — seeking or offering — and record role(s) explicitly.

### Entry

- NM-007 success (new accounts)
- NM-037 role-add path (upgrading users)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ What brings you to NestMate?               │
│ You can change this anytime.               │
├────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ 🔎  I'm looking for a room             │ │ ← large tap cards (≥88px)
│ │     or flatmates                       │ │    tap = continue (no extra CTA)
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ 🏠  I have a room to offer             │ │ → NM-029 (owner wizard)
│ └────────────────────────────────────────┘ │
│                                            │
│  I want both  (small chip option)          │ ← D-03: seek first, owner addable later
│                                            │
│  Skip for now                              │ ← defaults Seeker mode; NM-010 prompts
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap "I'm looking for a room" | Seeker role stored | NM-009 |
| Tap "I have a room to offer" | Owner role stored | NM-029 |
| Tap "I want both" | Both roles stored; seeker flow first | NM-009 |
| Tap Skip | Seeker mode defaulted; prompts later | NM-010 (or carried auth-wall context executes) |
| (Upgrade variant) add owner role | Owner role added; no re-signup | NM-029 |

### Navigation

```text
ENTRY ← NM-007 success · NM-037 (role add)
  ↓
NM-008 — Role & Intent Selection
  ↓
PRIMARY ACTION → Tap "I'm looking for a room"
  ↓
SYSTEM RESPONSE → Seeker role stored
  ↓
NEXT SCREEN → NM-009
```

Previous: NM-007 or NM-037. Next: NM-009/NM-029. Back from a wizard returns here only if no role was committed. Carried auth-wall context (EC-05) is never dropped at this screen: it executes after the chosen wizard — including after Skip.

### States

```text
DEFAULT (new user)
↓
Three choices: "I'm looking" · "I have a room to offer" · "Both" + Skip
↓
Tap a card (or Skip)
↓
NM-009 / NM-029 / NM-009 (Both) / NM-010 (skip → seeker defaults)

DEFAULT (intent carried from an auth wall)
↓
The carried intent's card is pre-highlighted
↓
Confirm the highlighted intent
↓
Role wizard — the original action auto-executes after (EC-05)

DEFAULT (upgrade variant, from NM-037)
↓
Copy adapts ("Add owner mode"); existing profile untouched
↓
Choose the new role
↓
NM-029 (owner wizard collects only what the new role needs — no re-registration)
```

### Branches

```text
```text
"I'M LOOKING" → NM-009
"I HAVE A ROOM" → NM-029
"BOTH" → NM-009 (owner mode added later from NM-037 → NM-008)
SKIP → NM-010 with seeker defaults — any carried auth-wall action auto-executes (EC-05)
UPGRADE (from NM-037) → NM-029 collects only the new role's needs — no re-signup
```
```

---

## W-09 — NM-009 — Seeker Onboarding Wizard

### Role

New seeker (T0)

### Purpose

One guided flow that produces a complete, matchable seeker profile — finished once, durable forever, resumable losslessly.

### Entry

- NM-008 (seeker card, Both, or Skip)
- NM-010 resume banner (exact step, EC-01)

### Wireframe

```text
┌────────────────────────────────────────────┐        6 steps, each <30s:
│ ● ● ● ● ○ ○        Step 4 of 6            │        1 Basics — name, photo (optional,
├────────────────────────────────────────────┤           prompted), occupation, age band
│ How do you feel about smoking at home?     │        2 Location — city locked (D-10),
│ (why we ask → tiny link: "only shown to    │           localities multi-select, optional
│  people you connect with")                 │           commute anchor
│                                            │        3 Budget — rent range slider,
│ ┌────────────────────────────────────────┐ │           deposit tolerance chip
│ │ No smoking              ○              │ │        4 Move-in — date or month +
│ │ Occasionally            ○              │ │           tenancy duration
│ │ Regularly               ○              │ │        5 Lifestyle — 10 canonical attrs
│ └────────────────────────────────────────┘ │, ONE per view
│                                            │        6 Must-haves — hard filters w/
│ [ Skip ]            [         Continue → ] │           consequence note
└────────────────────────────────────────────┘        final CTA: "Find my match"
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Complete a step | Saved immediately (idempotent per step) | Next step |
| Skip a skippable step | Marked incomplete; NM-010 prompts later | Next step |
| Abandon / kill the app | All entered data persisted | NM-010 resume banner → exact step (EC-01) |
| Tap "Find my match" | Profile complete → T1; matches computed | NM-010 |
| Tap the verify prompt | — | NM-019 |

### Navigation

```text
ENTRY ← NM-008 · resume banner on NM-010
  ↓
NM-009 — Seeker Onboarding Wizard
  ↓
PRIMARY ACTION → Complete a step
  ↓
SYSTEM RESPONSE → Saved immediately (idempotent per step)
  ↓
NEXT SCREEN → Next step
```

Entry: NM-008 or the resume banner. Exit: explicit "Save & exit" only — prevents half-state limbo. No bottom nav inside the wizard. Back always preserves; resume always lands on the exact abandoned step (EC-01).

### States

```text
DEFAULT (step N of 6)
↓
One question per view, progress dots, Save draft, "why we ask" on sensitive steps
↓
Answer, Back, Save & exit
↓
Next step / previous step (answers preserved) / NM-010 with draft kept

INCOMPLETE (resume, EC-01)
↓
Reopens at the exact saved step with all prior answers intact
↓
Continue the wizard
↓
NM-010 on completion (never restarts from zero)

ERROR (validation, EC-16)
↓
Inline field error naming cause + fix; nothing cleared
↓
Fix the field
↓
Stays on the step (advances only when valid)

DEFAULT (past move-in date, EC-24)
↓
Inline re-confirm prompt before continuing
↓
Confirm the date is still intended, or change it
↓
Step continues; matches will recompute
```

### Branches

```text
```text
COMPLETE ("Find my match") → T1 + B-2 → NM-010 (matches live immediately)
SAVE & EXIT → draft kept → resume banner on NM-010 → NM-009 at the exact step (EC-01)
APP KILLED → same resume path (EC-01) — nothing re-asked
VALIDATION ERROR (EC-16) → inline fix, nothing cleared → step continues
OPTIONAL VERIFY PROMPT → NM-019 (non-blocking) or straight to NM-010
```
```

---

## W-10 — NM-010 — Seeker Home (Personalized)

### Role

Authenticated user — seeker mode

### Purpose

The seeker's daily command center: what's new, what matches, what needs action — in one glance.

### Entry

- Bottom-nav Home (seeker shell)
- Login default for seekers
- Deep links (object-aware fallback when the target expired, EC-12)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ Hi Rohit 👋 [city]              [ Bell ³ ] │ ← bell → NM-024; badge = unread
│ Profile 80% complete → [finish]            │ ← F-008 meter → NM-017; hides at 100%
├────────────────────────────────────────────┤
│ 🔍 Search rooms, localities…               │ → NM-011
├────────────────────────────────────────────┤
│ Resume onboarding (banner — EC-01)         │ ← only when wizard incomplete
├────────────────────────────────────────────┤
│ Recommended for you            See all →   │ ← top 6 by  ranking;
│ ┌card┐ ┌card┐ →                            │   freshness stamps on every card (C-01)
├────────────────────────────────────────────┤
│ Great flatmate matches         See all →   │ ← F-042 1-line why under each card
│ ┌────────────────────────────────────────┐ │
│ │ [p] Aarav · 26 · SDE · ✓ID verified    │ │ ← C-02 flatmate card
│ │ Great match · 84 — same food & sleep   │ │
│ │ [Connect]                      [View]  │ │
│ └────────────────────────────────────────┘ │
├────────────────────────────────────────────┤
│ 2 pending requests →            (pill)     │ → NM-021
│ Continue: "Indiranagar under ₹18k" →       │ ← last search rail (F-029)
│ Saved (revalidated): 1 expired 4d ago →    │ ← stale states shown honestly (EC-12)
├────────────────────────────────────────────┤
│ 🛡 Verify your ID — ~2× more responses →   │ ← T0-only nudge card (non-blocking)
├────────────────────────────────────────────┤
│ [Home*][Search][Flatmates][Chats][Profile] │ ← seeker shell
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap a room card | Authenticated detail opens | NM-012 |
| Tap a flatmate card | Profile with match explanation opens | NM-015 |
| Tap the search bar / any "See all" | Full search or the respective surface opens with context | NM-011 / NM-014 / NM-016 |
| Tap the pending-requests pill | Connections open | NM-021 |
| Tap the resume banner | Wizard opens at the exact step | NM-009 |
| Tap the verification nudge | — | NM-019 |
| Pull to refresh | Rails re-render; recompute shown honestly ("matches updating") | NM-010 |

### Navigation

```text
ENTRY ← Bottom nav · login default · deep links
  ↓
NM-010 — Seeker Home (Personalized)
  ↓
PRIMARY ACTION → Tap a room card
  ↓
SYSTEM RESPONSE → Authenticated detail opens
  ↓
NEXT SCREEN → NM-012
```

Root of the seeker shell — device back exits gracefully. Bottom nav present (5 tabs); tab switches preserve per-tab state. Bell → NM-024. Top-bar shell chrome (overflow) follows the seeker-shell contract. Deep links into expired objects fall back here with a state banner (EC-12).

### States

```text
LOADING
↓
Header renders first; rails skeletonized (≤300ms perceived)
↓
Wait
↓
Personalized rails render in place

EMPTY (new/incomplete user)
↓
Resume-onboarding banner (EC-01), or an honest city-supply message + widen CTA (EC-14)
↓
Resume the wizard / widen the search
↓
NM-009 / NM-011

PENDING (stale preferences, EC-24)
↓
Re-confirm banner: "Your move-in date passed — still looking?"
↓
Confirm or update preferences
↓
NM-018 → matches recompute (≤60s, honest banner)

ERROR (one rail fails)
↓
That rail retries individually; the rest of the page stays alive
↓
Retry the rail
↓
Stays on NM-010 (deleted-user items are silently pruned, EC-13)
```

---

## W-11 — NM-011 — Room Search (Authenticated)

### Role

Authenticated user — seeker mode

### Purpose

The primary retrieval surface for signed-in seekers: full filtering, sorting, freshness-first ranking, and compatibility previews — where shortlists get built before connecting.

### Entry

- Seeker-shell bottom nav, Search tab
- NM-010 recommendation rails ("See all")
- NM-016 (browse CTAs; Similar-rooms hand-off) and NM-013 return (filters arrive as chips)
- Deep links and shared search links (query applied; logged-out visitors resolve to NM-002)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Search                        [ Bell ]   │
├────────────────────────────────────────────┤
│ 🔍 Indiranagar, HSR…        [Filters ⚙]    │ ← Filters ⚙ → NM-013
│ [Rent▾][Move-in▾][Type▾][Gender▾] +3       │ ← active filter chips (tap to edit inline)
├────────────────────────────────────────────┤
│ 24 rooms · Sorted: Freshest ▾              │ ← sort sheet: Freshest / Best match /
├────────────────────────────────────────────┤   Rent ↑ / Newest
│ ┌────────────────────────────────────────┐ │
│ │ [photo]                        ♡ save  │ │ ← C-01 full card (auth projection):
│ │ ₹16,000/mo · Deposit ₹40k              │ │   adds compat band chip when owner-
│ │ Private room · 2BHK · Indiranagar      │ │   flatmate lifestyle exists (F-041)
│ │ ✓ Owner verified  · 🕒 Confirmed 2d ago│ │
│ │ [82 · Great match] (if owner-flatmate) │ │
│ └────────────────────────────────────────┘ │
│ ┌ …card … ┐                                │ ← paginated 20, skeleton scroll
├────────────────────────────────────────────┤
│ [Home][Search*][Flatmates][Chats][Profile] │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap a listing card | Opens authenticated detail; search state queued for exact restoration | NM-012 |
| Edit or remove a filter chip | Results refresh; chips persist per device | stay |
| Tap "Advanced filters" | Opens filter draft pre-filled with current values | NM-013 |
| Change sort | Re-ranks results in place | stay |
| Tap save on a card | Saved state toggles; reflected in the saved list | stay |
| Share a card | Public-safe card (photo, rent, locality, badge, freshness stamp) | system share sheet |

### Navigation

```text
ENTRY ← NM-010 · nav Search · NM-016
  ↓
NM-011 — Room Search (Authenticated)
  ↓
PRIMARY ACTION → Tap a listing card
  ↓
SYSTEM RESPONSE → Opens authenticated detail; search state queued for exact restoration
  ↓
NEXT SCREEN → NM-012
```

Seeker shell with bottom nav (Search active). Back from NM-012 or NM-013 restores filters, scroll, and results exactly. Deep links land here with the query applied. Leaving the tab and returning preserves the session's filter state.

### States

```text
LOADING
↓
Skeleton cards matching the final layout (≤300ms perceived)
↓
Wait
↓
Ranked results render in place

DEFAULT
↓
Ranked, counted results under the active filter chips; Freshest sort default
↓
Search text, filter chips, sort, open cards
↓
NM-013 (filters) / NM-012 (card) / NM-016 (save from card)

EMPTY (three named variants, EC-14)
↓
No city supply → waitlist + widen · filter too narrow → the binding filter is named +
one-tap relax · must-haves exclude all → review-must-haves CTA
↓
Apply the offered fix
↓
NM-011 refined / NM-018 (must-haves)

ERROR
↓
Inline retry; filters and scroll position never cleared
↓
Retry
↓
Stays on NM-011

RESTRICTED (guest opens an authed deep link)
↓
Redirect to the public projection of the same search
↓
Browse publicly
↓
NM-002

EXPIRED (card degrades mid-session, EC-12)
↓
Listing state chip replaces the live card
↓
Tap to see the state view
↓
State banner view (never a 404)
```

---

## W-12 — NM-012 — Room Detail (Authenticated)

### Role

Authenticated user — seeker mode

### Purpose

The full decision surface: everything a seeker needs to connect, save, share, or pass — without leaving the screen.

### Entry

- NM-011 result cards and NM-010 rails/recommendations
- NM-016 saved row (degraded rows open the state view) · deep links (authenticated projection; logged-out visitors resolve to NM-003)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ [photo gallery — swipe, 1/5 dots]   [⤴][♡] │ ← ♡ toggles save (F-030)
├────────────────────────────────────────────┤
│ Private room in 2BHK · Indiranagar         │
│ ₹16,000/mo · Deposit ₹40,000 · Move-in Aug │
│ Furnished · Attached bath · 2 occupants    │
├────────────────────────────────────────────┤
│ ✓ Owner verified (Mar 2026)  🕒 Confirmed  │
│   2 days ago                               │
│ You'd match resident: 82 Great [why?]      │ ← F-041 occupant compat (owner-flatmate)
├────────────────────────────────────────────┤
│ Amenities · House rules · Area (exact pin) │ ← auth sees locality-level pin + full
│ Deposit guidance: never pay before visit → │   rules; deposit safety link (PP-08)
├────────────────────────────────────────────┤
│ Listed by [photo] Priya · ✓ID · replies ~4h│ ← owner card (masked per D-07);
│ [View owner profile]                       │   response tier F-068 when owner
├────────────────────────────────────────────┤
│ [        Connect          ]  (sticky CTA)  │ ← state-aware:
│  Ask a question · Report · ⋯               │   connected → "Open chat → NM-023"
└────────────────────────────────────────────┘
   Connect tap → intro-note sheet C-03 (F-047):
   prefilled "Hi! Is the room still available from Aug?" · editable · 300 chars
   unverified sender: soft note "Profiles with ID verification get ~2× responses"
   send → NM-021 confirm → pending state (rate-limited, duplicates blocked EC-10)
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap Connect | Intro-note sheet (C-03) prefilled for this room, context locked; unverified senders allowed with a soft honesty note — never a gate | sheet → NM-021 (pending) |
| Tap save | Saved toggles; reflected in NM-016 | stay |
| Tap Open chat (already connected) | Opens the existing thread anchored to this room | NM-023 |
| Tap View owner profile | Masked owner card modal — no contact details | modal, stay |
| Tap the occupant-fit band | Full breakdown sheet (all 10 attributes) | modal, stay |
| Tap Report / Share | Structured report with listing context / public-safe card | NM-027 / system share |

### Navigation

```text
ENTRY ← NM-011 · NM-010 rails · NM-016
  ↓
NM-012 — Room Detail (Authenticated)
  ↓
PRIMARY ACTION → Tap Connect
  ↓
SYSTEM RESPONSE → Intro-note sheet (C-03) prefilled for this room, context locked; unverified senders allowed with a soft honesty note — never a gate
  ↓
NEXT SCREEN → sheet → NM-021 (pending)
```

Detail-push screen — no bottom nav. Back returns to the source (NM-011 state preserved: filters, scroll, results). Deep links land here with full context. Only one sheet stacks at a time. A degraded listing resolves to the state view — never a dead end.

### States

```text
LOADING
↓
Skeleton gallery + fact table (≤300ms perceived)
↓
Wait
↓
Full decision surface renders

DEFAULT
↓
Facts · owner trust (B-4 + response tier) · occupant compatibility with drivers ·
freshness stamp · sticky Connect
↓
Save / Share / Connect / open owner trust / report
↓
NM-016 / share sheet / C-03 sheet → NM-021 / NM-026 → NM-027

PENDING (request already sent / owner verification in review)
↓
Connect shows "Requested"; duplicate taps resolve idempotently ("already requested",
EC-10) · review shows a banner near the owner card while the listing stays live
↓
Wait, or continue browsing
↓
Stays on NM-012 / NM-011

EXPIRED / PAUSED / FILLED / REMOVED / OWNER SUSPENDED (EC-12, EC-21)
↓
State banner + similar rooms; Connect disabled; deep links resolve to the state view
↓
Browse similar rooms, or go back
↓
NM-011 (owner banned → listing auto-hidden)

SUCCESS (connected)
↓
Primary CTA becomes "Open chat"
↓
Open the conversation
↓
NM-023
```

---

## W-13 — NM-013 — Advanced Filters

### Role

Authenticated user — seeker mode

### Purpose

Dealbreaker-level filtering — lifestyle, room facts, building rules, availability, and a compatibility cut — without cluttering the NM-011 quick-search surface.

### Entry

- NM-011 "Advanced filters" button (the only entry)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ✕ Advanced filters              [Reset all]│
├────────────────────────────────────────────┤
│ LIFESTYLE                                  │ ← dealbreakers live here, not in the
│ Diet:  [Any][Veg][Non-veg][Eggetarian]     │   way of quick search
│ Smoking: [Any][No][Balcony][Yes]           │
│ Alcohol: [Any][No][Socially][Yes]          │
│ Sleep:   [Any][Early][Late][Flexible]      │
│ Pets:    [Any][None][Cat-friendly][Dog…]   │
│ ROOM                                       │
│ Furnishing [Any][Un][Semi][Full]  Floor ▾  │
│ Amenities: (chips multi: Geyser ✓ WiFi ✓…) │
│ Bathrooms: [Any][1][2+]   Bachelors ok ⚪  │
│ BUILDING RULES                             │
│ Guests: [Any][Restricted][Welcome]         │
│ Cooking allowed: [Any][Yes][No]            │
│ AVAILABILITY                               │
│ Move-in window: [Aug ▾ → Sep ▾]  Duration▾ │
│ COMPATIBILITY                              │
│ Only show 70+ matches            ⚪────⚫   │ ← honest cut; count updates live
├────────────────────────────────────────────┤
│ (     Show 14 results      )  (sticky CTA) │ ← live count `POST /listings/count`
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Toggle any filter | Live count updates immediately | stay |
| Enable the 70+ cut | Count updates; cut applies to the draft only | stay |
| Reach count = 0 | Inline explainer names the killer filter + one-tap toggle-off | stay |
| Tap "Reset all" | Draft cleared to unset values; count updates | stay |
| Tap "Show N results" / close | Draft applied to search; chips appear on the search surface | NM-011 |

### Navigation

```text
ENTRY ← NM-011 "Advanced filters"
  ↓
NM-013 — Advanced Filters
  ↓
PRIMARY ACTION → Toggle any filter
  ↓
SYSTEM RESPONSE → Live count updates immediately
  ↓
NEXT SCREEN → stay
```

Push screen — no bottom nav. Back/close applies the draft and returns to NM-011 with chips reflecting the sections. The draft survives interruption (app switch, accidental back) until applied or reset. No modal stacking.

### States

```text
DEFAULT
↓
Draft selections + live result count on the Apply CTA (count never stale)
↓
Set dealbreaker filters; Apply or cancel
↓
NM-011 (re-ranked) / back (draft preserved)

LOADING (count refresh)
↓
Non-blocking refresh indicator on the count; filters stay editable
↓
Keep adjusting filters
↓
Stays on NM-013

EMPTY (zero count)
↓
Killer-filter explainer + one-tap relax (EC-14)
↓
Relax the named filter
↓
Count updates in place

ERROR (count fails)
↓
Inline retry on the count; the CTA never shows a wrong number
↓
Retry the count
↓
Stays on NM-013 (draft never lost)
```

---

## W-14 — NM-014 — Flatmate Discovery

### Role

Authenticated user — seeker mode

### Purpose

Ranked candidate feed with transparent fit — the pairing journey that needs no listing: find the right person first, then find the flat together.

### Entry

- Seeker-shell bottom nav, Flatmates tab
- NM-010 matched-flatmates rail ("See all")
- NM-016 (flatmates tab, browse path)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Flatmates                                │
│ [Must-haves: Women-only ×][Non-smoker ×] +1│ ← F-043 chips from preferences; edit → NM-018
├────────────────────────────────────────────┤
│ 31 matches · Best match ▾                  │ ← must-haves applied BEFORE ranking
├────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ [p]  Ananya · 23 · Designer · ✓ID      │ │ ← C-02 candidate card:
│ │ 🟢 Great match · 88                    │ │   photo (F-013 blur respected), first name,
│ │ Veg · Early sleeper · No smoking       │ │   age band, occupation, T-badges,
│ │ "matches your food & schedule; both    │ │   3 highest-signal chips,
│ │  prefer quiet weekdays"                │ │   score band + 1-line why (F-042)
│ │ Active yesterday                       │ │   last-active fuzzed to day granularity
│ │ [Connect]                     [View →] │ │
│ └────────────────────────────────────────┘ │
│ ┌ card: 🟡 Good match · 63 … ┐             │
│ ┌ card: 🔴 Low match · 28 [shown honestly] │ ← F-046: low matches labelled, not hidden
├────────────────────────────────────────────┤
│ [Home][Search][Flatmates*][Chats][Profile] │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap Connect on a card | Intro-note sheet anchored to that profile | sheet → NM-021 (pending) |
| Tap card or View | Full profile with explained compatibility | NM-015 |
| Tap the score band ("Why this score?") | Breakdown sheet: all 10 attributes, both values, points | modal, stay |
| Quick-remove a must-have chip | Must-have turned off in the same store NM-018 writes; feed refilters before re-ranking | stay |
| Tap Edit on the chip row | Full must-have editor | NM-018 |
| Change sort | Re-ranks in place | stay |

### Navigation

```text
ENTRY ← NM-010 rail · nav Flatmates · NM-016
  ↓
NM-014 — Flatmate Discovery
  ↓
PRIMARY ACTION → Tap Connect on a card
  ↓
SYSTEM RESPONSE → Intro-note sheet anchored to that profile
  ↓
NEXT SCREEN → sheet → NM-021 (pending)
```

Seeker shell with bottom nav (Flatmates active). Connect opens a single stacked sheet; on send the user lands in NM-021 with the request pending. Edit chips routes to NM-018 and returns with the feed refiltered. Back returns to the source rail/tab.

### States

```text
LOADING
↓
Card skeletons matching the final feed (≤300ms perceived)
↓
Wait
↓
Ranked feed renders

DEFAULT
↓
Ranked candidate feed; low matches visible and labelled (R-11, R-12); no swipe mechanic
↓
Adjust must-have chips; open profiles; connect or save
↓
NM-015 (card) / C-03 sheet / NM-016 (save)

EMPTY (two variants, EC-14)
↓
No candidates in these filters → widen-filters / relax-must-have · no city supply →
honest line + widen radius
↓
Apply the offered fix
↓
NM-014 widened / NM-018

RESTRICTED (suppressed set)
↓
Self, blocked pairs, declined-for-90-days, and discovery opt-outs never render
(EC-08, R-19)
↓
Continue browsing the healthy feed
↓
Stays on NM-014

ERROR
↓
Inline retry preserving scroll position
↓
Retry
↓
Stays on NM-014
```

---

## W-15 — NM-015 — Flatmate Profile Detail

### Role

Authenticated user — seeker mode

### Purpose

Full candidate evaluation with explained compatibility: judge the fit, then connect, pass, or protect — with every judgement explainable.

### Entry

- NM-014 candidate card (Connect context)
- NM-023 header (counterparty) · NM-034 / NM-035 applicant view (read-only owner variant — no Connect CTA; pipeline actions live there)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ [photo] Ananya, 23 · Designer · Member yr  │
│ ✓ ID verified (Oct 2025)   Active 2d ago   │ ← T0-only: "Phone verified" chip
├────────────────────────────────────────────┤   + gentle safety note instead of badge
│ ┌ Match: 88 — Great ──────────────────────┐│
│ │ You match:  Veg · Early schedule ·      ││ ← ≥2 drivers required to render (AC-015)
│ │              Cleanliness (4/5 both)     ││
│ │ You differ: Guests (rare vs weekends)   ││
│ │ [See full breakdown ▾]                  ││ ← attribute-by-attribute table
│ └─────────────────────────────────────────┘│
├────────────────────────────────────────────┤
│ Lifestyle (hers)                           │ ← all 10 attrs as friendly chips;
│ Food: Veg · Smoking: No · Alcohol: Socially│   "private" fields masked per NM-038
│ Sleep: Early · Clean: 4/5 · Guests: Rare   │
│ Pets: None · Work: Office · Noise: Quiet   │
│ Looking: Women-only flat                   │ ← her must-haves that affect YOU shown
│ ⚑ She prefers women-only flats            │   proactively (F-046 conflict surfacing)
├────────────────────────────────────────────┤
│ About: Moved to Bangalore for design work… │ ← 300-char blurb, no contact patterns
├────────────────────────────────────────────┤
│ [       Connect        ]     [Share] [⋯]   │ ← ⋯: Report · Block (NM-027) · Save
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap Connect | Intro-note sheet anchored to this profile | sheet → NM-021 (pending) |
| Tap Message (already connected) | Opens the existing thread | NM-023 |
| Expand "Why this match" | Full 10-attribute breakdown sheet (both values, points) | modal, stay |
| Save / Report / Block (overflow) | Saved state toggles (reflected in NM-016) · structured safety flow with profile context | stay / NM-027 |
| Share profile | Public teaser card (auth-walled for the recipient) | system share sheet |

### Navigation

```text
ENTRY ← NM-014 · NM-023 header · NM-034 (read-only)
  ↓
NM-015 — Flatmate Profile Detail
  ↓
PRIMARY ACTION → Tap Connect
  ↓
SYSTEM RESPONSE → Intro-note sheet anchored to this profile
  ↓
NEXT SCREEN → sheet → NM-021 (pending)
```

Detail-push screen — no bottom nav. Back returns to the source (NM-014, NM-023, or the owner surface). Viewing your own profile redirects to NM-017. Blocked pairs and declined-connection profiles (90-day suppression) are unreachable — no render.

### States

```text
LOADING
↓
Header + score block skeletons (≤300ms perceived)
↓
Wait
↓
Full profile renders

DEFAULT
↓
Full profile + compatibility breakdown with ≥2 drivers (both values shown)
↓
Connect / Save / report / back
↓
C-03 sheet → NM-021 / NM-016 / NM-027

INCOMPLETE / T0-ONLY TARGET
↓
Partial card: "X hasn't finished their profile" (Connect still allowed) · T0-only
renders a "Phone verified" chip + subtle safety note, no badge row (C-06 absence rule)
↓
Evaluate honestly with what is shown
↓
Stays on NM-015 / C-03 sheet

RESTRICTED (blocked or declined-you-90d, EC-08, R-17, R-19)
↓
Profile unreachable — no render
↓
Back to discovery
↓
NM-014
```

---

## W-16 — NM-016 — Saved Items

### Role

Authenticated user — seeker mode

### Purpose

Multi-session search state: keep and compare viable rooms and people across days, with honesty about everything that has changed since saving.

### Entry

- NM-010 saved rail ("See all")
- Home overflow menu (no dedicated bottom-nav tab in this version)
- Return path from Similar-rooms links elsewhere

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Saved                                    │
│ [ Rooms ³ | Flatmates ² ]                  │ ← tabs; counts per tab
├────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ [photo] ₹16,000 · 2BHK · Indiranagar   │ │ ← revalidated at load:
│ │ ✓ Owner verified · 🕒 Confirmed 2d ago │ │   fresh rows normal; expired rows:
│ └────────────────────────────────────────┘ │   "expired 4d ago" + [Similar rooms →]
│ ┌ row … ┐                          [⋯]     │ ← ⋯: Remove (confirm-free, undo toast)
├────────────────────────────────────────────┤
│ Flatmates tab: mini C-02 rows + score band │ ← opted-out-after-save row retained
│ [ Compare (V1): select 2 rooms ⇄ sheet ]   │   but marked "no longer in discovery"
├────────────────────────────────────────────┤
│ Empty: "Nothing saved yet — tap ♡ on any   │
│ card"  [ Browse rooms → ]                  │ ← per-tab empty (never blank)
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap a healthy room row | Opens authenticated detail | NM-012 |
| Tap a degraded room row | Opens the state view (banner + similar rooms), never a live room | NM-012 (state view) |
| Tap Similar rooms on a degraded row | Search seeded with comparable filters | NM-011 |
| Tap a flatmate row | Opens the profile (still reachable even if opted out of discovery) | NM-015 |
| Remove an item (overflow) | Row removed; undo toast restores it | stay |
| Select 2 rooms + Compare | Side-by-side comparison sheet | modal, stay |

### Navigation

```text
ENTRY ← NM-010 rail · nav
  ↓
NM-016 — Saved Items
  ↓
PRIMARY ACTION → Tap a healthy room row
  ↓
SYSTEM RESPONSE → Opens authenticated detail
  ↓
NEXT SCREEN → NM-012
```

Push screen reached from NM-010 — no bottom nav; back returns to NM-010. Removal is non-destructive within the session (undo window). Compare is a single stacked sheet. Every tab has a browse path onward — no dead ends.

### States

```text
DEFAULT
↓
Revalidated rows in both tabs (Rooms / Flatmates) with current freshness stamps (R-06)
↓
Open rows, remove rows (overflow), browse for more
↓
NM-012 / NM-015 / NM-011 / NM-014

EXPIRED (room rows, EC-12)
↓
State label on the row + "Similar rooms" path
↓
Open the state view or find similar
↓
State banner view / NM-011

RESTRICTED (flatmate rows)
↓
Rows of users who later opted out stay retained and marked, still openable
↓
Open the marked row (context preserved)
↓
Stays on NM-016

EMPTY (per tab)
↓
"Nothing saved yet — tap the save control on any card" + browse CTA (C-05)
↓
Browse rooms or flatmates
↓
NM-011 / NM-014
```

---

## W-17 — NM-017 — My Profile (Edit)

### Role

Any authenticated user (own profile)

### Purpose

Maintain the durable identity asset — basics, lifestyle attributes, verification, visibility — that feeds every score, card, and chat header in the product.

### Entry

- Seeker-shell bottom nav, Profile tab
- NM-009 completion (returns here)
- NM-010 completeness meter ("finish your profile")

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← My Profile        [Preview as others see]│ ← → NM-028
├────────────────────────────────────────────┤
│ [photo 88px]  Rohit, 26 · SDE      [Edit]  │ ← photo tap → upload/replace (F-011)
│ Profile 80% complete → [finish]            │ ← F-008 meter
├────────────────────────────────────────────┤
│ LIFESTYLE                        [Edit →]  │ ← same pickers as NM-009;
│ Veg · Non-smoker · Early sleeper · 4/5 …   │   edits trigger F-045 recompute
│ ⚑ "Matches updating…" (async banner)       │
├────────────────────────────────────────────┤
│ About me                          [Edit]   │ ← 300 chars, plain text only
│ "Moved to Bangalore for work…              │   typing a phone/URL → warning + block
│                                            │    (F-052 pattern, F-058 checks)
├────────────────────────────────────────────┤
│ 🛡 Verification                            │
│ [T1 badge] Profile complete                │
│ (  Verify ID — get ~2× responses  )        │ ← → NM-019 (T2)
├────────────────────────────────────────────┤
│ Preferences → NM-018 · Privacy → NM-038    │
│ Settings → NM-037                          │
└────────────────────────────────────────────┘
│ [Home][Search][Flatmates][Chats][Profile*] │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Edit any section | Inline save confirmation; completeness meter updates | stay |
| Edit lifestyle attributes | Compatibility flagged "Matches updating…" (async recompute ≤60s, honest banner) | stay |
| Type contact info in the blurb | Inline warning + pattern block (no phone/email/URL); typed text preserved | stay |
| Remove photo while T2-verified | Confirmation warning: verification may need refresh | stay |
| Tap Verify / Upgrade | Verification submission (T2, or T3 for owners) | NM-019 |
| Tap Preview public view | Exact visitor projection | NM-028 |
| Tap Privacy controls / Preferences | Visibility controls / preferences editor | NM-038 / NM-018 |

### Navigation

```text
ENTRY ← Nav Profile · NM-009 return · NM-010 meter
  ↓
NM-017 — My Profile (Edit)
  ↓
PRIMARY ACTION → Edit any section
  ↓
SYSTEM RESPONSE → Inline save confirmation; completeness meter updates
  ↓
NEXT SCREEN → stay
```

Tab root of the seeker shell — bottom nav present (Profile active). Inline saves mean nothing is lost on exit; no global submit. Overflow leads to NM-037. All push targets (NM-019, NM-018, NM-028, NM-038) return here with edits intact.

### States

```text
DEFAULT
↓
All profile sections + completeness meter + verification card
↓
Edit sections, open verification, open preview, open preferences
↓
NM-019 / NM-028 / NM-018

INCOMPLETE
↓
Meter + prioritized "what's missing" pointers, each one tap from its fix
↓
Tap a pointer
↓
The exact section editor (never a dead end)

PENDING (matches updating)
↓
Honest async banner on score-dependent edits; clears when the recompute lands (≤60s, R-15)
↓
Keep editing or wait
↓
Stays on NM-017

SUCCESS (section saved)
↓
Inline confirmation; the meter visibly updates
↓
Continue editing or navigate away
↓
Stays on NM-017
```

---

## W-18 — NM-018 — Preferences (Edit)

### Role

Authenticated user — seeker mode

### Purpose

Evolve must-haves (hard filters) and nice-to-haves (soft scoring) as the search matures — the control surface that keeps discovery personal and honest about the difference.

### Entry

- NM-017 (Preferences row)
- NM-014 must-have chip row (Edit)
- NM-011 must-haves-exclude-all empty state
- NM-024 re-confirm deep link (stale preferences, EC-24)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Preferences                              │
├────────────────────────────────────────────┤
│ MUST-HAVES (we only show you these)        │ ← hard filters; each w/ consequence
│ Women-only flat                    ⚫ ON   │   microcopy under each toggle
│ Non-smoker home                    ⚫ ON   │
│ Veg kitchen                        ⚪ OFF  │
│ Pets-free                          ⚪ OFF  │
├────────────────────────────────────────────┤
│ NICE-TO-HAVES (soft preferences)           │ ← mirrors of 10 attributes,
│ Food: [Veg preferred]  Sleep: [Early]      │   "preferred" ≠ hard cut
│ Cleanliness: [4/5]     Guests: [Rare]      │
├────────────────────────────────────────────┤
│ BUDGET & MOVE-IN (synced w/ NM-009)        │
│ Rent ₹14k ——●—— ₹18k · Move-in: Aug 2026   │ ← move-in past → EC-24 prompt here
├────────────────────────────────────────────┤
│ Alerts when new matches land (V1)  ⚪ OFF  │ ← F-031, default off (anti-spam PP-06)
├────────────────────────────────────────────┤
│ (      Update preferences      )           │ ← PUT → recompute job; toast on save
│  Reset to onboarding answers               │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Toggle a must-have | Hard-filter set updated in the draft; consequence line visible; turning one off shows an info line that low-match results may appear — labelled | stay |
| Update nice-to-haves | Scoring preferences updated in the draft | stay |
| Edit move-in to a past date | Re-confirm prompt flags the stale date | inline (EC-24) |
| Tap Update preferences | Saved → toast "Matches updating"; rankings change on next load (≤60s) | back to source |
| Tap Reset | Onboarding answers restored into the draft | stay |

### Navigation

```text
ENTRY ← NM-017 · NM-014 chips · NM-024 deep link
  ↓
NM-018 — Preferences (Edit)
  ↓
PRIMARY ACTION → Toggle a must-have
  ↓
SYSTEM RESPONSE → Hard-filter set updated in the draft; consequence line visible; turning one off shows an info line that low-match results may appear — labelled
  ↓
NEXT SCREEN → stay
```

Push screen — no bottom nav. The CTA saves and returns to the source screen (NM-017, NM-014, NM-011, or the NM-024 target). Leaving via back without the CTA keeps the previously saved preferences — no silent partial applies.

### States

```text
DEFAULT
↓
Draft equals the saved preferences; must-haves visually distinct from nice-to-haves
↓
Adjust, save
↓
Stays on NM-018 (saved) — NM-011/NM-014 re-rank on next load

PENDING (stale or restrictive, EC-24)
↓
Re-confirm prompt on entry when the move-in date passed or preferences are long-stale ·
honest info line when the hard set excludes nearly everything
↓
Re-confirm or relax
↓
NM-011 / NM-014 after recompute

SUCCESS (saved)
↓
Toast "Matches updating"; downstream rankings refresh honestly (≤60s, R-15)
↓
Continue to discovery
↓
NM-014 / NM-011

ERROR (save fails)
↓
Inline retry; draft never lost; submit idempotent (EC-16)
↓
Retry
↓
Stays on NM-018
```

---

## W-19 — NM-019 — Verification Submission (T2/T3)

### Role

Any authenticated user (T2) · owner for T3

### Purpose

Collect human-verifiable identity evidence (T2) — plus ownership proof for owners (T3) — with maximum clarity about what is collected, who sees it, and when it is deleted.

### Entry

- NM-017 verification card ("Start verification")
- NM-020 states: Not started, Rejected, Resubmission required, Expired (re-verify)
- NM-029 owner onboarding verification step and NM-031 publish gate (blocking, owner variant pre-scoped)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Verify your identity    Step 3 of 4      │ ← seeker: 3 steps; owner: 4 (T3)
├────────────────────────────────────────────┤
│ STEP 0 — Consent card (before anything)    │
│ ⚑ What we collect: ID doc + live selfie   │
│   (+ room proof if owner).                 │
│   Who sees it: only our review team —      │
│   never other users.                       │
│   What happens: decision <24h; ID deleted  │
│   after decision.   │
│ [x] I understand                 (blocking)│
├────────────────────────────────────────────┤
│ ✅ Document added (Aadhaar — masked)       │ ← step 1: Aadhaar [masked-number
│ ✅ Selfie added                            │   guidance] / PAN / DL / Passport
│ ▶ Prove you control the room               │ ← step 2: LIVE selfie only
│   Upload one:                              │   (blink/turn liveness prompt;
│   [ Utility bill ] [ Rent agreement ]      │   no gallery upload)
│   [ Society NOC ] [ Tax receipt ]          │ ← step 3 (owner T3): name+address
│   Name + address must match you and the    │   must match listing locality
│   listing's locality.                      │
├────────────────────────────────────────────┤
│ 🔒 Only our review team sees these.        │
│    Documents deleted after review.         │
│ [ Submit for review ]                      │ ← → NM-020 In-review + email F-062
│ Reviewed within 24h — usually much faster  │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Complete all steps + Submit | Case created; state → Submitted; confirmation email | NM-020 (Submitted) |
| Tap Save draft | Draft retained; resume at exact step | exit (resume via entry points) |
| Upload fails (network / size / type) | Inline guidance; entered data and prior uploads retained; idempotent retry (EC-06) | stay |
| Submit with a prior rejection | Reasons prefilled from rejection codes (EC-07) | NM-020 (Submitted) |
| Deny camera permission at selfie step | Inline explanation of why live capture is required + retry | stay |
| Tap support | Help & Support | NM-039 |

### Navigation

```text
ENTRY ← NM-017 / NM-020 CTAs · NM-029 · NM-031 gate
  ↓
NM-019 — Verification Submission (T2/T3)
  ↓
PRIMARY ACTION → Complete all steps + Submit
  ↓
SYSTEM RESPONSE → Case created; state → Submitted; confirmation email
  ↓
NEXT SCREEN → NM-020 (Submitted)
```

Back always preserves step data; leaving mid-flow requires explicit Save draft (no silent half-states). No bottom nav (wizard). Camera permission is requested only at the selfie step. Forward is always Submit → NM-020; the back arrow returns to the source (NM-017 / NM-020 / NM-029 / NM-031). No external deep link — reminder notifications land on NM-020, which routes here.

### States

```text
DEFAULT
↓
Consent notice → document choice → upload → live selfie → (owner) ownership proof → review
↓
Complete each step; Back preserves; submit when valid
↓
NM-020 (Submitted)

INCOMPLETE (draft)
↓
Resumes at the exact saved step with prior uploads intact — drafts never expire mid-process
↓
Continue
↓
NM-020 on submit

ERROR (upload, EC-06/EC-16)
↓
Named cause (size / type / network) + fix; nothing lost; retry idempotent
↓
Fix and retry
↓
Stays on the step

REJECTED (resubmission context, EC-07)
↓
Prior rejection reasons shown as prefilled fix guidance
↓
Address the reasons and resubmit
↓
NM-020 (replaces the old case cleanly)

RESTRICTED (camera denied)
↓
Explanation of why live capture is required + how to grant it — no gallery fallback
↓
Grant camera permission
↓
Selfie step continues

SUCCESS
↓
Receipt card + confirmation-email note; state visibly → Submitted
↓
Track the decision
↓
NM-020
```

### Branches

```text
```text
SUBMIT → NM-020 (Submitted; acknowledgement notification)
UPLOAD FAILURE (EC-06) → named cause + retry, nothing lost → same step
CAMERA DENIED → explanation + grant path → selfie step (no gallery fallback)
RESUBMISSION (EC-07 context) → prior reasons prefilled as fix guidance → NM-020
CANCEL → draft preserved → resume at the exact step
```
```

---

## W-20 — NM-020 — Verification Status

### Role

Any authenticated user (T2) · owner for T3

### Purpose

A transparent verification state machine the user can trust: it always shows where the case stands, what happens next, and exactly what to fix when something failed.

### Entry

- NM-017 verification card
- NM-030 owner dashboard verification gate / unverified-publish banner
- NM-024 deep link and direct deep link from status-change emails (verification target)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Verification                             │
├────────────────────────────────────────────┤
│ ┌ State machine card ────────────────────┐ │
│ │ ●──●──◉        Submitted 10:42 today   │ │  Not started → Submitted → In review
│ │ Not  In   → Approved                   │ │  → Approved | Rejected(reason)
│ │ started review  ✗ Rejected(reason)     │ │  | Resubmission required
│ │                 ↺ Resubmission req.    │ │
│ └────────────────────────────────────────┘ │
│ ⏱ We review within 24h — usually faster.  │ ← SLA note (D-05)
├────────────────────────────────────────────┤ (REJECTED state:)
│ Why: document name didn't match profile    │ ← reason code
│ Fix: upload a bill in your registered name │   + human-readable fix
│ (    Resubmit now    )                     │ ← → NM-019 prefilled
├────────────────────────────────────────────┤ (APPROVED state:)
│ ✓ Approved — your badge appears on your    │ ← badge preview (B-3/B-4)
│   profile, listings and messages  [See →]  │   "where my badge appears" link
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap Start verification (Not started) | Opens the submission wizard | NM-019 |
| Tap Resubmit (Rejected / Resubmission required) | Opens the wizard with reasons prefilled | NM-019 |
| Tap re-verify banner (near expiry) | Opens the wizard (light re-verify) | NM-019 |
| Tap "Where my badge appears" | Badge-placement explainer opens | modal on NM-020 |
| Tap Contact support | Help & Support | NM-039 |
| Pull to refresh | State re-fetched; timestamps updated | stay |

### Navigation

```text
ENTRY ← NM-017 card · NM-030 gate · notifications
  ↓
NM-020 — Verification Status
  ↓
PRIMARY ACTION → Tap Start verification (Not started)
  ↓
SYSTEM RESPONSE → Opens the submission wizard
  ↓
NEXT SCREEN → NM-019
```

Back returns to the source (NM-017 / NM-030 / NM-024). No bottom nav. Deep links resolve directly to this screen with the current state rendered; there is no dead state — every state offers at least one action (start, resubmit, support, refresh). Leaving mid-view has no state cost (read-only screen).

### States

```text
PENDING (Submitted / In review)
↓
Timestamp + the <24h human-review SLA stated; honest clock, no fake progress
↓
Wait; refresh available; owners may draft the listing meanwhile (NM-031 draft)
↓
Stays on NM-020 / NM-031 draft

SUCCESS (Approved)
↓
Badge preview + verification date + where the badge will appear (C-06)
↓
Continue to the product (profile re-ranked with trust weight)
↓
NM-017 / NM-030 (owners → NM-031 publish unlocked)

REJECTED (incl. resubmission required)
↓
Enumerated reason + concrete fix + resubmit CTA — never a bare "rejected"
↓
Resubmit
↓
NM-019 (reason context prefilled)

EXPIRED (cooling after 2nd rejection, EC-07)
↓
7-day notice with the exact end date; resubmit disabled until then
↓
Wait, or contact support
↓
NM-019 after the date / NM-039

ERROR (SLA breach, EC-04)
↓
Apology banner above the state card; the case is auto-prioritized
↓
Wait or escalate to support
↓
Stays on NM-020
```

### Branches

```text
```text
APPROVED → badges B-3/B-4 everywhere (C-06) + trust re-ranking → NM-017/NM-030
  (owners: publish gate unlocked → NM-031)
REJECTED (1st) → reason + fix → resubmit → NM-019
REJECTED (2nd) → 7-day cooling, exact date shown (EC-07) → NM-039 support
SUSPECTED_FRAUD → escalated; resubmission disabled (restricted)
SLA BREACH >24H (EC-04) → apology banner + auto-priority → wait on NM-020
BADGE EXPIRY (12 months) → re-verify prompt → NM-019
```
```

---

## W-21 — NM-021 — Connections

### Role

Connected users (both roles)

### Purpose

The state home for introductions: every connect request received and sent, with its live status and the actions that move it forward.

### Entry

- NM-010 connections pill (with pending count)
- NM-024 deep link (connection request / accepted / expired rows)
- Post-connect success from C-03 (lands on the Sent tab with the new pending row)
**OPEN DECISION:** Is there a standing navigation path to NM-021 (e.g., a profile-area link or the Chats pending-request badge), beyond the Home pill, notification deep links, and post-connect landing? Sources name only "pill, deep link, nav" without defining the third path.

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Connections                              │
│ [ Received ³ | Sent ]                      │ ← tabs w/ counts; badge on Received
├────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ [p] Priya · ✓ID · 82 Great             │ │ ← mini requester card (C-02)
│ │ About: Private room in HSR · ₹16k      │ │ ← context anchor (listing OR profile)
│ │ "Hi! Saw you work near HSR — the room  │ │ ← intro note preview (F-047)
│ │  is free from Aug 1…"                  │ │
│ │ [ Accept ]  [ Decline ]     2h ago     │ │ ← Accept → chat opens (NM-023)
│ └────────────────────────────────────────┘ │   Decline → optional reason sheet,
│ ┌ sent row: [Withdraw]  pending 1d ┐       │   SILENT to sender
├────────────────────────────────────────────┤
│ Empty: "No requests yet"                   │
│ + "Complete profiles with ID verification  │ ← tips row (response uplift)
│    get more requests" [Verify → NM-019]    │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Accept (received) | Connection accepted; chat opens with the anchor context | NM-023 |
| Decline (received) | Silent to sender; optional reason sheet; 90-day re-request cooldown (EC-08) | stay — row clears |
| Withdraw (sent) | Pending request removed | stay |
| Tap requester mini-card | Masked profile | NM-015 |
| Tap an expired sent row | Expired state shown honestly, no penalty copy | stay |
| Tap empty-state CTA | Discovery feed | NM-014 |

### Navigation

```text
ENTRY ← NM-010 pill · NM-024 deep link · nav
  ↓
NM-021 — Connections
  ↓
PRIMARY ACTION → Accept (received)
  ↓
SYSTEM RESPONSE → Connection accepted; chat opens with the anchor context
  ↓
NEXT SCREEN → NM-023
```

Back returns to the source (NM-010 / NM-024). Bottom nav present (shell). Deep links open the relevant tab with the row anchored; if the request has expired or the sender is gone, the row renders its honest state — never an error. Accept is the only door to chat; there is no alternate chat-creation path.

### States

```text
DEFAULT
↓
Sent / Received tabs with live counts; rows carry anchor + status + age
↓
Accept / decline / withdraw; open profiles
↓
NM-023 (accept) / NM-015 (view) — decline is silent with a 90-day cooldown (EC-08)

EMPTY
↓
"No requests yet" + tips + discovery CTA (C-05)
↓
Browse rooms or flatmates
↓
NM-011 / NM-014

EXPIRED (rows)
↓
14-day auto-expire rendered as a status chip (R-18)
↓
View read-only — no residual actions
↓
Stays on NM-021

RESTRICTED (blocked source)
↓
Requests from blocked users never render (R-19); counts not inflated
↓
Continue normally
↓
Stays on NM-021

ERROR
↓
Inline retry; list state preserved; accept/decline idempotent (EC-10)
↓
Retry
↓
Stays on NM-021
```

### Branches

```text
```text
ACCEPT (received) → NM-023 opens with the anchor context
DECLINE (received) → SILENT to sender (R-19); sender re-request blocked 90 days (EC-08)
WITHDRAW (sent, while pending) → removed from both sides
EXPIRED (14 days, R-18) → labelled read-only — no penalty either side
DUPLICATE TAP (EC-10) → idempotent — the same single request
```
```

---

## W-22 — NM-022 — Chat List

### Role

Connected users (both roles)

### Purpose

Reach active conversations in one tap, with enough context (who, about what, what's new) that no conversation is ever anonymous.

### Entry

- Bottom-nav Chats tab (seeker and owner shells)
- NM-024 deep link (new-message digest rows) and message-digest email link
- Post-accept redirect from NM-021 (new conversation surfaces at top)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ Chats                        [ 🔍 ]        │ ← search chats
├────────────────────────────────────────────┤
│ ⚑ Never pay before seeing the room. Tips → │ ← safety notice row — once weekly max
├────────────────────────────────────────────┤
│ ● [p] Priya · HSR room        2m           │ ← context chip ("HSR room" /
│   "Yes! Will you be cooking?"              │   "flatmate"); unread dot + count;
│                                            │   media → "[photo]" placeholder
│   [p] Aarav · flatmate        1h           │
│   "Sounds good, see you Saturday"          │
│                                            │
│ 🔒 [p] Vikram · HSR room      2d           │ ← frozen pair (active S1/S2 case):
│   (conversation paused by NestMate — info) │   lock icon + explanation
│                                            │
│   Deleted account · HSR room  12d          │ ← EC-13: read-only row, 30d retention
├────────────────────────────────────────────┤
│ [Home][Search][Flatmates][Chats*][Profile] │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap a row | Thread opens at the last-read position | NM-023 |
| Search chats | Filtered list by name / context chip | stay |
| Row overflow → Report | Report flow with the counterparty pre-attached | NM-027 |
| Tap safety-notice row | Safety Center | NM-026 |
| Tap a frozen row | Read-only thread + explanation banner | NM-023 (read-only) |
| Tap empty-state CTA | Discovery / room search | NM-014 / NM-011 |

### Navigation

```text
ENTRY ← Nav Chats · NM-024 deep link
  ↓
NM-022 — Chat List
  ↓
PRIMARY ACTION → Tap a row
  ↓
SYSTEM RESPONSE → Thread opens at the last-read position
  ↓
NEXT SCREEN → NM-023
```

Tab root: device back exits the shell gracefully; bottom nav always present with Chats active. The tab badge equals unread messages plus pending connect requests (single source of truth with NM-021 and NM-024). Deep links from digests land on this list; an absent conversation degrades to its row state — never an error.

### States

```text
DEFAULT
↓
Recency-ordered rows with context anchors and accurate unread counts
↓
Open threads
↓
NM-023

EMPTY
↓
Honest sentence + discovery CTAs (C-05)
↓
Browse discovery
↓
NM-011 / NM-014

RESTRICTED (frozen pair, R-23)
↓
Lock icon + explanation on the row; it still opens read-only
↓
Open read-only, or contact support
↓
NM-023 (read-only) / NM-039

DISABLED (deleted counterparty, EC-13)
↓
"Deleted account" read-only row (30-day retention, then anonymized)
↓
Archive or leave
↓
Stays on NM-022

OFFLINE
↓
Banner "You're offline — showing saved data" over the cached list
↓
Read cached threads; send nothing
↓
Retry on reconnect (stays on NM-022)
```

---

## W-23 — NM-023 — Chat Thread

### Role

Connected users (both roles)

### Purpose

The safe conversation surface — the heart of the privacy and safety posture: context-anchored talk, platform-guidance cards at the right moments, and the only mutual-consent path to contact details.

### Entry

- NM-022 row tap
- NM-021 Accept (opens the thread with the intro card)
- NM-012 "Open chat" (existing connection)
- NM-024 deep link (new message / reveal request / accepted request)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← [p] Priya · ✓ID        HSR room · ⋯      │ ← context header (mini-card + anchor
├────────────────────────────────────────────┤   + badges); ⋯: Report · Block · reveal
│ ┌ system card ──────────────────────────┐  │
│ │ Meet safely: meet in public first,    │  │ ← ⚑ pre-thread safety card (J-A 12)
│ │ never pay before seeing the room. →   │  │
│ └───────────────────────────────────────┘  │
│ EMPTY THREAD: intro + anchor summary +     │ ← auto 3 suggested questions from
│ 3 suggested questions ("Ask about cooking  │   attributes
│  schedules")                               │
│              Hi! Is the room still free    │
│              from Aug 1?           [time]  │ ← optimistic send; fail → inline
│ ┌ [photo] room pic ─────────────┐          │   retry/delete (EC-17)
│          Yes! Will you be cooking?  [time] │ ← receipts: delivery only at MVP
├────────────────────────────────────────────┤
│ 🔒 number hidden — [Share phone numbers]   │ ← F-051 consent card C-04 in-stream;
├────────────────────────────────────────────┤   declined → cooldown 7d (EC-19)
│ [ type a message…          ] [📎] [Send]   │ ← images ≤3/message (F-054),
└────────────────────────────────────────────┘   scanned + size-capped
Masking (server-side, F-052): typed phones render as 🔒 pill · emails masked ·
URLs disabled at MVP w/ note.
Payment-pattern text → ⚑ "Payments aren't supported on NestMate" system card.
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Send a message | Optimistic delivery (<1s); failure → inline retry/delete (EC-17) | stay |
| Attach images | Scanned + size-capped, ≤3 per message (R-21) | stay |
| Type a phone / email / link | Auto-masked as pills in render — both sides | stay |
| Tap "Share phone number" | Consent card (C-04); both consent → numbers render once + safety card; decline hides the CTA 7 days (EC-19) | stay |
| Both parties request reveal | Deduped into one consent flow (EC-18) | stay |
| Tap Report / Block | Report flow pre-attached; block severs platform contact | NM-027 |
| Tap anchor chip / View listing or profile | Anchor reopens | NM-012 / NM-015 |

### Navigation

```text
ENTRY ← NM-022 · NM-021 accept · NM-012 "Open chat"
  ↓
NM-023 — Chat Thread
  ↓
PRIMARY ACTION → Send a message
  ↓
SYSTEM RESPONSE → Optimistic delivery (<1s); failure → inline retry/delete (EC-17)
  ↓
NEXT SCREEN → stay
```

Back preserves scroll position and returns to NM-022 (or the entry surface). No bottom nav. Deep links open the thread directly; if the pair is frozen or the counterparty deleted, the thread renders read-only with its banner — never an error. Leaving mid-compose keeps the draft. Mode switching (seeker ⇄ owner) never interrupts an open thread (EC-25).

### States

```text
DEFAULT (active thread)
↓
Message stream + composer + context header (counterparty mini-card + anchor)
↓
Send text/media (≤3 images), tap the anchor, open profile, report/block, request reveal
↓
Reveal flow (C-04) / NM-015 / NM-027

EMPTY (new thread)
↓
Intro card + anchor summary + suggested questions from attribute overlap
↓
Send the first message
↓
Stays on NM-023 (no dead thread)

ERROR (send failed / drop, EC-17)
↓
Inline retry/delete on the bubble; no phantom "delivered"; graceful poll fallback
↓
Retry or delete the message
↓
Stays on NM-023 (rate note at 10 msg/min, R-21)

PENDING (reveal awaiting the other party)
↓
Consent card awaiting counterparty; chat continues normally; one deduped flow (EC-18)
↓
Keep chatting or withdraw intent
↓
Stays on NM-023 → reveal on mutual consent

RESTRICTED (frozen pair, R-23)
↓
Read-only banner explaining the active safety case
↓
Wait for resolution or contact support
↓
NM-023 read-only / NM-039

DISABLED (counterparty deleted, EC-13)
↓
"Deleted account" read-only thread; content retained per retention policy
↓
Archive or leave
↓
Stays on NM-023 (read-only)
```

### Branches

```text
```text
MUTUAL CONSENT → numbers revealed once in-thread + pre-meet safety card → off-platform meeting
DECLINED CONSENT (EC-19) → CTA sleeps 7 days → chat continues normally
SIMULTANEOUS REQUESTS (EC-18) → one deduped consent flow
PAYMENT PATTERN (R-20) → "no payments on NestMate" card + fraud signal → chat continues
REPORT/BLOCK (⋯) → NM-027 → protections (chat freeze if S1, R-23)
COUNTERPARTY DELETED (EC-13) → read-only "Deleted account" thread
ROOM FILLED MID-CHAT → chat continues by courtesy; anchor shows the Filled state
```
```

---

## W-24 — NM-024 — Notifications Center

### Role

All authenticated users

### Purpose

One notification state home: a user who ignores the app for days can reconstruct everything important — and every row deep-links to the object it names.

### Entry

- Top-bar bell on any shell (with unread badge) — the bell is global
- Deep links from emails (status-change, digest, and closure templates)
- Direct deep links to the authenticated app from shared/external surfaces

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Notifications        [Mark all read] ⚙ → │ ← ⚙ → NM-025
├────────────────────────────────────────────┤
│ TODAY                                      │
│ ● 👥 Priya accepted your request     2m    │ → NM-023 (thread opens)
│ ● 🛡 Verification approved            1h    │ → NM-020 (badge preview)
│   🏠 New applicant — HSR room         3h    │ → NM-034 (owner)
├────────────────────────────────────────────┤
│ THIS WEEK                                  │
│   💬 3 new messages                    1d   │ → NM-022/023
│   ⏰ HSR listing expires in 3 days     1d   │ → NM-033 (renew F-020)
│   📋 Daily digest: 2 applicants, 1 new     │ ← F-065 owner digest card
│      chat, 1 shortlist               2d    │ → NM-034
│   ✅ Your report was resolved          3d   │ ← F-059 closure
├────────────────────────────────────────────┤
│ Empty: "You're all caught up"              │
│ [ Find matches → ]                         │ ← discovery CTA, never blank
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap a connection row | Opens the relevant requests view | NM-021 |
| Tap a message row | Opens the thread at the message | NM-023 |
| Tap a verification row | Status screen with the current state | NM-020 |
| Tap a listing / applicant row (owner) | Listing detail / pipeline stage | NM-033 / NM-034 |
| Tap a report-closure row | Own-report status view | NM-026 |
| Tap Mark all read | All rows read; badges clear everywhere | stay |
| Tap empty-state CTA | Discovery feed | NM-014 |
| Tap settings | Notification settings | NM-025 |

### Navigation

```text
ENTRY ← Top-bar bell · deep links
  ↓
NM-024 — Notifications Center
  ↓
PRIMARY ACTION → Tap a connection row
  ↓
SYSTEM RESPONSE → Opens the relevant requests view
  ↓
NEXT SCREEN → NM-021
```

The bell is global; back returns to the previous screen. Bottom nav present (shell). Deep links resolve to the object with expiry-aware fallback: a deleted or expired object renders a state banner + the nearest healthy screen — never a 404 (EC-12). Deleted actors render as "a user" (EC-13). Read-state clears badges at the same moment everywhere.

### States

```text
DEFAULT
↓
Today / This week groups with unread dots; badge reconciles with bell + tab badges
↓
Tap rows (deep links), mark read, open settings
↓
NM-021 / NM-023 / NM-020 / NM-033 / NM-012 per object / NM-025

DEFAULT (muted category)
↓
Dimmed rows with an explanatory hint (respects NM-025; rows never vanish)
↓
Adjust settings if desired
↓
NM-025

EMPTY
↓
"You're all caught up" + discovery CTA (C-05)
↓
Browse discovery
↓
NM-011 / NM-014

ERROR (target object gone, EC-12)
↓
State banner + nearest healthy screen
↓
Continue from the healthy screen
↓
Never a 404 — e.g., NM-011 for a filled room

LOADING
↓
Skeleton rows matching the final layout (≤300ms perceived)
↓
Wait
↓
Notifications render in place
```

---

## W-25 — NM-025 — Notification Settings

### Role

All authenticated users

### Purpose

Anti-spam control: the user chooses what pings them, on which channel — while safety-critical notices stay locked on, visibly and with an explanation.

### Entry

- NM-037 Settings → Notifications row
- NM-024 settings gear
- Contextual hint from a muted-category row on NM-024

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Notification settings                    │  "Choose what pings you."
├────────────────────────────────────────────┤   In-app │ Email columns
│ CONNECTIONS & MESSAGES        in-app email │
│  New message            🔒 always  ◫ daily │ ← in-app never off; email defaults
│  Connection request     🔴 on     ○ off    │   to daily digest (anti-spam PP-06)
│ VERIFICATION & ACCOUNT                    │
│  Verification updates   🔴 on     ◫ on    │
│  Account & security     🔒 always  ◫ on    │ ← security notices non-negotiable
│ LISTING & APPLICANTS (owner)              │
│  Applicant activity     🔴 on     ○ daily │
│  Listing expiry nudge   🔴 on     ◫ on    │
│ SAFETY                                     │
│  Safety & enforcement   🔒 always  ◫ on    │ ← disabled toggle w/ explanation:
│                                            │   "These keep you safe — always on"
│ TIPS & PRODUCT                        off  │ ← default off
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Toggle any unlocked cell | Saved instantly; cell shows saved state | stay |
| Tap a locked row | Explanation sheet opens | modal on NM-025 |
| Toggle email off for a group | Email stops for that group (except locked rows); in-app unaffected | stay |
| Tap back | Settings retained (auto-saved) | NM-037 / NM-024 |

### Navigation

```text
ENTRY ← NM-037 · NM-024
  ↓
NM-025 — Notification Settings
  ↓
PRIMARY ACTION → Toggle any unlocked cell
  ↓
SYSTEM RESPONSE → Saved instantly; cell shows saved state
  ↓
NEXT SCREEN → stay
```

Back returns to the source (NM-037 or NM-024) with nothing to save or discard — every toggle persists on tap. No bottom nav (push screen). Failed saves show an inline error on the affected cell and retry idempotently; nothing silently reverts.

### States

```text
DEFAULT
↓
Event × channel matrix reflecting server truth on load
↓
Toggle channels per event; save
↓
Stays on NM-025 (auto-save; back to NM-037/NM-024)

LOADING
↓
Matrix skeleton (≤300ms perceived)
↓
Wait
↓
Matrix renders in place

ERROR (save fails, EC-16)
↓
Inline error naming the exact cell + retry; no silent revert
↓
Retry the toggle
↓
Stays on NM-025

DISABLED (locked rows)
↓
Locked controls with an explanation affordance — safety/account notices cannot be
disabled (R-29)
↓
Read the explanation
↓
Stays on NM-025
```

---

## W-26 — NM-026 — Safety Center (Authenticated)

### Role

All authenticated users

### Purpose

Safety literacy plus action entry, available at decision moments: how to meet safely, what verification does and doesn't mean, how reporting works — and a one-tap path to Report.

### Entry

- NM-004 handoff (logged-in variant of the public Trust & Safety Center)
- NM-023 system cards (meet-safe, payment notice, masking notice → "tips")
- NM-027 confirmation card ("Safety tips") and NM-037 Settings → Safety row

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Safety Center                            │
├────────────────────────────────────────────┤
│ (   Report a problem    )                  │ ← primary CTA at top AND bottom
├────────────────────────────────────────────┤
│ MEET-SAFE CHECKLIST                        │ ← PP-08 content
│ ▸ Meet in a public place first             │
│ ▸ Daytime first visit                      │
│ ▸ Share live location with family          │
│ ▸ Never pay before seeing the room         │ ← visiting-pass scam guard (PP-08)
│ ▸ Never share full Aadhaar over chat       │ ← document safety
├────────────────────────────────────────────┤
│ HOW VERIFICATION WORKS (T0–T3 + badges)    │ → NM-004 for full detail
├────────────────────────────────────────────┤
│ HOW REPORTING WORKS                        │
│ Safety reports reviewed <12h · other <48h; │ ←  SLA in plain words
│ every report gets an outcome notice.       │
├────────────────────────────────────────────┤
│ BLOCKING: blocked people can't see you,    │ ← F-056 explainer
│ message you, or appear in your discovery.  │
│ ⚑ Verification ≠ endorsement · NestMate   │
│   is not an emergency service — police:    │ ← emergency guidance (local links)
│   112 · cybercrime: cybercrime.gov.in      │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap "Report a problem" | Report flow opens (target chosen inside) | NM-027 |
| Tap "Blocked accounts" | Blocked-list management view | NM-026 (management view) |
| Tap the verification section | Full trust explainer | NM-004 |
| Follow a chat-card deep link | Jumps to the anchored section | NM-026 (section) |
| Tap support link | Help & Support | NM-039 |

### Navigation

```text
ENTRY ← NM-004 (logged-in) · chat cards · NM-027 confirm
  ↓
NM-026 — Safety Center (Authenticated)
  ↓
PRIMARY ACTION → Tap "Report a problem"
  ↓
SYSTEM RESPONSE → Report flow opens (target chosen inside)
  ↓
NEXT SCREEN → NM-027
```

Back returns to the source (NM-004 / NM-023 / NM-027 / NM-037). No bottom nav. Sections are anchorable — chat system cards and notifications deep-link to the exact section, not just the page. The screen is read-only content plus action entry; nothing here can be broken by state elsewhere.

### States

```text
DEFAULT
↓
Full guidance article with both report CTAs and blocked-account management
↓
Read; open report flow; manage blocked list
↓
NM-027 / unblock actions in place

LOADING
↓
Section skeletons (≤300ms perceived)
↓
Wait
↓
Article renders in place

ERROR (content fails)
↓
Static evergreen fallback copy + retry — the page never blocks on the content fetch
↓
Retry or act on the fallback content
↓
NM-027 / stays on NM-026

EMPTY (no blocked accounts)
↓
Honest "no blocked accounts" line in the management view
↓
Continue
↓
Stays on NM-026
```

---

## W-27 — NM-027 — Report / Block Flow

### Role

All authenticated users (reporter)

### Purpose

Structured escalation that makes the reporter feel heard and triggers real protections immediately: a reference ID, defined SLAs, and auto-protections where severity demands.

### Entry

- Overflow menus (⋯) on profiles, listing cards, listing details, chat threads (target pre-attached)
- NM-023 overflow (message context carried as the evidence anchor)
- NM-026 "Report a problem" (no target pre-attached) and the NM-004 guest report form (listing-scoped variant only)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Report                            1 of 3 │
├────────────────────────────────────────────┤
│ STEP 1 — target auto-attached              │
│ Reporting: [p] Priya · HSR listing         │ ← pre-filled from entry context;
│   (guests: listing-scoped form via NM-004) │   not editable (audit integrity)
├────────────────────────────────────────────┤
│ STEP 2 — what's wrong?                     │ ← reason taxonomy
│ ( ) Scam or fraud                          │
│ ( ) Harassment or abuse                    │
│ ( ) Fake profile or listing                │
│ ( ) Inappropriate content                  │
│ ( ) Off-platform payment request           │
│ ( ) Safety concern                         │
│ ( ) Other                                  │
├────────────────────────────────────────────┤
│ STEP 3 — details (optional)                │
│ [ free text ______________________ ]       │
│ [📎 Add screenshot]                        │ ← evidence upload (restricted store)
├────────────────────────────────────────────┤
│ STEP 4 — immediate protection              │
│ Also block this person              ⚫ ON  │ ← default ON when counterparty
│ Blocked: they can't contact or see you     │   (F-056 immediate sever)
├────────────────────────────────────────────┤
│ (      Submit report       )               │
└────────────────────────────────────────────┘
   → Confirmation card: "Report #R-2381 received.
     Safety reports reviewed within 12h."  [Safety tips → NM-026]
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Submit report | Case created; severity-based auto-protections apply (safety-class: chat pair freeze / listing unlist while pending) (R-23) | Confirmation → NM-026 |
| Toggle block + submit | Block executes immediately — mutual invisibility everywhere (R-19) | Confirmation → NM-026 |
| Tap Block only | Block without a case; "also report?" prompted once | back to source |
| Re-report the same object | Deduped: "already under review" (EC-09) | stay |
| Report own listing / self | Prevented with an inline explanation | stay |
| Cancel | Nothing sent; returns to the source | source screen |

### Navigation

```text
ENTRY ← Overflow menus everywhere · NM-026
  ↓
NM-027 — Report / Block Flow
  ↓
PRIMARY ACTION → Submit report
  ↓
SYSTEM RESPONSE → Case created; severity-based auto-protections apply (safety-class: chat pair freeze / listing unlist while pending) (R-23)
  ↓
NEXT SCREEN → Confirmation → NM-026
```

Back preserves selections per step; Cancel exits with nothing sent and returns to the exact source screen. No bottom nav (wizard). The guest variant (from NM-004) is listing-scoped with the same wizard, ending in a guest-safe confirmation. After submission the flow always ends on the confirmation → NM-026 — never a dead end.

### States

```text
DEFAULT
↓
4 steps: reason taxonomy → evidence → block toggle (default ON) → review & submit;
one primary CTA per step
↓
Complete the steps; Back preserves entries
↓
NM-026 (confirmation) / protections applied immediately

ERROR (evidence upload fails, EC-06)
↓
Named cause + fix; report text preserved; retry idempotent
↓
Retry or submit without evidence
↓
Stays on the step

RESTRICTED (duplicate report, EC-09)
↓
"Already under review" + the open case's reference
↓
Keep the reference; continue using the product
↓
Back to the origin screen

RESTRICTED (self-target)
↓
Inline explanation; submission prevented — no self-cases
↓
Go back
↓
Origin screen

SUCCESS
↓
Reference ID + SLA expectation + protection status; reporter tracked for closure
↓
Return to safety center or origin
↓
NM-026 / origin screen (closure arrives via NM-024)
```

### Branches

```text
```text
SUBMITTED → reference ID + SLA + protections status → NM-026 / origin screen
BLOCK ON (default) → mutual invisibility everywhere (R-19) → origin screen
DUPLICATE (EC-09) → "already under review" + reference → back to origin
S1/S2 CASE OPEN → chat pair frozen / listing unlisted (R-23) → NM-047 triage <12h
DISMISSED (EC-27) → protections reverse cleanly → closure notice via NM-024
UPHELD → enforcement cascade (R-24) → closure notice via NM-024 (no other-party details)
```
```

---

## W-28 — NM-028 — Profile Public Preview

### Role

Any authenticated user (own preview)

### Purpose

Privacy confidence: the user sees themselves exactly as a stranger sees them — nothing rendered by owner privilege, nothing hidden by it.

### Entry

- NM-017 ("Preview public view")
- NM-038 (Privacy & Visibility Controls)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← This is what others see        [Annotate]│
├────────────────────────────────────────────┤
│ [photo — blurred if enabled]               │ ← EXACT visitor projection:
│ R· 26 · SDE  · ✓ ID verified (Oct 2025)    │   initials vs first name per NM-038,
│ Veg · Early sleeper · Non-smoker           │   blur state, chip set, badge row
│                                            │   — pixel-for-pixel honesty surface
├────────────────────────────────────────────┤ (annotation mode ON:)
│ ┌ "About me" ─ visible to connections only┐│ ← overlay tags on each block:
│ ┌ Lifestyle detail ─ connections only ────┐│   "everyone (auth)" / "connections
│ ┌ Phone · never shown ────────────────────┐│   only" / "never shown"
├────────────────────────────────────────────┤
│ (   Adjust visibility   )                  │ ← → NM-038
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Toggle annotations | Block-level audience markers reveal/hide | stay |
| Tap Adjust visibility | Opens visibility controls | NM-038 |
| Back | Returns to the source; any NM-038 changes re-render the preview on return | NM-017 / NM-038 |

### Navigation

```text
ENTRY ← NM-017 · NM-038
  ↓
NM-028 — Profile Public Preview
  ↓
PRIMARY ACTION → Toggle annotations
  ↓
SYSTEM RESPONSE → Block-level audience markers reveal/hide
  ↓
NEXT SCREEN → stay
```

Push screen — no bottom nav. Back returns to NM-017 or NM-038 (the source). Returning after a visibility change re-renders immediately — never a cached, stale preview.

### States

```text
DEFAULT
↓
The exact public projection of your profile, rendered by the same path others see
↓
Inspect; adjust controls via privacy settings
↓
NM-038

INCOMPLETE
↓
Preview shows honestly what is missing publicly
↓
Finish the profile
↓
NM-017

SUCCESS (post-change)
↓
Re-rendered projection reflects the just-saved controls — never stale
↓
Return to editing or settings
↓
NM-017 / NM-038
```

---

## W-29 — NM-029 — Owner Onboarding Wizard

### Role

New owner (T0)

### Purpose

Establish the owner's identity, property intent, and household expectations — and set the verification expectation before real effort is invested, so publishing never arrives as a surprise.

### Entry

- NM-008 — Role & Intent Selection ("I have a room")
- NM-037 — Settings, "Add owner mode" (Both users)
- Onboarding guard resume — any protected route with this wizard incomplete reopens it at the exact step (EC-01)

### Wireframe

```text
┌────────────────────────────────────────────┐        4 steps:
│ ● ○ ○ ○             Step 1 of 4            │        1 Owner type (below)
├────────────────────────────────────────────┤        2 Property basics — locality,
│ Who are you?                               │           flat type, rooms total/occupied
│ ┌────────────────────────────────────────┐ │        3 Expectations preview — limited
│ │ 🛏 I live here and have a spare room   │ │           ethical set:
│ │ (owner-flatmate — seekers see your     │ │           gender composition, veg/non-veg
│ │  lifestyle and match with you)         │ │           household, non-smoking
│ └────────────────────────────────────────┘ │        4 Verification explainer (below)
│ ┌────────────────────────────────────────┐ │
│ │ 🏢 I own / manage the property         │ │ ← landlord — copy differs (P4)
│ │ (you'll list rooms; tenants apply)     │ │
│ └────────────────────────────────────────┘ │
│ [ Continue ]          [ Save & exit ]      │ ← draft kept, resumable (EC-01)
│  Why verify? → NM-004                      │
└────────────────────────────────────────────┘
   Step 4 (explainer):
   ⚑ "To publish, every owner verifies identity + room control.
      Reviews <24h. Seekers see a badge — never your documents."
   (  Start verification  )  → NM-019 owner variant (T3 step added)
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Select owner type, tap Continue | Choice stored; later copy switches variant | NM-029 (step 2) |
| Complete a step, tap Continue | Inline-validated and saved per step (EC-16); expectations stored as declared norms | NM-029 (next step) |
| Tap "Start verification" | Owner profile saved; verification opens (owner variant: identity + room control) | NM-019 |
| Tap "Save & exit" | Draft kept; resumable at the exact step | NM-030 (resume banner) |
| Tap "Why verify?" | Public trust explainer; wizard state preserved | NM-004 (return) |
| Abandon mid-wizard or kill the app | All completed steps persisted | resume at exact step |

### Navigation

```text
ENTRY ← NM-008 ("Offer") · NM-037 (role add)
  ↓
NM-029 — Owner Onboarding Wizard
  ↓
PRIMARY ACTION → Select owner type, tap Continue
  ↓
SYSTEM RESPONSE → Choice stored; later copy switches variant
  ↓
NEXT SCREEN → NM-029 (step 2)
```

Previous: NM-008 or NM-037. Next: NM-019 on Start verification; NM-030 on Save & exit. No bottom nav (wizard lock — exit is explicit). Device back preserves the current step's data. Resume always reopens at the exact saved step (EC-01); if an existing listing draft is detected, the wizard offers to resume that draft instead of starting over.

### States

```text
DEFAULT (step N of 4)
↓
Current step content, one primary CTA per step, progress + Save draft
↓
Answer, Back, Save & exit
↓
Next step / NM-030 with draft kept (resume banner, EC-01)

LOADING
↓
Skeleton of the current step (≤300ms perceived)
↓
Wait
↓
Step renders in place

INCOMPLETE (validation, EC-16)
↓
Inline field error naming cause + fix; nothing cleared
↓
Fix the field
↓
Stays on the step (advances only when valid)

DRAFT RESUME
↓
"Pick up where you left off — Step N of 4"; matching banner on NM-030 (EC-01)
↓
Resume
↓
Exact step restored

ERROR (save fails)
↓
Inline retryable error; entered data intact; idempotent retry
↓
Retry
↓
Stays on NM-029
```

---

## W-30 — NM-030 — Owner Dashboard

### Role

Authenticated user — owner mode

### Purpose

The owner command center: everything that needs attention today, priority-ordered, each item actionable in one tap — so an owner can run their rental in under a minute a day.

### Entry

- Owner bottom-nav "Dashboard" tab
- Owner-mode login default (NM-006 lands owners here)
- Mode switch from NM-010 (Both users — Seeking ⇄ Offering chip)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ Your rooms                    [+ New] [🔔] │ ← + New → NM-031
├────────────────────────────────────────────┤
│ ⚡ Needs attention                          │ ← SLA-flavored strip:
│ • 3 new applicants — HSR room  [Review]    │   new applicants (→ NM-034)
│ • HSR listing expires in 3d  [Renew 1-tap] │   expiry nudge (F-020)
│ • 2 chats awaiting your reply  [Open]      │   response debt (F-068)
├────────────────────────────────────────────┤
│ HSR Layout · 2BHK            ● Active      │ ← listing summary cards (F-038 mini)
│ confirmed 2d ago · 148 views · 12 connects │   state chip + freshness + stats
├────────────────────────────────────────────┤
│ Applicants: New 3 · Chat 2 · Met 1         │ ← pipeline quick-glance
│ [ Open pipeline → ]                        │   → NM-034
├────────────────────────────────────────────┤
│ Your response rate: ~4h · 🏅 Top responder │ ← F-068 tier meter
├────────────────────────────────────────────┤
│ ⚑ Verify to publish — 1 listing in draft   │ ← unverified gate banner (D-06)
│   (  Verify now → NM-019  )                │
├────────────────────────────────────────────┤
│ [Dash*][Listings][Applicants][Chats][Prof] │ ← owner shell
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap an attention item | Opens the exact surface for that item | NM-034 / NM-032 / NM-022 |
| Tap Renew on an expiring card | +30 days; freshness stamp resets; confirm toast (R-05) | NM-030 (updated) |
| Tap a listing card | Owner listing detail | NM-033 |
| Tap pipeline quick-glance | Stage board for that listing | NM-034 |
| Tap "+ New listing" | Creation wizard; publish gate applies at publish | NM-031 |
| Tap verification banner / switch mode | Verification opens, or shell swaps with per-mode state preserved | NM-019 / NM-010 |

### Navigation

```text
ENTRY ← Bottom nav (owner mode) · login default · deep links
  ↓
NM-030 — Owner Dashboard
  ↓
PRIMARY ACTION → Tap an attention item
  ↓
SYSTEM RESPONSE → Opens the exact surface for that item
  ↓
NEXT SCREEN → NM-034 / NM-032 / NM-022
```

Tab root of the owner shell — device back exits gracefully. Bottom nav: 5 owner tabs, Applicants badge = New-applicant count. Notification deep-links land on the object's own screen, not here. Mode switching never loses draft or chat state. Expired-object deep-links resolve to their state view (EC-12), never an error.

### States

```text
DEFAULT
↓
Attention strip (expiry nudges, new applicants) + listing cards + response meter
↓
Open listings, pipeline, verification, publish
↓
NM-032 / NM-034 / NM-019 / NM-031

LOADING
↓
Skeleton of the strip and first cards (≤300ms perceived)
↓
Wait
↓
Dashboard renders in place

EMPTY (no listings)
↓
"Publish your first room" walkthrough CTA (C-05)
↓
Start publishing
↓
NM-031

EXPIRING (day 27+) / EXPIRED / AUTO-PAUSED
↓
Nudge in the strip + one-tap Renew · card chip + Renew · revive explainer (EC-12)
↓
Renew (+30 days, stamp resets) / revive (confirm + photo re-check)
↓
Listing returns to Active — visible everywhere again

REMOVED
↓
Card state with reason ("Removed — under review")
↓
Open the listing detail for the full reason + appeal
↓
NM-033 (EC-21)

UNVERIFIED
↓
Verify-to-publish banner above the strip
↓
Start verification
↓
NM-019
```

---

## W-31 — NM-031 — Listing Creation Wizard

### Role

Authenticated user — owner mode

### Purpose

Produce a structured, honest, attractive listing in one guided flow — complete enough that seekers can decide without asking, honest enough that moderation rarely needs to intervene.

### Entry

- NM-030 "+ New listing"; NM-032 "+ New"; post-verification success
- NM-033 "Edit" (same wizard, prefilled, edit mode)
- Draft resume — reopens at the exact step (EC-01)

### Wireframe

```text
┌────────────────────────────────────────────┐        6 steps + Review:
│ ● ● ● ○ ○ ○     Step 3 of 6     [Save draft]│        1 Room basics — type, furnishing,
├────────────────────────────────────────────┤           size, bathrooms, floor
│ Rent & terms                               │        2 Photos — F-033: min 3, max 10,
│                                            │           cover select, reorder;
│ Monthly rent                               │           hint: "bright daytime photos —
│ ₹ [ 16,000     ]                           │           5+ photos ≈ 2× connects"
│                                            │        3 Rent & terms (below)
│ Security deposit *        Maintenance      │        4 Amenities & rules — chips +
│ ₹ [ 40,000    ] *         incl. ⚫ Yes ⚪ No│           house rules ≤500 chars
│ (why we ask: deposits are the #1 scam      │        5 Occupancy & expectations —
│  vector — shown upfront to seekers, PP-08) │           occupants count + gender
│ Notice period: [ 1 month ▾ ]               │           composition (shared) +
│ Move-in from: [ Aug 1 📅 ]  Duration: [11m▾]│          household lifestyle (ethical set)
│                                            │        6 Location — locality select +
│ [ ← Back ]              [ Continue → ]     │           approximate pin; exact address
└────────────────────────────────────────────┘           NEVER entered
   Review step: live preview card (C-01) + "Preview as seeker" (public projection)
   Publish tap → unverified? → interstitial (D-06):
   ⚑ "Publishing requires owner verification (ID + room control). <24h review."
   ( Start verification → NM-019 )  draft preserved
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Complete a step, tap Continue | Inline-validated; saved per step; nothing lost on failure (EC-16) | NM-031 (next step) |
| Tap Save draft | Draft kept; resume banner appears on NM-030 | NM-030 |
| Tap Publish (has T3) | Auto-checks run → Active (usually instant) or Pending if flagged | NM-030 (success card) |
| Tap Publish (no T3) | Verification interstitial — never a silent block; draft preserved | NM-019 |
| Type contact details in house rules | Blocked inline with the masking explanation | NM-031 (step 4) |
| Duplicate detected at publish | Warning sheet: merge / replace / publish anyway (R-10) | sheet → chosen path |

### Navigation

```text
ENTRY ← NM-030 · NM-032 "New" · post-verification
  ↓
NM-031 — Listing Creation Wizard
  ↓
PRIMARY ACTION → Complete a step, tap Continue
  ↓
SYSTEM RESPONSE → Inline-validated; saved per step; nothing lost on failure (EC-16)
  ↓
NEXT SCREEN → NM-031 (next step)
```

Previous: NM-030 or NM-032 (NM-033 in edit mode). No bottom nav (wizard). Back preserves every field; Save draft exits explicitly. Draft resume reopens at the exact step (EC-01). Publish success returns to NM-030 with a success card; the listing then appears on NM-032 and all seeker surfaces. Leaving mid-edit never publishes partial changes.

### States

```text
DEFAULT (step N of 6)
↓
Current step with inline validation; one primary CTA; Save draft
↓
Complete steps; Back preserves; Publish on the review screen
↓
Pending auto-checks → NM-030 (Active) / NM-033

DRAFT
↓
Draft saved; resume banner on NM-030 (EC-01)
↓
Resume any time
↓
Exact step restored

PENDING / SUCCESS (after publish)
↓
"Under review" card when flagged / "Usually approved instantly" confirmation;
decision notified (<12h)
↓
Wait; meanwhile manage other listings
↓
NM-033 (Active / Flagged states)

PUBLISH-GATED (no T3, R-02)
↓
Interstitial explaining the T3 requirement — never an error, never a silent block
↓
Start verification; draft is kept
↓
NM-019

DUPLICATE (EC-11) / ERROR (validation)
↓
Merge / replace / publish-anyway sheet (R-10) / inline errors, publish disabled
while invalid
↓
Choose a duplicate path / fix the fields
↓
Publish continues / stays on the step
```

### Branches

```text
```text
PUBLISH (T3 held) → auto-checks → pass → ACTIVE → NM-030 (analytics live)
PUBLISH (no T3, R-02) → T3 interstitial — draft kept → NM-019 → retry publish after approval
AUTO-CHECK FLAG → stays Pending → NM-045/NM-046 review → approve / edit-require / unlist
DUPLICATE (EC-11) → merge / replace / publish-anyway sheet (R-10) → publish continues
SAVE DRAFT / ABANDON → resume banner on NM-030 (EC-01)
VALIDATION ERROR (EC-16) → inline fix, publish disabled while invalid → same step
```
```

---

## W-32 — NM-032 — Listings Management

### Role

Authenticated user — owner mode

### Purpose

Keep the owner's inventory truthful at a glance: every listing, its true lifecycle state, its freshness, and the one-tap fix — so no listing can silently rot.

### Entry

- Owner bottom-nav "Listings" tab
- NM-030 (expiry attention item; listing cards)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ Listings                      [+ New]      │
├────────────────────────────────────────────┤ ← sorted by attention:
│ [t] HSR Layout · 2BHK   ⚠ Expiring in 3d   │   expiring first, then active,
│ confirmed 2d ago · 148 views · 12 conn     │   paused, filled, removed
│ [Renew 1-tap] [Pause] [Mark filled]  [⋯]   │ ← quick actions inline (F-020)
├────────────────────────────────────────────┤
│ [t] Whitefield · 1BHK   ● Active           │
│ confirmed 9d ago · 31 views · 2 connects   │
│ [Pause] [Mark filled]                [⋯]   │
├────────────────────────────────────────────┤
│ [t] Koramangala · 3BHK  ⏸ Paused           │
│ [Resume]                             [⋯]   │
├────────────────────────────────────────────┤
│ [t] BTM · studio        💤 Auto-paused     │ ← >45d no confirm (J-G)
│ "Refresh photos to revive" [Revive]        │   revive explainer
├────────────────────────────────────────────┤
│ [t] HSR #2              ✔ Filled Aug 2     │ ← Filled: hidden from search
├────────────────────────────────────────────┤
│ Empty: "No listings yet" [ Create first → ]│
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap a row | Owner listing detail | NM-033 |
| Tap Renew (expiring/expired) | +30 days; freshness stamp resets; confirm toast (R-05) | NM-032 (updated) |
| Tap Pause / Resume | State changes; paused = invisible to search; public URL shows the paused state (EC-12) | NM-032 (updated) |
| Tap Mark filled | Confirm sheet → fill cascade (closed everywhere; other applicants politely closed) (R-09) | NM-032 (Filled chip) |
| Tap Revive (auto-paused) | Revive-confirm; listing re-validates and reactivates | NM-032 (Active) |
| Tap ⋯ → Remove / + New | Confirm + reason required, removed everywhere / creation wizard | NM-032 (Removed) / NM-031 |

### Navigation

```text
ENTRY ← NM-030 · nav Listings
  ↓
NM-032 — Listings Management
  ↓
PRIMARY ACTION → Tap a row
  ↓
SYSTEM RESPONSE → Owner listing detail
  ↓
NEXT SCREEN → NM-033
```

Tab root within the owner shell — bottom nav present; device back exits gracefully. Row → NM-033 is a push; back returns with updated state. + New → NM-031 (no bottom nav inside the wizard). Renew, pause, fill and revive never navigate away — the row updates in place.

### States

```text
DEFAULT
↓
Attention-sorted rows with true state chips and freshness countdowns
↓
Open rows, quick actions (renew / pause / resume)
↓
NM-033 / state actions in place

EMPTY
↓
"No listings yet" + create CTA (C-05)
↓
Create a listing
↓
NM-031

EXPIRING (day 27+) / EXPIRED
↓
Expiring chip + one-tap Renew (nudge also notified) / Expired chip + Renew CTA
↓
Renew (+30 days; renewal reactivates)
↓
Row returns to Active

AUTO-PAUSED (45 days)
↓
"Paused automatically" chip + revive explainer
↓
Revive (confirm + photo re-check) or let it lapse
↓
Active / terminal expired

PAUSED
↓
Paused chip + Resume (invisible to search while paused, EC-12)
↓
Resume
↓
Active

FILLED / REMOVED
↓
Closed chip (Filled shows the date) / Removed shows the reason — read-only row
↓
View detail
↓
NM-033
```

### Branches

```text
```text
RENEW (expiring/expired) → +30 days, stamp resets, reactivates → row Active
PAUSE → invisible to search, URL + state preserved (EC-12) → Resume later
REVIVE (auto-paused, 45d) → confirm + photo re-check → Active
REMOVE (reason required) → REMOVED everywhere → row read-only
MARK FILLED → fill cascade (R-09) → NM-033 Filled · hidden everywhere · others closed
OPEN ROW → NM-033 (detail + analytics)
```
```

---

## W-33 — NM-033 — Listing Detail (Owner View)

### Role

Authenticated user — owner mode

### Purpose

Per-listing control center: exactly what seekers see, exactly how it performs, and every lifecycle action — so the owner can manage one room with full information.

### Entry

- NM-032 row tap; NM-030 listing card tap
- Notification deep-link (listing approved / flagged / expiring — resolves to the current state, EC-12)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← HSR Layout · 2BHK      ● Active          │ ← state chip always visible
├────────────────────────────────────────────┤
│ PUBLIC VIEW (identical projection NM-012)  │ ← what seekers see — honesty panel
│ [gallery] ₹16,000 · ✓ Owner verified       │   moderation status banner here when
│ 🕒 Confirmed 2d ago · amenity chips        │   flagged: "⚑ Under review"
├────────────────────────────────────────────┤
│ PERFORMANCE (7d / 30d toggle)              │ ← F-038 analytics
│ Views 148 · Saves 23 · Connects 12         │
│ Connect → chat rate: 58%                   │ ← funnel honesty (respond more = more)
│ 📈 freshness: renew by Jul 30 to keep rank │
├────────────────────────────────────────────┤
│ APPLICANTS: New 3 · Shortlisted 1 · Met 1  │
│ [ Open pipeline → ]                        │ → NM-034
├────────────────────────────────────────────┤
│ ( Renew · +30d )  ( Mark as Filled )       │ ← state-dependent primaries
│ Edit listing · Pause · Share public card   │   (Renew when expiring/expired;
├────────────────────────────────────────────┤    Mark filled when Active; Edit always)
│ DANGER ZONE                                │
│ Remove listing (confirm + reason)          │ ← polite-close of pipeline via F-036
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap Renew / Pause / Resume | +30 days, stamp resets (R-05) / state changes, paused = not searchable, public URL shows the paused state (EC-12) | NM-033 (updated) |
| Tap Mark as Filled | Confirm sheet: "other applicants will be politely closed" → fill cascade (R-09) | NM-033 (Filled) |
| Tap Edit | Same creation wizard, prefilled | NM-031 (edit mode) |
| Tap applicant summary | Stage board for this listing | NM-034 |
| Tap Share | Public-safe share card (photo, rent, locality, badge, freshness) | system share sheet |
| Tap Remove | Confirm + reason; listing removed everywhere | NM-032 |

### Navigation

```text
ENTRY ← NM-032 row · NM-030 card
  ↓
NM-033 — Listing Detail (Owner View)
  ↓
PRIMARY ACTION → Tap Renew / Pause / Resume
  ↓
SYSTEM RESPONSE → +30 days, stamp resets (R-05) / state changes, paused = not searchable, public URL shows the paused state (EC-12)
  ↓
NEXT SCREEN → NM-033 (updated)
```

Previous: NM-032 or NM-030. Push screen — no bottom nav; back returns to the list with updated state. Edit opens NM-031 prefilled (draft semantics; leaving never publishes partial edits). Notification deep-links always land here in the listing's current state — expired/filled/removed resolve to the state banner with a next action, never an error (EC-12).

### States

```text
ACTIVE / PAUSED
↓
Dual view: owner analytics panel + the public panel as seekers see it
↓
Edit, pause/resume, renew, Mark Filled, open pipeline
↓
NM-031 edit / NM-034 / state change in place

EXPIRING / EXPIRED / AUTO-PAUSED
↓
Renew emphasized with the expiry date / Expired chip + Renew / revive explainer + Revive
↓
One-tap renew / revive (re-validates photos)
↓
Active

PENDING / FLAGGED
↓
"Under review" card on the public panel after publish or flag; decision notified (<12h)
↓
Wait, or edit per the admin note
↓
Active / edit-required loop

REMOVED (moderation)
↓
State + reason + appeal link
↓
Appeal
↓
NM-039 (appeal path)

FILLED
↓
Filled chip + date; pipeline closed; no lifecycle actions — a view-only record
↓
View only
↓
Stays on NM-033 (read-only)
```

### Branches

```text
```text
EDIT → NM-031 wizard (edits preserve the live state; freshness unchanged)
PAUSE/RESUME → state flips in place; search visibility follows immediately
RENEW (expiring/expired) → +30 days → Active
MARK FILLED → confirm → fill cascade (R-09): hidden from NM-002/NM-011/NM-016,
  non-selected applicants politely closed, pending requests withdrawn
REMOVED (moderation) → state + reason + appeal link → NM-039 appeal
```
```

---

## W-34 — NM-034 — Applicant Pipeline

### Role

Authenticated user — owner mode

### Purpose

The queue-with-context that replaces inbox chaos: every applicant, every stage, decision-relevant facts on each card — nothing lost, nobody silently ghosted.

### Entry

- Owner bottom-nav "Applicants" tab (badge = New count)
- NM-030 attention item and quick-glance; NM-033 summary; new-applicant notification deep-link (lands on the stage)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Applicants · HSR room ▾                  │ ← listing selector (multi-listing)
├────────────────────────────────────────────┤
│ [New ³][Shortlisted][Chatting²][Met][Selec.]│ ← segmented stages (board columns
├────────────────────────────────────────────┤   post-MVP); terminal: Rejected/
│ ┌────────────────────────────────────────┐ │   Withdrawn collapsed
│ │ [p] Aarav · 27 · SDE · ✓ID verified    │ │ ← card = decision info only:
│ │ 🟢 84 Great · moves in Aug 1 · ₹fit ✓  │ │   score vs household (F-041),
│ │ "Veg, non-smoker, works hybrid"        │ │   rent-fit, move-in, 1-line why
│ │ [Shortlist] [Open chat]        [View]  │ │ ← quick-move + chat + detail
│ └────────────────────────────────────────┘ │
│ ┌ card: [p] Meera · ✓ID · 71 Good … ┐      │
├────────────────────────────────────────────┤
│ 💡 Respond within 24h keeps your 🏅 Top    │ ← response-rate SLA hint (F-068)
│    responder badge.                        │
│ [Filter: ✓ verified only] [Score 70+]      │
├────────────────────────────────────────────┤
│ [Dash][Listings][Applicants*][Chats][Prof] │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap a card | Full detail with stage actions | NM-035 |
| Tap Shortlist (New card) | Card moves to Shortlisted (idempotent) | NM-034 (updated) |
| Tap Open chat | Thread anchored to this applicant | NM-023 |
| Tap Decline | Polite auto-notice; moves to Rejected (collapsed); 90-day re-request cooldown (EC-08) | NM-034 (updated) |
| Apply filters / switch listing / renew (expired banner) | Cards narrow or board reloads; renewal exits read-only mode | NM-034 (updated) |

### Navigation

```text
ENTRY ← NM-030 · nav Applicants · NM-033
  ↓
NM-034 — Applicant Pipeline
  ↓
PRIMARY ACTION → Tap a card
  ↓
SYSTEM RESPONSE → Full detail with stage actions
  ↓
NEXT SCREEN → NM-035
```

Tab root of the owner shell (Applicants active; badge = New count). Card → NM-035 is a push; back returns with the board updated. Chat opens NM-023; back preserves stage and filter state. Notification deep-links land on the listing's board at the right stage.

### States

```text
DEFAULT
↓
Stage board (New → Shortlisted → Chatting → Met → Selected) with true counts and cards
↓
Move cards (forward-only), open applicants, open chats
↓
NM-035 / NM-023

EMPTY
↓
"Applicants arrive when your listing is fresh" + Renew CTA if expiring (C-05)
↓
Renew the listing or keep waiting
↓
NM-032

EXPIRING / EXPIRED LISTING (EC-12)
↓
Nudge banner / expired banner; the pipeline is read-only except close-out actions
↓
Renew, or decline/close applicants
↓
NM-032 (renew)

FILLED LISTING
↓
Board collapsed; remaining New applicants politely closed in one visible sweep (R-09)
↓
Review the close-out
↓
Stays on NM-034 (collapsed)

WITHDREW APPLICANT (EC-08)
↓
Collapsed terminal entry; history preserved
↓
View read-only
↓
NM-035 (read-only)

ERROR
↓
Per-block retry; the board never silently drops cards; stage moves are idempotent (EC-26)
↓
Retry the failed block
↓
Stays on NM-034
```

### Branches

```text
```text
OPEN CARD → NM-035 (detail & compare)
MOVE STAGE (forward-only) → New → Shortlisted → Chatting → Met → Selected (idempotent, EC-26)
SELECT → confirm sheet → fill cascade (R-09) → listing Filled everywhere; others closed
DECLINE / DECLINE-ALL (New stage) → polite notice, collapsed terminal state
APPLICANT WITHDRAWS (EC-08) → collapsed terminal entry, history preserved
LISTING EXPIRED (EC-12) → pipeline read-only except close-out → renew via NM-032
```
```

---

## W-35 — NM-035 — Applicant Detail & Compare

### Role

Authenticated user — owner mode

### Purpose

Decision-quality evaluation of one candidate — compatibility against the actual household, interaction history, private notes — plus honest side-by-side comparison before the consequential act of selecting.

### Entry

- NM-034 applicant card tap (only entry)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Aarav · 27 · SDE        ✓ ID verified    │ ← NM-015 read-only variant
├────────────────────────────────────────────┤   + connection context
│ ┌ Match with your household ──────────────┐│
│ │ vs you (owner-flatmate): 84 Great       ││ ← per-occupant compat when
│ │ vs flatmate Ravi: 76 Good               ││   attributes shared (F-041)
│ │ match: veg, schedule · differ: guests   ││
│ └─────────────────────────────────────────┘│
├────────────────────────────────────────────┤
│ Timeline: Requested Jul 2 → Chatting 3d →  │ ← stage history
│ Met Jul 28                                 │
├────────────────────────────────────────────┤
│ Private notes (owner-only)        [Edit]   │ ← never shown to applicant
│ "Good humor, asked about deposit sensibly" │
├────────────────────────────────────────────┤
│ [ Add to compare ]  Compare tray: 2/3      │ ← up to 3 → side-by-side sheet:
│ ┌ score · rent-fit · move-in · verify ·    │   key attributes columns
│ │ food · sleep · smoking (table) ┐         │
├────────────────────────────────────────────┤
│ ( Shortlist ) ( Mark met ) ( Select )      │ ← stage actions;
│ Open chat · Decline                        │   Select → confirm sheet:
└────────────────────────────────────────────┘   "Others will be politely closed,
                                                 listing marked Filled" → F-036
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap Shortlist / Mark met | State-machine move, idempotent (EC-26) | NM-034 (updated) |
| Tap Select | Mandatory confirm sheet → fill cascade: listing Filled everywhere; other applicants politely closed | NM-033 (Filled) |
| Tap Decline | Polite notice; applicant to Rejected; 90-day cooldown (EC-08) | NM-034 (updated) |
| Edit private note | Saved privately per applicant | NM-035 (updated) |
| Tap Add to compare | Tray fills (max 3); side-by-side sheet renders | compare overlay |
| Tap Open chat | Thread anchored to this applicant | NM-023 |

### Navigation

```text
ENTRY ← NM-034 card
  ↓
NM-035 — Applicant Detail & Compare
  ↓
PRIMARY ACTION → Tap Shortlist / Mark met
  ↓
SYSTEM RESPONSE → State-machine move, idempotent (EC-26)
  ↓
NEXT SCREEN → NM-034 (updated)
```

Previous: NM-034 (push screen; no bottom nav). Back always returns to the board with updated stages. Compare renders as one overlay sheet — never stacked sheets. After Select completes, navigation lands on the Filled listing detail; further applicant actions there are closed out.

### States

```text
DEFAULT
↓
Full applicant profile + compatibility breakdown + stage-appropriate actions
↓
Evaluate, take notes, compare, open chat, move stage, Select
↓
NM-023 / NM-034 / Select confirm

WITHDREW / REJECTED / FILLED CONTEXT (EC-08)
↓
Terminal or read-only record; no stage actions
↓
Return to the board
↓
NM-034 (collapsed terminal)

SELECT-CONFIRM
↓
Consequence-stated confirm sheet ("others will be politely closed…")
↓
Confirm or cancel
↓
Fill cascade executes transactionally (R-09) → NM-033 Filled

COMPARE (max 3)
↓
Side-by-side table of the chosen candidates (scores, badges, rent-fit, notes)
↓
Add/remove candidates; open one in full
↓
NM-035 full view (a 4th add is explained and blocked)

ERROR
↓
Inline retryable errors; notes never lost; saves idempotent
↓
Retry
↓
Stays on NM-035
```

---

## W-36 — NM-036 — Owner Profile (Edit)

### Role

Authenticated user — owner mode

### Purpose

The owner's trust surface: who they are, what they own, how their household lives, and how they respond — maintained here, rendered identically everywhere seekers judge them.

### Entry

- Owner bottom-nav "Profile" tab

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Owner profile                            │
├────────────────────────────────────────────┤
│ [photo] Priya · Member since 2026          │
│ ✓ ID verified · ✓ Owner verified (B-4)     │ ← badge row incl. B-4
│ Owner type: Living-in owner-flatmate       │
├────────────────────────────────────────────┤
│ PROPERTIES                                 │
│ • HSR Layout · 2BHK (1 room listed)  [Edit]│ ← locality + rooms summary
│ [+ Add property]                           │
├────────────────────────────────────────────┤
│ HOUSEHOLD LIFESTYLE (what seekers see)     │ ← the ethical expectation set
│ Veg household · Non-smoking · No pets      │ — editable here
│ Guests: weekends ok                        │
├────────────────────────────────────────────┤
│ Your response rate: ~4h · 🏅 Top responder │ ← F-068 (seekers see this tier)
├────────────────────────────────────────────┤
│ 🛡 Verification card → NM-020              │
│ Profile 90% complete → [finish]            │
│ [Preview as seeker → NM-028 variant]       │
└────────────────────────────────────────────┘
│ [Dash][Listings][Applicants][Chats][Prof*] │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Edit any section | Sectional save; completeness meter updates | NM-036 (updated) |
| Tap Add property | Property form; new property joins the list | NM-036 (updated) |
| Tap Upgrade / Re-verify | Verification submission (owner variant) | NM-019 |
| Tap verification card | Verification status detail | NM-020 |
| Tap Preview as seeker | The exact public owner projection seekers see | NM-028 (owner variant) |
| Tap ⋯ → Settings / edit household lifestyle | Account settings / saved; compatibility recomputes with a visible "matches updating" state (R-15) | NM-037 / NM-036 (updated) |

### Navigation

```text
ENTRY ← Nav Profile (owner mode)
  ↓
NM-036 — Owner Profile (Edit)
  ↓
PRIMARY ACTION → Edit any section
  ↓
SYSTEM RESPONSE → Sectional save; completeness meter updates
  ↓
NEXT SCREEN → NM-036 (updated)
```

Tab root of the owner shell (Profile active). Preview, verification, and settings are pushes/sheets — back returns with all saved state intact. Mode switch (Both users) leaves to NM-017 and returns via the same tab. No section is a dead end: each either saves in place or names its destination.

### States

```text
DEFAULT
↓
All owner sections with current data + completeness meter (skeleton ≤300ms)
↓
Edit sections, open verification, preview
↓
NM-019 / NM-028 / saved in place

UNVERIFIED
↓
Verification card framed as "Verify to publish"
↓
Start verification
↓
NM-019

REJECTED VERIFICATION / COOLING
↓
Reason-coded fix guidance on the card (R-03) / 7-day cooling date shown
↓
Resubmit / wait
↓
NM-019 / NM-019 after the date

INCOMPLETE
↓
Completeness meter names the missing sections
↓
Tap [finish] on a section
↓
Deep-links to that section

TIER DROP / ERROR
↓
Honest meter update + improvement tip (R-30) / inline per-section retry, edits never lost
↓
Improve response time / retry
↓
Stays on NM-036
```

---

## W-37 — NM-037 — Settings

### Role

All authenticated users

### Purpose

The account hub: every control not part of daily usage — identity, roles, verification, notifications, privacy, legal, support, and account exit — lives here and only here.

### Entry

- Overflow (⋯) menu on the seeker profile screen (NM-017)
- Overflow (⋯) menu on the owner profile screen (NM-036)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Settings                                 │
├────────────────────────────────────────────┤
│ ACCOUNT                                    │
│ Phone: +91 98•••• ••21   [Change →]        │ ← change → re-OTP new number;
│ Email: Add email (V1.1)         [coming]   │   no duplicate accounts (EC-02)
├────────────────────────────────────────────┤
│ ROLES                                      │
│ Seeking ✓   Offering ✗  [Add owner mode →] │ ← F-079 → NM-008 upgrade path (J-J 4)
├────────────────────────────────────────────┤
│ Verification → NM-020 (tier chip here)     │
│ Notifications → NM-025                     │
│ Privacy & visibility → NM-038              │
├────────────────────────────────────────────┤
│ Language: English (more soon — D-16)       │ ← disabled control, honest
│ Legal: Terms · Privacy Policy (versioned)  │
│ Help & support → NM-039                    │
├────────────────────────────────────────────┤
│ DANGER ZONE                                │
│ Deactivate or delete account → NM-040      │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap "Change" on phone | Starts dual-OTP verification (old number, then new); on success the number updates and all other sessions are revoked; never creates a duplicate account (EC-02) | OTP re-verification step → back to NM-037 (updated) |
| Tap "Add owner / seeker mode" | Role selection opens in the upgrade variant — no re-signup; the switch never touches active chats or drafts (EC-25) | NM-008 |
| Tap Verification row | Opens verification status; the tier chip here mirrors it | NM-020 |
| Tap Notifications / Privacy / Support rows | Navigate to each control's single home | NM-025 / NM-038 / NM-039 |
| Tap Terms or Privacy Policy | Opens the versioned document; closing returns here | NM-037 |
| Tap "Deactivate or delete account" | Opens the exit screen with both paths | NM-040 |

### Navigation

```text
ENTRY ← Nav Profile → Settings
  ↓
NM-037 — Settings
  ↓
PRIMARY ACTION → Tap "Change" on phone
  ↓
SYSTEM RESPONSE → Starts dual-OTP verification (old number, then new); on success the number updates and all other sessions are revoked; never creates a duplicate account (EC-02)
  ↓
NEXT SCREEN → OTP re-verification step → back to NM-037 (updated)
```

Back returns to the profile screen the user came from (per mode). No bottom nav. Individual sections have no deep links — the rows are the only paths. If the account was deleted after its grace period, this screen is unreachable: the signup screen shows the "account deleted" notice instead.

### States

```text
DEFAULT
↓
All sections rendered with current account facts (phone, roles, verification,
notifications, privacy, legal, language)
↓
Open sub-settings, add a role, change phone
↓
NM-025 / NM-038 / NM-040 / NM-008 (role add) / NM-019

LOADING
↓
Section skeleton; account facts populate in place (≤300ms perceived)
↓
Wait
↓
Settings render

DISABLED (locked rows)
↓
Language and email rows render inert with honest reasons ("more soon" / "coming later")
↓
Nothing to do — rows are never selectable (R-26)
↓
Stays on NM-037

ERROR (phone change fails)
↓
Inline, actionable message; the existing number stays unchanged; retry idempotent
↓
Retry
↓
Stays on NM-037 (no data loss)
```

---

## W-38 — NM-038 — Privacy & Visibility Controls

### Role

All authenticated users

### Purpose

User-owned privacy: decide exactly how exposed the profile is — photo, name, each lifestyle attribute, discovery presence, activity signal — and see the consequence of every choice inline, before and after it is made.

### Entry

- NM-037 (Privacy & visibility row)
- NM-028 (Profile Public Preview — "Adjust visibility")

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Privacy & visibility      [Preview →]    │ ← → NM-028 live check
├────────────────────────────────────────────┤
│ PHOTO                                      │
│ ( ) Everyone on NestMate                   │
│ ( ) Connections only                       │
│ (●) Blurred until connect ← default safe │ ← F-013
├────────────────────────────────────────────┤
│ NAME                                       │
│ (●) First name only   ( ) Initials (R·)    │
├────────────────────────────────────────────┤
│ LIFESTYLE ATTRIBUTES (per-attribute)       │
│ Food        everyone (auth)   ▾            │ ← must-haves: always APPLIED,
│ Sleep       connections only  ▾            │   display hideable — never either/or
│ Cleanliness everyone (auth)   ▾            │
│ Guests      private           ▾            │
├────────────────────────────────────────────┤
│ DISCOVERY                                  │
│ Appear in Flatmate Discovery       ⚫ ON   │ ← off = excluded from F-044 feed;
│ consequence: "you're still reachable via   │   pending requests stay pending
│ direct link + your listings"               │
├────────────────────────────────────────────┤
│ ACTIVE STATUS                              │
│ Show "active recently"             ⚫ ON   │ ← fuzzed to day granularity
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Change any control | Saved instantly; every surface rendering that data updates | Stay (the control itself confirms) |
| Turn discovery off while requests are pending | Pending requests remain pending — opt-out never cancels in-flight state | Stay |
| Hide a must-have attribute | Display hidden; the must-have continues to apply as a filter | Stay |
| Tap "Live preview" | Opens the public preview rendering with the new settings applied | NM-028 |
| Tap back | Returns to the origin; all changes already saved | NM-037 / NM-028 |

### Navigation

```text
ENTRY ← NM-037 · NM-028
  ↓
NM-038 — Privacy & Visibility Controls
  ↓
PRIMARY ACTION → Change any control
  ↓
SYSTEM RESPONSE → Saved instantly; every surface rendering that data updates
  ↓
NEXT SCREEN → Stay (the control itself confirms)
```

Back returns to the entry screen (NM-037 or NM-028). No bottom nav. There is no separate save step — leaving never loses a change. The preview link goes to NM-028 and returns with settings unchanged.

### States

```text
DEFAULT
↓
All controls with current values + consequence lines (blur, name masking, discovery opt-out)
↓
Toggle controls (auto-saved); open the live preview
↓
NM-028 (preview reflects the change immediately)

LOADING
↓
Control skeleton (≤300ms perceived)
↓
Wait
↓
Controls render in place

ERROR (auto-save fails, EC-16)
↓
Inline "change not saved — retry"; the control shows the last saved value; intent preserved
↓
Retry
↓
Stays on NM-038
```

---

## W-39 — NM-039 — Help & Support

### Role

All authenticated users

### Purpose

Self-serve answers first, human fallback always: the questions that actually occur, answered consistently with the trust and safety content, plus a routed contact form with a guaranteed confirmation.

### Entry

- NM-037 (Help & support row)
- Footer link on public screens (NM-001, NM-004)
- Support links embedded in error and locked states (OTP lockout in NM-007, verification cooling in NM-020, frozen chat in NM-023)

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Help & support                           │
├────────────────────────────────────────────┤
│ 🔍 Search help…                            │
├────────────────────────────────────────────┤
│ TOPICS (seeded from docs 18/19 content)    │
│ ▸ Verification — docs, timelines, rejections│
│ ▸ Freshness — what "confirmed 2d ago" means│
│ ▸ Deposits & payments — what's safe, what  │
│   NestMate never does                      │ ← PP-08 literacy surface
│ ▸ Contact reveal — how sharing works       │
│ ▸ Reports & blocks — what happens after    │
├────────────────────────────────────────────┤
│ ⚑ Emergency? NestMate can't respond live. │ ← emergency band
│   Police 112 · cybercrime.gov.in           │
├────────────────────────────────────────────┤
│ (   Contact support   )                    │
│  Topic: [What's this about? ▾]             │ ← routed to founder inbox at MVP
│  [ message _______________________ ]       │
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap a topic (or search) | Answer expands inline; search narrows topics as typed | Stay |
| Tap "Send" on the contact form | Ticket created and routed to the monitored support inbox; visible confirmation with what happens next | Stay (confirmation state) |
| Tap the emergency band | Opens the safety center with emergency guidance | NM-026 |
| Tap back | Returns to origin; nothing to save | Origin screen |

### Navigation

```text
ENTRY ← NM-037 · footer · error states
  ↓
NM-039 — Help & Support
  ↓
PRIMARY ACTION → Tap a topic (or search)
  ↓
SYSTEM RESPONSE → Answer expands inline; search narrows topics as typed
  ↓
NEXT SCREEN → Stay
```

Back returns to the entry point (Settings, the public screen whose footer linked here, or the error state that linked here). No bottom nav. Topics open in place — no per-answer routing required.

### States

```text
DEFAULT
↓
FAQ topics + emergency safety band + contact form
↓
Browse topics, open a ticket
↓
Ticket confirmation in place / NM-026 for safety emergencies

LOADING
↓
Topic skeleton (≤300ms perceived)
↓
Wait
↓
Topics render in place

SUCCESS (ticket sent)
↓
Confirmation with the expectation ("we reply on this account")
↓
Keep browsing topics or return
↓
Stays on NM-039 (form resets; topics remain)

ERROR (send fails)
↓
Inline, non-destructive; message text preserved; idempotent retry — no dead end
↓
Retry
↓
Stays on NM-039
```

---

## W-40 — NM-040 — Account Deactivation / Deletion

### Role

All authenticated users

### Purpose

A dignified exit: pause (fully reversible) or leave (with a grace period and honest data-retention facts), with the consequences of each path stated before the user commits.

### Entry

- NM-037 danger zone ("Deactivate or delete account")

### Wireframe

```text
┌────────────────────────────────────────────┐
│ ← Deactivate or delete                     │
├────────────────────────────────────────────┤
│ Two different things:                      │
│ ┌ Deactivate ────────────────────────────┐ │
│ │ Hides your profile + listings, freezes │ │ ← reversible (EC-23):
│ │ connections. Log in again to restore   │ │   login restores EXACT prior state
│ │ everything exactly.                    │ │
│ │ (   Deactivate   )                     │ │
│ └────────────────────────────────────────┘ │
│ ┌ Delete ─────────────────────────────────┐│
│ │ 14-day grace, then: PII erased/        │ │ ← retention summary:
│ │ anonymized, listings removed, messages │ │   messages anonymized, counterparty
│ │ anonymized. This cannot be undone.     │ │   keeps chat minus identity
│ │ (   Request deletion   )               │ │
│ └────────────────────────────────────────┘ │
│ Just tired of being visible?               │ ← alternative path:
│ ( Turn off discovery → NM-038 )            │   lighter exit first
└────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap "Deactivate" → confirm | Account hidden (profile + listings), connections frozen; user logged out; logging in later restores the exact prior state — freshness re-validated, expired listings stay expired (EC-23) | Logged out (reactivation via NM-006) |
| Tap "Request deletion" → confirm | 14-day grace starts; user logged out; logging in during grace cancels the deletion and restores the account | Logged out (grace pending) |
| Complete the reason survey | One-tap reason recorded with the action (product-learning signal, never shown to others) | Completes the chosen path |
| Request deletion during an active safety case | Notice explains the case keeps the data it needs (legal hold); deletion still proceeds after confirm | Notice → confirm → logged out |
| Tap "Turn off discovery" | Opens privacy controls with discovery context | NM-038 |

### Navigation

```text
ENTRY ← NM-037 danger zone
  ↓
NM-040 — Account Deactivation / Deletion
  ↓
PRIMARY ACTION → Tap "Deactivate" → confirm
  ↓
SYSTEM RESPONSE → Account hidden (profile + listings), connections frozen; user logged out; logging in later restores the exact prior state — freshness re-validated, expired listings stay expired (EC-23)
  ↓
NEXT SCREEN → Logged out (reactivation via NM-006)
```

Back returns to NM-037. No bottom nav. After either confirmed path the user is logged out; reactivation is via login (NM-006). After the grace period ends, the signup screen (NM-005) shows the "account deleted" notice — there is no path back to this screen.

### States

```text
DEFAULT
↓
Both paths explained (deactivate vs delete) + retention summary + a "pause instead" alternative
↓
Choose a path, confirm with explicit consequence text
↓
Logged out with a plain statement of what just happened — never a silent logout

PENDING (deletion requested)
↓
On any login attempt during the 14-day grace: days remaining +
[Cancel deletion and restore my account]
↓
Cancel the deletion
↓
Exact account state restored (NM-010/NM-030, EC-23)

RESTRICTED (legal hold)
↓
Pre-confirm notice: an active safety case keeps required data even after deletion
↓
Proceed (or postpone)
↓
Deletion proceeds; the case is unaffected

SUCCESS (either path)
↓
Reason survey → logged out with a plain statement
↓
Return to landing
↓
NM-001 (reactivation for deactivate = simply logging in, EC-23)
```

### Branches

```text
```text
DEACTIVATE → everything hidden; login restores exact state (EC-23) → NM-010/NM-030
DELETE → 14-day grace (pending state)
  ├── LOGIN DURING GRACE → cancel deletion → full restore (EC-23)
  └── GRACE ELAPSES → PII erased, messages anonymized (R-27); counterparties keep
      the chat minus the identity (EC-13) → NM-001
LEGAL HOLD (active safety case) → pre-confirm notice → deletion proceeds, case unaffected
```
```

---

## W-41 — NM-041 — Admin Login

### Role

Admin (internal — founding team only)

### Purpose

Hardened entry to the internal operations console: the only door to every admin screen, locked down because it guards trust decisions over real people.

### Entry

- Direct admin URL, typed or bookmarked — never linked from any public or product surface; excluded from search indexing

### Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│                    NestMate Admin                        │
│                                                          │
│  Email    [ founder@nestmate.in ]                        │
│  Password [ **********        ]                          │
│                                                          │
│  Authenticator code (TOTP)                               │
│          [ 4 8 2 1 0 9  ] ← 2nd factor mandatory (D-13)│
│                                                          │
│  (        Sign in         )                              │
│                                                          │
│  5 failed attempts → 30-min lock (no reset without TOTP) │
└──────────────────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Submit valid email + password + TOTP code | Admin session opens in the separate realm (short, fixed lifetime); the attempt is audit-logged | NM-042 |
| Submit wrong credentials or code | Inline error naming the failing step; attempt count increments | Stay |
| Fail 5 times | 30-minute lock; an internal alert is raised; the lock is audit-logged | Restricted (lock state) |
| Seek password reset without the second factor | Not offered — reset is impossible from this screen | Stay (inert) |

### Navigation

```text
ENTRY ← Direct `/admin` route (never linked)
  ↓
NM-041 — Admin Login
  ↓
PRIMARY ACTION → Submit valid email + password + TOTP code
  ↓
SYSTEM RESPONSE → Admin session opens in the separate realm (short, fixed lifetime); the attempt is audit-logged
  ↓
NEXT SCREEN → NM-042
```

Forward goes to NM-042 only — there is no other destination. Admin sessions time out after a short fixed period; expiry lands back here for re-authentication, then returns the admin to the screen they were on. Deep links into admin screens without a valid session always resolve here.

### States

```text
DEFAULT
↓
Empty credential + TOTP code form (desktop admin realm)
↓
Enter credentials + code, submit
↓
NM-042

LOADING
↓
Submit disabled; entered values retained (≤300ms perceived)
↓
Wait
↓
Result renders in place

ERROR (bad factor)
↓
Inline message naming the failing factor; values preserved; attempt counted
↓
Retry
↓
Stays on NM-041

RESTRICTED (repeated failures)
↓
Lock message with the remaining lock time; sign-in inert until it expires
↓
Wait out the lock
↓
NM-041 after expiry

EXPIRED (session re-auth)
↓
Neutral re-auth prompt (arrived from any admin screen)
↓
Re-authenticate
↓
The prior admin screen reopens after success
```

---

## W-42 — NM-042 — Admin Dashboard

### Role

Admin (internal — founding team only)

### Purpose

Queue-first operations command: the single glance that tells the founder what needs action now, ordered by SLA risk — never a vanity dashboard.

### Entry

- NM-041 success (the console's default landing screen)

### Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│ NestMate Admin            [ founder@nm ] [ Sign out ]    │
├─────────────┬────────────────────────────────────────────┤
│ Queues      │ ⚠ Verification: 4 pending (oldest 26h ⚠SLA)│ ← breach >24h red (D-05)
│ Verifications│ Reports: S1 1 (8h) · S2 2 · S3 3          │ ← S1/S2 SLA 12h
│ Reports     │ Flags: 3 auto · 2 duplicates · 1 reported  │ ← NM-045 sources
│ Flags       │ Users: 1 suspension pending review         │
│ Users       ├────────────────────────────────────────────┤
│ Metrics     │ Health (7d): listings 142 · fresh 68% ·    │ ←  strip
│             │ response 6h · fills 4 · reports 0.7/1k     │
│ Audit tail  ├────────────────────────────────────────────┤
│ (last 20)   │ Recent actions (audit tail) …              │
└─────────────┴────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap the Verifications card | Opens the verification review queue | NM-043 |
| Tap the Flags card | Opens the listing moderation queue | NM-045 |
| Tap the Reports card | Opens the report queue | NM-047 |
| Tap the Users card (or a suspension item) | Opens user management | NM-048 |
| Tap the Metrics rail item | Opens platform metrics (V1 surface) | NM-049 |
| Tap Sign out | Ends the admin session (audited) | NM-041 |

### Navigation

```text
ENTRY ← NM-041
  ↓
NM-042 — Admin Dashboard
  ↓
PRIMARY ACTION → Tap the Verifications card
  ↓
SYSTEM RESPONSE → Opens the verification review queue
  ↓
NEXT SCREEN → NM-043
```

The left rail is persistent on every admin screen and always offers every queue — the admin is never more than one tap from any queue or from this dashboard. No bottom nav (desktop console). Deep links into admin screens require a valid session and resolve through NM-041 otherwise; signing out always lands on NM-041.

### States

```text
DEFAULT
↓
Four queue cards (verification, moderation, reports, users) + SLA health strip + audit tail
↓
Open a queue
↓
NM-043 / NM-045 / NM-047 / NM-048 / NM-049

LOADING
↓
Card skeletons; the rail renders immediately (≤300ms perceived)
↓
Wait
↓
Dashboard renders

EMPTY
↓
Honest "all clear" per queue card (zero pending, no breach) — a zero is a fact, not a blank
↓
Continue other work
↓
Stays on NM-042

ERROR (one queue count fails)
↓
That card shows a retry state; all other cards render normally
↓
Retry the failed card
↓
Stays on NM-042 (never blocks on one failing count)
```

---

## W-43 — NM-043 — Verification Review Queue

### Role

Admin (internal — founding team only)

### Purpose

The queue side of human verification review: every pending T2/T3 case, ordered so the most SLA-at-risk case is always first, with the facts that pace the decision.

### Entry

- NM-042 Verifications card
- NM-042 left rail ("Verifications")
- Return from NM-044 after every decision

### Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│ Verifications   [Age ▾][Tier ▾][Type ▾]     4 pending    │
├──────────────────────────────────────────────────────────┤
│ Applicant      Tier  Doc      Age    Flags     →         │
│ Priya S.       T3    Aadhaar  5h     owner     [Open]    │ ← SLA colour: green <12h,
│ Rohit K.       T2    PAN      9h     —         [Open]    │   amber <24h, red ≥24h
│ Aarav M.       T2    DL       26h ⚠  2nd try   [Open]    │ ← prior rejections count
│ Meera P.       T3    Aadhaar  27h ⚠  owner     [Open]    │
└──────────────────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Click a row (or Open) | Case opens with full evidence and checklist | NM-044 |
| Apply a filter (age / tier / type) | Queue narrows; counts update | Stay |
| Clear filters | Full queue returns, oldest first | Stay |
| Return from a decided case | Row leaves the queue; count decrements | Stay (queue refreshed) |

### Navigation

```text
ENTRY ← NM-042
  ↓
NM-043 — Verification Review Queue
  ↓
PRIMARY ACTION → Click a row (or Open)
  ↓
SYSTEM RESPONSE → Case opens with full evidence and checklist
  ↓
NEXT SCREEN → NM-044
```

Entered from NM-042; every row leads to NM-044; every decision returns here with the row resolved. The left rail allows jumping to any other queue without losing filter state. Browser back from NM-044 restores the same filtered view. No bottom nav (desktop console).

### States

```text
DEFAULT
↓
Table of pending cases, oldest first, with tier, document type, age, flags (SLA colours)
↓
Open a case
↓
NM-044

LOADING
↓
Table skeleton; filters render immediately (≤300ms perceived)
↓
Wait
↓
Queue renders

EMPTY
↓
"All clear — no verifications waiting" + last-reviewed time (a zero is a success state)
↓
Return to the dashboard
↓
NM-042

ERROR (cases fail to load)
↓
Retry message; filters remain usable — no dead end
↓
Retry
↓
Stays on NM-043
```

---

## W-44 — NM-044 — Verification Case Detail

### Role

Admin (internal — founding team only)

### Purpose

Checklist-driven review of one verification case and the decision that ends it: all evidence side-by-side, an explicit checklist, and a reason-mandatory decision panel.

### Entry

- NM-043 row click (the only path to a case)

### Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│ ← Verification #V-2041 · T3 · owner · 5h old   [SLA ok]  │
├──────────────────────────────────────────────────────────┤
│ [Doc: Aadhaar front] [Doc: back] [Selfie] [Bill]         │ ← restricted signed URLs,
│ (zoom, watermark: "NestMate review — do not share")      │   10-min TTL re-fetch
├──────────────────────────────────────────────────────────┤
│ Checklist:                                               │ ← 
│ [x] Name matches profile (Priya S.)                      │
│ [x] Face similar (selfie vs doc)                         │
│ [x] Doc authenticity cues OK                             │
│ [ ] Ownership name+locality match                        │ ← T3 only
│ [ ] No duplicate images in prior verifications           │
├──────────────────────────────────────────────────────────┤
│ Note (mandatory): ______________________                 │
│ [ Approve & grant T3 ] [ Reject (reason ▾) ]             │ ← reason codes 
│ [ Request resubmission (reason ▾) ]                      │
└──────────────────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap Approve (+ note) | Badges granted (B-3 / B-4), profile re-ranked, user notified with the outcome | NM-043 (case resolved) |
| Tap Reject, pick reason (+ note) | User sees the reason + the fix; a second rejection starts a 7-day cooling period with the date shown (EC-07) | NM-043 (case resolved) |
| Tap Request resubmission (+ note) | User is told exactly what to fix; the case re-enters the queue when they resubmit | NM-043 |
| Flag a suspicious pattern | Escalates to the fraud checklist — an enforcement matter, not a normal rejection | NM-047 (fraud path) / NM-048 |
| View an evidence image | Image loads in the watermarked restricted viewer; the view is audit-logged | Stay |

### Navigation

```text
ENTRY ← NM-043
  ↓
NM-044 — Verification Case Detail
  ↓
PRIMARY ACTION → Tap Approve (+ note)
  ↓
SYSTEM RESPONSE → Badges granted (B-3 / B-4), profile re-ranked, user notified with the outcome
  ↓
NEXT SCREEN → NM-043 (case resolved)
```

Entered only from NM-043; after a decision the reviewer returns there and the case is locked. Failed image loads re-fetch on demand without losing checklist state. Browser back mid-review keeps the case open and undecided. Leaving without deciding is allowed — the case stays pending in the queue.

### States

```text
DEFAULT
↓
Evidence (document + selfie + ownership proof) + review checklist + decision panel
↓
Work the checklist, record the decision with a mandatory reason
↓
Decision recorded (audited) → back to NM-043; user notified via NM-024

LOADING
↓
Case skeleton; header facts first (≤300ms perceived)
↓
Wait
↓
Case renders

ERROR (an image fails)
↓
Inline retry on the affected image; checklist state preserved; re-fetch idempotent
↓
Retry the image
↓
Stays on NM-044

RESTRICTED (decision already recorded)
↓
Decision locked after submit — the recorded decision shows read-only (one decision per case)
↓
Return to the queue
↓
NM-043
```

---

## W-45 — NM-045 — Listing Moderation Queue

### Role

Admin (internal — founding team only)

### Purpose

Inventory quality control on the queue side: every listing that pattern-matches a quality problem — auto-flags, duplicates, reports, and a random sample of clean publishes — so none of them skip human eyes.

### Entry

- NM-042 Flags card
- NM-042 left rail ("Flags")

### Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│ Moderation   [Source ▾][Age ▾]              6 open       │
├──────────────────────────────────────────────────────────┤
│ Sources: auto-flags · duplicates (F-037) · reported listings ·  │
│ 10% random sample of publishes (MVP rate)                │
├──────────────────────────────────────────────────────────┤
│ Listing            Reason                 Owner  Age  →  │
│ HSR 2BHK ₹16k      contact info in rules  T3     2h  [Open]│
│ BTM studio ₹6k     price outlier -68%     T3     4h  [Open]│
│ Whitefield 1BHK    duplicate of #L-882    T3     1d  [Open]│
│ Koramangala room   reported (scam)        T2     1d  [Open]│
│ Indiranagar room   sample (random 10%)    T3     2d  [Open]│
└──────────────────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Click a row (or Open) | Case opens with the public rendering and evidence | NM-046 |
| Filter by source or age | Queue narrows; counts update | Stay |
| Open a duplicate's sibling | The linked sibling case opens from the row | NM-046 (sibling case) |
| Return from an actioned case | Row leaves the queue; count decrements | Stay (queue refreshed) |

### Navigation

```text
ENTRY ← NM-042
  ↓
NM-045 — Listing Moderation Queue
  ↓
PRIMARY ACTION → Click a row (or Open)
  ↓
SYSTEM RESPONSE → Case opens with the public rendering and evidence
  ↓
NEXT SCREEN → NM-046
```

Entered from NM-042; every row leads to NM-046; every action returns here with the case resolved. The left rail allows jumping between queues. Browser back from NM-046 restores the same filtered view. No bottom nav (desktop console).

### States

```text
DEFAULT
↓
Source-tagged table (flagged / duplicate / sampled) with filters and legend
↓
Open a case
↓
NM-046

LOADING
↓
Table skeleton; legend renders immediately (≤300ms perceived)
↓
Wait
↓
Queue renders

EMPTY
↓
"No moderation cases open" + legend retained (sampling continues silently)
↓
Return to the dashboard
↓
NM-042

ERROR (cases fail to load)
↓
Retry message; legend + filters remain — no dead end
↓
Retry
↓
Stays on NM-045
```

---

## W-46 — NM-046 — Listing Moderation Detail

### Role

Admin (internal — founding team only)

### Purpose

Review one flagged listing exactly as the public would see it, see the evidence for the flag, and act — with an outcome that explains itself to the owner.

### Entry

- NM-045 row click (the only path to a case)

### Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│ ← Case #M-771 · HSR 2BHK · flagged 2h ago                │
├──────────────────────────────────────────────────────────┤
│ LISTING RENDER (public projection NM-003)                │ ← exactly what seekers see
│ [gallery] ₹16,000 · rules: "call 98•••• 43120" ← evidence│
├──────────────────────────────────────────────────────────┤
│ Flag evidence: pattern=phone-in-rules  match="call 98…"  │ ← which pattern, which text
│ Owner: Priya S. · T3 · prior flags 1 · response ~4h      │
│ History: approved Jun (sample pass)                      │
├──────────────────────────────────────────────────────────┤
│ [ Approve ]  [ Require edit (note → owner) ]             │ ← send back w/ note
│ [ Unlist (reason ▾) ]                                    │ ← hidden, recoverable
│ [ Remove + strike owner ]  ⚠ 3rd strike → review for ban │ ←  escalation
└──────────────────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Tap Approve | Listing becomes active (if it was held pending review); owner notified | NM-045 (case resolved) |
| Tap Require edit (+ note) | Owner sees the note and the fix; the listing stays unlisted until corrected and resubmitted | NM-045 |
| Tap Unlist (reason) | Listing hidden from all search and feeds; owner notified with the reason and the fix | NM-045 |
| Tap Remove + strike owner | Listing removed; a strike is recorded on the owner's visible ladder; a third strike escalates to account-level review | NM-045 |
| Open the owner's account | Full user context for escalation decisions | NM-048 |

### Navigation

```text
ENTRY ← NM-045
  ↓
NM-046 — Listing Moderation Detail
  ↓
PRIMARY ACTION → Tap Approve
  ↓
SYSTEM RESPONSE → Listing becomes active (if it was held pending review); owner notified
  ↓
NEXT SCREEN → NM-045 (case resolved)
```

Entered only from NM-045; every action returns there with the case locked. Browser back mid-review keeps the case open and undecided. The NM-048 jump must offer a return path to this case. No bottom nav (desktop console).

### States

```text
DEFAULT
↓
Public render of the listing + evidence (duplicate text/photos, contact patterns) +
owner context + action set
↓
Act: approve / edit-require (note) / unlist / remove + strike — reason mandatory
↓
Action recorded (audited) → back to NM-045; owner notified with the note

LOADING
↓
Render skeleton; header facts first (≤300ms perceived)
↓
Wait
↓
Case renders

RESTRICTED (outcome already recorded)
↓
Action locked after submit — the recorded outcome shows read-only (one outcome per case)
↓
Return to the queue
↓
NM-045

ERROR (public render fails)
↓
Evidence panel still renders; retry on the listing preview — review never blocked by
the preview alone
↓
Retry the preview / decide on evidence
↓
Stays on NM-046
```

---

## W-47 — NM-047 — Report Queue & Case Management

### Role

Admin (internal — founding team only)

### Purpose

Safety and conduct resolution with severity SLAs and real closure: triage every report by severity, protect people while the case is open, end every case in a recorded disposition, and close the loop with the reporter.

### Entry

- NM-042 Reports card
- NM-042 left rail ("Reports")

### Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│ Reports  [S1 ¹][S2 ²][S3 ³]            SLA: S1/S2 <12h   │
├──────────────────────────────────────────────────────────┤
│ Sev  Reason              Target        Reporters Age  →  │
│ S1   harassment          user Aarav M. 1         8h ⚠[Open]│ ← pile-on signal
│ S2   off-platform paym.  chat #C-441   1         5h  [Open]│
│ S3   fake listing        listing L-913 2         1d  [Open]│
├──────────────────────────────────────────────────────────┤
│ CASE VIEW (per report):                                  │
│ Evidence: screenshots + report text                      │
│ Target context: profile · tier · history · other cases   │
│ Conversation excerpt (chat-scoped, read-only, access     │ ← audited read
│   logged)                                                │
│ ⚫ Auto-protections ON: chat pair frozen · listing unlisted│ ←  toggle
├──────────────────────────────────────────────────────────┤
│ DISPOSITION (reason mandatory, audited):                 │
│ [ Dismiss (unfounded) ] [ Warn user ]                    │
│ [ Unlist content ] [ Remove content ]                    │
│ [ Revoke verification ] [ Suspend 7/30d ] [ Ban ]        │
│ → Reporter closure notice: "action taken" (no details)   │ ← F-059 template
└──────────────────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Open a case | Evidence, context, conversation excerpt (audited) and current protections render | Stay (case view) |
| Toggle auto-protections | Applied or reversed immediately while the case stays open | Stay |
| Record a disposition (+ reason) | Case closes with the action executed; protections resolve consistently — a dismissal unfreezes the pair and re-lists what was wrongly unlisted (EC-27) | NM-047 (queue) |
| Record Ban | Full enforcement cascade: listings unlisted, pipelines closed with notice, chats read-only, sessions revoked (R-24, EC-21) | NM-047 (queue) |
| Confirm the reporter closure | Reporter receives the closure notice — outcome, no other-party details | Part of the disposition |
| Open the target's account | Full user context for escalation or account-level action | NM-048 |

### Navigation

```text
ENTRY ← NM-042
  ↓
NM-047 — Report Queue & Case Management
  ↓
PRIMARY ACTION → Open a case
  ↓
SYSTEM RESPONSE → Evidence, context, conversation excerpt (audited) and current protections render
  ↓
NEXT SCREEN → Stay (case view)
```

Entered from NM-042; the case view is inline (queue → case → queue) so triage stays fast. The left rail allows jumping to other queues; the NM-048 jump must offer a return. Browser back returns to the queue at the same severity tab. No bottom nav (desktop console).

### States

```text
DEFAULT
↓
Severity tabs (S1/S2/S3) + queue with live SLA timers + inline case view per open report
↓
Triage, review evidence, record the disposition with a mandatory note
↓
Disposition recorded (audited) → protections applied or reversed; closure sent

LOADING
↓
Queue skeleton; severity counts first (≤300ms perceived)
↓
Wait
↓
Queue renders

EMPTY
↓
"No open reports — all clear" per severity tab (zero is a fact, not a blank)
↓
Return to the dashboard
↓
NM-042

RESTRICTED (auto-protections active, R-23)
↓
The affected chat renders frozen and the listing unlisted — shown as case state,
not error; reversed cleanly on dismissal (EC-27)
↓
Decide the case
↓
Disposition → protections resolved

ERROR (evidence fails)
↓
Retry on the affected panel; the disposition stays blocked until evidence renders —
never decide blind
↓
Retry the evidence
↓
Stays on NM-047
```

---

## W-48 — NM-048 — User Management

### Role

Admin (internal — founding team only)

### Purpose

Account-level enforcement with full context: find any user, see everything relevant to a decision on one screen, and act with a reason — decisively, reversibly where appropriate, and always traceably.

### Entry

- NM-042 Users card (or a suspension item on it)
- NM-042 left rail ("Users")
- Jump-to-user from case views: NM-044 (fraud escalation), NM-046 (strike escalation), NM-047 (target context)

### Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│ Users  🔍 [phone / email / name / id        ]  [Search]  │
├──────────────────────────────────────────────────────────┤
│ USER 360 — Aarav M. · +91 98•••• ••77                    │
│ Roles: Seeker+Owner · Tier: T2 (since Mar 2026)          │
│ Verification history: approved Mar · resubmit once Feb   │
│ Listings: 1 active · Connections: 12 · Reports: 0/1      │ ← given/received
│ Prior admin actions: 1 warning (May)                     │
├──────────────────────────────────────────────────────────┤
│ ACTIONS (each: reason + confirm, audited):               │
│ [ Warn (email) ]  [ Suspend 7d ] [ Suspend 30d ]         │
│ [ Ban (permanent) ]  [ Reinstate ]                       │
│ [ Force re-verification ]  [ Revoke T3 only ]            │ ← surgical trust downgrade
└──────────────────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Search by phone / email / name / id | Matching users listed; selecting one loads the 360 panel | Stay |
| Suspend 7 / 30 days (+ reason) | Cascade: listings unlisted, chats read-only, sessions revoked; the user sees the status screen with appeal path (EC-20) | Stay (history updated) |
| Ban (+ reason) | Permanent cascade: everything suspension does, pipelines closed with notice, re-registration blocked (EC-21, R-24) | Stay (history updated) |
| Reinstate (+ reason) | Prior state restored where valid; the user regains access | Stay |
| Force re-verification (+ reason) | Badges suspended pending re-review; the user is prompted to re-verify | Stay |
| Revoke T3 only (+ reason) | Listings unlisted; T2 remains intact — a surgical trust downgrade | Stay |

### Navigation

```text
ENTRY ← NM-042
  ↓
NM-048 — User Management
  ↓
PRIMARY ACTION → Search by phone / email / name / id
  ↓
SYSTEM RESPONSE → Matching users listed; selecting one loads the 360 panel
  ↓
NEXT SCREEN → Stay
```

Entered from NM-042 or via jump-to-user from any case view; jumps must offer a return path to the originating case. Search results and the loaded user live on one screen — no intermediate detail page. Browser back exits search cleanly. No bottom nav (desktop console).

### States

```text
DEFAULT
↓
Search field; after search, the user-360 panel (roles, listings, cases, strikes) + actions
↓
Search a user; warn / suspend / ban / reinstate with mandatory reason + confirm
↓
Action recorded (audited) → cascade applies (R-24); user sees a state screen + appeal

LOADING
↓
Panel skeleton; identity facts first (≤300ms perceived)
↓
Wait
↓
Panel renders

EMPTY (no match)
↓
"No user matches" + the exact query echoed + search tips — never blank
↓
Refine the search
↓
Stays on NM-048

RESTRICTED (already suspended/banned)
↓
Current state rendered prominently; actions adjust (no double ban; Reinstate offered);
cascade confirmation required
↓
Reinstate or leave as-is
↓
State updated (audited)

ERROR (action fails)
↓
Inline error; no partial cascade applied; retry idempotent
↓
Retry
↓
Stays on NM-048
```

---

## W-49 — NM-049 — Platform Metrics

### Role

Admin (internal — founding team only)

### Purpose

The weekly marketplace-health digest — is the marketplace working? — built so the founder's weekly decisions and the roadmap read the same numbers. Scheduled for V1: explicitly outside the MVP build scope.

### Entry

- NM-042 left rail ("Metrics" — labeled as a V1 surface)

### Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│ Metrics   [This week ▾]                     [Export CSV] │
├──────────────────────────────────────────────────────────┤
│ ACQUISITION FUNNEL                                       │
│ visits 4.2k → signups 380 (9%) → activated 152 (40%)     │ ← activation = J-A exit criteria
├──────────────────────────────────────────────────────────┤
│ MARKETPLACE HEALTH                           │
│ active listings 142 · freshness share 68%                │
│ median first response 6h · connect→chat 58% · fills 4    │
├──────────────────────────────────────────────────────────┤
│ TRUST                                                    │
│ verifications: T2 96 · T3 74 · reports/1k 0.7 ·          │
│ blocks 18 · SLA compliance 96%                           │
├──────────────────────────────────────────────────────────┤
│ RETENTION                                                │
│ W4 return 31%  · churn reasons (top): "found elsewhere"  │
└──────────────────────────────────────────────────────────┘
```

### User Actions

| User Action | System Response | Next Screen |
|---|---|---|
| Change the date range | All four groups recompute for the range | Stay |
| Tap Export CSV | Download of the current range's aggregates | Stay |
| Return to the dashboard | Via the left rail | NM-042 |

### Navigation

```text
ENTRY ← NM-042 (V1 release)
  ↓
NM-049 — Platform Metrics
  ↓
PRIMARY ACTION → Change the date range
  ↓
SYSTEM RESPONSE → All four groups recompute for the range
  ↓
NEXT SCREEN → Stay
```

Entered only from the NM-042 rail; no other screen links here and it links only back. No bottom nav (desktop console). During MVP the rail item renders with its V1 label and the screen itself is absent — the label is honest, never a dead link.

### States

```text
DEFAULT
↓
Four metric groups (marketplace health, trust, freshness, ops) for the selected range
↓
Change the range; export
↓
Stays on NM-049 (export downloads)

LOADING
↓
Tile skeletons; the range picker is active immediately (≤300ms perceived)
↓
Wait
↓
Metrics render

EMPTY (thin data)
↓
Metrics render with explicit small-sample warnings — no fake precision (R-30)
↓
Read with the warnings in mind
↓
Stays on NM-049

DISABLED (MVP release)
↓
Screen not built at MVP; the rail item is labelled V1 — no dead link
↓
Return to the dashboard
↓
NM-042
```

---

# 04 — COMPLETE END-TO-END JOURNEY MAPS

The approved journeys of the product, end to end, with their branches. Every arrow is a transition owned by a screen in Section 03; every branch reconnects to a valid screen — no dead ends.

## 4.1 Public discovery (guest)

```text
START (guest)
 ↓
NM-001 Landing
 ↓
NM-002 Room Search (public)
 ↓
NM-003 Room Detail (masked)
 ↓
Decision: ready to act?
 ├── Connect/Save → AUTH WALL (C-07, action carried EC-05) → NM-005
 ├── Trust pointer → NM-004 Trust & Safety Center → NM-005 or back
 ├── Guest report on a listing → NM-004 → report form (listing pre-carried) → NM-027
 └── Not ready → back to NM-002 (filters/scroll preserved)
 ↓
OUTCOME: honest supply judged → signup (NM-005) or leaves informed
```

## 4.2 Authentication

```text
START
 ↓
NM-005 Signup (or NM-006 Login for returning users)
 ↓
NM-007 OTP Verification
 ↓
Decision: code correct?
 ├── Success → T0 granted → new user → NM-008
 ├── Wrong ×5 → 30-min lock (EC-03) → support link → NM-039
 ├── Expired → resend (60s cooldown) → NM-007 retry
 └── Cancel/abandon → guest state preserved → origin screen still reachable
 ↓
NM-008 Role & Intent Selection
 ├── "I'm looking" → NM-009
 ├── "I have a room" → NM-029
 ├── "Both" → NM-009 (owner mode added later via NM-037 → NM-008)
 ├── Skip → NM-010 (seeker defaults; carried context executes — EC-05)
 └── Existing number at signup → NM-006 prefilled (EC-02, never an error wall)
 ↓
OUTCOME: T0 account + role → role wizard; original auth-wall action auto-executes (EC-05)
```

## 4.3 Seeker onboarding

```text
START: NM-008 ("I'm looking")
 ↓
NM-009 Seeker Onboarding Wizard (6 steps: basics → location → budget → move-in
 ↓        → 10 lifestyle attributes → must-haves vs nice-to-haves)
Decision: completed?
 ├── Final CTA "Find my match" → T1 complete (B-2) → NM-010 with matches live
 ├── Save & exit mid-wizard → draft kept → resume banner on NM-010 → NM-009 at exact step (EC-01)
 ├── App killed → same resume path (EC-01) — nothing re-asked
 ├── Validation error → inline fix, nothing cleared (EC-16) → NM-009 continues
 └── Optional verify prompt → NM-019 (non-blocking) or straight to NM-010
 ↓
OUTCOME: complete matchable profile → NM-010 personalized immediately
Later edits: NM-017 profile / NM-018 preferences → matches recompute ≤60s (R-15)
Privacy: NM-038 controls → NM-028 preview ("see me as others do")
```

## 4.4 Discovery (rooms)

```text
START: NM-010 Home → Search tab
 ↓
NM-011 Room Search (authenticated; Freshest default sort)
 ↓ Decision: filters?
 ├── Advanced filters → NM-013 (dealbreakers, live count) → Apply → NM-011 re-ranked
 └── card tap ↓
NM-012 Room Detail (facts · owner trust · occupant fit · freshness)
 ↓
Decision: act on the room?
 ├── Save → NM-016 Saved Items (state revalidated on every open)
 ├── Connect → intro-note sheet (C-03) → request sent → NM-021 Sent (pending)
 ├── Pass → back to NM-011 (filters, sort, scroll intact)
 └── Listing unavailable (expired/paused/filled/removed) → state banner +
     similar rooms (EC-12) — never a 404
 ↓
OUTCOME: saved, connected, or honestly re-directed to live supply
Zero results: named cause + fix (no supply → waitlist/widen · narrow filter → one-tap
relax · must-haves exclude all → review must-haves → NM-018) (EC-14)
```

## 4.5 Flatmate discovery

```text
START: NM-010 Home → Flatmates tab
 ↓
NM-014 Flatmate Discovery (must-have chips bind BEFORE ranking — R-13)
 ↓        (no swipe mechanic; low matches shown and labelled — R-12)
 ↓ card tap
NM-015 Flatmate Profile Detail (full breakdown: both values + score drivers)
 ↓
Decision: act on the candidate?
 ├── Connect → intro-note sheet (C-03) → NM-021 Sent (pending) → 4.6
 ├── Save → NM-016 (flatmate tab)
 ├── Pass → back to NM-014 (no penalty; candidate may reappear)
 └── Candidate declined you / blocked / opted out → suppressed from feed (EC-08, R-19)
 ↓
OUTCOME: pair connected → chat (NM-023) → pair flat-hunts together (→ 4.4)
Incomplete profile → banner routes to NM-009/NM-017 first
```

## 4.6 Connections

```text
START: Connect sent (C-03) or request received
 ↓
NM-021 Connections (Sent / Received tabs, 14-day TTL shown)
 ↓
Decision: response of the receiver?
 ├── Accept → NM-023 Chat Thread opens with the anchor context → 4.7
 ├── Decline → SILENT to sender (R-19) · sender re-request blocked 90 days (EC-08)
 ├── No response in 14 days → request expires, labelled in NM-021 (R-18) — no penalty
 └── Sender withdraws while pending → removed from both sides
 ↓
OUTCOME: conversation starts, or the request ends honestly (declined/expired/withdrawn)
Every state change notifies via NM-024 (in-app + email for time-sensitive events)
```

## 4.7 Chat & contact consent

```text
START: NM-021 accept (or NM-022 Chat List row, or NM-024 deep link)
 ↓
NM-022 Chat List ──row tap──► NM-023 Chat Thread (context anchor header)
 ↓
Messaging: phones/emails/URLs masked both sides (R-16) · payment patterns raise
the "no payments on NestMate" card (R-20) · first meet-mention → meet-safe card
 ↓
Decision: "Share phone number" → C-04 consent card (number only, this person only)
 ├── BOTH consent → numbers revealed once in-thread + pre-meet safety card
 │   → off-platform meeting (by design) → outcome feeds owner lane
 ├── Declined → CTA sleeps 7 days, chat continues normally (EC-19)
 ├── Simultaneous requests → one deduped consent flow (EC-18)
 ├── Report/Block (⋯) → NM-027 → protections (→ 4.12)
 ├── Safety case open → thread frozen read-only (R-23) until resolved
 └── Counterparty deleted → thread read-only "Deleted account" (EC-13)
 ↓
OUTCOME: mutual-consent reveal → real-world meeting; platform steps out gracefully
```

## 4.8 Trust / verification

```text
START: "Verify ID" on NM-017 · trust card on NM-010 · owner gate (NM-029/NM-031)
 ↓
NM-019 Verification Submission (consent → document → live selfie → [owner] proof)
 ↓        (upload failure: named cause + retry, nothing lost — EC-06)
 ↓
NM-020 Verification Status (Submitted → In review, SLA <24h shown)
 ↓
Decision: admin verdict (NM-043/NM-044)?
 ├── Approved → badges B-3/B-4 everywhere (C-06) + trust-weighted re-ranking
 │   → owners unlock the publish gate (NM-031)
 ├── Rejected (1st) → reason + concrete fix → resubmit → NM-019
 ├── Rejected (2nd) → 7-day cooling, exact date shown (EC-07) → support via NM-039
 ├── suspected_fraud → escalated, resubmission disabled (restricted)
 └── SLA breach >24h → apology banner + auto-priority (EC-04)
 ↓
OUTCOME: visible trust (badges + ranking) or an honest, fixable rejection path
Badge expiry at 12 months → re-verify prompt (NM-020 → NM-019)
```

## 4.9 Owner journey

```text
START: NM-008 "I have a room to offer"
 ↓
NM-029 Owner Onboarding Wizard (type · property · expectations · verification explainer)
 ↓
NM-019 → NM-020 Verification (T2 + T3 ownership proof) — blocked path renders as
 ↓        the T3 interstitial, never an error (R-02)
NM-031 Listing Creation Wizard (6 steps; duplicate check pre-publish — EC-11)
 ↓
Publish → auto-checks ──flag──► admin review (NM-045/NM-046) → approve / edit / unlist
 ↓ pass
NM-030 Owner Dashboard (Active: views · saves · connects · response rate)
 ↓
NM-034 Applicant Pipeline (New → Shortlisted → Chatting → Met → Selected)
 ↓ card tap
NM-035 Applicant Detail & Compare (≤3 side-by-side) · NM-023 chats with applicants
 ↓
Decision: SELECT one applicant → confirm sheet
 ├── Confirm → FILL CASCADE (one transaction, R-09): NM-033 → Filled · hidden from
 │   every search surface · non-selected politely closed · NM-016 rows show "Filled"
 ├── Keep evaluating → NM-034/NM-035 continue · or chat via NM-023
 └── Applicant withdraws / is declined → collapsed terminal state (EC-08)
 ↓
OUTCOME: room filled honestly everywhere; response-rate reputation updated (B-5)
```

## 4.10 Listing lifecycle

```text
NM-031 draft (Save draft — resume banner on NM-030, EC-01)
 ↓
Publish (T3 gate) → PENDING (auto-checks; flag → human review)
 ↓
ACTIVE ── visible on NM-002 · NM-011 · NM-016 with freshness stamp (R-06)
 ↓
Decision: owner action over time?
 ├── Day-27 nudge → one-tap RENEW (+30 days, stamp resets — never a re-boost)
 ├── Day-30 no renewal → EXPIRED: hidden from all search instantly (R-05);
 │   owner: Renew path · seeker: state banner + similar rooms (EC-12)
 ├── Day-45 no confirmation → AUTO-PAUSED: revive = explicit confirm + photo re-check
 ├── PAUSE (owner) → invisible to search, URL and state preserved (EC-12) → Resume
 ├── MARK FILLED → fill cascade (R-09) → closed everywhere → FILLED (terminal-good)
 └── REMOVE (owner reason / moderation) → REMOVED — appeal path via NM-033
 ↓
OUTCOME: every visible listing demonstrably fresh; no ghost inventory anywhere
```

## 4.11 Notifications & returning user

```text
START: NM-006 Login (or restored session)
 ↓
NM-010 / NM-030 — mode remembered; last search, saved items (freshness revalidated),
unread badges, new matches restored — never re-onboarded (EC-01)
 ↓
NM-024 Notifications Center
 ↓
Deep link → the exact object in its current state:
 ├── Connection event → NM-021 row
 ├── Message → NM-023 thread
 ├── Verification decision → NM-020
 ├── Listing event → NM-033 (owner) / NM-012 (seeker)
 └── Object expired/filled/removed → state banner + nearest healthy screen (EC-12)
 ↓
Stale preferences? move-in passed → re-confirm banner → NM-018 → matches recompute (EC-24)
 ↓
OUTCOME: user resumes exactly where the product left them — no dead links, no staleness
Channel control: NM-025 (safety/account notices cannot be disabled — R-29)
```

## 4.12 Safety — report, block, enforcement, resolution

```text
START: ⋯ Report/Block on any profile, listing, chat bubble, or thread (or NM-026)
 ↓
NM-027 Report / Block Flow (reason taxonomy → optional evidence → block default ON)
 ↓
Immediate protections: mutual invisibility (R-19) · report visible to admins in seconds
 ├── Duplicate report → "already under review" + reference (EC-09)
 └── S1/S2 case open → auto-protections: chat pair frozen · listing unlisted (R-23)
 ↓
NM-047 admin triage (S1/S2 <12h · S3 <48h) → disposition:
warn / content removed / unlist / verification revoked / suspend / ban (NM-048 cascade)
 ├── Dismissed → protections reverse cleanly (EC-27) → reporter informed
 └── Upheld → enforcement cascade complete (R-24): listings unlisted, chats read-only,
     sessions revoked — no zombie states
 ↓
OUTCOME: closure notification to the reporter (outcome class, never other-party
details) via NM-024 + email · NM-026 remains the standing guidance surface
```

## 4.13 Account — roles, privacy, help, exit

```text
START: NM-037 Settings (Profile tab or overflow)
 ↓
Decision: what does the user need?
 ├── Add role → NM-008 upgrade path (no re-signup) → NM-009/NM-029 for the new role
 │   · "Both" users get the mode chip: Seeking ⇄ Offering (state never lost, EC-25)
 ├── Privacy → NM-038 controls (blur · masking · discovery opt-out) → NM-028 live preview
 ├── Notifications → NM-025 per-event × per-channel matrix (locked rows explained)
 ├── Help → NM-039 FAQ + tickets (also the appeal path for enforcement states)
 └── Exit → NM-040
      ├── DEACTIVATE → everything hidden; login restores exact state (EC-23)
      └── DELETE → 14-day grace (login cancels) → PII erased, messages anonymized;
          counterparties keep the chat minus the identity (EC-13, R-27)
 ↓
OUTCOME: the account evolves or exits on the user's terms — without stranding others
```

## 4.14 Admin console (internal — never publicly linked)

```text
START: NM-041 Admin Login (password + TOTP; lockout on repeated failure)
 ↓
NM-042 Admin Dashboard (queue cards + SLA health + audit tail)
 ├── → NM-043 Verification Queue → NM-044 Case Detail → checklist decision
 │      (approve / reject with reason / resubmission required — audited, D-05)
 ├── → NM-045 Moderation Queue → NM-046 Case Detail → approve / edit-require /
 │      unlist / remove + strike (owner notified with the note)
 ├── → NM-047 Report Queue → case → disposition (SLA S1/S2 <12h, S3 <48h)
 ├── → NM-048 User Management → user-360 → warn / suspend / ban / reinstate
 └── → NM-049 Platform Metrics (weekly health digest — V1)
 ↓
OUTCOME: every queue reaches a recorded, audited disposition; users see honest
state screens + appeal paths (NM-039); zero is rendered as "all clear", never blank
```

---

# 05 — CROSS-SCREEN CONTINUITY

The same user state must render identically on every screen that touches it. These are the continuity chains that must hold simultaneously — verified across the screens below.

```text
PROFILE → PREFERENCES → MATCHING → DISCOVERY → MATCH EXPLANATION
  NM-017 → NM-018 → recompute ≤60s (R-15) → NM-011/NM-014 → NM-012/NM-015 score + drivers
  Rule: an edit anywhere upstream refreshes every score-bearing surface from the same
  recompute; while stale, screens show the honest "matches updating" banner — never
  silent staleness, never fake immediacy.

VERIFICATION → PROFILE → LISTING → TRUST BADGE → DISCOVERY
  NM-019/NM-020 → NM-017/NM-028 → NM-031/NM-033 (T3 gate) → badges B-1…B-5 (C-06) →
  NM-002/NM-003/NM-011/NM-012/NM-014/NM-015
  Rule: a badge is global and instantaneous — granted, dated, revoked, or expired,
  it changes on every surface in the same session. Revocation removes it everywhere
  immediately; absence renders nothing (no "unverified" scarlet letter).

LISTING → SEARCH → DETAIL → SAVED → APPLICATIONS/PIPELINE → NOTIFICATIONS
  NM-031/NM-033 state → NM-002/NM-011 → NM-003/NM-012 → NM-016 → NM-034/NM-035 → NM-024
  Rule: one listing state machine (Draft/Pending/Active/Expiring/Expired/Auto-paused/
  Paused/Filled/Removed) is the system of record; every surface renders the same state
  chip. Expired/filled/paused listings never render as live anywhere; stale deep links
  resolve to the state banner + similar rooms (EC-12) — never a 404, never silence.

CONNECTION → CHAT → CONSENT → CONTACT REVEAL
  NM-021 → NM-023 (anchor text identical on sheet, NM-021 row, chat header) →
  C-04 consent → numbers once in-thread → pre-meet safety card
  Rule: the connect context survives into the chat header untouched; masking holds
  until BOTH consent; the reveal happens exactly once and is logged; a decline sleeps
  the CTA 7 days while chat continues (EC-19).

PREFERENCES (MUST-HAVES) → FEED COMPOSITION
  NM-018/NM-009 must-haves → NM-014 feed · NM-011 ranking
  Rule: must-haves bind before ranking (R-13) — the feed can never contain a candidate
  who fails a binding must-have, and preferences only ever shape the score.

BLOCK / RESTRICTION → EVERY SURFACE
  NM-027 block → NM-014 feed · NM-011 results · NM-021 requests · NM-022/NM-023 chat
  Rule: a blocked pair is mutually invisible everywhere — masked rows in chat lists,
  no traces in feeds or results, counts never inflated. Suspension/ban cascades fully
  (listings unlisted, applicants closed, chats read-only, sessions revoked — R-24).

ACCOUNT / MODE → PRODUCT SHELL
  NM-037/NM-040 state → NM-008 role → NM-010/NM-030 shell + mode chip
  Rule: the mode in force decides the home, the bottom nav, and the default surfaces;
  switching never loses drafts, chat position, or route memory (EC-25); deactivated
  accounts restore exactly on login (EC-23).
```

**Consistency spot-checks (must all be true at once):**
1. A T2-verified user shows the same ID badge with the same date on NM-014 cards, NM-015, NM-023 header, and NM-034/NM-035 pipeline cards.
2. A paused listing renders identically (state + no connect) on NM-002, NM-011, NM-003/NM-012, NM-016, and the owner's NM-032/NM-033.
3. An accepted connection opens the *same* chat from NM-021, NM-022, NM-012 "Open chat", and the NM-024 notification.
4. A declined connection hides that counterparty from NM-014 for 90 days for the decliner — the sender's own feed is unaffected (state is directional, EC-08).
5. A user who turns discovery off (NM-038) disappears from NM-014 immediately, keeps pending requests, and stays reachable via the marked saved row in NM-016.
6. Privacy controls set in NM-038 govern every rendering of the user — NM-028 is the provably-faithful preview of exactly that projection.

---

# 06 — FINAL 49-SCREEN FLOW MAP

One map, all 49 screens, zero omissions. Read any lane top to bottom: ENTRY → SCREEN → ACTION → RESPONSE → NEXT SCREEN → BRANCH → OUTCOME. Rails apply from every screen.

```text
=====================================================================
 ENTRY LANE — guest judges real supply before commitment
=====================================================================
NM-001 Landing ──find a room──► NM-002 Public Search ──card──► NM-003 Masked Detail
   │ "I have a room"                │ any gated tap: AUTH WALL      │
   │                                ▼ (action carried, EC-05)      │ trust pointer
   │                             NM-005 Signup                     ▼
   │                                │                          NM-004 Trust &
   │                                ▼                          Safety Center (public)
   │                             NM-007 OTP ──T0──► NM-008 Role?
   │                                │                  │
   └── NM-006 Login ◄── returning ───┘                  │ (guest report: NM-004 →
                                                      ▼  report form → NM-027)
=====================================================================
 SEEKER LANE — NM-008 "I'm looking" / "Both"
=====================================================================
NM-009 Seeker Wizard (6 steps, resumable EC-01)
   │ "Find my match" → T1                    optional verify → NM-019
   ▼
NM-010 Seeker Home ◄──────── login default ────────────────┐
   ├── rails: NM-011 · NM-014 · NM-016 · NM-021 · NM-024   │
   │                                                       │
NM-011 Room Search ──advanced──► NM-013 Filters ──apply──► NM-011 (re-ranked)
   │ card                                                   │
   ▼                                                         │
NM-012 Room Detail ──save──► NM-016 Saved ──connect──► C-03 sheet
   │ facts · trust · fit                                     │ send
   │ owner card → NM-017-view? no → owner trust block        ▼
   ▼                                                    NM-021 Connections
NM-014 Flatmate Discovery ──card──► NM-015 Flatmate Profile   │ pending 14d
   │ must-haves bind first              │ score + drivers     │ accept
   │                                    └── connect ─────────►│  │ decline: silent 90d
   ▼                                                          ▼  │ expire: labelled
NM-017 My Profile ──preferences──► NM-018 Preferences    NM-023 Chat Thread
   │ edit → recompute ≤60s               │ must-haves      │ masked · anchor
   ▼                                     ▼                 │ "Share phone number"
NM-028 Public Preview ◄── NM-038 privacy controls          │ → C-04 consent card
                                           │               │   ├ both → REVEAL once
                                           └──────────────►│   │  + pre-meet card
                                                           │   └ no → CTA sleeps 7d
                                                           ▼
                                                MEETING off-platform → outcome
 CHAT INDEX: NM-022 Chat List (nav Chats tab · unread badges) ──row──► NM-023
=====================================================================
 OWNER LANE — NM-008 "I have a room"
=====================================================================
NM-029 Owner Wizard (4 steps) ──► NM-019 Verification (T2+T3) ──► NM-020 Status
   │ save & exit → resume banner      │ consent · doc · selfie        │ <24h SLA
   ▼                                  │                               │ approved → B-3/B-4
NM-030 Owner Dashboard ◄── login default                              │ rejected → fix
   │ "Publish your first room" / New                                  ▼
   ▼                                                            NM-031 Listing Wizard
NM-032 Listings Management ──row──► NM-033 Listing Detail (Owner)   │ 6 steps · T3 gate
   │ renew · pause · revive · remove    │ edit · analytics           │ duplicate check
   │        ▲                            │ Mark Filled                ▼ publish
   │        └── state chips (R-05) ──────┘      ▲                 Pending auto-checks
   │                                            │                  │ pass → ACTIVE
NM-034 Applicant Pipeline ◄── accepted connects ─────────────────────┘
   │ New → Shortlisted → Chatting → Met → Selected                 flag → NM-045/046
   │ card ▼                                                        review
NM-035 Applicant Detail & Compare (≤3) ──open chat──► NM-023
   │ SELECT → confirm sheet
   ▼
FILL CASCADE (R-09): NM-033 Filled · hidden everywhere · others closed politely
                                              · NM-016 rows show "Filled"
NM-036 Owner Profile (edit) ──verify card──► NM-019 · response tier B-5
=====================================================================
 SHARED RAILS — trust, notifications, safety, account (all roles)
=====================================================================
 TRUST:   NM-017/NM-030 verify CTA → NM-019 → NM-020 → badges everywhere (C-06)
 NOTIF:   NM-024 Notifications Center ──deep link──► NM-021 / NM-023 / NM-020 /
          NM-033 (owner) / NM-012 (seeker) · expired object → state banner (EC-12)
          NM-025 Notification Settings (event × channel; locked rows explained)
 SAFETY:  NM-026 Safety Center ──report──► NM-027 (reason → evidence → block ON)
          → mutual invisibility · protections while open (R-23)
          → NM-047 triage (S1/S2 <12h) → disposition → closure via NM-024
 ACCOUNT: NM-037 Settings ──► roles → NM-008 · NM-025 · NM-038 privacy → NM-028
          · NM-039 Help & Support (appeal path) · NM-040 Deactivate / Delete
          (deactivate reversible EC-23 · delete 14-day grace → PII erased)
=====================================================================
 ADMIN CONSOLE — internal, desktop, never linked (founding team)
=====================================================================
NM-041 Admin Login (password + TOTP)
   ▼
NM-042 Admin Dashboard (queue cards · SLA health · audit tail)
   ├─► NM-043 Verification Queue ──case──► NM-044 Checklist Decision
   ├─► NM-045 Moderation Queue ───case──► NM-046 Moderation Decision
   ├─► NM-047 Report Queue & Cases ──► disposition (audited, reason mandatory)
   ├─► NM-048 User Management ──► warn / suspend / ban / reinstate (cascade R-24)
   └─► NM-049 Platform Metrics (weekly digest — V1)
=====================================================================
 COUNT: 49 screens — NM-001…NM-049, each appearing exactly once above.
=====================================================================
```

**Trace check:** entry (NM-001) → auth (NM-005…008) → seeker spine (NM-009…018) → trust & social spine (NM-019…023, NM-028) → notifications & safety (NM-024…027) → owner spine (NM-029…036) → account (NM-037…040) → admin (NM-041…049). Every arrow is owned by a screen spec in Section 03; every branch reconnects to a valid screen.

---

*NESTMATE — COMPLETE END-TO-END SCREEN-BY-SCREEN WIREFRAME · v1.0 — Locked. No screen skipped. No major action undefined. No dead-end flow.*
