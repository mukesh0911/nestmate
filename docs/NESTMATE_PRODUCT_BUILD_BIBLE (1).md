# NESTMATE — PRODUCT BUILD BIBLE

> **SUPERSEDED (v1).** This is version 1.0, kept for record. The current single source of truth is **NESTMATE_COMPLETE_PRODUCT_BUILD_BIBLE.md (v2.0 Final)** — area-prefixed screen IDs (PUB-01…ADM-09), 12-part screen specs, 13 end-to-end flows, and the OPEN DECISIONS register. Use v2 for all build work.

**Version:** 1.0 · **Status:** Approved product definition — single source of truth for the build phase
**Audience:** Developers, product designers, Claude Code / Cursor / any AI coding agent
**Scope:** The target product build experience — every screen, flow, state, and rule, in build order.
**Out of scope (by design):** market research, visual design systems, database schemas, API specifications, backend architecture, code audits. This document defines WHAT the product does and HOW it flows — not how the servers are built.

**How to read this document**

| If you are a… | Read this way |
|---|---|
| Non-technical reader | Sections 01–04 give you the whole product shape. Section 17 is the one-page map of everything. |
| Developer | Sections 05 (screen specs), 08–12 (navigation, components, states, rules) are your build contract. Section 14 is your build order. |
| AI coding agent | Build strictly in Section 14 phase order. Each phase names its screens (Section 05) and exit tests (Sections 15–16). Never guess flow — every arrow is defined here. |

**Terminology used throughout**

| Term | Meaning |
|---|---|
| S01…S49 | Screen IDs in build/journey order (S-number = NM-number − 1; e.g. S07 = NM-007). Every screen has exactly one spec in Section 05. |
| Seeker / Owner | The two user roles. "Both" users hold both roles and switch modes (Seeking ⇄ Offering). |
| T0…T3 | Verification tiers: T0 phone verified (auto) · T1 complete profile · T2 ID + selfie (human-reviewed) · T3 T2 + room-ownership proof (owners only). |
| B-1…B-5 | Trust badges: Phone verified · Profile complete · ID verified · Owner verified · Top responder. |
| Freshness stamp | "Confirmed Xd ago" — time since the owner last confirmed the listing is still available. |
| Connect | A consent-gated introduction request (never an anonymous "swipe"), always anchored to a room or a profile, optionally with an intro note. |
| Contact reveal | The only way phone numbers are exchanged: mutual in-chat consent, then numbers appear once in the thread. |
| Admin | The founding team's operations console (verification, moderation, reports, users). Internal — never linked from the public product. |

---

# SECTION 01 — VERY SHORT PRODUCT SUMMARY

**What NestMate is.** A mobile-first web app (PWA) for finding rooms, flatmates, and flats-to-share in Bangalore — built on verified people, explained compatibility, and fresh listings. Free at launch. English only. One city only (Bangalore). No payments ever pass through the platform.

**Who it is for.**
- **Seekers** — people moving to (or within) Bangalore who need a room or a flatmate: young professionals (primary), students, and new arrivals who don't know the city.
- **Owners** — people with a room to offer: live-in owners with a spare room (owner-flatmates) and landlords/managers renting per-room in shared flats.

**The core problem.** Today's options (broker networks, listing sites, WhatsApp/Facebook groups) force people to make their most expensive personal decision with zero trust: fake and stale listings, spam and broker calls, phone numbers exposed to strangers, deposit scams, and lifestyle surprises discovered only after moving in. Owners get an unstructured flood of dead-end enquiries instead of a manageable pipeline.

**The main user outcome.**
- A seeker creates a verified profile once, sees only fresh rooms and ranked candidate flatmates with an honest "why this match" explanation, connects safely inside the app, chats without exposing their number until both sides agree, and meets a real person at a real room.
- An owner verifies identity and room control once, publishes in a guided flow, and manages applicants through a structured pipeline (New → Shortlisted → Chatting → Met → Selected) instead of an inbox.

**How the product keeps that promise (six pillars — every screen serves at least one):**
1. **Graduated verification (T0→T3)** — trust is earned in steps; publishing a listing requires T3.
2. **Explained compatibility** — a transparent 0–100 score from 10 lifestyle attributes; every score shows its drivers; low scores are shown honestly, never hidden.
3. **Listing freshness** — 30-day expiry, one-tap renewal, auto-pause after 45 days of silence, and a "confirmed Xd ago" stamp on every listing surface.
4. **Contact privacy** — numbers are masked everywhere; reveal happens only by mutual consent inside chat.
5. **Owners as first-class users** — a guided publishing wizard, an applicant pipeline, and a visible response-rate reputation.
6. **Safety with teeth** — one-tap structured reporting, block, admin SLAs (safety reports resolved <12h), and automatic protections while cases are open.

**Hard scope lines for the build:** no paid tier in MVP · Bangalore only (city selector locked) · English only · PWA, not native apps · no map view · no machine-learning matching · no background-check purchases · no payment processing. Anything outside these lines is a future-version decision, not an MVP build task.

---

# SECTION 02 — BUILD STRUCTURE

The product is one journey system with two primary user journeys (Seeker, Owner) and three supporting journeys (Returning user, Trust/Verification, Safety) that cut across both. Every screen in Section 05 belongs to at least one sequence below; no screen exists outside these flows.

## 2.1 The master journey (spine of the product)

```text
Entry (landing / shared link)
  ↓
Public browse (judge supply before commitment)
  ↓
Authentication (phone → OTP → role)
  ↓
Onboarding (role-specific wizard: profile → preferences / property)
  ↓
Verified profile (T0 → T1; T2 voluntary; T3 for owners)
  ↓
Discovery (rooms by freshness+fit · flatmates by explained compatibility)
  ↓
Decision (detail + compatibility + trust signals → save or connect)
  ↓
Connection (intro note → pending → accept/decline)
  ↓
Communication (context-anchored in-app chat)
  ↓
Consent (mutual contact reveal → phone numbers, once, in-thread)
  ↓
Real-world interaction (meet / visit — guided by safety cards, off-platform by design)
  ↓
Final outcome (room Filled; listing closed everywhere; seekers keep searching or pair up)
```

## 2.2 Journey: New Seeker (core acquisition)

```text
S01 Landing → S02 Room Search (public) → S03 Room Detail (masked)
  → [Connect taps auth wall] → S05 Signup → S07 OTP → S08 Role ("I'm looking")
  → S09 Seeker Onboarding Wizard (6 steps, resumable)
  → S10 Seeker Home (matches visible immediately)
  → S11 Room Search / S14 Flatmate Discovery (parallel discovery loops)
  → S12 Room Detail / S15 Flatmate Profile (decision surfaces)
  → Connect (intro-note sheet) → S21 Connections (pending)
  → accepted → S23 Chat Thread → contact reveal (mutual consent)
  → off-platform meeting → owner marks room Filled (S33) → outcome
```

## 2.3 Journey: New Owner (supply side)

```text
S01 Landing → S05 Signup → S07 OTP → S08 Role ("I have a room")
  → S29 Owner Onboarding Wizard (type → property → expectations → verification explainer)
  → S19 Verification Submission (ID + selfie + ownership proof — T3)
  → S20 Verification Status (in review, <24h SLA) → approved (badges granted)
  → S31 Listing Creation Wizard (6 steps → Publish)
  → S30 Owner Dashboard (listing Active; analytics live)
  → S34 Applicant Pipeline (New → Shortlisted → Chatting → Met → Selected)
  → S35 Applicant Detail (evaluate, compare ≤3)
  → Select → S33 Mark Filled (listing closes everywhere, other applicants politely closed)
```

## 2.4 Journey: Returning User (retention loop)

```text
S06 Login (OTP) → S10 Seeker Home / S30 Owner Dashboard (continue where left)
  → S24 Notifications → deep link into S21 / S23 / S34
  → stale preferences? re-confirm banner (move-in passed) → S18 Preferences → matches recompute
  → S16 Saved Items (freshness revalidated on open)
```

## 2.5 Journey: Trust / Verification (all roles)

```text
Trigger: voluntary (badge boost) OR gate (owner publish)
  → S19 Verification Submission (consent → document → live selfie → [owner] ownership proof)
  → S20 Verification Status (Submitted → In review → decision)
  → approved: badges granted, profile re-ranked with trust weight
  → rejected: reason + fix → resubmit (second rejection → 7-day cooling)
  → [admin side: S42 → S43 queue → S44 case → decision, <24h]
```

## 2.6 Journey: Safety (report / block / resolution)

```text
Concern spotted on any profile / card / chat / listing (overflow menu)
  → S27 Report / Block Flow (reason → evidence → block option)
  → immediate protections (block severs contact; safety-class cases auto-freeze chat pair / unlist listing)
  → S26 Safety Center (guidance, expectations)
  → [admin: S47 queue by severity → case → disposition → reporter notified of outcome]
```

## 2.7 Journey: Account Lifecycle (secondary)

```text
S37 Settings → roles (add Owner/Seeker without re-signup) → S25 Notification Settings
  → S38 Privacy & Visibility → S28 Profile Public Preview ("see me as others do")
  → S39 Help & Support → S40 Deactivate (reversible) or Delete (14-day grace)
```

**Build principle:** these journeys are the product. Any screen that cannot be placed on one of them does not get built. Any arrow that is not defined in Section 04/05 does not get wired.


---

# SECTION 03 — COMPLETE SCREEN INVENTORY

Complete product coverage: 49 screens. Role codes: PUB public (guest) · SRK seeker · OWN owner · ALL any authenticated user · ADM admin (internal console). The "Comes from / Goes next" columns list the most frequent paths — the full branch map is Section 04; per-screen detail is Section 05.

**ID rule:** S-number and NM-number are the same screen (S01 = NM-001 … S49 = NM-049). Use S-IDs in all build tasks, tickets, and tests; NM-IDs are kept for traceability to the blueprint package.

## 3.1 Public & Authentication (S01–S08)

| ID | Screen | User | Purpose | Comes from | Goes next |
|---|---|---|---|---|---|
| S01 (NM-001) | Landing / Home | PUB | Explain the promise (trust + compatibility + freshness); funnel to browse or signup | Direct URL, SEO, shared links, campaigns | S02 browse · S05 signup · S04 trust · S06 login |
| S02 (NM-002) | Room Search — public browse | PUB | Let guests judge real supply before signup | S01, SEO locality pages, shared search links | S03 detail · S05 signup (auth wall) |
| S03 (NM-003) | Room Detail — public masked | PUB | Full decision facts with identity masked; convert | S02, shared cards, SEO | S05 signup (auth wall) · S02 back · S04 |
| S04 (NM-004) | Trust & Safety Center (public) | PUB | Show the safety model before commitment; scam literacy | S01 footer, S03 pointer, ads | S05 signup |
| S05 (NM-005) | Signup | PUB | Phone-first account creation | All auth walls (context carried), S01, S04, S06 | S07 OTP |
| S06 (NM-006) | Login | PUB | Returning access | S01, S05, session-expiry redirects | S07 OTP |
| S07 (NM-007) | OTP Verification | PUB | Prove phone ownership → T0 granted | S05, S06 | S08 (new user) · return path (login) |
| S08 (NM-008) | Role & Intent Selection | PUB→ALL | Choose Seek / Offer / Both — routes the whole product | S07 success, S37 (role add) | S09 seeker wizard · S29 owner wizard |

## 3.2 Seeker — Onboarding, Home & Discovery (S09–S16)

| ID | Screen | User | Purpose | Comes from | Goes next |
|---|---|---|---|---|---|
| S09 (NM-009) | Seeker Onboarding Wizard | SRK | One guided flow → complete, matchable profile | S08, resume banner on S10 | S10 (personalized immediately) |
| S10 (NM-010) | Seeker Home (personalized) | SRK | Daily command center: matches, picks, saved, alerts | Bottom nav, login default, deep links | S11 · S12 · S14 · S15 · S16 · S21 · S24 |
| S11 (NM-011) | Room Search (authenticated) | SRK | Full search + filters + sort + freshness | S10, nav Search, S16, deep links | S12 · S13 · S16 |
| S12 (NM-012) | Room Detail (authenticated) | SRK | Complete decision surface + connect | S11, S10 rails, S16, deep links | Connect sheet · S16 save · S15 (owner card) · S27 |
| S13 (NM-013) | Advanced Filters | SRK | Dealbreaker-level filtering | S11 "Advanced filters" | S11 (results re-ranked) |
| S14 (NM-014) | Flatmate Discovery | SRK | Ranked candidate feed with explained fit — no listing needed | S10 rail, nav Flatmates, S16 | S15 · connect sheet |
| S15 (NM-015) | Flatmate Profile Detail | SRK | Full candidate evaluation + why-this-match | S14, S23 header, S34 (read-only) | Connect sheet · S23 (if connected) · S27 |
| S16 (NM-016) | Saved Items | SRK | Multi-session search state home | S10 rail, nav | S12 · S15 · S11/S14 (browse) |

## 3.3 Seeker/Shared — Profile, Trust, Connections, Chat, Safety (S17–S28)

| ID | Screen | User | Purpose | Comes from | Goes next |
|---|---|---|---|---|---|
| S17 (NM-017) | My Profile (edit) | ALL | Manage identity + 10 lifestyle attributes | Nav Profile, S09 return, S10 meter | S19 · S28 · S38 · S18 |
| S18 (NM-018) | Preferences (edit) | SRK | Evolve must-haves & nice-to-haves | S17, S14 chips, S24 deep link | S14/S11 (matches recompute) |
| S19 (NM-019) | Verification Submission | ALL | T2 ID (+ T3 ownership for owners) | S17/S20 CTAs, S29, S31 gate | S20 (in review) |
| S20 (NM-020) | Verification Status | ALL | Transparent state machine + resubmission | S17 card, S30 gate, notifications | S19 resubmit · S26 |
| S21 (NM-021) | Connections | ALL | Requests in/out: accept / decline / withdraw | S10 pill, S24 deep link, nav | S23 (accept) · S15 (view profile) |
| S22 (NM-022) | Chat List | ALL | Conversation index with context + unread | Nav Chats, S24 deep link | S23 |
| S23 (NM-023) | Chat Thread | ALL | Safe conversation + contact reveal + report | S22, S21 accept, S12 "Open chat" | reveal → off-platform · S27 report |
| S24 (NM-024) | Notifications Center | ALL | One notification state home | Top-bar bell, deep links | S21 · S23 · S34 · S20 (per object) |
| S25 (NM-025) | Notification Settings | ALL | Per-event × per-channel control | S37, S24 | (auto-save, back) |
| S26 (NM-026) | Safety Center (authenticated) | ALL | Safety literacy + report entry at decision moments | S04 (logged-in), chat cards, S27 confirm | S27 · S39 |
| S27 (NM-027) | Report / Block Flow | ALL | Structured reporting with immediate protections | Overflow menus everywhere, S26 | S26 confirmation |
| S28 (NM-028) | Profile Public Preview | ALL | See yourself exactly as others do | S17, S38 | S38 (adjust) |

## 3.4 Owner Suite (S29–S36)

| ID | Screen | User | Purpose | Comes from | Goes next |
|---|---|---|---|---|---|
| S29 (NM-029) | Owner Onboarding Wizard | OWN | Owner type, property basics, expectations, verification explainer | S08 ("Offer"), S37 role add | S19 (owner variant) |
| S30 (NM-030) | Owner Dashboard | OWN | Listings at a glance, applicant activity, response rate | Nav Dashboard (owner mode), login default | S31 · S32 · S34 · S19 |
| S31 (NM-031) | Listing Creation Wizard | OWN | Structured, complete listing in 6 steps | S30, S32 "New", post-verification | Publish → S30 (Active) · S19 gate |
| S32 (NM-032) | Listings Management | OWN | All listings + lifecycle states + expiry nudges | S30, nav Listings | S33 · quick actions |
| S33 (NM-033) | Listing Detail (owner view) | OWN | Edit, pause, renew, fill, per-listing analytics | S32 row, S30 card | S34 · edit · Mark Filled |
| S34 (NM-034) | Applicant Pipeline | OWN | Stage board replacing inbox chaos | S30, nav Applicants, S33 | S35 · S23 chat |
| S35 (NM-035) | Applicant Detail & Compare | OWN | Candidate evaluation + side-by-side (≤3) | S34 card | Stage actions · S23 · S34 |
| S36 (NM-036) | Owner Profile (edit) | OWN | Owner identity + properties + response tier | Nav Profile (owner mode) | S19 · S28 preview |

## 3.5 Shared / Account (S37–S40)

| ID | Screen | User | Purpose | Comes from | Goes next |
|---|---|---|---|---|---|
| S37 (NM-037) | Settings | ALL | Account hub: phone, roles, verification, notifications, privacy, legal | Nav Profile → Settings | S25 · S38 · S20 · S39 · S40 · S08 (role add) |
| S38 (NM-038) | Privacy & Visibility Controls | ALL | Photo blur, name masking, discovery opt-out | S37, S28 | S28 (live preview) |
| S39 (NM-039) | Help & Support | ALL | FAQ + contact form + safety links | S37, footer, error states | Ticket created → S26 |
| S40 (NM-040) | Account Deactivation / Deletion | ALL | Dignified exit: deactivate (reversible) or delete (14-day grace) | S37 danger zone | Login (reactivation) · S05 (post-deletion) |

## 3.6 Admin Console (S41–S49, internal)

| ID | Screen | User | Purpose | Comes from | Goes next |
|---|---|---|---|---|---|
| S41 (NM-041) | Admin Login | ADM | Hardened entry (password + TOTP) | Direct `/admin` route (never linked) | S42 |
| S42 (NM-042) | Admin Dashboard | ADM | Queue overview + SLA health | S41 | S43 · S45 · S47 · S48 · S49 |
| S43 (NM-043) | Verification Review Queue | ADM | T2/T3 cases by age (SLA colors) | S42 | S44 |
| S44 (NM-044) | Verification Case Detail | ADM | Checklist review + decision (audited) | S43 | Decision → back to S43 |
| S45 (NM-045) | Listing Moderation Queue | ADM | Flagged / duplicate / sampled listings | S42 | S46 |
| S46 (NM-046) | Listing Moderation Detail | ADM | Review + act (approve / edit-require / unlist / remove) | S45 | Action → back to S45 |
| S47 (NM-047) | Report Queue & Case Management | ADM | Triage by severity + resolve with SLA | S42 | Disposition → back |
| S48 (NM-048) | User Management | ADM | User 360 + suspend / ban / reinstate | S42 | Action → back |
| S49 (NM-049) | Platform Metrics | ADM | Weekly marketplace-health digest | S42 (V1 release) | Export |

**Coverage total:** 49 screens — 48 in MVP scope, S49 (Platform Metrics) scheduled for V1. Every screen maps to at least one journey (Section 02) and at least one feature (Section 07).


---

# SECTION 04 — MASTER SCREEN FLOW

This is the wiring diagram of the product. Every arrow is a mandatory transition; every branch label is a condition that must be implemented. Screens are never linked "by feel" — if an arrow is not here or in Section 05, it does not exist.

## 4.1 Entry, authentication & role (no bottom nav on any of these screens)

```text
S01 Landing
 ├─ "Find a room in Bangalore" ──────────────► S02 Room Search (public)
 ├─ "I have a room to offer" ────────────────► S05 Signup (owner intent carried)
 ├─ Login ───────────────────────────────────► S06
 └─ Trust & Safety ──────────────────────────► S04 ── "Create your verified profile" ──► S05

S02 Room Search (public)
 ├─ Card tap ────────────────────────────────► S03 Room Detail (masked)
 └─ Contact/Connect action ── AUTH WALL ────► S05  (context preserved, EC-05)

S03 Room Detail (public masked)
 ├─ "Connect with owner" ──── AUTH WALL ────► S05  (action auto-executes after onboarding)
 └─ Back ────────────────────────────────────► S02 (state preserved)

S05 Signup ── phone + consent ──► S07 OTP
S06 Login  ── phone ────────────► S07 OTP
S07 OTP
 ├─ Valid code ──► NEW USER? ──► S08 Role Selection
 │                └─ RETURNING? ─► S10 (seeker mode) / S30 (owner mode) / original auth-wall target
 ├─ Wrong code (≤5 tries) ──────► stay (inline error)
 └─ 5 failures ─────────────────► 30-min lock + support link

S08 Role & Intent Selection
 ├─ "I'm looking for a room / flatmates" ────► S09 Seeker Onboarding Wizard
 ├─ "I have a room to offer" ────────────────► S29 Owner Onboarding Wizard
 ├─ "Both" ──────────────────────────────────► S09 (owner mode added later from S37)
 └─ After wizard completes ──► auth-wall context restored (original action auto-executes, EC-05)
```

## 4.2 Onboarding gates (wizards have no bottom nav; exit = explicit "Save & exit")

```text
S09 Seeker Wizard (6 steps: basics → location → budget → move-in → lifestyle → must-haves)
 ├─ Complete ────────────────────────────────► S10 (personalized results immediately)
 ├─ Abandon mid-wizard ──────────────────────► data persisted; resume banner on S10 → re-enter at exact step
 └─ Final CTA "Find my match" ──► (optional non-blocking prompt) ──► S19 ID verification

S29 Owner Wizard (type → property → expectations → verification explainer)
 ├─ "Start verification" ────────────────────► S19 (owner variant: T2 + T3 ownership proof)
 └─ Save & exit ─────────────────────────────► S30 (draft kept, resume banner)

S19 Verification Submission
 └─ Submit ──────────────────────────────────► S20 Verification Status (Submitted → In review)

S20 Verification Status
 ├─ Approved ── seeker: badges + re-ranked profile ──► S10/S17
 ├─ Approved ── owner (T3): publish unlocked ────────► S31 Listing Creation Wizard
 ├─ Rejected (reason) ───────────────────────► S19 resubmission (prefilled reasons)
 ├─ Rejected 2nd time ───────────────────────► 7-day cooling notice (screen shows date)
 └─ SLA breached (>24h) ─────────────────────► apology banner + auto-prioritized queue (admin side)
```

## 4.3 Seeker core loop (5-tab shell: Home · Search · Flatmates · Chats · Profile)

```text
S10 Seeker Home
 ├─ Recommended room card ──► S12 Room Detail
 ├─ Matched flatmate card ──► S15 Flatmate Profile
 ├─ Search bar / See all ───► S11 Room Search
 ├─ Pending-requests pill ──► S21 Connections
 └─ Onboarding resume banner ► S09 (if incomplete)

S11 Room Search ── card tap ──► S12; "Advanced filters" ──► S13 ── apply ──► S11 (re-ranked)
S14 Flatmate Discovery ── card tap ──► S15; quick "Connect" on card ──► connect sheet
S12 / S15 (decision surfaces)
 ├─ Save ────────────────────────────────────► S16 Saved Items (state)
 ├─ Connect ─────────────────────────────────► intro-note sheet ── send ──► S21 (Sent tab, pending)
 ├─ Share ───────────────────────────────────► WhatsApp/DM public-safe card (S02/S03 for recipient)
 └─ Report (overflow) ───────────────────────► S27

S16 Saved Items ── row tap ──► S12 / S15 (expired rows show state + similar-rooms path)
```

## 4.4 Connection → chat → consent (the trust-critical spine)

```text
Connect request sent (from S12/S15)
  ▼
S21 Connections
 ├─ RECEIVED tab: Accept ──► S23 Chat Thread (context header: anchor listing/profile)
 │                Decline ──► silent to sender; sender blocked from re-request 90 days
 ├─ SENT tab: pending / accepted / declined / expired (14d) / withdrawn
 └─ Withdraw (sent) ──► request removed
  ▼
S22 Chat List ── row tap ──► S23 Chat Thread
S23 Chat Thread
 ├─ Messages (text, images ≤3 per message, rate-limited)
 ├─ Phone/email/URL typed in text ──► auto-masked ("hidden number" pill) — always
 ├─ "Share phone number" ──► consent card (C-04)
 │    ├─ Both consent ──► numbers revealed once in-thread + pre-meet safety card
 │    └─ Declined ──► CTA hidden 7 days; chat continues normally
 ├─ Payment-pattern message ──► system card "payments not supported on NestMate"
 └─ Report / Block (overflow) ──► S27 ──► safety-class case: pair freeze (read-only banner)
  ▼
Off-platform meeting (by design) ──► outcome: owner marks Filled (S33) ──► listing hidden everywhere;
seeker's saved row shows "Filled" (S16)
```

## 4.5 Owner journey (5-tab shell: Dashboard · Listings · Applicants · Chats · Profile)

```text
S30 Owner Dashboard
 ├─ "Publish your first room" / New listing ──► S31
 ├─ Expiry nudge card ───────────────────────► S32 (one-tap Renew)
 ├─ "3 new applicants" ──────────────────────► S34
 └─ Unverified banner ───────────────────────► S19 (owner variant)

S31 Listing Creation Wizard (6 steps → review → Publish)
 ├─ Publish attempted without T3 ────────────► verification interstitial ──► S19
 ├─ Auto-checks pass ────────────────────────► Active (success card) ──► S30
 ├─ Auto-flag raised ────────────────────────► Pending ──► [admin S46 review] ──► Active / edit-require / unlist
 └─ Duplicate detected ──────────────────────► warning sheet (merge / replace / publish anyway)

S32 Listings Management ── row tap ──► S33 Listing Detail (owner)
S33
 ├─ Renew (expiring/expired, one tap, +30 days)
 ├─ Pause / Resume · Edit · Remove (confirm + reason)
 └─ Mark as Filled ──► confirm sheet ──► F-036 fill cascade (applicants politely closed, listing hidden)

S34 Applicant Pipeline (New → Shortlisted → Chatting → Met → Selected; terminal: Rejected/Withdrawn collapsed)
 └─ Card tap ──► S35 Applicant Detail & Compare
S35
 ├─ Stage action (Shortlist / Mark met / Select / Decline)
 ├─ Select ──► confirm sheet ──► fill cascade ──► S33 (Filled state)
 └─ Open chat ──► S23 (context header = applicant)
```

## 4.6 Trust, safety & account (cross-cutting)

```text
Trust:    any CTA "Verify ID" ──► S19 ──► S20 ──► badges (see 4.2)
Safety:   any overflow "Report" ──► S27 ──► protections + [admin S47] ──► reporter closure notice
          S26 Safety Center ◄── chat safety cards, S04 (logged-in), S27 confirmation
Account:  S37 Settings
          ├─ Roles: add Owner/Seeker ──► S08 upgrade path (no re-signup)
          ├─ Mode chip (Both users): Seeking ⇄ Offering ──► swaps nav + home, keeps all state
          ├─ S25 Notification Settings (auto-save)
          ├─ S38 Privacy & Visibility ──► S28 live preview
          ├─ S39 Help & Support ──► ticket
          └─ S40 Deactivate (login restores exactly) / Delete (14-day grace → erasure)
Admin:    S41 login (password + TOTP) ──► S42 dashboard ──► queues S43/S45/S47, users S48, metrics S49
```

## 4.7 Route guards (enforced server-side, mirrored client-side)

| Guard | Trigger | Behaviour |
|---|---|---|
| auth | Unauthenticated user hits a protected route | Redirect to S05/S06 with `?next=` preserved (EC-05) |
| onboarding | Role chosen but wizard incomplete | Resume S09/S29 at the exact last step |
| role | Wrong mode for the route | Mode-switch suggestion sheet — never a silent swap |
| verified-owner | Publish/listing actions without T3 | Verification interstitial → S19 owner variant |
| suspended / banned | Account under enforcement | State screen (status + appeal link); no app access |
| frozen | Active safety case on the chat pair | Chat renders read-only with explanation banner |
| deleted | Post-grace-period deletion | S05 with "account deleted" notice |


---

# SECTION 05 — SCREEN-BY-SCREEN BUILD SPECIFICATION

Every screen follows the same 11-part structure. Wireframes are **functional**: they fix block order, content, CTA position, and behaviour — not visual styling. Global defaults apply to every screen unless a screen overrides them:

- **Loading** — skeleton of the primary content block; no spinners for text.
- **Error** — inline, actionable, never a dead end: "Couldn't load. [Retry] [Go home]". Errors never lose entered data.
- **Empty** — one honest sentence why it's empty + one primary next action. Never blank.
- **Offline** — banner "You're offline — showing saved data" where cache exists.
- **Bottom navigation** — only on the role shells (seeker 5-tab / owner 5-tab). Wizards, auth screens, detail-push screens, and admin have none.
- **One primary CTA per screen.** Secondary actions are text buttons or overflow menus.
- **Security baseline** — session checks server-side; role/permission checks server-side; no personal contact data in any payload before mutual consent; mutations rate-limited.

---

## S01 (NM-001) — Landing / Home

**1. Purpose.** Communicate the NestMate promise — verified people, explained compatibility, fresh listings — and funnel guests into public browse or signup within 10 seconds.
**2. User.** Public (guest), all personas.
**3. Entry.** Direct URL, SEO, campaign and shared links (`?ref=` attribution variant allowed).

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  logo · "Bangalore" (locked) · Login
----------------------------------------
HERO
  Headline (value promise)
  Sub-line (verified people · explained fit · fresh rooms)
  [ ( Find a room in Bangalore ) ]        ← primary CTA (browse w/o signup)
  [ I have a room to offer ]              ← secondary (owner funnel)
ROLE TABS:  "I'm looking"  ·  "I have a room"
STAT BAND:  active listings · freshness share · verified owners   (real data)
ROOM PREVIEW STRIP:  4–6 fresh listing cards (C-01, public projection)
HOW IT WORKS:  Seeker 3 steps · Owner 3 steps
TRUST EXPLAINER:  3 pillar cards → link to S04
SAFETY SUMMARY → S04          FAQ teaser          FOOTER (docs, contact, ToS)
----------------------------------------
(no bottom nav — public shell)
```

**5. Components.** Top bar; hero with dual CTA; role tabs; stat band; listing-card strip (C-01); step cards; trust cards; footer.
**6. Content.** Value headline; the three pillars with mini-visuals; honest live stats; a fresh-room preview; short how-it-works for both roles; safety summary line.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap "Find a room in Bangalore" | Guest search session opens | S02 |
| Tap "I have a room to offer" | Owner intent stored in session | S05 → (after auth) S08 with "Offer" preselected |
| Tap a room card | Public detail opens | S03 |
| Tap Login / a footer link | Navigate | S06 / target |
| Switch role tab | Hero copy + steps swap | stay |

**8. Navigation.** Previous: external. Next: S02/S03/S04/S05/S06. Back from S02/S03 returns here with state intact.
**9. Screen states.** Success: stats populated + fresh strip. Launch-threshold state: fewer than 20 listings in city → stats hidden, "launching in Bangalore" messaging + waitlist capture form. Loading `[G]`; Error `[G]`.
**10. Rules.** Public projection only — no owner identity, no exact address (locality level); stats are real cached numbers, never vanity figures; city is fixed to Bangalore.
**11. Completion.** All blocks render from real data; both funnels (seeker/owner) reach their next screen; waitlist capture works in launch-threshold state.

---

## S02 (NM-002) — Room Search (Public Browse)

**1. Purpose.** Let guests evaluate real supply before committing; the SEO surface.
**2. User.** Public guest.
**3. Entry.** S01, SEO locality pages (`/rooms/bangalore/{locality}`), shared search links.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Rooms in Bangalore" · Login
----------------------------------------
STICKY FILTER BAR:  locality · rent range · room type   (public subset)
RESULT COUNT · sort = Freshness (default)
LIST (cards C-01):  photo · ₹rent/mo · deposit · locality · room type
                    [✓ Owner verified] · [Confirmed Xd ago]
                    compatibility teaser HIDDEN (needs profile)
        ↓ infinite scroll with skeletons
STICKY PILL (after 3 card views):  "Sign up to see matches" → S05
----------------------------------------
(no bottom nav)
```

**5. Components.** Sticky filter bar; listing cards (C-01); sort control; auth-wall sheet (C-07); signup pill.
**6. Content.** Result count; cards show rent, deposit (always), locality, room type, freshness stamp, Owner-Verified badge when applicable.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap card | Detail opens (public masked) | S03 |
| Apply public filter | Result list refreshes; count updates | stay |
| Tap any contact/connect affordance | Auth wall restating the action (C-07) | S05 (context carried) |
| Scroll 3+ cards | Signup pill appears once | S05 optional |
| Sort change | Re-rank (freshness default) | stay |

**8. Navigation.** Previous: S01 / external. Next: S03, S05. Back from S03 restores scroll + filters.
**9. Screen states.** Success: ≥10 fresh results. Empty (no supply): "No rooms match yet — new listings land daily. [Get alerts]" → S05. Expired mid-scroll: card swaps to expired state (EC-12). Rate-limited scraping behaviour: temporary block page with appeal (EC-28).
**10. Rules.** Unverified-owner listings are never public; exact address never exposed at any depth (locality pin only); deposit always visible.
**11. Completion.** Guest can judge supply honestly; every card passes the C-01 self-sufficiency test (value + trust + freshness in one screenshot).

---

## S03 (NM-003) — Room Detail (Public, Masked)

**1. Purpose.** Present complete decision facts with identity masked; convert interest into signup.
**2. User.** Public guest.
**3. Entry.** S02, shared cards (WhatsApp/DM), SEO.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · share · ⋯ (report)
----------------------------------------
PHOTO GALLERY (≥3 photos, swipe)
RENT BLOCK:  ₹rent/mo · Deposit ₹ (mandatory) · Move-in date
FACT TABLE:  room type · furnishing · amenities · house rules · tenancy
WHO LIVES HERE:  occupant count + gender composition only (no identities)
LOCALITY:  name + approximate pin (radius blur) — never exact address
TRUST ROW:  [✓ Owner verified · Mar 2026] · [Confirmed Xd ago]
SAFETY POINTER:  "Every NestMate owner is ID & ownership verified → how it works" (→ S04)
SIMILAR ROOMS (V1)
----------------------------------------
STICKY BAR:  [ ( Connect with owner ) ]  [ Ask a question ]
             (both auth-walled → C-07 sheet → S05)
```

**5. Components.** Gallery with swipe; fact table; amenity chips; trust badge row (C-06); sticky action bar; share button; report overflow; auth-wall sheet (C-07).
**6. Content.** All mandatory listing facts (rent, deposit, move-in, tenancy, furnishing, amenities, house rules), masked occupancy info, locality with approximate pin, freshness stamp, owner badge + verification date, safety pointer.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap "Connect with owner" / "Ask a question" | Auth wall restating the action (C-07) | S05 → action auto-executes after onboarding (EC-05) |
| Tap share | Public-safe share card generated (photo + rent + locality + badge + freshness) | WhatsApp/DM |
| Tap ⋯ Report | Guest report path (listing-scoped) | S04 form |
| Tap Save | Auth wall (C-07) | S05 |
| Back | Return with state | S02 |

**8. Navigation.** Previous: S02 / shared link. Next: S05, S04, S02. Deep link lands here directly (guest projection).
**9. Screen states.** Success: all facts + ≥3 photos render. Listing paused/expired/filled after load: state banner + similar rooms (EC-12). Gallery reduced below 3 by moderation: re-validate to ≥1 or auto-pause (EC-15). Owner verification under review: explanatory banner.
**10. Rules.** No owner phone/email/ID in any payload; map pin jittered to locality centroid; "who lives here" shows counts and gender composition only, never identities; badges carry dates.
**11. Completion.** A guest can decide "worth pursuing" from this screen alone, and the connect action converts into signup without losing context.

---

## S04 (NM-004) — Trust & Safety Center (public)

**1. Purpose.** Explain the trust model *before* commitment; teach scam literacy; convert sceptics.
**2. User.** Public (also linked from all authenticated screens).
**3. Entry.** S01 footer, S03 safety pointer, S26, ad/social bios.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Trust & Safety"
----------------------------------------
SECTION:  How verification works (T0 phone → T1 profile → T2 ID+selfie → T3 ownership)
          plain-language tier table
SECTION:  Badge gallery (B-1…B-5 cards with meanings)
SECTION:  How we handle reports (SLA: safety <12h)
SECTION:  Scam patterns explained (visiting-pass fraud, deposit scams — expandable)
SECTION:  Meet-safe checklist
SECTION:  Privacy promise: "Your number stays hidden until you both agree to share"
DISCLAIMER:  verification ≠ endorsement
----------------------------------------
CTA BAND:  [ ( Create your verified profile ) ] → S05
```

**5. Components.** Sectioned article layout; tier table; badge cards; expandable items; CTA band.
**6. Content.** Plain-language verification tiers; badge meanings; report SLA; the two or three dominant local scam patterns and how NestMate structurally blocks them; meet-safe checklist; privacy promise; disclaimer.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap "Create your verified profile" | Signup with trust context | S05 |
| Expand a scam pattern | Detail reveals | stay |
| (Logged-in) tap safety links | Authenticated safety center | S26 |

**8. Navigation.** Previous: S01/S03. Next: S05, S26.
**9. Screen states.** Static content — Loading `[G]`, Error `[G]` only. Logged-in variant swaps the CTA band for authenticated links.
**10. Rules.** Content is versioned (not hard-coded strings scattered in UI); safety copy must match the authenticated Safety Center (S26) — one source, two surfaces.
**11. Completion.** A first-time visitor can explain NestMate's verification, freshness, and privacy model back to a friend.

---

## S05 (NM-005) — Signup

**1. Purpose.** Phone-first account creation with minimal friction.
**2. User.** Public.
**3. Entry.** Every auth wall (with preserved context, EC-05), S01, S04, S06.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back (returns to interrupted context)
----------------------------------------
HEADLINE:  Create your free account
SUB-LINE:  no passwords · 30 seconds
PHONE FIELD:  [+91 locked] · number · inline validation
CONSENT CHECKBOXES (unchecked, blocking):  ToS · Privacy Policy (links)
[ ( Continue ) ]                          ← sends OTP
"I already have an account" → S06
(resend cooldown timer preview: 60s)
----------------------------------------
(no bottom nav)
```

**5. Components.** Phone input with country lock (+91); consent checkboxes with links; primary CTA; login link.
**6. Content.** Minimal: phone, two consents, reassurance line. Context line when arriving from an auth wall: "You're one step from connecting about *this room*" (restates the interrupted action).
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Enter valid phone + consents + Continue | OTP sent (rate-limited per phone+IP); transition ≤1s | S07 |
| Enter number that already has an account | No enumeration error — gentle "log in instead" with number prefilled (EC-02) | S06 |
| Hit rate limit | Cooldown message with timer | stay |
| Tap "I already have an account" | — | S06 |

**8. Navigation.** Previous: back always returns to the interrupted context (S03/S02/etc.). Next: S07. Exit: device back — context still preserved on return.
**9. Screen states.** Default; invalid-number inline error; rate-limit cooldown; EC-02 dedupe path; consent blocking state (CTA disabled until both checked).
**10. Rules.** Consent timestamps recorded; OTP send is rate-limited; the interrupted action (connect/save/filter) is stored and auto-executed after onboarding — the user never re-navigates manually (EC-05).
**11. Completion.** A new user reaches S07 with OTP sent; a returning user is gracefully routed to S06; no context is ever dropped.

---

## S06 (NM-006) — Login

**1. Purpose.** Fast returning access via OTP.
**2. User.** Public (returning users; also suspended users hitting the guard).
**3. Entry.** S01, S05, session-expiry redirects.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Log in"
----------------------------------------
PHONE FIELD:  [+91] · number
HINT (remembered device):  masked recent number as one-tap option
[ ( Send code ) ]                         → S07
"New here? Create an account" → S05
Help → S39
----------------------------------------
(no bottom nav)
```

**5. Components.** Phone field; remembered-device hint chip; primary CTA; signup link; help link.
**6. Content.** Phone prompt; hint; reassurance ("no passwords").
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Enter phone + Send code | OTP dispatched | S07 |
| Use remembered-number hint | Number prefilled | S07 |
| Account suspended | State-specific screen: status + appeal path, no secret leakage (EC-20) | state screen |
| Tap signup / help | — | S05 / S39 |

**8. Navigation.** Previous: S01/S05. Next: S07. After OTP success, returning users land where they were heading (S10/S30/deep-link target).
**9. Screen states.** Default; suspended state (EC-20); deleted-account notice (post-grace, EC-02 path); generic error `[G]`.
**10. Rules.** No enumeration disclosure; suspension messaging never reveals enforcement details beyond status + appeal.
**11. Completion.** Returning user reaches OTP in one field-entry; suspended users get a coherent, dignified state screen.

---

## S07 (NM-007) — OTP Verification

**1. Purpose.** Prove phone ownership → grant T0 (the trust floor).
**2. User.** Public, mid-auth.
**3. Entry.** S05, S06.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back
----------------------------------------
HEADLINE:  Enter the 6-digit code
TARGET:    sent to +91 •••••12345      [Change number → S05]
CODE INPUT:  [ 1 ][ 4 ][ _ ][ _ ][ _ ][ _ ]   (auto-submit on 6th digit, paste supported)
[ ( Verify ) ]
RESEND:  00:47 cooldown → "Resend code"
----------------------------------------
(no bottom nav)
```

**5. Components.** Segmented 6-digit input; masked target; countdown chip; resend; change-number link.
**6. Content.** Where the code was sent; masked number; resend timing.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Enter correct code | Session created; T0 recorded | S08 (new) or return path (login/deep link) |
| Enter wrong code | Inline error + shake; retry | stay |
| Code expired | Resend prompt | stay → resend |
| Tap Resend | New OTP after 60s cooldown (max 3/hour) | stay |
| 5 consecutive failures | 30-minute lock with support link (EC-03) | lock state |
| Tap "Change number" | — | S05 |

**8. Navigation.** Previous: S05/S06. Next: S08 or the preserved return target.
**9. Screen states.** Default; verifying; error; expired; locked (EC-03).
**10. Rules.** Code is single-use; comparison constant-time; lockout counters server-side; SMS auto-read attempted where the PWA allows.
**11. Completion.** Legitimate users verify in under 30 seconds; abuse is rate-limited and locked without dead-ending honest users.

---

## S08 (NM-008) — Role & Intent Selection

**1. Purpose.** Route each user into the correct product and establish role(s).
**2. User.** Freshly authenticated users; upgraders adding a role from S37.
**3. Entry.** S07 success; S37 (role add, F-079).

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  (minimal) · account chip
----------------------------------------
HEADLINE:  What brings you to NestMate?
CARD 1:  "I'm looking for a room / flatmates"   → S09
CARD 2:  "I have a room to offer"               → S29
SMALL OPTION:  "Both" → S09 first (owner mode addable later)
[ Skip ]  → defaults to Seeker mode with incomplete-profile prompts
----------------------------------------
(no bottom nav)
```

**5. Components.** Two large role cards; "Both" option; skip.
**6. Content.** Two value-framed choices; the "Both" explanation ("you can do both — switch anytime"); skip framing.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap "Looking for a room" | Role `seeker` stored | S09 |
| Tap "I have a room" | Role `owner` stored | S29 |
| Tap "Both" | Both roles stored; seeker flow first | S09 |
| Skip | Seeker default, prompts later | S09 (skippable path) or preserved auth-wall context |

**8. Navigation.** Previous: S07/S37. Next: S09/S29. If arriving with auth-wall context (EC-05), that context executes after the wizard — never lost here.
**9. Screen states.** Default; upgrade variant (existing seeker adding owner role — copy adapts, no re-signup).
**10. Rules.** Role selection is stored, never inferred from behaviour; "Both" users get the persistent mode chip (Seeking ⇄ Offering) once onboarding completes.
**11. Completion.** Every user lands on the correct wizard; upgrading users never re-register.


---

## S09 (NM-009) — Seeker Onboarding Wizard

**1. Purpose.** One guided flow producing a complete, matchable profile — finished once, durable forever.
**2. User.** New seeker (or "Both" user starting with the seeker path).
**3. Entry.** S08; resumable from the S10 banner (EC-01).

**4. Functional wireframe**
```text
----------------------------------------
WIZARD FRAME (no bottom nav):  ● ● ● ○ ○ ○   Step N of 6   [Save & exit]
ONE question per view; "why we ask" microcopy on sensitive steps
----------------------------------------
STEP 1 Basics:      name · photo (optional, prompted) · occupation · age band
STEP 2 Location:    city = Bangalore (locked) · localities multi-select ·
                    optional commute anchor
STEP 3 Budget:      rent range slider · deposit tolerance chip
STEP 4 Move-in:     date or month · tenancy duration
STEP 5 Lifestyle:   the 10 canonical attributes, one question per view,
                    plain language (food · cleanliness · smoking · sleep ·
                    alcohol · noise · guests · pets · work pattern · gender pref)
STEP 6 Must-haves:  hard filters as toggle cards (women-only · non-smoker ·
                    veg kitchen · no pets …) + "we'll only show you these"
[ Skip* ]                          [ ( Continue ) ]  → final: ( Find my match )
----------------------------------------
END CARD (non-blocking): "Verify your ID to boost responses — 2 min" → S19
```

**5. Components.** Wizard skeleton (C-08): progress bar, per-step validation, photo uploader, segmented attribute pickers, must-have toggle cards with consequence notes, "why we ask" microcopy.
**6. Content.** Six short steps, each under 30 seconds; every lifestyle question framed in plain language with a one-line privacy note; must-haves explained as binding filters.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Complete a step | Saved immediately (idempotent per step) | next step |
| Skip a step | Marked incomplete; S10 nags later (EC-01) | next step |
| Tap Back | Step state preserved | previous step |
| Abandon / kill app | All entered data persisted | S10 resume banner → exact step |
| Tap "Find my match" | Profile → T1 if complete; matches computed | S10 |
| Tap verify prompt | — | S19 |

**8. Navigation.** Previous: S08. Next: S10. Exit: explicit "Save & exit" only (prevents half-state limbo); no bottom nav inside the wizard.
**9. Screen states.** Per-step validation errors (inline, non-destructive); resume state (banner on S10, wizard reopens at exact step, EC-01); past move-in date → re-confirm flow (EC-24); photo permission requested only when the user opts to upload.
**10. Rules.** Lifestyle data is visible to other authenticated users, never to the public; must-haves are hard filters (they bind discovery), preferences are soft; gender preference is handled as a filter, never a score.
**11. Completion.** A user who finishes reaches S10 with personalized results visible immediately; a user who quits can resume loss-free at any time.

---

## S10 (NM-010) — Seeker Home (Personalized)

**1. Purpose.** The daily command center: what's new, what matches, what needs action.
**2. User.** Seeker (mode: seeking).
**3. Entry.** Bottom-nav Home; login default for seekers; deep links.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  "NestMate" · mode chip (Both users) · 🔔 bell (badge) · ⋯
----------------------------------------
GREETING + profile completeness meter (if <100%)
[resume-onboarding banner — only if S09 incomplete]
VERIFICATION NUDGE CARD (only if T0-only):  "ID-verified profiles get ~2× responses"
RECOMMENDED ROOMS (rail, 6):  cards C-01 with freshness stamps + compat chip
MATCHED FLATMATES (rail, 6):  cards C-02 with score band + 1-line why
CONTINUE RAIL:  last search · recently viewed
SAVED RAIL:  saved items with revalidated states
PENDING-REQUESTS PILL:  "2 connection requests" → S21
----------------------------------------
BOTTOM NAV:  Home · Search · Flatmates · Chats(badge) · Profile
```

**5. Components.** Horizontal rails; listing cards (C-01); flatmate cards (C-02); pills; completeness meter; empty-state variants per rail (C-05).
**6. Content.** Top-6 recommended rooms ranked by freshness × compatibility; top-6 matched flatmates with score band and one-line reason; continue/saved rails; pending-request count; verification nudge.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap room card | Detail | S12 |
| Tap flatmate card | Profile | S15 |
| Tap Search bar / "See all" | Search surface | S11 |
| Tap pending-requests pill | — | S21 |
| Tap resume banner | Wizard at exact step | S09 |
| Tap verification nudge | — | S19 |
| Refresh matches | Recompute displayed | stay |

**8. Navigation.** Previous: login/deep link. Next: S11/S12/S14/S15/S16/S21/S24/S09/S19. Tab switches preserve per-tab state.
**9. Screen states.** New-user empty: onboarding resume (EC-01) or city-supply messaging with widen-radius CTA (EC-14). Stale preferences (move-in passed): re-confirm banner → S18, matches recompute after confirmation (EC-24). Rail-level loading/error — one broken rail never fails the page. Deleted-user items silently pruned (EC-13).
**10. Rules.** Pre-connect, flatmate rails show only what masking allows (no contact, blurred photo per controls); every rail degrades independently; freshness stamps always visible.
**11. Completion.** A returning seeker sees everything actionable in one glance; a brand-new seeker sees their first matches immediately after onboarding.

---

## S11 (NM-011) — Room Search (Authenticated)

**1. Purpose.** The primary retrieval surface: full filters, sort, freshness ranking.
**2. User.** Seeker (and "Both" in seeker mode). Guests are bounced to S02 (guard).
**3. Entry.** S10, nav Search, S16, deep links, S13 return.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  "Search rooms" · 🔔 · ⋯
----------------------------------------
SEARCH BAR:  free text + locality chips
PRIMARY FILTER ROW:  rent · move-in · room type · gender pref
[Advanced filters → S13]        active filter chips (removable inline)
SORT:  Freshness (default) · Compatibility · Rent ↑ · Newest
RESULT COUNT
LIST (cards C-01):  + [compat band chip] when computable · freshness · badges · ♡
        ↓ infinite scroll (20/page)
EMPTY → C-05 variants (see states)
----------------------------------------
BOTTOM NAV:  Home · Search · Flatmates · Chats · Profile
```

**5. Components.** Sticky search + filter row; advanced-filters button; sort control; result cards (C-01); saved-toggle on cards; filter chips.
**6. Content.** Cards with rent, deposit, locality, room type, freshness stamp, badges, compatibility chip where the listing's household attributes allow scoring; result count; active chips.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap card | Detail (authenticated projection) | S12 |
| Edit a filter chip | Results refresh; chips persist per device | stay |
| Tap Advanced filters | — | S13 |
| Change sort | Re-rank | stay |
| ♡ a card | Saved state toggles | stay |
| Share a card | Public-safe card | WhatsApp/DM |

**8. Navigation.** Previous: S10/S16. Next: S12, S13, S16. Back from S12/S13 restores filters, scroll, and results exactly.
**9. Screen states.** Three distinct empties (EC-14): no city supply (waitlist + widen) · filters too narrow (names the binding filter, one-tap relax) · must-haves exclude everything (must-have review CTA). Loading `[G]`; retry preserves filters.
**10. Rules.** Ranking = freshness × compatibility (freshness default sort); expired listings never render as tappable rooms (EC-12); filters persist per device across sessions.
**11. Completion.** First screen shows ≥8 results for the default city ranked correctly; every zero-state names its cause and offers the fix.

---

## S12 (NM-012) — Room Detail (Authenticated)

**1. Purpose.** The full decision surface: everything needed to connect, save, or pass.
**2. User.** Seeker (and "Both").
**3. Entry.** S11, S10 rails, S16, deep links.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · share · ⋯ (report)
----------------------------------------
PHOTO GALLERY (≥3)
RENT + DEPOSIT + MOVE-IN + TENANCY (fact table as S03)
OWNER CARD:  display name per policy · badges B-3/B-4 · member-since ·
             response-rate tier if owner · "Owner verified Mar 2026"
EXISTING FLATMATES (if shared):  compat bands — "You'd match the current
             resident: 82 · Great" + expandable breakdown
EXACT LOCALITY PIN (address itself only ever shared by owner in chat)
HOUSE RULES · deposit-terms guidance link
CONNECTED STATE (if already connected):  [Open chat] replaces Connect
----------------------------------------
STICKY BAR:  [ ( Connect ) ]   [ ♡ Save ]   (state-aware)
```

**5. Components.** Gallery; fact table; owner/occupant compatibility chips; badge row (C-06); sticky action bar; report overflow.
**6. Content.** Everything S03 shows plus: owner card with trust signals, occupant compatibility with explanation, response-rate tier, deposit guidance, connected-state awareness.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap Connect | Intro-note sheet (C-03) opens, prefilled for this room | sheet → send → S21 pending |
| Tap ♡ | Saved toggles | stay |
| Tap "Open chat" (connected) | Thread with room anchor | S23 |
| View owner profile | Masked owner card modal | modal |
| Tap Report | — | S27 |
| Tap Share | Public-safe card | WhatsApp/DM |

**8. Navigation.** Previous: S11/S10/S16 (state preserved). Next: connect sheet, S23, S15 (occupant), S27. Deep links land here with full context.
**9. Screen states.** Listing state changed after load: banner + similar rooms (EC-12). Owner suspended: listing auto-hidden (EC-21). Duplicate connect blocked: "already requested" (EC-10). Unverified user connecting: allowed, with soft note ("ID-verified profiles get ~2× responses") — never a hard gate.
**10. Rules.** Connect requires no T2 (soft nudge only); owner identity masked per privacy rules — no phone/email anywhere; compatibility bands always show their explanation on tap.
**11. Completion.** The user can decide and act (connect/save/share/report) without leaving the screen; every path onward is defined.

---

## S13 (NM-013) — Advanced Filters

**1. Purpose.** Dealbreaker-level filtering without cluttering S11.
**2. User.** Seeker.
**3. Entry.** S11 "Advanced filters".

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back (applies draft) · "Filters"
----------------------------------------
LIFESTYLE:  dietary · smoking · alcohol · sleep · pets
ROOM:       furnishing · amenities (multi) · bathrooms · floor
BUILDING RULES:  guests policy · cooking allowed
AVAILABILITY:  move-in window · duration
COMPATIBILITY:  [ ] only show 70+ matches
[Reset all]                    [ ( Show 47 results ) ]   ← live count
----------------------------------------
(no bottom nav — push screen)
```

**5. Components.** Sectioned pickers; live-count CTA; reset.
**6. Content.** Five filter sections mirroring the attribute model plus room/building facts; live result count on the CTA.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Toggle a filter | Count updates live | stay |
| Tap "Show N results" | Filters applied as chips on S11 | S11 |
| Count = 0 | Screen names the killer filter and offers inline toggle-off (EC-14 variant) | stay |
| Reset all | Draft cleared | stay |

**8. Navigation.** Previous: back applies draft → S11. Next: S11.
**9. Screen states.** Zero-count explainer; draft preserved on back; Loading `[G]` for count.
**10. Rules.** Filters refine; they never silently broaden; the count is always honest and current.
**11. Completion.** Users can express any dealbreaker and see its effect before applying.

---

## S14 (NM-014) — Flatmate Discovery

**1. Purpose.** Ranked candidate feed with transparent fit — the pairing journey that needs no listing.
**2. User.** Seeker (and "Both").
**3. Entry.** S10 rail "See all", nav Flatmates, S16.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  "Flatmates" · 🔔 · ⋯
----------------------------------------
MUST-HAVE CHIPS (from preferences; edit inline → S18)
SORT:  Best match (default)
CANDIDATE CARDS (C-02):
  [p] First name · age band · occupation · [✓ ID verified]?
  🟢 Great match · 84         ← band + score (text, never colour-only)
  Veg · Early sleeper · No smoking     ← 3 highest-signal chips
  "matches you on food & schedule; differs on guests"
  Active this week                     ← day-fuzzed
  [ ( Connect ) ]              [ View ]
        ↓ feed continues; low matches shown, labelled honestly
----------------------------------------
BOTTOM NAV:  Home · Search · Flatmates · Chats · Profile
```

**5. Components.** Candidate cards (C-02); must-have chips; sort; connect button on card; "Why this score?" quick sheet.
**6. Content.** Photo (respecting blur controls), first name, age band, occupation, badges, 3 attribute chips, score band + number, one-line why, activity freshness.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap Connect on card | Intro-note sheet (C-03) anchored to the profile | sheet → S21 pending |
| Tap card / View | Full profile | S15 |
| Tap "Why this score?" | Breakdown sheet: all 10 attributes | modal |
| Edit must-have chips | Feed refilters (must-haves bind before ranking) | stay |
| Change sort | Re-rank | stay |

**8. Navigation.** Previous: S10/S16. Next: S15, connect sheet → S21, S18 (chips).
**9. Screen states.** Empty: widen-radius / relax-must-have suggestions (EC-14). Declined candidates hidden for 90 days (EC-08). Own card excluded. Blocked users excluded. Opted-out users (privacy control) never appear. Unverified candidates deprioritized and badge-less.
**10. Rules.** Must-haves filter *before* ranking; low scores are shown but labelled ("Low match · 28") — never hidden, never buried dishonestly; last-active fuzzed to day granularity.
**11. Completion.** A complete-profile user sees at least one "Good"-band candidate near the top with a reason they could recompute by hand.

---

## S15 (NM-015) — Flatmate Profile Detail

**1. Purpose.** Full candidate evaluation with explained compatibility.
**2. User.** Seeker (and "Both"); owner sees a read-only variant from S34/S35.
**3. Entry.** S14 card, S23 header, S34 applicant view.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · share · ⋯ (report · block)
----------------------------------------
PROFILE HEADER:  photo (blur per controls) · first name · age band ·
                 occupation · member-since · badge row (C-06)
SCORE BLOCK:  big score + band + "Why this match" (expandable):
              "You match: veg, early schedule. You differ: guests."
              full 10-attribute breakdown, both values, points
ATTRIBUTES GRID:  all 10 as friendly chips (private ones masked per controls)
ABOUT:  short blurb (plain text, no contact info — enforced)
ACTIVITY:  "active 2 days ago"
THEIR MUST-HAVES vs YOU:  proactive note when conflicting
SAFETY ROW:  "ID verified Oct 2025" or gentle verify-prompt
----------------------------------------
STICKY BAR:  [ ( Connect ) ]   [ Message ] (if connected)
```

**5. Components.** Profile header; score card with expandable explanation; attribute chip grid; sticky action bar; report/block overflow.
**6. Content.** Identity per masking policy; full attribute set with visibility rules applied; score + ≥2 drivers; their must-haves that affect the viewer, shown proactively; activity freshness.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap Connect | Intro-note sheet anchored to profile | sheet → S21 pending |
| Tap Message (connected) | Thread | S23 |
| Expand score | Full breakdown sheet | modal |
| Report / Block | — | S27 |
| Share profile card | Public teaser card (auth-walled for recipient) | WhatsApp/DM |

**8. Navigation.** Previous: S14/S23/S34. Next: connect sheet, S23, S27.
**9. Screen states.** Incomplete profile: partial card ("X hasn't finished their profile") + connect still allowed. Self: redirect to own profile editor (S17). Blocked/declined-90d: hidden from reach. Unverified: "Phone verified" chip only + subtle safety note.
**10. Rules.** No last name, no contact details, no exact employer, ever; profile-view notifications to the viewed user are OFF at MVP (privacy posture); attribute visibility obeys the target user's controls (S38).
**11. Completion.** The viewer can explain why this person scored what they scored, and act — connect, pass, or protect.

---

## S16 (NM-016) — Saved Items

**1. Purpose.** Multi-session search state: keep and compare viable options across days.
**2. User.** All authenticated.
**3. Entry.** S10 rail, nav (within Home overflow at MVP).

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Saved"
----------------------------------------
TABS:  [ Rooms ]  [ Flatmates ]
ROOM ROWS (C-01 compact):  thumb · rent · locality · freshness revalidated
        expired → "expired 4d ago" + [Similar rooms] link
FLATMATE ROWS (C-02 compact):  mini card · score · opted-out mark if any
        swipe → remove (or overflow remove)
[Compare] (V1: select 2 rooms → side-by-side sheet)
----------------------------------------
EMPTY (per tab):  "Nothing saved yet — tap the heart on any card"
                  [ ( Browse rooms ) ] / [ Find flatmates ]
----------------------------------------
BOTTOM NAV (within shell)
```

**5. Components.** Tabs; revalidating row list; remove affordances; empty states (C-05); compare tray (V1).
**6. Content.** Saved rooms with *current* freshness; saved flatmates with current score; clear state labels.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap room row | Detail (state-aware) | S12 |
| Tap flatmate row | Profile | S15 |
| Remove item | Row deleted; undo toast | stay |
| Tap similar-rooms on expired row | Search seeded with similar filters | S11 |

**8. Navigation.** Previous: S10. Next: S12/S15/S11/S14.
**9. Screen states.** Expired/Filled room rows show state + alternatives (EC-12); saved flatmate who later opted out of discovery stays saved but marked; empty per tab with browse CTA.
**10. Rules.** Saved state is revalidated at open — stale data never pretends to be fresh; removal is reversible within the session (undo toast).
**11. Completion.** A user closing the app and returning days later finds their options intact and honestly labelled.


---

## S17 (NM-017) — My Profile (Edit)

**1. Purpose.** Maintain the durable identity asset: basics, lifestyle attributes, verification, visibility.
**2. User.** All authenticated (Profile tab).
**3. Entry.** Nav Profile; S09 return; S10 completeness meter.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  "My profile" · ⋯ (settings → S37)
----------------------------------------
PROFILE HEADER:  photo (tap to change) · name · basics
COMPLETENESS METER + "what's missing" line
LIFESTYLE BLOCK:  10 attributes as chips · [Edit] (same pickers as S09 step 5)
ABOUT:  blurb ≤300 chars, plain text only (contact patterns blocked inline)
VERIFICATION CARD:  tier chip + date · [ Verify / Upgrade → S19 ]
VISIBILITY:  [Preview public view → S28]  [Privacy controls → S38]
----------------------------------------
BOTTOM NAV:  … · Profile (active)
```

**5. Components.** Photo uploader; attribute pickers; completeness meter; verification card; blurb editor with pattern guard; links row.
**6. Content.** Current identity and lifestyle state; what each attribute is used for (scoring); verification status and its benefit; privacy shortcuts.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Edit any section | Inline save confirmation; completeness updates | stay |
| Edit lifestyle | Matches flagged "updating" (async recompute ≤60s) | stay |
| Tap Verify / Upgrade | — | S19 |
| Tap Preview | Exact public projection | S28 |
| Type contact info in blurb | Warning + pattern block (no phone/email/URL) | stay |
| Remove photo while ID-verified | Warning: verification may need refresh | stay |

**8. Navigation.** Previous: tab root. Next: S19, S28, S38, S18, S37.
**9. Screen states.** Incomplete-profile prompts; async "matches updating" banner; photo-removal warning for T2 users; contact-pattern block.
**10. Rules.** Lifestyle edits recompute compatibility everywhere the score appears; the blurb never carries contact info (platform-protective pattern check, not censorship); profile is the single source feeding cards, chat headers, and previews.
**11. Completion.** Changes save without a full-page submit; the profile the user sees here is provably the profile others see (via S28).

---

## S18 (NM-018) — Preferences (Edit)

**1. Purpose.** Evolve must-haves and nice-to-haves as the search matures.
**2. User.** Seeker.
**3. Entry.** S17, S14 chips, S11 empty state, S24 re-confirm deep link.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Preferences"
----------------------------------------
MUST-HAVES (hard filters) — each with plain-language consequence:
  [x] Women-only flat     "we'll only show you women-only homes"
  [x] Veg kitchen · [ ] Non-smoking · [ ] No pets · …
NICE-TO-HAVES (soft scoring):  preferred pick per attribute
BUDGET & MOVE-IN:  synced with onboarding values
ALERT TOGGLE (V1):  notify me about new matches
[Reset to onboarding answers]        [ ( Update preferences ) ]
----------------------------------------
(no bottom nav — push screen)
```

**5. Components.** Must-have toggle cards with consequence lines; soft-preference pickers; budget/move-in editors; reset; primary CTA.
**6. Content.** Hard vs soft separation made explicit; consequences in plain language; current budget/move-in.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Toggle must-have | Hard filter set updated | stay |
| Update nice-to-haves | Scoring preferences updated | stay |
| Tap "Update preferences" | Saved → toast "Matches updating"; rankings change on next load (async ≤60s) | back |
| Move-in date in past | Auto re-confirm prompt (EC-24) | inline |
| Reset | Onboarding answers restored | stay |

**8. Navigation.** Previous: source screen (S17/S14/S11/S24). Next: back (matches recompute).
**9. Screen states.** Stale-preference prompt (EC-24); low-match info line when must-haves are extremely restrictive; saving state.
**10. Rules.** Must-haves always bind discovery before ranking; changing preferences triggers recompute everywhere scores display (async, honest banner, never silent).
**11. Completion.** Preference changes visibly improve or honestly explain match quality on the next feed view.

---

## S19 (NM-019) — Verification Submission (T2 / T3)

**1. Purpose.** Collect human-verifiable identity evidence — plus ownership proof for owners — with maximum clarity about what happens to documents.
**2. User.** All (seeker T2; owner adds the T3 step).
**3. Entry.** S17/S20 CTAs; S29 (owner, blocking for publish); S31 publish gate.

**4. Functional wireframe**
```text
----------------------------------------
WIZARD FRAME (no bottom nav):  ● ● ○ ○   Step N   [Save draft]
----------------------------------------
STEP 0 CONSENT CARD:  what we collect · who sees it ("only our review team;
        never shown to other users") · retention ("ID deleted after decision")
        [x] I understand       (blocking)
STEP 1 DOCUMENT:  type picker (Aadhaar [masked-number guidance] · PAN · DL ·
        Passport) + upload front/back (or number + photo per type)
STEP 2 LIVE SELFIE:  camera capture with liveness prompt (blink/turn);
        no gallery upload for selfie
STEP 3 (OWNER ONLY, T3) OWNERSHIP PROOF:  utility bill / registered rent
        agreement / society NOC / tax receipt — name+address must match
RECEIPT:  "Submitted — reviewed within 24h, usually faster"
----------------------------------------
[ ( Submit for review ) ]     [support]
```

**5. Components.** Stepper; consent checkbox; document-type guidance (expandable); camera capture; file uploader (≤10MB, JPEG/PNG/PDF); receipt card.
**6. Content.** Plain-language consent (collect → who sees → retention); per-document guidance; liveness instructions; SLA promise.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Complete steps + Submit | Case created; state → Submitted; confirmation email | S20 |
| Save draft | Draft retained; resume anytime | exit |
| Upload fails (network/size/type) | Inline guidance; nothing lost; retry (EC-06) | stay |
| Re-submission (prior rejection) | Reasons prefilled from rejection codes | S20 after submit |
| Tap support | — | S39 |

**8. Navigation.** Previous: source (S17/S20/S29/S31). Next: S20. Camera permission requested only at the selfie step, with purpose copy.
**9. Screen states.** Draft; upload error (EC-06); blurry-detection client hint; rejected-resubmission context (EC-07); unsupported file inline guidance.
**10. Rules.** Uploads encrypted in transit; scanned server-side; stored access-restricted, admin-only with audit; documents deleted 30 days after decision (fraud-appeal window); verification data never appears on any public surface.
**11. Completion.** Every submission produces a receipt and an S20 state; no document is ever lost mid-flow.

---

## S20 (NM-020) — Verification Status

**1. Purpose.** A transparent verification state machine the user can trust.
**2. User.** All.
**3. Entry.** S17 card, S30 gate, notification deep link.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Verification"
----------------------------------------
STATE CARD (one active, honest):
  Not started → [Start verification → S19]
  Submitted / In review → clock + submitted-at + SLA note
  Approved → badge preview (B-3) + "where my badge appears" link
  Rejected → reason code + human-readable fix + [ ( Resubmit ) ]
  Resubmission required → what to fix + [Resubmit]
SLA NOTE:  "reviewed within 24h, usually faster"
(SLA breach >24h → apology banner + auto-priority)
[Contact support → S39]
----------------------------------------
(no bottom nav — push screen)
```

**5. Components.** State card; reason + fix panel; resubmit CTA; support link.
**6. Content.** Current state, timestamps, expectations, and on rejection: exactly what to fix.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap Resubmit | — | S19 (prefilled) |
| Tap "Where my badge appears" | Badge placement explainer | modal |
| Tap support | — | S39 |
| Pull to refresh | State re-fetched | stay |

**8. Navigation.** Previous: S17/S30/notification. Next: S19, S39.
**9. Screen states.** Full machine: not started / submitted / in review / approved / rejected(reason) / resubmission required / cooling (7-day, date shown, EC-07) / SLA-breach apology (EC-04).
**10. Rules.** Rejections always carry a reason code + fix — never a bare "rejected"; second rejection starts a visible 7-day cooling period; SLA breach is admitted honestly and escalates priority on the admin queue.
**11. Completion.** The user always knows where their verification stands and what happens next — the state they see is the state the admin sees.

---

## S21 (NM-021) — Connections

**1. Purpose.** The state home for introductions: requests received and sent, with actions.
**2. User.** All.
**3. Entry.** S10 pill, S24 deep link, nav.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Connections"
----------------------------------------
TABS:  [ Received (2) ]  [ Sent (1) ]
RECEIVED ROWS:  requester mini-card · context anchor ("about: 2BHK in HSR")
        · score band if available · time · intro-note preview
        [ Accept ]  [ Decline ]
SENT ROWS:  status chip (pending · accepted · declined · expired 14d) [Withdraw]
----------------------------------------
EMPTY:  "No requests yet" + tips (complete profile · verify ID) + [Discover people]
BOTTOM NAV (Chats tab badge mirrors pending count)
```

**5. Components.** Tabs; request rows with context anchor; accept/decline/withdraw actions; counts; empty state with improvement tips.
**6. Content.** Who wants to connect, about what (room/profile anchor), fit score when computable, when; what happened to sent requests.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Accept (received) | Connection accepted; chat opens with anchor | S23 |
| Decline (received) | Silent to sender; optional reason; 90-day re-request cooldown (EC-08) | stay, row clears |
| Withdraw (sent) | Request removed | stay |
| Tap requester card | Masked profile | S15 |
| Tap expired row | Shows expired state honestly | stay |

**8. Navigation.** Previous: S10/S24. Next: S23 (accept), S15 (view).
**9. Screen states.** Empty (tips); expired requests (14-day auto-expire, labelled); duplicate request prevented (EC-10); requests from blocked users never render.
**10. Rules.** Decline is silent — the sender is never notified and cannot re-request for 90 days; requests expire after 14 days; accept is the only door to chat.
**11. Completion.** Every request has a visible state and a defined action; no request can be silently lost.

---

## S22 (NM-022) — Chat List

**1. Purpose.** Reach active conversations fast, with context.
**2. User.** All (Chats tab).
**3. Entry.** Nav Chats, S24 deep link.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  "Chats" · 🔔 · 🔍
----------------------------------------
[weekly safety notice row — max 1/week]:
  ⚑ "Never pay before seeing the room → tips" (→ S26)
CHAT ROWS:  avatar · name (masking policy) · context chip ("HSR room" ·
        "flatmate") · last-message preview · time · unread dot + count
        frozen row (active safety case) → lock icon + explanation
        deleted counterparty → "Deleted account" (read-only, 30d retention)
----------------------------------------
EMPTY:  "No conversations yet — connect with someone first"
        [ ( Discover people ) ]  [ Browse rooms ]
BOTTOM NAV:  … · Chats (active)
```

**5. Components.** Row list with context chips; search; safety notice row; empty states.
**6. Content.** Conversations with who/what anchor, last message, recency, unread state.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap row | Thread | S23 |
| Search chats | Filtered list | stay |
| Row overflow → report | — | S27 |

**8. Navigation.** Previous: tab root. Next: S23, S26, S27.
**9. Screen states.** Empty (CTA); frozen pair (lock + reason, read-only); deleted counterparty (read-only row, EC-13).
**10. Rules.** Chat is one tap from anywhere (bottom nav) — safety posture depends on in-app chat being the path of least resistance; context chips persist so no conversation is ever anonymous.
**11. Completion.** Unread counts are accurate everywhere (list, tab badge); every row opens to a context-anchored thread.

---

## S23 (NM-023) — Chat Thread

**1. Purpose.** The safe conversation surface — the heart of the privacy and safety posture.
**2. User.** All (connected parties only).
**3. Entry.** S22, S21 accept, S12 "Open chat", notifications.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · counterparty mini-card + anchor ("2BHK in HSR")
          · badge · ⋯ (Share phone number · View listing/profile · Report · Block)
----------------------------------------
SYSTEM CARDS (platform voice, visually distinct):
  ⚑ intro + anchor summary + 3 suggested questions
  ⚑ meet-safe tips card (pre-visit)
  ⚑ "payments are not supported on NestMate" (on payment-pattern detection)
MESSAGE STREAM:  text · images (≤3 per message) · system cards
  phone/email/URL in text → auto-masked "hidden number" pill (always)
REVEAL FLOW (in-thread, C-04):
  ⚑ Share phone numbers?  what is shared: number only · with whom: this person
  [ I'll share my number ]   [ Not now ]      ← BOTH must consent
  on both consent → numbers render once + pre-meet safety card
----------------------------------------
COMPOSER:  [text] [📷] [ ( Send ) ]   typing indicator
           failed message → inline retry/delete
```

**5. Components.** Context header; system cards; message stream with masking; consent card (C-04); composer with attachment; report/block overflow.
**6. Content.** Anchor context (which room/profile), badges, suggested first questions, safety guidance at the right moments (pre-meet, payment-pattern).
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Send message | Delivered <1s (optimistic UI; failure → retry/delete) | stay |
| Attach image | Scanned, size-capped, ≤3 per message | stay |
| Type a phone/URL/email | Auto-masked in render (both sides) | stay |
| Tap "Share phone number" | Consent card (C-04) | both consent → reveal + safety card; decline → CTA hidden 7 days (EC-19) |
| Report / Block | — | S27 (block severs platform contact) |

**8. Navigation.** Previous: S22/S21/S12. Next: S27; external meeting after reveal. Back preserves scroll.
**9. Screen states.** Empty pre-thread (intro + suggestions); send-failure retry (EC-17); realtime drop → poll fallback; frozen pair → read-only banner (active safety case); counterparty deleted → read-only (EC-13); rate limit 10 msgs/min.
**10. Rules.** Only connected parties have threads; numbers/emails/URLs are masked server-side — reveal happens *only* via mutual consent, once, logged; simultaneous reveal requests from both sides dedupe into one consent flow (EC-18); messages are not deletable for the counterparty post-reveal (safety trail); no E2E-encryption claims — honest posture.
**11. Completion.** Two connected users can move from introduction to agreement to a revealed, safety-briefed phone call — entirely inside one coherent surface.


---

## S24 (NM-024) — Notifications Center

**1. Purpose.** One notification state home — catch everything that needs me.
**2. User.** All.
**3. Entry.** Top-bar bell (with unread badge), deep links.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Notifications" · [Mark all read]
----------------------------------------
GROUP:  Today
  ROW:  icon · title · body · time · unread dot → tap target
    (connection request · request accepted/declined · new message ·
     verification status · listing approved/expiring/renewal due ·
     applicant activity digest (owner, daily) · moderation/report outcomes)
GROUP:  This week
  …
----------------------------------------
EMPTY:  "You're all caught up"  [ ( Explore matches ) ]
BOTTOM NAV (within shell)
```

**5. Components.** Grouped reverse-chronological list; unread dots; per-row deep links; mark-all-read; muted-category hint.
**6. Content.** Every notification names the object (room, person, case) and the action available; self-triggered actions never notify.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap row | Deep link to the object: S21 row / S23 thread / S34 stage / S20 status | target |
| Object gone at tap-time | State banner (not a 404) + nearest healthy screen (EC-12) | state view |
| Mark all read | Badge clears | stay |
| Tap settings | — | S25 |

**8. Navigation.** Previous: any (bell is global). Next: per-object targets above.
**9. Screen states.** Empty ("caught up"); expired-object taps degrade to state banners; deleted actor renders as "a user" (EC-13).
**10. Rules.** One center, not scattered toasts; every notification deep-links to the object with expiry-aware fallback; channel defaults follow S25 (safety notices always on).
**11. Completion.** A user who ignores the app for two days can reconstruct everything important from this one screen.

---

## S25 (NM-025) — Notification Settings

**1. Purpose.** Anti-spam control: choose what pings, on which channel.
**2. User.** All.
**3. Entry.** S37, S24.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Notifications"
----------------------------------------
MATRIX (event groups × channels [In-app / Email]):
  Connections & messages     in-app always on (new-message floor: digest)
  Verification & account     [x] [x]
  Listing & applicant ops    [x] [x]
  Safety notices             ALWAYS ON (locked, with explanation)
  Tips                       [ ] off by default
----------------------------------------
(auto-save on toggle; no submit button)
```

**5. Components.** Event × channel matrix; locked rows with explanation; auto-save toggles.
**6. Content.** Each group states what it covers; the locked safety row explains why it cannot be disabled (enforcement notices reach you).
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Toggle any unlocked cell | Saved instantly | stay |
| Tap locked row | Explanation sheet | modal |

**8. Navigation.** Previous: S37/S24. Next: back.
**9. Screen states.** Default only; toggles reflect server state on load.
**10. Rules.** Safety notices are non-disableable; message notifications never drop below daily-digest while a connection is active.
**11. Completion.** Users trust notifications because they control them — and spam never accumulates.

---

## S26 (NM-026) — Safety Center (Authenticated)

**1. Purpose.** Safety literacy + action entry available at decision moments.
**2. User.** All authenticated.
**3. Entry.** S04 (logged-in variant), chat safety cards, S27 confirmation, S37.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Safety"
----------------------------------------
SECTION:  Meet-safe checklist (public place · daytime first visit ·
          share live location with family · never pay before seeing the room)
SECTION:  Document safety (never share your full ID over chat — it's masked anyway)
SECTION:  How verification works (T0→T3) · what badges mean
SECTION:  How reporting works (safety reports reviewed <12h) · what blocking does
SECTION:  Emergencies:  "NestMate is not an emergency service — local police links"
[ ( Report a problem ) ]   ← primary CTA
----------------------------------------
(no bottom nav — push screen)
```

**5. Components.** Sectioned article; primary report CTA; links to related surfaces.
**6. Content.** Actionable safety guidance matched to Bangalore-specific scam patterns; expectations for reports; the honest platform-boundary disclaimer.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap "Report a problem" | — | S27 |
| Tap section links | Deep views | stay/S39 |

**8. Navigation.** Previous: S04/S23/S27/S37. Next: S27, S39.
**9. Screen states.** Static content; Loading/Error `[G]`.
**10. Rules.** Copy is shared with S04 (one source, two surfaces); guidance appears contextually (chat cards) not just here; the platform never poses as emergency services.
**11. Completion.** A worried user is never more than two taps from "what do I do" and "how do I report".

---

## S27 (NM-027) — Report / Block Flow

**1. Purpose.** Structured escalation that makes the reporter feel heard and triggers real protections.
**2. User.** All (guests: listing-scoped via S04 form).
**3. Entry.** Overflow menus on profiles, cards, listings, chat; S26.

**4. Functional wireframe**
```text
----------------------------------------
WIZARD FRAME (no bottom nav):  Step N of 4
----------------------------------------
STEP 1 TARGET:  auto-attached (user / listing / message) — read-only chip
STEP 2 REASON:  Scam or fraud · Harassment or abuse · Fake profile/listing ·
        Inappropriate content · Off-platform payment request ·
        Safety concern · Other
STEP 3 DETAILS:  free text + optional evidence screenshot upload
STEP 4 BLOCK:  [x] Also block this person (default ON vs counterparty)
[ ( Submit report ) ]                    [Block only]  [Cancel]
----------------------------------------
CONFIRMATION:  ✓ Report received · reference ID
               "Safety reports are reviewed within 12h"  [Safety tips → S26]
```

**5. Components.** Stepper; reason picker; evidence uploader; block toggle; confirmation card with reference ID.
**6. Content.** Auto-attached target; plain-language reasons; expectation-setting (SLA); reference ID.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Submit report | Case created with auto-protections per severity (safety-class: pair freeze / listing unlist while pending) | confirmation → S26 |
| Toggle block + submit | Block executes immediately — severs all platform contact | confirmation |
| Block only | Block without a case | back |
| Re-report same object | Deduped: "already under review" (EC-09) | stay |
| Report own listing | Prevented | inline |

**8. Navigation.** Previous: source screen. Next: S26 (confirmation link). Cancel returns with nothing sent.
**9. Screen states.** Dedupe (EC-09); self-report block; guest variant (listing-scoped); upload error `[G]` non-destructive.
**10. Rules.** Report content is never shown to the reported user; evidence is access-restricted and purged with the case; the reporter always receives a closure notification with the outcome (no other-party details); block is mutual invisibility, everywhere.
**11. Completion.** Every report yields: reference ID → immediate protections where applicable → admin case → closure notice. No report enters a void.

---

## S28 (NM-028) — Profile Public Preview

**1. Purpose.** Privacy confidence: see yourself exactly as others do.
**2. User.** All authenticated.
**3. Entry.** S17, S38.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Preview" · [Adjust visibility → S38]
----------------------------------------
RENDERED PROFILE (exact visitor projection):
  photo (blurred if enabled) · first name/initials per setting
  badge row · attribute chips (private fields masked as they'd be)
  about blurb
ANNOTATION TOGGLES (overlay):
  [x] show "visible to connections only" markers
----------------------------------------
(no bottom nav — push screen)
```

**5. Components.** Faithful profile renderer (same components as S15); annotation overlay toggle; adjust CTA.
**6. Content.** The profile, unmodified by owner privilege — what a stranger sees is what renders here.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Toggle annotations | Markers reveal/hide | stay |
| Tap "Adjust visibility" | — | S38 |

**8. Navigation.** Previous: S17/S38. Next: S38.
**9. Screen states.** Default; incomplete-profile variant (shows what's missing publicly).
**10. Rules.** The preview uses the same rendering path as real profile views — no "special" preview logic that could drift from reality.
**11. Completion.** The user can verify there is no over-exposure; any surprise is fixable in one tap (S38).


---

## S29 (NM-029) — Owner Onboarding Wizard

**1. Purpose.** Establish owner identity and intent; set the verification expectation early.
**2. User.** New owner (landlord or owner-flatmate), incl. "Both" users adding owner mode.
**3. Entry.** S08 ("I have a room"); S37 role add.

**4. Functional wireframe**
```text
----------------------------------------
WIZARD FRAME (no bottom nav):  ● ● ● ●   Step N of 4   [Save & exit]
----------------------------------------
STEP 1 OWNER TYPE:  "I live here and have a spare room" (owner-flatmate)
        vs "I own/manage the property" (landlord)   ← changes later copy
STEP 2 PROPERTY BASICS:  locality · flat type · rooms total / occupied
STEP 3 EXPECTATIONS PREVIEW:  who you're looking for — limited ethical set
        (gender composition of flat · veg/non-veg household · non-smoking)
        "seekers see this on your listing"
STEP 4 VERIFICATION EXPLAINER:  "To publish, every owner verifies identity
        + room control. Human review <24h."  badge gallery
[ Why verify? → S04 ]           [ ( Start verification ) ]
```

**5. Components.** Card selectors; stepper; explainer card with badge gallery (C-06).
**6. Content.** Two owner paths; property basics; the limited expectations set (owners declare household norms — they never filter applicants by protected attributes); the verification promise.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Complete steps + "Start verification" | Owner profile saved | S19 (owner variant: T2+T3) |
| Save & exit | Draft kept | S30 (resume banner) |
| Tap "Why verify?" | Trust explainer | S04 (returns) |

**8. Navigation.** Previous: S08. Next: S19. Resume: exact step (EC-01); existing listing draft detected → offer resume.
**9. Screen states.** Draft resume; verification-explainer gate; owner-flatmate vs landlord copy variants.
**10. Rules.** Expectations use only the approved ethical set; verification is framed as the *requirement for publishing* — non-negotiable but explained, not surprising.
**11. Completion.** The owner understands what publishing will require before investing effort; their property basics survive abandonment.

---

## S30 (NM-030) — Owner Dashboard

**1. Purpose.** The owner command center: what needs attention, act in one tap.
**2. User.** Owner (mode: offering).
**3. Entry.** Nav Dashboard (owner mode); login default for owners.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  "Dashboard" · mode chip (Both users) · 🔔 · ⋯
----------------------------------------
UNVERIFIED? → banner: "Verify to publish — <24h review" → S19
ATTENTION STRIP (SLA-flavoured, priority-ordered):
  ⚑ "3 new applicants"  → S34
  ⚑ "2 chats awaiting reply"  → S22
  ⚑ "Listing expires in 3 days — renew"  → S32
LISTING CARDS:  state chip · freshness stamp · views/saves/connects
RESPONSE-RATE METER:  "You reply in ~4h — Top responder"
PIPELINE QUICK-GLANCE:  counts by stage → S34
[ ( + New listing ) ]
----------------------------------------
BOTTOM NAV:  Dashboard · Listings · Applicants(badge) · Chats · Profile
```

**5. Components.** Attention strip; listing summary cards; analytics mini-stats; response-rate meter; CTAs per card.
**6. Content.** Ordered by urgency: applicants → replies → expiry; per-listing health; the owner's own reputation (response rate).
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap attention item | Respective surface | S34/S22/S32 |
| Tap listing card | Detail | S33 |
| Tap "New listing" | Wizard (verification gate behind publish) | S31 |
| Tap renew on an expiring card | One-tap renewal (+30d); stamp updates | stay |
| Switch mode (Both) | Nav + home swap; state preserved | seeker shell |

**8. Navigation.** Previous: login. Next: S31/S32/S33/S34/S22/S19.
**9. Screen states.** No listings: "Publish your first room" walkthrough CTA. No applicants: expectation-setting ("Applicants usually arrive within 48h of a fresh listing"). Expired card: renew CTA (EC-12). Removed-by-moderation card: state + reason (EC-21).
**10. Rules.** The dashboard surfaces attention items; it never hides an expiring listing behind a menu; response-rate is shown honestly (it's the owner's reputation).
**11. Completion.** An owner can run their entire rental operation from this screen in under a minute a day.

---

## S31 (NM-031) — Listing Creation Wizard

**1. Purpose.** Produce a structured, honest, attractive listing in one guided flow.
**2. User.** Owner (publish gated on T3).
**3. Entry.** S30, S32 "New", post-verification success.

**4. Functional wireframe**
```text
----------------------------------------
WIZARD FRAME (no bottom nav):  ● ● ● ● ● ●  Step N of 6   [Save draft]
----------------------------------------
STEP 1 ROOM BASICS:     type · furnishing · size · bathrooms · floor
STEP 2 PHOTOS:          min 3 · max 10 · cover select · reorder
                        "bright, daytime, real rooms — listings with 5+
                        photos get ~2× connects"
STEP 3 RENT & TERMS:    rent · deposit (MANDATORY) · maintenance included?
                        notice period · move-in date · tenancy duration
STEP 4 AMENITIES & RULES:  amenity chips · house rules ≤500 chars
                        (contact patterns blocked)
STEP 5 OCCUPANCY:       current occupants + gender composition · household
                        lifestyle (limited ethical set: dietary · smoking ·
                        pets · guests)
STEP 6 LOCATION:        locality select + approximate pin
                        (exact address is NEVER entered — shared in chat later)
→ REVIEW (live preview card, seeker projection)
[Preview as seeker]                    [ ( Publish listing ) ]
----------------------------------------
PUBLISH GATE:  no T3 → interstitial "Verify to publish" → S19
SUCCESS:  "Usually approved instantly; flagged ones reviewed <12h" → Active
```

**5. Components.** Stepper (C-08); photo uploader with quality hints and cover picker; sliders; chip multi-selects; live preview; validation inline.
**6. Content.** All six step groups; photo guidance; deposit mandatory with reason ("hidden deposits are the #1 scam pattern"); ethical expectations set; address-privacy explanation.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Complete steps → Publish | Auto-checks run → Active (or Pending if flagged) | S30 (success card) |
| Save draft | Draft retained; resume at exact step | S30 |
| Publish without T3 | Verification interstitial (never a silent block) | S19 |
| Duplicate detected | Warning sheet: merge / replace / publish anyway (admin reviews if published) (EC-11) | sheet |
| Preview as seeker | Public projection render | preview |

**8. Navigation.** Previous: S30/S32. Next: publish → S30; S19 (gate). Draft resume exact-step (EC-01).
**9. Screen states.** Per-step inline validation (EC-16); draft; gate interstitial; pending-review; success card; duplicate sheet.
**10. Rules.** Deposit is mandatory on every listing; exact address is never a field (privacy architecture, not an oversight); photos ≥3 to publish; house rules text pattern-checked for contact info (anti-bypass, EC-22).
**11. Completion.** A first-time owner publishes a complete, honest listing in one sitting — and understands exactly why each field exists.

---

## S32 (NM-032) — Listings Management

**1. Purpose.** Keep inventory truthful: all listings, lifecycle states, expiry nudges.
**2. User.** Owner.
**3. Entry.** S30, nav Listings.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  "Listings" · [ ( + New ) ]
----------------------------------------
ROW (sorted by attention):  thumb · title · state chip
  [Active] [Paused] [Expiring in 3d] [Expired] [Filled] [Removed]
  freshness "confirmed 2d ago" · views/saves/connects mini · last activity
  ROW QUICK ACTIONS:  Renew (expiring/expired, one tap) · Pause/Resume ·
                      Mark filled (shortcut) · ⋯
AUTO-PAUSED ROW (>45d):  "paused automatically — revive?" + explainer
----------------------------------------
EMPTY:  "No listings yet"  [ ( Create your first listing ) ]
BOTTOM NAV (Listings active)
```

**5. Components.** Attention-sorted row list; state chips; quick actions; empty state.
**6. Content.** Every listing with its true state and freshness; attention ordering puts expiring/expired first.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap row | Detail | S33 |
| Tap Renew | +30 days; freshness stamp resets; confirm toast | stay |
| Pause / Resume | State changes; paused = not searchable, URL shows paused state | stay |
| Mark filled (shortcut) | Confirm sheet → fill cascade | stay |
| Tap + New | Wizard | S31 |

**8. Navigation.** Previous: S30. Next: S33, S31.
**9. Screen states.** Empty; expiring (3-day nudge); expired (renew CTA); auto-paused with revive explainer (45-day rule); >2 consecutive expiries → quality nudge (photo/description tips); removed-by-moderation with reason (EC-21).
**10. Rules.** Freshness lifecycle: Day-27 nudge → Day-30 expiry unless renewed → one-tap renewal → 45 days no confirmation = auto-pause → revive or expire; every state transition is visible here the day it happens.
**11. Completion.** No listing can silently rot: the owner sees state, freshness, and the one-tap fix at all times.

---

## S33 (NM-033) — Listing Detail (Owner View)

**1. Purpose.** Per-listing control: public view + analytics + lifecycle actions.
**2. User.** Owner.
**3. Entry.** S32 row, S30 card.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · Edit · ⋯ (share public card · remove)
----------------------------------------
PUBLIC VIEW PANEL:  identical projection to S12 (what seekers see)
OWNER PANEL:
  STATE + freshness controls:  [Renew] [Pause/Resume] [Mark as Filled]
  ANALYTICS:  views · saves · connects · connect→chat rate (7/30-day)
  MODERATION STATUS:  "Flagged — under review" (when applicable)
  APPLICANT SUMMARY:  counts by stage → S34
  DANGER ZONE:  Remove (confirm + reason)
----------------------------------------
(no bottom nav — push screen)
```

**5. Components.** Dual-view (public projection + owner panel); analytics block; stage summary; state actions; danger zone.
**6. Content.** The listing as seekers see it; its real performance numbers; moderation state; applicant funnel at a glance.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Renew / Pause / Resume | State changes; stamp updates | stay |
| Mark as Filled | Confirm sheet → F-036 fill cascade (listing hidden everywhere; other applicants politely closed) | S34 closed state |
| Edit | Listing editor (wizard prefilled) | S31 edit mode |
| Remove | Confirm + reason; listing removed | S32 |
| Share | Public-safe card | WhatsApp/DM |

**8. Navigation.** Previous: S32/S30. Next: S34, S31 (edit), S32 (back).
**9. Screen states.** Flagged/under-review banner; removed-by-moderation state + reason + appeal link (EC-12); expired state.
**10. Rules.** Owner panel never alters the public projection's masking; Mark-Filled is the *only* honest way off the market (never just "pause and forget"); moderation actions override owner state and are explained with reasons.
**11. Completion.** The owner always sees what seekers see plus why the listing performs as it does.

---

## S34 (NM-034) — Applicant Pipeline

**1. Purpose.** The queue-with-context that replaces inbox chaos: every applicant, every stage, nothing lost.
**2. User.** Owner.
**3. Entry.** S30, nav Applicants, S33 summary.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Applicants" · listing selector (if multiple)
----------------------------------------
SLA HINT:  "responding within 24h keeps your response rate high"
STAGE BOARD (horizontal columns / segmented list):
  New (N) → Shortlisted → Chatting → Met → Selected → Moved in
  terminal (collapsed):  Rejected · Withdrawn
APPLICANT CARDS per stage:  photo · first name · badges · score band vs
  household · rent-fit chip · move-in date · 1-line why-this-match
  New cards:  [Shortlist] quick action
FILTERS:  verified only · score band · search
LISTING EXPIRED → banner; pipeline read-only except close-out (EC-12)
----------------------------------------
EMPTY:  "Applicants arrive when your listing is fresh — renew now"
BOTTOM NAV (Applicants active, badge = New count)
```

**5. Components.** Stage board; applicant cards; quick stage-move; bulk-decline (after fill); filters; listing selector.
**6. Content.** Applicants grouped by stage with decision-relevant facts (score vs household, rent fit, move-in); response-rate nudge.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap card | Detail with stage actions | S35 |
| Shortlist (New card) | Card moves to Shortlisted | stay |
| Open chat from card | Thread anchored to applicant | S23 |
| Decline | Polite auto-notice; collapsed terminal state | stay |
| (After fill) bulk-decline New | All remaining New applicants politely closed (F-036) | stay |

**8. Navigation.** Previous: S30/S33. Next: S35, S23.
**9. Screen states.** Empty (renew hint); expired-listing read-only (EC-12); withdrew applicants collapsed (EC-08); concurrent stage moves idempotent (EC-26).
**10. Rules.** Stages: New → Shortlisted → Chatting → Met → Selected (→ Moved in); every stage move is one tap; the pipeline is the system of record — chats, notes, and decisions hang off it; fill cascades auto-close others politely.
**11. Completion.** An owner can run five applicants through decision without a spreadsheet — and seekers never get ghosted silently (polite auto-notices).

---

## S35 (NM-035) — Applicant Detail & Compare

**1. Purpose.** Decision-quality evaluation of one candidate, plus side-by-side comparison.
**2. User.** Owner.
**3. Entry.** S34 card.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Applicant" · ⋯
----------------------------------------
PROFILE (read-only variant of S15):  photo · name · badges · attributes
COMPATIBILITY BLOCK vs HOUSEHOLD:
  "You'd match Priya 82 · Rohit 74 — household 78"  (per-person breakdown)
TIMELINE:  requested → chatted → met
PRIVATE NOTES (owner-only field, timestamped)
COMPARE TRAY:  [Add to compare] (≤3) → side-by-side table:
  score · rent-fit · move-in · verification · key attributes
----------------------------------------
STAGE ACTIONS:  [Shortlist] [Mark met] [ ( Select ) ] [Decline]
                [Open chat]
----------------------------------------
SELECT → confirm sheet → fill cascade (F-036)
```

**5. Components.** Read-only profile; household compatibility block; timeline; private notes; compare tray; stage action bar.
**6. Content.** Everything needed to say yes or no: fit vs *each* existing occupant, interaction history, the owner's own notes, honest comparison across candidates.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Stage action | State machine move (idempotent, EC-26) | S34 (updated) |
| Select | Confirm sheet → fill cascade: listing Filled; other applicants politely declined; seeker-side saved rows show Filled | S33 Filled |
| Add note | Saved privately (never shown to applicant) | stay |
| Add to compare | Tray fills; side-by-side renders | modal |
| Open chat | Thread | S23 |

**8. Navigation.** Previous: S34. Next: S23, S34, S33.
**9. Screen states.** Applicant withdrew (terminal, collapsed on return, EC-08); select-confirmation; compare capacity (≤3).
**10. Rules.** Selecting is consequential and confirmed — it closes the listing and notifies others; notes are owner-private; the fill cascade is transactional (no half-filled states).
**11. Completion.** The owner makes a defensible decision with evidence in front of them — and the platform executes the closing steps for them.

---

## S36 (NM-036) — Owner Profile (Edit)

**1. Purpose.** Owner identity that reads trustworthy to seekers: who you are, what you own, how you respond.
**2. User.** Owner.
**3. Entry.** Nav Profile (owner mode).

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  "Owner profile" · ⋯ (settings → S37)
----------------------------------------
HEADER:  photo · name · member-since · badge row (incl. [✓ Owner verified])
OWNER TYPE:  owner-flatmate / landlord (from S29)
PROPERTIES LIST:  locality + rooms per property
HOUSEHOLD LIFESTYLE SUMMARY:  what seekers see (limited ethical set)
RESPONSE-RATE TIER:  "You reply in ~4h — Top responder"
VERIFICATION CARD:  tier + date · [Upgrade → S19]
[Preview as seeker → S28 variant]
----------------------------------------
BOTTOM NAV:  … · Profile (active, owner shell)
```

**5. Components.** Badge row; properties list; lifestyle summary; response meter; sectional save.
**6. Content.** Identity, properties, household norms, responsiveness — the four things seekers judge owners on.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Edit any section | Sectional save; completeness updates | stay |
| Tap Upgrade | — | S19 |
| Tap Preview | Seeker-eye view | S28 variant |

**8. Navigation.** Previous: tab root. Next: S19, S28, S37.
**9. Screen states.** Unverified prompts; incomplete-property hints; completeness meter.
**10. Rules.** The profile shown here is exactly what seekers see on owner cards and listing details; response-rate is computed by the platform, never self-declared.
**11. Completion.** An owner's trust surface is complete, current, and honest — and linked to every listing they publish.


---

## S37 (NM-037) — Settings

**1. Purpose.** The account hub: every control not tied to daily usage lives here.
**2. User.** All.
**3. Entry.** Nav Profile → Settings (via ⋯).

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Settings"
----------------------------------------
ACCOUNT:  phone (masked) · [Change number → re-OTP flow] · email (V1.1)
ROLES:  current roles · [Add owner/seeker mode → S08 upgrade path]
VERIFICATION:  tier chip · [Manage → S20]
NOTIFICATIONS → S25
PRIVACY → S38
LANGUAGE:  English (locked) — "more soon"
LEGAL:  ToS · Privacy Policy (versioned)
SUPPORT → S39
DANGER ZONE (red, last):  Deactivate / Delete account → S40
----------------------------------------
(no bottom nav — push screen)
```

**5. Components.** Sectioned list; masked values; role-add row; danger zone styled distinctly.
**6. Content.** Current account facts; entry points to every control surface; legal versions.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Change number | Dual-OTP flow (old + new); old sessions revoked; never creates a duplicate account (EC-02) | OTP flow |
| Add role | S08 upgrade variant (no re-signup); safe mid-flow: mode switch never touches active chats or drafts (EC-25) | S08 |
| Tap any section row | Navigate | S25/S38/S20/S39/S40 |

**8. Navigation.** Previous: profile. Next: listed targets above.
**9. Screen states.** Default; phone-change flow states; post-deletion notice handled at S05 (guard).
**10. Rules.** One home per control (no duplicates elsewhere); language is locked at MVP (honest "more soon", no fake selector).
**11. Completion.** Every account-level control is reachable within two taps from here.

---

## S38 (NM-038) — Privacy & Visibility Controls

**1. Purpose.** User-owned privacy: decide exposure precisely, see consequences inline.
**2. User.** All.
**3. Entry.** S37, S28.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Privacy" · [Live preview → S28]
----------------------------------------
PHOTO:      ( ) Everyone (auth)  ( ) Connections only  ( ) Blurred until connect
NAME:       ( ) First name only  ( ) Initials
LIFESTYLE:  per-attribute visibility toggles
            (must-haves always APPLY; hiding them only hides display)
DISCOVERY:  [x] Appear in Flatmate Discovery
            (off = excluded from feed; still reachable via direct link + listings)
ACTIVE STATUS: [x] Show "active recently"
each control: one-line consequence · auto-save
----------------------------------------
(no bottom nav — push screen)
```

**5. Components.** Segmented controls; per-attribute toggles; consequence microcopy; preview link; auto-save.
**6. Content.** Every control with its exact effect; the discovery opt-out explained honestly (feed exclusion ≠ invisibility).
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Change any control | Saved instantly; projections update | stay |
| Turn discovery off with pending requests | Pending requests remain pending (state preserved) | stay |
| Tap Live preview | — | S28 |

**8. Navigation.** Previous: S37/S28. Next: S28.
**9. Screen states.** Default; consequence hints; pending-requests note on opt-out.
**10. Rules.** Changes apply everywhere the affected data renders (cards, feeds, chat headers) — one control, all surfaces; must-haves apply as filters regardless of display visibility.
**11. Completion.** The user can make themselves as private as they wish without breaking their active connections.

---

## S39 (NM-039) — Help & Support

**1. Purpose.** Self-serve answers first, human fallback always.
**2. User.** All.
**3. Entry.** S37, footer, error states.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Help"
----------------------------------------
FAQ TOPICS:  verification · freshness/renewal · deposits · contact reveal ·
             reports & safety · account (seeded from trust/safety content)
CONTACT FORM:  topic picker · message · [ ( Send ) ]
SAFETY EMERGENCIES BAND → S26
----------------------------------------
(no bottom nav — push screen)
```

**5. Components.** FAQ accordion; topic-picker contact form; safety band.
**6. Content.** The questions that actually occur (verification, freshness, deposits, reveal, reports); honest answers consistent with S04/S26.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap topic | Answer expands | stay |
| Submit form | Ticket created → founder inbox; confirmation | stay (confirmation) |
| Tap emergencies band | — | S26 |

**8. Navigation.** Previous: S37/errors. Next: S26.
**9. Screen states.** Sending; confirmation; error `[G]` non-destructive.
**10. Rules.** Answers never contradict the Safety/Trust centers (single content source); tickets route to a monitored inbox at MVP.
**11. Completion.** Most users self-serve; those who don't get a human response path with a confirmation.

---

## S40 (NM-040) — Account Deactivation / Deletion

**1. Purpose.** A dignified exit — pause or leave cleanly, with honest consequences.
**2. User.** All.
**3. Entry.** S37 danger zone.

**4. Functional wireframe**
```text
----------------------------------------
TOP BAR:  back · "Account"
----------------------------------------
PATH 1 DEACTIVATE:  hides profile + listings · freezes connections ·
        reversible by logging in
PATH 2 DELETE:  14-day grace period · then personal data erased ·
        irreversible
RETENTION SUMMARY:  what is kept, what is erased, when
ALTERNATIVES:  "Just want fewer distractions? Turn off discovery (S38)"
[Deactivate]   [Request deletion]     (both: confirm + reason survey)
----------------------------------------
(no bottom nav — push screen)
```

**5. Components.** Two-path explainer; retention summary; confirm + reason survey.
**6. Content.** Exact consequences of each path; the 14-day grace; the softer alternative.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Deactivate | Account hidden; connections frozen; login restores *exactly* (listings re-validated — expired stays expired, EC-23) | logged-out |
| Request deletion | Grace period starts; login during grace = cancel | logged-out |
| Delete during active safety case | Case continues; account data preserved for the case (legal hold) | state notice |

**8. Navigation.** Previous: S37. Next: logged-out; reactivation via login.
**9. Screen states.** Confirm dialogs; reason survey; legal-hold notice.
**10. Rules.** Reactivation restores exact prior state (EC-23); deletion erases PII per retention rules after grace; counterparty chats survive minus identity (anonymized after 30 days).
**11. Completion.** Leaving is reversible by default, irreversible only by explicit confirmed choice — and nothing is hidden from the user about what happens to their data.

---

## S41 (NM-041) — Admin Login

**1. Purpose.** Hardened entry to the operations console.
**2. User.** Admin (founding team only, ≤2 accounts).
**3. Entry.** Direct `/admin` route — never linked anywhere in the product; noindex.

**4. Functional wireframe**
```text
----------------------------------------
DESKTOP FORM:
  EMAIL · PASSWORD → [Sign in]
  TOTP STEP:  6-digit authenticator code → [Verify]
  failed-attempt lockout · no SMS fallback (TOTP app only)
----------------------------------------
(none of the public shells; separate session realm)
```

**5. Components.** Credential form; TOTP step; lockout messaging.
**6. Content.** Minimal — no product branding funnel, no self-signup.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Sign in + TOTP | Admin session (short TTL, distinct realm, audited) | S42 |
| Fail repeatedly | Lockout; alert | lock state |

**8. Navigation.** Next: S42 only. No password reset without second factor.
**9. Screen states.** Lockout; invalid TOTP; session expiry → re-auth.
**10. Rules.** Separate session realm from the user product; 8-hour TTL; every admin login is audit-logged.
**11. Completion.** Only the two founders can enter; everyone else gets nothing.

---

## S42 (NM-042) — Admin Dashboard

**1. Purpose.** Queue-first operations command: what needs action *now*.
**2. User.** Admin.
**3. Entry.** S41 success.

**4. Functional wireframe**
```text
----------------------------------------
LEFT RAIL (desktop):  Queues (Verifications · Reports · Flags) ·
                      Users · Metrics · Audit tail
----------------------------------------
QUEUE CARDS (with age/SLA breach flags in red):
  VERIFICATIONS:  pending count · oldest age · breach flag
  REPORTS:  by severity (S1 safety · S2 fraud · S3 conduct) · breach count
  MODERATION FLAGS:  auto-flags · duplicates · samples
  USERS:  suspensions pending review
HEALTH STRIP:  active listings · freshness share · response median · report rate
RECENT ADMIN ACTIONS:  audit tail (who did what, when)
----------------------------------------
```

**5. Components.** Queue cards; health strip; audit tail; left rail.
**6. Content.** Everything the founder must act on, ordered by SLA risk; platform health at a glance.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Tap a queue card | — | S43 / S45 / S47 / S48 |
| Tap metric | — | S49 |

**8. Navigation.** Next: all queues. Back: rail.
**9. Screen states.** SLA-breach highlighting; empty-queue states ("all clear").
**10. Rules.** Queue-first (never a vanity dashboard); breaches are visually loud; every admin action everywhere is audited.
**11. Completion.** The founder opens this once a day and knows exactly what to do.

---

## S43 (NM-043) — Verification Review Queue

**1. Purpose.** Execute D-05 human verification review within the 24h SLA — the queue side: cases ordered by risk of breach.
**2. User.** Admin.
**3. Entry.** S42 verification card.

**4. Functional wireframe**
```text
DESKTOP TABLE:
  ROWS:  applicant · tier (T2/T3) · doc type · submitted age (SLA colour)
         · owner-flag (T3) · prior rejections
  FILTERS:  age · tier · type
  [row click → S44]
```

**5. Components.** Filterable queue table; SLA-age colouring; row navigation.
**6. Content.** Every pending case with the facts that pace the review: age, tier, type, history.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Click row | Case opens | S44 |
| Filter (age/tier/type) | Queue narrows | stay |

**8. Navigation.** S42 → S43 → S44 → back to S43.
**9. Screen states.** SLA-breach rows loud (red); empty queue ("all clear").
**10. Rules.** Queue is age-ordered (oldest first); breach cases auto-prioritized (EC-04); counts match the S42 card exactly.
**11. Completion.** The reviewer always works the most-at-risk case first, with zero hunt.

---

## S44 (NM-044) — Verification Case Detail

**1. Purpose.** Checklist-driven review of one verification case and the decision.
**2. User.** Admin.
**3. Entry.** S43 row.

**4. Functional wireframe**
```text
CASE DETAIL:
  SIDE-BY-SIDE:  document images (restricted fetch, "NestMate review"
    watermark) · live selfie · ownership proof (T3: name+address match
    vs listing locality)
  CHECKLIST:  name match (docs+selfie+profile) · face similarity (human,
    zoom) · document authenticity cues · ownership match (T3) ·
    duplicate-image check vs prior verifications
  DECISION PANEL:  [Approve] [Reject (reason code)] [Request resubmission]
                   + mandatory note
```

**5. Components.** Watermarked restricted image viewer; checklist; decision panel with reason codes.
**6. Content.** All evidence side-by-side; the review checklist as explicit steps; decision reason codes.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Approve | Badges granted (B-3/B-4); profile re-ranked; user notified | S43 |
| Reject (reason) | Reason + fix shown to user; 2nd rejection → 7-day cooling | S43 |
| Request resubmission | User sees what to fix | S43 |
| Suspicious pattern | Escalate to fraud checklist | S47 path |

**8. Navigation.** S42 → S43 → S44 → back to S43. Failed image loads re-fetch via signed URLs (10-min TTL).
**9. Screen states.** Image re-fetch; escalate path; decision-locked after submit.
**10. Rules.** One decision per case, reason mandatory, fully audited; reviewers see documents only through the watermarked restricted viewer — never raw storage; the user-visible state (S20) always mirrors the admin state.
**11. Completion.** Verification decisions are fast (<24h), evidence-based, consistent (checklist), and traceable.

---

## S45 (NM-045) — Listing Moderation Queue

**1. Purpose.** Inventory quality control — the queue: flags, duplicates, reported listings, and random samples.
**2. User.** Admin.
**3. Entry.** S42 moderation card.

**4. Functional wireframe**
```text
QUEUE:
  SOURCES:  auto-flags (contact-info patterns · price outliers · image reuse)
            · duplicates · reported listings · N% random sample of publishes
  ROWS:  reason · listing · owner tier · age
  [row click → S46]
```

**5. Components.** Source-tagged queue table; reason badges.
**6. Content.** Why each listing is here, whose it is, how old.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Click row | Case opens | S46 |
| Filter by source | Queue narrows | stay |

**8. Navigation.** S42 → S45 → S46 → S45.
**9. Screen states.** Source badges; empty queue.
**10. Rules.** Sampling includes clean publishes (deterrence); duplicate-source cases link to their siblings.
**11. Completion.** Nothing that pattern-matches a quality problem skips human eyes.

---

## S46 (NM-046) — Listing Moderation Detail

**1. Purpose.** Review one flagged listing and act.
**2. User.** Admin.
**3. Entry.** S45 row.

**4. Functional wireframe**
```text
DETAIL:
  RENDER:  the listing as the public sees it · owner card
  EVIDENCE:  which pattern matched · which text · previous flags/history
  ACTIONS:  [Approve] [Edit-require (send back w/ note)]
            [Unlist (reason)] [Remove + strike owner]
```

**5. Components.** Public-projection render; evidence panel; action bar.
**6. Content.** What the public sees, the specific evidence, the owner's history.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Approve | Listing active (if pending) | S45 |
| Edit-require | Owner sees note; listing stays unlisted until fixed | S45 |
| Unlist (reason) | Hidden from search; owner notified with reason | S45 |
| Remove + strike | Listing removed; owner strike recorded (3 strikes → review) | S45 |

**8. Navigation.** S42 → S45 → S46 → S45.
**9. Screen states.** Owner-history panel; action-locked after submit.
**10. Rules.** Every action explains itself to the owner (reason strings); strikes accumulate visibly; audited.
**11. Completion.** Fake, stale, or contact-leaking listings get caught before they burn seekers.

---

## S47 (NM-047) — Report Queue & Case Management

**1. Purpose.** Safety and conduct resolution with severity SLAs and real closure.
**2. User.** Admin.
**3. Entry.** S42 → queue → case.

**4. Functional wireframe**
```text
QUEUE:
  SEVERITY CLASSES:  S1 safety (threat · harassment · minors) SLA <12h
                     S2 fraud (scam · payment requests) SLA <12h
                     S3 conduct (spam · fake) SLA <48h
  ROWS:  severity · reason · target · reporter count (pile-on signal) · age
    │ row click
    ▼
CASE DETAIL:
  EVIDENCE:  report content + attachments
  TARGET CONTEXT:  profile · tier · history · other cases
  CONVERSATION EXCERPT (if chat-scoped; read-only, access audited)
  AUTO-PROTECTIONS TOGGLE:  freeze chat pair · unlist listing (safety class)
  DISPOSITION:  [Dismiss] [Warn] [Unlist/Remove content] [Revoke verification]
                [Suspend] [Ban]   + mandatory note
  REPORTER NOTICE:  closure template (no other-party details)
```

**5. Components.** Severity queue; evidence + context panels; protection toggles; disposition bar with mandatory note.
**6. Content.** The full story: what was reported, by whom (count), about whom, and what has already been auto-done.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Disposition (any) | Recorded; auto-protections resolved consistently (dismissed → unfreeze/re-list, EC-27) | queue |
| Toggle protections | Applied immediately while case open | stay |
| Ban | Full cascade: listings unlisted, applicants closed, chats read-only, sessions revoked (EC-21) | queue |
| Close | Reporter receives closure notification (F-059) | queue |

**8. Navigation.** S42 → S47 → case → queue.
**9. Screen states.** SLA timers; pile-on highlighting (multiple reporters); counter-reports merged into one case view; reporter-deleted cases continue (EC-13).
**10. Rules.** Every case ends in a recorded disposition with a mandatory reason; the reported user never sees report content; safety-class SLA is 12h and breach-visible on S42.
**11. Completion.** Reporters hear back; bad actors face escalating, audited consequences; benign reports are dismissed cleanly without residue.

---

## S48 (NM-048) — User Management

**1. Purpose.** Account-level enforcement with full context and audit.
**2. User.** Admin.
**3. Entry.** S42 → Users.

**4. Functional wireframe**
```text
SEARCH:  phone / email / name / id
USER 360:
  roles · tier + verification history · listings (states) · connections count
  · reports given/received · blocks · prior admin actions
ACTIONS (each: reason + confirm, audited):
  [Warn (email)] [Suspend 7d/30d] [Ban permanent] [Reinstate]
  [Force re-verification] [Revoke T3 only]
```

**5. Components.** Search; user-360 panel; reason-mandatory action bar.
**6. Content.** Everything about one user relevant to a decision, on one screen.
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Suspend / Ban | Cascade per EC-20/EC-21: listings unlisted, chats read-only, sessions revoked; user sees state screen + appeal | stay |
| Reinstate | State restored where valid | stay |
| Force re-verification | Badges suspended pending re-review | stay |
| Revoke T3 | Listings unlisted; T2 remains | stay |

**8. Navigation.** S42 → S48.
**9. Screen states.** No-results; already-suspended; cascade confirmation.
**10. Rules.** No action without a reason; every action audited and visible in the user's history; suspension/ban cascades are complete — no zombie listings or half-frozen chats.
**11. Completion.** Enforcement is decisive, reversible where appropriate, and always traceable.

---

## S49 (NM-049) — Platform Metrics

**1. Purpose.** The weekly marketplace-health digest — is the marketplace working?
**2. User.** Admin. *(V1 release — not in MVP build scope.)*
**3. Entry.** S42 → Metrics.

**4. Functional wireframe**
```text
WEEKLY VIEW + date range:
  ACQUISITION FUNNEL:  visits → signup → activation
  MARKETPLACE HEALTH:  active listings · freshness share · median response
                       · connect→chat rate · fills
  TRUST:  verification counts by tier · reports per 1k · blocks · SLA compliance
  RETENTION:  W4 return
[Export CSV]   [Date range]
```

**5. Components.** Metric groups; range picker; export.
**6. Content.** The health metrics that gate version decisions (freshness share, activation, response times, SLA compliance).
**7. User actions**

| User action | System response → state change | Next |
|---|---|---|
| Change range | Refetch | stay |
| Export | CSV download | — |

**8. Navigation.** S42 → S49.
**9. Screen states.** Loading; thin-data warnings for early weeks.
**10. Rules.** Metrics mirror the health gates used for launch and version decisions — the founder and the roadmap read the same numbers.
**11. Completion.** Weekly ops decisions (what to fix first) are data-backed and effortless.


---

# SECTION 06 — END-TO-END FEATURE FLOWS

Each major feature followed start to finish. No feature exists as an isolated screen; every flow below is buildable and testable as a unit.

### 6.1 Authentication flow

```text
Any auth wall / S01 → S05 Signup (phone + consent)
  → S07 OTP (T0 granted on success)
  → S08 Role selection
  → S09 / S29 onboarding wizard
  → original interrupted action auto-executes (context never dropped, EC-05)
Returning: S06 Login → S07 OTP → S10/S30 (or deep-link target)
Failure paths: EC-02 (existing phone) · EC-03 (OTP lock) · EC-20 (suspended)
```

### 6.2 Seeker onboarding & profile flow

```text
S08 → S09 wizard (basics → location → budget → move-in → 10 lifestyle → must-haves)
  → T1 profile complete → S10 personalized home (matches immediately)
Later edits: S17 profile · S18 preferences (both trigger async match recompute)
Privacy: S38 controls → S28 preview ("see me as others do")
Failure paths: EC-01 (resume) · EC-24 (stale move-in re-confirm)
```

### 6.3 Discovery flow (rooms)

```text
S10 Home / S11 Search
  → filters (S11 primary · S13 advanced/lifestyle)
  → sort by freshness/compatibility
  → S12 Room Detail (facts + owner trust + occupant compatibility)
  → decision: Save (S16) · Share · Connect (6.5) · pass
Empty paths: EC-14 (3 named zero-states, each with a fix)
Dead-end recovery: expired listing → state banner + alternatives (EC-12)
```

### 6.4 Discovery flow (flatmates — no listing required)

```text
S14 Flatmate Discovery (must-have chips bind before ranking)
  → candidate cards (score band + 1-line why)
  → S15 Flatmate Profile (full breakdown, both values, points)
  → decision: Save · Connect (6.5) · pass
  → connected pair later switches to room discovery together (6.3)
Honesty rules: low scores shown and labelled; declined users hidden 90d (EC-08)
```

### 6.5 Connection flow

```text
S12 room / S15 profile → intro-note sheet (context anchored, prefilled, editable)
  → request sent → S21 SENT (pending)
Counterparty: S21 RECEIVED / S24 notification
  → Accept → S23 chat opens (context header)
  → Decline → silent; sender cooldown 90 days (EC-08)
  → 14 days no response → request expires (labelled)
Guards: duplicate requests blocked (EC-10); blocked users cannot request
```

### 6.6 Communication & consent flow

```text
S22 Chat List → S23 Chat Thread (anchor context + suggested questions)
  → messages (masked: phones/emails/URLs auto-hidden both sides)
  → risk system cards (payment-pattern notice; meet-safe tips)
  → "Share phone number" → consent card: BOTH must consent
      both yes → numbers revealed once in-thread + pre-meet safety card
      one no → CTA hidden 7 days; chat continues (EC-19)
  → off-platform meeting (by design)
Safety exits: report / block at any moment → 6.9 (block severs platform contact)
```

### 6.7 Owner flow (listing lifecycle)

```text
S08 → S29 owner wizard → S19 (T2+T3) → S20 approved (badges)
  → S31 listing wizard (6 steps) → Publish (T3 gate)
      → auto-checks pass → ACTIVE (S30 analytics live)
      → auto-flag → pending → [S46 admin review] → active / edit-require / unlist
  → freshness: day-27 nudge → day-30 expiry → one-tap renew (+30d)
      → 45 days no confirm → auto-paused → revive or expire
  → applicants arrive → S34 pipeline
  → S35 evaluate/compare → Select → fill cascade → FILLED (hidden everywhere,
      other applicants politely closed)
  → or Pause / Remove at any time
Edge paths: EC-11 (duplicates) · EC-12 (state changes) · EC-21 (owner banned)
```

### 6.8 Verification & trust flow (all roles)

```text
Trigger: voluntary (badge boost) OR gate (owner publish)
  → S19 consent → document → live selfie → [owner] ownership proof → submit
  → S20 Submitted → In review
  → [S42 → S43 queue → S44 checklist → decision, <24h]
  → Approved: badges B-3/B-4 · trust-weighted re-ranking · notifications
  → Rejected: reason + fix → resubmit · 2nd rejection → 7-day cooling (EC-07)
  → SLA breach: apology + auto-priority (EC-04)
Documents: deleted 30 days post-decision; never public, admin-only audited access
```

### 6.9 Safety flow (report → resolution)

```text
Concern on any profile / card / chat / listing → ⋯ Report
  → S27: reason → evidence → block toggle (default ON vs counterparty)
  → immediate: block severs contact; safety-class case auto-freezes pair / unlists listing
  → [S47 triage: S1/S2 <12h · S3 <48h]
  → disposition: dismiss / warn / unlist / revoke verification / suspend / ban
  → reporter closure notification (outcome, no other-party details)
S26 Safety Center is the always-available guidance surface beside this flow.
```

### 6.10 Notifications & returning-user flow

```text
Events → S24 center (+ email for critical state changes)
  → deep links into S21 / S23 / S34 / S20 (expiry-aware fallback, EC-12)
Returning: S06 → S10/S30 → continue-where-left (last search, saved with
  revalidated freshness, unread badges) → stale preferences? → S18 re-confirm
Never: re-onboarding, lost drafts, dead sessions (EC-01)
```

---

# SECTION 07 — FEATURE → SCREEN MAPPING

Master map of where every MVP feature lives. Features carry their register IDs (F-001…F-083). "No orphan features, no duplicates": each row has exactly one home surface and a defined journey.

| Module | Feature (ID) | Entry screen | Main screen(s) | Core user action | Result → next |
|---|---|---|---|---|---|
| **A. Auth & onboarding** | Phone OTP signup/login, T0 (F-001) | S05/S06 | S07 | Enter phone + code | Session + T0 → S08 |
| | Role & intent selection (F-003) | S07/S37 | S08 | Pick Seek/Offer/Both | Wizard S09/S29 |
| | Seeker onboarding wizard (F-004) | S08 | S09 | 6 guided steps | T1 profile → S10 |
| | Owner onboarding wizard (F-005) | S08 | S29 | 4 guided steps | Verification path S19 |
| | Lifestyle questionnaire, 10 attrs (F-006) | S09 step 5 | S09 · S17 | Answer once | Compatibility substrate |
| | Must-have + nice-to-have preferences (F-007) | S09 step 6 | S09 · S18 | Set hard/soft | Filters bind, scores rank |
| | Completeness meter + prompts (F-008) | S10 | S10 · S17 | Fill gaps | Higher trust + match quality |
| **B. Profile** | Seeker profile view/edit (F-009) | Nav Profile | S17 | Edit identity | Recompute matches |
| | Owner profile view/edit (F-010) | Nav Profile (owner) | S36 | Edit owner identity | Trust surface for listings |
| | Photo upload + checks (F-011) | S09/S17/S31 | same | Upload | Guideline-safe imagery |
| | Public preview (F-012) | S17/S38 | S28 | See as others do | Privacy confidence |
| | Visibility controls (F-013) | S37 | S38 | Set exposure | Applies everywhere |
| **C. Verification & trust** | T0 auto (F-014) | S07 | — | (automatic) | Phone badge |
| | T2 ID + selfie submission (F-015) | S17/S19 CTA | S19 · S20 | Submit evidence | Human review <24h |
| | T3 ownership proof (F-016) | S19 owner step | S19 · S20 | Submit proof | Publish unlocked |
| | Admin review workflow (F-017) | S42 | S43 · S44 | Checklist decision | Badge / reason |
| | Trust badge system B-1…B-5 (F-018) | — | all cards/profiles | (earned) | Visible trust |
| | Status + resubmission (F-019) | S20 | S20 | Fix + resubmit | Transparent outcomes |
| | Freshness: 30-day expiry + renewal (F-020) | S32 | S32 · S33 | One-tap renew | Inventory truth |
| | Freshness stamp (F-021) | — | S02/S03/S11/S12 cards | (displayed) | Honest recency |
| | Publish requires T3 (F-022) | S31 | S31 → S19 | Gate | Verified supply only |
| **D. Search & discovery** | Room search city+locality (F-023) | Nav Search | S02 · S11 | Query | Fresh, ranked results |
| | Primary filters (F-024) | S11 | S11 | Narrow | Faster decisions |
| | Advanced lifestyle filters (F-025) | S11 | S13 | Set dealbreakers | Precision |
| | Sorting (F-026) | S11/S14 | same | Choose order | Decision quality |
| | Room detail (F-027) | card tap | S03 · S12 | Evaluate | Connect/Save/Pass |
| | Saved rooms/flatmates (F-030) | card ♡ | S16 | Keep options | Multi-session search |
| **E. Listings (owner)** | Listing creation wizard (F-032) | S30/S32 | S31 | 6 steps → publish | Active listing |
| | Photo manager (F-033) | S31 step 2 | S31 | ≥3 photos, cover | Honest visuals |
| | Listing lifecycle state machine (F-034) | S32/S33 | same | Renew/Pause/Fill | Truthful inventory |
| | Edit/pause/resume/close (F-035) | S33 | S33 | Control | Lifecycle integrity |
| | Room-Filled flow (F-036) | S35 | S34/S33 | Select applicant | Ghost inventory killed |
| | Duplicate detection (F-037) | S31 publish | S31 · S45 | Warn/dedupe | Supply quality |
| | Listing analytics (F-038) | S30/S33 | same | Read numbers | Feedback loop |
| | Stale detection + nudges (F-039) | (cron) | S30/S32 | Renew | Freshness automation |
| **F. Compatibility** | Canonical 10-attribute model (F-040) | S09 | (substrate) | (collected once) | Scoring basis |
| | Compatibility score 0–100 + bands (F-041) | — | S10/S11/S14/S15/S34 | (displayed) | At-a-glance fit |
| | "Why this match" explanation (F-042) | score tap | S14/S15/S35 | Expand | Trust in the score |
| | Must-have hard filters enforced (F-043) | S09/S18 | S11/S14 | Bind | Dealbreakers hold |
| | Flatmate discovery feed (F-044) | Nav Flatmates | S14 | Browse ranked | Pair-up journey |
| | Match recompute on change (F-045) | S17/S18 | (async) | Edit | Fresh signal ≤60s |
| | Low-match transparency (F-046) | — | S14/S15 | (labelled) | Honest marketplace |
| **G. Connections & messaging** | Connect request + intro note (F-047) | S12/S15 | sheet | Send anchored intro | S21 pending |
| | Accept / decline / withdraw (F-048) | S21 | S21 | Two-sided consent | Chat or silent close |
| | Connections inbox (F-049) | S10 pill/nav | S21 | Manage | Nothing lost |
| | 1:1 in-app chat (F-050) | S21 accept | S22 · S23 | Talk | Decision conversation |
| | Contact reveal, mutual consent (F-051) | S23 | S23 | Both consent | Numbers once, logged |
| | In-chat risk prompts (F-052) | S23 | S23 | (auto cards) | Fraud friction |
| | Unread counts & badges (F-053) | — | S22/S24 | (displayed) | Responsiveness |
| | Chat media rate limits (F-054) | S23 | S23 | (enforced) | Abuse control |
| **H. Safety** | Structured report (F-055) | overflow ⋯ | S27 | Report + evidence | Case created |
| | Block user (F-056) | S23/S27 | S27 | Block | Mutual invisibility |
| | Safety Center (F-057) | S04/S26 | S04 · S26 | Learn | Literacy + entry |
| | Automated abuse flags (F-058) | (patterns) | S45/S47 | (admin review) | Pre-report detection |
| | Moderation case management (F-059) | S42 | S47 | Disposition | SLA + closure |
| | Suspended/banned state UX (F-060) | (guard) | state screens | (status shown) | Coherent enforcement |
| **I. Notifications** | In-app center (F-061) | bell | S24 | Catch up | Deep links |
| | Transactional email (F-062) | (events) | (email) | (automatic) | Critical state changes |
| | Notification preferences (F-063) | S37 | S25 | Choose | Anti-spam control |
| **J. Owner operations** | Owner dashboard (F-065) | Nav Dashboard | S30 | Act on attention | One-minute ops |
| | Applicant pipeline (F-066) | S30/S34 | S34 | Stage moves | Replaces inbox chaos |
| | Applicant detail & compare (F-067) | S34 | S35 | Evaluate ≤3 | Decision quality |
| | Response-rate tracking (F-068) | S30/S36 | same | (measured) | Response culture |
| | Move-in + duration fields/filters (F-069) | S31/S11 | same | Set/filter | Timing semantics |
| **K. Admin** | Admin dashboard (F-070) | S41 | S42 | Triage | Ops command |
| | Verification queue (F-071) | S42 | S43/S44 | Decide | D-05 SLA |
| | Moderation queue (F-072) | S42 | S45/S46 | Act | Supply quality |
| | Report queue (F-073) | S42 | S47 | Resolve | Safety ops |
| | User management (F-074) | S42 | S48 | Enforce | Account-level integrity |
| | Audit log (F-075) | (automatic) | S42 tail | (recorded) | Accountability |
| **L. Account & settings** | Settings hub (F-076) | Profile ⋯ | S37 | Control | One place |
| | Privacy surface (F-077) | S37 | S38 | Set exposure | D-07 controls home |
| | Deactivate/delete, 14d grace (F-078) | S37 | S40 | Leave cleanly | Dignified exit |
| | Dual-role switching (F-079) | S37/S08 | mode chip | Switch | No re-onboarding |
| | Help & support (F-080) | S37/errors | S39 | Self-serve | Unstick |

**Deferred by design (NOT in MVP — do not build):** email/password secondary auth (F-002) · similar rooms (F-028) · recently viewed (F-029) · search alerts (F-031) · push notifications (F-064) · monetization (F-081…F-083). These return in V1/V1.1/V2 per the version ladder.


---

# SECTION 08 — NAVIGATION CONSISTENCY

The user must always know: Where am I? Why am I here? What can I do? What happens next?

## 8.1 Shells

| Shell | Structure | Screens |
|---|---|---|
| Public (guest) | Top bar: logo · city · Login. **No bottom nav** — CTA bands carry navigation | S01–S07 |
| Seeker | Top bar: context title · bell (badge) · ⋯. **Bottom nav 5:** Home (S10) · Search (S11) · Flatmates (S14) · Chats (S22, badge = unread + pending requests) · Profile (S17) | seeker surfaces |
| Owner | **Bottom nav 5:** Dashboard (S30) · Listings (S32) · Applicants (S34, badge = New count) · Chats (S22 shared) · Profile (S36) | owner surfaces |
| Wizard | Progress bar + step + [Save draft]; **no bottom nav**; exit = explicit Save & exit | S09/S19/S27/S29/S31 |
| Push/detail | Top bar back; no bottom nav | S03/S12/S13/S15/S20/S26/S28/S33/S35/S37–S40 |
| Admin | Desktop left rail: Queues · Users · Metrics · Audit tail; separate session realm | S41–S49 |

## 8.2 Rules (apply to every screen)

1. **One home per feature.** No duplicate entry points to the same function.
2. **Everything reachable in ≤3 taps** from its shell. No hidden features without a surface path.
3. **Back always preserves:** filters, scroll position, wizard steps, drafts, composer text. Losing user state on back is a defect.
4. **Auth walls carry context:** blocked action → signup → onboarding → the *original action auto-executes*. The user never re-navigates manually.
5. **Notifications deep-link to the object** (S21 row, S23 thread, S34 stage) with expiry-aware fallback: object gone → state banner + nearest healthy screen, never a 404.
6. **Mode switch (Both users):** persistent chip Seeking ⇄ Offering swaps the bottom nav and default home; per-mode route memory (return to the last screen in each mode); switch never loses drafts or chat position.
7. **Modal discipline:** maximum one sheet stacked; anything deeper becomes a routed screen.
8. **No silent swaps:** changing role/mode always shows an explicit suggestion or confirmation.
9. **Chat is one tap from anywhere** (bottom nav in both shells) — the safety posture depends on in-app chat being the path of least resistance.
10. **Wizards lock the shell:** no bottom nav until complete or explicitly saved — this prevents half-onboarded limbo.
11. **Deep links** resolve to the full-fidelity screen for the user's state (public projection for guests, masked detail for seekers, owner panel for owners); admin routes are never linked, noindex.
12. **Share surfaces:** every shareable entity (room card, profile teaser, saved search) has a public-safe projection that lands the recipient in the correct shell with context.

## 8.3 Interrupted journeys & session restoration

| Interruption | Behaviour |
|---|---|
| App killed mid-wizard | All step data persisted; resume banner on Home; wizard reopens at exact step (EC-01) |
| Session expiry | Re-auth via S06/S07; return to the exact deep-link target after |
| Notification tap on expired object | State banner + nearest healthy screen (EC-12) |
| Network loss mid-action | Optimistic UI + retry; nothing lost (EC-16/EC-17) |
| Login after suspension | Status screen + appeal; no app access (EC-20) |
| Login after grace-period deletion | S05 with "account deleted" notice |
| Reactivation | Exact prior state restored; listings re-validated honestly (EC-23) |

---

# SECTION 09 — UI / COMPONENT CONSISTENCY

Not a visual design system — the **functional consistency contract**. The same type of component behaves identically on every screen; visual drift between screens is a defect.

## 9.1 Shared functional components (build once, reuse everywhere)

| Component | Contract | Used on |
|---|---|---|
| **C-01 Listing card** | Photo (first = cover) · rent + **deposit always visible** · locality/room type · badge + freshness stamp on EVERY card · optional compat chip · ♡ save. Self-sufficiency test: a screenshot alone communicates value + trust + freshness. Expired variant: dimmed photo, "expired Xd ago", CTAs disabled except Similar | S01/S02/S10/S11/S16 |
| **C-02 Flatmate card** | Photo (blur per controls) · first name · age band · occupation · badge · score band + number (text, never colour-only) · 3 highest-signal attribute chips · 1-line why · day-fuzzed activity · [Connect] [View]. Low-match shown honestly with label | S10/S14/S16 |
| **C-03 Connect intro-note sheet** | Anchor context locked ("About: 2BHK in HSR") · prefilled editable note ≤300 chars, contact patterns blocked · transparency line ("X sees your profile + this note") · [Send request]. Duplicate → "already requested" | S12/S15 |
| **C-04 Contact-reveal consent card** | Platform-voice card: what is shared (number only) · with whom (this person) · pre-attached safety copy · [I'll share my number] [Not now]. Both consent required; decline hides CTA 7 days | S23 only |
| **C-05 Empty state** | One honest sentence why empty + one primary next action. Never blank, never dead-end | every list/feed |
| **C-06 Trust badge row (B-1…B-5)** | Icon + text (never colour-only); dates on tap ("ID verified Oct 2025"); absence renders nothing — no "unverified" scarlet letter (exception: the subtle safety chip in S23) | all cards/profiles/headers |
| **C-07 Auth-wall sheet** | Restates the ORIGINAL action ("You're one step from connecting about this room") · [Continue with phone] · reassurance line. Post-onboarding auto-executes the action | S02/S03 (all contact/save taps) |
| **C-08 Wizard skeleton** | Progress dots + "Step N of M" + [Save draft] · ONE question per view · "why we ask" microcopy on sensitive steps · [Skip] only where legal (consent and must-have steps are not skippable... must-haves default off; consent never) · Back preserves; resume always | S09/S19/S27/S29/S31 |

## 9.2 Component behaviour rules

| Element | Consistent behaviour |
|---|---|
| Header | Context title left; bell + ⋯ right; back arrow on push screens |
| Primary button | Exactly one per screen/state; state-aware label ("Connect" → "Open chat" when connected) |
| Secondary actions | Text buttons or overflow (⋯) — never a second shouting button |
| Cards | Self-sufficient (C-01 test); tap opens detail; destructive actions never on swipe — always overflow |
| Forms | Inline field-level validation; submit disabled while invalid; errors never clear input; submissions idempotent |
| Filters | Chips show active state; count always visible before applying (S13 live count); back preserves |
| Tabs | State preserved per tab; badge counts consistent with source data |
| Lists | Skeleton loading; 20/page pagination or infinite scroll with skeletons; state chips for expired/filled/paused rows |
| Confirmation | Destructive or consequential actions (Select applicant, Remove listing, Ban, Delete account) always confirm with explicit consequence text |
| Error messages | Inline, actionable, named cause + fix; global errors offer [Retry] [Go home]; never dead-end |
| Loading | Skeletons matching final layout; ≤300ms perceived; no spinners for text |
| Success | Toast or inline confirmation; state visibly changes (row moves, chip updates) |
| Badges & trust | C-06 everywhere; compatibility bands always "band name + number" in text |
| Freshness stamp | "Confirmed Xd ago" on every listing touchpoint — cards, details, owner panels |
| System cards (⚑) | Platform-voice inserts (safety, consent, masking) visually distinct from user content; never dismissible where safety-relevant |

---

# SECTION 10 — USER STATE CONTINUITY

A user's state must be identical no matter which screen renders it. One entity, one truth, every surface.

## 10.1 Account & onboarding states

| State | Meaning | Enforced everywhere by |
|---|---|---|
| Guest | No session | Public projections only; auth walls on contact/save (C-07) |
| Authenticated, onboarding incomplete | Role chosen, wizard unfinished | Onboarding guard: every protected route → resume wizard at exact step (EC-01); S10/S30 nag banner |
| Onboarded seeker | T1 profile | Seeker shell; T0-only nudge card until T2 |
| Onboarded owner | Role + property intent | Owner shell; unverified-publish banner until T3 |
| Both | Dual roles | Mode chip; per-mode route memory |
| Suspended | Enforcement action | Guard → status screen + appeal; listings unlisted; chats read-only for counterparties (EC-20) |
| Banned | Permanent enforcement | Full cascade: listings unlisted, applicants auto-closed, chats read-only, sessions revoked (EC-21) |
| Deactivated | Self-chosen pause | Everything hidden; login restores exactly (EC-23) |
| Deleted (grace) | 14-day window | Login cancels deletion; after grace: PII erased, messages anonymized |

## 10.2 Verification states (render identically on S17/S20/cards/owner gates)

```text
None → Submitted → In review → Approved(B-3/B-4) | Rejected(reason) | Resubmission required
                                   ↓ second rejection → Cooling 7 days (date shown)
Approved + 12 months → expiry → re-verify prompt (badge expires)
Suspended by admin → badges removed everywhere instantly (re-verification required)
```

## 10.3 Listing states (system of record; every surface renders the same chip)

```text
DRAFT → PENDING(auto-checks) → ACTIVE ⇄ PAUSED
ACTIVE ──day 27──→ EXPIRING(nudge) ──day 30──→ EXPIRED
ACTIVE ──45d no confirm──→ AUTO-PAUSED (revive or expire)
any ──owner/moderation──→ REMOVED · ACTIVE ──fill──→ FILLED
```

| State | Seeker surfaces show | Owner surfaces show |
|---|---|---|
| Active | Card + freshness stamp | Analytics + pipeline |
| Expiring (3d) | Normal card | Nudge + one-tap Renew |
| Expired / Paused / Filled / Removed | State banner + similar rooms; saved rows labelled; deep links resolve to state, never 404 (EC-12) | Renew / Resume / Revive / state + reason |

## 10.4 Connection & chat states

```text
Request: Pending → Accepted | Declined(silent) | Expired(14d) | Withdrawn
Accepted → Conversation: Active | Frozen(safety case, read-only) | Read-only(counterparty deleted/banned)
Reveal: Not requested → Requested → Consented(both) → Revealed(once, logged)
        Requested → Declined → CTA hidden 7 days
Block: mutual invisibility everywhere (feeds, search, chat list masked, requests filtered)
```

## 10.5 Cross-screen consistency checks (must all be true at once)

1. A T2-verified user shows the ID badge on their card in S14, profile S15, chat header S23, and owner pipeline S34 — same date, same badge.
2. A listing that is Paused renders identically (state + no connect) in S02/S11 search, S12 detail, S16 saved, and the owner's S32/S33.
3. An accepted connection opens the *same* chat from S21, S22, S12 "Open chat", and the S24 notification.
4. A declined connection hides the counterparty from S14 for 90 days for the sender — but the sender's profile stays visible to others (state is directional).
5. A user who turns discovery off (S38) disappears from S14 immediately, keeps pending requests, and remains reachable via their saved row in S16 (marked).
6. A blocked pair sees each other nowhere — not in S14, S11 results, S21, or S22.


---

# SECTION 11 — IMPORTANT BUSINESS / FUNCTIONAL RULES

The functional laws of the product. Each rule is testable; build-time violations are defects.

## 11.1 Identity & verification

- **R-01** Trust is graduated: T0 (phone, automatic) → T1 (complete profile) → T2 (ID + selfie, human-reviewed) → T3 (T2 + ownership proof). Every badge shown maps to a real verified fact.
- **R-02** Publishing a listing requires T3 — enforced as a gate, never a suggestion (unverified owners see the interstitial, not an error).
- **R-03** Verification review is human, with a <24h SLA; rejections always carry a reason code + fix; second rejection → 7-day cooling; documents deleted 30 days after decision; badge expiry at 12 months → re-verify.
- **R-04** Unverified-owner listings never appear publicly (not even in guest search).

## 11.2 Listing freshness & integrity

- **R-05** Every listing expires 30 days after last confirmation; renewal is one tap (+30 days); Day-27 nudge via notification + dashboard; 45 days without confirmation → auto-pause with revive path.
- **R-06** "Confirmed Xd ago" freshness stamp renders on every listing touchpoint — cards, details, saved rows, owner panels.
- **R-07** Deposit is a mandatory field and always visible on cards and details (anti-scam transparency).
- **R-08** Exact address is never a field anywhere in the product; locality-level pin only; the address itself, if shared at all, is shared by the owner in chat at their discretion.
- **R-09** Marking a room Filled closes it everywhere and politely auto-closes non-selected applicants. Pausing/expiring is never a silent alternative to closing (anti-ghost-inventory).
- **R-10** Duplicates are warned pre-publish (merge/replace/proceed) and flagged to moderation if published.

## 11.3 Matching & discovery

- **R-11** Compatibility = weighted overlap across 10 canonical attributes (0–100, bands Great ≥75 / Good 55–74 / Mixed 35–54 / Low <35). No ML. A user could recompute the score by hand from the explanation.
- **R-12** Every score shows ≥2 drivers ("You match: veg, early schedule. You differ: guests."). Low scores are shown and labelled — never hidden or buried.
- **R-13** Must-haves are hard filters applied *before* ranking; preferences are soft and only affect scoring. The two are never conflated.
- **R-14** Owners may declare household norms (limited ethical set: gender composition, veg/non-veg, smoking, pets, guests) but never filter seekers by protected attributes — the asymmetry is deliberate.
- **R-15** Preference or lifestyle edits trigger async recompute (≤60s) with an honest "matches updating" banner — never silent staleness, never fake immediacy.

## 11.4 Connections, chat & privacy

- **R-16** Contact details (phone/email/URL) are masked server-side in every surface, pre-connect *and* in chat text. The ONLY reveal path is the mutual-consent card in S23; the reveal is once, logged, and followed by the pre-meet safety card.
- **R-17** A declined reveal hides the CTA for 7 days; a declined connection silences re-requests for 90 days. No pressure loops anywhere.
- **R-18** Connect requests expire after 14 days; duplicate requests are blocked idempotently.
- **R-19** Decline is silent (sender never notified); blocking is mutual invisibility across every surface.
- **R-20** The platform never processes payments; payment-pattern messages trigger an in-chat warning card. Off-platform payment solicitation is a reportable, enforceable violation.
- **R-21** Chat media: ≤3 images per message, scanned, size-capped; message rate 10/min; failed sends retry without phantom "delivered" states.

## 11.5 Safety & enforcement

- **R-22** Reports are structured (reason taxonomy + optional evidence); safety-class reports (S1/S2) get <12h human triage, S3 <48h; every report reaches a recorded disposition and the reporter receives closure (outcome, no other-party details).
- **R-23** Safety-class cases auto-protect while pending: chat pair freeze, listing unlist. Dismissal cleanly reverses protections.
- **R-24** Enforcement cascades are complete: suspension/ban unlists listings, freezes chats, revokes sessions — no zombie states. Users see a status screen + appeal path.
- **R-25** Every admin action requires a reason and writes an audit entry. Report content is never visible to the reported user.

## 11.6 Platform & scope

- **R-26** One city (Bangalore), one language (English), free core — locked in UI as well as backend ("more soon" states, no fake selectors).
- **R-27** Account exit: deactivate is reversible with exact state restoration; delete has a 14-day grace then erases PII (messages anonymized, counterparty keeps chat minus identity).
- **R-28** No feature without a home: everything in Section 07 lives on exactly one primary surface; anything new needs a screen + journey before it is built.
- **R-29** Notifications: in-app always; email for critical state changes; safety notices cannot be disabled; message notifications never below daily-digest for active connections.
- **R-30** Honesty over polish: stats are real, stamps are true, scores are explained, zero-states name their cause, delays are admitted (SLA-breach apology), and "not supported" states say so plainly.

---

# SECTION 12 — ERROR / EMPTY / LOADING / SUCCESS FLOWS

Every important non-happy state, defined. Pattern: STATE → what the user sees → what they can do → where they go next. (Loading/inline-error/offline global defaults from Section 05 apply everywhere.)

| State | What user sees | What user can do | Where they go next |
|---|---|---|---|
| **Loading (any list/detail)** | Skeleton matching final layout | Wait; screen arrives ≤300ms perceived | — |
| **Empty results (search)** | Named cause: "no supply yet" / "filters too narrow: *rent*" / "must-haves exclude all" + fix | Waitlist + widen · one-tap relax filter · review must-haves | S11 refined / S05 |
| **Empty feed (flatmates)** | "No candidates match yet — widen radius or relax a must-have" | Adjust chips | S14 widened |
| **Empty saved / connections / chats / notifications** | Honest sentence + one browse/discover CTA | Tap CTA | S11/S14/S16 |
| **Failed action (save/connect/send)** | Inline error, input preserved, idempotent retry | Retry / cancel | stay |
| **Network loss** | Offline banner where cached; optimistic send with retry where not | Retry | stay / S17 |
| **Invalid input (forms)** | Field-level message naming the fix | Correct; submit unlocks | stay |
| **OTP wrong / expired / locked** | Inline retry → resend prompt → 30-min lock + support link | Resend / change number / support | S07 / S05 / S39 |
| **Verification pending** | S20 state card + SLA note; owner publish shows "prepare a draft now" | Wait, refresh | S20/S31 draft |
| **Verification rejected** | Reason code + human fix + [Resubmit] | Fix + resubmit | S19 |
| **Verification SLA breached (>24h)** | Apology banner + auto-priority | Wait / support | S20 |
| **Listing unavailable (expired/paused/filled/removed)** | State banner + similar rooms; deep links resolve to state, never 404 | Browse similar / renew path (owner) | S11 / S32 |
| **Listing flagged in review** | Owner: "Flagged — under review" state | Wait / edit per note | S33 |
| **Connect unavailable** | "Already requested" (duplicate) / hidden counterparty (90d/declined) | Continue browsing | S14/S11 |
| **Restricted action (suspended user)** | Status screen + appeal link; counterparties see frozen-thread notice | Appeal | state screen |
| **Blocked pair** | Mutual invisibility — feeds, search, requests, chats | (blocker: manage list V1) | — |
| **Frozen chat (safety case)** | Read-only banner with explanation | Wait for resolution / contact support | S23 read-only / S39 |
| **Counterparty deleted** | "Deleted account" read-only thread/row (30-day retention) | Archive / leave | S22 |
| **Reveal declined** | CTA hidden 7 days; neutral copy, no pressure | Keep chatting | S23 |
| **Message send failed** | Inline retry/delete on the bubble | Retry / delete | S23 |
| **Upload failed (verification/report)** | Guidance (size/type); nothing lost | Retry | stay |
| **Expired verification (12 months)** | Badge removed everywhere; re-verify prompt | Re-verify | S19 |
| **Successful completion (each core action)** | Visible state change: request appears in Sent · chat opens · listing Active · badges granted · "Filled" everywhere | Continue journey | next per Section 04 |

---

# SECTION 13 — CROSS-FEATURE FLOW CONSISTENCY

Features must chain into one coherent product, not mini-apps. These are the required seams — each is testable end-to-end.

| Seam | Chain that must work | Consistency guarantees |
|---|---|---|
| Discovery → Decision | S11/S14 → S12/S15 → Connect sheet | Card data = detail data = sheet anchor (same listing/profile projection); compat chip equals the score explained on the detail |
| Decision → Connection | Connect sheet → S21 pending → S24 notification | One request, one state, visible from both sides; anchor text identical on sheet, S21 row, chat header |
| Connection → Communication | Accept → S23 with anchor | Chat opens once (dedupe); anchor persists; badges in header match S15 |
| Communication → Consent | S23 → consent card → reveal → safety card | Masking enforced up to mutual consent; reveal logged once; decline cooldown identical on both sides |
| Consent → Real world | Reveal → pre-meet card → off-platform | Platform steps out gracefully; safety copy matches S26 exactly |
| Real world → Outcome | Owner S35 Select → fill cascade → S33 Filled → seeker S16 row "Filled" | One transaction: listing state, applicant closures, seeker-side labels all consistent |
| Owner supply → Seeker demand | S31 publish → auto-checks → S02/S11 visible → freshness countdown | The listing seekers see is the listing the owner manages — same projection, same state chip |
| Trust → Everything | S19/S20 → badges → re-ranking → card/profile surfaces | Badge state is global and instantaneous (revocation included); T3 gate blocks S31 publish everywhere |
| Safety → Everything | ⋯ Report on any surface → S27 → protections → S47 → closure | Same flow from every entry; auto-protections apply per severity; reporter closure always sent |
| Preferences → Matches | S17/S18 edit → async recompute → S10/S11/S14/S34 updated | All score-bearing surfaces refresh from the same recompute; banner honesty while stale |
| Privacy → Surfaces | S38 controls → S14 feed, S15 profile, S23 header, S28 preview | One control set governs every rendering; preview is provably faithful (same render path) |
| Account → Product | S37 role add → S08 → wizard; mode chip swaps shells | No re-signup, no data loss, per-mode route memory |
| Notifications → Object | S24 row → S21/S23/S34/S20 deep link | Expiry-aware fallback always; badge counts agree with source data |
| Public → Authenticated | S02/S03 guest view → auth wall → same content authenticated | The authenticated projection contains everything the guest saw plus what trust now unlocks — never less |

**The single-product test:** a new user should be able to walk S01 → outcome (Filled room or paired flatmates) touching every module without ever feeling the product changed shape. If any seam above fails, the product feels like separate apps — fix the seam, not the styling.


---

# SECTION 14 — DEVELOPMENT ORDER

Build in dependency order — nine phases. A phase starts only when the previous phase's exit criteria pass. Each phase names: what is built, why now, prerequisites, what it unlocks, and the test gate before moving on. (Screens reference Section 05; features reference Section 07; rules reference Section 11.)

## Phase 1 — Foundation & authentication

| | |
|---|---|
| **Build** | S05 Signup · S06 Login · S07 OTP · S08 Role selection · S37 Settings (stub) · sessions · route guards (auth/onboarding) · design-system primitives (Section 09 component contracts: buttons, inputs, cards, banners, sheets) |
| **Why now** | Every journey passes through identity; guards and primitives are load-bearing for all later screens |
| **Prerequisites** | None |
| **Unlocks** | Authenticated users with roles; the guard system every later screen relies on |
| **Test gate** | Signup→OTP→role on staging; wrong/expired/locked OTP paths (EC-03); existing-phone path (EC-02); suspended-account guard (EC-20); sessions persist across restarts |

## Phase 2 — Identity & profiles

| | |
|---|---|
| **Build** | S09 Seeker wizard · S29 Owner wizard · S17 My Profile · S36 Owner Profile · S28 Public Preview · S38 Privacy controls · photo upload · completeness meter · lifestyle collection (10 attributes) |
| **Why now** | Matching, discovery, and trust all consume the profile; privacy controls must exist before profiles become visible |
| **Prerequisites** | Phase 1 (roles, guards, upload primitives) |
| **Unlocks** | T1 profiles; the attribute substrate for scoring; visibility rule enforcement |
| **Test gate** | Wizard resume after kill (EC-01); visibility rules honored on every projection (S28 provably faithful); completeness math; EC-24 stale move-in |

## Phase 3 — Marketplace core (listings & search)

| | |
|---|---|
| **Build** | S31 Listing wizard (publish admin/dev-gated until Phase 5 T3) · S32 Listings Management · S33 Listing Detail (owner) · S02 public search · S11 authenticated search · S03 public detail · S12 authenticated detail · S13 Advanced Filters · S16 Saved Items · S01 Landing · S04 Trust Center (public) · listing lifecycle state machine · freshness stamps · public projections + masking |
| **Why now** | Supply and retrieval are the marketplace's body; every later feature hangs off listings |
| **Prerequisites** | Phase 2 (profiles), lifecycle + freshness fields |
| **Unlocks** | Seekable, honest inventory; decision surfaces; saved state |
| **Test gate** | Lifecycle transitions incl. illegal ones blocked; expired listings provably invisible everywhere (EC-12); masking: no PII in any public payload; deposit visible on all surfaces (R-07); three EC-14 zero-states |

## Phase 4 — Compatibility & discovery

| | |
|---|---|
| **Build** | Score engine (weights, bands, explanations — Section 11 R-11…R-15) · S14 Flatmate Discovery · S15 Flatmate Profile · S10 Seeker Home (rails) · S18 Preferences · must-have enforcement · match recompute on edits |
| **Why now** | Profiles exist (Phase 2); this turns them into explained fit — the differentiator |
| **Prerequisites** | Phase 2 attributes; Phase 3 surfaces to host scores |
| **Unlocks** | The no-listing pairing journey; personalized home; honest low-match labeling |
| **Test gate** | Score vectors hand-recomputable; bands correct; explanations ≥2 drivers; must-haves bind before ranking (R-13); recompute ≤60s with banner (R-15); opted-out users never appear |

## Phase 5 — Trust layer (verification)

| | |
|---|---|
| **Build** | S19 Verification Submission (T2 + T3 steps) · S20 Status · verification state machine · badge system (B-1…B-5) · publish gate (T3) enforcement · freshness automation (Day-27 nudge, Day-30 expiry, 45-day auto-pause) |
| **Why now** | Real publishing requires real verification; freshness automation must run before real supply arrives |
| **Prerequisites** | Phase 2 uploads; Phase 3 lifecycle; admin decision surface arrives Phase 8 (dev-gated until then) |
| **Unlocks** | Verified supply; badges on every surface; the freshness promise (R-05/R-06) |
| **Test gate** | Unverified owner blocked end-to-end; rejected-once/twice paths (EC-07); SLA-breach state (EC-04); stamps correct after sweeps; badge revocation propagates instantly |

## Phase 6 — Connections & messaging

| | |
|---|---|
| **Build** | Connect flow + intro-note sheet (C-03) · S21 Connections · S22 Chat List · S23 Chat Thread · masking service · mutual-consent reveal (C-04) · in-chat risk cards · unread badges · rate limits · media limits |
| **Why now** | Decision surfaces exist; now the safe path from decision to conversation |
| **Prerequisites** | Phases 3–4 (anchor objects); Phase 5 (badges in headers) |
| **Unlocks** | The trust-critical spine: connect → chat → reveal (Section 06 flows 6.5/6.6) |
| **Test gate** | Zero phone/email/URL patterns reachable in any payload pre-consent; consent + decline cooldown (EC-19); duplicate-request block (EC-10); message retry (EC-17); frozen-pair read-only |

## Phase 7 — Owner operations

| | |
|---|---|
| **Build** | S30 Owner Dashboard · S34 Applicant Pipeline · S35 Applicant Detail & Compare · fill cascade (F-036) · response-rate meter · listing analytics |
| **Why now** | Connections exist; owners need structured management instead of inbox chaos |
| **Prerequisites** | Phase 6 (chat), Phase 5 (freshness + gates) |
| **Unlocks** | The full owner loop: publish → pipeline → fill (Section 06 flow 6.7) |
| **Test gate** | Stage machine incl. illegal transitions; fill cascade transactional (listing + applicants + seeker labels consistent); EC-26 concurrent moves; a seeded owner journey publish→fill runs green end-to-end |

## Phase 8 — Safety & admin console

| | |
|---|---|
| **Build** | S27 Report/Block · S26 Safety Center (auth) · S41–S48 admin screens (login + TOTP, dashboard, verification queue/case, moderation queue/case, report cases, user management) · auto-flags · severity SLAs · auto-protections · audit log · S24 Notifications Center · S25 Notification Settings · S39 Help · S40 Deactivate/Delete |
| **Why now** | The promise (safety, verification SLA) needs its operations; notifications and account lifecycle complete the product |
| **Prerequisites** | All user-facing surfaces exist to moderate; Phase 5 verification data for queues |
| **Unlocks** | Enforceable trust at launch; the founder ops loop (Section 06 flows 6.8/6.9/6.10) |
| **Test gate** | Report → protection → disposition → closure trace; S1/S2 <12h SLA drill (a reported listing unlisted <12h in staging); ban cascade completeness (EC-21); audit completeness; EC-27 clean dismissal |

## Phase 9 — Hardening & launch readiness

| | |
|---|---|
| **Build** | Accessibility pass (WCAG 2.1 AA, 44px targets, badges never colour-only) · performance budgets · security suites (authorization matrix, masking, rate limits, audit verification, PII lifecycle) · legal text (ToS/Privacy) · content seeding (S04/S26/S39) · founder ops rehearsal · seed supply (verified owners + listings) · end-to-end journey automation J-A…J-J · S49 Metrics prepared (V1) |
| **Why now** | Everything works; now it must be *dependable, legal, and launchable* |
| **Prerequisites** | Phases 1–8 |
| **Unlocks** | Launch |
| **Test gate** | Full journeys (Section 06 flows) green; all 13-section checklists (Section 16) pass on every screen; launch gates below |

**Launch gates (all must be true):** every screen passes its Section 16 checklist · every rule in Section 11 has a passing test · every EC has its defined behaviour verified · masking suite proves zero contact-data leakage pre-consent · freshness automation provable · report SLA drill passed · seed supply live (fresh, verified listings visible in guest search).

---

# SECTION 15 — FEATURE COMPLETION DEFINITION

A feature is **complete** only when all of the following are true — a working UI alone is never "complete":

1. **Correct screen** — it lives on its Section 07 home surface (no orphan, no duplicate home).
2. **Correct placement** — block order and CTA position match the Section 05 wireframe.
3. **Correct interaction** — every Section 05 action row behaves as specified (action → response → state → next).
4. **Correct navigation** — all Section 04 arrows wired; back/exit behaviour per Section 08.
5. **Correct states** — loading, empty, error, success, and every signature state from Section 05.9 implemented (including the screen's named edge cases).
6. **Correct functional behaviour** — the Section 11 rules the feature touches hold, with tests.
7. **Correct persistence** — survives refresh, back-navigation, and app kill (drafts, filters, scroll, composer).
8. **Correct permissions** — server-side enforcement of role/verification/privacy state; client mirrors only.
9. **Correct error handling** — the relevant Section 12 rows behave as defined; no dead ends.
10. **Complete journey** — the feature's Section 06 flow runs end-to-end from its entry to its outcome, including failure branches.
11. **Acceptance verified** — the feature's acceptance criteria pass on staging (mapped per phase in Section 14 test gates).

**Rule of thumb:** if a reviewer can break the journey by refreshing, rotating, going back, losing network, or acting as the *other* user — the feature is not complete.

---

# SECTION 16 — SCREEN ACCEPTANCE CHECKLIST

Run for every screen before its phase exit (and again at launch). Adapt by adding screen-specific items from Section 05.9 states; never remove items.

```text
[ ] Correct screen structure (blocks in Section 05 wireframe order)
[ ] Correct components (Section 09 contracts; shared components used, not rebuilt)
[ ] Correct content (all mandatory facts present: e.g. deposit, freshness, badges)
[ ] Correct entry (all Section 05.3 entry points land here correctly)
[ ] Correct actions (every Section 05.7 row: action → response → state → next)
[ ] Correct next screen (all Section 04 arrows from this screen wired)
[ ] Correct back behaviour (state preserved: filters/scroll/drafts/composer)
[ ] Loading state (skeleton, ≤300ms perceived, no layout jump)
[ ] Empty state (honest sentence + one next action — never blank)
[ ] Error state (inline, actionable, input preserved, idempotent retry)
[ ] Success state (visible state change + defined next step)
[ ] Permission/state handling (guest/auth/role/verification/privacy guards render correctly)
[ ] Signature edge states (screen's Section 05.9 states + listed ECs verified)
[ ] Journey works end-to-end (screen's Section 06 flow passes with real data)
[ ] Consistency spot-check (identical component behaves identically as elsewhere — Section 09.2)
[ ] Accessibility (44px targets, labels, focus order, contrast, badges not colour-only)
[ ] Analytics event (screen view + named interactions firing, Section 05 overrides)
[ ] No dead ends (every terminal state offers a next action)
```

**Screen-specific additions (quick reference):**

| Screens | Extra validations |
|---|---|
| S02/S03/S11/S12/S16 | Deposit visible; freshness stamp; expired-state degradation (EC-12); masking on public projections |
| S05/S06/S07 | EC-02 dedupe; EC-03 lockout; rate limits; context preservation (EC-05) |
| S09/S29/S31 | Draft resume (EC-01); per-step validation; S31: T3 gate + duplicate sheet (EC-11) |
| S14/S15 | Must-haves bind pre-ranking; low-match labelled; blur/visibility honored; EC-08 cooldowns |
| S19/S20 | EC-04 SLA; EC-06 upload; EC-07 reasons/cooling; document retention promise |
| S21/S22/S23 | EC-08/09/10/13/17/19; masking everywhere; reveal only via C-04; frozen read-only |
| S27/S26 | EC-09 dedupe; block default; reference ID; SLA copy matches S47 reality |
| S30–S35 | Freshness lifecycle exactness (R-05); fill cascade transactional; EC-12/21/26 |
| S37–S40 | EC-23 restore; EC-02 phone change; 14-day grace messaging |
| S41–S48 | Audit on every action; reason mandatory; signed-URL re-fetch; TOTP lockout |


---

# SECTION 17 — FINAL PRODUCT FLOW MAP

The whole product at a glance. Three lanes: the seeker spine, the owner spine, and the cross-cutting trust/safety rails that serve both.

```text
=====================================================================
 ENTRY
=====================================================================
S01 Landing ── "Find a room" ──► S02 Public search ──► S03 Masked detail
     │                                                        │
     └── "I have a room" ──► S05 Signup ◄── AUTH WALL (context kept)
                                    │ phone + consent
                                    ▼
                              S07 OTP ── T0 granted
                                    │
                                    ▼
                              S08 Role? ──────────────┐
                                    │                 │
        ┌───────────────────────────┘                 ▼
        ▼                                        OWNER LANE
   SEEKER LANE                                        │
        │                                             ▼
        ▼                                        S29 Owner wizard
S09 Seeker wizard (6 steps, resumable)                 │
        │                                             ▼
        │                                        S19 Verification (T2+T3)
        │                                             │ submit
        │                                             ▼
        │                                        S20 In review (<24h)
        │                                             │ approved
        │                                             ▼
        │                                        S31 Listing wizard ── Publish
        │                                             │                │ (T3 gate)
        │                                             ▼                ▼
        │                                        S30 Dashboard ◄── Active
        │                                             │
        ▼                                             ▼
S10 Seeker Home ◄──────────── login default ──────► S34 Pipeline
   ┌─────┴────────┐                                  │ cards
   ▼              ▼                                  ▼
S11 Search     S14 Flatmates                    S35 Evaluate
   │ filters    │ must-haves bind                 │ compare ≤3
   ▼            ▼ first-name basis                 │
S12 Detail     S15 Profile                        SELECT
   │ facts +      │ why-this-match                  │ fill cascade
   │ owner trust  │                                 ▼
   ▼              ▼                            S33 Mark Filled
 CONNECT ◄────────┘                            (hidden everywhere,
   │ intro note                                 others closed)
   ▼
S21 Connections ── pending
   │ accepted (or declined: silent, 90d)
   ▼
S23 Chat Thread ── context anchor
   │ numbers masked always
   │ "Share phone number" → mutual consent?
   │   yes → revealed once + pre-meet safety card
   │   no  → CTA sleeps 7 days, chat continues
   ▼
 OFF-PLATFORM MEETING (by design) ──► outcome feeds owner lane above

=====================================================================
 CROSS-CUTTING RAILS (all roles, from any screen)
=====================================================================
 TRUST:   any "Verify" CTA ──► S19 ──► S20 ──► badges B-3/B-4
          → re-ranked with trust weight (seeker cards, owner gates)
 SAFETY:  ⋯ Report anywhere ──► S27 (reason → evidence → block)
          → auto-protections ──► [S47 triage <12h] ──► closure notice
          S26 Safety Center always one tap away
 RETURN:  S06 Login ──► S10/S30 ──► S24 Notifications ──► deep link
          stale move-in? ──► S18 re-confirm ──► matches recompute
 ACCOUNT: S37 Settings ──► roles / S25 notifications / S38 privacy
          ──► S28 preview / S39 help / S40 deactivate·delete
 ADMIN:   S41 ──► S42 queues ──► S43/44 verify · S45/46 moderate
          ──► S47 reports · S48 users ──► S49 metrics (V1)
=====================================================================
```

**Reading the map:** vertical = journey progress; horizontal rails = the promises (trust, safety, return, account) that apply everywhere. Every arrow exists as a specified transition in Sections 04–06. If a build implements this map faithfully, the product is NestMate.

---

# SECTION 18 — FINAL BUILD CHECK

Internal audit performed on this document before handoff. Results:

**Flow**
- ✔ Every major journey has a clear beginning: Entry (S01/auth walls) is defined for seeker, owner, returning, trust, safety, account (Section 02).
- ✔ Every journey has a clear end: Filled room / connected pair (seeker), Filled listing (owner), resolved case (safety), verified badge (trust), clean exit (account).
- ✔ Every screen has a logical previous/next: all 49 screens carry Entry + Navigation in Section 05, and all branch conditions live in Section 04 — no unexplained jumps, no disconnected screens.
- ✔ All branches documented: auth walls, OTP failure/lock, role split, onboarding resume, connect accept/decline/expiry, reveal consent/decline, verification approve/reject/cooling, publish gate/flags, fill cascade, safety freeze/dismiss, ban cascade, deactivate/delete/grace.

**Features**
- ✔ Every MVP feature (F-001…F-080 minus the five deferrals) has exactly one home surface and one journey row (Section 07) — no orphan features, no duplicate homes.
- ✔ Every feature has a user flow with a result and next screen (Section 06).
- ✔ Deferred features are named and excluded (Section 07 closing table) — nothing ambiguous.

**Screens**
- ✔ All 49 screens documented with the identical 11-part structure (Section 05); coverage: 8 auth + 8 seeker core + 12 profile/trust/connect/chat/safety + 8 owner + 4 account + 9 admin.
- ✔ Every screen has purpose, user, entry, functional wireframe, components, content, action table, navigation, states, rules, completion.

**States**
- ✔ Loading/empty/error/success/pending/restricted/rejected/expired documented globally (Section 05 defaults) and per screen (05.9) with a 23-row non-happy-path matrix (Section 12).
- ✔ All 28 edge-case behaviours from the blueprint are carried into the relevant screens' rules and states (EC-01…EC-28).

**Consistency**
- ✔ Navigation patterns fixed for all shells (Section 08): 5-tab seeker/owner shells, wizard lock, push screens, admin rail, guards, deep-link fallbacks.
- ✔ Component contracts defined once and referenced everywhere (C-01…C-08 + behaviour table, Section 09).
- ✔ User states render identically on every surface (Section 10 with five cross-screen consistency checks).
- ✔ Feature transitions connected by 14 named seams (Section 13) — the single-product test.

**Development**
- ✔ Implementation order is dependency-true (Section 14): nine phases, each with build list, rationale, prerequisites, unlocks, and test gates; launch gates defined.
- ✔ "Complete" is operationalized (Section 15: 11 criteria + reviewer rule of thumb) and checkable per screen (Section 16: 18-item checklist + per-screen additions).
- ✔ A developer can read Section 14 → know what to build next; a coding agent can follow phases without guessing any flow, state, or rule; a non-technical reader can understand the entire product from Sections 01–04 and 17.

**Residual boundaries (deliberate):** visual styling, database schemas, API specifications, and infrastructure are intentionally unspecified here — they belong to the build's technical tracks and must never override this document's functional contracts. Where a technical constraint conflicts with a rule in Section 11, Section 11 wins and the conflict is escalated to the decision register before deviating.

*This document is the single Product Build Bible for NestMate. Build it in order; test it as specified; ship it honest.*
