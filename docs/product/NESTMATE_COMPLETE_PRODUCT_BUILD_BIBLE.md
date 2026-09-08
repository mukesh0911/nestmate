# NESTMATE — COMPLETE PRODUCT BUILD BIBLE

**Version:** 2.1 — FINAL (LOCKED for the development reconciliation phase) · **Date:** 2026-09-05
**Status:** Approved target-state product definition — the single source of truth for what NestMate should be. This version has passed the final completeness and quality pass; it contains no placeholders, no undefined destinations, and no silent inventions. The only points left open are the registered OPEN DECISIONs (Section 18).

**The three-input model for the build phase.** Development proceeds with three inputs, each answering exactly one question — this document must never be mixed with the other two:

| Input | Answers |
|---|---|
| **Forensic audit** (separate document) | What exists today |
| **This Build Bible** | What the finished product should do and how the user should experience it |
| **Existing codebase** | What can be reused, modified, fixed, or replaced |

This document contains no code analysis, no current-state description, and no comparison with the implementation. That reconciliation happens when the coding agent receives all three inputs together.

**Audience:** Product owners, designers, developers, and AI coding agents (Cursor, Claude Code, or any build agent).

**The chain this document guarantees.** For every capability:

```text
What should exist → where it exists → how the user reaches it → what the screen contains
→ what the user can do → what happens next → what states exist → how it connects to the rest of the product
```

**How to read this document**

| If you are a… | Read this way |
|---|---|
| Product owner / non-technical reader | Sections 01–04 give you the whole product shape. Section 17 is the one-page map of everything. |
| Developer / designer | Section 05 (screen specs), Sections 08–12 (navigation, components, states, rules) are the build contract. Section 14 is the build order. |
| AI coding agent | Build strictly in Section 14 phase order. Each phase names its screens (Section 05) and exit conditions (Sections 15–16). Never guess a flow — every arrow, state, and rule is defined here. |

**Out of scope (by design):** product research and market strategy · visual design systems (colors, fonts, pixels) · database schemas · API specifications · backend architecture · infrastructure · analysis of the existing codebase. This document defines WHAT the product does and HOW it behaves — not how the servers are built and not what the code looks like today.

**The OPEN DECISION convention.** Everything in this document is grounded in the approved NestMate product documentation. Where a genuine product question was not settled by that documentation, this document does not silently invent an answer: it writes **OPEN DECISION** at the exact spot and registers it in Section 18. OPEN DECISIONs are the only places where a building team must consult the product owner before acting; everything else is buildable as written.

**ID systems used in this document**

| ID | Meaning |
|---|---|
| `PUB-01 … ADM-09` | Screen IDs — area-prefixed, unique, stable. Section 03 is the master index. |
| `FLOW-01 … FLOW-13` | End-to-end feature flows (Section 06). |
| `F-001 … F-083` | Feature-register IDs from the approved blueprint (cited in Sections 06–07 for traceability). |
| `C-01 … C-08` | Shared functional component contracts (Section 09). |
| `R-01 … R-30` | Business/functional rules (Section 11). |
| `EC-01 … EC-28` | Edge-case behaviours carried over from the approved blueprint (cited in specs and state tables). |
| `OD-01 …` | Open decisions register (Section 18). |

**Terminology used throughout**

| Term | Meaning |
|---|---|
| Seeker / Owner | The two user roles. "Both" users hold both roles and switch modes (Seeking ⇄ Offering) via a persistent mode chip. |
| T0…T3 | Verification tiers: T0 phone verified (automatic) · T1 complete profile · T2 ID + selfie (human-reviewed) · T3 T2 + proof of room control (owners only). |
| B-1…B-5 | Trust badges: Phone verified · Profile complete · ID verified · Owner verified · Top responder. |
| Freshness stamp | "Confirmed Xd ago" — time since the owner last confirmed the listing is still available. |
| Connect | A consent-gated introduction request (never an anonymous swipe), always anchored to a room or a profile, optionally with an intro note. |
| Contact reveal | The only way phone numbers are exchanged: mutual in-chat consent, then numbers appear once in the thread. |
| Must-haves vs preferences | Must-haves are hard filters applied before ranking; preferences only affect scoring. Never conflated. |
| Admin | The founding team's operations console (verification, moderation, reports, users). Internal — never linked from the public product. |

---

# SECTION 01 — PRODUCT SUMMARY

**What NestMate is.** A mobile-first web app (PWA) for finding rooms, flatmates, and flats-to-share in Bangalore — built on verified people, explained compatibility, and fresh listings. Free at launch. English only. One city only (Bangalore). No payments ever pass through the platform.

**Who it is for.**
- **Seekers** — people moving to (or within) Bangalore who need a room or a flatmate: young professionals (primary), students, and new arrivals who don't know the city.
- **Owners** — people with a room to offer: live-in owners with a spare room (owner-flatmates) and landlords/managers renting per-room in shared flats.

**The core user problem.** Today's options (broker networks, listing sites, WhatsApp/Facebook groups) force people to make their most expensive personal decision with zero trust: fake and stale listings, spam and broker calls, phone numbers exposed to strangers, deposit scams, and lifestyle surprises discovered only after moving in. Owners get an unstructured flood of dead-end enquiries instead of a manageable pipeline.

**The basic product journey.** A user verifies in graduated steps (phone → profile → human-reviewed ID; owners add proof of room control), discovers rooms and candidate flatmates with an honest "why this match" explanation, connects safely inside the app, chats without exposing their number until both sides agree, and meets a real person at a real room. Owners verify once, publish through a guided wizard, and manage applicants through a structured pipeline instead of an inbox.

**The main outcome per user.**
- **Seeker:** a verified profile built once → fresh, ranked rooms and explained flatmate matches → safe connect → chat → mutual-consent contact reveal → an off-platform meeting at a real room → room filled or pair formed.
- **Owner:** identity and room control verified once → listing published in a 6-step guided wizard → applicants flowing into a staged pipeline (New → Shortlisted → Chatting → Met → Selected) → room marked Filled with one tap, everywhere.

**How the product keeps that promise — six pillars (every screen serves at least one):**
1. **Graduated verification (T0→T3)** — trust is earned in steps; publishing a listing requires T3.
2. **Explained compatibility** — a transparent 0–100 score from 10 lifestyle attributes; every score shows its drivers; low scores are shown honestly, never hidden.
3. **Listing freshness** — 30-day expiry, one-tap renewal, auto-pause after 45 days of silence, and a "confirmed Xd ago" stamp on every listing surface.
4. **Contact privacy** — numbers are masked everywhere; reveal happens only by mutual consent inside chat.
5. **Owners as first-class users** — a guided publishing wizard, an applicant pipeline, and a visible response-rate reputation.
6. **Safety with teeth** — one-tap structured reporting, block, admin SLAs (safety reports triaged <12h), and automatic protections while cases are open.

**Hard scope lines for the build:** no paid tier in MVP · Bangalore only (city selector locked) · English only · PWA, not native apps · no map view · no machine-learning matching · no background-check purchases · no payment processing. Anything outside these lines is a future-version decision, not an MVP build task.

---

# SECTION 02 — PRODUCT BUILD STRUCTURE

The product is one journey system with two primary user journeys (Seeker, Owner) and supporting journeys (Returning user, Trust/Verification, Safety, Account) that cut across both. Every screen in Section 05 belongs to at least one sequence below; no screen exists outside these flows.

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
Evaluation (detail + compatibility + trust signals → save or connect)
  ↓
Connection (intro note → pending → accept/decline)
  ↓
Communication (context-anchored in-app chat)
  ↓
Consent (mutual contact reveal → phone numbers, once, in-thread)
  ↓
Real-world next step (meet / visit — guided by safety cards, off-platform by design)
  ↓
Final outcome (room Filled; listing closed everywhere; seekers keep searching or pair up)
```

## 2.2 Major product areas and how they connect

| # | Area (screens) | What it does | Connects to |
|---|---|---|---|
| 1 | **Public** (PUB-01…PUB-04) | Lets guests judge real supply and the safety model before any commitment; masked, honest projections. | → AUTH (all gated taps carry context) |
| 2 | **Authentication** (AUTH-01…AUTH-04) | Phone-first account creation, OTP verification (T0), role & intent selection that routes the whole product. | → ONB |
| 3 | **Onboarding** (ONB-01, ONB-02) | Role-specific guided wizards producing complete, matchable profiles (T1) or verified owner intent. | → HOME; → VER (owner path) |
| 4 | **Role shells** (HOME-01, HOME-02) | Personalized daily command centers: matches, picks, alerts (seeker); listings, applicant activity, response rate (owner). | → DISC · OWN · CONN · NOTIF |
| 5 | **Discovery** (DISC-01…DISC-04) | Authenticated room search with dealbreaker filters, flatmate discovery with explained fit, saved state across sessions. | → ROOM · PROF |
| 6 | **Room evaluation** (ROOM-01) | The complete decision surface for a room: facts, owner trust, occupant compatibility, connect. | → CONN · DISC-04 · SAFE-02 |
| 7 | **Profiles** (PROF-01…PROF-03) | Candidate evaluation (flatmate detail with why-this-match), self-profile editing, and the provably-faithful public preview. | → CONN · VER · ACCT-02 |
| 8 | **Preferences** (PREF-01) | Evolving must-haves and nice-to-haves; edits trigger honest async match recomputation. | → DISC-03/DISC-01 |
| 9 | **Trust & verification** (VER-01, VER-02) | T2/T3 submission and a transparent status machine (review, approved, rejected, cooling). | Gates OWN-01; badges surface everywhere |
| 10 | **Connections** (CONN-01) | Requests in/out with accept / decline / withdraw; the bridge from decision to conversation. | → CHAT |
| 11 | **Chat & consent** (CHAT-01, CHAT-02) | Context-anchored conversations with masking enforced; mutual-consent contact reveal; safety cards. | → SAFE-02 · off-platform |
| 12 | **Owner suite** (OWN-01…OWN-06) | 6-step publishing wizard, listings lifecycle management, applicant pipeline, compare, owner profile. | → VER (T3 gate) · CHAT · HOME-02 |
| 13 | **Notifications** (NOTIF-01, NOTIF-02) | One notification state home with expiry-aware deep links; per-event × per-channel control. | → any object screen |
| 14 | **Safety** (SAFE-01, SAFE-02) | Always-available safety guidance plus structured report/block with immediate automatic protections. | → ADM-07 (triage) |
| 15 | **Account** (ACCT-01…ACCT-04) | Settings hub, privacy & visibility controls, help, dignified exit (deactivate / delete with grace). | → AUTH (re-entry) |
| 16 | **Admin console** (ADM-01…ADM-09) | Founder-run internal operations: verification review, listing moderation, report cases, user management, metrics. Serves every area above. | Internal only — never linked |

**Cross-cutting rails.** Three capabilities are not screens of their own but appear across areas: **explained compatibility** (rendered on DISC-03, ROOM-01, PROF-01, CONN-01, CHAT-02, OWN-04/OWN-05), **trust badges** (rendered on every card/profile/header per C-06), and **safety exits** (report/block reachable from every surface via overflow menus).

---

---

# SECTION 03 — COMPLETE SCREEN INVENTORY

Master index of the target product: 49 screens across 16 product areas. Every screen has exactly one specification in Section 05; every Entry/Next pair is realized as a flow in Sections 04 and 06. The "Entry From / Next Screens" columns list the defined paths — the full branch logic lives in Section 04, per-screen detail in Section 05.

**Users per area (who each screen serves).** Every screen's User Context (Section 05, part 2) names its user and role explicitly. At the area level: **PUB** serves guests (unauthenticated); **AUTH** and **ONB** serve new users pre-role or mid-role-choice; **HOME-01, DISC, ROOM, PROF, PREF** serve authenticated users in seeker mode; **HOME-02, OWN** serve authenticated users in owner mode; **VER, CONN, CHAT, NOTIF, SAFE, ACCT** serve all authenticated users (both roles, plus role-shared surfaces); **ADM** is the internal console for the founding team only — it is never linked from, or reachable by, end users.

**ID rule.** Screens are identified by area-prefixed IDs (`AREA-NN`), numbered in journey order within each area. These are the IDs to use in all build tasks, tickets, and tests. Legacy blueprint IDs (S01…S49 / NM-001…NM-049) identify the same screens one-to-one and are kept only in the mapping table at the end of this section for traceability to the approved blueprint package and the forensic audit.

## 3.1 Public (PUB)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| PUB-01 | Landing / Home | Public | Direct URL, SEO, shared links, campaigns | Explain the promise (trust + compatibility + freshness); funnel to browse or signup | PUB-02 · AUTH-01 · PUB-04 · AUTH-02 |
| PUB-02 | Room Search (Public Browse) | Public | PUB-01, SEO locality pages, shared search links | Let guests judge real supply before signup | PUB-03 · AUTH-01 (auth wall) |
| PUB-03 | Room Detail (Public, Masked) | Public | PUB-02, shared cards, SEO | Full decision facts with identity masked; convert | AUTH-01 (auth wall) · PUB-02 · PUB-04 |
| PUB-04 | Trust & Safety Center (Public) | Public | PUB-01 footer, PUB-03 pointer, ads | Show the safety model before commitment; scam literacy | AUTH-01 · SAFE-02 (guest report, listing pre-carried) |

## 3.2 Authentication (AUTH)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| AUTH-01 | Signup | Authentication | All auth walls (context carried), PUB-01, PUB-04, AUTH-02 | Phone-first account creation | AUTH-03 |
| AUTH-02 | Login | Authentication | PUB-01, AUTH-01, session-expiry redirects | Returning access | AUTH-03 |
| AUTH-03 | OTP Verification | Authentication | AUTH-01, AUTH-02 | Prove phone ownership → T0 granted | AUTH-04 (new user) · return path (login) |
| AUTH-04 | Role & Intent Selection | Authentication | AUTH-03 success, ACCT-01 (role add) | Choose Seek / Offer / Both — routes the whole product | ONB-01 · ONB-02 · HOME-01 (skip → seeker default) |

## 3.3 Onboarding (ONB)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| ONB-01 | Seeker Onboarding Wizard | Onboarding | AUTH-04, resume banner on HOME-01 | One guided flow → complete, matchable profile (T1) | HOME-01 (personalized immediately) |
| ONB-02 | Owner Onboarding Wizard | Onboarding | AUTH-04 ("Offer"), ACCT-01 (role add) | Owner type, property basics, expectations, verification explainer | VER-01 (owner variant) |

## 3.4 Role Shells (HOME)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| HOME-01 | Seeker Home (Personalized) | Role shell | Bottom nav, login default, deep links | Daily command center: matches, picks, saved, alerts | DISC-01 · ROOM-01 · DISC-03 · PROF-01 · DISC-04 · CONN-01 · NOTIF-01 |
| HOME-02 | Owner Dashboard | Role shell | Bottom nav (owner mode), login default, deep links | Listings at a glance, applicant activity, response rate | OWN-01 · OWN-02 · OWN-04 · VER-01 |

## 3.5 Discovery (DISC)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| DISC-01 | Room Search (Authenticated) | Discovery | HOME-01, nav Search, DISC-04, deep links | Full search + filters + sort + freshness | ROOM-01 · DISC-02 · DISC-04 |
| DISC-02 | Advanced Filters | Discovery | DISC-01 "Advanced filters" | Dealbreaker-level filtering | DISC-01 (results re-ranked) |
| DISC-03 | Flatmate Discovery | Discovery | HOME-01 rail, nav Flatmates, DISC-04 | Ranked candidate feed with explained fit — no listing needed | PROF-01 · connect sheet |
| DISC-04 | Saved Items | Discovery | HOME-01 rail, nav | Multi-session search state home | ROOM-01 · PROF-01 · DISC-01 · DISC-03 |

## 3.6 Room Evaluation (ROOM)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| ROOM-01 | Room Detail (Authenticated) | Room evaluation | DISC-01, HOME-01 rails, DISC-04, deep links | Complete decision surface + connect | Connect sheet · DISC-04 save · PROF-01 (owner card) · SAFE-02 |

## 3.7 Profiles (PROF)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| PROF-01 | Flatmate Profile Detail | Profiles | DISC-03, CHAT-02 header, OWN-04 (read-only) | Full candidate evaluation + why-this-match | Connect sheet · CHAT-02 (if connected) · SAFE-02 |
| PROF-02 | My Profile (Edit) | Profiles | Nav Profile, ONB-01 return, HOME-01 meter | Manage identity + 10 lifestyle attributes | VER-01 · PROF-03 · ACCT-02 · PREF-01 |
| PROF-03 | Profile Public Preview | Profiles | PROF-02, ACCT-02 | See yourself exactly as others do | ACCT-02 (adjust) |

## 3.8 Preferences (PREF)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| PREF-01 | Preferences (Edit) | Preferences | PROF-02, DISC-03 chips, NOTIF-01 deep link | Evolve must-haves & nice-to-haves | DISC-03 / DISC-01 (matches recompute) |

## 3.9 Trust & Verification (VER)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| VER-01 | Verification Submission (T2/T3) | Trust & verification | PROF-02 / VER-02 CTAs, ONB-02, OWN-01 gate | T2 ID (+ T3 ownership for owners) | VER-02 (in review) |
| VER-02 | Verification Status | Trust & verification | PROF-02 card, HOME-02 gate, notifications | Transparent state machine + resubmission | VER-01 resubmit · SAFE-01 |

## 3.10 Connections (CONN)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| CONN-01 | Connections | Connections | HOME-01 pill, NOTIF-01 deep link, nav | Requests in/out: accept / decline / withdraw | CHAT-02 (accept) · PROF-01 (view profile) |

## 3.11 Chat & Consent (CHAT)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| CHAT-01 | Chat List | Chat & consent | Nav Chats, NOTIF-01 deep link | Conversation index with context + unread | CHAT-02 |
| CHAT-02 | Chat Thread | Chat & consent | CHAT-01, CONN-01 accept, ROOM-01 "Open chat" | Safe conversation + contact reveal + report | Reveal → off-platform · SAFE-02 report |

## 3.12 Notifications (NOTIF)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| NOTIF-01 | Notifications Center | Notifications | Top-bar bell, deep links | One notification state home | CONN-01 · CHAT-02 · OWN-04 · VER-02 (per object) |
| NOTIF-02 | Notification Settings | Notifications | ACCT-01, NOTIF-01 | Per-event × per-channel control | Auto-save, back |

## 3.13 Safety (SAFE)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| SAFE-01 | Safety Center (Authenticated) | Safety | PUB-04 (logged-in), chat cards, SAFE-02 confirm | Safety literacy + report entry at decision moments | SAFE-02 · ACCT-03 |
| SAFE-02 | Report / Block Flow | Safety | Overflow menus everywhere, SAFE-01 | Structured reporting with immediate protections | SAFE-01 confirmation |

## 3.14 Owner Suite (OWN)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| OWN-01 | Listing Creation Wizard | Owner suite | HOME-02, OWN-02 "New", post-verification | Structured, complete listing in 6 steps | Publish → HOME-02 (Active) · VER-01 gate |
| OWN-02 | Listings Management | Owner suite | HOME-02, nav Listings | All listings + lifecycle states + expiry nudges | OWN-03 · quick actions |
| OWN-03 | Listing Detail (Owner View) | Owner suite | OWN-02 row, HOME-02 card | Edit, pause, renew, fill, per-listing analytics | OWN-04 · edit · Mark Filled |
| OWN-04 | Applicant Pipeline | Owner suite | HOME-02, nav Applicants, OWN-03 | Stage board replacing inbox chaos | OWN-05 · CHAT-02 |
| OWN-05 | Applicant Detail & Compare | Owner suite | OWN-04 card | Candidate evaluation + side-by-side (≤3) | Stage actions · CHAT-02 · OWN-04 |
| OWN-06 | Owner Profile (Edit) | Owner suite | Nav Profile (owner mode) | Owner identity + properties + response tier | VER-01 · PROF-03 preview |

## 3.15 Account (ACCT)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| ACCT-01 | Settings | Account | Nav Profile → Settings | Account hub: phone, roles, verification, notifications, privacy, legal | NOTIF-02 · ACCT-02 · VER-02 · ACCT-03 · ACCT-04 · AUTH-04 (role add) |
| ACCT-02 | Privacy & Visibility Controls | Account | ACCT-01, PROF-03 | Photo blur, name masking, discovery opt-out | PROF-03 (live preview) |
| ACCT-03 | Help & Support | Account | ACCT-01, footer, error states | FAQ + contact form + safety links | Ticket created → SAFE-01 |
| ACCT-04 | Account Deactivation / Deletion | Account | ACCT-01 danger zone | Dignified exit: deactivate (reversible) or delete (14-day grace) | AUTH-02 (reactivation) · AUTH-01 (post-deletion) |

## 3.16 Admin Console (ADM — internal, never publicly linked)

| Screen ID | Screen Name | Product Area | Entry From | Main Purpose | Next Screens |
|---|---|---|---|---|---|
| ADM-01 | Admin Login | Admin console | Direct `/admin` route (never linked) | Hardened entry (password + TOTP) | ADM-02 |
| ADM-02 | Admin Dashboard | Admin console | ADM-01 | Queue overview + SLA health | ADM-03 · ADM-05 · ADM-07 · ADM-08 · ADM-09 |
| ADM-03 | Verification Review Queue | Admin console | ADM-02 | T2/T3 cases by age (SLA colors) | ADM-04 |
| ADM-04 | Verification Case Detail | Admin console | ADM-03 | Checklist review + decision (audited) | Decision → back to ADM-03 |
| ADM-05 | Listing Moderation Queue | Admin console | ADM-02 | Flagged / duplicate / sampled listings | ADM-06 |
| ADM-06 | Listing Moderation Detail | Admin console | ADM-05 | Review + act (approve / edit-require / unlist / remove) | Action → back to ADM-05 |
| ADM-07 | Report Queue & Case Management | Admin console | ADM-02 | Triage by severity + resolve with SLA | Disposition → back |
| ADM-08 | User Management | Admin console | ADM-02 | User 360 + suspend / ban / reinstate | Action → back |
| ADM-09 | Platform Metrics (V1) | Admin console | ADM-02 (V1 release) | Weekly marketplace-health digest | Export |

**Coverage total:** 49 screens — 48 in MVP scope; ADM-09 (Platform Metrics) is scheduled for V1. Every screen maps to at least one journey (Section 02/04), at least one flow (Section 06), and at least one feature (Section 07).

## 3.17 Legacy ID mapping (traceability only)

| New | Legacy S | Legacy NM | | New | Legacy S | Legacy NM |
|---|---|---|---|---|---|---|
| PUB-01 | S01 | NM-001 | | PUB-02 | S02 | NM-002 |
| PUB-03 | S03 | NM-003 | | PUB-04 | S04 | NM-004 |
| AUTH-01 | S05 | NM-005 | | AUTH-02 | S06 | NM-006 |
| AUTH-03 | S07 | NM-007 | | AUTH-04 | S08 | NM-008 |
| ONB-01 | S09 | NM-009 | | HOME-01 | S10 | NM-010 |
| DISC-01 | S11 | NM-011 | | ROOM-01 | S12 | NM-012 |
| DISC-02 | S13 | NM-013 | | DISC-03 | S14 | NM-014 |
| PROF-01 | S15 | NM-015 | | DISC-04 | S16 | NM-016 |
| PROF-02 | S17 | NM-017 | | PREF-01 | S18 | NM-018 |
| VER-01 | S19 | NM-019 | | VER-02 | S20 | NM-020 |
| CONN-01 | S21 | NM-021 | | CHAT-01 | S22 | NM-022 |
| CHAT-02 | S23 | NM-023 | | NOTIF-01 | S24 | NM-024 |
| NOTIF-02 | S25 | NM-025 | | SAFE-01 | S26 | NM-026 |
| SAFE-02 | S27 | NM-027 | | PROF-03 | S28 | NM-028 |
| ONB-02 | S29 | NM-029 | | HOME-02 | S30 | NM-030 |
| OWN-01 | S31 | NM-031 | | OWN-02 | S32 | NM-032 |
| OWN-03 | S33 | NM-033 | | OWN-04 | S34 | NM-034 |
| OWN-05 | S35 | NM-035 | | OWN-06 | S36 | NM-036 |
| ACCT-01 | S37 | NM-037 | | ACCT-02 | S38 | NM-038 |
| ACCT-03 | S39 | NM-039 | | ACCT-04 | S40 | NM-040 |
| ADM-01 | S41 | NM-041 | | ADM-02 | S42 | NM-042 |
| ADM-03 | S43 | NM-043 | | ADM-04 | S44 | NM-044 |
| ADM-05 | S45 | NM-045 | | ADM-06 | S46 | NM-046 |
| ADM-07 | S47 | NM-047 | | ADM-08 | S48 | NM-048 |
| ADM-09 | S49 | NM-049 | | — | — | — |

---

---

# SECTION 04 — MASTER USER JOURNEY

The complete journey from first opening NestMate to the final meaningful outcome, followed by the separate journeys for each user type and each significant state. Every arrow below is a specified screen transition (Section 05); every journey is testable end-to-end (Section 06).

## 4.1 Master journey (all users)

```text
START
 ↓
Public browse — judge real supply & the safety model before commitment (PUB-01 → PUB-02 → PUB-03)
 ↓
Authentication — phone → OTP → T0 (AUTH-01/02 → AUTH-03)
 ↓
Role & intent — Seek / Offer / Both routes everything (AUTH-04)
 ↓
Onboarding — role wizard → T1 profile (ONB-01) or owner intent (ONB-02)
 ↓
Profile & preferences complete (PROF-02 · PREF-01)
 ↓
Discovery (DISC-01 rooms · DISC-03 flatmates)
 ↓
Evaluate room / flatmate (ROOM-01 · PROF-01 — facts, trust, explained fit)
 ↓
Take action — Save (DISC-04) or Connect (intro-note sheet)
 ↓
Connection (CONN-01 — pending → accept/decline)
 ↓
Chat (CHAT-02 — masked, context-anchored)
 ↓
Consent — mutual contact reveal (numbers once, in-thread)
 ↓
Real-world decision — meet / visit (off-platform by design, safety-card guided)
 ↓
OUTCOME — room Filled (owner closes everywhere) · pair formed · seeker keeps searching
```

## 4.2 Journey: New room seeker (first visit → outcome)

```text
PUB-01 Landing → PUB-02 Public search → PUB-03 Masked detail
  → [any connect/save tap → auth wall C-07, context kept] → AUTH-01 Signup → AUTH-03 OTP
  → AUTH-04 "I'm looking" → ONB-01 Seeker wizard (6 steps, resumable)
  → HOME-01 (matches visible immediately) → DISC-01 Search / DISC-02 Filters
  → ROOM-01 Detail (facts + owner trust + occupant fit) → Save (DISC-04) / Connect (sheet)
  → CONN-01 pending → accepted → CHAT-02 → mutual-consent reveal → off-platform meeting
  → owner marks room Filled (OWN-03) → seeker sees "Filled" label in DISC-04 → next search
```
Outcome: a moved-in seeker, or an honest dead-end (expired listing → state banner + alternatives, never silence).

## 4.3 Journey: Flatmate-first seeker (no listing needed)

```text
HOME-01 → DISC-03 Flatmate Discovery (must-haves bind before ranking)
  → candidate cards (score band + 1-line why) → PROF-01 (full breakdown, both values, drivers)
  → Connect (sheet) → CONN-01 → accepted → CHAT-02 → consent reveal → meet
  → pair switches to room discovery together (DISC-01 with shared must-haves)
```
Honesty invariants: low scores shown and labelled; declined users hidden from the decliner's feed for 90 days (EC-08) — but the declined user's own feed is unaffected (state is directional).

## 4.4 Journey: Listing owner (onboard → verified → published)

```text
PUB-01 "I have a room" → AUTH-01 → AUTH-03 → AUTH-04 "Offer"
  → ONB-02 Owner wizard (type, property, expectations, verification explainer)
  → VER-01 (T2 ID + T3 ownership proof) → VER-02 In review (<24h SLA)
  → approved (badges B-3/B-4) → OWN-01 Listing wizard (6 steps) → Publish (T3 gate)
  → auto-checks → Active (HOME-02 analytics live) → seekers discover it (PUB-02/DISC-01)
```
Blocked path: unverified owner sees the T3 interstitial at OWN-01 — never an error, never a silent block (R-02).

## 4.5 Journey: Owner applicant management (request → selection → filled)

```text
Connect requests arrive → OWN-04 Pipeline (New → Shortlisted → Chatting → Met → Selected)
  → OWN-05 evaluate & compare (≤3 side-by-side, scores + badges + notes)
  → CHAT-02 conversations with applicants (masking rules identical)
  → SELECT one applicant → fill cascade (one transaction):
      listing → Filled on OWN-03 · hidden from PUB-02/DISC-01/DISC-04 ·
      non-selected applicants politely closed · seeker rows labelled "Filled"
  → or Pause / Remove at any time (never a silent alternative to closing — R-09)
```

## 4.6 Journey: Connected users (accepted → real world)

```text
CONN-01 accept → CHAT-02 opens once (context anchor: "About: 2BHK in HSR")
  → messages (phones/emails/URLs masked both sides) → risk-system cards where patterns appear
  → "Share phone number" → C-04 consent card → BOTH consent → numbers revealed once + pre-meet safety card
  → off-platform meeting (by design — the platform steps out gracefully)
  → outcome flows back: owner fill cascade (4.5) or continued search (4.2)
```

## 4.7 Journey: Returning user

```text
AUTH-02 Login → AUTH-03 → HOME-01 / HOME-02 (mode remembered)
  → NOTIF-01 → deep link to the exact object (CONN-01 row / CHAT-02 thread / OWN-04 card / VER-02 status)
  → expired object? → state banner + nearest healthy screen (EC-12), never a 404
  → continue-where-left: last search, saved items with revalidated freshness, unread badges
  → stale move-in date? → PREF-01 re-confirm → matches recompute (≤60s, honest banner)
```

## 4.8 Journey: Verified user (trust earned)

```text
Voluntary path: PROF-02 "Verify" → VER-01 (consent → document → live selfie → [owner] ownership proof)
  → VER-02 Submitted → In review → Approved → badges appear everywhere instantly (C-06)
  → trust-weighted re-ranking (feed position improves — visibly and honestly)
  → 12 months later → badge expires → re-verify prompt (VER-01)
```

## 4.9 Journey: User with incomplete profile

```text
Killed mid-wizard / abandoned onboarding → every protected route redirects to the resume point
  → ONB-01 / ONB-02 reopens at the EXACT step (all data persisted, EC-01)
  → HOME-01 / HOME-02 shows a completion nag banner until T1
  → what the user can still do: browse (PUB-02/DISC-01), save; what they cannot do yet:
     connect, appear in DISC-03, publish (gates render as guidance, not errors)
```

## 4.10 Journey: User with something pending

```text
Verification pending → VER-02 state card + SLA note; owner can draft the listing meanwhile (OWN-01 draft)
Connect pending → CONN-01 SENT row (14-day expiry shown); counterparty sees RECEIVED + notification
Listing flagged → OWN-03 "Flagged — under review" state; applicant pending → OWN-04 stage note
Report pending → SAFE-01/SAFE-02 confirmation with reference ID; auto-protections active (R-23)
```
Pending is never a dead end: each pending state names what is happening, for how long, and what the user can do meanwhile.

## 4.11 Journey: User whose action was rejected

```text
Verification rejected → VER-02 reason code + human fix → [Resubmit] → VER-01
  → second rejection → 7-day cooling period (date shown) → support path (ACCT-03)
Connect declined → sender sees "no longer active" styling after expiry; counterparty hidden 90 days (EC-08); decline is silent (R-19)
Reveal declined → CTA sleeps 7 days; chat continues normally (EC-19)
Listing edit-required/unlisted → OWN-03 state + admin note → fix → resubmit to moderation
```

## 4.12 Journey: User whose access is restricted

```text
Suspended → login → status screen + appeal; listings unlisted; counterparties see frozen threads (EC-20)
Banned → full cascade (listings unlisted, applicants auto-closed, chats read-only, sessions revoked — EC-21)
Blocked pair → mutual invisibility everywhere: feeds, search, CONN-01, CHAT-01 (masked rows)
Deactivated → everything hidden; login restores exact state (EC-23)
Deleted (14-day grace) → login cancels deletion; after grace: PII erased, messages anonymized
Expired listing → seeker-side: state banner + similar rooms; owner-side: renew window (FLOW-10)
```

## 4.13 Journey branch coverage (validated across every journey)

Every journey above was validated against the nine branches a user can hit. Each branch has a defined behaviour and a defined home in the document — none is left to improvisation:

| Branch | Defined behaviour (summary) | Where defined |
|---|---|---|
| Succeeds | Visible state change + named next screen (request in Sent, chat opens, listing Active, badges granted) | §06 flows, per-screen §7 action tables, §12 success row |
| Fails | Inline, actionable error; input preserved; idempotent retry; never a dead end | §05 global defaults; §12 failed-action rows |
| Cancels | Cancel exits a sheet/wizard with drafts kept (Save draft; Save & exit); withdrawn requests end cleanly | §08 rules 3/10; EC-10; §10.4 |
| Goes back | Back preserves filters, scroll, wizard step, composer text — losing state is a defect | §08 rule 3; §09.2 forms/filters rows |
| Waits | Pending states name what is happening, for how long, and what is possible meanwhile | §4.10; VER-02/CONN-01/OWN-04 state tables; §12 pending rows |
| Is rejected | Reason + human fix + resubmit path; social declines are silent with cooldowns | §4.11; EC-07/EC-08/EC-19; §12 rejected rows |
| Is restricted | Status screen + appeal; cascade is complete (listings, chats, sessions); counterparties see honest frozen states | §4.12; EC-20/EC-21; R-24 |
| Loses access | Session expiry → re-auth → exact deep-link target restored; deactivation reversible; deletion grace honored | §08.3; EC-23; R-27 |
| Encounters expired information | Expired objects render a state banner + nearest healthy action — never a 404, never silence | EC-12; §10.3; §12 "Listing unavailable" row |

---

---

# SECTION 05 — SCREEN-BY-SCREEN BUILD SPECIFICATION

Every screen follows the same 12-part structure. Wireframes are **functional**: they fix block order, content, CTA position, and behaviour — not visual styling. Global defaults apply to every screen unless a screen overrides them:

- **Loading** — skeleton of the primary content block; no spinners for text; ≤300ms perceived.
- **Error** — inline, actionable, never a dead end: "Couldn't load. [Retry] [Go home]". Errors never lose entered data; retries are idempotent.
- **Empty** — one honest sentence why it's empty + one primary next action. Never blank.
- **Offline** — banner "You're offline — showing saved data" where cache exists.
- **Bottom navigation** — only on the role shells (seeker 5-tab / owner 5-tab). Wizards, auth screens, detail-push screens, and admin have none.
- **One primary CTA per screen/state.** Secondary actions are text buttons or overflow menus.
- **Security baseline** — session, role, permission, and privacy checks are enforced server-side; no personal contact data appears in any payload before mutual consent; mutations are rate-limited. (Stated as behavior, never as implementation.)

Screens are presented in the product-area order of Section 03. Shared component contracts (C-01…C-08) are defined in Section 09 and referenced throughout; rules R-01…R-30 live in Section 11; edge cases EC-01…EC-28 are carried from the approved blueprint. Anything marked **OPEN DECISION** is registered in Section 18 and requires a product decision before the affected behavior is built.

## PUB-01 — Landing / Home

### 1. Purpose

Communicate the NestMate promise — verified people, explained compatibility, fresh listings — and funnel guests into public browse or signup within 10 seconds.

### 2. User Context

A guest arrives from search results, a shared link, or an ad. They know nothing about NestMate and are usually skeptical (past exposure to fake listings and broker spam). They should leave understanding the promise and either browsing real supply or starting signup — without being forced to register first.

### 3. Entry Points

- Direct URL / SEO / campaign links
- Shared links (public-safe projections, `?ref=` attribution variant)
- Logout from any authenticated screen (returns here)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  logo · "Bangalore" (locked) · Login
----------------------------------------
HERO
  Headline (value promise)
  Sub-line (verified people · explained fit · fresh rooms)
  [ ( Find a room in Bangalore ) ]        <- primary CTA (browse w/o signup)
  [ I have a room to offer ]              <- secondary (owner funnel)
ROLE TABS:  "I'm looking"  ·  "I have a room"
STAT BAND:  active listings · freshness share · verified owners (real data)
ROOM PREVIEW STRIP:  4-6 fresh listing cards (C-01, public projection)
HOW IT WORKS:  Seeker 3 steps · Owner 3 steps
TRUST EXPLAINER:  3 pillar cards -> PUB-04
SAFETY SUMMARY -> PUB-04          FAQ teaser          FOOTER (docs, contact, ToS)
----------------------------------------
(no bottom nav — public shell)
```

### 5. Components

Top bar; hero with dual CTA; role tabs; stat band; listing-card strip (C-01); step cards; trust pillar cards; footer. Auth-wall sheet (C-07) arms every gated tap downstream.

### 6. Content

- Headline + sub-line: the promise, plain words, no jargon.
- Stat band: live counts (active listings, % confirmed within 7 days, verified owners) — real data only.
- Room preview strip: 4–6 freshest active listings in public (masked) projection — photo, rent, deposit, locality, room type, freshness stamp, badge.
- How it works: seeker path (profile → connect → meet) and owner path (verify → publish → pipeline) in 3 steps each.
- Trust explainer: the three trust pillars (graduated verification, explained compatibility, freshness) linking to PUB-04.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap "Find a room in Bangalore" | Opens public browse | PUB-02 |
| Tap "I have a room to offer" | Opens signup with owner intent pre-carried | AUTH-01 |
| Tap a role tab | Switches how-it-works content (no nav change) | PUB-01 |
| Tap a room preview card | Opens public masked detail | PUB-03 |
| Tap a trust pillar card | Opens Trust & Safety Center | PUB-04 |
| Tap Login | Opens login; post-login returns to prior intent | AUTH-02 |
| Tap FAQ teaser | Expands inline answers | PUB-01 |

### 8. Navigation

No back stack (root screen) — device back exits gracefully. No bottom nav (public shell). Any deep link landing here resolves to this screen with attribution preserved. All gated taps downstream are intercepted by the auth wall (C-07) with the original action carried.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Full page with real stats + fresh cards | — |
| Loading | Hero static; stat band + card strip skeletonized | ≤300ms perceived |
| Empty (no supply) | Stat band shows zeros honestly; strip: "No live rooms yet — be first to see them" + signup CTA | Never blank; no fake numbers |
| Error (stats/cards fail) | Hero + steps render; band/strip degrade with retry link | Page never blocks on data failure |

### 10. Business / Functional Rules

1. City is locked to Bangalore (no selector, no fake "more cities"). 2. Stats are real — fabricated numbers are a defect. 3. Preview cards use the public projection: no exact address, no owner contact, freshness stamp mandatory (R-06, R-08, R-16). 4. The owner CTA starts the same auth flow as the seeker CTA — one account system, intent carried.

### 11. Cross-Screen Dependencies

Stats and cards read the same data source as DISC-01/PUB-02 (identical C-01 projection — a user tapping through must see zero contradiction). Trust-pillar copy must paraphrase PUB-04 exactly, not contradict it. Login/signup must preserve the tapped intent (seek vs offer) through AUTH-04.

### 12. Completion Criteria

- [ ] All wireframe bands render in order; one primary CTA
- [ ] Stats real; cards are C-01 public projection with freshness stamp + deposit
- [ ] Every action row in §7 behaves as specified
- [ ] Zero-supply and data-failure states render as defined
- [ ] Intent (seek/offer) survives into AUTH-04

## PUB-02 — Room Search (Public Browse)

### 1. Purpose

Let guests evaluate real Bangalore supply before committing to signup — the product's honest shop window and its SEO surface.

### 2. User Context

A guest (not logged in) arrives from PUB-01, an SEO locality page, or a shared search link. They are skeptical from past rental scams and want to judge whether NestMate has real, fresh rooms in their locality and budget before giving a phone number. Success: they can judge supply honestly in one screen and tap into a room.

### 3. Entry Points

- PUB-01 "Find a room in Bangalore"
- SEO locality pages (rooms in Bangalore by locality)
- Shared/saved search links (public projection); direct URL; back from PUB-03

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · "Rooms in Bangalore" · Login
----------------------------------------
STICKY FILTER BAR:  locality · rent range · room type
                    (public filter subset)
RESULT COUNT · Sort: Freshest (default)
----------------------------------------
RESULT LIST (C-01 public projection, infinite scroll):
  photo · rent/mo · deposit · locality · room type
  [Owner verified] · [Confirmed Xd ago]
  compatibility teaser HIDDEN (requires a profile)
----------------------------------------
STICKY PILL (after 3 card views, once per session):
  "Sign up to see which rooms match you" → AUTH-01
(no bottom nav — public shell)
```

### 5. Components

Sticky filter bar (public subset); result count and sort control; listing cards (C-01); infinite scroll with skeletons; signup pill; auth-wall sheet (C-07) arming every gated tap.

### 6. Content

- Result count, live and honest ("24 rooms"), never padded.
- Every card: photo, rent per month, deposit (always), locality, room type, freshness stamp ("Confirmed 2d ago"), Owner-Verified badge when the owner holds T3 — never an exact address, owner identity, or compatibility chip.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap a room card | Public masked detail opens | PUB-03 |
| Apply or change a filter | Result list refreshes in place; count updates | PUB-02 |
| Change sort | List re-ranks (freshness is default) | PUB-02 |
| Tap any contact/connect affordance | Auth-wall sheet restates the original action (C-07) | AUTH-01 (context carried) |
| Scroll past 3 cards | Signup pill appears once per session | Optional → AUTH-01 |

### 8. Navigation

Previous: PUB-01, external, or deep link. Back from PUB-03 restores scroll position and filters. No bottom nav (public shell). A guest who deep-links the authenticated search (DISC-01) is redirected here with the same query in public projection; top-bar Login returns here after authentication.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Loading | Skeleton cards in final layout | ≤300ms perceived |
| Empty (no match) | "No rooms match yet — new listings land daily" + [Get alerts] | C-05 pattern; never blank |
| Expired mid-scroll (EC-12) | Affected card swaps to its expired variant; list stays usable | No dead rows |
| Restricted (EC-28) | Temporary block page with an appeal link for scrape-like abuse | No personal-data amplification |

### 10. Business / Functional Rules

1. Only listings with a T3-verified owner appear in public search — unverified supply never leaks (R-04). 2. Exact address is never exposed at any depth; locality-level information only (R-08). 3. Deposit is visible on every card (R-07). 4. Freshness stamp on every card (R-06). 5. Compatibility requires a seeker profile and is never teased with fake values.

**OPEN DECISION:** The empty-state CTA "Get alerts" funnels into signup with the search context carried (EC-05), but search alerts are a V1 capability (saved-search digest) — what exactly auto-executes after onboarding at first launch: a saved-search confirmation, or is the CTA relabeled until the alerts capability ships?

### 11. Cross-Screen Dependencies

Cards must be the identical C-01 public projection used by the PUB-01 preview strip and DISC-01 authenticated results — tapping through must show zero contradiction. Auth-wall context (filters, scroll, tapped card) must survive AUTH-01 → AUTH-03 → AUTH-04 → ONB-01 and auto-resume on DISC-01 (EC-05). Expiry states shown here must agree with PUB-03 and DISC-04 saved rows (EC-12).

### 12. Completion Criteria

- [ ] Filter bar, count, sort, and cards render per §4; freshness is the default sort
- [ ] Every card passes the C-01 self-sufficiency test (value + trust + freshness in one screenshot)
- [ ] Empty, expired-mid-scroll, and rate-limit states behave as defined
- [ ] Auth-wall context carries through the full auth funnel (EC-05); no unverified-owner listing, address, or owner identity anywhere

---

## PUB-03 — Room Detail (Public, Masked)

### 1. Purpose

Present complete, honest decision facts for one room with all identity masked, and convert interest into signup at the moment intent peaks.

### 2. User Context

A guest evaluates one specific room, usually from PUB-02 or a WhatsApp-shared card. They decide "worth pursuing" here, so every decision fact (rent, deposit, rules, occupants, area) must be on the screen while owner identity and exact address stay masked.

### 3. Entry Points

- PUB-02 card tap
- Shared public cards (WhatsApp/DM) and deep links
- SEO

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · share · overflow (report)
----------------------------------------
PHOTO GALLERY:  swipeable, ≥3 photos, position dots
RENT BLOCK:  rent/mo · deposit (mandatory) · move-in date
FACT TABLE:  room type · furnishing · amenities · house
             rules · tenancy duration
TRUST ROW:  [Owner verified · month/year] · [Confirmed Xd ago]
SAFETY POINTER:  "Every NestMate owner is ID & ownership
             verified — how it works" → PUB-04
WHO LIVES HERE:  occupant count + gender composition only
LOCALITY:  name + approximate pin (never exact address)
LISTED BY:  display name only if the owner opted in + badge
----------------------------------------
STICKY BAR:  [ Connect with owner ]  ·  Ask a question
             (both auth-walled → C-07)
(no bottom nav — public shell)
```

### 5. Components

Photo gallery with swipe; fact table; amenity chips; trust badge row (C-06); sticky action bar; share; report overflow; auth-wall sheet (C-07); empty-state pattern (C-05) for unavailable states.

### 6. Content

- All mandatory listing facts: rent, deposit, move-in, tenancy duration, furnishing, amenities, house rules.
- Masked occupancy (count + gender composition only), locality with approximate pin, freshness stamp, owner badge with its verification date, safety pointer, and a similar-rooms strip (V1 scope) when unavailable — never identities or the exact address.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap "Connect with owner" / "Ask a question" | Auth wall restates the action (C-07); after onboarding it auto-executes — the question rides into the intro note (C-03, EC-05) | AUTH-01 → action resumes |
| Tap share | Public-safe share card generated (photo, rent, locality, badges, freshness) | Share sheet |
| Tap overflow → Report | Guest report path opens, listing-scoped | PUB-04 → SAFE-02 |
| Tap Save | Auth wall (C-07), save context carried | AUTH-01 |
| Tap safety pointer | Trust & Safety Center opens | PUB-04 |

### 8. Navigation

Previous: PUB-02 or deep link. Deep links land here directly in the guest projection. Back always restores PUB-02 state (scroll, filters). No bottom nav.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | All facts + ≥3 photos; trust row above the fold | — |
| Expired/Unavailable (EC-12) | State banner (paused/expired/filled) + similar rooms | Deep links resolve to state, never a 404 |
| Disabled (EC-15) | Gallery re-validates to ≥1 photo after moderation removal, or the listing auto-pauses | Never renders an empty gallery |
| Pending (verification under review) | Explanatory banner on the trust row | Badge withheld until review resolves |

### 10. Business / Functional Rules

1. No owner phone, email, or ID exists in any guest-visible payload — masking is absolute pre-consent (R-16). 2. The locality pin is approximate, never the real address (R-08). 3. "Who lives here" shows counts and gender composition only. 4. Badges always carry their verification date. 5. Deposit renders as a mandatory, prominent field (R-07).

### 11. Cross-Screen Dependencies

Same listing record as the C-01 card in PUB-02/DISC-01 — rent, deposit, badge, and freshness stamp must be identical across surfaces. The connect intent must survive AUTH-01 → AUTH-04 → ONB-01 and auto-execute as a connect request (C-03) afterward (EC-05). The report path pre-carries the listing ID into SAFE-02. Share-card content must match exactly what this screen shows.

### 12. Completion Criteria

- [ ] All facts render; trust row above the fold; one primary CTA
- [ ] Masking verified: no identity, contact detail, or exact address anywhere
- [ ] Unavailable, degraded-gallery, and under-review states behave as defined
- [ ] Connect intent survives the full auth funnel and auto-executes (EC-05); back restores PUB-02 scroll + filters

---

## PUB-04 — Trust & Safety Center (Public)

### 1. Purpose

Explain the trust model before any commitment — how graduated verification works, what badges mean, how reports are handled — turning skeptics into signups.

### 2. User Context

A cautious visitor (from PUB-01's trust explainer, PUB-03's safety pointer, or an ad) wants proof NestMate is safe before handing over a phone number. They should leave able to explain verification, freshness, and privacy to a friend.

### 3. Entry Points

- PUB-01 footer and trust-pillar cards
- PUB-03 safety pointer and guest report path
- Ads / social bios
- SAFE-01 (authenticated users crossing over)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · "Trust & Safety"
----------------------------------------
CONTENTS (anchor chips):  Verification · Badges · Scams · Meet safely · Privacy
SECTION:  Verification tiers, plain language — T0 phone · T1 profile · T2 ID + selfie · T3 ownership
  Disclaimer: "Verification ≠ endorsement. Always meet in
  person before paying."
SECTION:  Badge gallery — B-1…B-5 cards with meanings
SECTION:  How we handle reports — safety <12h · other <48h ·
  every report gets an outcome
SECTION:  Scam patterns (expandable): visiting-pass fraud ·
  deposit-before-visit · owner refuses to meet
SECTION:  Meet-safe checklist (5 items)
SECTION:  Privacy promise: "Your number stays hidden until
  you both agree to share."
----------------------------------------
CTA BAND:  [ Create your verified profile ] → AUTH-01
(no bottom nav — public shell)
```

### 5. Components

Sectioned article layout; anchor chips; tier table; badge cards (C-06 meanings); expandable scam-pattern items; CTA band.

### 6. Content

- T0–T3 in plain language (what each tier proves, who reaches it, what it permits) and all five badges with meanings.
- Report SLAs in honest numbers; dominant local scam patterns and how NestMate structurally blocks each; the 5-item meet-safe checklist; the one-sentence privacy promise; the verification-≠-endorsement disclaimer.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap "Create your verified profile" | Signup opens with trust context carried | AUTH-01 |
| Tap / expand a scam pattern | Detail reveals in place | PUB-04 |
| Tap an anchor chip | Scrolls to that section | PUB-04 |
| (Logged-in) tap safety links | Authenticated Safety Center opens | SAFE-01 |

### 8. Navigation

Previous: PUB-01/PUB-03/external; back returns to the prior position. No bottom nav. The logged-in variant swaps the CTA band for authenticated links (SAFE-01) — same content, one narrative.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Full article, all sections | Static content, fast render |
| Loading | Section skeleton | ≤300ms perceived |
| Error | Inline retry; article chrome still renders | Page never blocks entirely on content failure |

### 10. Business / Functional Rules

1. Safety content is a versioned single source — this center and SAFE-01 must never contradict (R-30). 2. SLA numbers shown are the real SLAs (safety <12h, other <48h — R-22). 3. The disclaimer "verification ≠ endorsement" is mandatory and non-removable. 4. Badge meanings state exactly what each badge certifies (R-01).

### 11. Cross-Screen Dependencies

Tier definitions must match what VER-01/VER-02 actually collect and display; badge meanings must match C-06 rows on PUB-03, DISC-01, ROOM-01, and PROF-01. The privacy promise must match the reveal consent card (C-04) and ACCT-02 controls. Report-SLA copy must match SAFE-01 and what SAFE-02 enforces. The CTA's trust context must survive into AUTH-04.

### 12. Completion Criteria

- [ ] All sections render in order; disclaimer present
- [ ] Every claim matches enforcement reality (SLAs, badges, tiers)
- [ ] CTA carries context into AUTH-01
- [ ] Logged-in variant routes to SAFE-01; copy is the versioned single source shared with it

---

## AUTH-01 — Signup

### 1. Purpose

Phone-first account creation with minimal friction: one field, two consents, one tap — then straight into OTP.

### 2. User Context

A guest who tapped a gated action (connect/save) or a main CTA. They are interrupted mid-intent and impatient: the screen must restate their goal, take a phone number, and move on in seconds.

### 3. Entry Points

- Every auth wall (C-07) with the interrupted action carried (EC-05)
- PUB-01 and PUB-04 CTAs
- AUTH-02 "Create an account"
- AUTH-03 "Change number"

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back (returns to the interrupted context)
----------------------------------------
CONTEXT LINE (when auth-walled):
  "You're one step from connecting about this room."
HEADLINE:  Create your free account
SUB-LINE:  no passwords · about 30 seconds
PHONE FIELD:  [+91 locked] · number · inline validation
CONSENT CHECKBOXES (unchecked, blocking):
  Terms of Service · Privacy Policy (documents open as sheets)
[ Continue ]                 ← sends the OTP
"I already have an account" → AUTH-02
----------------------------------------
(no bottom nav)
```

### 5. Components

Phone input with country lock (+91) and inline validation; consent checkboxes with versioned linked documents; primary CTA (disabled until both consents ticked); login switch link; auth-wall context line.

### 6. Content

- Minimal: phone field, two consent lines, reassurance sub-line; email-login expectation note stated plainly.
- When arriving from an auth wall: a context line restating the exact interrupted action in the user's words ("connecting about this room", "saving this room").
- Existing-account and cooldown copy per §9.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Enter valid phone + both consents + Continue | OTP dispatched (rate-limited); transition ≤1s | AUTH-03 |
| Enter a number that already has an account | No enumeration error — gentle sheet: "This number already has an account — Log in", number prefilled (EC-02) | AUTH-02 |
| Hit the send rate limit | Cooldown message with a live timer | AUTH-01 |
| Continue with a consent unticked | CTA stays disabled until both are ticked | AUTH-01 |
| Tap "I already have an account" | Login opens with the number carried | AUTH-02 |

### 8. Navigation

Back always returns to the interrupted context (PUB-03/PUB-02/etc.) — never to a dead start. No bottom nav. Leaving via device back preserves the carried action for return.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Phone field + consents + disabled CTA | Consent gating enforced |
| Error (invalid number) | Field-level message naming the fix | Entered data never cleared (EC-16) |
| Restricted (rate-limited) | Cooldown message with live timer | Retry allowed after cooldown |
| Default — existing number (EC-02) | Gentle login sheet, number prefilled | Never an error wall; no enumeration |

### 10. Business / Functional Rules

1. Consent timestamps are recorded per document version; both consents are required and blocking. 2. OTP sending is rate-limited per phone and per network — abuse-resistant, invisible to honest users. 3. The interrupted action (connect/save) is stored and auto-executes after onboarding; the user never re-navigates manually (EC-05). 4. Signup never discloses account existence beyond the graceful dedupe path (EC-02).

### 11. Cross-Screen Dependencies

The phone number carries verbatim into AUTH-03's masked target. The carried context must survive AUTH-03 → AUTH-04 → ONB-01 and execute on the target screen (PUB-03 connect → C-03; save → DISC-04). The dedupe narrative must be identical to AUTH-02's framing — one story, two doors. Consent state must reconcile with what ACCT-01 later shows.

### 12. Completion Criteria

- [ ] Valid phone + consents → AUTH-03 with OTP sent, ≤1s transition
- [ ] EC-02 dedupe sheet renders; no enumeration anywhere
- [ ] Consent gating + versioned timestamps work
- [ ] The carried action survives to auto-execution (EC-05)
- [ ] Back never strands the user outside their context

---

## AUTH-02 — Login

### 1. Purpose

Fast returning access via one phone number and an OTP — no passwords anywhere.

### 2. User Context

A returning user (or a suspended user hitting the auth guard) wants back in fast. Returning users should reach OTP with a single field entry; suspended users must meet a coherent, dignified state screen.

### 3. Entry Points

- PUB-01 "Login"
- AUTH-01 "I already have an account" (number prefilled)
- Session-expiry redirects (return target preserved)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · "Log in"
----------------------------------------
HEADLINE:  Welcome back
PHONE FIELD:  [+91] · number
HINT (remembered device):
  masked recent number as a one-tap option
[ Send code ]                → AUTH-03
"New here? Create an account" → AUTH-01
"Need help?" → ACCT-03
----------------------------------------
(no bottom nav)
```

### 5. Components

Phone field; remembered-device hint chip (masked number); primary CTA; signup link; help link.

### 6. Content

- Phone prompt; reassurance ("no passwords — we text you a code").
- Remembered-device hint: the masked recent number, framed as one tap.
- Help link for trouble cases.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Enter phone + Send code | OTP dispatched (rate-limited) | AUTH-03 |
| Tap the remembered-number hint | Number prefilled; one tap to send | AUTH-03 |
| Log in on a suspended account | State screen: status + appeal path; no enforcement detail (EC-20) | Suspended state screen |
| Tap "Create an account" | Signup opens | AUTH-01 |
| Tap "Need help?" | — | ACCT-03 |

### 8. Navigation

Previous: PUB-01/AUTH-01/redirect. Next: AUTH-03, then the preserved return target (HOME-01, HOME-02, or the resumed deep link). No bottom nav.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Phone field + hint chip | One-entry fast path |
| Error (invalid number) | Field-level message naming the fix | Data preserved |
| Restricted (suspended, EC-20) | Status + appeal path; no app access | Same response shape whether or not the number exists — no enumeration |
| Disabled (deleted past grace) | "This account was deleted" notice | Routes to AUTH-01 |
| Error (generic) | Retry message; no system detail | No secret leakage |

### 10. Business / Functional Rules

1. No enumeration: responses for existing vs non-existing numbers are indistinguishable in shape (EC-02). 2. Suspension messaging reveals only status + appeal — never enforcement reasons or internals (R-24). 3. After OTP success the user lands where they were heading; the redirect target survives the entire flow.

### 11. Cross-Screen Dependencies

The return target (deep link, prior screen, or role home) must survive AUTH-03 and land correctly: seekers → HOME-01, owners → HOME-02, Both → last mode. The suspended state screen is the same one the app-wide route guard shows — one narrative. The deleted-account notice must match ACCT-04's deletion copy.

### 12. Completion Criteria

- [ ] Returning user reaches OTP in one field-entry; hint path is one tap
- [ ] No enumeration in any response shape
- [ ] Suspended users get status + appeal, nothing more (EC-20)
- [ ] Return target survives to post-OTP landing
- [ ] Deleted-account notice routes to AUTH-01

---

## AUTH-03 — OTP Verification

### 1. Purpose

Prove phone ownership — the act that grants T0, the trust floor every account starts from.

### 2. User Context

A user mid-auth, code just sent, wants to be inside the product in under 30 seconds. Wrong codes, slow SMS, and typos are normal; the screen must make recovery effortless without opening abuse doors.

### 3. Entry Points

- AUTH-01 Continue
- AUTH-02 Send code

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back
----------------------------------------
HEADLINE:  Enter the 6-digit code
TARGET:  sent to +91 ••••••12345   [Change number → AUTH-01]
CODE INPUT:  6 segmented boxes · paste supported ·
             auto-submits on the 6th digit
[ Verify ]
RESEND:  countdown chip (60s) → becomes "Resend code"
----------------------------------------
(no bottom nav)
```

### 5. Components

Segmented 6-digit input (paste + auto-submit); masked target number; change-number link; countdown chip; resend control.

### 6. Content

- Where the code was sent (masked) and the change-number affordance.
- Resend timing; on repeated failure, honest remaining-attempt context before a lock.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Enter correct code | Session created; T0 recorded silently | AUTH-04 (new user) or preserved return path |
| Enter wrong code | Inline error; boxes clear; retry | AUTH-03 |
| Code expired | Resend prompt replaces the input error | AUTH-03 |
| Tap Resend | New OTP after the 60s cooldown (max 3/hour) | AUTH-03 |
| 5 consecutive failures | 30-minute lock with a support link (EC-03) | Lock state |
| Tap "Change number" | Number kept for editing | AUTH-01 |

### 8. Navigation

Previous: AUTH-01/AUTH-02. Next: AUTH-04 (new accounts) or the preserved return path (login and deep-link flows). Back re-enters the preceding auth screen without losing the number. No bottom nav.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Segmented input, countdown, masked target | SMS auto-read attempted where the platform allows |
| Verifying | Brief validating feedback; double-submit safe | Idempotent |
| Error (wrong code) | Inline error; input clears for retry | Attempt counter honest |
| Expired | Expiry message; resend becomes the primary action | Old code unusable |
| Restricted (locked, EC-03) | 30-minute lock with a support link | Support path → ACCT-03 |
| Success | — | T0 granted → AUTH-04 or return path |

### 10. Business / Functional Rules

1. The code is single-use and short-lived; verification is comparison-safe server-side and lockout counters live server-side (no client bypass). 2. T0 is granted automatically on success and is the floor for every badge shown elsewhere (R-01). 3. Resend: 60s cooldown, max 3/hour; 5 consecutive failures → 30-minute lock with a support path — honest users are never dead-ended (EC-03).

### 11. Cross-Screen Dependencies

The verified number becomes the account identity shown masked in AUTH-02 hints and ACCT-01. T0 status feeds VER-02 and every C-06 badge row (PUB-03, DISC-01, PROF-01, ROOM-01). New-user routing to AUTH-04 must respect carried auth-wall context (EC-05). Resend/lock policy must match the cooldown messaging shown in AUTH-01.

### 12. Completion Criteria

- [ ] Correct code → session + T0 in under 30 seconds typically; paste and auto-submit work
- [ ] Wrong/expired/locked states all recoverable and support-linked
- [ ] Resend cooldown + hourly cap enforced
- [ ] New users → AUTH-04; returning users → preserved target
- [ ] T0 reflected on VER-02 and badge rows immediately

---

## AUTH-04 — Role & Intent Selection

### 1. Purpose

Route every freshly verified user into the correct product half — seeking or offering — and record role(s) explicitly.

### 2. User Context

A user who just verified (or an authenticated user adding a role from settings). They know why they came; the screen should feel like a two-door lobby, not a form. Users arriving from an auth wall must see their original intent honored here.

### 3. Entry Points

- AUTH-03 success (new accounts)
- ACCT-01 role-add path (upgrading users)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  minimal · account chip
----------------------------------------
HEADLINE:  What brings you to NestMate?
SUB-LINE:  You can change this anytime.
CARD 1:  "I'm looking for a room / flatmates"  → ONB-01
CARD 2:  "I have a room to offer"              → ONB-02
SMALL OPTION:  "I want both"  (seeker flow first; owner
               mode addable and switchable later)
[ Skip for now ]  → seeker default, profile prompts later
----------------------------------------
(no bottom nav)
```

### 5. Components

Two large tap cards (tap = continue, no extra CTA); "Both" chip option; skip link; role pre-highlight when arriving with carried intent.

### 6. Content

- Two value-framed choices in the user's own words.
- The "Both" explanation: do both — switch anytime via the persistent mode chip.
- Skip framing: honest about the seeker default and the prompts that will follow.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap "I'm looking for a room" | Seeker role stored | ONB-01 |
| Tap "I have a room to offer" | Owner role stored | ONB-02 |
| Tap "I want both" | Both roles stored; seeker flow first | ONB-01 |
| Tap Skip | Seeker mode defaulted; prompts later | HOME-01 (or carried auth-wall context executes) |
| (Upgrade variant) add owner role | Owner role added; no re-signup | ONB-02 |

### 8. Navigation

Previous: AUTH-03 or ACCT-01. Next: ONB-01/ONB-02. Back from a wizard returns here only if no role was committed. Carried auth-wall context (EC-05) is never dropped at this screen: it executes after the chosen wizard — including after Skip.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default (new user) | Two cards + Both + Skip | Tap = continue |
| Default (intent carried) | The carried intent's card pre-highlighted | Context restored after the wizard (EC-05) |
| Default (upgrade variant) | Copy adapts ("Add owner mode") | Existing profile untouched; no re-registration |

### 10. Business / Functional Rules

1. Role selection is always explicit — never inferred from behavior. 2. "Both" is first-class: both roles coexist, with a persistent Seeking ⇄ Offering mode chip once onboarding completes. 3. An existing user adding a role never re-registers or re-verifies — one account, multiple roles. 4. Skip is honest: it defaults to seeker mode and says so.

### 11. Cross-Screen Dependencies

Roles selected here gate the shells: HOME-01 vs HOME-02 bottom navs and the mode chip. Intent carried from PUB-01 ("I have a room to offer") must pre-highlight the owner card. The auth-wall context (connect/save) must survive Skip and the wizard and auto-execute on HOME-01 (EC-05). The upgrade path from ACCT-01 must not disturb existing profile or verification state.

### 12. Completion Criteria

- [ ] Each card routes to the correct wizard; roles persisted
- [ ] "Both" stores both roles, seeker flow first
- [ ] Skip lands seeker-default with prompts, context intact
- [ ] Upgrade variant never re-registers
- [ ] Carried intent pre-highlights the matching card

---

## ONB-01 — Seeker Onboarding Wizard

### 1. Purpose

One guided flow that produces a complete, matchable seeker profile — finished once, durable forever, resumable losslessly.

### 2. User Context

A new seeker (or the seeker half of a "Both" user) answers six short questions. Each step takes under 30 seconds and every answer is saved immediately. Sensitive questions carry "why we ask" notes so honesty feels safe.

### 3. Entry Points

- AUTH-04 (seeker card, Both, or Skip)
- HOME-01 resume banner (exact step, EC-01)

### 4. Functional Wireframe

```text
----------------------------------------
WIZARD FRAME (C-08, no bottom nav):  progress dots ·
  Step N of 6 · [Save & exit]
ONE question per view; "why we ask" microcopy on sensitive steps
STEP 1 Basics:     name · photo (optional, prompted) ·
                   occupation · age band
STEP 2 Location:   city = Bangalore (locked) · localities
                   multi-select · optional commute anchor
STEP 3 Budget:     rent range · deposit tolerance
STEP 4 Move-in:    date or month · tenancy duration
STEP 5 Lifestyle:  10 canonical attributes, one per view,
                   plain language (food · cleanliness · smoking · sleep ·
                   alcohol · noise · guests · pets · work pattern · gender pref)
STEP 6 Must-haves: hard-filter toggle cards (women-only · non-smoker ·
                   veg kitchen · no pets · …) — "we'll only show you these"
[ Skip (where legal) ]      [ Continue ] → final: [ Find my match ]
END CARD (non-blocking): "Verify your ID to boost responses — about 2 min" → VER-01
----------------------------------------
```

### 5. Components

Wizard skeleton (C-08): progress bar, per-step validation, photo uploader (permission requested only on opt-in), segmented attribute pickers, must-have toggle cards with consequence notes, "why we ask" microcopy.

### 6. Content

- Six sub-30-second steps, one idea per view; every lifestyle question in plain language plus a one-line privacy note (who can see the answer).
- Must-haves explained as binding filters, preferences as soft; the end card is a non-blocking verification prompt with honest benefit framing.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Complete a step | Saved immediately (idempotent per step) | Next step |
| Skip a skippable step | Marked incomplete; HOME-01 prompts later | Next step |
| Abandon / kill the app | All entered data persisted | HOME-01 resume banner → exact step (EC-01) |
| Tap "Find my match" | Profile complete → T1; matches computed | HOME-01 |
| Tap the verify prompt | — | VER-01 |

### 8. Navigation

Entry: AUTH-04 or the resume banner. Exit: explicit "Save & exit" only — prevents half-state limbo. No bottom nav inside the wizard. Back always preserves; resume always lands on the exact abandoned step (EC-01).

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Error (validation, EC-16) | Inline, field-level, non-destructive | Nothing lost on retry |
| Incomplete (resume, EC-01) | Restarts at the exact step with prior answers | Never restarts from zero |
| Default (past move-in date, EC-24) | Inline re-confirm before continuing | Date must be future or explicitly confirmed |

### 10. Business / Functional Rules

1. The 10 lifestyle attributes are canonical — identical taxonomy everywhere answers are shown or scored. 2. Lifestyle answers are visible to other authenticated users only, never to the public. 3. Must-haves are hard filters applied before ranking; preferences are soft — never conflated (R-13). 4. Gender preference is applied as a filter, never as a score input. 5. Completing the wizard grants T1 only when the profile is genuinely complete (R-01).

### 11. Cross-Screen Dependencies

The attribute taxonomy must equal what PROF-01 and DISC-03 display and what match explanations cite (R-11/R-12). Must-haves bind DISC-01/DISC-03 filtering — including the EC-14 "must-haves exclude all" empty state — and PREF-01 editing. Profile completeness feeds HOME-01's meter and PROF-02. T1 completion must surface on VER-02 and C-06 badge rows. Resume state is shared state with HOME-01's banner.

### 12. Completion Criteria

- [ ] All 6 steps render one-question-per-view with per-step persistence
- [ ] Skip/Back/resume lossless (EC-01); "Find my match" → HOME-01 with results visible immediately
- [ ] Must-haves vs preferences correctly wired to discovery (R-13)
- [ ] Verify prompt is non-blocking and routes to VER-01

---

## ONB-02 — Owner Onboarding Wizard

### 1. Purpose

Establish the owner's identity, property intent, and household expectations — and set the verification expectation before real effort is invested, so publishing never arrives as a surprise.

### 2. User Context

A new owner (living-in owner-flatmate or landlord) has just chosen "I have a room" at signup, or an existing seeker has added owner mode. They are motivated but busy, wary of onerous processes, and should finish knowing exactly what publishing requires — with property basics saved even if they abandon midway.

### 3. Entry Points

- AUTH-04 — Role & Intent Selection ("I have a room")
- ACCT-01 — Settings, "Add owner mode" (Both users)
- Onboarding guard resume — any protected route with this wizard incomplete reopens it at the exact step (EC-01)

### 4. Functional Wireframe

```text
----------------------------------------
WIZARD (no bottom nav):  dots · "Step N of 4" · [Save & exit]
STEP 1 OWNER TYPE:  "I live here and have a spare room" (owner-flatmate)
        vs "I own / manage the property" (landlord) — switches later copy
STEP 2 PROPERTY BASICS:  locality · flat type · rooms total / occupied
STEP 3 EXPECTATIONS PREVIEW:  gender composition · veg / non-veg ·
        non-smoking — "seekers see this on your listing"
STEP 4 VERIFICATION EXPLAINER:  identity + room control to publish;
        review <24h; seekers see a badge — never documents (C-06)
        [Why verify? -> PUB-04]   [ ( Start verification ) ]
----------------------------------------
```

### 5. Components

Wizard skeleton (C-08): progress dots, "Step N of 4", Save & exit, back-preserving steps, "why we ask" microcopy on the expectations step. Card selectors for owner type; short validated fields for property basics; explainer card with the trust badge gallery (C-06).

### 6. Content

- Step 1: two owner paths with a one-line consequence each ("seekers see your lifestyle and match with you" vs "you'll list rooms; tenants apply").
- Step 2: locality, flat type, total and occupied rooms — enough to prefill a first listing. Step 3: factual household norms only — never free-text exclusion phrasing (R-14).
- Step 4: the verification promise (identity + room control, <24h human review, badge not documents) plus a link to the public trust explainer.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Select owner type, tap Continue | Choice stored; later copy switches variant | ONB-02 (step 2) |
| Complete a step, tap Continue | Inline-validated and saved per step (EC-16); expectations stored as declared norms | ONB-02 (next step) |
| Tap "Start verification" | Owner profile saved; verification opens (owner variant: identity + room control) | VER-01 |
| Tap "Save & exit" | Draft kept; resumable at the exact step | HOME-02 (resume banner) |
| Tap "Why verify?" | Public trust explainer; wizard state preserved | PUB-04 (return) |
| Abandon mid-wizard or kill the app | All completed steps persisted | resume at exact step |

### 8. Navigation

Previous: AUTH-04 or ACCT-01. Next: VER-01 on Start verification; HOME-02 on Save & exit. No bottom nav (wizard lock — exit is explicit). Device back preserves the current step's data. Resume always reopens at the exact saved step (EC-01); if an existing listing draft is detected, the wizard offers to resume that draft instead of starting over.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Current step content; one primary CTA per step | advance only when valid |
| Loading | Skeleton of the current step | ≤300ms perceived |
| Incomplete (validation) | Inline field error naming cause + fix; nothing cleared | step cannot advance (EC-16) |
| Draft resume | "Pick up where you left off — Step N of 4"; matching banner on HOME-02 | exact-step resume (EC-01) |
| Error (save fails) | Inline retryable error; entered data intact | idempotent retry |

### 10. Business / Functional Rules

1. Expectations use only the approved ethical set — owners declare household norms; applicant filtering by protected attributes does not exist anywhere downstream (R-14).
2. Verification is framed here as the requirement for publishing — non-negotiable but explained before effort is spent (R-02), never sprung at publish time.
3. Owner type is editable later on OWN-06, and it drives copy variants and scoring behavior downstream.
4. Every completed step saves immediately; abandonment never loses data (EC-01).

### 11. Cross-Screen Dependencies

Owner type (Step 1) drives copy on OWN-01 (owner-flatmate adds the personal lifestyle block that scores) and the owner-type display on OWN-06. Step 3 norms must render identically in OWN-01's occupancy step and OWN-06's lifestyle summary — one source of truth. Step 2 property basics prefill OWN-01's first listing and OWN-06's properties list. The Step 4 promise must match VER-01/VER-02 copy and PUB-04's trust explainer exactly. Draft state must agree with HOME-02's resume banner.

### 12. Completion Criteria

- [ ] All 4 steps render in order with progress dots and one primary CTA each
- [ ] Owner type switches copy variants; expectations offer only the ethical set (R-14)
- [ ] Save & exit and mid-wizard abandonment both resume at the exact step (EC-01)
- [ ] Start verification lands on VER-01 owner variant (identity + room control)
- [ ] An existing listing draft triggers the resume offer, not a fresh start

---

## HOME-01 — Seeker Home (Personalized)

### 1. Purpose

The seeker's daily command center: what's new, what matches, what needs action — in one glance.

### 2. User Context

A seeker in seeking mode opens the app or logs in. They want their best new options, pending conversations, and any nudges (finish profile, verify ID, re-confirm move-in) without hunting. Every rail must degrade independently.

### 3. Entry Points

- Bottom-nav Home (seeker shell)
- Login default for seekers
- Deep links (object-aware fallback when the target expired, EC-12)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  "NestMate" · mode chip (Both users) · bell (badge)
----------------------------------------
GREETING + profile completeness meter (visible only <100%)
RESUME-ONBOARDING BANNER (only if ONB-01 incomplete) → exact step
VERIFICATION NUDGE CARD (only if T0-only):
  "ID-verified profiles get about twice the responses" → VER-01
RECOMMENDED ROOMS (rail of 6):  C-01 cards with freshness
  stamps + compatibility chip where computable
MATCHED FLATMATES (rail of 6):  C-02 cards with score band +
  one-line "why" (e.g., "same food & schedule")
CONTINUE RAIL:  last search · recently viewed · saved (revalidated states shown honestly)
PENDING-REQUESTS PILL:  "2 connection requests" → CONN-01
----------------------------------------
BOTTOM NAV:  Home · Search · Flatmates · Chats (badge) · Profile
----------------------------------------
```

### 5. Components

Horizontal rails with per-rail loading/error; listing cards (C-01); flatmate cards (C-02); empty-state variants per rail (C-05); completeness meter; pending-requests pill; mode chip; seeker-shell bottom nav.

### 6. Content

- Top-6 recommended rooms ranked by freshness × compatibility; every card freshness-stamped.
- Top-6 flatmate matches with band + score and a one-line reason; low matches labelled honestly, never hidden.
- Continue rail (last search, recently viewed); saved rail with expired/paused states marked.
- Pending-requests count; verification nudge (T0-only); profile-completeness meter.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap a room card | Authenticated detail opens | ROOM-01 |
| Tap a flatmate card | Profile with match explanation opens | PROF-01 |
| Tap the search bar / any "See all" | Full search or the respective surface opens with context | DISC-01 / DISC-03 / DISC-04 |
| Tap the pending-requests pill | Connections open | CONN-01 |
| Tap the resume banner | Wizard opens at the exact step | ONB-01 |
| Tap the verification nudge | — | VER-01 |
| Pull to refresh | Rails re-render; recompute shown honestly ("matches updating") | HOME-01 |

### 8. Navigation

Root of the seeker shell — device back exits gracefully. Bottom nav present (5 tabs); tab switches preserve per-tab state. Bell → NOTIF-01. Top-bar shell chrome (overflow) follows the seeker-shell contract. Deep links into expired objects fall back here with a state banner (EC-12).

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Loading | Rail skeletons; header renders first | ≤300ms perceived |
| Empty (new user) | Resume-onboarding banner (EC-01) or honest city-supply message + widen CTA (EC-14) | Never blank |
| Pending (stale preferences, EC-24) | Re-confirm banner: "Your move-in date passed — still looking?" → PREF-01 | Matches recompute after confirmation |
| Error (rail failure) | One broken rail retries individually | Never kills the page; deleted-user items silently pruned (EC-13) |

### 10. Business / Functional Rules

1. Pre-connect, flatmate rails show only what masking allows: no contact details, photo blur per the user's visibility controls. 2. Freshness stamps appear on every listing card, always (R-06). 3. Match explanations are honest — score band + reason on the card; low matches labelled, never hidden (R-11, R-12). 4. Each rail degrades independently; one failure never blanks the home. 5. The verification nudge shows only while the account is T0-only.

### 11. Cross-Screen Dependencies

Rails consume the same ranking and card projections as DISC-01/DISC-03 — tapping through shows zero contradiction. The pending-request count must equal CONN-01's received pending rows; the Chats badge must equal CHAT-01 unread. Saved-rail states must match DISC-04 revalidation (EC-12). The completeness meter must match PROF-02 progress. The resume banner must open ONB-01 at the exact step. For Both users, the mode chip must agree with HOME-02.

### 12. Completion Criteria

- [ ] All rails render in content order; one glance shows what's actionable
- [ ] EC-01/EC-14/EC-24/EC-13 states behave as defined
- [ ] Counts (requests, unread) reconcile with CONN-01/CHAT-01
- [ ] Masking honored on all flatmate rails; every empty rail carries an honest sentence + next action

## HOME-02 — Owner Dashboard

### 1. Purpose

The owner command center: everything that needs attention today, priority-ordered, each item actionable in one tap — so an owner can run their rental in under a minute a day.

### 2. User Context

An owner (mode: Offering) opens the app between meetings. They do not want to browse; they want to know: any new applicants, anything expiring, anyone waiting on a reply. They should see the answers instantly and act without hunting through menus.

### 3. Entry Points

- Owner bottom-nav "Dashboard" tab
- Owner-mode login default (AUTH-02 lands owners here)
- Mode switch from HOME-01 (Both users — Seeking ⇄ Offering chip)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  "Dashboard" · mode chip (Both users) · bell · ⋯
UNVERIFIED? -> banner: "Verify to publish — review <24h" -> VER-01
ATTENTION STRIP (priority-ordered):  "3 new applicants" -> OWN-04 ·
  "Listing expires in 3d — renew" -> OWN-02 · "2 chats awaiting reply" -> CHAT-01
LISTING CARDS:  state chip · freshness stamp · views/saves/connects mini
PIPELINE QUICK-GLANCE:  New 3 · Chatting 2 · Met 1 -> OWN-04 · RESPONSE METER: "~4h — Top responder"
[ ( + New listing ) ]                    <- primary CTA
BOTTOM NAV:  Dashboard · Listings · Applicants(badge) · Chats · Profile
----------------------------------------
```

### 5. Components

Attention strip (priority-ordered items, each with its own CTA); listing summary cards (owner variant of C-01: state chip + freshness stamp + mini analytics); pipeline quick-glance; response-rate meter; verification banner; owner 5-tab shell.

### 6. Content

- Attention items in urgency order: new applicants → chats awaiting reply → expiry nudges (day-27, R-05); expiring cards carry one-tap Renew.
- Per listing: true state chip, "confirmed Xd ago" freshness stamp (R-06), views/saves/connects mini. Response rate: platform-computed tier only — Top responder / Fast / Standard / Slow — never self-declared.
- Empty states: no listings → "Publish your first room" walkthrough CTA; no applicants → "Applicants usually arrive within 48h of a fresh listing".

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap an attention item | Opens the exact surface for that item | OWN-04 / OWN-02 / CHAT-01 |
| Tap Renew on an expiring card | +30 days; freshness stamp resets; confirm toast (R-05) | HOME-02 (updated) |
| Tap a listing card | Owner listing detail | OWN-03 |
| Tap pipeline quick-glance | Stage board for that listing | OWN-04 |
| Tap "+ New listing" | Creation wizard; publish gate applies at publish | OWN-01 |
| Tap verification banner / switch mode | Verification opens, or shell swaps with per-mode state preserved | VER-01 / HOME-01 |

### 8. Navigation

Tab root of the owner shell — device back exits gracefully. Bottom nav: 5 owner tabs, Applicants badge = New-applicant count. Notification deep-links land on the object's own screen, not here. Mode switching never loses draft or chat state. Expired-object deep-links resolve to their state view (EC-12), never an error.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Attention strip + listing cards + meters | — |
| Loading | Skeleton of strip and first cards | ≤300ms perceived |
| Empty (no listings) | "Publish your first room" walkthrough CTA (C-05) | primary CTA → OWN-01 |
| Expiring (day-27+) / Expired / Auto-paused | Nudge in strip + one-tap Renew / card chip + Renew / revive explainer (EC-12) | renew resets the stamp, or revive |
| Removed | Card state with reason ("Removed — under review") | detail on OWN-03 (EC-21) |
| Unverified | Verify-to-publish banner above the strip | → VER-01 |

### 10. Business / Functional Rules

1. Attention items are computed, not curated: applicants, replies owed, and expiry surface automatically — never hidden behind a menu (R-05, R-09).
2. The response-rate tier is computed by the platform from a rolling 30-day median; owners cannot edit or override it.
3. Unverified owners can use the whole dashboard but cannot publish (R-02) — the banner explains, it does not scold.
4. Every number is real; empty states name their cause and offer the next action (R-30).

### 11. Cross-Screen Dependencies

Attention counts must exactly equal their source surfaces: New-applicant count = OWN-04 board and the Applicants tab badge; chats-awaiting-reply = CHAT-01; expiry items = OWN-02 rows. Freshness stamps and state chips here must match OWN-02/OWN-03 and the public cards seekers see (R-06). The response-rate tier must equal OWN-06's meter and the tier seekers see on owner cards. The unverified banner must agree with VER-02's verification state and OWN-01's publish gate. The mode chip reflects roles chosen at AUTH-04/ACCT-01.

### 12. Completion Criteria

- [ ] Attention strip ordered by urgency with working per-item CTAs
- [ ] One-tap renew updates the freshness stamp everywhere
- [ ] Listing cards show true state chip + freshness + mini analytics
- [ ] Pipeline counts match OWN-04; tab badge matches the New count
- [ ] Empty states, unverified banner, and mode chip behave as specified

---

## DISC-01 — Room Search (Authenticated)

### 1. Purpose

The primary retrieval surface for signed-in seekers: full filtering, sorting, freshness-first ranking, and compatibility previews — where shortlists get built before connecting.

### 2. User Context

A seeker (or "Both" user in seeker mode) arrives with baseline knowledge from onboarding — budget, move-in window, must-haves — and narrows live supply into saved and connectable options, expecting honest counts, fresh listings, and dealbreakers respected without re-entering them.

### 3. Entry Points

- Seeker-shell bottom nav, Search tab
- HOME-01 recommendation rails ("See all")
- DISC-04 (browse CTAs; Similar-rooms hand-off) and DISC-02 return (filters arrive as chips)
- Deep links and shared search links (query applied; logged-out visitors resolve to PUB-02)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  "Search rooms" · bell · overflow
----------------------------------------
SEARCH BAR:  free text + locality chips
PRIMARY FILTER ROW:  rent · move-in · room type · gender preference
[Advanced filters]   active filter chips (removable inline)
SORT BAR:  result count · Freshest (default) / Best match / Rent lowest-first / Newest
RESULT LIST (C-01, authenticated projection):  photo · rent + deposit · locality ·
  room type · badge row (C-06) · freshness stamp · save · share · compat band chip
  when scorable · 20/page skeleton scroll · EMPTY → C-05 variants (see states)
----------------------------------------
BOTTOM NAV:  Home · Search (active) · Flatmates · Chats · Profile
```

### 5. Components

Sticky search + primary filter row; advanced-filters entry; sort control; listing cards (C-01 authenticated projection); removable filter chips; save toggle; empty states (C-05). No map in this version.

### 6. Content

- Every card: rent, deposit (always), locality, room type, freshness stamp, badge row; result count, sort label, active chips. Compatibility chip (band name + number, never colour-only) only where the listing carries a scoreable owner-flatmate lifestyle; tapping it previews the reason.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap a listing card | Opens authenticated detail; search state queued for exact restoration | ROOM-01 |
| Edit or remove a filter chip | Results refresh; chips persist per device | stay |
| Tap "Advanced filters" | Opens filter draft pre-filled with current values | DISC-02 |
| Change sort | Re-ranks results in place | stay |
| Tap save on a card | Saved state toggles; reflected in the saved list | stay |
| Share a card | Public-safe card (photo, rent, locality, badge, freshness stamp) | system share sheet |

### 8. Navigation

Seeker shell with bottom nav (Search active). Back from ROOM-01 or DISC-02 restores filters, scroll, and results exactly. Deep links land here with the query applied. Leaving the tab and returning preserves the session's filter state.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Loading | Skeleton cards matching the final layout | ≤300ms perceived |
| Default | Ranked, counted results under active chips | Freshest sort default |
| Empty (three EC-14 variants) | No city supply → waitlist/widen · filters too narrow → names binding filter + one-tap relax · must-haves exclude all → review-must-haves CTA | C-05, EC-14 → PREF-01 |
| Error | Inline retry; filters and scroll never cleared | — |
| Restricted (guest deep link) | Redirect to public browse projection | PUB-02 |
| Expired (card degrades mid-session) | Listing state chip replaces the live card; tap opens the state view | EC-12 |

### 10. Business / Functional Rules

1. Freshness first: default sort ranks by freshness; every card carries the stamp (R-05, R-06) and the deposit (R-07).
2. Must-haves set in PREF-01 bind before ranking, never silently overridden by search filters (R-13); compatibility chips render only when scorable, always as band name + number (R-11).
3. Expired, paused, filled, or removed listings never open as live rooms (R-09, EC-12).
4. Filters persist per device across sessions; city locked to Bangalore — no fake selector (R-26); logged-out visitors resolve to the public projection (PUB-02), never shown authenticated data.

### 11. Cross-Screen Dependencies

Card facts must match ROOM-01 and the public projections (PUB-02/PUB-03) exactly — one listing truth, zero contradiction on tap-through; save toggles are the same state DISC-04 renders; freshness semantics equal HOME-01 rails. Advanced-filter chips must appear here verbatim as set in DISC-02 (one filter, one representation). Must-have changes in PREF-01 re-filter this list after the honest recompute window (R-15).

### 12. Completion Criteria

- [ ] First load shows ≥8 results for the default city, freshness-ranked
- [ ] Every card shows deposit + freshness stamp + badge row; compatibility chip only when scorable
- [ ] All three empty variants name their cause and offer the named fix
- [ ] Back restores filters/scroll/results; guest deep links resolve to PUB-02; filters persist

---

## DISC-02 — Advanced Filters

### 1. Purpose

Dealbreaker-level filtering — lifestyle, room facts, building rules, availability, and a compatibility cut — without cluttering the DISC-01 quick-search surface.

### 2. User Context

A seeker refining from DISC-01 wants precision before committing to results: they express hard constraints (diet, smoking, pets, guests policy) and room facts, and must see the effect of every choice before applying it.

### 3. Entry Points

- DISC-01 "Advanced filters" button (the only entry)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  close (applies draft) · "Advanced filters" · [Reset all]
----------------------------------------
LIFESTYLE:  dietary · smoking · alcohol · sleep schedule · pets
ROOM:  furnishing · amenities (multi-select) · bathrooms · floor · bachelors-ok
BUILDING RULES:  guests policy · cooking allowed
AVAILABILITY:  move-in window · stay duration
COMPATIBILITY:  "Only show 70+ matches" toggle
----------------------------------------
STICKY CTA:  [ Show N results ]   ← live count, always current
----------------------------------------
(no bottom nav — push screen)
```

### 5. Components

Sectioned pickers (single-select and multi-select chips); compatibility cut toggle; live-count primary CTA; reset-all control.

### 6. Content

- Five sections mirroring the lifestyle attribute model plus room and building facts; every control shows its current value.
- The CTA always shows the honest, current result count.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Toggle any filter | Live count updates immediately | stay |
| Enable the 70+ cut | Count updates; cut applies to the draft only | stay |
| Reach count = 0 | Inline explainer names the killer filter + one-tap toggle-off | stay |
| Tap "Reset all" | Draft cleared to unset values; count updates | stay |
| Tap "Show N results" / close | Draft applied to search; chips appear on the search surface | DISC-01 |

### 8. Navigation

Push screen — no bottom nav. Back/close applies the draft and returns to DISC-01 with chips reflecting the sections. The draft survives interruption (app switch, accidental back) until applied or reset. No modal stacking.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Draft selections + live count on the CTA | Count never stale |
| Loading (count) | Non-blocking refresh indicator on the count | Filters stay editable |
| Empty (zero count) | Killer-filter explainer + one-tap relax | EC-14 variant |
| Error (count fails) | Inline retry on the count; draft never lost | CTA never shows a wrong number |

### 10. Business / Functional Rules

1. Filters refine; they never silently broaden (R-30).
2. The count is always honest and current — a stale count is a defect (R-30).
3. The 70+ cut is a preference filter, clearly labelled; it never masquerades as a must-have (R-13).
4. Zero results always explains which filter kills the result set — never a bare "0 results" (EC-14).

### 11. Cross-Screen Dependencies

Applied values must map 1:1 to removable chips on DISC-01 — identical names, identical semantics. The availability section's move-in window is search-scoped: the durable move-in and budget used for matching live in PREF-01, and both surfaces must show consistent onboarding-derived defaults. The 70+ cut affects only this search feed — it never alters stored compatibility scores shown on DISC-03, PROF-01, or ROOM-01.

### 12. Completion Criteria

- [ ] Every dealbreaker expressible; effect visible pre-apply via live count
- [ ] Zero-count names the killer filter with a one-tap relax
- [ ] Apply returns to DISC-01 with faithful chips
- [ ] Reset-all restores unset values; draft survives interruption
- [ ] No silent broadening; count never stale or wrong

---

## DISC-03 — Flatmate Discovery

### 1. Purpose

Ranked candidate feed with transparent fit — the pairing journey that needs no listing: find the right person first, then find the flat together.

### 2. User Context

A seeker with a usable profile opens the Flatmates tab to find people worth talking to. Must-haves from PREF-01 are already applied; each card must communicate enough — identity per privacy policy, score, reason, activity — to justify connecting without opening the profile.

### 3. Entry Points
- Seeker-shell bottom nav, Flatmates tab
- HOME-01 matched-flatmates rail ("See all")
- DISC-04 (flatmates tab, browse path)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  "Flatmates" · bell · overflow
----------------------------------------
MUST-HAVE CHIPS:  active must-haves from preferences (quick-remove ×) · [Edit] → PREF-01
SORT BAR:  candidate count · Best match (default)
CANDIDATE CARDS (C-02):  photo (blur per target's controls) · first name · age band ·
  occupation · badge row (C-06) · score band + number ("Great match · 84", text not colour)
  3 highest-signal attribute chips (food · sleep · smoking)
  one-line why ("matches you on food & schedule; differs on guests")
  activity line, day-fuzzed ("active this week")  ·  [ Connect ]  [ View ]
  low matches render lower but labelled honestly ("Low match · 28") · EMPTY → C-05
----------------------------------------
BOTTOM NAV:  Home · Search · Flatmates (active) · Chats · Profile
```

### 5. Components

Candidate cards (C-02); must-have chip row with quick-remove and Edit; sort control; Connect on each card; "Why this score?" quick sheet; empty states (C-05).

### 6. Content

- Per card: photo (respecting the target's blur controls), first name, age band, occupation, badges, top-3 attribute chips, score band + number, a one-line reason, day-fuzzed last-active; feed header shows must-haves applied + candidate count.
- Quick sheet on band tap: all 10 attributes, both values, points — recompute-able.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap Connect on a card | Intro-note sheet anchored to that profile | sheet → CONN-01 (pending) |
| Tap card or View | Full profile with explained compatibility | PROF-01 |
| Tap the score band ("Why this score?") | Breakdown sheet: all 10 attributes, both values, points | modal, stay |
| Quick-remove a must-have chip | Must-have turned off in the same store PREF-01 writes; feed refilters before re-ranking | stay |
| Tap Edit on the chip row | Full must-have editor | PREF-01 |
| Change sort | Re-ranks in place | stay |

### 8. Navigation

Seeker shell with bottom nav (Flatmates active). Connect opens a single stacked sheet; on send the user lands in CONN-01 with the request pending. Edit chips routes to PREF-01 and returns with the feed refiltered. Back returns to the source rail/tab.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Loading | Card skeletons matching the final layout | ≤300ms perceived |
| Default | Ranked feed; low matches visible and labelled | R-11, R-12 |
| Empty (two EC-14 variants) | No candidates in filters → widen-filters / relax-must-have · no city supply → honest line + widen | C-05, EC-14 |
| Restricted | Suppressed set never renders: self, blocked, declined-for-90-days, discovery opt-outs | EC-08, R-19 |
| Error | Inline retry preserving scroll position | — |

### 10. Business / Functional Rules

1. Must-haves filter before ranking — the two are never conflated (R-13).
2. Every score shows band + number plus a reason with at least two drivers; low scores shown and labelled, never hidden (R-11, R-12).
3. Suppression enforced: declined connections hide the candidate for 90 days (R-17, EC-08); blocked users never render (R-19); discovery opt-outs never render; own card excluded.
4. T0-only candidates may appear but are deprioritized and badge-less; verified badges show with dates (C-06); last-active is fuzzed to day granularity — never exact times.
5. Gender and lifestyle must-haves use the fixed, ethical hard-filter set only — never free-text filtering (R-13, R-14).

### 11. Cross-Screen Dependencies

Must-have chips read exactly what PREF-01 stores; edits in either place must agree after the recompute window (R-15). The score and reason on a card must equal PROF-01's score block for the same pair — one explanation engine; the card projection (blur, badges, chips) must be identical to what PROF-01 renders. Connect from a card and from PROF-01 must land in the same CONN-01 pending state, idempotently (R-18). A user who turns discovery off in ACCT-02 disappears from this feed immediately.

### 12. Completion Criteria

- [ ] A complete-profile user sees at least one Good-band candidate near the top with a hand-recomputable reason
- [ ] Must-haves bind before ranking; chips stay in sync with PREF-01; low matches labelled, never hidden
- [ ] Suppression set (self / blocked / declined-90d / opted-out) enforced
- [ ] Connect is one tap to the C-03 sheet with profile context

---

## DISC-04 — Saved Items

### 1. Purpose

Multi-session search state: keep and compare viable rooms and people across days, with honesty about everything that has changed since saving.

### 2. User Context

A returning user expects saved options intact and revalidated — expired rooms labelled with alternatives, scores current, opted-out people marked — not silently gone and not silently stale. This is where days of browsing consolidate into a decision.

### 3. Entry Points
- HOME-01 saved rail ("See all")
- Home overflow menu (no dedicated bottom-nav tab in this version)
- Return path from Similar-rooms links elsewhere

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · "Saved"
----------------------------------------
TABS:  [ Rooms (n) ]  [ Flatmates (n) ]
ROOM ROWS (C-01 compact):  thumb · rent + deposit · locality · room type ·
  freshness stamp revalidated at open
  degraded rows: state label ("Expired 4d ago" / "Filled" / "Paused") + [Similar rooms]
FLATMATE ROWS (C-02 compact):  mini card · score band + number ·
  "no longer in discovery" mark where applicable
Row overflow:  Remove (undo toast) · [ Compare ]  (select 2 rooms → side-by-side sheet)
EMPTY (per tab):  one honest sentence + browse CTA
----------------------------------------
(no bottom nav — push screen)
```

### 5. Components

Tabs with counts; revalidating row list (C-01/C-02 compact projections); overflow remove with undo; compare tray; per-tab empty states (C-05).

### 6. Content

- Saved rooms with current freshness and listing state; explicit state labels on every degraded row.
- Saved flatmates with current score band + number; "no longer in discovery" mark where the person opted out after saving. Tab counts match the saved state.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap a healthy room row | Opens authenticated detail | ROOM-01 |
| Tap a degraded room row | Opens the state view (banner + similar rooms), never a live room | ROOM-01 (state view) |
| Tap Similar rooms on a degraded row | Search seeded with comparable filters | DISC-01 |
| Tap a flatmate row | Opens the profile (still reachable even if opted out of discovery) | PROF-01 |
| Remove an item (overflow) | Row removed; undo toast restores it | stay |
| Select 2 rooms + Compare | Side-by-side comparison sheet | modal, stay |

### 8. Navigation

Push screen reached from HOME-01 — no bottom nav; back returns to HOME-01. Removal is non-destructive within the session (undo window). Compare is a single stacked sheet. Every tab has a browse path onward — no dead ends.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Revalidated rows in both tabs | Freshness stamps current (R-06) |
| Expired (room rows) | State label + Similar rooms path | EC-12 |
| Restricted (flatmate rows) | Opted-out-after-save rows retained and marked, still openable | — |
| Empty (per tab) | "Nothing saved yet — tap the save control on any card" + browse CTA (Rooms → DISC-01, Flatmates → DISC-03) | C-05 |

### 10. Business / Functional Rules

1. Saved state revalidates at open — stale data never pretends to be fresh (R-06, R-30).
2. Degraded listings show their state plus alternatives; they never silently disappear and never open as live rooms (R-09, EC-12).
3. Removal always sits in the overflow — never swipe-only — and is reversible within the session.
4. A saved person who later opts out of discovery stays saved, marked, and reachable here; opt-out removes them from feeds, not from the saver's list.
5. Compare supports exactly 2 saved rooms in this version.

### 11. Cross-Screen Dependencies

Save/unsave must mirror the toggles on DISC-01, ROOM-01, and profile surfaces — one saved-state truth. Freshness and listing state must read the same source as ROOM-01 and the owner surfaces (OWN-02/OWN-03): a listing marked Filled shows Filled here at the same moment it shows everywhere else. The Similar-rooms hand-off to DISC-01 must return the same set as an equivalent manual search. A flatmate's score here must equal the DISC-03/PROF-01 score for the same pair.

### 12. Completion Criteria

- [ ] Closing and returning days later: options intact and honestly labelled
- [ ] Degraded rows show state + Similar rooms; never open as live rooms
- [ ] Opted-out flatmate rows retained + marked
- [ ] Per-tab empties with browse CTAs; remove + undo works
- [ ] Compare sheet renders 2 selected rooms side by side

---

## ROOM-01 — Room Detail (Authenticated)

### 1. Purpose

The full decision surface: everything a seeker needs to connect, save, share, or pass — without leaving the screen.

### 2. User Context

A seeker arrives primed by the card summary and needs complete facts plus trust signals — owner verification, freshness, deposit terms, occupant fit — to connect, save, or pass with confidence.

### 3. Entry Points

- DISC-01 result cards and HOME-01 rails/recommendations
- DISC-04 saved row (degraded rows open the state view) · deep links (authenticated projection; logged-out visitors resolve to PUB-03)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · share · overflow (report)
----------------------------------------
PHOTO GALLERY:  swipeable, position dots; thin supply renders ≥1 photo (EC-15)
FACT TABLE:  rent · deposit · move-in · tenancy duration · room type · furnishing ·
             bathrooms · occupancy — same facts as the public view
TRUST + OWNER CARD:  badge row (C-06, dates on tap) · "Confirmed Xd ago" stamp ·
  display name per masking policy · badges (B-3/B-4) · member-since · response-rate
  tier (B-5) when owner · [View owner profile] (masked modal)
OCCUPANT FIT (owner-flatmate listings):  "You'd match the current resident:
             82 · Great" + expandable per-attribute breakdown (both values, points)
LOCATION:  exact locality pin — street address never appears (owner may share it
           in chat) · HOUSE RULES · amenities · deposit-safety guidance link
----------------------------------------
STICKY BAR:  [ Connect ] · save toggle   (state-aware: connected → [ Open chat ])
```

### 5. Components

Photo gallery; fact table; owner card (masked); occupant compatibility block with expandable breakdown; badge row (C-06); sticky action bar; report overflow; connect intro-note sheet (C-03).

### 6. Content

- Everything the public projection shows — rent, deposit, move-in, tenancy, furnishing, amenities, house rules, locality pin, freshness stamp, badges — plus the owner trust card, occupant fit with explanation, response-rate tier, deposit-safety guidance, and connected-state awareness. Owner identity masked per policy: no phone, no email, anywhere.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap Connect | Intro-note sheet (C-03) prefilled for this room, context locked; unverified senders allowed with a soft honesty note — never a gate | sheet → CONN-01 (pending) |
| Tap save | Saved toggles; reflected in DISC-04 | stay |
| Tap Open chat (already connected) | Opens the existing thread anchored to this room | CHAT-02 |
| Tap View owner profile | Masked owner card modal — no contact details | modal, stay |
| Tap the occupant-fit band | Full breakdown sheet (all 10 attributes) | modal, stay |
| Tap Report / Share | Structured report with listing context / public-safe card | SAFE-02 / system share |

### 8. Navigation

Detail-push screen — no bottom nav. Back returns to the source (DISC-01 state preserved: filters, scroll, results). Deep links land here with full context. Only one sheet stacks at a time. A degraded listing resolves to the state view — never a dead end.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Loading | Skeleton gallery + fact table | ≤300ms perceived |
| Default | Full fact surface + sticky Connect | — |
| Pending (request sent / owner verification in review) | Connect shows "Requested", duplicate taps idempotent ("already requested") · review shows a banner near the owner card while the listing stays live | EC-10, R-18 |
| Expired / Paused / Filled / Removed / Owner suspended | State banner + similar rooms; Connect disabled · owner banned → listing auto-hidden, deep links resolve to the state view | EC-12, EC-21 |
| Success (connected) | Primary CTA becomes Open chat | CHAT-02 |

### 10. Business / Functional Rules

1. Deposit always visible (R-07); freshness stamp on the detail (R-06); exact address never present (R-08).
2. Owner identity masked — no phone/email anywhere (R-16); contact reveal happens only in chat via mutual consent, never here (R-16).
3. Connect requires no T2 — unverified users connect freely with a soft, honest nudge, never a hard gate (R-01).
4. Duplicate connect requests blocked idempotently; requests expire after 14 days (R-18, EC-10).
5. Compatibility bands always carry their explanation on tap (R-11, R-12).

### 11. Cross-Screen Dependencies

All facts must equal the DISC-01 card and the public view (PUB-03) — one listing truth; save state mirrors DISC-01/DISC-04; connected state must agree with CONN-01 and open the same thread reachable from CHAT-01/CHAT-02. Occupant fit must equal the household score the owner sees in OWN-04/OWN-05 for the same pair. When the listing degrades (EC-12), the state must propagate simultaneously to DISC-01 cards, DISC-04 rows, and notification deep links.

### 12. Completion Criteria

- [ ] The user can decide and act (connect/save/share/report) without leaving the screen
- [ ] Deposit + freshness stamp + badges render; no address, no contact details anywhere; CTA state-aware (Connect / Requested / Open chat) in every connection state
- [ ] EC-12/EC-21 degradations render banner + similar rooms; occupant fit expands to a full recompute-able breakdown

---

## PROF-01 — Flatmate Profile Detail

### 1. Purpose

Full candidate evaluation with explained compatibility: judge the fit, then connect, pass, or protect — with every judgement explainable.

### 2. User Context

A seeker who tapped a discovery card (or a chat header, or an owner reviewing an applicant) needs the whole person: all 10 attributes under the target's visibility rules, the score with its reasoning, the target's must-haves that affect the viewer, and safety signals.

### 3. Entry Points

- DISC-03 candidate card (Connect context)
- CHAT-02 header (counterparty) · OWN-04 / OWN-05 applicant view (read-only owner variant — no Connect CTA; pipeline actions live there)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · share · overflow (report · block)
----------------------------------------
PROFILE HEADER:  photo (blur per target's controls) · first name · age band ·
                 occupation · member-since · badge row (C-06, dates on tap)
SCORE BLOCK:  score + band + "Why this match" (expandable): "You match: veg, early
                 schedule. You differ: guests." → full 10-attribute breakdown:
                 both values, points earned
ATTRIBUTES GRID:  all 10 attributes as friendly chips (private fields masked
                 per the target's visibility controls — masked, not missing)
ABOUT:  short blurb (plain text; contact patterns never render) · ACTIVITY:
        "active 2 days ago" (day-fuzzed)
MUST-HAVE CONFLICT ROW:  their must-haves that affect you, surfaced proactively
SAFETY ROW:  "ID verified Oct 2025" — or a gentle verify-note for T0-only profiles
----------------------------------------
STICKY BAR:  [ Connect ]   [ Message ] (when already connected)
```

### 5. Components

Profile header; score card with expandable breakdown sheet; attribute chip grid; must-have conflict row; sticky action bar; report/block overflow; connect intro-note sheet (C-03).

### 6. Content

- Identity per masking policy: first name only, no last name, no contact details, no exact employer — ever. Full attribute set with visibility rules applied; score with ≥2 drivers; their must-haves affecting the viewer, shown proactively; activity freshness; verification badge with date.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap Connect | Intro-note sheet anchored to this profile | sheet → CONN-01 (pending) |
| Tap Message (already connected) | Opens the existing thread | CHAT-02 |
| Expand "Why this match" | Full 10-attribute breakdown sheet (both values, points) | modal, stay |
| Save / Report / Block (overflow) | Saved state toggles (reflected in DISC-04) · structured safety flow with profile context | stay / SAFE-02 |
| Share profile | Public teaser card (auth-walled for the recipient) | system share sheet |

### 8. Navigation

Detail-push screen — no bottom nav. Back returns to the source (DISC-03, CHAT-02, or the owner surface). Viewing your own profile redirects to PROF-02. Blocked pairs and declined-connection profiles (90-day suppression) are unreachable — no render.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Loading | Header + score skeletons | ≤300ms perceived |
| Default | Full profile + score block with ≥2 drivers | R-11, R-12 |
| Incomplete / T0-only target | Partial card "X hasn't finished their profile" + Connect still allowed · T0-only renders "Phone verified" chip + subtle safety note, no badge row | Honest; C-06 absence rule |
| Restricted (blocked / declined-90d) | Profile unreachable | R-17, R-19, EC-08 |

### 10. Business / Functional Rules

1. No last name, no contact details, no exact employer — ever (R-16).
2. Attribute visibility obeys the target user's controls (ACCT-02): private fields render masked, not missing; profile-view notifications to the viewed user are off in this version (privacy posture).
3. The score is symmetric and fully explained; a user could recompute it by hand from the breakdown (R-11, R-12).
4. Their must-haves that affect the viewer are surfaced proactively, never buried (R-13).
5. The owner variant (from OWN-04/OWN-05) is read-only — no Connect/Message bar; applicant state is managed in the pipeline.

### 11. Cross-Screen Dependencies

Score and drivers must equal the DISC-03 card and any household score in OWN-04/OWN-05 for the same pair — one explanation engine. Attribute rendering must reflect ACCT-02 settings exactly, and PROF-03 must preview the same projection for the profile's owner. Connect state must agree with CONN-01 and flip the sticky bar to Message exactly when CHAT-01/CHAT-02 show the thread. The badge row must match every other surface — same badge, same date. A block taken here enforces mutual invisibility across DISC-03, CONN-01, and CHAT-01 (R-19).

### 12. Completion Criteria

- [ ] The viewer can explain the score and act — connect, pass, or protect
- [ ] Visibility controls honored; private fields masked, not missing; must-have conflicts surfaced proactively
- [ ] Incomplete / T0-only / self / blocked variants all behave as specified
- [ ] No contact data anywhere on the surface

---

## PROF-02 — My Profile (Edit)

### 1. Purpose

Maintain the durable identity asset — basics, lifestyle attributes, verification, visibility — that feeds every score, card, and chat header in the product.

### 2. User Context

Any authenticated user in seeker mode opens the Profile tab to keep their profile accurate and attractive. Each edit propagates to compatibility scores, candidate cards, and chat headers, so the screen must show what each attribute is used for and what is missing.

### 3. Entry Points

- Seeker-shell bottom nav, Profile tab
- ONB-01 completion (returns here)
- HOME-01 completeness meter ("finish your profile")

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  "My profile" · overflow (Settings → ACCT-01)
----------------------------------------
PROFILE HEADER:  photo (tap to change) · name · basics · completeness meter +
                 "what's missing" line (one-tap resume)
LIFESTYLE BLOCK:  all 10 attributes as chips · [Edit] (same pickers as ONB-01)
                  "Matches updating…" honest banner while recompute runs
ABOUT:  blurb ≤300 chars, plain text only (contact patterns blocked inline)
VERIFICATION CARD:  current tier chip + date · [ Verify / Upgrade ] → VER-01
PREFERENCES ROW:  [ Preferences → PREF-01 ] · [ Preview public view → PROF-03 ] ·
                  [ Privacy controls → ACCT-02 ]
----------------------------------------
BOTTOM NAV:  Home · Search · Flatmates · Chats · Profile (active)
```

### 5. Components

Photo uploader; inline section editors (same pickers as onboarding); completeness meter; blurb editor with contact-pattern guard; verification card; links row.

### 6. Content

- Current identity and all 10 lifestyle attributes, each with what it is used for (scoring); completeness percentage and the specific missing items.
- Verification tier, its earned badge, its benefit, and the next step; shortcuts to preferences, privacy controls, and the public preview.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Edit any section | Inline save confirmation; completeness meter updates | stay |
| Edit lifestyle attributes | Compatibility flagged "Matches updating…" (async recompute ≤60s, honest banner) | stay |
| Type contact info in the blurb | Inline warning + pattern block (no phone/email/URL); typed text preserved | stay |
| Remove photo while T2-verified | Confirmation warning: verification may need refresh | stay |
| Tap Verify / Upgrade | Verification submission (T2, or T3 for owners) | VER-01 |
| Tap Preview public view | Exact visitor projection | PROF-03 |
| Tap Privacy controls / Preferences | Visibility controls / preferences editor | ACCT-02 / PREF-01 |

### 8. Navigation

Tab root of the seeker shell — bottom nav present (Profile active). Inline saves mean nothing is lost on exit; no global submit. Overflow leads to ACCT-01. All push targets (VER-01, PREF-01, PROF-03, ACCT-02) return here with edits intact.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | All sections + meter + verification card | — |
| Incomplete | Meter + prioritized "what's missing" pointers, each one tap from the fix | Never a dead end |
| Pending (matches updating) | Honest async banner on score-dependent edits; clears when recompute lands | ≤60s, R-15 |
| Success (section saved) | Inline confirmation; meter visibly updates | — |

### 10. Business / Functional Rules

1. Lifestyle edits recompute compatibility everywhere scores appear — honest "updating" banner, never silent staleness, never fake immediacy (R-15).
2. The blurb never carries contact info — a platform-protective pattern check, not censorship; warnings never destroy typed text (R-16).
3. This profile is the single source feeding candidate cards (C-02), chat headers, and PROF-03 — one identity truth.
4. Removing the photo while T2-verified warns that the photo-based verification may need refresh.
5. Owners edit their property profile in OWN-06, not here; a "Both" user sees this screen in seeker mode.

### 11. Cross-Screen Dependencies

Every edit must propagate identically to DISC-03 cards, PROF-01 (as others see it), CHAT-02 headers, and the PROF-03 preview. The completeness meter must agree with ONB-01 step data and the HOME-01 nudge card. The verification card must mirror the VER-02 status machine (Submitted / In review / Approved / Rejected) and the badge rendered on C-06 rows everywhere. The T1 "Profile complete" badge (B-2) is computed from exactly the fields shown here.

### 12. Completion Criteria

- [ ] Section edits save inline without a global submit; meter updates live; lifestyle edits trigger the honest async recompute banner (≤60s)
- [ ] Contact patterns blocked in the blurb without data loss
- [ ] PROF-03 provably matches what others see; all links (VER-01, PREF-01, ACCT-02, ACCT-01) wired and returning

---

## PROF-03 — Profile Public Preview

### 1. Purpose

Privacy confidence: the user sees themselves exactly as a stranger sees them — nothing rendered by owner privilege, nothing hidden by it.

### 2. User Context

A user who has just edited their profile or visibility wants proof there is no over-exposure before returning to search. Any surprise must be explainable (via annotations) and fixable in one tap.

### 3. Entry Points

- PROF-02 ("Preview public view")
- ACCT-02 (Privacy & Visibility Controls)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · "Preview" · [Adjust visibility]
----------------------------------------
RENDERED PROFILE (exact visitor projection — same renderer as PROF-01):
  photo (blurred if enabled) · first name or initials per setting
  badge row (C-06, dates on tap) · attribute chips (private fields masked
  exactly as a visitor would see them) · about blurb
ANNOTATION OVERLAY (toggle):
  per-block markers — "everyone" / "connections only" / "never shown"
----------------------------------------
CTA:  [ Adjust visibility ] → ACCT-02
(no bottom nav — push screen)
```

### 5. Components

Faithful profile renderer (the same components PROF-01 uses for a real viewer); annotation overlay toggle; adjust-visibility CTA.

### 6. Content

- The profile unmodified by owner privilege: what a stranger sees is what renders here.
- Per-block audience annotations when the overlay is on; masked values shown as masked, never omitted; badge dates on tap, identical to a real view.

**OPEN DECISION:** A draft wireframe includes a compatibility score ("what a viewer scores") inside the preview, but scores are pair-specific and symmetric — which viewer's score, if any, should the preview render (none, a clearly-labelled illustrative example, or a score vs. a representative seeker)?

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Toggle annotations | Block-level audience markers reveal/hide | stay |
| Tap Adjust visibility | Opens visibility controls | ACCT-02 |
| Back | Returns to the source; any ACCT-02 changes re-render the preview on return | PROF-02 / ACCT-02 |

### 8. Navigation

Push screen — no bottom nav. Back returns to PROF-02 or ACCT-02 (the source). Returning after a visibility change re-renders immediately — never a cached, stale preview.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Exact projection; annotations available | Same rendering path as real views |
| Incomplete | Preview shows honestly what is missing publicly | — |
| Success (post-change) | Re-rendered projection reflects the just-saved controls | Never stale |

### 10. Business / Functional Rules

1. The preview uses the same rendering path as real profile views — no special preview logic that could drift from reality (R-30).
2. Private fields render masked, never hidden by absence — the user must see that a field exists and is masked.
3. Badge dates are visible on tap, identical to real views (C-06).
4. No contact data ever renders here (R-16).

### 11. Cross-Screen Dependencies

Must be exactly honest with PROF-01: same renderer, same masking, same blur — divergence between preview and reality is a defect. Changes made in ACCT-02 must be reflected here instantly, and what this screen shows must equal what DISC-03 cards and PROF-01 will render for the next viewer. The badge row must equal the C-06 rows on cards and chat headers.

### 12. Completion Criteria

- [ ] Preview matches a real view exactly (same rendering path)
- [ ] Annotation toggle explains every block's audience
- [ ] Any surprise fixable in one tap via ACCT-02
- [ ] Incomplete profiles show honestly what is missing
- [ ] Returning after changes always re-renders fresh

---

## PREF-01 — Preferences (Edit)

### 1. Purpose

Evolve must-haves (hard filters) and nice-to-haves (soft scoring) as the search matures — the control surface that keeps discovery personal and honest about the difference.

### 2. User Context

A seeker whose search has matured arrives from their profile, from discovery chips, from a search empty state, or from a stale-preference prompt. The hard/soft distinction must be obvious, because it decides what gets excluded versus what merely ranks lower.

### 3. Entry Points

- PROF-02 (Preferences row)
- DISC-03 must-have chip row (Edit)
- DISC-01 must-haves-exclude-all empty state
- NOTIF-01 re-confirm deep link (stale preferences, EC-24)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · "Preferences"
----------------------------------------
MUST-HAVES (we only show you these) — hard filters, each with its plain-language
  consequence ("we'll only show you women-only homes"):
  women-only / men-only flat · veg kitchen · non-smoking household ·
  no pets · non-drinking household
NICE-TO-HAVES (soft — affect ranking only):  preferred pick per attribute
  (food · sleep · cleanliness · guests · …)
BUDGET & MOVE-IN:  synced with onboarding answers · editors for both
ALERTS:  notify me about new matches (default off)
[Reset to onboarding answers]        STICKY CTA:  [ Update preferences ]
----------------------------------------
(no bottom nav — push screen)
```

### 5. Components

Must-have toggle cards with consequence lines; nice-to-have pickers; budget and move-in editors; alert toggle; reset control; primary CTA.

### 6. Content

- Explicit hard-vs-soft separation, stated in plain words at the top of each section.
- A consequence sentence under every must-have — what will stop appearing when it is switched on; current budget range, move-in date, and alert state.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Toggle a must-have | Hard-filter set updated in the draft; consequence line visible; turning one off shows an info line that low-match results may appear — labelled | stay |
| Update nice-to-haves | Scoring preferences updated in the draft | stay |
| Edit move-in to a past date | Re-confirm prompt flags the stale date | inline (EC-24) |
| Tap Update preferences | Saved → toast "Matches updating"; rankings change on next load (≤60s) | back to source |
| Tap Reset | Onboarding answers restored into the draft | stay |

### 8. Navigation

Push screen — no bottom nav. The CTA saves and returns to the source screen (PROF-02, DISC-03, DISC-01, or the NOTIF-01 target). Leaving via back without the CTA keeps the previously saved preferences — no silent partial applies.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Draft equals the saved preferences | — |
| Pending (stale / restrictive) | Re-confirm prompt on entry when move-in passed or preferences long-stale · honest info line when the hard set excludes nearly everything | EC-24 |
| Success (saved) | Toast "Matches updating"; downstream rankings refresh on next load | ≤60s, R-15 |
| Error (save fails) | Inline retry; draft never lost; submit idempotent | EC-16 |

### 10. Business / Functional Rules

1. Must-haves bind before ranking everywhere — never mixed into scoring (R-13).
2. Preference changes trigger an async recompute with an honest "Matches updating" banner — never silent staleness, never fake immediacy (R-15).
3. Every must-have shows its consequence in plain language before it filters anything (R-30).
4. Match alerts default off (anti-spam posture); safety notices are never governed by this toggle (R-29); reset restores the exact onboarding answers — the EC-24 re-confirm baseline.

### 11. Cross-Screen Dependencies

Must-have chips on DISC-03 and the must-haves-exclude-all state on DISC-01 must read exactly what is saved here. Budget and move-in must stay consistent with the ONB-01 answers (the reset baseline) and with the availability defaults on DISC-02. After an update, DISC-01, DISC-03, HOME-01, and ROOM-01 occupant-fit scores all recompute from the same trigger (R-15) — no surface may show a stale score after the recompute window. The alert toggle must agree with NOTIF-02: one preference, one home — match alerts off here means no match notifications anywhere.

### 12. Completion Criteria

- [ ] Hard vs soft separation explicit; every must-have carries its consequence line
- [ ] Update triggers the honest async recompute; the next feed view reflects the changes
- [ ] Stale move-in triggers the EC-24 re-confirm prompt
- [ ] Reset restores onboarding answers exactly; back never half-applies; alert toggle defaults off, safety notices unaffected

## VER-01 — Verification Submission (T2/T3)
### 1. Purpose
Collect human-verifiable identity evidence (T2) — plus ownership proof for owners (T3) — with maximum clarity about what is collected, who sees it, and when it is deleted.
### 2. User Context
A seeker strengthening their profile, or an owner who must verify to publish (the gate is blocking, never a suggestion). Some arrive for a resubmission after a rejection and already know what went wrong. They must acknowledge a consent step, supply documents, and submit — knowing only the review team ever sees the evidence.
### 3. Entry Points
- PROF-02 verification card ("Start verification")
- VER-02 states: Not started, Rejected, Resubmission required, Expired (re-verify)
- ONB-02 owner onboarding verification step and OWN-01 publish gate (blocking, owner variant pre-scoped)
### 4. Functional Wireframe
```text
----------------------------------------
WIZARD (C-08, no bottom nav): dots · Step N of M · [Save draft]
  (M = 3 seeker views: consent · document · selfie; 4 for owners)
STEP 0 — CONSENT (blocking): what we collect (ID doc + live
  selfie, + room proof if owner) · who sees it (only our review
  team — never other users) · what happens (decision <24h;
  documents deleted after decision) · [x] I understand
STEP 1 — DOCUMENT: Aadhaar (mask-first-8-digits guidance) · PAN ·
  Driving Licence · Passport; front/back upload or number+photo
  per type; expandable per-type guidance
STEP 2 — LIVE SELFIE: camera capture with liveness prompt
  (blink / turn); no gallery upload
STEP 3 — (OWNER, T3) OWNERSHIP PROOF: utility bill · registered
  rent agreement · society NOC · tax receipt — name + address
  must match the user and the listing locality
REVIEW & SUBMIT: evidence summary · [ ( Submit for review ) ]
  "Reviewed within 24h — usually much faster"      [support]
----------------------------------------
```
### 5. Components
Wizard skeleton (C-08); blocking consent card with checkbox; document-type picker with expandable guidance; camera capture; file uploader (≤10MB, JPEG/PNG/PDF); evidence review summary; submission receipt card; support link throughout.
### 6. Content
- Consent copy in plain language: what is collected → who sees it → retention and deletion.
- Aadhaar guidance: mask the first 8 digits before upload (enforced instruction copy).
- Liveness instructions plus camera-permission purpose copy at the selfie step.
- Ownership-proof options with the exact match requirement (name + address ↔ listing locality).
- Rejected-resubmission variant: prior reason codes prefilled as fix context (EC-07).
### 7. User Actions
| User Action | System Response | Next State / Screen |
|---|---|---|
| Complete all steps + Submit | Case created; state → Submitted; confirmation email | VER-02 (Submitted) |
| Tap Save draft | Draft retained; resume at exact step | exit (resume via entry points) |
| Upload fails (network / size / type) | Inline guidance; entered data and prior uploads retained; idempotent retry (EC-06) | stay |
| Submit with a prior rejection | Reasons prefilled from rejection codes (EC-07) | VER-02 (Submitted) |
| Deny camera permission at selfie step | Inline explanation of why live capture is required + retry | stay |
| Tap support | Help & Support | ACCT-03 |
### 8. Navigation
Back always preserves step data; leaving mid-flow requires explicit Save draft (no silent half-states). No bottom nav (wizard). Camera permission is requested only at the selfie step. Forward is always Submit → VER-02; the back arrow returns to the source (PROF-02 / VER-02 / ONB-02 / OWN-01). No external deep link — reminder notifications land on VER-02, which routes here.
### 9. Screen States
| State | What the user sees | Behavior |
|---|---|---|
| Default | Consent → evidence steps → review, per wireframe | Submit disabled until consent + required evidence present |
| Incomplete (draft) | Resumes at the exact saved step with prior uploads intact | Draft never expires mid-process |
| Error (upload) | Named cause (size / type / network) + fix; nothing lost (EC-06, EC-16) | Retry idempotent; no duplicate cases |
| Rejected (context) | Prior rejection reasons shown as prefilled fix guidance (EC-07) | Resubmission replaces the old case cleanly |
| Restricted (camera denied) | Why live capture is required + how to grant | No gallery fallback path for the selfie |
| Success | Receipt card + confirmation-email note | State visibly → Submitted |
### 10. Business / Functional Rules
1. Verification is human-reviewed with a <24h SLA; every submission produces a receipt and a VER-02 state (R-03).
2. Documents and selfies are visible only to the review team, never to other users; every access is logged; they are deleted 30 days after the decision (fraud-appeal window) (R-03).
3. Verification evidence never appears on any public or user-facing surface — only the resulting badge does (R-01).
4. Owners cannot publish without T3 approval; this flow is the only path through that gate (R-02).
5. The selfie must be live capture; document photos may come from files (R-03).
6. Fraud-suspect rejections escalate without a resubmission path — the user is told honestly what happens next (R-03).
### 11. Cross-Screen Dependencies
The resulting tier/badge state must render identically on VER-02, the PROF-02 verification card, and every C-06 badge row (PROF-01, ROOM-01, CHAT-02, owner surfaces). The T3 gate state must agree with OWN-01/OWN-02 (publish blocked until approval) and the ONB-02 owner path. Rejection reason codes shown here must be the same codes the user sees on VER-02 and the admin recorded on ADM-04. A second rejection must put this screen into cooling-blocked mode, visible on VER-02.
### 12. Completion Criteria
- [ ] Consent step blocks progression until acknowledged; copy covers collect → who sees → retention
- [ ] Seeker path (T2) and owner path (T2 + T3) both complete end-to-end with receipt + confirmation email
- [ ] Upload failures (EC-06) and field validation (EC-16) never lose data or duplicate cases
- [ ] Resubmission carries prior rejection reasons; second rejection leads to the 7-day cooling state
- [ ] No verification document or selfie is renderable on any user-facing surface
---

## VER-02 — Verification Status
### 1. Purpose
A transparent verification state machine the user can trust: it always shows where the case stands, what happens next, and exactly what to fix when something failed.
### 2. User Context
Any authenticated user checking on a submission — often straight after submitting, or returning via a notification. They may be waiting, approved, rejected, or locked in a cooling period. The screen's job is honesty: the state shown here is the state the review team sees.
### 3. Entry Points
- PROF-02 verification card
- HOME-02 owner dashboard verification gate / unverified-publish banner
- NOTIF-01 deep link and direct deep link from status-change emails (verification target)
### 4. Functional Wireframe
```text
----------------------------------------
TOP BAR: back · "Verification"
STATE CARD (exactly one active state):
  Not started            → [ ( Start verification ) ]
  Submitted / In review  → submitted-at timestamp + SLA note
  Approved               → badge preview (B-3 ID / B-4 Owner
                           Verified) + [Where my badge appears]
  Rejected / Resubmission required → reason in plain words +
                           the fix + [ ( Resubmit now ) ]
SLA NOTE: "We review within 24h — usually faster."
COOLING (2nd rejection): 7-day notice with the exact end date
SLA BREACH (>24h): apology banner; case auto-prioritized
EXPIRY: re-verify banner as the 12-month badge expiry nears
[Contact support]
----------------------------------------
```
### 5. Components
Single state card with progress markers; reason + fix panel; resubmit CTA; badge-preview explainer (modal); cooling notice; SLA-breach apology banner; support link.
### 6. Content
- Current state, submitted-at timestamp, and the SLA expectation.
- On rejection: the reason in plain words + a human-readable fix (e.g., "the document name didn't match your profile — upload a bill in your registered name").
- On approval: what the badge is, where it appears (profile, listings, messages), and its verification date.
- Cooling notice: why resubmission is paused and the exact date it ends.
- Expiry note: T2/T3 badges expire after 12 months; re-verification is lighter (re-confirm).
### 7. User Actions
| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap Start verification (Not started) | Opens the submission wizard | VER-01 |
| Tap Resubmit (Rejected / Resubmission required) | Opens the wizard with reasons prefilled | VER-01 |
| Tap re-verify banner (near expiry) | Opens the wizard (light re-verify) | VER-01 |
| Tap "Where my badge appears" | Badge-placement explainer opens | modal on VER-02 |
| Tap Contact support | Help & Support | ACCT-03 |
| Pull to refresh | State re-fetched; timestamps updated | stay |
### 8. Navigation
Back returns to the source (PROF-02 / HOME-02 / NOTIF-01). No bottom nav. Deep links resolve directly to this screen with the current state rendered; there is no dead state — every state offers at least one action (start, resubmit, support, refresh). Leaving mid-view has no state cost (read-only screen).
### 9. Screen States
| State | What the user sees | Behavior |
|---|---|---|
| Pending (Submitted / In review) | Timestamp + SLA note; honest clock | Refresh available; no fake progress |
| Success (Approved) | Badge preview + verification date + placement explainer | Badge live everywhere per C-06 |
| Rejected (incl. Resubmission required) | Reason + fix + resubmit CTA — never a bare "rejected" | Codes match the ADM-04 record |
| Expired (cooling, 2nd rejection) | 7-day notice with the exact end date (EC-07) | Resubmit disabled until the date passes; support path open |
| Error (SLA breach) | Apology banner above the state card (EC-04) | Case auto-prioritized in the review queue |
### 10. Business / Functional Rules
1. Every rejection carries a reason code and a fix — a bare rejection is a defect (R-03).
2. A second rejection starts a visible 7-day cooling period with the end date shown (EC-07).
3. If review exceeds 24h, the delay is admitted with an apology banner and the case is auto-prioritized (R-30, EC-04).
4. The state shown to the user is the same state the admin queue holds — no optimistic fake approvals (R-30).
5. Badges expire 12 months after approval; expiry is communicated before and after, and the badge is removed everywhere consistently (R-03).
### 11. Cross-Screen Dependencies
The active tier must agree with every C-06 badge row (PROF-01, PROF-02, ROOM-01, CHAT-02 header, owner listing surfaces) and with the publish gate on OWN-01/OWN-02. Not-started / rejected states must match the CTAs offered on PROF-02 and HOME-02. NOTIF-01 status-change rows must deep-link here and find the same state on arrival. VER-01 must read cooling/expiry state from here (blocked or light-path resubmission).
### 12. Completion Criteria
- [ ] All machine states render: Not started → Submitted → In review → Approved / Rejected / Resubmission required (+ cooling, SLA breach, expiry)
- [ ] Rejections always show reason + fix; cooling shows the exact end date
- [ ] SLA breach produces the apology banner and queue priority
- [ ] The user-visible state always equals the review team's state
- [ ] Every state has at least one next action (no dead ends)
---

## CONN-01 — Connections
### 1. Purpose
The state home for introductions: every connect request received and sent, with its live status and the actions that move it forward.
### 2. User Context
A seeker or flatmate returning to check who responded, or responding to others' requests. Each request is context-anchored (a room or a profile) so nothing is anonymous. The user must be able to accept into chat, decline without social fallout, withdraw, and see honest expiry states.
### 3. Entry Points
- HOME-01 connections pill (with pending count)
- NOTIF-01 deep link (connection request / accepted / expired rows)
- Post-connect success from C-03 (lands on the Sent tab with the new pending row)
**OPEN DECISION:** Is there a standing navigation path to CONN-01 (e.g., a profile-area link or the Chats pending-request badge), beyond the Home pill, notification deep links, and post-connect landing? Sources name only "pill, deep link, nav" without defining the third path.
### 4. Functional Wireframe
```text
----------------------------------------
TOP BAR: back · "Connections"
TABS: [ Received (2) ]   [ Sent (1) ]
RECEIVED ROWS: requester mini-card (C-02 projection) · badge ·
  score band if computable · context anchor ("About: 2BHK in
  HSR" / "your profile") · intro-note preview · time
  [ Accept ]   [ Decline ]
SENT ROWS: status chip (pending · accepted · declined · expired)
  · context anchor · [ Withdraw ] (pending only)
EMPTY: "No requests yet" + tips (complete profile · verify ID)
  + [ Discover people ]
----------------------------------------
BOTTOM NAV (shell) — Chats tab badge mirrors pending count
```
### 5. Components
Tabs with counts; request rows with context anchor and score band; accept / decline / withdraw actions; status chips; empty state with improvement tips (C-05); optional decline-reason sheet.
### 6. Content
- Received: who wants to connect, about what (room or profile anchor), fit score when computable (band + number), when, and their intro note.
- Sent: what was requested, the anchor, current status, and honest expiry ("expired" after 14 days).
- Empty-state tips: complete profiles and ID verification measurably improve response — with a direct CTA.
### 7. User Actions
| User Action | System Response | Next State / Screen |
|---|---|---|
| Accept (received) | Connection accepted; chat opens with the anchor context | CHAT-02 |
| Decline (received) | Silent to sender; optional reason sheet; 90-day re-request cooldown (EC-08) | stay — row clears |
| Withdraw (sent) | Pending request removed | stay |
| Tap requester mini-card | Masked profile | PROF-01 |
| Tap an expired sent row | Expired state shown honestly, no penalty copy | stay |
| Tap empty-state CTA | Discovery feed | DISC-03 |
### 8. Navigation
Back returns to the source (HOME-01 / NOTIF-01). Bottom nav present (shell). Deep links open the relevant tab with the row anchored; if the request has expired or the sender is gone, the row renders its honest state — never an error. Accept is the only door to chat; there is no alternate chat-creation path.
### 9. Screen States
| State | What the user sees | Behavior |
|---|---|---|
| Default | Both tabs with counts; rows per wireframe | Counts match source data everywhere |
| Empty | "No requests yet" + tips + discovery CTA (C-05) | Never blank |
| Expired (rows) | 14-day auto-expire rendered as a status chip (R-18) | Read-only; no residual actions |
| Restricted (blocked source) | Requests from blocked users never render (R-19) | No trace; counts not inflated |
| Error | Inline retry; list state preserved | Accept/decline idempotent (EC-10) |
### 10. Business / Functional Rules
1. Decline is silent — the sender is never notified and cannot re-request the same pair for 90 days (R-17, R-19, EC-08).
2. Connect requests expire after 14 days with an honest "expired" chip and no penalty to either side (R-18).
3. Accept is the only path to a conversation; nothing else creates a thread (R-16).
4. Duplicate requests are impossible — double-taps and races resolve idempotently (EC-10).
5. Requests from blocked users (either direction) never render (R-19).
### 11. Cross-Screen Dependencies
Accept must open CHAT-02 with the same anchor shown on the row (no context loss). The Chats tab badge (CHAT-01/shell) must reconcile with the pending count here. Sent-tab states must match the sender's own CONN-01 view and NOTIF-01 rows (expired notifications land on a truthful row). Declines must suppress re-request CTAs on PROF-01, DISC-03, and ROOM-01 for the 90-day window. Blocked pairs must be invisible here, on PROF-01, and in CHAT-01 simultaneously.
### 12. Completion Criteria
- [ ] Received/Sent tabs with accurate counts; every row shows anchor + status + time
- [ ] Accept → chat opens with anchor; decline is silent with a 90-day cooldown
- [ ] 14-day expiry renders honestly; duplicate requests are idempotent
- [ ] Empty state carries tips + a discovery CTA
- [ ] Blocked-user requests are filtered consistently everywhere
---

## CHAT-01 — Chat List
### 1. Purpose
Reach active conversations in one tap, with enough context (who, about what, what's new) that no conversation is ever anonymous.
### 2. User Context
Any authenticated user opening the Chats tab — the safety posture depends on in-app chat being the path of least resistance. They scan for unread messages and pending activity, and may arrive from a message digest. Owners see the same screen with seeker + listing anchors.
### 3. Entry Points
- Bottom-nav Chats tab (seeker and owner shells)
- NOTIF-01 deep link (new-message digest rows) and message-digest email link
- Post-accept redirect from CONN-01 (new conversation surfaces at top)
### 4. Functional Wireframe
```text
----------------------------------------
TOP BAR: "Chats" · bell (badge) · [search]
SAFETY NOTICE ROW (max 1/week): "Never pay before seeing the
  room — tips" → SAFE-01
CHAT ROWS (recency order): avatar · name (per masking policy) ·
  context chip ("HSR room" / "flatmate") · last-message preview
  (media as "[photo]") · time · unread dot + count
  frozen row (active safety case) → lock icon + one-line
  explanation; tap opens read-only thread
  deleted counterparty → "Deleted account" row (read-only,
  30-day retention)
EMPTY: "No conversations yet — connect with someone first"
  [ Discover people ]   [ Browse rooms ]
----------------------------------------
BOTTOM NAV — Chats active (badge = unread + pending requests)
```
### 5. Components
Conversation rows with context chips and unread counts; search; weekly safety-notice row; frozen / deleted-counterparty row variants; empty state (C-05); row overflow (⋯ → Report).
### 6. Content
- Per row: who (masked name per policy), what (context chip naming the anchor), last-message preview (media as a placeholder), recency, unread state.
- Frozen rows: one line explaining that the conversation is paused by NestMate while a safety case is open.
- Deleted-counterparty rows: honest "Deleted account" label; content stays readable in-thread.
- Safety notice: rotating meet-safe / pay-safe tips, at most one per week.
### 7. User Actions
| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap a row | Thread opens at the last-read position | CHAT-02 |
| Search chats | Filtered list by name / context chip | stay |
| Row overflow → Report | Report flow with the counterparty pre-attached | SAFE-02 |
| Tap safety-notice row | Safety Center | SAFE-01 |
| Tap a frozen row | Read-only thread + explanation banner | CHAT-02 (read-only) |
| Tap empty-state CTA | Discovery / room search | DISC-03 / DISC-01 |
### 8. Navigation
Tab root: device back exits the shell gracefully; bottom nav always present with Chats active. The tab badge equals unread messages plus pending connect requests (single source of truth with CONN-01 and NOTIF-01). Deep links from digests land on this list; an absent conversation degrades to its row state — never an error.
### 9. Screen States
| State | What the user sees | Behavior |
|---|---|---|
| Default | Recency-ordered rows with accurate unread counts | Counts reconcile with tab badge and NOTIF-01 |
| Empty | Honest sentence + discovery CTAs (C-05) | Never blank |
| Restricted (frozen pair) | Lock icon + explanation; row still opens read-only (R-23) | No sending until the case resolves |
| Disabled (deleted counterparty) | "Deleted account" read-only row (EC-13) | 30-day retention, then anonymized |
| Offline | Banner "You're offline — showing saved data" over the cached list | Retry on reconnect |
### 10. Business / Functional Rules
1. Chat is one tap from anywhere via the bottom nav — the safety design depends on it (R-16 posture).
2. Every row carries a context chip; conversations are never anonymous (R-16).
3. Threads exist only between connected parties; a list row cannot exist without an accepted connection (R-16).
4. Safety-class case freezes render as read-only rows with an explanation — never silent disappearance (R-23).
5. The safety notice appears at most once per week and is never dismissible into oblivion (R-29 posture).
### 11. Cross-Screen Dependencies
Unread counts must reconcile across this list, the shell tab badge, and NOTIF-01 read-state (no phantom badges). The pending-request badge input comes from CONN-01. Frozen states originate from SAFE-02 cases / admin decisions (ADM-07) and must render identically here and on CHAT-02. Counterparty deletion (ACCT-04 flow) must convert rows to the read-only "Deleted account" variant without breaking other rows.
### 12. Completion Criteria
- [ ] Rows show name per masking policy + context chip + preview + unread state
- [ ] Tab badge = unread + pending requests, consistent with CONN-01 and NOTIF-01
- [ ] Frozen and deleted-counterparty rows render their honest states
- [ ] Empty state offers both discovery CTAs
- [ ] Report entry from row overflow pre-attaches the counterparty
---

## CHAT-02 — Chat Thread
### 1. Purpose
The safe conversation surface — the heart of the privacy and safety posture: context-anchored talk, platform-guidance cards at the right moments, and the only mutual-consent path to contact details.
### 2. User Context
Two connected parties deciding whether to meet. They see the anchor (room or profile), each other's badges, and platform cards — not ads, not pressure mechanics. At some point one may want to share phone numbers; the product makes that deliberate, mutual, and safety-briefed.
### 3. Entry Points
- CHAT-01 row tap
- CONN-01 Accept (opens the thread with the intro card)
- ROOM-01 "Open chat" (existing connection)
- NOTIF-01 deep link (new message / reveal request / accepted request)
### 4. Functional Wireframe
```text
----------------------------------------
TOP BAR: back · mini-card + badge · anchor chip ("2BHK in HSR")
  · ⋯ (Share phone number · View listing/profile · Report · Block)
SYSTEM CARDS (platform voice, distinct): intro card (anchor
  summary + 3 suggested questions from attribute overlap) ·
  meet-safe card (first visit/meet mention → tips) · payment
  notice ("Payments are not supported on NestMate")
STREAM: text · images (≤3 per message) · system cards ·
  phone/email/link in text → masked pills (both sides see the
  same masking) · delivery indicator only, no read receipts
REVEAL (C-04, in-thread): "Share phone numbers?" — what is
  shared: number only · with whom: this person · safety copy
  pre-attached · [ I'll share my number ] [ Not now ]  ← BOTH
  must consent; on both consent → numbers render once + pre-meet
  safety card
COMPOSER: [ text ] [ attach image ] [ ( Send ) ] · typing
  indicator · failed message → inline retry / delete
----------------------------------------
```
### 5. Components
Context header with badge row (C-06) and anchor; system-card inserts; masked-pill message renderer; contact-reveal consent card (C-04); composer with image attach and optimistic send; report/block overflow.
### 6. Content
- Header: who (masked name), trust badge, what the conversation is about (anchor chip) — tap to reopen the anchor.
- Intro card: anchor summary plus 3 suggested questions from attribute overlap.
- Moment cards: meet-safe tips before visits; the no-payments notice on payment patterns; a gentle notice if someone pastes "WhatsApp me" before reveal.
- Consent card (C-04): exact scope ("your number only, with this person only") + pre-attached safety tips.
- Counterparty unverified: subtle "Not ID-verified" chip + safety link in the header (the one allowed absence marker).
### 7. User Actions
| User Action | System Response | Next State / Screen |
|---|---|---|
| Send a message | Optimistic delivery (<1s); failure → inline retry/delete (EC-17) | stay |
| Attach images | Scanned + size-capped, ≤3 per message (R-21) | stay |
| Type a phone / email / link | Auto-masked as pills in render — both sides | stay |
| Tap "Share phone number" | Consent card (C-04); both consent → numbers render once + safety card; decline hides the CTA 7 days (EC-19) | stay |
| Both parties request reveal | Deduped into one consent flow (EC-18) | stay |
| Tap Report / Block | Report flow pre-attached; block severs platform contact | SAFE-02 |
| Tap anchor chip / View listing or profile | Anchor reopens | ROOM-01 / PROF-01 |
### 8. Navigation
Back preserves scroll position and returns to CHAT-01 (or the entry surface). No bottom nav. Deep links open the thread directly; if the pair is frozen or the counterparty deleted, the thread renders read-only with its banner — never an error. Leaving mid-compose keeps the draft. Mode switching (seeker ⇄ owner) never interrupts an open thread (EC-25).
### 9. Screen States
| State | What the user sees | Behavior |
|---|---|---|
| Default (active thread) | Stream + composer + context header | Delivery indicators only; no read receipts |
| Empty (new thread) | Intro card + anchor summary + suggested questions | Composer ready; no dead thread |
| Error (send failed / drop) | Inline retry/delete on the bubble; no phantom "delivered" (EC-17) | Graceful poll fallback; inline note at 10 messages/min (R-21) |
| Pending (reveal) | Consent card awaiting the other party; chat continues normally | One deduped consent flow (EC-18) |
| Restricted (frozen pair) | Read-only banner explaining the active safety case (R-23) | No sending until resolved; support path |
| Disabled (counterparty deleted) | "Deleted account" read-only thread (EC-13) | Content retained per retention policy |
### 10. Business / Functional Rules
1. Only connected parties have threads; numbers, emails and links are masked in every render — the only reveal path is the mutual-consent card, executed once and logged (R-16).
2. A declined reveal hides the CTA for 7 days with neutral copy; a declined connection cannot be re-requested for 90 days (R-17).
3. The platform never processes payments; payment-pattern messages trigger the in-chat warning card and are logged as a fraud signal (R-20).
4. Media ≤3 images per message, scanned and size-capped; messages capped at 10/min; failed sends retry idempotently (R-21).
5. Messages are not deletable for the counterparty (safety trail); the product makes no end-to-end-encryption claims — masking and consent are the honest posture (R-16, R-30).
### 11. Cross-Screen Dependencies
Anchor chips must deep-link to the exact ROOM-01/PROF-01 the connection was created from, and listing state changes (Filled, expired) must render on the anchor. Reveal state must agree with NOTIF-01 rows (reveal_requested / reveal_completed) and the C-04 card lifecycle; the declined-reveal cooldown must suppress the CTA here and everywhere else it might reappear. Report/Block must hand SAFE-02 the message context and immediately reflect mutual invisibility on CHAT-01, CONN-01, PROF-01 and DISC-03. Frozen/deleted states must match CHAT-01 rows exactly.
### 12. Completion Criteria
- [ ] Two connected users can move introduction → agreement → revealed, safety-briefed call inside one surface
- [ ] Masking (phone/email/link) renders identically for both sides; only mutual consent reveals
- [ ] System cards appear at the right moments (intro, pre-meet, payment pattern, pre-reveal handoff)
- [ ] Send failure, rate limit, freeze, deletion, and reveal-decline states all render as specified
- [ ] Report/Block from the thread carries message evidence context into SAFE-02
---

## NOTIF-01 — Notifications Center
### 1. Purpose
One notification state home: a user who ignores the app for days can reconstruct everything important — and every row deep-links to the object it names.
### 2. User Context
Any authenticated user checking what changed: new requests, accepted requests, messages, verification outcomes, listing and applicant activity (owners), report closures. They scan grouped, reverse-chronological rows and tap through. Self-triggered actions never generate rows.
### 3. Entry Points
- Top-bar bell on any shell (with unread badge) — the bell is global
- Deep links from emails (status-change, digest, and closure templates)
- Direct deep links to the authenticated app from shared/external surfaces
### 4. Functional Wireframe
```text
----------------------------------------
TOP BAR: back · "Notifications" · [Mark all read] · settings
GROUP: Today — rows: icon · title · body · time · unread dot →
  tap target: connection request / accepted · new messages ·
  reveal requested/completed · verification outcomes ·
  listing approved/expiring/renewal due/auto-paused · applicant
  activity digest (owner, daily) · report closure (outcome, no
  other-party details) · account/enforcement notices
GROUP: This week — …
MUTED CATEGORY: dimmed rows + hint (per NOTIF-02)
EMPTY: "You're all caught up"   [ ( Explore matches ) ]
----------------------------------------
BOTTOM NAV (within shell)
```
### 5. Components
Grouped reverse-chronological list; unread dots; mark-all-read; per-row deep links with expiry-aware fallback; muted-category hint; settings gear (→ NOTIF-02).
### 6. Content
- Every row names its object concretely (which room, which person, which case) and the action available.
- Verification rows: submitted (ack) / approved / rejected, with the reason one tap away; owner rows include the daily applicant digest card and expiry nudges.
- Report-closure rows: outcome class + action taken — never details about the other party.
- Empty state: one honest sentence + a discovery CTA (C-05).
### 7. User Actions
| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap a connection row | Opens the relevant requests view | CONN-01 |
| Tap a message row | Opens the thread at the message | CHAT-02 |
| Tap a verification row | Status screen with the current state | VER-02 |
| Tap a listing / applicant row (owner) | Listing detail / pipeline stage | OWN-03 / OWN-04 |
| Tap a report-closure row | Own-report status view | SAFE-01 |
| Tap Mark all read | All rows read; badges clear everywhere | stay |
| Tap empty-state CTA | Discovery feed | DISC-03 |
| Tap settings | Notification settings | NOTIF-02 |
### 8. Navigation
The bell is global; back returns to the previous screen. Bottom nav present (shell). Deep links resolve to the object with expiry-aware fallback: a deleted or expired object renders a state banner + the nearest healthy screen — never a 404 (EC-12). Deleted actors render as "a user" (EC-13). Read-state clears badges at the same moment everywhere.
### 9. Screen States
| State | What the user sees | Behavior |
|---|---|---|
| Default | Today / This week groups; unread dots | Badge reconciles with bell + tab badges |
| Default (muted category) | Dimmed rows with an explanatory hint | Respects NOTIF-02; rows never vanish |
| Empty | "You're all caught up" + discovery CTA (C-05) | Never blank |
| Error (object gone) | State banner + nearest healthy screen (EC-12) | Deep-link fallback, no crash |
| Loading | Skeleton rows matching the final layout | ≤300ms perceived |
### 10. Business / Functional Rules
1. One center, not scattered toasts: every notification type in the catalog lands here (R-29).
2. Every notification deep-links to its object with an expiry-aware fallback (R-29, EC-12).
3. Channel defaults follow NOTIF-02; safety and enforcement notices always arrive and cannot be muted away (R-29).
4. Self-triggered actions never notify; declines are silent to senders (R-19, R-29).
5. Report closures state the outcome without revealing the other party (R-22, R-25).
### 11. Cross-Screen Dependencies
Read-state must reconcile with the bell badge, the Chats tab badge (CHAT-01), and CONN-01 pending counts — one truth, no phantom badges. Row targets must agree with the objects' current states on VER-02, OWN-03/OWN-04, CHAT-02, CONN-01 and SAFE-01. NOTIF-02 muted categories must dim here (not disappear), and the settings gear must land on the exact controls for those categories.
### 12. Completion Criteria
- [ ] All catalog rows render grouped Today / This week with icons, timestamps, unread dots
- [ ] Every row deep-links correctly, with the EC-12 fallback for dead objects
- [ ] Mark-all-read clears this list and every badge site simultaneously
- [ ] Muted categories render dimmed per NOTIF-02; safety rows always present
- [ ] Empty state offers a discovery CTA; self-actions never generate rows
---

## NOTIF-02 — Notification Settings
### 1. Purpose
Anti-spam control: the user chooses what pings them, on which channel — while safety-critical notices stay locked on, visibly and with an explanation.
### 2. User Context
A user trimming noise (often after digest fatigue) or checking why something arrived. They toggle event-group × channel cells with instant save. The page must make the two non-negotiables legible rather than frustrating: safety/enforcement notices and the new-message in-app floor.
### 3. Entry Points
- ACCT-01 Settings → Notifications row
- NOTIF-01 settings gear
- Contextual hint from a muted-category row on NOTIF-01
### 4. Functional Wireframe
```text
----------------------------------------
TOP BAR: back · "Notification settings" · "Choose what pings you."
MATRIX (event groups × channels: In-app / Email):
CONNECTIONS & MESSAGES
  New message         in-app: always on (locked) · email:
                      daily digest default
  Connection request  in-app: on · email: on
VERIFICATION & ACCOUNT
  Verification updates  in-app: on · email: on
  Account & security    always on (locked, both channels)
LISTING & APPLICANTS (owner)
  Applicant activity    in-app: on · email: daily digest default
  Listing expiry / renewal  in-app: on · email: on
SAFETY
  Safety & enforcement  ALWAYS ON (locked — explanation sheet)
TIPS & PRODUCT        off by default
----------------------------------------
(auto-save on toggle · consequence microcopy under each group ·
 no submit button)
```
### 5. Components
Event-group × channel matrix; locked rows with an explanation sheet; auto-save toggles with saved-state confirmation; group-level consequence microcopy.
### 6. Content
- Each group states what it covers (e.g., "Listing & applicants: new applicants, stage changes, expiry nudges").
- Locked rows explain why: "Safety and enforcement notices keep you safe — they are always on."
- New-message email default is a daily digest; per-message email never exists (anti-spam stance).
- Toggle feedback: instant saved-state confirmation per cell.
### 7. User Actions
| User Action | System Response | Next State / Screen |
|---|---|---|
| Toggle any unlocked cell | Saved instantly; cell shows saved state | stay |
| Tap a locked row | Explanation sheet opens | modal on NOTIF-02 |
| Toggle email off for a group | Email stops for that group (except locked rows); in-app unaffected | stay |
| Tap back | Settings retained (auto-saved) | ACCT-01 / NOTIF-01 |
### 8. Navigation
Back returns to the source (ACCT-01 or NOTIF-01) with nothing to save or discard — every toggle persists on tap. No bottom nav (push screen). Failed saves show an inline error on the affected cell and retry idempotently; nothing silently reverts.
### 9. Screen States
| State | What the user sees | Behavior |
|---|---|---|
| Default | Matrix reflecting server truth on load | Toggles never render optimistic lies |
| Loading | Matrix skeleton | ≤300ms perceived |
| Error (save fails) | Inline error naming the cell + retry | No silent revert (EC-16) |
| Disabled (locked rows) | Locked controls + explanation affordance | Safety/account rows cannot be turned off |
### 10. Business / Functional Rules
1. Safety and enforcement notices cannot be disabled on any channel (R-29).
2. New-message in-app notifications never drop below the always-on floor; email for messages defaults to a daily digest and is never per-message (R-29).
3. Max one email per event type per day; digests collapse; quiet hours apply to non-critical email (R-29).
4. All changes save on toggle — there is no submit step to forget (R-30 posture).
5. Owner groups (listing & applicants) appear only for accounts with owner intent (R-26 scope honesty).
### 11. Cross-Screen Dependencies
These preferences govern NOTIF-01 rendering (muted categories dim, never vanish) and email dispatch for every event group (verification, connections, listings, digests, closures). Locked-row behavior must agree with what SAFE-01 promises ("every report gets an outcome notice") and with CHAT-02's expectation that messaging continues regardless of email settings. Shell badge behavior must respect the in-app floor even when email is off.
### 12. Completion Criteria
- [ ] Matrix renders all groups × both channels with correct defaults
- [ ] Locked rows cannot be toggled and explain themselves
- [ ] Every toggle saves instantly and survives reload
- [ ] Failed saves show inline errors and never silently revert
- [ ] Owner groups appear only for owner-intent accounts
---

## SAFE-01 — Safety Center (Authenticated)
### 1. Purpose
Safety literacy plus action entry, available at decision moments: how to meet safely, what verification does and doesn't mean, how reporting works — and a one-tap path to Report.
### 2. User Context
A user who is about to meet someone, feels uneasy about a conversation, or wants to understand a badge or a freeze notice. They need two things fast: "what do I do" and "how do I report". Copy is shared with the public Trust & Safety Center — one source, two surfaces.
### 3. Entry Points
- PUB-04 handoff (logged-in variant of the public Trust & Safety Center)
- CHAT-02 system cards (meet-safe, payment notice, masking notice → "tips")
- SAFE-02 confirmation card ("Safety tips") and ACCT-01 Settings → Safety row
### 4. Functional Wireframe
```text
----------------------------------------
TOP BAR: back · "Safety Center"
[ ( Report a problem ) ]     ← primary CTA at top AND bottom
MEET-SAFE CHECKLIST: public place first · daytime first visit ·
  share live location with family · never pay before seeing
  the room · never share full ID over chat
DOCUMENT SAFETY: contact details are masked anyway · NestMate
  staff will never ask for money or OTP
HOW VERIFICATION WORKS: T0–T3 explained · what each badge means
  · "verification ≠ endorsement" disclaimer
HOW REPORTING WORKS: safety reports reviewed within 12h,
  others within 48h · every report gets an outcome notice
BLOCKING: blocked people cannot see you, message you, or appear
  in your discovery · [ Blocked accounts ]
EMERGENCIES: "NestMate is not an emergency service" · police
  112 · national cybercrime portal
----------------------------------------
[ ( Report a problem ) ]     (no bottom nav — push screen)
```
### 5. Components
Sectioned article with anchorable sections (deep-link targets for chat cards); primary report CTA (top + bottom); blocked-accounts management row; local emergency guidance block.
### 6. Content
- Meet-safe checklist matched to real Bangalore scam patterns (visiting-pass and deposit-before-viewing examples).
- Document-safety guidance: why the product masks contacts and why full IDs should never be shared in chat.
- Verification explainer: tiers T0–T3, badge meanings, and the honest "our team reviewed documents; it is not a guarantee or background check" line.
- Reporting expectations: <12h safety-class triage, <48h others; outcome notice guaranteed.
- Emergency disclaimer with local police and cybercrime links — the platform never poses as emergency services.
### 7. User Actions
| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap "Report a problem" | Report flow opens (target chosen inside) | SAFE-02 |
| Tap "Blocked accounts" | Blocked-list management view | SAFE-01 (management view) |
| Tap the verification section | Full trust explainer | PUB-04 |
| Follow a chat-card deep link | Jumps to the anchored section | SAFE-01 (section) |
| Tap support link | Help & Support | ACCT-03 |
### 8. Navigation
Back returns to the source (PUB-04 / CHAT-02 / SAFE-02 / ACCT-01). No bottom nav. Sections are anchorable — chat system cards and notifications deep-link to the exact section, not just the page. The screen is read-only content plus action entry; nothing here can be broken by state elsewhere.
### 9. Screen States
| State | What the user sees | Behavior |
|---|---|---|
| Default | Full article with both report CTAs | Sections anchorable |
| Loading | Section skeletons | ≤300ms perceived |
| Error (content fails) | Static evergreen fallback copy + retry | Page never blocks on the content fetch |
| Empty (no blocked accounts) | Honest "no blocked accounts" line in the management view | Never blank |
### 10. Business / Functional Rules
1. Copy is shared with PUB-04 — one source, two surfaces; the two must never contradict (R-30).
2. Guidance appears contextually (chat cards deep-link here) — not only behind this page (R-29 posture).
3. The platform never claims to be an emergency service; local emergency numbers are always shown (R-30).
4. Blocked-list management lives here: blocking is mutual invisibility across every surface, silent to the blocked party (R-19).
5. Verification is described exactly as it is — document review, not background checks (R-01, R-30).
### 11. Cross-Screen Dependencies
Copy parity with PUB-04 is a hard invariant (same facts, same SLA numbers). The report CTA must open SAFE-02 without a pre-attached target. Blocked-accounts state must agree with the mutual-invisibility behavior enforced on DISC-03, PROF-01, CONN-01, and CHAT-01/CHAT-02. The SLA numbers quoted here must match SAFE-02's confirmation and the admin SLA configuration (ADM-07). Chat system cards must deep-link to live sections.
### 12. Completion Criteria
- [ ] All sections render in order with the report CTA at top and bottom
- [ ] SLA and disclaimer copy match PUB-04 and SAFE-02 verbatim
- [ ] Chat-card deep links land on the exact sections
- [ ] Blocked-accounts view manages the block list with honest scope copy
- [ ] Emergency guidance (112 / cybercrime portal) is present and unambiguous
---

## SAFE-02 — Report / Block Flow
### 1. Purpose
Structured escalation that makes the reporter feel heard and triggers real protections immediately: a reference ID, defined SLAs, and auto-protections where severity demands.
### 2. User Context
A user reporting another person, a listing, or a specific message — often while upset. The target is auto-attached from where they came from; they pick a reason, optionally add evidence, and decide on blocking. Guests can only report listings, via the public form. Every submission must produce a visible outcome.
### 3. Entry Points
- Overflow menus (⋯) on profiles, listing cards, listing details, chat threads (target pre-attached)
- CHAT-02 overflow (message context carried as the evidence anchor)
- SAFE-01 "Report a problem" (no target pre-attached) and the PUB-04 guest report form (listing-scoped variant only)
### 4. Functional Wireframe
```text
----------------------------------------
WIZARD (C-08, no bottom nav): Step N of 4
STEP 1 — TARGET: auto-attached read-only chip ("Reporting: Priya
  · HSR listing" / a message / a listing)
STEP 2 — REASON (single choice): Scam or fraud · Harassment or
  abuse · Fake profile or listing · Inappropriate content ·
  Off-platform payment request · Safety concern · Other
STEP 3 — DETAILS (optional): free text + evidence screenshot
  upload (restricted access)
STEP 4 — IMMEDIATE PROTECTION: [x] Also block this person
  (default ON vs counterparty) · "Blocked: they can't contact
  or see you"
[ ( Submit report ) ]        [Block only]   [Cancel]
----------------------------------------
CONFIRMATION: "Report received — reference ID" · "Safety reports
  are reviewed within 12h" · [ Safety tips → SAFE-01 ]
```
### 5. Components
Wizard skeleton (C-08); read-only target chip; reason picker (fixed taxonomy); evidence uploader; block toggle with consequence line; confirmation card with reference ID; dedupe notice.
### 6. Content
- Target chip naming exactly what is reported (user / listing / message) — not editable, for audit integrity.
- Plain-language reason list matching the platform taxonomy, each with a one-line scope hint.
- Expectation setting: 12h safety-class / 48h other triage; outcome notice guaranteed.
- Block consequence copy — and honesty after a reveal: an already-shared number cannot be recalled.
- Confirmation: reference ID + next steps + safety-tips link.
### 7. User Actions
| User Action | System Response | Next State / Screen |
|---|---|---|
| Submit report | Case created; severity-based auto-protections apply (safety-class: chat pair freeze / listing unlist while pending) (R-23) | Confirmation → SAFE-01 |
| Toggle block + submit | Block executes immediately — mutual invisibility everywhere (R-19) | Confirmation → SAFE-01 |
| Tap Block only | Block without a case; "also report?" prompted once | back to source |
| Re-report the same object | Deduped: "already under review" (EC-09) | stay |
| Report own listing / self | Prevented with an inline explanation | stay |
| Cancel | Nothing sent; returns to the source | source screen |
### 8. Navigation
Back preserves selections per step; Cancel exits with nothing sent and returns to the exact source screen. No bottom nav (wizard). The guest variant (from PUB-04) is listing-scoped with the same wizard, ending in a guest-safe confirmation. After submission the flow always ends on the confirmation → SAFE-01 — never a dead end.
### 9. Screen States
| State | What the user sees | Behavior |
|---|---|---|
| Default | 4 steps per wireframe; block default ON vs counterparty | One primary CTA per step |
| Error (upload fails) | Named cause + fix; report text preserved (EC-06) | Retry idempotent; no duplicate cases |
| Restricted (dedupe) | "Already under review" + the open case's reference (EC-09) | No duplicate pile-on |
| Restricted (self-target) | Inline explanation; submission prevented | No self-cases |
| Success | Reference ID + SLA + protection status | Reporter tracked for the closure notice |
### 10. Business / Functional Rules
1. Reports are structured: fixed reason taxonomy + optional evidence; the reporter always receives a closure notice with the outcome and no other-party details (R-22).
2. Safety-class cases auto-protect while pending — chat pair freeze and/or listing unlist — and dismissal cleanly reverses protections (R-23).
3. Report content is never shown to the reported user; evidence is access-restricted and purged with the case (R-25).
4. Block is mutual invisibility across every surface, immediate and silent to the blocked party; it cannot recall a number already revealed — the copy says so (R-19).
5. Guests may report listings only, through the public form; authenticated reporting covers users, listings, and messages (R-22).
6. Every case lands in the admin queue with a severity class and SLA; nothing enters a void (R-22, R-25).
### 11. Cross-Screen Dependencies
Auto-protections must render immediately on CHAT-01/CHAT-02 (frozen rows/banner) and owner surfaces (unlisted state on OWN-02/OWN-03), and reverse identically on dismissal. Block must propagate to CONN-01 (request filtering), PROF-01, DISC-03, and CHAT-01 simultaneously. The confirmation's SLA copy must match SAFE-01 and the admin SLA configuration (ADM-07). The closure notice arrives as a NOTIF-01 row deep-linking to the report status. Evidence must preserve the exact message context from CHAT-02.
### 12. Completion Criteria
- [ ] Target auto-attaches from every entry point; guests get the listing-scoped variant
- [ ] All seven reasons selectable; evidence upload survives failure without data loss
- [ ] Block executes immediately and is invisible-to-invisible on all surfaces
- [ ] Confirmation shows reference ID + SLA + SAFE-01 link; dedupe and self-report render as specified
- [ ] Safety-class submissions trigger pair freeze / listing unlist while pending, reversed on dismissal

## OWN-01 — Listing Creation Wizard

### 1. Purpose

Produce a structured, honest, attractive listing in one guided flow — complete enough that seekers can decide without asking, honest enough that moderation rarely needs to intervene.

### 2. User Context

A verified (or soon-to-verify) owner creating their first listing, or an experienced owner adding or editing a room. They know their property; they may not know what seekers need to see or what the rules forbid (exact address, contact details). The wizard teaches while it collects.

### 3. Entry Points

- HOME-02 "+ New listing"; OWN-02 "+ New"; post-verification success
- OWN-03 "Edit" (same wizard, prefilled, edit mode)
- Draft resume — reopens at the exact step (EC-01)

### 4. Functional Wireframe

```text
----------------------------------------
WIZARD (no bottom nav):  dots · "Step N of 6" · [Save draft]
STEP 1 ROOM BASICS:   type · furnishing · size · bathrooms · floor
STEP 2 PHOTOS:        min 3 / max 10 · cover select · reorder ("5+ photos, about twice the connects")
STEP 3 RENT & TERMS:  rent · deposit (MANDATORY, why-we-ask shown) · maintenance incl? · notice · move-in date · duration
STEP 4 AMENITIES & RULES:  chips · house rules <=500 chars · contacts blocked
STEP 5 OCCUPANCY:     occupants + gender composition (shared) · lifestyle ethical set: dietary · smoking · pets · guests
STEP 6 LOCATION:      locality + approximate pin (exact address NEVER entered)
REVIEW:  preview card (C-01)   [Preview as seeker]   [ ( Publish ) ]
GATE (no T3): explained interstitial, draft kept -> VER-01
----------------------------------------
```

### 5. Components

Wizard skeleton (C-08); photo uploader with quality hints, cover picker and reorder; inline field validation (EC-16); chip multi-selects; house-rules text area with contact-pattern blocking; live preview card (C-01); verification interstitial; duplicate-warning sheet (R-10).

### 6. Content

- Mandatory fields: rent, deposit, move-in date, at least 3 photos, locality, room type; deposit carries the why-we-ask line (hidden deposits are the #1 scam pattern — shown upfront, R-07).
- Occupancy: factual composition for shared homes; the ethical expectation set only (R-14); locality-level location only, with the privacy explanation ("the exact address is shared by you in chat, when you choose"). The review step renders exactly the public projection seekers will see.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Complete a step, tap Continue | Inline-validated; saved per step; nothing lost on failure (EC-16) | OWN-01 (next step) |
| Tap Save draft | Draft kept; resume banner appears on HOME-02 | HOME-02 |
| Tap Publish (has T3) | Auto-checks run → Active (usually instant) or Pending if flagged | HOME-02 (success card) |
| Tap Publish (no T3) | Verification interstitial — never a silent block; draft preserved | VER-01 |
| Type contact details in house rules | Blocked inline with the masking explanation | OWN-01 (step 4) |
| Duplicate detected at publish | Warning sheet: merge / replace / publish anyway (R-10) | sheet → chosen path |

### 8. Navigation

Previous: HOME-02 or OWN-02 (OWN-03 in edit mode). No bottom nav (wizard). Back preserves every field; Save draft exits explicitly. Draft resume reopens at the exact step (EC-01). Publish success returns to HOME-02 with a success card; the listing then appears on OWN-02 and all seeker surfaces. Leaving mid-edit never publishes partial changes.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Current step with inline validation | one primary CTA |
| Draft | Draft saved; resume banner on HOME-02 | survives abandonment (EC-01) |
| Pending / Success | "Under review" card when flagged / "Usually approved instantly" confirmation | decision notified <12h; then live everywhere |
| Publish-gated | Interstitial explaining the T3 requirement | draft kept → VER-01 |
| Duplicate / Error | Merge-replace-proceed sheet (R-10) / inline errors, publish disabled while invalid | owner chooses / idempotent retry |

### 10. Business / Functional Rules

1. Deposit is mandatory on every listing and always visible downstream (R-07); exact address is never a field — locality + approximate pin only (R-08), and contact details are pattern-blocked in free text.
2. Minimum 3 photos to publish, maximum 10; the cover photo is owner-selected.
3. Publish requires T3 — enforced as an explained interstitial, not an error (R-02); unverified owners can complete and save a draft.
4. Duplicates are warned pre-publish with merge/replace/proceed options; proceeding anyway routes the listing to moderation review (R-10). Household expectations are limited to the ethical set (R-14).

**OPEN DECISION:** When an Active listing's content is edited, do changes go live immediately with post-hoc moderation flagging, or does the listing re-enter the Pending review state before edits appear?

### 11. Cross-Screen Dependencies

The review preview must be the same C-01 projection that renders on PUB-03, ROOM-01, DISC-01 cards and on the owner's OWN-02/OWN-03 — a published listing must not contradict its wizard preview on any field. Occupancy and lifestyle entries feed household compatibility shown on OWN-04/OWN-05 and seeker-side scores. Draft existence must agree with HOME-02's banner; the T3 gate state must agree with VER-02. A published listing appears exactly once on OWN-02 (duplicate resolution keeps the list clean).

### 12. Completion Criteria

- [ ] All 6 steps + review render in order; the mandatory field set is enforced
- [ ] Deposit mandatory with why-we-ask; exact address impossible to enter (R-07, R-08)
- [ ] Photos: min 3 / max 10, cover select, reorder, quality hint present
- [ ] Publish gate, duplicate sheet, contact-pattern block, and exact-step draft resume all behave per spec (R-02, R-10, EC-01)

---

## OWN-02 — Listings Management

### 1. Purpose

Keep the owner's inventory truthful at a glance: every listing, its true lifecycle state, its freshness, and the one-tap fix — so no listing can silently rot.

### 2. User Context

An owner with one or several listings checks status, renews what is expiring, pauses what is undecided, and closes what is gone. They arrive from the dashboard or the Listings tab, usually with one specific action in mind.

### 3. Entry Points

- Owner bottom-nav "Listings" tab
- HOME-02 (expiry attention item; listing cards)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  "Listings" · [ ( + New ) ]      <- primary CTA
ROW (sorted by attention — expiring first):  thumb · title (locality ·
  type) · state chip · freshness "confirmed 2d ago" · views/saves mini
  QUICK ACTIONS (state-dependent):  Renew (one tap) · Pause/Resume · Mark filled · ⋯ (Edit · Share · Remove)
AUTO-PAUSED ROW:  "Paused automatically after 45 days — refresh
                   photos to revive"  [Revive]
FILLED / REMOVED ROW:  closed chip with date, actions hidden / state + reason
----------------------------------------
EMPTY:  "No listings yet"  [ ( Create your first listing ) ]  -> OWN-01
BOTTOM NAV (Listings active)
----------------------------------------
```

### 5. Components

Attention-sorted row list with state chips; per-row quick actions (destructive actions only in the ⋯ overflow); auto-paused revive explainer; quality-nudge card; empty state (C-05); owner shell bottom nav.

### 6. Content

- Every listing's true state: Active · Expiring (3d) · Expired · Paused · Auto-paused · Filled · Removed — the same chips every other surface renders.
- Freshness stamp "confirmed Xd ago" per row (R-06); views/saves/connects mini; last activity.
- Auto-paused rows explain the 45-day rule and the revive path; more than 2 consecutive expiries trigger a quality-nudge card with photo and description tips.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap a row | Owner listing detail | OWN-03 |
| Tap Renew (expiring/expired) | +30 days; freshness stamp resets; confirm toast (R-05) | OWN-02 (updated) |
| Tap Pause / Resume | State changes; paused = invisible to search; public URL shows the paused state (EC-12) | OWN-02 (updated) |
| Tap Mark filled | Confirm sheet → fill cascade (closed everywhere; other applicants politely closed) (R-09) | OWN-02 (Filled chip) |
| Tap Revive (auto-paused) | Revive-confirm; listing re-validates and reactivates | OWN-02 (Active) |
| Tap ⋯ → Remove / + New | Confirm + reason required, removed everywhere / creation wizard | OWN-02 (Removed) / OWN-01 |

### 8. Navigation

Tab root within the owner shell — bottom nav present; device back exits gracefully. Row → OWN-03 is a push; back returns with updated state. + New → OWN-01 (no bottom nav inside the wizard). Renew, pause, fill and revive never navigate away — the row updates in place.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Attention-sorted rows with true state chips | skeleton loading ≤300ms |
| Empty | "No listings yet" + create CTA (C-05) | → OWN-01 |
| Expiring (day-27+) / Expired | Expiring chip + one-tap Renew, nudge also notified / Expired chip + Renew CTA | renew resets the stamp; renewal reactivates |
| Auto-paused (45d) | "Paused automatically" chip + revive explainer | revive or let expire |
| Paused | Paused chip + Resume | invisible to search while paused |
| Filled / Removed | Closed chip (Filled shows date) / Removed shows reason | read-only row |

### 10. Business / Functional Rules

1. Freshness lifecycle is exact: day-27 nudge → day-30 expiry unless renewed → one-tap renewal (+30 days, stamp resets) → 45 days without confirmation → auto-pause with revive path (R-05).
2. Mark-Filled here triggers the same fill cascade as OWN-03/OWN-05 — pausing or expiring is never a silent substitute for closing (R-09).
3. Sorting is by attention: expiring/expired first, then active, paused, filled, removed.
4. Removal requires a reason; moderation removals show the platform's reason (EC-21). Paused listings keep their public URL but render a paused-state banner, never a 404 (EC-12).

### 11. Cross-Screen Dependencies

State chips must be identical on HOME-02 cards, OWN-03, and every seeker surface (DISC-01/PUB-02 cards, ROOM-01 state banners, DISC-04 saved rows) — one lifecycle truth (EC-12). A renewal here must update the freshness stamp on all those surfaces (R-06). Filled/Removed must propagate to OWN-04 (pipeline close-out) and seeker saved rows. Row-level stats must not contradict HOME-02's minis.

### 12. Completion Criteria

- [ ] All lifecycle states render with standard chips, attention-sorted
- [ ] One-tap renew resets the freshness stamp and is reflected everywhere (R-05, R-06)
- [ ] Pause / Resume / Filled / Revive / Remove each behave per the table
- [ ] Auto-paused rows explain the 45-day rule; removal requires a reason; empty state routes to OWN-01

---

## OWN-03 — Listing Detail (Owner View)

### 1. Purpose

Per-listing control center: exactly what seekers see, exactly how it performs, and every lifecycle action — so the owner can manage one room with full information.

### 2. User Context

An owner who tapped a listing from OWN-02 or HOME-02 wants either to check performance and act on the lifecycle, or to verify the listing looks right to seekers. Both views must be present and honest.

### 3. Entry Points

- OWN-02 row tap; HOME-02 listing card tap
- Notification deep-link (listing approved / flagged / expiring — resolves to the current state, EC-12)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · title (locality · type) · state chip · ⋯ (Share · Remove)
PUBLIC VIEW PANEL:
  identical projection to ROOM-01 — gallery · rent + deposit · badge
  row (C-06) · freshness stamp · amenities · household info
  moderation banner renders here when flagged: "Under review"
OWNER PANEL:
  STATE CONTROLS (state-dependent):  [Renew] [Pause/Resume] [Mark as Filled]
  ANALYTICS (7d / 30d):  views · saves · connects · connect→chat · "renew by <date>"
  APPLICANT SUMMARY:  New N · Shortlisted N · Met N   -> OWN-04
  DANGER ZONE:  Remove listing (confirm + reason)   (no bottom nav — push screen)
----------------------------------------
```

### 5. Components

Dual-view layout (public projection panel + owner panel); state-dependent control row; analytics block with window toggle; applicant stage summary; danger zone with confirm + reason; overflow menu.

### 6. Content

- Public panel: exactly the seeker projection — gallery, rent + deposit (R-07), "confirmed Xd ago" (R-06), badge row, amenities, household expectations.
- Analytics: views, saves, connects, connect→chat rate over 7/30-day windows (deliberately small, honest numbers).
- Moderation status when flagged ("Under review — flagged listings are reviewed <12h") or removed by moderation (state + reason + appeal link); Filled date and renewal deadline when relevant.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap Renew / Pause / Resume | +30 days, stamp resets (R-05) / state changes, paused = not searchable, public URL shows the paused state (EC-12) | OWN-03 (updated) |
| Tap Mark as Filled | Confirm sheet: "other applicants will be politely closed" → fill cascade (R-09) | OWN-03 (Filled) |
| Tap Edit | Same creation wizard, prefilled | OWN-01 (edit mode) |
| Tap applicant summary | Stage board for this listing | OWN-04 |
| Tap Share | Public-safe share card (photo, rent, locality, badge, freshness) | system share sheet |
| Tap Remove | Confirm + reason; listing removed everywhere | OWN-02 |

### 8. Navigation

Previous: OWN-02 or HOME-02. Push screen — no bottom nav; back returns to the list with updated state. Edit opens OWN-01 prefilled (draft semantics; leaving never publishes partial edits). Notification deep-links always land here in the listing's current state — expired/filled/removed resolve to the state banner with a next action, never an error (EC-12).

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Active / Paused | Full dual view with Pause / Mark-Filled controls / Resume control, public panel rendered as paused | mutations in place; paused = not searchable |
| Expiring / Expired / Auto-paused | Renew emphasized with expiry date / Expired chip + Renew / revive explainer + Revive | one-tap renew; revive re-validates |
| Pending / Flagged | "Under review" card after publish or flag on the public panel | decision notified <12h (R-30) |
| Removed (moderation) | State + reason + appeal link | appeal path |
| Filled | Filled chip + date; pipeline closed; no lifecycle actions | view-only record |

### 10. Business / Functional Rules

1. The public panel never alters the masking seekers see — no exact address, no contact details, ever (R-08, R-16).
2. Mark-as-Filled is the only honest way off the market — pause or expiry is never a silent substitute (R-09); the confirm sheet states the consequence for other applicants.
3. Moderation state overrides owner state and is always explained with a reason (EC-21); owners can appeal.
4. Analytics are real and small: four metrics, two windows — no vanity numbers (R-30).

### 11. Cross-Screen Dependencies

The public panel must render identically to ROOM-01 (and PUB-03 for guests) — same projection, same masking, same badge row. Analytics minis on HOME-02 must equal this screen's numbers. The applicant summary must equal OWN-04's stage counts. Mark-as-Filled must propagate: OWN-02 chip, OWN-04 bulk-close, DISC-04 saved-row state, CONN-01 pending requests withdrawn. Moderation status must match the decision recorded on the moderation queue.

### 12. Completion Criteria

- [ ] Public panel is the identical seeker projection incl. deposit + freshness
- [ ] State controls appear only for the current state; mutations update in place
- [ ] Mark-Filled confirm states the cascade consequence; cascade completes
- [ ] Analytics show views/saves/connects/connect→chat rate with 7/30d toggle
- [ ] Flagged/Removed states show a reason with appeal path (EC-21); edit opens OWN-01 prefilled

---

## OWN-04 — Applicant Pipeline

### 1. Purpose

The queue-with-context that replaces inbox chaos: every applicant, every stage, decision-relevant facts on each card — nothing lost, nobody silently ghosted.

### 2. User Context

An owner receiving connect requests as structured applicants. They need to triage fast (who is worth talking to), keep conversations moving, and drive to a decision — without a spreadsheet and without losing track of anyone.

### 3. Entry Points

- Owner bottom-nav "Applicants" tab (badge = New count)
- HOME-02 attention item and quick-glance; OWN-03 summary; new-applicant notification deep-link (lands on the stage)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · "Applicants" · listing selector (if multiple)
STAGE BOARD:  New -> Shortlisted -> Chatting -> Met -> Selected -> Moved in
  ·  terminal (collapsed): Rejected · Withdrawn
APPLICANT CARD:  photo · first name · badge row (C-06) · score band vs
  household · rent-fit chip · move-in date · 1-line why · New cards:
  [Shortlist] [Open chat] · tap = detail (idempotent, EC-26)
FILTERS (no protected attributes):  verified only · score band · SLA HINT: "respond within 24h"
EXPIRED -> banner; read-only except close-out. EMPTY: "applicants arrive
  when your listing is fresh — renew now" [Renew]
BOTTOM NAV (Applicants active, badge = New)
----------------------------------------
```

### 5. Components

Stage board with collapsed terminal groups; applicant cards (decision facts only — no protected-attribute filters); quick stage-move controls; filter chips; listing selector; empty state with renew CTA (C-05).

### 6. Content

- Per card: photo, first name, verification badges (C-06), compatibility score band vs the household (band name + number), rent-fit chip, move-in date, one-line why-this-match.
- Stage counts per column; New count mirrored in the tab badge; SLA hint tied to the owner's own response-rate tier. Declined/withdrawn applicants collapse into terminal groups — history visible, clutter gone.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap a card | Full detail with stage actions | OWN-05 |
| Tap Shortlist (New card) | Card moves to Shortlisted (idempotent) | OWN-04 (updated) |
| Tap Open chat | Thread anchored to this applicant | CHAT-02 |
| Tap Decline | Polite auto-notice; moves to Rejected (collapsed); 90-day re-request cooldown (EC-08) | OWN-04 (updated) |
| Apply filters / switch listing / renew (expired banner) | Cards narrow or board reloads; renewal exits read-only mode | OWN-04 (updated) |

### 8. Navigation

Tab root of the owner shell (Applicants active; badge = New count). Card → OWN-05 is a push; back returns with the board updated. Chat opens CHAT-02; back preserves stage and filter state. Notification deep-links land on the listing's board at the right stage.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Stage board with true counts and cards | skeleton loading ≤300ms |
| Empty | "Applicants arrive when your listing is fresh" + Renew if expiring (C-05) | renew CTA when applicable |
| Expiring / Expired listing | Nudge banner / expired banner; pipeline read-only except close-out (EC-12) | one-tap renew; decline/close only |
| Filled listing | Board collapsed; remaining New politely closed (R-09) | bulk close-out visible |
| Withdrew applicant | Collapsed terminal entry (EC-08) | history preserved |
| Error | Per-block retry; the board never silently drops cards | idempotent stage moves |

### 10. Business / Functional Rules

1. Stages are exactly New → Shortlisted → Chatting → Met → Selected → Moved in, with terminal Rejected/Withdrawn; every stage move is one tap and idempotent (EC-26).
2. Owners cannot filter or search applicants by gender, religion, or caste — the pipeline shows what applicants chose to share plus compatibility, nothing more (R-14).
3. Filling the room politely auto-closes all other applicants with a standard notice — no silent ghosting (R-09); an expired listing's pipeline is read-only except close-out (EC-12). The SLA hint and response-rate tier come from the same platform-computed metric shown on HOME-02 and OWN-06.

**OPEN DECISION:** Is stage movement forward-only (with terminal Rejected/Withdrawn exits), or can owners move an applicant backward between stages (for example Chatting → Shortlisted)?

### 11. Cross-Screen Dependencies

Stage counts must equal HOME-02's quick-glance, OWN-03's summary, and the Applicants tab badge. Card badges must render the same verification state as PROF-01 and CHAT-02 (C-06). Score bands must come from the same compatibility engine as OWN-05's household breakdown and seeker-side scores (R-11/R-12). The fill cascade must move OWN-02/OWN-03 to Filled, update DISC-04 saved rows, withdraw pending CONN-01 requests, and fire NOTIF-01 notices. Declines must respect the 90-day suppression in DISC-03 (EC-08).

### 12. Completion Criteria

- [ ] Full stage flow with collapsed terminal groups; moves one-tap and idempotent
- [ ] Cards carry decision facts: badges, score band, rent-fit, move-in, why-line
- [ ] No protected-attribute filtering exists anywhere on this screen (R-14)
- [ ] Expired-listing read-only mode and close-out work (EC-12); decline applies the 90-day cooldown
- [ ] Counts match the tab badge, dashboard, and listing summary at all times

---

## OWN-05 — Applicant Detail & Compare

### 1. Purpose

Decision-quality evaluation of one candidate — compatibility against the actual household, interaction history, private notes — plus honest side-by-side comparison before the consequential act of selecting.

### 2. User Context

An owner choosing between candidates is making the product's highest-stakes owner decision. They need the evidence in one place: how this person fits each existing occupant, how the conversation has gone, and how they compare to the alternatives.

### 3. Entry Points

- OWN-04 applicant card tap (only entry)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · applicant name · verification badge
PROFILE (read-only PROF-01 variant + connection context):  photo · first name · occupation · badge row (C-06) · attributes
COMPATIBILITY BLOCK (vs your household):  vs you: 84 Great · vs Ravi: 76 Good
  match: veg, early schedule · differ: guests   (>=2 drivers)
TIMELINE:  requested -> chatting -> met (dates) · PRIVATE NOTES
  (owner-only, timestamped, never shown to applicant)
COMPARE TRAY:  [Add to compare] (n/3) -> side-by-side sheet:
  score · rent-fit · move-in · verification · key attributes
STAGE ACTIONS (state-dependent):  [Shortlist] [Mark met] [ ( Select ) ] · Open chat · Decline
SELECT -> confirm sheet: "The listing will be marked Filled and other
  applicants politely closed." -> fill cascade (R-09)
----------------------------------------
```

### 5. Components

Read-only applicant profile (PROF-01 variant); household compatibility block (per-occupant breakdown with match/differ drivers); timeline; private notes editor; compare tray with capacity limit and side-by-side table; stage action bar with confirm-on-Select.

### 6. Content

- Compatibility versus each existing occupant when attributes are shared — not just one household average; band name + number in text (R-11) with at least 2 drivers: what matches, what differs (R-12).
- Timeline of the applicant's journey: requested → chatted → met, with dates.
- Private notes: free-text, owner-only, timestamped — explicitly never visible to the applicant. Compare table: score, rent-fit, move-in, verification, key lifestyle attributes.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap Shortlist / Mark met | State-machine move, idempotent (EC-26) | OWN-04 (updated) |
| Tap Select | Mandatory confirm sheet → fill cascade: listing Filled everywhere; other applicants politely closed | OWN-03 (Filled) |
| Tap Decline | Polite notice; applicant to Rejected; 90-day cooldown (EC-08) | OWN-04 (updated) |
| Edit private note | Saved privately per applicant | OWN-05 (updated) |
| Tap Add to compare | Tray fills (max 3); side-by-side sheet renders | compare overlay |
| Tap Open chat | Thread anchored to this applicant | CHAT-02 |

### 8. Navigation

Previous: OWN-04 (push screen; no bottom nav). Back always returns to the board with updated stages. Compare renders as one overlay sheet — never stacked sheets. After Select completes, navigation lands on the Filled listing detail; further applicant actions there are closed out.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Full profile + compatibility + actions for the current stage | actions match stage |
| Withdrew / Rejected / Filled context | Terminal or read-only record; no stage actions (EC-08) | collapsed on return to board |
| Select-confirm | Consequence-stated confirm sheet | cascade executes transactionally |
| Compare (max 3) | Side-by-side table of chosen candidates | a 4th add is explained and blocked |
| Error | Inline retryable errors; notes never lost | idempotent save |

### 10. Business / Functional Rules

1. Select is consequential and always confirmed — it marks the listing Filled and politely closes every other applicant; the cascade is transactional (no half-filled states) (R-09).
2. Compatibility scores use the same explained engine as everywhere else: band + number + at least 2 drivers (R-11, R-12).
3. Private notes are owner-only forever — never exposed to the applicant or rendered in chat.
4. Decline sends a polite auto-notice and applies the 90-day re-request cooldown (EC-08); compare holds at most 3 candidates, with the limit explained.

### 11. Cross-Screen Dependencies

Score bands shown here must equal those on OWN-04 cards and derive from the same 10-attribute engine and the household inputs captured in OWN-01/OWN-06 (recompute with the honest "matches updating" banner after lifestyle edits, R-15). The fill cascade must agree with OWN-02/OWN-03 (Filled chip), OWN-04 (bulk close), DISC-04 (saved rows), and NOTIF-01 (notices). The verification badge must match VER-02's state. Notes must never appear on CHAT-02 or PROF-01.

### 12. Completion Criteria

- [ ] Per-occupant compatibility block with at least 2 drivers renders correctly
- [ ] Timeline, owner-only notes, and the compare tray all function
- [ ] Select requires confirmation and completes the transactional fill cascade (R-09)
- [ ] Decline applies the polite notice + 90-day cooldown (EC-08)
- [ ] Compare caps at 3 with an explained limit; notes never leave this screen; stage moves idempotent (EC-26)

---

## OWN-06 — Owner Profile (Edit)

### 1. Purpose

The owner's trust surface: who they are, what they own, how their household lives, and how they respond — maintained here, rendered identically everywhere seekers judge them.

### 2. User Context

An owner tidying up how they appear to seekers — adding a property, updating household norms after a lifestyle change, checking verification or response tier. Sections save independently so small edits stay quick.

### 3. Entry Points

- Owner bottom-nav "Profile" tab

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  "Owner profile" · ⋯ (Settings -> ACCT-01)
HEADER:  photo · name · member-since · badge row (C-06) incl. "Owner verified" with date
OWNER TYPE:  owner-flatmate / landlord (from ONB-02)
PROPERTIES:  per property — locality · flat type · rooms (listed) · [Edit] · [+ Add property]
HOUSEHOLD LIFESTYLE (what seekers see):  ethical set — dietary ·
  smoking · pets · guests
RESPONSE-RATE TIER:  "You reply in ~4h — Top responder" (platform-computed)
VERIFICATION CARD:  tier + date · [Upgrade / Re-verify]
COMPLETENESS METER:  "Profile 90% complete — [finish]"
[ ( Preview as seeker ) ]  <- primary CTA
BOTTOM NAV (Profile active, owner shell)
----------------------------------------
```

### 5. Components

Sectional editor with per-section save; badge row (C-06); properties list with add/edit; lifestyle chip editor (ethical set only); response-rate meter (read-only); verification card; completeness meter; owner shell bottom nav.

### 6. Content

- Identity: photo, name, member-since, badge row with dates on tap ("Owner verified Oct 2025"). Properties: locality + flat type + rooms total/listed — the summary seekers see on owner cards.
- Household lifestyle: exactly the fields seekers see on listings — the ethical set, no exclusion phrasing (R-14).
- Response tier: platform-computed (rolling 30-day median); the Slow tier is visible here even though hidden from seeker cards. Verification card: tier + date, upgrade/re-verify path, 12-month expiry reminder (R-03).

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Edit any section | Sectional save; completeness meter updates | OWN-06 (updated) |
| Tap Add property | Property form; new property joins the list | OWN-06 (updated) |
| Tap Upgrade / Re-verify | Verification submission (owner variant) | VER-01 |
| Tap verification card | Verification status detail | VER-02 |
| Tap Preview as seeker | The exact public owner projection seekers see | PROF-03 (owner variant) |
| Tap ⋯ → Settings / edit household lifestyle | Account settings / saved; compatibility recomputes with a visible "matches updating" state (R-15) | ACCT-01 / OWN-06 (updated) |

### 8. Navigation

Tab root of the owner shell (Profile active). Preview, verification, and settings are pushes/sheets — back returns with all saved state intact. Mode switch (Both users) leaves to PROF-02 and returns via the same tab. No section is a dead end: each either saves in place or names its destination.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | All sections with current data + completeness meter | skeleton loading ≤300ms |
| Unverified | Verification card framed as "Verify to publish" | → VER-01 |
| Rejected verification / Cooling | Reason-coded fix guidance on the card (R-03) / 7-day cooling date shown | resubmit via VER-01 / re-verify after the date |
| Incomplete | Completeness meter names missing sections | [finish] deep-links to the section |
| Tier drop / Error | Honest meter update + improvement tip (R-30) / inline per-section retry, edits never lost | idempotent save |

### 10. Business / Functional Rules

1. Everything shown here is exactly what seekers see on owner cards and listing details — the preview must never diverge from the data (R-30).
2. The response-rate tier is computed by the platform, never self-declared or editable.
3. Household lifestyle accepts only the limited ethical set; no exclusion language (R-14).
4. The badge row follows C-06: icon + text, dates on tap, absence renders nothing (no "unverified" scarlet letter). Sectional save: one section failing never blocks another.

### 11. Cross-Screen Dependencies

This profile is the source of truth rendered on ROOM-01's owner section, owner cards, and PROF-03's owner-variant preview — zero contradiction allowed. The badge row must match VER-02's verification state; the response tier must equal HOME-02's meter and the seeker-visible tier. Household lifestyle edits must recompute the household compatibility feeding OWN-04/OWN-05 and seeker-side scores (R-15). The properties list must agree with OWN-02's listings (a listed room shows as listed).

### 12. Completion Criteria

- [ ] All sections render with sectional save; completeness meter works
- [ ] Badge row includes Owner-verified with date; C-06 rules honored
- [ ] Response tier is honest and platform-computed; tier drops state truthfully
- [ ] Lifestyle editor is limited to the ethical set (R-14)
- [ ] Preview as seeker renders the exact public projection; verification states all correct

## ACCT-01 — Settings

### 1. Purpose

The account hub: every control not part of daily usage — identity, roles, verification, notifications, privacy, legal, support, and account exit — lives here and only here.

### 2. User Context

Any authenticated user in either mode reaches this screen from their profile to change account-level facts (phone number, roles) or to reach the one canonical entry point of each control surface. They already know what they want to change; the screen must put every account-level control within two taps, with no duplicate homes anywhere else.

### 3. Entry Points

- Overflow (⋯) menu on the seeker profile screen (PROF-02)
- Overflow (⋯) menu on the owner profile screen (OWN-06)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · "Settings"
----------------------------------------
ACCOUNT:  phone (masked) · [Change → re-OTP flow]
          email — "coming in a later release" (honest, inert)
ROLES:    current modes (Seeking / Offering) · [Add other mode → AUTH-04]
VERIFICATION:  tier chip · [Manage → VER-02]
NOTIFICATIONS → NOTIF-02         PRIVACY & VISIBILITY → ACCT-02
LANGUAGE:  English (locked) — "more soon" (no fake selector)
LEGAL:  Terms of Service · Privacy Policy (versioned)
SUPPORT → ACCT-03
DANGER ZONE (set apart, last):
          Deactivate or delete account → ACCT-04
----------------------------------------
(no bottom nav — push screen)
```

### 5. Components

Sectioned static list; masked account values; role-add row; disabled rows with honest reasons; danger zone grouped apart from normal rows.

### 6. Content

- Account facts as they are: masked phone, role modes held, current verification tier.
- One row per control surface — every account-level control has exactly one home.
- Legal entries show their version so the user knows what they accepted.
- Danger zone states its consequence in-line ("pause or leave NestMate").

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap "Change" on phone | Starts dual-OTP verification (old number, then new); on success the number updates and all other sessions are revoked; never creates a duplicate account (EC-02) | OTP re-verification step → back to ACCT-01 (updated) |
| Tap "Add owner / seeker mode" | Role selection opens in the upgrade variant — no re-signup; the switch never touches active chats or drafts (EC-25) | AUTH-04 |
| Tap Verification row | Opens verification status; the tier chip here mirrors it | VER-02 |
| Tap Notifications / Privacy / Support rows | Navigate to each control's single home | NOTIF-02 / ACCT-02 / ACCT-03 |
| Tap Terms or Privacy Policy | Opens the versioned document; closing returns here | ACCT-01 |
| Tap "Deactivate or delete account" | Opens the exit screen with both paths | ACCT-04 |

### 8. Navigation

Back returns to the profile screen the user came from (per mode). No bottom nav. Individual sections have no deep links — the rows are the only paths. If the account was deleted after its grace period, this screen is unreachable: the signup screen shows the "account deleted" notice instead.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | All sections rendered with current account facts | — |
| Loading | Section skeleton; account facts populate in place | ≤300ms perceived |
| Disabled | Language and email rows render inert with honest reasons ("more soon" / "coming later") | Never selectable |
| Error (phone change fails) | Inline, actionable message; existing number unchanged; retry idempotent | No data loss |

### 10. Business / Functional Rules

1. One home per control — no account-level setting appears on any other screen (R-28). 2. Language is locked to English with an honest "more soon" (R-26). 3. Changing the phone number requires proving both the old and the new number and revokes all other sessions; it can never fork a second account (EC-02). 4. Adding a mode uses the upgrade path — never re-signup (EC-25). 5. Rows reflect live account state — a revoked verification tier is reflected the moment it changes.

### 11. Cross-Screen Dependencies

The tier chip must always equal the state rendered by VER-02 (one verification state machine). Role rows must agree with the mode chip and shells (HOME-01 / HOME-02), and the AUTH-04 upgrade variant must carry "add mode" intent, not new-account intent. A phone change must propagate to every masked rendering (profiles, chat headers, owner surfaces). Exit behavior is owned by ACCT-04 and governs this screen's availability.

### 12. Completion Criteria

- [ ] Every account-level control reachable within two taps from here — and nowhere else
- [ ] Phone change runs dual-OTP, revokes other sessions, never duplicates the account (EC-02)
- [ ] Role add uses the AUTH-04 upgrade variant without data loss (EC-25)
- [ ] Disabled rows (language, email) are honest and inert
- [ ] Tier chip matches VER-02 at all times

## ACCT-02 — Privacy & Visibility Controls

### 1. Purpose

User-owned privacy: decide exactly how exposed the profile is — photo, name, each lifestyle attribute, discovery presence, activity signal — and see the consequence of every choice inline, before and after it is made.

### 2. User Context

A user who wants to control visibility arrives from Settings or from their public preview, usually after seeing how much of themselves strangers can view. They must be able to make themselves as private as they wish without breaking active connections — and verify the result instantly.

### 3. Entry Points

- ACCT-01 (Privacy & visibility row)
- PROF-03 (Profile Public Preview — "Adjust visibility")

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · "Privacy & visibility" · [Live preview → PROF-03]
----------------------------------------
PHOTO:      (·) Everyone on NestMate (authenticated only)
            ( ) Connections only   ( ) Blurred until connect (default safe)
NAME:       (·) First name only    ( ) Initials
LIFESTYLE:  per-attribute visibility selector for each of the
            10 attributes (everyone / connections / private)
            — must-haves always APPLY; hiding one only hides
            its display, never its filtering effect
DISCOVERY:  [x] Appear in Flatmate Discovery
            off = excluded from the feed; still reachable via
            direct link and your listings
ACTIVE STATUS:  [x] Show "active recently" (day granularity only)
Every control: one-line consequence · changes auto-save
----------------------------------------
(no bottom nav — push screen)
```

### 5. Components

Segmented controls; per-attribute visibility selectors; consequence microcopy under every control; live-preview link; auto-save behavior (no save button).

### 6. Content

- Each control states its exact effect in one line — no jargon, no surprises.
- The discovery opt-out is explained honestly: leaving the feed does not make the user invisible.
- Must-have attributes carry the standing note: they keep filtering matches even when hidden from display.
- The photo default (blurred until connect) is shown as the safe starting point.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Change any control | Saved instantly; every surface rendering that data updates | Stay (the control itself confirms) |
| Turn discovery off while requests are pending | Pending requests remain pending — opt-out never cancels in-flight state | Stay |
| Hide a must-have attribute | Display hidden; the must-have continues to apply as a filter | Stay |
| Tap "Live preview" | Opens the public preview rendering with the new settings applied | PROF-03 |
| Tap back | Returns to the origin; all changes already saved | ACCT-01 / PROF-03 |

### 8. Navigation

Back returns to the entry screen (ACCT-01 or PROF-03). No bottom nav. There is no separate save step — leaving never loses a change. The preview link goes to PROF-03 and returns with settings unchanged.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | All controls with current values + consequence lines | — |
| Loading | Control skeleton | ≤300ms perceived |
| Error (auto-save fails) | Inline "change not saved — retry"; control shows last saved value; intent preserved | Idempotent retry |

### 10. Business / Functional Rules

1. One control set governs every rendering of the affected data — cards, feeds, profile detail, chat headers; changing it here changes it everywhere at once. 2. Must-haves are hard filters applied before ranking; hiding one changes display only, never filtering (R-13). 3. Discovery opt-out excludes the user from the flatmate feed but keeps them reachable via direct profile links and their listings. 4. Turning discovery off never cancels pending requests. 5. Active status is fuzzy to day granularity — never a precise "last seen" time. 6. The preview renders through the same projection as real surfaces — what the user previews is exactly what others see (R-30).

### 11. Cross-Screen Dependencies

These controls feed DISC-03 (feed inclusion), PROF-01 (photo / name / attribute rendering), CHAT-02 (header photo and name), owner applicant views (OWN-04 / OWN-05), and PROF-03 (preview). The preview must use the identical projection as those surfaces — a mismatch is a defect. Pending-request state on CONN-01 must be unaffected by the discovery toggle.

### 12. Completion Criteria

- [ ] Every control shows its consequence inline and auto-saves
- [ ] Changes re-project on all consuming surfaces (feed, profile, chat header, preview) consistently
- [ ] Must-haves keep filtering while hidden from display
- [ ] Discovery opt-out preserves pending requests
- [ ] Preview (PROF-03) matches real renderings exactly

## ACCT-03 — Help & Support

### 1. Purpose

Self-serve answers first, human fallback always: the questions that actually occur, answered consistently with the trust and safety content, plus a routed contact form with a guaranteed confirmation.

### 2. User Context

A user is confused about verification, freshness, deposits, reveal, or reports — or stuck in an error state — and arrives from Settings, a footer link, or an inline help link. They want an answer in under a minute; if they cannot get one, they must be able to reach a human and see proof their message was received.

### 3. Entry Points

- ACCT-01 (Help & support row)
- Footer link on public screens (PUB-01, PUB-04)
- Support links embedded in error and locked states (OTP lockout in AUTH-03, verification cooling in VER-02, frozen chat in CHAT-02)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · "Help & support"
----------------------------------------
SEARCH HELP (narrows topics as typed)
FAQ TOPICS (accordion, seeded from trust/safety content):
  Verification — documents, timelines, rejections, cooling
  Freshness — what "confirmed X days ago" means; renewals
  Deposits & payments — what is safe; what NestMate never does
  Contact reveal — how mutual-consent sharing works
  Reports & blocks — what happens after you report
  Account — phone change, roles, deactivation, deletion
EMERGENCY BAND:  honest statement — NestMate cannot respond to
  emergencies live · police and cybercrime pointers → SAFE-01
CONTACT FORM:  topic picker · message · [ Send ]   (primary CTA)
----------------------------------------
(no bottom nav — push screen)
```

### 5. Components

Search field; FAQ accordion; emergency band; topic-picker contact form with send and confirmation.

### 6. Content

- FAQ answers are the real operational facts: review SLAs, the 14-day deletion grace, why documents are never shared, what a report triggers (EC-03, EC-07, R-22, R-27).
- Answers must not contradict the Trust & Safety Center (PUB-04) or the authenticated Safety Center (SAFE-01) — one content source, three renderings.
- The emergency band states plainly what the platform cannot do and where to go instead.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap a topic (or search) | Answer expands inline; search narrows topics as typed | Stay |
| Tap "Send" on the contact form | Ticket created and routed to the monitored support inbox; visible confirmation with what happens next | Stay (confirmation state) |
| Tap the emergency band | Opens the safety center with emergency guidance | SAFE-01 |
| Tap back | Returns to origin; nothing to save | Origin screen |

### 8. Navigation

Back returns to the entry point (Settings, the public screen whose footer linked here, or the error state that linked here). No bottom nav. Topics open in place — no per-answer routing required.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Topics + emergency band + contact form | — |
| Loading | Topic skeleton | ≤300ms perceived |
| Success (ticket sent) | Confirmation with expectation ("we reply on this account") | Form resets; topics remain browsable |
| Error (send fails) | Inline, non-destructive; message text preserved; idempotent retry | No dead end — retry or keep browsing |

### 10. Business / Functional Rules

1. Answers never contradict the public or authenticated safety centers — single content source (R-30). 2. Every ticket receives a visible confirmation; silence is a defect. 3. Tickets route to a monitored inbox at this stage of the product. 4. The emergency band never implies in-app emergency response. 5. The form requires a topic so safety-relevant tickets are recognized and prioritized on arrival.

### 11. Cross-Screen Dependencies

Content parity with PUB-04 and SAFE-01 is mandatory. Error states that deep-link here (AUTH-03 lockout, VER-02 cooling, CHAT-02 frozen threads, upload failures in VER-01 / SAFE-02) should land with the relevant topic pre-expanded. The emergency band duplicates SAFE-01's emergency guidance exactly. Appeals from enforcement status screens arrive as tickets here and are routed for human review (R-24).

### 12. Completion Criteria

- [ ] All six topic groups present, answers consistent with PUB-04 / SAFE-01
- [ ] Ticket send → confirmation; failure is non-destructive and retryable
- [ ] Emergency band links to SAFE-01 with identical guidance
- [ ] Support links from error states open the relevant topic
- [ ] No dead end: every state has a next action

## ACCT-04 — Account Deactivation / Deletion

### 1. Purpose

A dignified exit: pause (fully reversible) or leave (with a grace period and honest data-retention facts), with the consequences of each path stated before the user commits.

### 2. User Context

A user has decided to step back or leave, or is reacting to a bad experience. They arrive only from the Settings danger zone. The screen must present both paths, their exact consequences, and softer alternatives — and never hide what happens to their data.

### 3. Entry Points

- ACCT-01 danger zone ("Deactivate or delete account")

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  back · "Deactivate or delete"
----------------------------------------
PATH 1 — DEACTIVATE:
  hides profile + listings · freezes connections · reversible:
  logging back in restores everything exactly   [ Deactivate ]
PATH 2 — DELETE:
  14-day grace · then personal data erased/anonymized ·
  irreversible after grace · logging in during grace cancels it
  [ Request deletion ]
RETENTION SUMMARY:  what is kept, what is erased, when — messages
  anonymized for counterparties after 30 days; active safety
  cases keep the data they need (legal hold)
ALTERNATIVES (offered first):  "Just want fewer distractions?" → turn off discovery (ACCT-02)
Both actions: confirm dialog + one-tap reason survey
----------------------------------------
(no bottom nav — push screen)
```

### 5. Components

Two-path explainer cards; retention summary; confirm dialog; reason survey; alternative-path link.

### 6. Content

- Exact consequences of each path in plain words, before any confirmation.
- The 14-day deletion grace: when it starts, how to cancel it, what happens at its end.
- Retention summary: what is erased, what is anonymized, what survives for counterparties.
- The softer alternative (discovery opt-out) offered before destructive paths are chosen.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap "Deactivate" → confirm | Account hidden (profile + listings), connections frozen; user logged out; logging in later restores the exact prior state — freshness re-validated, expired listings stay expired (EC-23) | Logged out (reactivation via AUTH-02) |
| Tap "Request deletion" → confirm | 14-day grace starts; user logged out; logging in during grace cancels the deletion and restores the account | Logged out (grace pending) |
| Complete the reason survey | One-tap reason recorded with the action (product-learning signal, never shown to others) | Completes the chosen path |
| Request deletion during an active safety case | Notice explains the case keeps the data it needs (legal hold); deletion still proceeds after confirm | Notice → confirm → logged out |
| Tap "Turn off discovery" | Opens privacy controls with discovery context | ACCT-02 |

### 8. Navigation

Back returns to ACCT-01. No bottom nav. After either confirmed path the user is logged out; reactivation is via login (AUTH-02). After the grace period ends, the signup screen (AUTH-01) shows the "account deleted" notice — there is no path back to this screen.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Both paths + retention summary + alternative | — |
| Pending (deletion requested) | On any login attempt: days remaining + [Cancel deletion and restore my account] | Login during grace cancels |
| Restricted (legal hold) | Pre-confirm notice: an active safety case keeps required data even after deletion | Deletion proceeds; case unaffected |
| Success (either path) | Confirm → reason survey → logged out with a plain statement of what just happened | Never a silent logout |

### 10. Business / Functional Rules

1. Deactivation is always reversible with exact state restoration — connections frozen, not lost; expired listings stay expired after re-validation (EC-23, R-27). 2. Deletion always has a 14-day grace; logging in during grace cancels it; after grace, personal data is erased or anonymized and the action is irreversible (R-27). 3. Counterparties keep chat history minus the deleted user's identity; content is anonymized after 30 days (EC-13). 4. Active safety cases outlive deletion — required data is preserved for the case (legal hold). 5. Both paths require explicit confirmation plus a reason; nothing destructive is one tap. 6. Every consequence shown must be true — no hidden retention (R-30).

### 11. Cross-Screen Dependencies

Reactivation logic lives behind AUTH-02 and must restore exactly what HOME-01 / HOME-02, OWN-02, CONN-01 and CHAT-01 render. Deactivation must hide listings from PUB-02 / PUB-03 / DISC-01 and freeze (not delete) connection and chat state. The post-grace deletion notice is owned by AUTH-01. Legal-hold preservation must remain visible to the admin side (ADM-07) as a continuing case. The alternative path lands on ACCT-02 with discovery context pre-selected.

### 12. Completion Criteria

- [ ] Both paths state exact consequences before confirmation
- [ ] Deactivate → login restores exact prior state (EC-23); expired stays expired
- [ ] Deletion: 14-day grace, login cancels, PII erased after grace (R-27)
- [ ] Legal-hold notice renders when an active safety case exists
- [ ] Reason survey records with every confirmed action; post-grace notice shows on signup

## ADM-01 — Admin Login

### 1. Purpose

Hardened entry to the internal operations console: the only door to every admin screen, locked down because it guards trust decisions over real people.

### 2. User Context

One of at most two founding-team admins arrives at the direct admin URL. They must prove identity with two factors before touching any queue. Nobody else — and no path from the public product — may reach this screen or learn of it.

### 3. Entry Points

- Direct admin URL, typed or bookmarked — never linked from any public or product surface; excluded from search indexing

### 4. Functional Wireframe

```text
----------------------------------------
DESKTOP FORM (no product funnel, no self-signup):
  Title:  NestMate Admin
  EMAIL       [ ________ ]
  PASSWORD    [ ________ ]
  AUTHENTICATOR CODE (TOTP)
              [ 6 digits ]        <- mandatory second factor
  [ Sign in ]                       (primary CTA)
  Lockout note:  5 failed attempts → 30-minute lock ·
  no reset without the second factor
----------------------------------------
(separate session realm — none of the public or user shells)
```

### 5. Components

Credential form; TOTP step; lockout message. No signup link, no password-reset shortcut, no product marketing funnel.

### 6. Content

- Minimum viable: two credential fields, one code field, sign-in, and the lockout rule.
- No marketing content, no app links, no support funnel — this screen is not an on-ramp to anything else.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Submit valid email + password + TOTP code | Admin session opens in the separate realm (short, fixed lifetime); the attempt is audit-logged | ADM-02 |
| Submit wrong credentials or code | Inline error naming the failing step; attempt count increments | Stay |
| Fail 5 times | 30-minute lock; an internal alert is raised; the lock is audit-logged | Restricted (lock state) |
| Seek password reset without the second factor | Not offered — reset is impossible from this screen | Stay (inert) |

### 8. Navigation

Forward goes to ADM-02 only — there is no other destination. Admin sessions time out after a short fixed period; expiry lands back here for re-authentication, then returns the admin to the screen they were on. Deep links into admin screens without a valid session always resolve here.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Empty credential + code form | — |
| Loading | Submit disabled; entered values retained | ≤300ms perceived |
| Error | Inline message naming the failing factor | Values preserved; attempt counted |
| Restricted | Lock message with remaining lock time | Sign-in inert until the lock expires |
| Expired | Neutral re-auth prompt (arrived from any admin screen) | Prior admin screen reopens after success |

### 10. Business / Functional Rules

1. At most two admin accounts exist; there is no self-signup. 2. Two factors are always required — password plus authenticator code; no SMS fallback. 3. Five failed attempts lock the screen for 30 minutes and raise an alert. 4. The admin session is a separate realm from the user product: a user session never grants admin access and vice versa. 5. Every login attempt — success or failure — is audit-logged with actor and outcome (R-25). 6. This screen is unreachable from the public product and excluded from search indexing.

### 11. Cross-Screen Dependencies

Sole gate to ADM-02 and, through it, all admin screens (ADM-03 … ADM-09). Session expiry must return the admin here from any admin screen and restore their destination on success. Its audit entries feed the audit tail on ADM-02. It has no dependency on, or visibility from, any user-facing screen — the separation is itself the requirement.

### 12. Completion Criteria

- [ ] Only the two designated admins can enter; everyone else gets nothing
- [ ] TOTP second factor mandatory; no SMS fallback; lockout after 5 failures
- [ ] Admin session is a separate realm with a short fixed lifetime; expiry re-auths cleanly
- [ ] Every attempt is audit-logged and visible in the ADM-02 audit tail
- [ ] Unlinked, noindex, and walled off from all public navigation

## ADM-02 — Admin Dashboard

### 1. Purpose

Queue-first operations command: the single glance that tells the founder what needs action now, ordered by SLA risk — never a vanity dashboard.

### 2. User Context

An admin signs in daily, usually with ten minutes. They must see every queue that can breach an SLA, the platform's health at a glance, and what the other admin did recently — then jump into the highest-risk queue in one tap.

### 3. Entry Points

- ADM-01 success (the console's default landing screen)

### 4. Functional Wireframe

```text
----------------------------------------
TOP BAR:  "NestMate Admin" · signed-in admin · [Sign out]
LEFT RAIL (persistent on all admin screens):
  QUEUES:  Verifications · Reports · Flags
  USERS ·  METRICS (V1) ·  AUDIT TAIL (recent entries)
----------------------------------------
QUEUE CARDS (breaching SLAs render loud and sort first):
  VERIFICATIONS:  pending count · oldest case age · breach flag
  REPORTS:  count by severity (S1 safety · S2 fraud · S3 conduct)
            · SLA-breach count
  MODERATION FLAGS:  auto-flags · duplicates · reported · samples
  USERS:  suspensions pending review
HEALTH STRIP:  active listings · freshness share ·
               median first response · fills · report rate
RECENT ADMIN ACTIONS:  audit tail (who · what · object · when)
----------------------------------------
```

### 5. Components

Persistent left rail; queue cards with age and SLA-breach flags; health strip; audit-tail list. Every card is a navigation affordance, not a report.

### 6. Content

- Each queue card: live pending counts, the age of the oldest item, and a breach flag when an SLA is exceeded.
- Health strip: the same marketplace-health numbers the business reads weekly — real data only.
- Audit tail: the most recent admin actions across all queues — actor, action, object, timestamp.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap the Verifications card | Opens the verification review queue | ADM-03 |
| Tap the Flags card | Opens the listing moderation queue | ADM-05 |
| Tap the Reports card | Opens the report queue | ADM-07 |
| Tap the Users card (or a suspension item) | Opens user management | ADM-08 |
| Tap the Metrics rail item | Opens platform metrics (V1 surface) | ADM-09 |
| Tap Sign out | Ends the admin session (audited) | ADM-01 |

### 8. Navigation

The left rail is persistent on every admin screen and always offers every queue — the admin is never more than one tap from any queue or from this dashboard. No bottom nav (desktop console). Deep links into admin screens require a valid session and resolve through ADM-01 otherwise; signing out always lands on ADM-01.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | All four queue cards + health strip + audit tail | Breaching items sort first |
| Loading | Card skeletons; rail renders immediately | ≤300ms perceived |
| Empty | Honest "all clear" per queue card (zero pending, no breach) | Never blank; a zero is a fact, not an absence |
| Error (one queue count fails) | That card shows a retry state; all other cards render normally | Dashboard never blocks on one failing count |

### 10. Business / Functional Rules

1. Queue-first: everything the admin must act on is a card with a count and an age; vanity metrics do not appear here (they live on ADM-09). 2. SLA breaches (verification >24h; S1/S2 reports >12h; S3 reports >48h) render prominently and sort first (R-03, R-22). 3. Queue counts must match the destination queues exactly — a stale count is a defect. 4. Health numbers are real data only; fabricated numbers are a defect (R-30). 5. Every admin action anywhere in the console writes an audit entry; this screen surfaces them (R-25).

### 11. Cross-Screen Dependencies

Counts are drawn from the same state behind ADM-03 (pending verifications), ADM-05 (open moderation cases), ADM-07 (open reports) and ADM-08 (suspensions) — one source, zero drift. The health strip must agree with ADM-09's marketplace-health group (same definitions). The audit tail renders the same log every admin action writes. Breach flags derive from the SLA clocks rendered on ADM-03 / ADM-05 / ADM-07.

### 12. Completion Criteria

- [ ] Four queue cards + health strip + audit tail render with live, accurate counts
- [ ] Breaching SLAs are visually loud and sort first
- [ ] Counts match destination queues exactly
- [ ] "All clear" empty states render per queue
- [ ] Every admin action everywhere is traceable in the audit tail

## ADM-03 — Verification Review Queue

### 1. Purpose

The queue side of human verification review: every pending T2/T3 case, ordered so the most SLA-at-risk case is always first, with the facts that pace the decision.

### 2. User Context

An admin working the verification SLA (under 24 hours) opens this queue from the dashboard. They scan age, tier, document type and history to pick the next case — usually the oldest or the breach — and open it. Prioritization must cost zero effort.

### 3. Entry Points

- ADM-02 Verifications card
- ADM-02 left rail ("Verifications")
- Return from ADM-04 after every decision

### 4. Functional Wireframe

```text
----------------------------------------
HEADER:  "Verifications" · pending count
FILTERS:  [Age] [Tier (T2/T3)] [Doc type]
----------------------------------------
QUEUE TABLE (ordered oldest-first; age shows SLA stage):
  COLUMNS:  applicant · tier requested · document type ·
            submitted age (safe / nearing / breached) ·
            owner flag (T3) · prior rejections count · [Open]
  BREACHED ROWS:  rendered loud, grouped on top
  Row → ADM-04
----------------------------------------
(desktop console · left rail persistent)
```

### 5. Components

Filterable queue table; SLA-stage indication on the age column; prior-rejection counts; row navigation to the case detail.

### 6. Content

- Per row: who applied, which tier they seek (T2 identity / T3 ownership), which document type, how long it has waited, whether it is an owner case, and how many times it was rejected before.
- Filters narrow by age band, tier, and document type; the pending count always reflects the current filter.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Click a row (or Open) | Case opens with full evidence and checklist | ADM-04 |
| Apply a filter (age / tier / type) | Queue narrows; counts update | Stay |
| Clear filters | Full queue returns, oldest first | Stay |
| Return from a decided case | Row leaves the queue; count decrements | Stay (queue refreshed) |

### 8. Navigation

Entered from ADM-02; every row leads to ADM-04; every decision returns here with the row resolved. The left rail allows jumping to any other queue without losing filter state. Browser back from ADM-04 restores the same filtered view. No bottom nav (desktop console).

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Table of pending cases, oldest first, SLA-stage ages | — |
| Loading | Table skeleton; filters render immediately | ≤300ms perceived |
| Empty | "All clear — no verifications waiting" + last-reviewed time | A zero is a success state, not a blank |
| Error (cases fail to load) | Retry message; filters remain usable | No dead end |

### 10. Business / Functional Rules

1. Queue order is oldest-first; SLA-breached cases (over 24h) auto-prioritize to the top, render loud, and raise an internal alert (R-03, EC-04). 2. Counts shown here must equal the dashboard's verification card exactly. 3. Every pending case is human-reviewed — nothing auto-approves; this queue is the only path to a decision (R-03). 4. Prior rejections are visible so the reviewer applies the two-rejection cooling rule consistently (EC-07). 5. The queue shows only pending work — decided cases leave immediately.

### 11. Cross-Screen Dependencies

Feeds and is fed by ADM-04 (one case opened at a time; decisions return here). Counts share one source with ADM-02. A breach here corresponds to the apology banner the user sees on VER-02 (EC-04). Escalations from ADM-04 (suspected fraud) hand off to ADM-07 / ADM-08 while this queue drops the case from pending.

### 12. Completion Criteria

- [ ] Rows show tier, doc type, age, owner flag, prior rejections
- [ ] Oldest-first order with loud breach grouping and auto-prioritization (EC-04)
- [ ] Filters narrow by age/tier/type without breaking counts
- [ ] Row → ADM-04 → decision → back, with the row resolved
- [ ] Counts match ADM-02 exactly; empty state is honest

## ADM-04 — Verification Case Detail

### 1. Purpose

Checklist-driven review of one verification case and the decision that ends it: all evidence side-by-side, an explicit checklist, and a reason-mandatory decision panel.

### 2. User Context

The reviewer has one case open, usually against a clock. They compare documents, selfie and (for T3) ownership proof, walk the checklist, and record exactly one decision. The screen must make the decision fast, evidence-based, consistent and traceable — and mirror its result to the user instantly.

### 3. Entry Points

- ADM-03 row click (the only path to a case)

### 4. Functional Wireframe

```text
----------------------------------------
HEADER:  "Verification case" · applicant · tier sought · case age + SLA status
----------------------------------------
EVIDENCE (side-by-side, restricted viewer): document images ·
  live selfie · ownership proof (T3: name + address vs locality)
  — viewable only here, watermarked, zoomable; every view audited
CHECKLIST (explicit, per case type):
  [ ] name consistent across documents + selfie + profile
  [ ] face similarity (human judgment, zoom)
  [ ] document authenticity cues (quality / template sanity)
  [ ] ownership name + locality match (T3 only)
  [ ] no duplicate images vs prior verifications
DECISION PANEL (one decision per case):
  [ Approve ]  [ Reject (reason) ]  [ Request resubmission ]
  + mandatory note · suspicious-pattern → escalate
----------------------------------------
(desktop console · left rail persistent)
```

### 5. Components

Watermarked restricted image viewer with zoom; explicit checklist; decision panel with fixed reason sets and a mandatory note field.

### 6. Content

- All evidence for the case, side-by-side, zoomable — never a raw download.
- The checklist as explicit steps matching the case's tier.
- Decision reasons from a fixed, user-readable set; every reason pairs with the fix the user will see.
- Owner context (T3): the listing locality the proof must match.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap Approve (+ note) | Badges granted (B-3 / B-4), profile re-ranked, user notified with the outcome | ADM-03 (case resolved) |
| Tap Reject, pick reason (+ note) | User sees the reason + the fix; a second rejection starts a 7-day cooling period with the date shown (EC-07) | ADM-03 (case resolved) |
| Tap Request resubmission (+ note) | User is told exactly what to fix; the case re-enters the queue when they resubmit | ADM-03 |
| Flag a suspicious pattern | Escalates to the fraud checklist — an enforcement matter, not a normal rejection | ADM-07 (fraud path) / ADM-08 |
| View an evidence image | Image loads in the watermarked restricted viewer; the view is audit-logged | Stay |

### 8. Navigation

Entered only from ADM-03; after a decision the reviewer returns there and the case is locked. Failed image loads re-fetch on demand without losing checklist state. Browser back mid-review keeps the case open and undecided. Leaving without deciding is allowed — the case stays pending in the queue.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Evidence + checklist + decision panel | — |
| Loading | Case skeleton; header facts first | ≤300ms perceived |
| Error (image fails) | Inline retry on the affected image; checklist state preserved | Idempotent re-fetch |
| Restricted | Decision locked after submit — the recorded decision shows read-only | One decision per case, ever |

### 10. Business / Functional Rules

1. One decision per case; reason and note are mandatory and fully audited (R-03, R-25). 2. Documents are viewed only through the watermarked restricted viewer — never raw, never exportable (R-25). 3. Rejection reasons come from the fixed set, each mapping to a user-facing fix; suspected fraud escalates instead of rejecting (R-03). 4. A second rejection starts the user's 7-day cooling period with the date shown (EC-07). 5. The user-visible status must mirror the recorded decision the moment it is made. 6. Evidence is retained only for the appeal window after the decision, then deleted — the decision record and badge state persist (R-03).

### 11. Cross-Screen Dependencies

The decision writes the state VER-02 renders (approved / rejected / resubmission / cooling) and the badge state (B-3 / B-4) shown on every profile and listing surface. Approvals re-rank the affected profile across DISC-03 and owner applicant views. Escalations jump to ADM-08 (account enforcement) or ADM-07 (fraud case). The case's age feeds the SLA clock on ADM-03 and the breach flag on ADM-02.

### 12. Completion Criteria

- [ ] Evidence renders side-by-side in a watermarked restricted viewer; views audited
- [ ] Checklist items match the case tier (T3 items only on T3 cases)
- [ ] All three decisions work; reason + note mandatory; one decision per case
- [ ] Second rejection triggers 7-day cooling (EC-07); fraud escalates instead
- [ ] User-side status and badges mirror the decision immediately

## ADM-05 — Listing Moderation Queue

### 1. Purpose

Inventory quality control on the queue side: every listing that pattern-matches a quality problem — auto-flags, duplicates, reports, and a random sample of clean publishes — so none of them skip human eyes.

### 2. User Context

An admin triaging listing quality opens this queue to see why each listing is here, whose it is, and how long it has waited. Most items resolve in seconds (clean sample, minor flag); the queue must make that triage fast while keeping duplicates and contact-leaks away from seekers.

### 3. Entry Points

- ADM-02 Flags card
- ADM-02 left rail ("Flags")

### 4. Functional Wireframe

```text
----------------------------------------
HEADER:  "Moderation" · open count
FILTERS:  [Source] [Age]
SOURCE LEGEND:
  auto-flags (contact-info patterns · price outliers · image reuse)
  duplicates · reported listings · random sample of publishes
----------------------------------------
QUEUE TABLE:
  COLUMNS:  listing (title + locality) · reason (source tag) ·
            owner tier · case age · [Open]
  DUPLICATE CASES:  linked to their sibling cases
  Row → ADM-06
----------------------------------------
(desktop console · left rail persistent)
```

### 5. Components

Source-tagged queue table; reason tags; duplicate-sibling links; filters by source and age.

### 6. Content

- Per row: which listing, why it is here (the matched pattern or the report), the owner's tier, and the case age.
- The source legend explains each source — including that a percentage of clean publishes is sampled on purpose.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Click a row (or Open) | Case opens with the public rendering and evidence | ADM-06 |
| Filter by source or age | Queue narrows; counts update | Stay |
| Open a duplicate's sibling | The linked sibling case opens from the row | ADM-06 (sibling case) |
| Return from an actioned case | Row leaves the queue; count decrements | Stay (queue refreshed) |

### 8. Navigation

Entered from ADM-02; every row leads to ADM-06; every action returns here with the case resolved. The left rail allows jumping between queues. Browser back from ADM-06 restores the same filtered view. No bottom nav (desktop console).

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Source-tagged table, filters available | — |
| Loading | Table skeleton; legend renders immediately | ≤300ms perceived |
| Empty | "No moderation cases open" + legend retained | Sampling continues silently |
| Error (cases fail to load) | Retry message; legend + filters remain | No dead end |

### 10. Business / Functional Rules

1. Four sources feed the queue: auto-flags (contact-info patterns, price outliers, image reuse), duplicates, reported listings, and a random sample of publishes — clean listings are included on purpose as deterrence (R-10). 2. Duplicate cases link to their siblings so they resolve consistently (EC-11). 3. Queue order is by age; reported listings are labeled as such to the reviewer. 4. Nothing flagged resolves automatically — every case ends in a human action with a reason (R-25). 5. Counts match the ADM-02 flags card exactly.

### 11. Cross-Screen Dependencies

Feeds ADM-06 exclusively; counts share one source with ADM-02. The auto-flag detection that lands cases here also produces the "under review" state owners see on OWN-02 / OWN-03; resolving the case must clear that state. Reported listings arrive from user reports raised through SAFE-02. Actions on ADM-06 mutate what PUB-02 / DISC-01 / ROOM-01 render — the queue is the intake, the user surfaces are the consequence.

### 12. Completion Criteria

- [ ] All four source types land in the queue with correct tags
- [ ] Rows show reason, listing, owner tier, age; duplicates link siblings (EC-11)
- [ ] Filters work without breaking counts
- [ ] Row → ADM-06 → action → back, case resolved
- [ ] Counts match ADM-02; empty state honest

## ADM-06 — Listing Moderation Detail

### 1. Purpose

Review one flagged listing exactly as the public would see it, see the evidence for the flag, and act — with an outcome that explains itself to the owner.

### 2. User Context

The reviewer has one moderation case open: a contact-leak, a price outlier, a duplicate, a report, or a clean sample. They must reproduce what seekers see, check the pattern evidence and the owner's history, and choose the proportionate action — approve, send back for edit, unlist, or remove with a strike.

### 3. Entry Points

- ADM-05 row click (the only path to a case)

### 4. Functional Wireframe

```text
----------------------------------------
HEADER:  "Moderation case" · listing · flag source · case age
----------------------------------------
LISTING RENDER:  exactly the public projection — what seekers
  see on the room detail · owner card beside it
EVIDENCE:  which pattern matched · the matching text/region ·
  previous flags and moderation history for this listing
OWNER CONTEXT:  tier · prior strikes · moderation history
ACTIONS (each records reason + note, audited):
  [ Approve ]  [ Require edit (note to owner) ]
  [ Unlist (reason) ]  [ Remove + strike owner ]
  strike ladder visible: removal + warning → 7-day suspension
  → third strike escalates to account-level review
----------------------------------------
(desktop console · left rail persistent)
```

### 5. Components

Public-projection render of the listing; evidence panel (pattern + matched text); owner history panel; action bar with per-action reason entry.

### 6. Content

- The listing exactly as seekers see it — same projection, same freshness stamp — so the reviewer judges the real thing.
- The specific evidence: which pattern matched and which text or image region triggered it.
- Owner context: verification tier, prior flags and strikes, prior moderation outcomes.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Tap Approve | Listing becomes active (if it was held pending review); owner notified | ADM-05 (case resolved) |
| Tap Require edit (+ note) | Owner sees the note and the fix; the listing stays unlisted until corrected and resubmitted | ADM-05 |
| Tap Unlist (reason) | Listing hidden from all search and feeds; owner notified with the reason and the fix | ADM-05 |
| Tap Remove + strike owner | Listing removed; a strike is recorded on the owner's visible ladder; a third strike escalates to account-level review | ADM-05 |
| Open the owner's account | Full user context for escalation decisions | ADM-08 |

### 8. Navigation

Entered only from ADM-05; every action returns there with the case locked. Browser back mid-review keeps the case open and undecided. The ADM-08 jump must offer a return path to this case. No bottom nav (desktop console).

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Public render + evidence + owner context + actions | — |
| Loading | Render skeleton; header facts first | ≤300ms perceived |
| Restricted | Action locked after submit — the recorded outcome shows read-only | One outcome per case |
| Error (render fails) | Evidence panel still renders; retry on the listing preview | Review never blocked by the preview alone |

### 10. Business / Functional Rules

1. Every action explains itself to the owner with a reason — silent moderation is a defect (R-25, R-30). 2. Strikes accumulate visibly per owner: removal + warning, then 7-day suspension, then escalation to account-level review (R-25). 3. Unlist is recoverable by the owner fixing the issue; Remove is not — the difference must be stated in the action's reason picker. 4. The reviewer sees the same public projection users see — never an internal-only version. 5. All actions are audited with actor, action, object and reason. 6. A reported-listing case that is really a user-safety matter moves to the report queue (ADM-07), not the strike ladder.

### 11. Cross-Screen Dependencies

The decision mutates the listing state rendered by PUB-02, PUB-03, DISC-01, ROOM-01 and the owner's OWN-02 / OWN-03 surfaces (active / pending / unlisted / removed with moderation note). Owner notifications mirror the action's reason. Strike counts shown here must equal the owner history on ADM-08. Escalations hand off to ADM-08 (account-level action) or ADM-07 (safety matters).

### 12. Completion Criteria

- [ ] Public render matches what seekers see in content, exactly
- [ ] Evidence shows pattern + matched text; owner history visible
- [ ] All four actions work with mandatory reasons; case locks after submit
- [ ] Owner sees the reason; strikes accumulate on a visible ladder
- [ ] Listing state changes propagate to all user-facing surfaces immediately

## ADM-07 — Report Queue & Case Management

### 1. Purpose

Safety and conduct resolution with severity SLAs and real closure: triage every report by severity, protect people while the case is open, end every case in a recorded disposition, and close the loop with the reporter.

### 2. User Context

An admin handling the most sensitive queue sees reports ranked by severity and SLA risk — threats and fraud first. For each case they need the full story (evidence, target context, the reported conversation) and the powers to protect and enforce. Every case must end in a disposition, and every reporter must hear that something happened.

### 3. Entry Points

- ADM-02 Reports card
- ADM-02 left rail ("Reports")

### 4. Functional Wireframe

```text
----------------------------------------
HEADER:  "Reports" · severity tab counts · SLA legend (S1 safety <12h · S2 fraud <12h · S3 conduct <48h)
----------------------------------------
QUEUE TABLE:  severity · reason · target (user / chat / listing) ·
             reporter count (pile-on) · age · [Open]
  BREACHED + PILE-ON ROWS:  rendered loud, sorted first
CASE VIEW (per report):  EVIDENCE: report text + attachments
  TARGET CONTEXT:  profile · tier · history · other cases
  CONVERSATION EXCERPT (chat-scoped; read-only; access audited)
  AUTO-PROTECTIONS:  [x] chat pair frozen  [x] listing unlisted (auto for safety classes; toggleable)
DISPOSITION (reason mandatory, audited):  [ Dismiss ] [ Warn ]
  [ Unlist content ] [ Remove content ]  [ Revoke verification ] [ Suspend 7/30d ] [ Ban ]
REPORTER NOTICE:  closure — outcome + action taken, never other-party details
----------------------------------------
(desktop console · left rail persistent)
```

### 5. Components

Severity queue with SLA timers; evidence and target-context panels; audited read-only conversation excerpt; auto-protection toggles; disposition bar with mandatory note; reporter closure template.

### 6. Content

- The full story per case: what was reported, how many independent reporters, about whom, and which protections are already active.
- The SLA clock per severity class, visible before the case is opened.
- Closure notice wording: outcome + action taken, explicitly without details about the other party.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Open a case | Evidence, context, conversation excerpt (audited) and current protections render | Stay (case view) |
| Toggle auto-protections | Applied or reversed immediately while the case stays open | Stay |
| Record a disposition (+ reason) | Case closes with the action executed; protections resolve consistently — a dismissal unfreezes the pair and re-lists what was wrongly unlisted (EC-27) | ADM-07 (queue) |
| Record Ban | Full enforcement cascade: listings unlisted, pipelines closed with notice, chats read-only, sessions revoked (R-24, EC-21) | ADM-07 (queue) |
| Confirm the reporter closure | Reporter receives the closure notice — outcome, no other-party details | Part of the disposition |
| Open the target's account | Full user context for escalation or account-level action | ADM-08 |

### 8. Navigation

Entered from ADM-02; the case view is inline (queue → case → queue) so triage stays fast. The left rail allows jumping to other queues; the ADM-08 jump must offer a return. Browser back returns to the queue at the same severity tab. No bottom nav (desktop console).

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Severity tabs + queue; inline case view per open report | SLA timers live |
| Loading | Queue skeleton; severity counts first | ≤300ms perceived |
| Empty | "No open reports — all clear" per severity tab | Zero is a fact, not a blank |
| Restricted | Protections active: the affected chat renders frozen, the listing unlisted — shown as case state, not error | Reversed cleanly on dismissal (EC-27) |
| Error (evidence fails) | Retry on the affected panel; disposition stays blocked until evidence renders | Never decide blind |

### 10. Business / Functional Rules

1. Severity classes with SLAs: S1 safety under 12h, S2 fraud under 12h, S3 conduct under 48h; breaches are loud here and on ADM-02 (R-22). 2. Safety-class cases auto-protect while pending — chat pair freeze, listing unlist — reversed cleanly if dismissed (R-23, EC-27). 3. Every case ends in a recorded disposition with a mandatory reason; every action is audited (R-22, R-25). 4. The reported user never sees report content — not in notices, not anywhere (R-25). 5. Duplicate and counter reports on the same pair merge into one case view; pile-on reporter counts are visible; a reporter deleting their account never kills the case (EC-09, EC-13). 6. Every closing disposition sends the reporter a closure notice with the outcome and action taken, never other-party details (R-22).

### 11. Cross-Screen Dependencies

Cases originate from SAFE-02 (and guest reports via PUB-03); the protections applied here must render identically on CHAT-02 (frozen read-only banner) and listing surfaces (unlisted state). Dispositions write the enforcement states ADM-08 manages and the user-side status screen with appeal (R-24). Closure notices ride the same notification system as NOTIF-01. A verification-revocation disposition strips the badge from all profile surfaces the moment it is recorded. SLA clocks feed the breach flags on ADM-02.

### 12. Completion Criteria

- [ ] Severity tabs with SLA legend; breach + pile-on rows loud and first
- [ ] Evidence + target context + audited conversation excerpt render per case
- [ ] Auto-protections apply on safety class and reverse cleanly on dismissal (EC-27)
- [ ] All seven dispositions execute their cascades; reason mandatory; all audited
- [ ] Reporter closure notice always sent; reported user never sees report content

## ADM-08 — User Management

### 1. Purpose

Account-level enforcement with full context: find any user, see everything relevant to a decision on one screen, and act with a reason — decisively, reversibly where appropriate, and always traceably.

### 2. User Context

An admin arrives either directly from the dashboard or from a case elsewhere (verification fraud, moderation escalation, report disposition) needing the whole picture of one user before enforcement. They must see roles, trust history, listings, connections, reports and prior admin actions — then act without switching screens.

### 3. Entry Points

- ADM-02 Users card (or a suspension item on it)
- ADM-02 left rail ("Users")
- Jump-to-user from case views: ADM-04 (fraud escalation), ADM-06 (strike escalation), ADM-07 (target context)

### 4. Functional Wireframe

```text
----------------------------------------
HEADER:  "Users" · search [phone / email / name / id] · [Search]
----------------------------------------
USER 360 (one panel, everything decision-relevant):
  roles (seeker / owner modes) · tier + verification history
  listings (with states) · connections count
  reports given / received · blocks · prior admin actions
ENFORCEMENT ACTIONS (each: reason + confirm, audited):
  [ Warn (user notified) ]  [ Suspend 7d ]  [ Suspend 30d ]
  [ Ban (permanent) ]  [ Reinstate ]
  [ Force re-verification ]  [ Revoke T3 only ]
CASCADE PREVIEW:  what each action will do, shown before confirm
----------------------------------------
(desktop console · left rail persistent)
```

### 5. Components

Universal search; user-360 panel; reason-mandatory action bar with confirmation; cascade preview per action.

### 6. Content

- The user's full operational picture: masked contact, both role modes, tier and verification history, all listings with their states, connection volume, reports given and received, blocks, and the complete history of prior admin actions.
- Each action's exact cascade (what becomes unlisted, frozen, revoked) shown before confirmation.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Search by phone / email / name / id | Matching users listed; selecting one loads the 360 panel | Stay |
| Suspend 7 / 30 days (+ reason) | Cascade: listings unlisted, chats read-only, sessions revoked; the user sees the status screen with appeal path (EC-20) | Stay (history updated) |
| Ban (+ reason) | Permanent cascade: everything suspension does, pipelines closed with notice, re-registration blocked (EC-21, R-24) | Stay (history updated) |
| Reinstate (+ reason) | Prior state restored where valid; the user regains access | Stay |
| Force re-verification (+ reason) | Badges suspended pending re-review; the user is prompted to re-verify | Stay |
| Revoke T3 only (+ reason) | Listings unlisted; T2 remains intact — a surgical trust downgrade | Stay |

### 8. Navigation

Entered from ADM-02 or via jump-to-user from any case view; jumps must offer a return path to the originating case. Search results and the loaded user live on one screen — no intermediate detail page. Browser back exits search cleanly. No bottom nav (desktop console).

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Search field; after search, the user-360 panel + actions | — |
| Loading | Panel skeleton; identity first | ≤300ms perceived |
| Empty | "No user matches" + the exact query echoed + search tips | Never blank |
| Restricted | Already-suspended/banned user: current state rendered prominently; actions adjust (no double ban; Reinstate offered) | Cascade confirmation required |
| Error (action fails) | Inline error; no partial cascade applied | Idempotent retry |

### 10. Business / Functional Rules

1. No action without a reason and explicit confirmation; every action writes an audit entry visible in the user's history (R-25). 2. Suspension and ban cascades are complete — listings unlisted, chats read-only, sessions revoked, applicant pipelines closed with notice; no zombie listings or half-frozen chats (R-24, EC-20, EC-21). 3. Enforced users always see a status screen explaining their state with an appeal path; the appeal is reviewed by the other admin (R-24). 4. Reinstatement restores prior state where valid — a real reversal, not a formality. 5. Revoke T3 is surgical: ownership trust falls, identity trust (T2) stands. 6. Warnings are notified to the user; enforcement reasons are recorded, but report content is never exposed to the affected user (R-25).

### 11. Cross-Screen Dependencies

This screen executes the cascades whose user-side results render as the enforcement status screen (reached from AUTH-02 login), unlisted listings (PUB-02 / DISC-01), frozen chats (CHAT-01 / CHAT-02) and badge removal (all surfaces). It is the escalation target of ADM-04, ADM-06 and ADM-07 — the state they write must match what this screen shows. Force re-verification reuses the VER-01 → VER-02 loop with badges suspended meanwhile. Appeals arrive through ACCT-03 and are reviewed by the other admin. The prior-actions history here is the same audit log ADM-02's tail renders.

### 12. Completion Criteria

- [ ] Search finds users by phone/email/name/id; 360 panel complete
- [ ] Every action requires reason + confirmation and is audited
- [ ] Suspension/ban cascades are complete — no zombie states (EC-20, EC-21)
- [ ] Enforced users get status screen + appeal; appeal reviewed by the other admin
- [ ] Reinstate truly restores; Revoke T3 leaves T2 intact

## ADM-09 — Platform Metrics

### 1. Purpose

The weekly marketplace-health digest — is the marketplace working? — built so the founder's weekly decisions and the roadmap read the same numbers. Scheduled for V1: explicitly outside the MVP build scope.

### 2. User Context

An admin opens this weekly (not daily — daily action lives on ADM-02) to judge acquisition, health, trust and retention trends over a chosen period, then export the numbers for the ops review. At MVP this screen does not exist; the dashboard's health strip carries the daily minimum until V1.

### 3. Entry Points

- ADM-02 left rail ("Metrics" — labeled as a V1 surface)

### 4. Functional Wireframe

```text
----------------------------------------
HEADER:  "Metrics" · [date range: this week] · [Export CSV]
----------------------------------------
ACQUISITION FUNNEL:  visits → signups → activated
MARKETPLACE HEALTH:  active listings · freshness share ·
                     median first response · connect→chat rate ·
                     fills
TRUST:  verification counts by tier (T2 / T3) · reports per 1k
        active users · blocks · SLA compliance
RETENTION:  week-4 return rate · top churn reasons
----------------------------------------
(all tiles aggregate-only — no personally identifying data)
(desktop console · left rail persistent)
```

### 5. Components

Metric groups (four fixed bands); date-range picker; CSV export. No user-level drill-down exists anywhere on this screen.

### 6. Content

- The four health groups with values for the selected period: acquisition funnel, marketplace health, trust, retention.
- Definitions shown with each metric (what 'activation' and 'freshness share' mean) so numbers are unambiguous.
- Thin-data honesty for early periods: a small-sample warning instead of confident percentages.

### 7. User Actions

| User Action | System Response | Next State / Screen |
|---|---|---|
| Change the date range | All four groups recompute for the range | Stay |
| Tap Export CSV | Download of the current range's aggregates | Stay |
| Return to the dashboard | Via the left rail | ADM-02 |

### 8. Navigation

Entered only from the ADM-02 rail; no other screen links here and it links only back. No bottom nav (desktop console). During MVP the rail item renders with its V1 label and the screen itself is absent — the label is honest, never a dead link.

### 9. Screen States

| State | What the user sees | Behavior |
|---|---|---|
| Default | Four metric groups for the selected range | — |
| Loading | Tile skeletons; range picker active immediately | ≤300ms perceived |
| Empty (thin data) | Metrics render with explicit small-sample warnings; no fake precision | Honesty over polish (R-30) |
| Disabled (MVP) | Screen not built; rail item labeled V1 | No dead link at MVP |

### 10. Business / Functional Rules

1. V1 scope, not MVP — the build is deferred; the ADM-02 health strip is the MVP stand-in. 2. Metrics mirror the same health gates used for launch and version decisions — the founder and the roadmap must read identical numbers (R-30). 3. All tiles are aggregates; no personally identifying data appears in any metric. 4. Small samples are labeled; early percentages carry a thin-data warning instead of false confidence. 5. Exports contain the same aggregates as the screen — no hidden user-level data in exports.

### 11. Cross-Screen Dependencies

Every metric must be computed from the same underlying definitions as its live counterpart: freshness share as stamped on listing surfaces (B-5), response medians as shown to seekers, SLA compliance as clocked on ADM-03 / ADM-05 / ADM-07, verification counts as decided in ADM-04. The ADM-02 health strip is its daily subset — the two must never disagree. Churn reasons aggregate the exit survey captured on ACCT-04.

### 12. Completion Criteria

- [ ] Clearly marked V1; absent from the MVP build without leaving a dead link
- [ ] Four groups render with range picker + CSV export
- [ ] Metric definitions match their live counterparts everywhere
- [ ] Thin-data warnings replace false precision (R-30)
- [ ] Aggregates only — zero PII in tiles or exports

---

# SECTION 06 — END-TO-END FEATURE FLOWS

Thirteen flows trace every core capability from first tap to final outcome — each is buildable and testable as a unit, each names its screens, register features, rules (R-xx), edge cases (EC-xx), and the states a user can land in.

## FLOW-01 — Authentication & Account Creation

**Purpose.** Turn a guest into a T0 phone-verified account with a chosen role and hand off cleanly into onboarding; let returning users regain access without losing the context that brought them back.

**Starting Point.** PUB-01 (landing), PUB-02/PUB-03 (public browse, via the auth wall when a gated action is tapped), PUB-04 (trust explainer → signup), or AUTH-02 (returning login, including session-expiry redirects).

**Preconditions.** None for signup (guest). Returning login requires an existing account.

**Step-by-Step Flow.**
1. Guest taps a gated action (Connect, Save) on PUB-02/PUB-03 → the auth wall intercepts with the original action carried (EC-05) and opens AUTH-01; or the guest taps "I have a room to offer" / "Login" on PUB-01, or "Create your verified profile" on PUB-04.
2. On AUTH-01 the user enters a phone number and accepts the terms → system checks the number; if it already exists, no enumeration error is shown — the "log in instead" path is prefilled (EC-02).
3. AUTH-03: user enters the 6-digit OTP (auto-read where the device allows). Success grants T0 Phone Verified (B-1) automatically (R-01). If the code is wrong ×5 → 30-minute lock with a support link into ACCT-03 (EC-03); resend has a 60-second cooldown, max 3/hour.
4. New user → AUTH-04 Role & Intent Selection: "I'm looking for a room", "I have a room to offer", or "Both" (Both starts the seeker path; the owner mode is added later from ACCT-01). Returning user skips AUTH-04 and lands on HOME-01 or HOME-02, or directly on the preserved auth-wall target.
5. System routes: Seek/Both → ONB-01 seeker wizard; Offer → ONB-02 owner wizard. If signup was triggered by an auth wall, the original interrupted action auto-executes after onboarding — the user never re-navigates manually (EC-05).

**Screens Used.** PUB-01, PUB-02, PUB-03, PUB-04, AUTH-01, AUTH-02, AUTH-03, AUTH-04

**Register Features.** F-001, F-003, F-014

**Possible Outcomes.**
- **Success** — T0 account created, role chosen; user lands on the role's onboarding wizard (new) or the restored context target (returning).
- **Failed** — OTP lock after repeated failures (EC-03); support path via ACCT-03; user returns to AUTH-02 after the lock expires.
- **Restricted** — suspended or banned account at login: state screen with status and appeal link; no app access (EC-20).
- **Cancelled** — user abandons before completing OTP or role; guest state preserved; original public screen remains reachable.

**Exit Points.**
- ONB-01 (new seeker) or ONB-02 (new owner)
- HOME-01 / HOME-02 (returning login default)
- Preserved auth-wall target (e.g., ROOM-01 with the Connect action resumed → FLOW-05)
- ACCT-03 (support link from OTP lock or suspended state)
- AUTH-02 (loop back for "log in instead", EC-02)

## FLOW-02 — Seeker Onboarding & Profile Building

**Purpose.** Guide a new seeker through one resumable wizard to a complete, matchable T1 profile, so the first visit to HOME-01 already shows personalized matches.

**Starting Point.** AUTH-04 (role chosen as Seek or Both), or the resume banner on HOME-01 after an abandoned attempt.

**Preconditions.** T0 account; seeker role selected.

**Step-by-Step Flow.**
1. ONB-01 runs six steps in order: basics (name, photo, occupation) → location → budget → move-in date → the 10 lifestyle attributes (F-006) → must-haves vs nice-to-haves (F-007). Must-haves are explicitly separated from soft preferences (R-13).
2. Every step persists on completion; exiting mid-wizard uses the explicit "Save & exit" — wizards have no bottom nav until finished, preventing half-state limbo. Data survives app kill; nothing is re-asked (EC-01).
3. Skipped steps leave the profile marked incomplete; the completeness meter on HOME-01/PROF-02 drives the user to finish (F-008). Photo upload follows the guidelines with safe-image checks (F-011).
4. Final CTA "Find my match" completes the profile → T1 Complete Profile is auto-computed (photo + all 10 attributes + blurb, R-01, badge B-2) → an optional, non-blocking prompt offers ID verification (VER-01) → HOME-01 renders personalized room and flatmate matches immediately.
5. Later edits: PROF-02 (identity + attributes) and PREF-01 (preferences) both trigger an async match recompute (≤60s) with an honest "matches updating" banner — never silent staleness (R-15, F-045).
6. Privacy controls (photo blur until connect, name masking, discovery opt-out) live in ACCT-02, with PROF-03 as the live "see me as others do" preview (F-012, F-013).
7. If the move-in date passes, a re-confirm prompt appears on HOME-01/PREF-01; confirmation recomputes matches (EC-24).

**Screens Used.** AUTH-04, ONB-01, HOME-01, VER-01, PROF-02, PREF-01, ACCT-02, PROF-03

**Register Features.** F-004, F-006, F-007, F-008, F-009, F-011, F-012, F-013, F-045

**Possible Outcomes.**
- **Success** — T1 complete profile; HOME-01 shows personalized matches on first arrival.
- **Pending** — wizard left incomplete; per-step data persisted; resume banner on HOME-01 re-enters at the exact step (EC-01).
- **Cancelled** — explicit Save & exit; draft kept; user can resume any time without data loss.

**Exit Points.**
- HOME-01 (completion or resume)
- VER-01 (optional ID-verification prompt → FLOW-07)
- PROF-02 / PREF-01 (later edits)
- PROF-03 (privacy preview via ACCT-02)

## FLOW-03 — Room Discovery & Evaluation

**Purpose.** Move a seeker from broad browse to a confident save or connect on a fresh, honestly-presented listing, with every surface expiry-aware.

**Starting Point.** Guest: PUB-01 → PUB-02 (public browse). Authenticated: HOME-01 recommended rails, the Search tab → DISC-01, or DISC-04 saved items.

**Preconditions.** Guest: none (public masked projection). Authenticated: T0 account; compatibility scoring and lifestyle filters need the seeker's own T1 profile complete.

**Step-by-Step Flow.**
1. Public browse: PUB-02 cards render the masked projection — photo, rent + deposit (deposit mandatory, R-07), room type, locality, badge, freshness stamp (R-06) — never exact address (R-08), never owner contact (R-16). Card tap → PUB-03 full masked detail. Any contact/connect tap hits the auth wall with context carried (EC-05) → FLOW-01. Heavy scrape-like abuse on public search degrades to a temporary block page with appeal, not a silent wall (EC-28).
2. Authenticated search on DISC-01: text/locality input, primary filter chips (rent, move-in window, room type, gender preference, deposit tolerance — rent defaults to the seeker's budget), sort with Freshest as default (F-026).
3. "Advanced filters" → DISC-02: lifestyle, room, availability (move-in range, tenancy duration), trust (owner-verified only), minimum compatibility threshold → Apply returns to DISC-01 re-ranked. Must-haves bind before ranking; preferences only shape the score (R-13, F-043).
4. Card tap → ROOM-01, the decision surface: full facts, owner trust badges (B-4) and response-rate tier, occupant compatibility score with why-this-match drivers (R-11, R-12), freshness stamp.
5. Decision: Save → DISC-04 (state revalidated whenever reopened, F-030); Share → public-safe card for messaging apps; Connect → intro-note sheet (FLOW-05); pass → back to results with filters and scroll intact.
6. Expiry awareness: expired, paused, filled, or removed listings never render in any search surface (R-05); stale deep links or saved rows degrade to a state banner plus pointers to similar live rooms — never a 404 (EC-12).
7. Zero results name their cause with one of three fixes: no city supply (waitlist + widen), a too-narrow filter (named, one-tap relax), must-haves excluding all (review must-haves CTA). Fewer than 4 results auto-relaxes the weakest filter with one-tap undo (EC-14).

**Screens Used.** PUB-01, PUB-02, PUB-03, HOME-01, DISC-01, DISC-02, ROOM-01, DISC-04

**Register Features.** F-021, F-023, F-024, F-025, F-026, F-027, F-030, F-041, F-042, F-043, F-046

**Possible Outcomes.**
- **Success** — room saved to DISC-04 or connect initiated (FLOW-05) from ROOM-01.
- **Expired** — the target listing has expired/paused/filled/been removed: state banner + similar-rooms path (EC-12).
- **Cancelled** — user passes; results preserve filters, sort, and scroll position.

**Exit Points.**
- ROOM-01 → connect sheet (FLOW-05) or save (DISC-04)
- DISC-02 (advanced filtering) and back to DISC-01
- PUB-03 → AUTH-01 (guest conversion, EC-05)
- DISC-04 (saved items home)

## FLOW-04 — Flatmate Discovery & Compatibility Evaluation

**Purpose.** Let users find compatible people without any listing existing — the pair-up journey — using explained compatibility rather than swipes.

**Starting Point.** HOME-01 flatmate rail or the Flatmates tab → DISC-03.

**Preconditions.** T0 account; the user's own profile attributes must be complete — otherwise a banner routes to finish the profile first (ONB-01/PROF-02).

**Step-by-Step Flow.**
1. DISC-03 renders the ranked candidate feed. Must-have chips (women-only, non-smoker, veg, etc.) bind before any ranking happens (R-13); the feed excludes self, blocked pairs, users who opted out of discovery (F-013), and candidates who declined the user within the last 90 days (EC-08). Candidates with no listing are fully included — pairing before flat-hunting is first-class.
2. Candidate cards show photo (blurred per the counterparty's visibility controls), T-badges, occupation, 2–3 lifestyle chips, the score band, and a one-line why-this-match summary (R-11, R-12).
3. Honesty rules: low-match candidates are shown but labelled, never hidden or buried (F-046, R-12). There is no swipe mechanic — every card invites evaluation, not judgment.
4. Card tap → PROF-01: the full breakdown — attribute by attribute, both users' values, and the points behind the score ("You match on food, sleep schedule; you differ on guests").
5. Decision: Save → DISC-04; Connect → intro-note sheet (FLOW-05); pass. Passing has no penalty; a candidate who declines disappears from the user's feed for 90 days (EC-08).
6. A connected pair continues in CHAT-02 and later switches to room discovery together (FLOW-03), each keeping their own saved items.

**Screens Used.** HOME-01, DISC-03, PROF-01, DISC-04, PROF-02

**Register Features.** F-030, F-013, F-041, F-042, F-043, F-044, F-046

**Possible Outcomes.**
- **Success** — flatmate saved to DISC-04 or connect initiated (FLOW-05) from PROF-01/DISC-03.
- **Cancelled** — user passes; the candidate can reappear in later sessions unless they declined (90-day suppression, EC-08).

**Exit Points.**
- PROF-01 → connect sheet (FLOW-05)
- DISC-04 (saved flatmates)
- DISC-03 (continue browsing; adjust must-have chips)
- ONB-01 / PROF-02 (incomplete-profile banner)

## FLOW-05 — Connect — Consent-Gated Introduction

**Purpose.** Convert interest into a two-sided, context-anchored introduction with zero contact exposure until both people agree.

**Starting Point.** The Connect CTA on ROOM-01 or PROF-01 (also the quick-connect on DISC-03 cards).

**Preconditions.** T0 account (T2 boosts the sender's ranking, R-01); target is not blocked and not within a 90-day decline cooldown; one active request per pair/context (EC-10).

**Step-by-Step Flow.**
1. The intro-note sheet opens, anchored to the exact listing or profile that triggered it — the anchor text on the sheet, the CONN-01 row, and the later chat header are identical. The note (≤300 chars) is prefilled from attribute overlap ("Both veg, both moving in August") with templates provided but not forced; the user may also send without a note (F-047).
2. Send → the request enters REQUESTED state with a 14-day TTL and appears under CONN-01 Sent as pending. New requests are rate-limited (20/day) — enough for a real search day, hostile to spam (EC-10 guards duplicates idempotently).
3. The counterparty sees the request under CONN-01 Received and receives a NOTIF-01 notification (in-app + email — time-sensitive by design).
4. Accept → CHAT-02 opens with the context header (counterparty mini-card + anchor). The acceptor can review PROF-01 before deciding; acceptance is never required blind.
5. Decline → completely silent to the sender (R-19); the sender can re-request only after 90 days (EC-08, R-17).
6. Withdraw (sender, while pending) → the request is removed from both sides.
7. If 14 days pass with no response → the request expires, labelled as such in CONN-01; the sender alone gets an in-app notice; neither side is penalized (R-18).
8. Guards throughout: blocked users cannot request each other; a duplicate or double-tapped request resolves to the same single request (EC-10).

**Screens Used.** ROOM-01, PROF-01, DISC-03, CONN-01, NOTIF-01, CHAT-02

**Register Features.** F-047, F-048, F-049

**Possible Outcomes.**
- **Pending** — request awaits a response (14-day TTL); visible under CONN-01 Sent.
- **Success** — accepted; CHAT-02 opens with the anchored context header (FLOW-06).
- **Rejected** — counterparty declines: silent to the sender, 90-day re-request cooldown (EC-08).
- **Expired** — no response within 14 days; labelled Expired in CONN-01; no penalty either side.
- **Cancelled** — sender withdraws; the request disappears from both sides.
- **Failed** — duplicate request blocked idempotently (EC-10) or daily rate limit reached; user continues browsing.

**Exit Points.**
- CHAT-02 (on acceptance → FLOW-06)
- CONN-01 (request state home)
- ROOM-01 / PROF-01 / DISC-03 (back to evaluation)
- NOTIF-01 (notification surface)

## FLOW-06 — Chat & Contact Reveal

**Purpose.** Provide a safe, context-anchored conversation that stays in-app until mutual trust, then escalates exactly once to phone contact through mutual consent and hands off gracefully to the real-world meeting.

**Starting Point.** CONN-01 accept action, CHAT-01 row tap, or a NOTIF-01 deep link into a thread.

**Preconditions.** An accepted connection (no chat before mutual acceptance); both accounts active and unblocked toward each other.

**Step-by-Step Flow.**
1. CHAT-02 opens with the context header — counterparty mini-card plus the anchor listing/profile, tap to re-open the anchor. A welcome card offers suggested questions generated from attribute overlaps.
2. Conversation is 1:1: text plus up to 3 images per message (size-capped, scanned), message rate limited; delivery indicators only — no read receipts (R-21). Failed sends retry or delete inline with no phantom "delivered" state (EC-17). CHAT-01 carries unread badges that reconcile with NOTIF-01 read-state (F-053).
3. Masking is absolute: phone, email, and URL patterns typed by either side render as masked pills (R-16). Early "WhatsApp/call me" pulls trigger a gentle notice — numbers can be shared after both agree (D-12 posture).
4. Risk system cards fire contextually: payment-pattern messages (UPI IDs, "advance/deposit/token" + amounts) raise a "payments are not supported on NestMate" interstitial and log a fraud signal (R-20); the first mention of visiting/meeting injects the meet-safe card (public place, daytime, share live location, never pay before seeing the room).
5. Either party taps "Share phone number" (header overflow, or the contextual CTA once the pair has exchanged messages) → a consent card names exactly what is shared (the number only) and with whom (this person only).
6. Both consent → both numbers render once in-thread as a system message, with notifications; the pre-meet safety card appears (SAFE-01 content) and the meeting happens off-platform by design — the platform steps out gracefully (R-16).
7. Edge behavior: simultaneous reveal requests collapse into one deduped consent flow (EC-18); a decline hides the CTA for 7 days with no pressure copy while chat continues normally (EC-19, R-17).
8. Report/block is available at any moment → FLOW-11; a block after reveal severs all platform contact but cannot recall the number already shared — the copy says so honestly (R-19). A counterparty account deleted mid-thread renders the thread read-only as "Deleted account" (EC-13).
9. If the owner marks the room Filled mid-chat, the conversation continues by courtesy and the anchor shows the Filled state.

**Screens Used.** CONN-01, CHAT-01, CHAT-02, SAFE-01, SAFE-02

**Register Features.** F-050, F-051, F-052, F-053, F-054, F-057

**Possible Outcomes.**
- **Success** — mutual consent completes the reveal; numbers appear in-thread; pre-meet safety card shown; meeting proceeds off-platform.
- **Failed** — a message send fails: inline retry/delete on the bubble, nothing silently dropped (EC-17).
- **Cancelled** — reveal declined: CTA hidden 7 days, chat continues without pressure (EC-19).
- **Restricted** — an active safety case freezes the pair read-only (R-23); a suspended counterparty freezes the thread with a notice (EC-20).

**Exit Points.**
- SAFE-02 (report/block → FLOW-11) and SAFE-01 (safety guidance)
- ROOM-01 / PROF-01 (re-open the anchor)
- CHAT-01 (conversation index)
- Off-platform (post-reveal meeting — the intended conclusion)

## FLOW-07 — Trust Verification

**Purpose.** Convert a T0 account into T2 (any user) or T3 (owner) through human-reviewed evidence, granting visible badges, ranking weight, and — for owners — the publish gate.

**Starting Point.** Voluntary trigger: the "Verify ID" CTA on PROF-02, the completeness/trust card on HOME-01, or VER-02. Gated trigger: the verification explainer at the end of ONB-02, or the interstitial when publish is attempted in OWN-01 without T3.

**Preconditions.** T0 account. T3 additionally requires an owner role and a claim of control over the room to be listed.

**Step-by-Step Flow.**
1. VER-01: consent notice first (what is checked, what is stored, the "reviewed documents — not a background check" disclaimer, R-01) → document choice (Aadhaar with masked-first-8 instruction, PAN, DL, or Passport) → upload → live selfie capture → submit. Owners add the ownership-proof step: rent agreement, landlord NOC, or utility bill (owner-flatmate set) or the stronger landlord set (property tax receipt, electricity bill, society letter).
2. Upload failures retain all state and retry inline with size/type guidance — nothing is lost (EC-06).
3. Submit → VER-02 shows Submitted → In review with the <24h human-review SLA stated (R-03). An acknowledgement notification fires (in-app + email).
4. Admin side (out of user view): ADM-03 queue → ADM-04 checklist — name consistency, face similarity, document authenticity, ownership match (T3), duplicate-image hash check, fraud-pattern screen → decision.
5. Approved: B-3 "ID Verified" or B-4 "Owner Verified" granted with the decision date; the profile re-ranks with trust weight across every score-bearing surface; notifications fire.
6. Rejected: an enumerated, user-readable reason plus a concrete fix → resubmit from VER-01 (reason context prefilled). A second rejection starts a 7-day cooling period with the date shown (EC-07, R-03). `suspected_fraud` escalates with no resubmission.
7. SLA breach (>24h): VER-02 shows an apology banner while the case is auto-prioritized on the admin side (EC-04, R-30).
8. Lifecycle: documents and selfie are deleted 30 days after decision; badges expire at 12 months → a lighter re-verification prompt (VER-01); revocation (e.g., after a safety case) is immediate and visible everywhere.

**Screens Used.** HOME-01, HOME-02, ONB-02, PROF-02, VER-01, VER-02, ADM-03, ADM-04

**Register Features.** F-015, F-016, F-017, F-018, F-019

**Possible Outcomes.**
- **Pending** — Submitted/In review with the SLA shown; user waits on VER-02 (breach shows the apology state, EC-04).
- **Success** — approved: badge + date granted, trust-weighted re-ranking applied; owners unlock the publish gate.
- **Rejected** — reason + fix shown; resubmission open; second rejection → 7-day cooling (EC-07).
- **Restricted** — suspected fraud: escalated to admins, resubmission disabled.
- **Expired** — badge expiry at 12 months: re-verify prompt on VER-02/PROF-02 (R-03).

**Exit Points.**
- VER-01 (resubmission) and VER-02 (status home)
- HOME-01 / PROF-02 (badge visible, ranking updated)
- OWN-01 (T3 owners proceed to listing creation → FLOW-08)
- ACCT-03 (support escalation path)

## FLOW-08 — Owner Listing Creation & Moderation

**Purpose.** Turn a verified owner's room into a complete, honest listing through a structured wizard, then hold it to automated and human quality checks before it goes live.

**Starting Point.** AUTH-04 ("I have a room to offer") → ONB-02; or HOME-02 "Publish your first room"/"New listing"; or OWN-02 "New".

**Preconditions.** Owner role. Publishing requires T3 — enforced as a gate, never a suggestion (R-02); drafting is allowed before verification completes.

**Step-by-Step Flow.**
1. ONB-02 wizard: owner type (living-in owner-flatmate vs landlord — copy variants, one product), property basics, expectations, and the verification explainer → "Start verification" (owner variant of FLOW-07) or "Save & exit" → HOME-02 keeps the draft with a resume banner (EC-01).
2. OWN-01 runs six steps to a review screen: room facts → photos (minimum 3, cover selection, reorder) → rent, deposit (mandatory, always visible later — R-07), move-in date → amenities → house rules + household expectations (limited ethical set only — dietary household, smoking, pets, guests, current resident gender composition as factual description; no exclusion language — R-14) → availability. There is no exact-address field anywhere (R-08). The owner-flatmate path adds the 10-attribute "about me" block, the only owner type that scores for compatibility.
3. Validation is inline and field-level; failed submissions never clear entered data (EC-16). Duplicate detection warns pre-publish with merge / replace / publish-anyway options — not a hard block, since legitimate multi-room cases exist (EC-11, R-10).
4. Publish attempts the T3 gate: without T3 the user sees the verification interstitial → VER-01 owner variant (R-02). While verification is pending, the owner is invited to prepare a draft now.
5. Submit → listing enters Pending and auto-checks run: contact-info pattern block (phone/email/URL in listing text or house rules — bypass attempts are blocked at submit and flag admin review, EC-22), duplicate text/photo detection, price-outlier check vs locality median; a random sample of new listings also goes to human moderation pre-trust-build (F-058).
6. Auto-checks pass → Active: success card, listing visible in every search surface, analytics live on HOME-02 (views, saves, connects).
7. Auto-flag raised → listing stays Pending for ADM-05/ADM-06 human review → outcome: approve (Active), require edits (owner notified with the note), or unlist. The owner sees "Flagged — under review" on OWN-03 meanwhile. If moderation removes photos below the minimum, the listing auto-pauses pending fix (EC-15).

**Screens Used.** AUTH-04, ONB-02, HOME-02, OWN-01, OWN-02, OWN-03, VER-01, ADM-05, ADM-06

**Register Features.** F-005, F-011, F-016, F-022, F-032, F-033, F-034, F-037, F-058, F-072

**Possible Outcomes.**
- **Success** — published Active; visible across PUB-02/DISC-01; analytics live on HOME-02.
- **Pending** — auto-flag or moderation sample holds the listing in review; owner sees the flagged state on OWN-03.
- **Rejected** — moderation requires edits or unlists the listing; owner fixes per the note or the listing is removed.
- **Restricted** — publish without T3: verification interstitial, never an error (R-02).
- **Cancelled** — draft saved; publish abandoned; resume banner on HOME-02 (EC-01).

**Exit Points.**
- HOME-02 (dashboard with the new Active listing)
- OWN-02 / OWN-03 (management and detail)
- VER-01 (T3 gate path → FLOW-07)
- OWN-04 (applicants arrive → FLOW-09)

## FLOW-09 — Applicant Pipeline & Selection

**Purpose.** Replace inbox chaos with a staged pipeline that carries every accepted connect from arrival to one confident selection and a complete fill cascade that kills ghost inventory.

**Starting Point.** An accepted connect request anchored to a listing auto-creates an applicant at NEW. Owner enters via HOME-02 ("3 new applicants"), OWN-04, or a NOTIF-01 deep link.

**Preconditions.** At least one Active listing (owner is T3); accepted connections anchored to that listing.

**Step-by-Step Flow.**
1. Each NEW applicant card arrives with substance, not a ping: profile, badges, compatibility score, rent-fit, and move-in date attached. NEW cards older than 24h surface on HOME-02 to feed the response-rate meter (F-068).
2. OWN-04 organizes stages NEW → Shortlisted → Chatting → Met → Selected, with Rejected and Withdrawn collapsed as terminal states. Guardrail: the pipeline exposes only what applicants chose to share plus compatibility — no filtering by gender, religion, or caste (R-14).
3. Card tap → OWN-05: full applicant detail with the why-this-match breakdown; up to 3 applicants compare side-by-side; "Open chat" jumps to CHAT-02 with the applicant/listing anchor (F-067).
4. Stage movement: the first message exchange suggests CHATTING (owner confirms); all transitions are idempotent, so double-clicks and races never create duplicates (EC-26).
5. Select → confirm sheet → the fill cascade (F-036): the listing becomes Filled on OWN-03 and is hidden from every search surface immediately (R-09); all other applicants are auto-closed with a polite notice ("The room has been filled — thank you for your interest"); pending requests on the listing are withdrawn; the fill event is logged.
6. Bulk actions: post-fill New-stage sweep and New-stage decline-all (reason optional). Withdrawn applicants exit cleanly to the collapsed terminal state (EC-08).
7. Seeker-side consistency: a seeker's saved row in DISC-04 shows the Filled state; the chat anchor shows Filled; no ghost enquiries are possible anywhere (R-09).

**Screens Used.** HOME-02, OWN-04, OWN-05, CHAT-02, OWN-03, DISC-04, NOTIF-01

**Register Features.** F-036, F-041, F-042, F-065, F-066, F-067, F-068

**Possible Outcomes.**
- **Pending** — applicants await action; >24h-old NEW cards surface on HOME-02 (response culture).
- **Success** — Select completes the fill cascade: listing Filled everywhere, others politely closed (R-09).
- **Rejected** — declined applicants exit to the collapsed terminal state (notice sent).
- **Cancelled** — withdrawn applicants exit to the collapsed terminal state (EC-08).

**Exit Points.**
- OWN-03 (Filled state; post-fill management)
- CHAT-02 (applicant conversations)
- OWN-04 / OWN-05 (continue evaluating)
- OWN-02 (listings management)
- **OPEN DECISION:** doc 21 §3 and F-066 name "Moved in" as a terminal-good stage after Selected, while the target pipeline for OWN-04 ends at Selected with the fill cascade. Does the owner-facing pipeline include a post-selection "Moved in" tracker stage at MVP, or does Select + fill cascade remain terminal?

## FLOW-10 — Listing Freshness & Renewal

**Purpose.** Keep every visible listing demonstrably fresh through automated nudges, one-tap renewal, and auto-pause — so seekers never chase dead inventory and owners never repost out of shame.

**Starting Point.** Owner: HOME-02 expiry nudge card, OWN-02 quick actions, or a NOTIF-01 renewal notice. Seeker: any listing surface reflecting the current state.

**Preconditions.** At least one Active listing (owner, T3). Seeker side requires no precondition — state surfaces appear wherever listings render.

**Step-by-Step Flow.**
1. Day 27: the expiring nudge fires (in-app + email); a nudge card appears on HOME-02 and the countdown state shows on OWN-02/OWN-03 (R-05, F-039).
2. Day 30 without renewal: the listing becomes Expired — hidden from every search surface instantly (R-05). The owner sees the Expired state with a one-tap Renew action that resets "last confirmed available" and updates the B-5 freshness stamp everywhere (F-020).
3. Day 45 total without confirmation: the listing auto-pauses. Revive requires an explicit confirmation plus a photo re-check — no silent resurrection; the owner may otherwise let it lapse to a terminal expired state (R-05).
4. Renewal resets freshness but never engagement — renewing is not a re-boost (anti-gaming). More than 2 consecutive expiries trigger a quality-tips card (photos/description guidance).
5. Seeker side: only fresh listings render anywhere; the "Confirmed Xd ago" stamp is mandatory on every card, detail, saved row, and owner panel (R-06, F-021). Any stale encounter — expired, paused, filled, removed — degrades to a state banner plus similar-rooms pointers; deep links resolve to the state view, never a 404; saved rows in DISC-04 revalidate their state on open (EC-12).
6. Owner-initiated states: Paused is invisible to search but preserves the listing URL and state (EC-12); Remove requires a reason (feeds marketplace analytics).
7. From any state the owner can instead Mark as Filled, which runs the FLOW-09 cascade — pausing or expiring is never a silent substitute for closing (R-09).

**Screens Used.** HOME-02, OWN-02, OWN-03, NOTIF-01, DISC-01, ROOM-01, DISC-04

**Register Features.** F-020, F-021, F-034, F-035, F-039

**Possible Outcomes.**
- **Success** — renewed: the freshness stamp resets, the listing stays visible in all search surfaces.
- **Expired** — day-30 lapse: hidden from search; owner holds the one-tap renew path; seeker surfaces show the state banner (EC-12).
- **Pending** — day-45 auto-pause: awaiting the owner's explicit revive (confirm + photo re-check) or lapse.
- **Cancelled** — owner pauses or removes the listing (reason recorded).

**Exit Points.**
- OWN-02 / OWN-03 (renew, pause, revive, remove, edit)
- HOME-02 (nudge cards, dashboard)
- OWN-04 → FLOW-09 (Mark as Filled cascade)
- DISC-01 / ROOM-01 / DISC-04 (seeker-side state banners and re-search)
- **OPEN DECISION:** R-05 defines renewal as one tap granting +30 days, while doc 18 §4 states that renewing an already-expired listing (days 30–45) grants only 7 more days before auto-pause. Which duration applies to post-expiry renewal — +30 days uniformly, or a shorter 7-day grace for expired listings?

## FLOW-11 — Safety — Report, Block & Enforcement

**Purpose.** Turn a moment of concern into structured intake, immediate self-protection, SLA-bound human resolution, and closure the reporter can trust.

**Starting Point.** The overflow Report/Block action on any profile card, listing, chat bubble, or thread; or the standing entry in SAFE-01 (Safety Center).

**Preconditions.** Authenticated user; a reportable object (user, listing, or message).

**Step-by-Step Flow.**
1. SAFE-02 opens: the reason taxonomy (scam/fraud, harassment/abuse, fake profile or listing, inappropriate content, payment request, safety concern, other), optional screenshot evidence, free text; message and listing context auto-attach so reports carry evidence (F-055).
2. The block toggle (default ON toward the counterparty) applies immediately: the two parties become mutually invisible across discovery, feeds, and chat; threads mute; the blocked party is never notified (R-19). Block ≠ report — the user is prompted "also report?" once. The block list is manageable in SAFE-01.
3. The report is visible to admins within seconds; repeat reports on the same object dedupe per reporter+object with an "already under review" notice and a pile-on count for admins (EC-09).
4. Auto-protections engage while the case is pending, by severity: S1 safety-class → the chat pair freezes (read-only banner on CHAT-02); S1/S2 listing-scoped → the listing unlists (R-23).
5. Admin side: ADM-07 triages by severity with SLAs — S1/S2 within 12h, S3 within 48h (R-22) — then resolves with a disposition (dismissed, warned, content removed, unlisted, verification revoked, suspension, ban), each with a mandatory note and an audit entry (R-25). Enforcement actions run through ADM-08; admins see queue health on ADM-02.
6. If the disposition is dismissed, protections reverse cleanly: the pair unfreezes and a wrongly unlisted listing re-lists (EC-27).
7. Escalation: the strike ladder (removal + warning → 7-day suspension → ban); S1/S2 cases on verified accounts revoke verification immediately, badge removed same session; a ban cascades completely — listings unlisted, applicants closed, chats read-only, sessions revoked, re-registration blocked (R-24, EC-21).
8. The reporter receives a closure notification (outcome class + action taken, never details about the other party) via NOTIF-01 + email (R-22). SAFE-01 remains the always-available guidance surface beside the entire flow.

**Screens Used.** SAFE-01, SAFE-02, CHAT-02, NOTIF-01, ADM-02, ADM-07, ADM-08

**Register Features.** F-055, F-056, F-057, F-058, F-059, F-060, F-073, F-074, F-075

**Possible Outcomes.**
- **Pending** — case open; auto-protections active for S1/S2 (chat freeze and/or unlist).
- **Success** — disposition recorded and audit-logged; reporter receives closure (outcome, no other-party details).
- **Rejected** — report dismissed with a mandatory note; all protections cleanly reversed (EC-27).
- **Restricted** — block enforced as mutual invisibility (R-19), and/or the enforcement cascade strips the reported party's listings, chats, and access (R-24).

**Exit Points.**
- SAFE-01 (guidance, manage blocked accounts)
- CHAT-01 / CHAT-02 / DISC-01 / PROF-01 (return surfaces; frozen threads show read-only banners)
- NOTIF-01 (closure notice)
- ACCT-03 (support and appeal path)

## FLOW-12 — Notifications & Returning User

**Purpose.** Bring a returning user back to exactly the right object in exactly its current state — never re-onboarding, never a dead link, never silent staleness.

**Starting Point.** AUTH-02 login (or a restored session), a NOTIF-01 tap, or an email deep link.

**Preconditions.** Existing account (T0+); role previously selected.

**Step-by-Step Flow.**
1. AUTH-02 phone → AUTH-03 OTP → land on HOME-01 or HOME-02 by current mode. Returning users never re-onboard; drafts, wizard steps, and per-mode route memory all survive (EC-01).
2. Home restores working context: the last search, saved items with freshness revalidated, unread badges on Chats/notifications, and new matches since the last visit.
3. NOTIF-01 aggregates all in-app events; email fires only for critical state changes and digests, never per-message (R-29, F-062). Badge counts reconcile with read-state — no phantom badges.
4. Every notification deep-links to its object: a connection → the CONN-01 row, a message → the CHAT-02 thread, a verification decision → VER-02, a listing event → OWN-03 (owner) or ROOM-01 (seeker) by role. If the object has expired, filled, or been removed, the link resolves to the state banner plus the nearest healthy screen — never a 404 (EC-12).
5. Preference drift: if the move-in date has passed, a re-confirm prompt appears on HOME-01 and PREF-01; confirming updates preferences and triggers the match recompute — stale users are deprioritized only if unresponsive for over 21 days (EC-24, F-045).
6. NOTIF-02 gives per-event × per-channel control; safety and account-enforcement notices cannot be disabled, and new-message in-app alerts always remain (R-29). Non-critical email respects quiet hours.

**Screens Used.** AUTH-02, AUTH-03, HOME-01, HOME-02, NOTIF-01, NOTIF-02, CONN-01, CHAT-02, VER-02, PREF-01, DISC-04

**Register Features.** F-030, F-045, F-053, F-061, F-062, F-063

**Possible Outcomes.**
- **Success** — context fully restored; the deep link lands on the live object in its current state.
- **Expired** — the target object is gone or changed: state banner + nearest healthy screen (EC-12).
- **Restricted** — suspended account: state screen with status and appeal; no app access (EC-20).

**Exit Points.**
- Deep-link targets: CONN-01, CHAT-02, VER-02, OWN-03 / ROOM-01
- HOME-01 / HOME-02 (continue-where-left default)
- PREF-01 (stale-preference re-confirm → matches recompute)
- ACCT-01 (settings, NOTIF-02 preferences)

## FLOW-13 — Account Management & Exit

**Purpose.** Let users evolve their account — add roles, tune privacy — and leave on their own terms, with exits that never strand the people they were talking to.

**Starting Point.** ACCT-01 Settings, reached from the Profile tab or any overflow menu.

**Preconditions.** Authenticated user.

**Step-by-Step Flow.**
1. Roles: from ACCT-01 the user adds Owner or Seeker without re-signup → AUTH-04 handles the upgrade → the corresponding wizard (ONB-01 or ONB-02) collects only what the new role needs. "Both" users get the persistent Seeking ⇄ Offering mode chip; switching swaps the bottom nav and default home while preserving all in-progress state — a mid-chat switch never loses the chat (EC-25).
2. NOTIF-02 (notification preferences) is reachable from ACCT-01. ACCT-02 holds privacy and visibility controls (photo blur until connect, name masking, discovery opt-out) with PROF-03 as the live "see me as others do" preview rendered by the same path others see (F-012, F-013).
3. ACCT-03 offers self-serve Help & Support — FAQ and tickets — and doubles as the appeal path for enforcement states.
4. Deactivate (ACCT-04): explained clearly — the profile and listings hide, connections freeze but are not lost. Reactivation is simply logging in again: exact state restoration, with listing freshness re-validated on return (an expired listing stays expired) (EC-23, R-27).
5. Delete (ACCT-04): consequences stated plainly → 14-day grace window, cancellable by logging in → after grace, PII is erased or irreversibly anonymized, listings are removed, and messages are anonymized — the counterparty keeps the chat minus the identity (R-27). Counterparty threads read "Deleted account" and anonymize content after the retention window (EC-13).
6. Suspended or banned users attempting access see the state screen with status and the appeal link — never a silent refusal (EC-20).

**Screens Used.** ACCT-01, ACCT-02, ACCT-03, ACCT-04, AUTH-04, ONB-01, ONB-02, PROF-03, NOTIF-02, CHAT-02

**Register Features.** F-012, F-013, F-063, F-076, F-077, F-078, F-079, F-080

**Possible Outcomes.**
- **Success** — role added, privacy saved, or reactivation completed with exact state restoration (EC-23).
- **Pending** — deletion requested: the 14-day grace window runs; the account is recoverable until it closes.
- **Cancelled** — deactivation reversed by logging in, or deletion cancelled within the grace window.
- **Restricted** — suspended/banned account: state screen with status and appeal path (EC-20).

**Exit Points.**
- HOME-01 / HOME-02 (per-mode default after role changes or reactivation)
- AUTH-04 → ONB-01 / ONB-02 (role-add wizards)
- PROF-03 (privacy preview via ACCT-02)
- ACCT-02 / ACCT-03 (controls and support)
- PUB-01 (post-logout or post-grace deletion)

---

# SECTION 07 — FEATURE → SCREEN MAPPING

Every MVP feature has exactly one home surface, a defined entry, and a completion path — no orphan features, no duplicate homes.

| Feature | Screen IDs | Entry Point | Primary Action | Completion Screen |
|---|---|---|---|---|
| F-001 Phone OTP signup/login (T0) | AUTH-01 · AUTH-02 · AUTH-03 | PUB-01 signup / Login CTAs | Enter phone number + OTP code | AUTH-04 (session active, T0 set) |
| F-003 Role & intent selection (Seek/Offer/Both) | AUTH-04 · ACCT-01 | AUTH-03 success / ACCT-01 | Pick Seek / Offer / Both | ONB-01 or ONB-02 |
| F-004 Seeker onboarding wizard | ONB-01 | AUTH-04 (Seek intent) | Complete 6 guided steps | HOME-01 (T1 profile) |
| F-005 Owner onboarding wizard | ONB-02 | AUTH-04 (Offer intent) | Complete 4 guided steps | VER-01 (verification path) |
| F-006 Lifestyle questionnaire (10 canonical attributes) | ONB-01 · PROF-02 | ONB-01 step 5 / PROF-02 | Answer the 10 attributes once | ONB-01 final step (compatibility substrate set) |
| F-007 Must-have + nice-to-have preferences | ONB-01 · PREF-01 | ONB-01 step 6 / PREF-01 | Set hard vs soft preferences | PREF-01 (saved; binds DISC-01) |
| F-008 Profile completeness meter + prompts | HOME-01 · PROF-02 · HOME-02 | HOME-01 meter card | Fill flagged gaps | PROF-02 (meter advances) |
| F-009 Seeker profile view/edit | PROF-02 | Bottom-nav Profile | Edit identity fields | PROF-02 (saved; scores recompute) |
| F-010 Owner profile view/edit | OWN-06 | Bottom-nav Profile (owner shell) | Edit owner identity + properties | OWN-06 (saved; trust surface live) |
| F-011 Photo upload with guideline checks | ONB-01 · PROF-02 · OWN-01 | Photo slot in wizard / profile | Upload guideline-safe photo | Slot confirmed (image live) |
| F-012 Profile public preview | PROF-03 | PROF-02 / ACCT-02 "see as others do" | View masked public self | PROF-03 (privacy confidence) |
| F-013 Visibility controls (blur, masking, discovery opt-out) | ACCT-02 | ACCT-01 → Privacy | Set exposure controls | ACCT-02 (applies platform-wide) |
| F-014 T0 phone verification (automatic) | AUTH-03 | Automatic on OTP success | None (automatic) | T0 badge on every card + profile |
| F-015 T2 ID + selfie submission | VER-01 · VER-02 | VER-02 CTA / PROF-02 prompt | Submit ID + selfie evidence | VER-02 (under review → verdict) |
| F-016 T3 ownership proof submission (owner) | VER-01 · VER-02 | VER-01 owner step | Submit ownership proof | VER-02 (verdict; publish unlocked) |
| F-017 Admin verification review workflow | ADM-03 · ADM-04 | ADM-02 queue card | Checklist approve / reject | ADM-04 (badge granted or reason sent) |
| F-018 Trust badge system (B-1…B-5) | All cards + profile surfaces | Earned on verification events | None (earned, displayed) | Trust state visible on every card + profile |
| F-019 Verification status + resubmission | VER-02 | Bottom-nav verification entry | Fix issues + resubmit | VER-02 (transparent outcome) |
| F-020 Listing freshness: 30-day expiry + one-tap renewal | OWN-02 · OWN-03 | OWN-02 expiring banner | One-tap renew | OWN-03 (freshness stamp reset) |
| F-021 "Last confirmed available" freshness stamp | PUB-02 · PUB-03 · HOME-01 · DISC-01 · ROOM-01 | Displayed on every room card + detail | None (displayed) | Honest recency at the decision moment |
| F-022 Publish requires T3 (verification gate) | OWN-01 · VER-01 | OWN-01 publish attempt | Gate to verification | VER-01 (T3 grants publish) |
| F-023 Location-based room search (city + locality + radius) | PUB-02 · DISC-01 | Bottom-nav Search / PUB-01 CTA | Run location search | DISC-01 (fresh, ranked results) |
| F-024 Primary filters (rent, move-in, room type, gender) | DISC-01 | DISC-01 filter bar | Apply primary filters | DISC-01 (narrowed results) |
| F-025 Advanced filters (lifestyle, dietary, pets, amenities) | DISC-02 | DISC-01 "More filters" | Set dealbreaker filters | DISC-01 (precision results) |
| F-026 Sorting (freshness, rent, compatibility, newest) | DISC-01 · DISC-03 | Sort control on results | Choose sort order | DISC-01 / DISC-03 (reordered) |
| F-027 Room detail page (full facts) | PUB-03 · ROOM-01 | Room card tap | Evaluate full room facts | ROOM-01 (Connect / Save / Pass) |
| F-030 Saved rooms / flatmates (revalidated state) | DISC-04 | Save action on room / flatmate cards | Save room or flatmate | DISC-04 (revalidated list) |
| F-032 Listing creation wizard (multi-step) | OWN-01 | HOME-02 / OWN-02 "Create listing" | Complete 6 steps → publish | OWN-03 (Active listing) |
| F-033 Photo manager (min 3, cover, reorder) | OWN-01 | OWN-01 photo step | Add photos, set cover, reorder | OWN-01 (photo step complete) |
| F-034 Listing lifecycle state machine | OWN-02 · OWN-03 | OWN-02 list / OWN-03 controls | Advance lifecycle state | OWN-03 (truthful state shown) |
| F-035 Edit / pause / resume / close | OWN-03 | OWN-03 action bar | Edit details or change state | OWN-03 (change applied everywhere) |
| F-036 Room-Filled flow | OWN-04 · OWN-03 | OWN-05 applicant select | Confirm room filled with selected applicant | OWN-03 (Filled; delisted everywhere) |
| F-037 Duplicate listing detection | OWN-01 · ADM-05 | OWN-01 publish attempt | Resolve duplicate warning | OWN-01 (deduplicated publish) |
| F-038 Listing analytics (views, saves, connects, response) | HOME-02 · OWN-03 | HOME-02 stat cards | Read performance numbers | HOME-02 / OWN-03 (feedback loop) |
| F-039 Stale detection + nudges | HOME-02 · OWN-02 | Automatic stale check (nudge) | Renew stale listing | OWN-02 (listing refreshed) |
| F-040 Canonical attribute model (10 attributes) | ONB-01 | ONB-01 questionnaire | Collect attributes once | Substrate for every compatibility score |
| F-041 Compatibility score 0–100 + bands | HOME-01 · DISC-01 · DISC-03 · PROF-01 · OWN-04 | Displayed on cards + profiles | None (displayed) | Score band visible at decision surfaces |
| F-042 "Why this match" explanation | DISC-03 · PROF-01 · OWN-05 | Tap the score chip | Expand top compatibility drivers | Inline explanation panel |
| F-043 Must-have hard filters enforced | DISC-01 · DISC-03 | ONB-01 / PREF-01 setup | Enforce dealbreakers in results | DISC-01 / DISC-03 (compliant results only) |
| F-044 Flatmate discovery feed (ranked) | DISC-03 | Bottom-nav Flatmates | Browse ranked flatmates | DISC-03 (Connect from feed) |
| F-045 Match recompute on preference change | PROF-02 · PREF-01 | Profile / preference edit | None (automatic recompute) | Scores refreshed across surfaces |
| F-046 Low-match transparency (show but label) | DISC-03 · PROF-01 | Displayed in feed / profiles | None (labelled) | Honest low-match label |
| F-047 Connect request + intro note | ROOM-01 · PROF-01 | Connect CTA on room / flatmate | Send context-anchored intro | CONN-01 (request pending) |
| F-048 Accept / decline / withdraw | CONN-01 | CONN-01 request cards | Two-sided accept / decline / withdraw | CONN-01 (chat opens on accept) |
| F-049 Connections inbox (received / sent, status) | CONN-01 | HOME-01 pill / bottom-nav | Manage all requests | CONN-01 (nothing lost) |
| F-050 1:1 in-app chat (context header, image-limited) | CHAT-01 · CHAT-02 | CONN-01 accept / CHAT-01 thread tap | Message in anchored thread | CHAT-02 (decision conversation) |
| F-051 Contact Reveal (mutual consent, tracked) | CHAT-02 | CHAT-02 reveal card | Both parties consent | CHAT-02 (contacts revealed once) |
| F-052 In-chat risk prompts (payments, off-platform links) | CHAT-02 | Automatic on risk patterns | None (system cards) | CHAT-02 (fraud friction shown) |
| F-053 Unread counts & badges | CHAT-01 · NOTIF-01 | Displayed on shell | None (displayed) | Badge counts on nav + bell |
| F-054 Chat media rate limits | CHAT-02 | CHAT-02 media send | None (enforced) | CHAT-02 (limit notice) |
| F-055 Report with reason taxonomy | SAFE-02 | Overflow (⋯) on profile / listing / message | Submit report + evidence | SAFE-02 (case created) |
| F-056 Block user | SAFE-02 · CHAT-02 | CHAT-02 / SAFE-02 | Block user | SAFE-02 (mutual invisibility) |
| F-057 Safety Center (public + authenticated) | PUB-04 · SAFE-01 | PUB-01 trust links / shell menu | Learn safety practices | PUB-04 / SAFE-01 (literacy + entry) |
| F-058 Automated abuse flags (velocity, link spam, payment) | ADM-05 · ADM-07 | Automatic pattern detection | None (admin reviews flags) | Flags surfaced in queues |
| F-059 Moderation case management | ADM-07 | ADM-02 report queue card | Set disposition + close | ADM-07 (SLA-bound closure) |
| F-060 Suspended / banned state UX | Global (guard state on all screens) | Session guard on any screen | None (status shown) | Enforcement state surface (coherent) |
| F-061 In-app notification center | NOTIF-01 | Bell on shell header | Catch up on events | NOTIF-01 (deep links to source) |
| F-062 Transactional email | — (email channel; no screen) | Automatic on critical state changes | None (system-sent) | User's inbox (critical changes) |
| F-063 Notification preferences | NOTIF-02 · ACCT-01 | ACCT-01 → Notifications | Choose channels + types | NOTIF-02 (saved) |
| F-065 Owner dashboard | HOME-02 | Bottom-nav Dashboard (owner shell) | Act on attention items | HOME-02 (one-minute ops) |
| F-066 Applicant pipeline (6 stages) | OWN-04 | HOME-02 listing card / OWN-04 tab | Move applicants through stages | OWN-04 (stage updated) |
| F-067 Applicant detail & compare | OWN-05 | OWN-04 applicant tap | Evaluate + compare up to 3 | OWN-05 (informed decision) |
| F-068 Owner response-rate tracking | HOME-02 · OWN-06 | HOME-02 rate card | Respond within window | HOME-02 (rate displayed) |
| F-069 Move-in date + duration fields / filters | OWN-01 · DISC-01 | OWN-01 fields / DISC-01 filter panel | Set or filter timing | OWN-01 / DISC-01 (timing semantics applied) |
| F-070 Admin dashboard (queues + SLA states) | ADM-02 | ADM-01 admin login | Triage all queues | ADM-02 (ops command) |
| F-071 Verification queue | ADM-03 · ADM-04 | ADM-02 queue card | Decide verification case | ADM-04 (SLA-bound decision) |
| F-072 Listing moderation queue + auto-flags | ADM-05 · ADM-06 | ADM-02 queue card | Approve / reject / flag listing | ADM-06 (disposition) |
| F-073 Report queue (severity triage + SLA) | ADM-07 | ADM-02 queue card | Triage severity + resolve | ADM-07 (case closed) |
| F-074 User management (suspend / ban / reinstate) | ADM-08 | ADM-02 user search | Change account enforcement state | ADM-08 (state applied) |
| F-075 Audit log of admin actions | ADM-08 · ADM-09 | Automatic on every admin action | None (recorded) | ADM-09 (immutable log view) |
| F-076 Settings hub | ACCT-01 | Avatar / overflow menu | Control the account surface | ACCT-01 (one place) |
| F-077 Privacy & visibility controls surface | ACCT-02 | ACCT-01 → Privacy | Set exposure controls | ACCT-02 (privacy home) |
| F-078 Deactivate / delete account (14-day grace) | ACCT-04 | ACCT-01 → Account | Deactivate or request deletion | ACCT-04 (grace confirmed) |
| F-079 Dual-role switching + durable profile reuse | ACCT-01 · AUTH-04 | Mode chip on shell / ACCT-01 | Switch Seek / Offer mode | Shell swaps (no re-onboarding) |
| F-080 Help & support / FAQ | ACCT-03 | ACCT-01 / error links | Self-serve answers + contact | ACCT-03 (unstuck) |

**Deferred by design (NOT in MVP — no screens, do not build):** F-002 optional email add/verify (V1.1) · F-028 similar rooms (V1) · F-029 recently viewed (V1) · F-031 search alerts — saved search + digest (V1) · F-064 push notifications (V1) · F-081 listing boost, paid 7-day placement (V1) · F-082 renewal bundles for multi-room owners (V1.1) · F-083 owner SaaS-lite, analytics+ templates (V2).

---

# SECTION 08 — NAVIGATION CONSISTENCY

The user must always know: Where am I? Why am I here? What can I do? What happens next?

## 8.1 Shells

| Shell | Structure | Screens |
|---|---|---|
| Public (guest) | Top bar: logo · city · Login. **No bottom nav** — CTA bands carry navigation | PUB-01…PUB-04, AUTH-01…AUTH-03 |
| Seeker | Top bar: context title · bell (badge) · mode chip. **Bottom nav 5:** Home (HOME-01) · Search (DISC-01) · Flatmates (DISC-03) · Chats (CHAT-01, badge = unread + pending requests) · Profile (PROF-02) | seeker surfaces |
| Owner | **Bottom nav 5:** Dashboard (HOME-02) · Listings (OWN-02) · Applicants (OWN-04, badge = New count) · Chats (CHAT-01, shared) · Profile (OWN-06) | owner surfaces |
| Wizard | Progress bar + step + [Save draft]; **no bottom nav**; exit = explicit Save & exit | ONB-01, ONB-02, VER-01, SAFE-02, OWN-01 |
| Push/detail | Top bar back; no bottom nav | PUB-03, ROOM-01, DISC-02, DISC-04, PROF-01, PROF-03, PREF-01, VER-02, SAFE-01, OWN-03, OWN-05, NOTIF-01, NOTIF-02, ACCT-01…ACCT-04 |
| Admin | Desktop left rail: Queues · Users · Metrics · Audit tail; separate session realm | ADM-01…ADM-09 |

## 8.2 Navigation rules (apply to every screen)

1. **One home per feature.** No duplicate entry points to the same function.
2. **Everything reachable in ≤3 taps** from its shell. No hidden features without a surface path.
3. **Back always preserves:** filters, scroll position, wizard steps, drafts, composer text. Losing user state on back is a defect.
4. **Auth walls carry context:** blocked action → signup → onboarding → the *original action auto-executes* (EC-05). The user never re-navigates manually.
5. **Notifications deep-link to the object** (CONN-01 row, CHAT-02 thread, OWN-04 stage) with expiry-aware fallback: object gone → state banner + nearest healthy screen, never a 404 (EC-12).
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
| App killed mid-wizard | All step data persisted; resume banner on HOME-01/HOME-02; wizard reopens at exact step (EC-01) |
| Session expiry | Re-auth via AUTH-02/AUTH-03; return to the exact deep-link target after |
| Notification tap on expired object | State banner + nearest healthy screen (EC-12) |
| Network loss mid-action | Optimistic UI + retry; nothing lost (EC-16/EC-17) |
| Login after suspension | Status screen + appeal; no app access (EC-20) |
| Login after grace-period deletion | AUTH-01 with "account deleted" notice |
| Reactivation | Exact prior state restored; listings re-validated honestly (EC-23) |

---

# SECTION 09 — SHARED UI / FUNCTIONAL COMPONENTS

Not a visual design system — the **functional consistency contract**. The same type of component behaves identically on every screen; visual drift between screens is a defect.

## 9.1 Shared functional components (build once, reuse everywhere)

| Component | Contract | Used on |
|---|---|---|
| **C-01 Listing card** | Photo (first = cover) · rent + **deposit always visible** · locality/room type · badge + freshness stamp on EVERY card · optional compat chip · save toggle. Self-sufficiency test: a screenshot alone communicates value + trust + freshness. Expired variant: dimmed photo, "expired Xd ago", CTAs disabled | PUB-01, PUB-02, HOME-01, DISC-01, DISC-04 |
| **C-02 Flatmate card** | Photo (blur per controls) · first name · age band · occupation · badge · score band + number (text, never colour-only) · 3 highest-signal attribute chips · 1-line why · day-fuzzed activity · [Connect] [View]. Low-match shown honestly with label | HOME-01, DISC-03, DISC-04 |
| **C-03 Connect intro-note sheet** | Anchor context locked ("About: 2BHK in HSR") · prefilled editable note ≤300 chars, contact patterns blocked · transparency line ("X sees your profile + this note") · [Send request]. Duplicate → "already requested" | ROOM-01, PROF-01 |
| **C-04 Contact-reveal consent card** | Platform-voice card: what is shared (number only) · with whom (this person) · pre-attached safety copy · [I'll share my number] [Not now]. Both consent required; decline hides CTA 7 days | CHAT-02 only |
| **C-05 Empty state** | One honest sentence why empty + one primary next action. Never blank, never dead-end | every list/feed |
| **C-06 Trust badge row (B-1…B-5)** | Icon + text (never colour-only); dates on tap ("ID verified Oct 2025"); absence renders nothing — no "unverified" scarlet letter (exception: the subtle safety chip in CHAT-02) | all cards/profiles/headers |
| **C-07 Auth-wall sheet** | Restates the ORIGINAL action ("You're one step from connecting about this room") · [Continue with phone] · reassurance line. Post-onboarding auto-executes the action (EC-05) | PUB-02, PUB-03 (all contact/save taps) |
| **C-08 Wizard skeleton** | Progress dots + "Step N of M" + [Save draft] · ONE question per view · "why we ask" microcopy on sensitive steps · [Skip] only where legal (consent steps never skippable; must-haves default off) · Back preserves; resume always | ONB-01, ONB-02, VER-01, SAFE-02, OWN-01 |

## 9.2 Component behaviour rules

| Element | Consistent behaviour |
|---|---|
| Header | Context title left; bell + mode chip/⋯ right; back arrow on push screens |
| Primary button | Exactly one per screen/state; state-aware label ("Connect" → "Open chat" when connected) |
| Secondary actions | Text buttons or overflow (⋯) — never a second shouting button |
| Cards | Self-sufficient (C-01 test); tap opens detail; destructive actions never on swipe — always overflow |
| Forms | Inline field-level validation; submit disabled while invalid; errors never clear input; submissions idempotent |
| Filters | Chips show active state; count always visible before applying (DISC-02 live count); back preserves |
| Tabs | State preserved per tab; badge counts consistent with source data |
| Lists | Skeleton loading; 20/page pagination or infinite scroll with skeletons; state chips for expired/filled/paused rows |
| Confirmation | Destructive or consequential actions (Select applicant, Remove listing, Ban, Delete account) always confirm with explicit consequence text |
| Error messages | Inline, actionable, named cause + fix; global errors offer [Retry] [Go home]; never dead-end |
| Loading | Skeletons matching final layout; ≤300ms perceived; no spinners for text |
| Success | Toast or inline confirmation; state visibly changes (row moves, chip updates) |
| Badges & trust | C-06 everywhere; compatibility bands always "band name + number" in text |
| Freshness stamp | "Confirmed Xd ago" on every listing touchpoint — cards, details, owner panels |
| System cards | Platform-voice inserts (safety, consent, masking) visually distinct from user content; never dismissible where safety-relevant |

---

# SECTION 10 — USER STATE CONTINUITY

A user's state must be identical no matter which screen renders it. One entity, one truth, every surface.

## 10.1 Account & onboarding states

| State | Meaning | Enforced everywhere by |
|---|---|---|
| Guest | No session | Public projections only; auth walls on contact/save (C-07) |
| Authenticated, onboarding incomplete | Role chosen, wizard unfinished | Onboarding guard: every protected route → resume wizard at exact step (EC-01); HOME-01/HOME-02 nag banner |
| Onboarded seeker | T1 profile | Seeker shell; T0-only nudge card until T2 |
| Onboarded owner | Role + property intent | Owner shell; unverified-publish banner until T3 |
| Both | Dual roles | Mode chip; per-mode route memory |
| Suspended | Enforcement action | Guard → status screen + appeal; listings unlisted; chats read-only for counterparties (EC-20) |
| Banned | Permanent enforcement | Full cascade: listings unlisted, applicants auto-closed, chats read-only, sessions revoked (EC-21) |
| Deactivated | Self-chosen pause | Everything hidden; login restores exactly (EC-23) |
| Deleted (grace) | 14-day window | Login cancels deletion; after grace: PII erased, messages anonymized |

## 10.2 Verification states (render identically on PROF-02, VER-02, cards, owner gates)

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
| Expiring (3d) | Normal card | Nudge + one-tap Renew (OWN-02/OWN-03) |
| Expired / Paused / Filled / Removed | State banner + similar rooms; saved rows labelled; deep links resolve to state, never 404 (EC-12) | Renew / Resume / Revive / state + reason (OWN-02/OWN-03) |

## 10.4 Connection & chat states

```text
Request: Pending → Accepted | Declined(silent) | Expired(14d) | Withdrawn
Accepted → Conversation: Active | Frozen(safety case, read-only) | Read-only(counterparty deleted/banned)
Reveal: Not requested → Requested → Consented(both) → Revealed(once, logged)
        Requested → Declined → CTA hidden 7 days
Block: mutual invisibility everywhere (feeds, search, chat list masked, requests filtered)
```

## 10.5 Cross-screen consistency checks (must all be true at once)

1. A T2-verified user shows the ID badge on their card in DISC-03, profile PROF-01, chat header CHAT-02, and owner pipeline OWN-04 — same date, same badge.
2. A listing that is Paused renders identically (state + no connect) in PUB-02/DISC-01 search, ROOM-01 detail, DISC-04 saved, and the owner's OWN-02/OWN-03.
3. An accepted connection opens the *same* chat from CONN-01, CHAT-01, ROOM-01 "Open chat", and the NOTIF-01 notification.
4. A declined connection hides the counterparty from DISC-03 for 90 days for the sender — but the sender's profile stays visible to others (state is directional).
5. A user who turns discovery off (ACCT-02) disappears from DISC-03 immediately, keeps pending requests, and remains reachable via their saved row in DISC-04 (marked).
6. A blocked pair sees each other nowhere — not in DISC-03, DISC-01 results, CONN-01, or CHAT-01.

---

# SECTION 11 — IMPORTANT BUSINESS / FUNCTIONAL RULES

The functional laws of the product. Each rule is testable; build-time violations are defects. Format: condition → user-visible behavior → result.

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

- **R-16** Contact details (phone/email/URL) are masked server-side in every surface, pre-connect *and* in chat text. The ONLY reveal path is the mutual-consent card in CHAT-02; the reveal is once, logged, and followed by the pre-meet safety card.
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

# SECTION 12 — LOADING / EMPTY / ERROR / SUCCESS / PENDING / RESTRICTED STATES

Every important non-happy state, defined centrally. Pattern: **STATE → what the user sees → what they can do → where they go next.** (Loading/inline-error/offline global defaults from Section 05 apply everywhere.)

| State | What user sees | What user can do | Where they go next |
|---|---|---|---|
| **Loading (any list/detail)** | Skeleton matching final layout | Wait; screen arrives ≤300ms perceived | — |
| **Empty results (search)** | Named cause: "no supply yet" / "filters too narrow: *rent*" / "must-haves exclude all" + fix | Waitlist + widen · one-tap relax filter · review must-haves | DISC-01 refined / AUTH-01 |
| **Empty feed (flatmates)** | "No candidates match yet — widen radius or relax a must-have" | Adjust chips | DISC-03 widened |
| **Empty saved / connections / chats / notifications** | Honest sentence + one browse/discover CTA | Tap CTA | DISC-01 / DISC-03 / DISC-04 |
| **Failed action (save/connect/send)** | Inline error, input preserved, idempotent retry | Retry / cancel | stay |
| **Network loss** | Offline banner where cached; optimistic send with retry where not | Retry | stay / PROF-02 |
| **Invalid input (forms)** | Field-level message naming the fix | Correct; submit unlocks | stay |
| **OTP wrong / expired / locked** | Inline retry → resend prompt → 30-min lock + support link | Resend / change number / support | AUTH-03 / AUTH-01 / ACCT-03 |
| **Verification pending** | VER-02 state card + SLA note; owner publish shows "prepare a draft now" | Wait, refresh | VER-02 / OWN-01 draft |
| **Verification rejected** | Reason code + human fix + [Resubmit] | Fix + resubmit | VER-01 |
| **Verification SLA breached (>24h)** | Apology banner + auto-priority | Wait / support | VER-02 |
| **Listing unavailable (expired/paused/filled/removed)** | State banner + similar rooms; deep links resolve to state, never 404 | Browse similar / renew path (owner) | DISC-01 / OWN-02 |
| **Listing flagged in review** | Owner: "Flagged — under review" state | Wait / edit per note | OWN-03 |
| **Connect unavailable** | "Already requested" (duplicate) / hidden counterparty (90d/declined) | Continue browsing | DISC-03 / DISC-01 |
| **Restricted action (suspended user)** | Status screen + appeal link; counterparties see frozen-thread notice | Appeal | state screen |
| **Blocked pair** | Mutual invisibility — feeds, search, requests, chats | (blocker: manage list V1) | — |
| **Frozen chat (safety case)** | Read-only banner with explanation | Wait for resolution / contact support | CHAT-02 read-only / ACCT-03 |
| **Counterparty deleted** | "Deleted account" read-only thread/row (30-day retention) | Archive / leave | CHAT-01 |
| **Reveal declined** | CTA hidden 7 days; neutral copy, no pressure | Keep chatting | CHAT-02 |
| **Message send failed** | Inline retry/delete on the bubble | Retry / delete | CHAT-02 |
| **Upload failed (verification/report)** | Guidance (size/type); nothing lost | Retry | stay |
| **Expired verification (12 months)** | Badge removed everywhere; re-verify prompt | Re-verify | VER-01 |
| **Successful completion (each core action)** | Visible state change: request appears in Sent · chat opens · listing Active · badges granted · "Filled" everywhere | Continue journey | next per Section 04 |

---

# SECTION 13 — CROSS-FEATURE FLOW CONSISTENCY

Features must chain into one coherent product, not mini-apps. These are the required seams — each is testable end-to-end.

| Seam | Chain that must work | Consistency guarantees |
|---|---|---|
| Discovery → Decision | DISC-01/DISC-03 → ROOM-01/PROF-01 → Connect sheet | Card data = detail data = sheet anchor (same listing/profile projection); compat chip equals the score explained on the detail |
| Decision → Connection | Connect sheet → CONN-01 pending → NOTIF-01 notification | One request, one state, visible from both sides; anchor text identical on sheet, CONN-01 row, chat header |
| Connection → Communication | Accept → CHAT-02 with anchor | Chat opens once (dedupe); anchor persists; badges in header match PROF-01 |
| Communication → Consent | CHAT-02 → consent card → reveal → safety card | Masking enforced up to mutual consent; reveal logged once; decline cooldown identical on both sides |
| Consent → Real world | Reveal → pre-meet card → off-platform | Platform steps out gracefully; safety copy matches SAFE-01 exactly |
| Real world → Outcome | Owner OWN-05 Select → fill cascade → OWN-03 Filled → seeker DISC-04 row "Filled" | One transaction: listing state, applicant closures, seeker-side labels all consistent |
| Owner supply → Seeker demand | OWN-01 publish → auto-checks → PUB-02/DISC-01 visible → freshness countdown | The listing seekers see is the listing the owner manages — same projection, same state chip |
| Trust → Everything | VER-01/VER-02 → badges → re-ranking → card/profile surfaces | Badge state is global and instantaneous (revocation included); T3 gate blocks OWN-01 publish everywhere |
| Safety → Everything | ⋯ Report on any surface → SAFE-02 → protections → ADM-07 → closure | Same flow from every entry; auto-protections apply per severity; reporter closure always sent |
| Preferences → Matches | PROF-02/PREF-01 edit → async recompute → HOME-01/DISC-01/DISC-03/OWN-04 updated | All score-bearing surfaces refresh from the same recompute; banner honesty while stale |
| Privacy → Surfaces | ACCT-02 controls → DISC-03 feed, PROF-01 profile, CHAT-02 header, PROF-03 preview | One control set governs every rendering; preview is provably faithful (same render path) |
| Account → Product | ACCT-01 role add → AUTH-04 → wizard; mode chip swaps shells | No re-signup, no data loss, per-mode route memory |
| Notifications → Object | NOTIF-01 row → CONN-01/CHAT-02/OWN-04/VER-02 deep link | Expiry-aware fallback always; badge counts agree with source data |
| Public → Authenticated | PUB-02/PUB-03 guest view → auth wall → same content authenticated | The authenticated projection contains everything the guest saw plus what trust now unlocks — never less |

**The single-product test:** a new user should be able to walk PUB-01 → outcome (Filled room or paired flatmates) touching every module without ever feeling the product changed shape. If any seam above fails, the product feels like separate apps — fix the seam, not the styling.

---

---

# SECTION 14 — DEVELOPMENT ORDER

Build in dependency order — nine phases organized by user/product dependency (not backend architecture). A phase starts only when the previous phase's completion condition passes. Screens reference Section 05; features reference Section 07; rules reference Section 11.

## Phase 1 — Foundation & authentication

| | |
|---|---|
| **Features** | Phone-first signup, login, OTP verification (T0), role & intent selection, sessions, route guards (auth + onboarding), design-system primitives per Section 09 (buttons, inputs, cards, banners, sheets) |
| **Screens** | AUTH-01 · AUTH-02 · AUTH-03 · AUTH-04 · ACCT-01 (stub) |
| **Dependencies** | None |
| **Why now** | Every journey passes through identity; guards and primitives are load-bearing for all later screens |
| **Unlocks** | Every protected screen in Phases 2–8 (nothing renders behind broken guards) |
| **Completion condition** | Signup→OTP→role runs green on staging; wrong/expired/locked OTP paths behave (EC-03); existing-phone path (EC-02); suspended-account guard (EC-20); sessions persist across restarts; guards redirect protected routes correctly |

## Phase 2 — Identity & profiles

| | |
|---|---|
| **Features** | Seeker + owner onboarding wizards, profile editing, 10-attribute lifestyle collection, completeness meter, photo upload, privacy & visibility controls, public preview |
| **Screens** | ONB-01 · ONB-02 · PROF-02 · OWN-06 · PROF-03 · ACCT-02 |
| **Dependencies** | Phase 1 (roles, guards, upload primitives) |
| **Why now** | Matching, discovery, and trust all consume the profile; privacy controls must exist before profiles become visible |
| **Unlocks** | Matchable T1 profiles — the substrate for compatibility (Phase 4), verification (Phase 5), and connections (Phase 6) |
| **Completion condition** | T1 profiles achieved; wizard resume after kill (EC-01); visibility rules honored on every projection (PROF-03 provably faithful); completeness math correct; EC-24 stale move-in re-confirm works |

## Phase 3 — Marketplace core (listings & search)

| | |
|---|---|
| **Features** | Listing creation (publish dev-gated until Phase 5 T3), listings lifecycle management, owner listing detail, public + authenticated search, public + authenticated detail, advanced filters, saved items, landing, public trust center, listing lifecycle state machine, freshness stamps, public projections + masking |
| **Screens** | OWN-01 · OWN-02 · OWN-03 · PUB-01 · PUB-02 · PUB-03 · PUB-04 · DISC-01 · ROOM-01 · DISC-02 · DISC-04 |
| **Dependencies** | Phase 2 (profiles); lifecycle + freshness fields |
| **Why now** | Supply and retrieval are the marketplace's body; every later feature hangs off listings |
| **Unlocks** | The anchor objects (listings) for evaluation, connections, chat, pipeline, and moderation; freshness automation (Phase 5) |
| **Completion condition** | Lifecycle transitions correct incl. illegal ones blocked; expired listings provably invisible everywhere (EC-12); masking proves no PII in any public payload; deposit visible on all surfaces (R-07); the three EC-14 zero-states behave |

## Phase 4 — Compatibility & discovery

| | |
|---|---|
| **Features** | Score engine (weights, bands, explanations per R-11…R-15), flatmate discovery, flatmate profile detail, personalized seeker home, preferences editing, must-have enforcement, match recompute on edits |
| **Screens** | DISC-03 · PROF-01 · HOME-01 · PREF-01 |
| **Dependencies** | Phase 2 attributes; Phase 3 surfaces to host scores |
| **Why now** | Profiles exist; this turns them into explained fit — the differentiator |
| **Unlocks** | Explained-fit surfaces that make Connect meaningful (Phase 6); the personalized daily home |
| **Completion condition** | Score vectors hand-recomputable; bands correct; explanations ≥2 drivers; must-haves bind before ranking (R-13); recompute ≤60s with honest banner (R-15); opted-out users never appear |

## Phase 5 — Trust layer (verification)

| | |
|---|---|
| **Features** | T2 + T3 submission, verification status machine, badge system (B-1…B-5), T3 publish-gate enforcement, freshness automation (Day-27 nudge, Day-30 expiry, 45-day auto-pause) |
| **Screens** | VER-01 · VER-02 (+ gates wired into OWN-01) |
| **Dependencies** | Phase 2 uploads; Phase 3 lifecycle; admin decision surface arrives Phase 8 (dev-gated until then) |
| **Why now** | Real publishing requires real verification; freshness automation must run before real supply arrives |
| **Unlocks** | The T3 publish gate (OWN-01 goes live); badges on every surface; hands-off freshness lifecycle |
| **Completion condition** | Unverified owner blocked end-to-end; rejected-once/twice paths (EC-07); SLA-breach state (EC-04); stamps correct after sweeps; badge revocation propagates instantly |

## Phase 6 — Connections & messaging

| | |
|---|---|
| **Features** | Connect flow + intro-note sheet (C-03), connections inbox, chat list, chat thread, masking service, mutual-consent reveal (C-04), in-chat risk cards, unread badges, rate limits, media limits |
| **Screens** | CONN-01 · CHAT-01 · CHAT-02 (+ connect sheet wired into ROOM-01/PROF-01) |
| **Dependencies** | Phases 3–4 (anchor objects); Phase 5 (badges in headers) |
| **Why now** | Decision surfaces exist; now the safe path from decision to conversation |
| **Unlocks** | The conversation layer the owner pipeline (Phase 7) and safety flows (Phase 8) operate on; consent-based contact reveal |
| **Completion condition** | Zero phone/email/URL patterns reachable in any payload pre-consent; consent + decline cooldown (EC-19); duplicate-request block (EC-10); message retry (EC-17); frozen-pair read-only |

## Phase 7 — Owner operations

| | |
|---|---|
| **Features** | Owner dashboard, applicant pipeline, applicant detail & compare, fill cascade, response-rate meter, listing analytics |
| **Screens** | HOME-02 · OWN-04 · OWN-05 |
| **Dependencies** | Phase 6 (chat); Phase 5 (freshness + gates) |
| **Why now** | Connections exist; owners need structured management instead of inbox chaos |
| **Unlocks** | The outcome closure path (fill cascade) and the owner reputation loop (response rate) |
| **Completion condition** | Stage machine incl. illegal transitions blocked; fill cascade transactional (listing + applicants + seeker labels consistent — R-09); EC-26 concurrent moves safe; a seeded owner journey publish→fill runs green end-to-end |

## Phase 8 — Safety, admin console & notifications

| | |
|---|---|
| **Features** | Report/block with auto-protections, safety center, admin login + queues (verification, moderation, reports, users), severity SLAs, audit log, notifications center + settings, help & support, deactivation/deletion |
| **Screens** | SAFE-02 · SAFE-01 · ADM-01 · ADM-02 · ADM-03 · ADM-04 · ADM-05 · ADM-06 · ADM-07 · ADM-08 · NOTIF-01 · NOTIF-02 · ACCT-03 · ACCT-04 |
| **Dependencies** | All user-facing surfaces exist to moderate; Phase 5 verification data for queues |
| **Why now** | The promise (safety, verification SLA) needs its operations; notifications and account lifecycle complete the product |
| **Unlocks** | Enforceable trust & safety promises (SLA drills, cascades), the notification return loop, and dignified exits — the launch gates of Phase 9 |
| **Completion condition** | Report → protection → disposition → closure trace passes; S1/S2 <12h SLA drill (a reported listing unlisted <12h in staging); ban cascade completeness (EC-21); audit completeness; EC-27 clean dismissal |

## Phase 9 — Hardening & launch readiness

| | |
|---|---|
| **Features** | Accessibility pass (WCAG 2.1 AA, 44px targets, badges never colour-only), performance budgets, security suites (authorization matrix, masking, rate limits, audit verification, PII lifecycle), legal text (ToS/Privacy), content seeding (PUB-04/SAFE-01/ACCT-03), founder ops rehearsal, seed supply (verified owners + listings), end-to-end journey automation, ADM-09 metrics prepared (V1) |
| **Screens** | Polish across all 48 MVP screens; ADM-09 built for V1 |
| **Dependencies** | Phases 1–8 |
| **Why now** | Everything works; now it must be *dependable, legal, and launchable* |
| **Unlocks** | Launch — the product ships when every gate below passes |
| **Completion condition** | Full journeys (Section 06 flows) green; Section 16 checklist passes on every screen; launch gates: every rule in Section 11 has a passing test · every EC verified · masking suite proves zero contact-data leakage pre-consent · freshness automation provable · report SLA drill passed · seed supply live (fresh, verified listings visible in guest search) |

---

# SECTION 15 — FEATURE COMPLETION DEFINITION

A feature is **complete** only when the entire chain below holds — a working UI alone is never "complete":

```text
Requirement → User flow → Screen → Interaction → Business rule → State handling
→ Navigation → Persistence/continuity → Permission → Error handling
→ Cross-feature integration → Acceptance criteria
```

Operationally, every link above must be true:

1. **Correct screen** — it lives on its Section 07 home surface (no orphan, no duplicate home).
2. **Correct placement** — block order and CTA position match the Section 05 functional wireframe.
3. **Correct interaction** — every Section 05 action row behaves as specified (action → response → state → next).
4. **Correct navigation** — all Section 04 arrows wired; back/exit behaviour per Section 08.
5. **Correct states** — loading, empty, error, success, and every signature state from the screen's Section 05 state table implemented (including its named edge cases).
6. **Correct functional behaviour** — the Section 11 rules the feature touches hold, with tests.
7. **Correct persistence** — survives refresh, back-navigation, and app kill (drafts, filters, scroll, composer).
8. **Correct permissions** — server-side enforcement of role/verification/privacy state; client mirrors only.
9. **Correct error handling** — the relevant Section 12 rows behave as defined; no dead ends.
10. **Complete journey** — the feature's Section 06 flow runs end-to-end from its entry to its outcome, including failure branches.
11. **Acceptance verified** — the feature's acceptance criteria pass on staging (mapped per phase in Section 14 completion conditions).

**Rule of thumb:** if a reviewer can break the journey by refreshing, rotating, going back, losing network, or acting as the *other* user — the feature is not complete.

---

# SECTION 16 — SCREEN ACCEPTANCE CHECKLIST

Run for every screen before its phase exit (and again at launch). Adapt by adding screen-specific items from the screen's Section 05 state table; never remove items.

```text
[ ] Correct screen structure (blocks in Section 05 wireframe order)
[ ] Correct components (Section 09 contracts; shared components used, not rebuilt)
[ ] Correct content (all mandatory facts present: e.g. deposit, freshness, badges)
[ ] Correct entry (all Section 05 entry points land here correctly)
[ ] Correct actions (every Section 05 action row: action → response → state → next)
[ ] Correct next screen (all Section 04 arrows from this screen wired)
[ ] Correct back behaviour (state preserved: filters/scroll/drafts/composer)
[ ] Loading state (skeleton, ≤300ms perceived, no layout jump)
[ ] Empty state (honest sentence + one next action — never blank)
[ ] Error state (inline, actionable, input preserved, idempotent retry)
[ ] Success state (visible state change + defined next step)
[ ] Permission/state handling (guest/auth/role/verification/privacy guards render correctly)
[ ] Signature edge states (screen's Section 05 states + listed ECs verified)
[ ] Journey works end-to-end (screen's Section 06 flow passes with real data)
[ ] Consistency spot-check (identical component behaves identically as elsewhere — Section 09.2)
[ ] Accessibility (44px targets, labels, focus order, contrast, badges not colour-only)
[ ] Analytics event (screen view + named interactions firing)
[ ] No dead ends (every terminal state offers a next action)
```

**Screen-specific additions (quick reference):**

| Screens | Extra validations |
|---|---|
| PUB-02 / PUB-03 / DISC-01 / ROOM-01 / DISC-04 | Deposit visible; freshness stamp; expired-state degradation (EC-12); masking on public projections |
| AUTH-01 / AUTH-02 / AUTH-03 | EC-02 dedupe; EC-03 lockout; rate limits; context preservation (EC-05) |
| ONB-01 / ONB-02 / OWN-01 | Draft resume (EC-01); per-step validation; OWN-01: T3 gate + duplicate sheet (EC-11) |
| DISC-03 / PROF-01 | Must-haves bind pre-ranking; low-match labelled; blur/visibility honored; EC-08 cooldowns |
| VER-01 / VER-02 | EC-04 SLA; EC-06 upload; EC-07 reasons/cooling; document retention promise |
| CONN-01 / CHAT-01 / CHAT-02 | EC-08/09/10/13/17/19; masking everywhere; reveal only via C-04; frozen read-only |
| SAFE-02 / SAFE-01 | EC-09 dedupe; block default; reference ID; SLA copy matches ADM-07 reality |
| OWN-02…OWN-05 | Freshness lifecycle exactness (R-05); fill cascade transactional; EC-12/21/26 |
| ACCT-01…ACCT-04 | EC-23 restore; EC-02 phone change; 14-day grace messaging |
| ADM-01…ADM-08 | Audit on every action; reason mandatory; signed-URL re-fetch; TOTP lockout |

---

---

# SECTION 17 — FINAL MASTER FLOW MAP

The whole product at a glance. Three lanes: the seeker spine, the owner spine, and the cross-cutting trust/safety rails that serve both.

```text
=====================================================================
 ENTRY
=====================================================================
PUB-01 Landing ── "Find a room" ──► PUB-02 Public search ──► PUB-03 Masked detail
     │                                                        │
     └── "I have a room" ──► AUTH-01 Signup ◄── AUTH WALL (context kept)
                                    │ phone + consent
                                    ▼
                              AUTH-03 OTP ── T0 granted
                                    │
                                    ▼
                              AUTH-04 Role? ─────────────┐
                                    │                    │
        ┌───────────────────────────┘                    ▼
        ▼                                           OWNER LANE
   SEEKER LANE                                          │
        │                                               ▼
        ▼                                          ONB-02 Owner wizard
ONB-01 Seeker wizard (6 steps, resumable)               │
        │                                               ▼
        │                                          VER-01 Verification (T2+T3)
        │                                               │ submit
        │                                               ▼
        │                                          VER-02 In review (<24h)
        │                                               │ approved
        │                                               ▼
        │                                          OWN-01 Listing wizard ── Publish
        │                                               │                │ (T3 gate)
        │                                               ▼                ▼
        │                                          HOME-02 Dashboard ◄── Active
        │                                               │
        ▼                                               ▼
HOME-01 Seeker Home ◄───────── login default ──────► OWN-04 Pipeline
   ┌─────┴────────┐                                   │ cards
   ▼              ▼                                   ▼
DISC-01        DISC-03                           OWN-05 Evaluate
Search         Flatmates                              │ compare ≤3
   │ filters   │ must-haves bind                      │
   ▼           │ first-name basis                     ▼
ROOM-01        ▼                                   SELECT
Detail      PROF-01                                   │ fill cascade
   │        Profile                                    ▼
   │ facts +    │ why-this-match                 OWN-03 Mark Filled
   │ owner trust│                                (hidden everywhere,
   ▼            ▼                                others closed)
 CONNECT ◄─────┘
   │ intro note
   ▼
CONN-01 Connections ── pending
   │ accepted (or declined: silent, 90d)
   ▼
CHAT-02 Chat Thread ── context anchor
   │ numbers masked always
   │ "Share phone number" → mutual consent?
   │   yes → revealed once + pre-meet safety card
   │   no  → CTA sleeps 7 days, chat continues
   ▼
 OFF-PLATFORM MEETING (by design) ──► outcome feeds owner lane above

=====================================================================
 CROSS-CUTTING RAILS (all roles, from any screen)
=====================================================================
 TRUST:   any "Verify" CTA ──► VER-01 ──► VER-02 ──► badges B-3/B-4
          → re-ranked with trust weight (seeker cards, owner gates)
 SAFETY:  ⋯ Report anywhere ──► SAFE-02 (reason → evidence → block)
          → auto-protections ──► [ADM-07 triage <12h] ──► closure notice
          SAFE-01 Safety Center always one tap away
 RETURN:  AUTH-02 Login ──► HOME-01/HOME-02 ──► NOTIF-01 ──► deep link
          stale move-in? ──► PREF-01 re-confirm ──► matches recompute
 ACCOUNT: ACCT-01 Settings ──► roles / NOTIF-02 / ACCT-02 privacy
          ──► PROF-03 preview / ACCT-03 help / ACCT-04 deactivate·delete
 ADMIN:   ADM-01 ──► ADM-02 queues ──► ADM-03/04 verify · ADM-05/06 moderate
          ──► ADM-07 reports · ADM-08 users ──► ADM-09 metrics (V1)
=====================================================================
```

**Reading the map:** vertical = journey progress; horizontal rails = the promises (trust, safety, return, account) that apply everywhere. Every arrow exists as a specified transition in Sections 04–06. If a build implements this map faithfully, the product is NestMate.

---

# SECTION 18 — OPEN DECISIONS

These are the only points where the approved product documentation does not settle the behaviour. Per the OPEN DECISION convention, nothing here was silently invented: each item records what is unclear, the conflicting definitions found in the source material, a recommended resolution for the product owner to confirm or override, and the impact of leaving it unresolved. **Resolve (or consciously defer) every OPEN DECISION before the affected screens are built** — everything else in this document is buildable as written.

### OD-01 — PUB-02 empty-state CTA vs. deferred alert capability

- **What is unclear:** when public search returns zero results, the empty-state CTA funnels the guest into signup with the search context carried (EC-05) — but what exactly auto-executes after onboarding at MVP?
- **Conflicting definitions:** the empty-state design promises "get alerts for this search", while saved-search alerts are a deferred V1 capability (F-031) in the approved feature register.
- **Recommended resolution:** at MVP, label the CTA "Save this search" — the search persists across sessions (DISC-04-adjacent behaviour), and the post-onboarding auto-action confirms the save. When F-031 ships, saved searches convert to alerts with no migration needed.
- **Impact if unresolved:** minor — one empty-state CTA's post-onboarding behaviour on PUB-02.

### OD-02 — PROF-03 public preview: render a compatibility score?

- **What is unclear:** should the public profile preview show a compatibility score, and if so, against what?
- **Conflicting definitions:** a draft wireframe showed a score ("what a viewer scores") inside the preview; the matching documentation defines scores as pair-specific and symmetric (a score requires two real profiles), and the component contract C-02 mandates text-based, honestly-labelled scoring.
- **Recommended resolution:** render no score in PROF-03. The preview demonstrates exactly how badges, blur, and masking render — provably faithful without inventing a counterparty.
- **Impact if unresolved:** minor — one content block on the preview screen.

### OD-03 — OWN-01: do edits to an Active listing re-enter moderation?

- **What is unclear:** when an owner edits a listing that is already Active, do the changes go live immediately or re-enter Pending review?
- **Conflicting definitions:** the trust documentation's lifecycle implies immediate go-live with post-hoc moderation sampling; the moderation workflow implies listed content is reviewed before changes appear.
- **Recommended resolution:** edits to Active listings go live immediately and enter the post-hoc sampling stream; moderation retains full unlist authority (R-25 audit applies). This preserves freshness honesty — owners must never be afraid to keep listings current.
- **Impact if unresolved:** moderate — owner editing latency vs. moderation safety; affects OWN-01/OWN-03 state tables and ADM-05 sampling.

### OD-04 — OWN-04: is pipeline stage movement forward-only?

- **What is unclear:** can owners move an applicant backward between stages (e.g., Chatting → Shortlisted), or only forward?
- **Conflicting definitions:** the pipeline documentation defines forward stage semantics with terminal Rejected/Withdrawn exits but never states whether backward moves are legal; no source shows a backward move.
- **Recommended resolution:** forward-only at MVP. Rejected and Withdrawn are terminal; an owner who changes their mind re-engages via a fresh connect request (subject to the same consent rules).
- **Impact if unresolved:** minor — interaction rules of the applicant pipeline (OWN-04/OWN-05).

### OD-05 — Is there a post-Selected "Moved in" pipeline stage?

- **What is unclear:** does the owner-facing pipeline track a "Moved in" stage after Select, or does Select + fill cascade remain terminal?
- **Conflicting definitions:** the owner product documentation mentions post-selection tracking; the target pipeline specification and fill cascade end at Selected → Filled.
- **Recommended resolution:** MVP ends at Select + fill cascade (R-09). A "Moved in" tracker is a post-launch enhancement, not a build requirement.
- **Impact if unresolved:** minor — one optional stage card on OWN-04.

### OD-06 — Post-expiry renewal duration

- **What is unclear:** how long does a renewal last, and how long after expiry can an expired listing still be renewed?
- **Conflicting definitions:** the rules register defines renewal as one tap granting +30 days; the trust documentation grants a 7-day window for already-expired listings before they leave the renew path.
- **Recommended resolution:** adopt both, as a two-window model — renewal always grants +30 days from confirmation; the one-tap renew remains available for 7 days after expiry; after that the listing moves to the auto-paused/revive path instead.
- **Impact if unresolved:** moderate — freshness-rule consistency across OWN-02/OWN-03, seeker-facing banners, and FLOW-10.

### OD-07 — CONN-01 standing navigation path

- **What is unclear:** is there a standing navigation path to Connections beyond the Home pill, notification deep links, and the post-connect landing?
- **Conflicting definitions:** sources name "pill, deep link, nav" as entry points, but the fixed 5-tab bottom navigation (both shells) has no Connections slot, and no source defines what the third "nav" path is.
- **Recommended resolution:** document the complete entry set as it exists: Home pill, notification deep links, and post-connect landing — no bottom-nav slot at MVP. If connection volume justifies it later, the Chats tab can absorb a requests badge (already specified) rather than a new tab.
- **Impact if unresolved:** minor — one entry-point definition in CONN-01 and Section 08.

**Reconciled during writing (no product decision needed — recorded for transparency):** freshness-stamp surfaces use the union PUB-02 · PUB-03 · HOME-01 · DISC-01 · ROOM-01 (per R-06 "every listing touchpoint") · reveal precondition adopted as "≥2 exchanges" (messaging documentation, over the journey doc's "≥1") · owner strike ladder phrased as "third strike escalates to account-level review" (compatible with both sources) · dual-role switch mapped to ACCT-01 → AUTH-04 · AUTH-04 skip lands on HOME-01 with seeker defaults (wireframe documentation is primary) · DISC-04 has no bottom nav (push/detail shell rule) and uses overflow-remove instead of swipe (Section 09.2 rule).

**Residual boundaries (deliberate):** visual styling, database schemas, API specifications, and infrastructure are intentionally unspecified here — they belong to the build's technical tracks and must never override this document's functional contracts. Where a technical constraint conflicts with a rule in Section 11, Section 11 wins and the conflict is escalated to the product owner before deviating. Analysis of the existing codebase lives exclusively in the separate forensic audit.

---

# SECTION 19 — FINAL BUILD READINESS CHECK

## 19.1 The readiness test

Imagine handing three inputs to the coding agent (Cursor, Claude Code, or any build agent):

| Input | The question it answers |
|---|---|
| **Forensic audit** | What exists today |
| **This Build Bible** | **What should the finished product do, and how should the user experience it?** |
| **Codebase** | What can be reused, modified, fixed, or replaced |

This document has been checked against that division of labour: it contains no description of the current implementation, no comparison with it, and no adjustment based on it. It defines the target product only — the screens that must exist, the journeys that move through them, the actions, states, rules, and the order of construction. Reconciliation between the three inputs is the first act of the development phase, not part of this document.

## 19.2 Final audit against the document's own standard

### Product Coverage

- **Are all major features represented?** Yes — all 75 MVP features from the approved register (F-001…F-080 minus the five deferrals) are mapped to screens in Section 07; the eight deferred features (F-002, F-028, F-029, F-031, F-064, F-081…F-083) are named and excluded with their version ladder.
- **Does every feature have screens?** Yes — each Section 07 row names its screens, entry point, primary action, and completion screen; no orphan features, no duplicate homes (R-28).
- **Does every screen have a purpose?** Yes — all 49 screens carry the 12-part specification in Section 05, each beginning with Purpose and ending with Completion Criteria.

### Flow Coverage

- **Can the user move from start to finish?** Yes — Section 04 defines the master journey plus eleven role/state journeys and the nine-branch coverage table (4.13); Section 06 defines thirteen end-to-end flows with entry, preconditions, steps, outcomes, and exits.
- **Are there dead ends?** No — every terminal state offers a next action (Section 12's success row, Section 09's C-05 empty-state contract, and each screen's Section 05 action table enforce this).
- **Are entry and exit points defined?** Yes — Section 03 is the master index (Entry From / Next Screens per screen); Section 06 flows restate them in sequence.

### State Coverage

- **Are important loading/empty/error/success/pending/restricted states covered?** Yes — global defaults head Section 05; every screen defines its relevant states; Section 12 is the centralized non-happy-path matrix covering the full state vocabulary (loading, empty, error, success, pending, rejected, restricted, expired, disabled, incomplete, suspended, deleted, blocked, frozen, unavailable); all 28 edge-case behaviours (EC-01…EC-28) are carried into the relevant screens.

### Consistency

- **Does user state remain consistent?** Yes — Section 10 defines account, verification, listing, connection, chat, and block state machines with six cross-screen consistency checks that must hold simultaneously.
- **Do related screens agree with each other?** Yes — Section 13's fourteen named seams each carry explicit consistency guarantees; the single-product test frames the acceptance bar.

### Navigation

- **Can the user always understand where they are?** Yes — Section 08 fixes the shell model (public, seeker 5-tab, owner 5-tab, wizard, push/detail, admin rail) and twelve navigation rules.
- **Can they return safely?** Yes — back behaviour preserves filters/scroll/drafts/composer; interrupted journeys and session restoration are tabulated (Section 08.3); deep links have expiry-aware fallbacks.

### Development Readiness

- **Could a developer understand what needs to be built — and in what order?** Yes — Section 14 gives nine dependency-ordered phases, each with features, screens, dependencies, why-now, what it unlocks, and a completion condition; Sections 15–16 operationalize "done".
- **Could an AI coding agent follow the document without guessing major product behavior?** Yes — with one caveat: the seven OPEN DECISIONs in Section 18 must be answered (or consciously deferred) before the affected screens are built. Everything else is specified.

---

# FINAL BUILD BIBLE STATUS

| Dimension | Coverage |
|---|---|
| **Screen coverage** | 49/49 screens specified (48 MVP + ADM-09 in V1) — area-prefixed IDs, unique and stable; every screen carries the full 12-part specification (Purpose · User Context · Entry Points · Functional Wireframe · Components · Content · User Actions · Navigation · Screen States · Business Rules · Cross-Screen Dependencies · Completion Criteria); legacy S/NM mapping retained in Section 03.17 for traceability |
| **Journey coverage** | Master journey + 11 role/state journeys (new seeker, flatmate-first seeker, owner onboard, owner pipeline, connected users, returning, verified, incomplete, pending, rejected, restricted) + the nine-branch coverage table (4.13); 13 end-to-end flows (FLOW-01…13) each with start, preconditions, steps, screens, outcomes, exits |
| **Feature coverage** | 75/75 MVP features mapped in Section 07 (no orphan features, no duplicate homes, no undefined completion screens); 8 deferred features explicitly listed with version ladder (F-002, F-028, F-029, F-031, F-064, F-081…F-083) |
| **State coverage** | Full state vocabulary — loading, default, empty, error, success, pending, rejected, restricted, expired, disabled, incomplete, suspended, deleted, blocked, frozen, unavailable — via Section 05 global defaults + per-screen state tables + the centralized Section 12 matrix |
| **Edge-case coverage** | EC-01…EC-28 all referenced in the screens, flows, and state tables that own them; interrupted onboarding, expired OTP, duplicate accounts, stale preferences, expired listings, connection expiry/rejection, blocks, reports, verification rejection/resubmission, suspension, deletion, deleted counterparties, network failure, and notifications to unavailable content all have defined behaviours |
| **Navigation coverage** | 6 shells defined; 12 navigation rules; back behaviour, modal discipline, mode switching, deep links with expiry-aware fallbacks, auth-wall context carrying, and the interrupted-journey / session-restoration table (Section 08.3) |
| **Cross-feature coverage** | 14 named seams in Section 13 with explicit consistency guarantees + the single-product test; the ten critical seams (profile→preferences→matching→discovery, discovery→listing→connection→chat, chat→consent→reveal, trust→badges→every surface, safety→report→admin→resolution, notifications→deep link→object, account→role→mode→shell, public→auth→same object+more, real world→outcome, preferences→matches) all verified end-to-end |
| **Development-order coverage** | 9 dependency-ordered phases, each with Features · Screens · Dependencies · Why now · Unlocks · Completion condition — "what do I build next?" is answerable from Section 14 alone |
| **OPEN DECISIONS count** | **7** (OD-01…OD-07, Section 18) — each with conflicting definitions, a recommended resolution, and impact; no other gaps were found where the documentation was silent |
| **Final readiness status** | **LOCKED — ready for the development reconciliation phase.** Hand this document to the coding agent together with the codebase and the forensic audit; resolve the 7 OPEN DECISIONs with the product owner before (or during) the build of the affected screens; build in Section 14 order; test per Sections 15–16 |

*This document is the single Product Build Bible for NestMate. Build it in order; test it as specified; ship it honest.*
