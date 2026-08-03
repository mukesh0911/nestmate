# NestMate — Product Research Brief (Phase 1)

> **Role**: Head of Product Design  
> **Date**: 2026-08-03  
> **Sources**: `docs/01_PRODUCT`, `docs/02_REQUIREMENTS`, `docs/03_USER_EXPERIENCE`, `PROJECT_STATUS.md`, `MOBILE_DESIGN_AUDIT.md`, `app/src/App.tsx`  
> **Rule**: No assumptions beyond documented product truth. No UI drawing in this phase.

---

## 1. Product vision

> *Every person in India moving to a new city should find a compatible, trustworthy roommate — not just a room — within 48 hours.*

NestMate is a **compatibility-first** roommate platform for urban India. It is **not** a classifieds board. The core product thesis: roommate search is a **matching problem** (lifestyle + trust), not a real-estate transaction.

**Mission pillars (product doc):**
1. Trust-centric — multi-tier verification (Phone → Profile → Work Email → Government ID)
2. Compatibility-driven — 10-question lifestyle quiz → scoring algorithm
3. Role-aware — Seeker vs Owner experiences
4. Zero-friction — one-tap connect, realtime chat, mutual phone-share protocol

**USP:** “Compatibility, Not Just Availability.”

---

## 2. User goals

### Personas (from UX doc)

| Persona | Role | Primary goal | Emotional job |
|---------|------|--------------|---------------|
| **Rohan** (25, IT relocator) | Seeker | Compatible flatmate near office, fast | End FB-group anxiety; feel “this person will work” |
| **Divya** (24, designer) | Seeker (safety-first) | Female-only / verified / safe society | Feel protected before revealing identity |
| **Priya** (28, has room) | Owner | Verified, neat, lifestyle-fit roommate | Avoid another messy/party mismatch |
| Admin | Ops | Moderation / verification | Out of redesign consumer scope |

### Psychographics
- Smartphone-first, digitally native
- Safety, cleanliness, lifestyle fit matter more than “deal hunting” alone
- Willing to spend 5–10 min on quiz for better matches
- Budget-conscious quality: ~₹8k–₹25k/mo
- Cities: Chennai, Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR

---

## 3. Primary user journeys (as shipped)

### Strategy locks (must preserve in redesign)
| Rule | Status |
|------|--------|
| Guests browse/search/filter/view public profiles without login | Locked |
| Auth only on account actions (connect, chat, save, listing, profile, PII) via `openAuthModal` + redirect | Locked |
| Demo only on explicit Demo CTA — never auto-login | Locked |

### Journey A — Guest discovery → intent
Landing `/` → Browse rooms `/browse-rooms` or seekers `/browse-seekers` → Room `/room/:id` or Match `/match/:id` → **Connect/Save** → Auth modal → Login/Demo → Role/Onboarding if needed → Dashboard.

### Journey B — Seeker: match → connect → chat
Onboarding (photo → profile → city/budget → 10 quiz) → Dashboard matches → Compatibility story → Connect → Accept → Chat `/chat/:roomId` → Mutual phone share.

### Journey C — Owner: list → applicants → chat
Role “I Have a Room” → Profile + listing onboarding → Owner dashboard → Review applicants + scores → Accept → Chat → Visit arrange.

### Journey D — Shared authenticated
Chat, Profile, Edit profile, Settings, Notifications, Map.

**Admin / seed:** redesign out of scope.

---

## 4. Emotional experience (design target)

| Desired feeling | Anti-feeling |
|-----------------|--------------|
| Calm confidence (“I can decide safely”) | Dating-app swipe anxiety |
| Warm residential hospitality | Purple SaaS / startup template |
| Trust earned through quiet signals | Badge sticker-sheet noise |
| Progress toward “move-in together” | Infinite admin dashboard scrolling |
| Belonging / compatibility story | Spreadsheet of lifestyle rows |

Emotional north star: **Airbnb exploration calm + Revolut trust restraint + Notion density control** — applied to roommate matching, not cloned.

---

## 5. Trust signals (product)

| Signal | Where it appears today | Design implication |
|--------|------------------------|--------------------|
| Trust badges (Bronze → Pro) | Cards, profile, chat | One clear tier mark; don’t pile with 5 other badges |
| Shield / ID / work email icons | Profiles | Visible but secondary to face + name + score |
| Compatibility % | Cards, detail | Primary decision number; story > table |
| Active status | Cards | Quiet (dot + short text) |
| Gender / verified-only filters | Browse / dashboard | Discoverable without filter wall |
| Mutual phone consent | Chat protocol | Privacy as feature, not legal footer |
| Guest browse before auth | Public routes | Trust through transparency — see value first |

---

## 6. Business goals (from product doc)

| Goal | Metric | Target |
|------|--------|--------|
| Acquisition | MAU | 10K by Month 6 |
| Engagement | Connection requests / user / month | ≥3 |
| Matching quality | Chat after connect | ≥60% |
| Trust | Verified profiles % | ≥40% |
| Retention | D30 | ≥25% |

**Funnel KPIs:** Signup→Onboarding ≥75% · Onboarding→First match view ≥90% · Match→Connect ≥40% · Connect→Chat ≥60% · Chat→Phone share ≥30%.

**Design impact on business:**
- Landing calm + search-first → acquisition & first browse
- Match/Room detail clarity + one CTA → connect rate
- Chat chrome calm → chat after connect
- Verification visibility without clutter → verified % aspiration
- Shorter onboarding *feel* (progressive) → onboarding completion

---

## 7. Current UX debt (mobile audit + live product)

NestMate already has distinctive brand (parchment/fire/Lora+Sora), guest browse, and functional shells. On mobile it still often reads as **dense SaaS ported to phone**, not calm consumer.

**Top debt (priority for redesign):**
1. Dual chrome (top bar + bottom nav) steals content
2. Match/Room detail overload — can’t answer “connect?” in one glance
3. Badge / meta pile-up on cards
4. Landing first viewport overload (mitigated partially; still not search-only calm)
5. Seeker dashboard = desktop residue
6. Compatibility as wide table / fitness-gauge motif
7. Tiny type (`9–10px`), heavy shadows, marketing pulse
8. Owner dashboard CRM density
9. Long onboarding (19 steps) — functional but heavy emotional load

**Keep:** Brand palette & type, guest/auth/demo strategy, media-first browse rooms, shared empty/skeleton patterns, soft button press.

---

## 8. Design opportunity statement

Redesign NestMate as a **premium consumer matching product** whose first-session story is:

1. Search / discover a place or person (calm, media-led)
2. Understand compatibility + trust in one glance
3. Connect with one clear CTA (auth if needed)
4. Chat safely toward a real move-in

Everything else (filters, full breakdown, settings, charts) is **progressive disclosure**.

---

## Exit

Phase 1 complete. Proceeding to Phase 2 (competitive UX) per execution mandate.
