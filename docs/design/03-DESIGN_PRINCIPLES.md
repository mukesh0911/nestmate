# NestMate — Design Principles & System Philosophy (Phase 3)

> **Date:** 2026-08-03  
> **Brand path:** Evolve existing NestMate (parchment / fire / teal / ink + Lora + Sora)  
> **Figma:** Foundations / Principles pages only at this stage (no product screens)  
> **Inputs:** Phase 1 product brief · Phase 2 competitive research

---

## Brand personality

| Trait | Expression | Avoid |
|-------|------------|-------|
| Warm host | Parchment fields, soft corners, residential photography | Cold gray enterprise |
| Trustworthy | Quiet verified marks, teal success, clear privacy | “#1” hype, pulse badges |
| Calm | One job per screen, generous space | Dashboard density |
| Metro-India native | Rupees, cities, veg/non-veg, Aadhaar as trust — never exoticized | Generic Silicon Valley purple |
| Distinctive | Fire accent + Lora moments | Inter/Roboto template look |

**Voice:** Confident, short, human. Prefer “Connect” over “Connect & Chat now!!”.

---

## Design principles (12)

1. **One job per screen** — User can answer the screen’s question without scrolling past chrome.
2. **Trust before chrome** — Verification and privacy beat decorative UI.
3. **Compatibility is a story** — Three reasons + score; spreadsheet stays in a sheet.
4. **Search discovers; connect commits** — Guests explore freely; auth only when value requires identity.
5. **Bottom nav owns mobile** — Slim top; no dual competing chrome.
6. **Media leads discovery** — Rooms are photo-first; people are portrait-first.
7. **One primary CTA** — Fire fill; everything else is quieter.
8. **Progressive disclosure** — Filters, breakdowns, amenities, secondary actions → sheets.
9. **Space over boxes** — Prefer padding and type hierarchy to nested cards and heavy shadows.
10. **Type is the interface** — Fixed ramp; Lora rare; no sub-11px chrome.
11. **Motion with meaning** — Sheet, press, settle — never marketing pulse.
12. **Accessible by default** — Contrast, 44px touch, focus rings, readable body.

---

## Typography system

| Token | Family | Size / weight | Use |
|-------|--------|---------------|-----|
| `display.lg` | Lora italic | 32–40 / 500–600 | Landing / rare hero only |
| `display.md` | Lora | 24–28 / 600 | Section titles (sparingly) |
| `title.lg` | Sora | 22 / 700 | Screen title |
| `title.md` | Sora | 18 / 650 | Card / sheet titles |
| `body.lg` | Sora | 16 / 400–500 | Primary body |
| `body.md` | Sora | 14 / 400–500 | Secondary body |
| `label` | Sora | 12–13 / 600 | Labels, chips (min 12) |
| `meta` | Sora | 12 / 500 | Meta — **never below 12** |

**Rules:** Max ~6 text styles in product UI. Italic Lora is a *moment*, not default for every H2.

---

## Spacing system

- Base unit: **4px**
- Scale: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64
- Page gutter (mobile): **16–20px**
- Section gap: **32–48px**
- Stack gap inside components: **8–12px**
- List row vertical padding: **12–16px**

---

## Color system (semantic on NestMate primitives)

### Primitives (evolve, don’t reinvent)

| Name | Hex | Role |
|------|-----|------|
| parchment | `#F7F3ED` | App canvas |
| cream | `#F5F0E8` | Subtle wells |
| ink | `#1A1A2E` | Primary text |
| fire | `#E5501A` | Brand / primary CTA |
| fire-dark | `#C4410F` | Pressed |
| fire-light | `#FFF0EB` | Soft brand wash |
| teal | `#0D9488` | Trust / success |
| teal-light | `#E0F2F1` | Trust wash |
| navy | `#1E3A5F` | Secondary emphasis |
| gold | `#D4A843` | Premium / badge accent (rare) |
| white | `#FFFFFF` | Surfaces |
| border | ink @ ~10–12% | Hairlines |

### Semantic

| Token | Maps to |
|-------|---------|
| `bg.app` | parchment |
| `bg.surface` | white |
| `bg.muted` | cream |
| `text.primary` | ink |
| `text.secondary` | ink @ 60–70% |
| `text.inverse` | white |
| `border.default` | border |
| `action.primary` | fire |
| `action.primaryPressed` | fire-dark |
| `status.success` | teal |
| `status.danger` | destructive red (existing) |
| `status.trust` | teal |

**Rules:** No full-bleed orange gradients on profiles. Fire = CTA + active nav + key accent only.

---

## Corner radius

| Token | Value | Use |
|-------|-------|-----|
| `radius.sm` | 8 | Chips, small controls |
| `radius.md` | 12 | Inputs, buttons |
| `radius.lg` | 16 | Cards, sheets top |
| `radius.xl` | 22 | Large media / hero search |
| `radius.full` | 999 | Avatars, icon buttons |

---

## Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 Rest | Flat + hairline border optional | Lists, page |
| 1 Raised | `0 4px 24px rgba(0,0,0,0.08)` (existing `card`) | Floating bars, sheets |
| 2 Lift | `0 8px 40px rgba(0,0,0,0.12)` (existing `lift`) | Modals only — rare |

**Ban:** Stacking multiple heavy shadows on one card; `shadow-2xl` as default.

---

## Motion language

| Motion | Duration | Easing | When |
|--------|----------|--------|------|
| Press | 100–150ms | ease-out | Buttons (`scale 0.98`) |
| Sheet present | 280–320ms | ease-out | Filters, breakdown, auth |
| Page settle | 200–250ms | ease-out | List appear (subtle fade/slide 8px) |
| Toast | 200ms | ease | Feedback |

**Ban:** Infinite pulse on marketing icons; parallax noise; celebratory confetti on connect (keep quiet success).

---

## Iconography

- Single family: Lucide (already in product) — outline, 1.5–2px stroke
- Sizes: 16 / 20 / 24 only
- Nav: 24 outline; active can use filled or fire color — not both thick border + top hairline + label shout
- No emoji as UI decoration

---

## Component philosophy

1. **Compose atoms** — Button, Input, Chip, Avatar, Badge before page-specific snowflakes.
2. **Cards are interactive units** — If removing border/shadow doesn’t hurt understanding, don’t use a card.
3. **Few variants** — Button: primary / secondary / ghost / danger × default / loading / disabled. Not 20 styles.
4. **Sheets over pages** for secondary tasks on mobile.
5. **Skeletons mirror layout** — never a lone centered spinner when a list exists.
6. **Empty = message + one CTA.**

---

## Accessibility goals

| Goal | Bar |
|------|-----|
| Contrast | Text/icon vs bg WCAG AA minimum |
| Touch | Primary controls ≥ 44×44 |
| Focus | Visible focus ring on keyboard |
| Type | Body ≥ 14; labels ≥ 12 |
| Motion | Respect reduced-motion (fade instead of slide when set) |
| Labels | Icon-only controls have aria-labels |

---

## Component inventory (to build in Figma Phase 6 / document now)

Button · Text field · Search field · Chip / Filter chip · Badge (trust, new, match %) · Avatar · List row · Media card (room) · Person card · Bottom nav · Top utility bar · Sheet · Dialog · Toast · Empty state · Skeleton · FAB (map) · Segmented control (Rooms / Flatmates)

---

## Exit

Phase 3 philosophy locked for redesign. Proceeding to Phase 4 (IA). Figma foundations pages will mirror this doc when the file is created (Phase 3–5).
