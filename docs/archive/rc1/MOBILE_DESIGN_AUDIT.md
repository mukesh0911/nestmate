# NestMate — Mobile Design Audit

> **Date**: 2026-08-03  
> **Scope**: Mobile experience (&lt;768px) only  
> **Status**: Audit complete — **awaiting approval before redesign**  
> **Constraints**: No guest/auth/demo strategy changes. Preserve brand tokens (parchment / fire / ink / Lora + Sora). No feature work.

Inspiration studied for *feel*, not branding: Airbnb (media-first discovery), Apple (quiet hierarchy), Notion (calm density), Spotify (focused primary action), Linear (precision + motion), Stripe / Revolut (trust through restraint).

---

## Executive verdict

NestMate already has a recognizable identity and solid functional mobile shells (bottom nav, safe areas, auth gating). On a phone it still reads as a **dense SaaS dashboard ported to small screens**, not a **calm consumer app**.

Premium products feel intentional because they:
1. Show one dominant job per screen  
2. Use white space as structure  
3. Prefer photography / large type over chrome  
4. Collapse secondary UI into sheets  
5. Use fewer borders and softer elevation  

NestMate currently does the opposite on several key mobile surfaces: stacked cards, competing CTAs, tiny type (`text-[9px]`–`text-[10px]`), badge piles, and horizontal-scroll tables.

---

## What already feels premium (KEEP)

| Asset | Why it works | Where |
|-------|----------------|-------|
| Brand palette | Warm parchment + fire is distinctive and residential; not purple-SaaS | `tailwind.config.js`, `index.css` |
| Lora italic + Sora | Display serif gives hospitality character | Global headings |
| Guest browse + auth-on-action | Airbnb-like exploration before commitment | Public routes + `openAuthModal` |
| Explicit Demo only | Trustworthy; not trap-demo | Bottom nav / AuthModal |
| Browse rooms media grid | Closest to consumer discovery (image-first cards) | `BrowseRooms.tsx` |
| Shared `StateEmpty` / skeletons | Consistency after polish pass | Shared components |
| Soft press on `btn-fire` | Micro-feedback exists | `active:scale-[0.98]` |

---

## What feels outdated / template-like

| Pattern | Why it hurts | Evidence |
|---------|--------------|----------|
| Marketing eyebrow pills + “#1” claims | Startup landing template; Apple/Stripe lead with quiet confidence | Landing hero pill + pulse Sparkles |
| Double CTA after hero search | Startup landing template; Apple/Stripe lead with quiet confidence | Landing action row under search — **mitigated on mobile** (Browse/Flatmates `sm+` only; Demo kept) |
| Desktop dashboard compressed onto phone | Sidebar hidden, but main column still “admin panel” dense | `SeekerDashboard` — tabs, sorts, featured card, grid, map preview stacked |
| Orange gradient profile hero + circular % gauge | Mid-2010s “fitness app” motif; Revolut/Linear prefer sparse headers | `MatchDetail` hero + gauge |
| Compatibility as wide table | Forces horizontal scroll on phone — spreadsheet, not product | `MatchDetail` `min-w-[500px]` |
| Heavy `shadow-2xl` / multi borders | Chrome loudness; premium apps use 1 elevation system | Hero search card, modals |
| `text-[9px]` / `text-[10px]` labels | Feels cramped and “admin UI” | Filters, badges, owner stats |
| Decorative floating hearts / overlays | Visual noise without decision value | MatchDetail decorative Heart |

---

## What feels cluttered

### 1. Dual navigation chrome
Fixed **top** bar (logo + menu + bell) **and** **bottom** tab bar always visible. Premium consumer apps usually pick one primary chrome on mobile (Spotify/Airbnb: bottom; Apple Mail: minimal top). Result: ~128px+ chrome + safe area steals content.

### 2. Match / room detail information architecture
On mobile, MatchDetail sequences: hero card → “why compatible” card → full breakdown table → more sections → sticky dual CTA. Too many nested white/orange cards. User cannot answer “should I connect?” in one glance.

### 3. Badge and meta pile-up
Verified, compatibility %, online pulse, lifestyle chips, shared-count badges on match cards. Hierarchy collapses into a sticker sheet.

### 4. Landing first viewport overload
Eyebrow + long headline + paragraph + search card (tabs + 2 fields + button) + secondary buttons + social proof. Airbnb mobile hero is closer to: destination intent + one search surface.

**Partial fix (2026-08-03):** Mobile layout bugs from screenshot fixed surgically — showcase scrollbar (`scrollbar-hide`), Connect CTA 2-row layout, chip `line-clamp-2`, social-proof wrap, Browse/Flatmates hidden on xs (search tabs + Instant Demo remain). Full “search-only hero” calm still open.

### 5. Owner dashboard density
Listing hero + property switcher chips + applicants list + chart + quick actions — all card wrappers. Feels like a CRM.

---

## Typography & hierarchy

| Issue | Impact |
|-------|--------|
| Too many weight/size steps without a scale | Screen feels busy, not calm |
| Italic display used everywhere | Loses specialness (Notion uses one strong title, rest quiet) |
| Body and meta both muted gray at tiny sizes | Hard to scan primary facts (rent, name, score) |
| CTA label noise (“Connect & Chat”, “Express Interest”, “Share Phone”) | Primary action unclear |

**Target hierarchy (proposal):**  
1 title · 1 primary fact · 1 supporting line · 1 primary CTA · rest deferred.

---

## Navigation critique

| Element | Critique |
|---------|----------|
| Bottom tabs (4–5 items) | Correct pattern, but labels truncate; guest “Demo” as a tab confuses product vs auth |
| Top hamburger + bottom tabs | Redundant for guests/seekers |
| “+ Post Room” hidden on smallest phones (`hidden sm:flex`) | OK, but no mobile-equivalent in bottom sheet |
| Active state (fire + top hairline) | Fine; could be quieter (filled icon only, like iOS) |

**Direction:** Make bottom nav the sole primary chrome on mobile; slim top to logo + one utility (search or notifications). Defer Demo to modal entry points, not a perpetual tab (or restyle as “Sign in” with secondary Demo inside sheet — *strategy still: Demo only on explicit tap*).

---

## Search & filter critique

| Surface | Critique |
|---------|----------|
| Landing search | Good start; too boxed; secondary browse buttons dilute |
| BrowseRooms pill | Strong Airbnb cue — keep, refine |
| Seeker filters in drawer | Functional but long form; needs sticky “Apply” and progressive disclosure |
| Map search | Utility-first; list empty states still thin |

**Direction:** One persistent filter chip row; sheet for advanced; never open full desktop filter wall on mobile.

---

## Empty / loading / motion

| State | Current | Premium gap |
|-------|---------|-------------|
| Empty | Shared StateEmpty — good base | Needs one illustration/tone + single CTA (not generic icon circle only) |
| Loading | Mix of spinner + shimmer | Prefer content-shaped skeletons everywhere; kill full-page spinner when list exists |
| Motion | `page-transition` fade-up | Needs intentional sheet/slide for filters; list item press; avoid pulse on marketing |

---

## Screen-by-screen notes (mobile)

| Screen | Feels | Change |
|--------|-------|--------|
| Landing | Busy marketing site | One hero job: search; defer social proof below fold |
| Seeker dashboard | Dashboard | Media-first match feed; collapse stats into header strip |
| Browse rooms | Closest to premium | Keep grid; tighten meta; stronger image ratio |
| Browse seekers | Form + cards | List rows with large avatar; one score; one CTA |
| Match detail | Overloaded | Photo/header → 3 reasons → Connect; breakdown in sheet |
| Room detail | Long scroll | Gallery-first; sticky price + CTA; details accordion |
| Chat | Acceptable | Full-bleed bubbles; quieter chrome; larger composer |
| Notifications | OK | List rows without heavy card frames |
| Profile / Settings | Settings-app OK | Grouped lists, fewer nested cards |
| Auth modal | Busy but clear | Two-step: Sign in vs Demo roles |
| Map | Tool-like | Larger bottom sheet for results |

---

## Ranked redesign priorities (impact on first impression)

1. **Mobile shell chrome** — Reduce dual nav; calm bottom bar; content-first.  
2. **Match / Room detail IA** — One scroll story + one primary CTA.  
3. **Seeker home feed** — Image-led cards; remove desktop residue.  
4. **Landing mobile first screen** — Search as sole hero action.  
5. **Typography scale** — Fewer sizes; ban sub-11px for primary UI.  
6. **Elevation / borders** — One shadow token; fewer boxed sections.  
7. **Filter sheets** — Progressive, sticky apply, chip summary.  
8. **Motion & empty** — Sheet transitions; richer but quieter empties.

---

## What must NOT change

- Guest browse / filter / public profiles without login  
- Auth only on connect / chat / save / listing / profile / PII  
- Demo only on explicit Demo control  
- Brand colors fire / parchment / navy / Lora+Sora  
- Existing flows and Firebase behavior  
- Desktop layouts (mobile-first CSS / variants only; no desktop regression)

---

## Proposed design principles (for implementation phase)

1. **One job per screen**  
2. **Content over chrome**  
3. **Large type, sparse labels**  
4. **Sheets over stacked cards**  
5. **One primary CTA**  
6. **Photography / people before badges**  
7. **Calm motion (200–280ms)**  

---

## Next step

Await approval to implement a **phased mobile redesign** starting with:
1. Shell (Layout top/bottom)  
2. Discovery (Landing + Browse + Seeker feed)  
3. Detail + CTA (Match / Room)  
4. Chat / Notifications polish  

No code until you green-light this audit.
