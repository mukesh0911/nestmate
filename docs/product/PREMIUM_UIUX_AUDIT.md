# NESTMATE — PREMIUM UI/UX AUDIT REPORT

**Date:** 2026-08-24 · **Mode:** AUDIT ONLY — zero code modified
**Evidence base:** Direct inspection of `App.tsx`, `Layout.tsx`, `LandingPage.tsx`, `HeroMatchShowcase.tsx`, `PricingPage.tsx`, `RoomCard.tsx`, `tailwind.config.js`, plus repo-wide pattern greps (gradients/glass/radius/shadows/emoji) across all pages and components.

---

## 1. Executive Summary

NestMate's **information architecture and interaction logic are sound** — routing, guards, empty/loading states, mobile bottom nav, sticky CTAs, and truthful trust signals are all real and functional. The product does not feel premium because of a **visual-language problem, not a structural one**:

1. **Two competing design systems coexist** (shadcn HSL tokens + ~20 hardcoded ad-hoc colors) producing inconsistent surfaces.
2. **Every surface is maximally decorated**: 22–24px radii everywhere, glassmorphism on 30+ elements, layered shadows (`shadow-2xl` on ordinary cards), gradient headers on every page, translucent pills stacked on card corners.
3. **Emoji is used as primary iconography** in onboarding and success states (`🎉` with `animate-bounce`), which reads childish against the otherwise editorial serif typography.
4. **Typography hierarchy is inverted-feeling**: an italic serif display face (Playfair Display) is applied to *every* heading including small labels, while body metadata competes via bold uppercase micro-labels — nothing reads quiet.
5. **Trust signals are visually noisy**: verified/freshness/status badges each carry their own pill treatment (border + shadow + blur + color), so trust becomes clutter instead of confidence.

The fix is **subtraction and systemization**, not new features: consolidate tokens, demote decoration, promote typography and whitespace. The existing component skeleton can absolutely carry a premium redesign without a rewrite.

---

## 2. Current Product Experience

The app today behaves like a **well-engineered startup template**: every screen has the right content and the right states, but every element shouts. Cards float on heavy shadows, corners are uniformly maximal-round, the serif-italic voice appears on everything from the hero headline to FAQ answers' containers, and celebratory emoji punctuates flows. The result is "friendly demo" rather than "trusted marketplace." Mature marketplaces earn premium perception through restraint: one accent color doing real work, flat confident surfaces, disciplined type scale, and trust shown once, clearly.

---

## 3. Screen Inventory

### Public
| Route | Screen | Primary purpose | Primary CTA | Notes |
|---|---|---|---|---|
| `/` | LandingPage | Convert visitors | "Get Started — It's Free" / hero Search | Split hero + showcase, cities grid, banners, pricing, footer |
| `/login`, `/signup` | AuthPage (+AuthModal) | Authenticate | Email/Google/Phone/demo | Split layout w/ dark brand panel |
| `/phone-login`, `/otp-verify` | PhoneLogin / OTPVerify | Phone auth | Verify | Dev test-number panel visible |
| `/role-select` | RoleSelect | Choose seeker/owner | Two large cards | Clean |
| `/pricing` | PricingPage | Explain plans | Get Started Free | Honest post-Sprint 4C |
| `/how-it-works` | HowItWorks | Educate | Get Started | Gradient-mesh step cards |
| `/about` | AboutUs | Company story | — | Gradient header |
| `/privacy`, `/terms` | PrivacyPolicy (both) | Legal | — | `/terms` reuses privacy content |

### Seeker
| Route | Screen | Primary purpose | Primary CTA |
|---|---|---|---|
| `/onboarding` | SeekerOnboarding | 10-question lifestyle quiz | Next |
| `/dashboard` | SeekerDashboard | Matches + saved | View match / connect |
| `/explore` | ExplorePage (tabs rooms/roommates) | Discovery | View room/profile |
| `/map` | MapView | Geographic discovery | Open listing |
| `/room/:id` | RoomDetail | Listing decision | Express interest |
| `/match/:id` | MatchDetail | Person decision | Send connect request |
| `/profile`, `/edit-profile` | ProfilePage / EditProfile | Identity + verification | Complete profile |
| `/chat/:id`, `/connections` | ChatPage / connections list | Communicate | Send message |
| `/settings` | SettingsPage | Account controls | — |
| `/notifications` | NotificationsPage | Activity feed | — |

### Owner
| Route | Screen | Primary purpose | Primary CTA |
|---|---|---|---|
| `/owner-onboarding` | OwnerOnboarding | Listing setup quiz | Next |
| `/owner-dashboard` | OwnerDashboard | Listing health + applicants | Review applicants |
| `/create-listing`, `/edit-listing/:id` | EditListing | Create/manage listing | Publish/Save |
| Shared | MatchDetail, ChatPage, Profile, Settings | Same as seeker | — |

### Admin/dev (NOT consumer UI)
`/admin/*` (Layout, Dashboard, Users, Listings, Verifications, Reports, Marketplace, Notifications, Settings) — dark `#0F172A` shell, correctly separate. `/dev/seed` DEV-only.

---

## 4. Visual Maturity Analysis

### A. Typography — **NEEDS IMPROVEMENT**
- Display: Playfair Display *italic* applied to nearly every heading (`font-display italic` in Landing, Pricing, About, Privacy, HowItWorks, dashboards). Italic serif at small sizes (FAQ h2 `text-2xl italic`) loses authority.
- Body: Inter/Sora — fine, but weight usage is extreme: `font-extrabold`, `font-bold` on micro-labels (`text-[10px] font-extrabold uppercase tracking-widest`) creates constant shouting.
- No enforced scale: sizes jump `text-[10px] → text-xs → text-sm → text-lg → text-3xl/4xl/5xl` with no documented rhythm; metadata often bolded rather than de-emphasized.

### B. Spacing — **ACCEPTABLE**
- Section rhythm on marketing pages is generous (`py-20 sm:py-28`). Card padding varies `p-3 → p-4 → p-5 → p-6 → p-8 → p-12` without rules.
- Cramped spots: RoomCard corner badge stack; OwnerDashboard 4-up glass stat tiles (`p-2/p-3` inside image overlay).

### C. Components — **NEEDS IMPROVEMENT**
- Buttons: `btn-fire/btn-outline/btn-navy/btn-teal` exist, but pages also hand-roll buttons with bespoke radius/shadow (`rounded-xl shadow-md hover:shadow-lg`), so CTA weight is inconsistent within single screens.
- Modals: at least 4 hand-rolled modal shells (SettingsPage, SeekerDashboard compat modal, AuthModal, admin drawers) with different overlays (`bg-black/60`, `bg-ink/60`, `bg-ink/40`, `bg-slate-900/40`).
- Badges/chips: no shared chip primitive; every badge re-implements pill styling.

### D. Visual language — **IMMATURE**
- Radius: `rounded-3xl`(24px), `rounded-[22px]`, `rounded-t-[20px]`, `rounded-2xl`(overridden to 22px), `rounded-full` pills — five competing large radii.
- Shadows: `shadow-2xl` on standard cards (Landing search box, HeroMatchShowcase card, mock checkout, ChatPage modal); arbitrary shadows `[0_8px_40px_rgba(0,0,0,0.10)]`, `[0_10px_35px_rgba(255,90,54,0.18)]`; defined tokens `shadow-card/lift` barely used.
- Glassmorphism: `backdrop-blur-*` on 30+ surfaces — nav, image badges, stat tiles, modals, map panels. Overused to the point of noise.
- Gradients: `gradient-dark` header band repeated on Landing/Pricing/About/Privacy/HowItWorks; `gradient-mesh-fire` decorative mesh; `gradient-fire` logo tiles; `bg-gradient-to-br from-white to-cream` card washes.
- Color: parchment/ink/fire/navy/teal/cream/gold + legacy `brand.*` palette + slate/gray/emerald/amber Tailwind defaults all appear; border colors alone span `border-border`, `border-slate-100`, `border-gray-150`, `border-gray-200`, `border-slate-200`.

---

## 5. Why the Current UI Feels Immature/Funky

Specific causes, each evidenced:

1. **CURRENT:** Emoji as iconography — onboarding question icons are emoji (`SeekerOnboarding QUESTION_ICONS`: 🥂✨💻🐾…), completion screens use `text-6xl animate-bounce 🎉`, "Premium Active 🎉", "🚀 Development Mode", "🎯 10-dimension lifestyle matching".
   **PROBLEM:** Emoji rendering varies by OS, cannot be art-directed, and reads consumer-app-childish. Combined with serif italics it produces a "greeting-card" voice.
   **PREMIUM DIRECTION:** Replace all UI emoji with the existing Lucide set at consistent stroke width; celebrate completion with composition/motion, not emoji.

2. **CURRENT:** Maximal rounding everywhere (22–24px cards, full-pill everything).
   **PROBLEM:** Uniform maximum radius removes hierarchy — nothing feels precise; template-like.
   **PREMIUM DIRECTION:** A strict radius ladder (e.g., 8/12/16px; full only for avatars/dots); reserve large radius for exactly one hero surface per screen.

3. **CURRENT:** Layered elevation — `shadow-2xl` + border + gradient wash + blur on the same card (HeroMatchShowcase, Landing search box, checkout modal).
   **PROBLEM:** Everything floats; the eye has no anchor; feels "sticker-sheet."
   **PREMIUM DIRECTION:** Flat-first: hairline borders for most surfaces; one shadow token reserved for true overlays (modals, drawers).

4. **CURRENT:** Glassmorphism saturation (nav `frosted-glass`, image-corner badges `bg-white/90 backdrop-blur-md`, dashboard stat tiles `bg-white/10 backdrop-blur-md`).
   **PROBLEM:** Blur is expensive and visually busy; translucent-on-photo badges reduce legibility of the most important trust info.
   **PREMIUM DIRECTION:** Solid surfaces over imagery with strong contrast; blur only for the fixed nav and modal scrims.

5. **CURRENT:** Italic serif on every heading + bold uppercase micro-labels everywhere.
   **PROBLEM:** No typographic quiet zones; hierarchy by decoration instead of size/weight discipline.
   **PREMIUM DIRECTION:** Serif italic restricted to 2–3 hero moments per session; all other headings in the sans at disciplined weights (500–700); micro-labels regular-weight with letter-spacing.

6. **CURRENT:** Badge proliferation on RoomCard — flatType pill (top-left), Verified pill (offset `left-20`), photo-count chip (bottom-left), save button (top-right), freshness badge on detail — each with own border/shadow/blur/color.
   **PROBLEM:** Trust info becomes confetti; nothing stands out.
   **PREMIUM DIRECTION:** Max two overlays per image corner; unified badge primitive; verification as a single quiet mark.

7. **CURRENT:** Every page opens with the same dark-gradient hero band (Pricing/About/Privacy/HowItWorks).
   **PROBLEM:** Repetitive template signature; heavy dark blocks make the product feel themed rather than designed.
   **PREMIUM DIRECTION:** Light editorial page headers; dark reserved for the landing hero and CTAs.

8. **CURRENT:** Dual palettes (`fire/navy/teal/gold` + legacy `brand.orange/brand.navy/brand.teal`) both live in components.
   **PROBLEM:** Near-duplicate hues drift apart across screens.
   **PREMIUM DIRECTION:** One canonical palette; delete or alias the legacy set.

---

## 6. Trust & Marketplace Perception

Existing mechanisms (all real): phone verification, work-email + Govt-ID admin review ladder (`trustSignals`, `TrustBadge`), freshness badge (`listingFreshness`), compatibility % with reasons (`compatibility`, `matchWhy`), consent-based contact sharing, owner response analytics, applicant ranking explanation.

Assessment:
- **Too noisy:** TrustBadge popover + card pills + detail-page banner repeat the same facts 3× per session.
- **Buried where it matters:** On RoomCard, "Verified" is a tiny emerald pill squeezed beside the flatType pill; on OwnerDashboard, availability/status pills use translucent emerald/amber-on-photo treatments that are hard to read.
- **Confusing:** Freshness badge uses emerald vs amber with uppercase tracking-widest micro-copy — users can't tell what "fresh" certifies.
- **Appropriately subtle:** Compatibility radial on MatchDetail (good pattern worth keeping).
- **Not fabricated:** Post-Sprint 4A–4C, no fake counts/testimonials remain — the foundation for honest trust presentation is clean.

**Verdict:** Trust data quality is high; trust *presentation* is the problem — unify into one quiet, consistent system.

## 7. Information Hierarchy

- **RoomDetail:** Photo gallery dominates ✅; price/availability sticky panel ✅; trust banner sits between gallery and details — acceptable; secondary amenities compete via equal card weights. Mostly correct hierarchy — best-structured screen.
- **MatchDetail:** Identity + compatibility lead ✅; "why matched" reasons box uses a tri-color gradient background (`from-fire-light via-amber-50 to-teal-light`) that decorates the single most important rational piece of information — should be the calmest element, not the loudest.
- **SeekerDashboard:** Best-match hero card uses `gradient-dark` + fire border + white text — three emphasis devices at once; saved/tab lists then reuse similar card weights, flattening distinction between "decision needed" and "browsing."
- **OwnerDashboard:** Stat tiles overlaid on the listing photo (glass) put metrics above the asset itself; applicants section (the actual task) arrives below the fold on desktop.
- **Landing:** Hero headline → search box → actions order is correct; but 4 consecutive full-width sections (cities, banners, how-it-works, features) have identical visual weight — no breathing hierarchy.

## 8. CTA / Conversion Analysis

| Screen | One action? | Assessment |
|---|---|---|
| Landing | Yes — Search/Get Started | Clear, though 5 button styles appear above the fold (btn-fire ×2, btn-outline ×2, teal demo chip) |
| Explore | Yes — open a result | Filter entry could be stronger on mobile |
| RoomDetail | Yes — Express interest | Strong: sticky mobile bottom bar ✅ |
| MatchDetail | Yes — Send request | Floating mobile action bar ✅ |
| SeekerDashboard | Muddled — browse vs saved vs connect tabs compete | Needs a single "next best action" |
| OwnerDashboard | Muddled — stats first, applicants second | Primary task (review applicants) should lead |
| Pricing | Yes — Get Started Free | Now honest post-4C |
| Onboarding | Yes — Next | Progress affordance present |

CTA wording is consistent ("Get Started", "Express Interest"). Disabled states exist. Mobile CTAs are thumb-reachable (bottom bars). Main gap: **dashboard screens lack a single dominant next action.**

## 9. Navigation Analysis

- Desktop: fixed top nav with scroll-state frost transition; active states present; dropdown for user menu. Sound.
- Mobile: bottom tab bar (56px, ≥44px targets) + slide-down menu. Sound.
- Issues:
  - Duplicate paths to the same places (nav links + in-page CTAs + footer) without clear primacy — typical template behavior.
  - Label inconsistency: "Find Rooms & Flats" (hero tab) vs "Browse All Rooms" (button) vs "Explore rooms" (city cards) — three names for one destination.
  - No breadcrumbs on deep screens (RoomDetail relies on browser back); back behavior works but feels unanchored.
  - Route transitions: `page-transition` class exists but application is inconsistent across pages.
  - Admin shell is appropriately separate (dark sidebar) — do not consumerize it.

## 10. Mobile Audit

Strengths: dedicated bottom nav, sticky action bars (RoomDetail, MatchDetail), bottom-sheet drawers (vaul Drawer in SeekerDashboard, filter drawer in BrowseRooms), `pb-safe`/`pt-safe` handling, AuthModal slides from bottom on mobile.

Gaps:
- **Shrunk-desktop patterns:** Landing pricing grid goes 1-col but keeps desktop card anatomy (badge floating `-top-3` clips on narrow screens); OwnerDashboard desktop sections stack without mobile-specific density.
- **Image-overlay legibility:** glass badges over photos at small sizes fail contrast (emerald-500/20 text-emerald-300 on unknown imagery).
- **Touch targets:** some inline icon buttons (chat message actions, card save at `w-9 h-9`=36px) sit below 44px.
- **Map:** bottom sheet card is good; center-target control labeled "Center 🎯" uses emoji.
- **Chat:** functional; input area safe-area handled; message bubble styling inconsistent with rest of system (uses `rounded-[22px]` modal, its own grays).
- **Keyboard:** forms scroll adequately (`max-h-[90dvh] overflow-y-auto` on AuthModal); onboarding steps are short — low risk.

## 11. Desktop Audit

- Content max-widths vary: `max-w-5xl` (pricing), `max-w-6xl` (landing sections), unconstrained (dashboards use their own grids) — no single container system.
- Dashboards feel stretched: OwnerDashboard's `min-h-[280px]` filler sections create artificial emptiness; SeekerDashboard list view handles width well.
- RoomDetail's 2-col (gallery + sticky sidebar) is genuinely good desktop composition.
- Large-screen whitespace on Explore is fine; MapView full-bleed is appropriate.
- Marketing pages balance well; the repeated dark hero bands are the main desktop immaturity signal.

## 12. Component Consistency

Duplicated/inconsistent implementations found:
- **Modals:** ≥4 shells (AuthModal, SettingsPage delete, SeekerDashboard compat, BrowseRooms filter, admin drawers) with different scrim colors, radii, and animations.
- **Badges/chips:** every instance hand-styled; no `<Badge>` primitive despite TrustBadge existing as a component.
- **Buttons:** utility classes + hand-rolled mixes.
- **Empty/loading:** `StateEmpty`/`StateLoading` exist and are widely used ✅ (a real strength), but some screens still hand-roll skeletons (BrowseRooms shimmer vs BrowseSeekers skeleton cards).
- **Cards:** `card-nestmate` / `card-nestmate-hover` utilities exist but many screens bypass them with raw `bg-white rounded-3xl border-slate-100`.
- **Iconography:** Lucide throughout ✅ except emoji incursions (onboarding, celebrations, dev panels).
- **Border colors:** 5 different gray/slate/border tokens in active use.

**Verdict:** ~70% of a design system exists (tokens file, card/button/empty-state utilities, TrustBadge, StateEmpty/Loading, PageShell). It behaves like one system in structure but not in surface styling.

## 13. Design System Audit

**What already works (preserve):**
- Tailwind config with semantic tokens (`parchment/ink/fire/navy/teal/cream/gold`), font stacks, `shadow-xs/card/lift`, keyframes library.
- shadcn-style HSL variable layer (border/input/ring/background…) — ready-made theming hook.
- Component primitives: PageShell, StateEmpty, StateLoading, TrustBadge, ProfileCompleteness, RoomCard, LocationAutocomplete.
- Layout shell: responsive nav + bottom bar + safe-area utilities.

**Inconsistent:** dual palettes, dual radius systems (CSS var `--radius` vs hardcoded overrides `'2xl': '22px'`), shadow token vs arbitrary shadows, border-color sprawl.

**Missing:** Badge/Chip primitive, Modal/Drawer primitive (single implementation), Tooltip, unified form-field component, documented type scale, focus-ring token usage.

**Should be standardized eventually:** one radius ladder, one elevation policy, one border color, one palette source-of-truth, one modal system.

**Feasibility:** The app can reach premium quality **without a rewrite** — primitives exist; the work is consolidation + restraint passes per screen.

## 14. Screen-by-Screen Scores

| Screen | Visual | UX clarity | Trust | Consistency | Mobile | Overall |
|---|---|---|---|---|---|---|
| Landing | 6 | 7 | 7 | 6 | 7 | 6.5 |
| Auth / RoleSelect | 6 | 7 | 6 | 6 | 7 | 6.5 |
| Seeker Onboarding | 4 | 6 | 5 | 5 | 6 | 5 |
| Owner Onboarding | 4 | 6 | 5 | 5 | 6 | 5 |
| Explore (rooms/seekers) | 6 | 7 | 6 | 6 | 7 | 6.5 |
| MapView | 6 | 6 | 6 | 6 | 7 | 6 |
| RoomDetail | 7 | 8 | 7 | 7 | 8 | 7.5 |
| MatchDetail | 6 | 7 | 7 | 6 | 7 | 6.5 |
| SeekerDashboard | 5 | 6 | 6 | 5 | 6 | 5.5 |
| OwnerDashboard | 5 | 5 | 6 | 5 | 5 | 5 |
| EditListing | 5 | 6 | 5 | 5 | 5 | 5 |
| Profile / EditProfile | 5 | 6 | 6 | 5 | 6 | 5.5 |
| Chat | 5 | 6 | 6 | 5 | 6 | 5.5 |
| Pricing / static pages | 5 | 7 | 6 | 5 | 6 | 5.5 |
| Notifications / Settings | 5 | 6 | 5 | 5 | 6 | 5.5 |

Rationale: scores capped by decoration noise and inconsistency, not by missing functionality. RoomDetail leads because its hierarchy and sticky conversion pattern are genuinely right.

## 15. P0/P1/P2/P3 Priority Matrix

**P0 — Must fix (blocks premium perception at first touch)**
1. Remove emoji from all consumer UI (onboarding icons, celebration screens, dev-mode panels leaking into styled UI, "Center 🎯").
2. Consolidate radius to a 3-step ladder; eliminate `rounded-[20/22px]` arbitraries and uniform `rounded-3xl`.
3. Single badge/chip primitive; max 2 overlays per card-image corner; solid (non-glass) trust badges.
4. Typography discipline: restrict serif-italic to hero moments; kill bold-uppercase micro-label spam; define type scale.
5. Elevation policy: replace `shadow-2xl`-everywhere with border-first surfaces; shadows only for true overlays.

**P1 — High impact**
6. Unify modal/drawer into one primitive (scrim, radius, motion).
7. Retire legacy `brand.*` palette; single border color.
8. Dashboard hierarchy: single dominant next-action per dashboard; move OwnerDashboard applicants above stats.
9. MatchDetail "why matched" panel: calm neutral surface (it's the rational core).
10. Standardize page-header pattern (retire repeated dark gradient bands on inner pages).
11. Touch targets ≥44px; fix glass-badge contrast over photos.

**P2 — Medium**
12. Unified skeleton system; consistent container widths; route-transition consistency.
13. Chat visual alignment with system; map control polish.
14. Form field primitive for onboarding/editing screens.
15. Landing section rhythm variation (break the identical-band monotony).

**P3 — Polish**
16. Micro-interactions (restrained), reduced-motion support audit, illustration direction (replace emoji moments with one commissioned illustration style if desired), favicon/social-card art direction.

## 16. Target Premium Design Language

- **Personality:** "Calm rental intelligence" — editorial warmth (parchment, ink, one fire accent) executed with marketplace precision. Confident, quiet, trustworthy; warmth comes from color temperature and copy, not decoration.
- **Typography:** Inter for everything operational; Playfair Display italic reserved for ≤3 hero headlines per session (landing H1, maybe pricing H1). Scale: 12/14/16/20/24/32/48 with 1.5 body line-height; metadata = regular weight, muted color, never bold-uppercase unless a legal eyebrow.
- **Color:** Ink (#1A1A2E) text, parchment (#F7F3ED) canvas, white surfaces, fire (#E5501A) strictly for primary actions and one accent per view, navy for secondary/info, teal exclusively for verification/trust semantics, gold retired or reserved for premium-only. Semantic greens/ambers only for status, never decoration.
- **Spacing:** 4px base grid; section rhythm 64/96px; card padding 20/24px; one container system (max-w-6xl marketing, max-w-5xl forms, full-bleed map).
- **Cards:** White, 1px `--border`, 12–16px radius, no shadow at rest; hover raises border contrast + `shadow-xs`. One hero card per screen may use 16px + `shadow-card`.
- **Radius ladder:** 8 (inputs, small chips), 12 (buttons, cards), 16 (hero surfaces/modals), full (avatars, dots, progress). Nothing else.
- **Borders/shadows:** Hairline borders define structure; shadows communicate z-height only (modal/drawer/popover = `shadow-lift`; everything else flat).
- **Imagery:** Real listing photography dominant, edge-to-edge in media zones with 0 radius inside cards (media bleeds to card edge); city/editorial imagery self-hosted eventually; no stock-smiling-people collages.
- **Icons:** Lucide only, 1.5px stroke, 16/20/24px sizes; never mixed with emoji; single accent color per icon context.
- **Buttons:** Three verbs only — Primary (fire, solid), Secondary (ink outline), Ghost (text). One primary per view. Height 44/48px; full-width on mobile action bars.
- **Forms:** 48px inputs, 8px radius, label-above, error-below in destructive red with icon; single field component everywhere.
- **Navigation:** Keep current IA; refine labels to one verb per destination ("Explore rooms"); persistent bottom bar mobile; breadcrumbs optional on detail screens; active state = fire text + 2px underline/bar, not pill backgrounds.
- **Dashboards:** Task-first: the single next action is the largest element; stats become a quiet strip (numbers + labels, no boxes-over-photos); sections separated by whitespace, not nested cards.
- **Marketplace/listings:** Photo-led cards, price + location as the only bold text, one trust mark, freshness as a subtle dot+label; filters in a proper bottom sheet (mobile) / sidebar (desktop).
- **Trust signals:** One system: teal = verified fact, shown once per context, always same shape; explanations live in one tap (existing TrustBadge popover pattern is right — extend it, don't duplicate it).

## 17. Patterns to Avoid

All observed in-repo; none hypothetical:
- Emoji as UI iconography or celebration (onboarding, completions, dev panels).
- `animate-bounce`/`animate-pulse` on celebratory content.
- Glassmorphism beyond nav + modal scrims (no glass badges/tiles).
- Stacked translucent status pills over photography.
- `shadow-2xl` on non-overlay surfaces; arbitrary one-off shadows.
- Multiple gradients per screen (`gradient-dark` + `gradient-mesh-fire` + `gradient-fire` + `to-br` washes).
- Italic serif below ~24px.
- Bold uppercase tracking-widest micro-labels as a recurring device.
- Five competing gray border tokens.
- Decorative hover-scale on informational elements (`hover:scale-105` on onboarding icons).
- Any fabricated social proof/statistics (already eliminated — keep it that way through the redesign).

## 18. Recommended Redesign Sequence

1. **Foundation:** Consolidate tokens (palette dedupe, radius ladder, shadow policy, type scale, border color) in `tailwind.config.js` + `index.css`; add Badge/Button/Modal/Field primitives. Zero visual change intent — enables everything after.
2. **Shell:** Layout nav (de-frost default state, label cleanup, active states), page-header pattern replacing dark bands.
3. **First impression:** Landing hero + section rhythm; HeroMatchShowcase restraint pass.
4. **Discovery:** ExplorePage + RoomCard (badge unification, card anatomy) + filters sheet.
5. **Decision:** RoomDetail (already strongest — light-touch alignment) then MatchDetail (calm the why-panel).
6. **Matching/applicants:** SeekerDashboard + OwnerDashboard task-first restructure; applicant cards.
7. **Identity/trust:** Profile, EditProfile, TrustBadge system unification, ProfileCompleteness.
8. **Forms/onboarding:** Field primitive rollout; replace emoji steps; completion states without bounce/emoji.
9. **Communication:** Chat + notifications alignment.
10. **Mobile refinement pass:** touch targets, sticky bars, sheet behaviors, image-overlay contrast.
11. **Accessibility + polish:** focus rings, contrast audit, reduced-motion, final consistency sweep.

Each phase depends on the previous: primitives before screens, shell before pages, discovery before decision screens (highest traffic order), dashboards after patterns proven on public surfaces.

## 19. Protected Systems

The redesign MUST NOT modify: `matching.ts`, `calculateCompatibility`, freshness policy (`listingFreshness.ts` semantics), marketplace visibility (`marketplaceVisibility.ts`), demo quarantine (`demoUsers.ts`), trust authorization model (rules + `adminKeys`/verification flow), Firestore/Storage security rules, analytics privacy model (`analytics.ts` taxonomy), listing attribution (`connection.listingId` logic), connection authorization (`connectionGuards`).

UI may **consume** all existing data and must **not fabricate** any new data. All Sprint 4 truth constraints (honest CTAs, Coming Soon disclosures, no superlatives) carry forward unchanged.

## 20. FINAL UI/UX REDESIGN SPECIFICATION — Implementation Principles

1. Subtract before adding: every redesign change should remove a decoration more often than it adds one.
2. One palette, one radius ladder, one shadow rule, one border color, one badge shape — enforced via primitives, not per-screen judgment.
3. Fire orange = action only. Teal = verified trust only. Never decorative.
4. Serif italic is a hero voice (≤3 uses/session), never a label voice.
5. Flat-first surfaces: hairline borders for structure; shadows exclusively communicate overlay depth.
6. Photography is the hero of marketplace surfaces; chrome around it stays minimal and solid.
7. Every screen declares ONE primary action; dashboards lead with the task, not the metrics.
8. Trust appears once per context, in one visual shape, with depth available on tap.
9. Zero emoji in consumer UI; Lucide-only iconography at fixed stroke widths.
10. Motion is feedback, not entertainment: 150–250ms ease-out transitions; nothing bounces, floats, or pulses idly.
11. 44px minimum touch targets; WCAG AA contrast for all text and image overlays.
12. Truth constraints from Sprints 4A–4C are immutable design requirements, not suggestions.