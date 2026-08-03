# NestMate — Competitive UX Research (Phase 2)

> **Rule:** Study *why* products feel premium. Do **not** copy UI. Map each insight to NestMate (adopt / adapt / reject).  
> **Date:** 2026-08-03

---

## Products studied (pattern clusters)

| Cluster | Products | NestMate relevance |
|---------|----------|-------------------|
| Discovery / stay | Airbnb, Booking.com | Room browse, search, trust of place |
| Matching / people | Bumble, Hinge, Tinder | Compatibility + connect — **not** swipe-first dating |
| Calm productivity | Notion, Linear, Apple | Hierarchy, density, motion restraint |
| Focused consumer | Spotify, Duolingo, Revolut | One primary action; trust through restraint; progress |

---

## Premium mechanisms (why it feels expensive / intentional)

### 1. One job per viewport
**Why premium:** Cognitive load is designed; the screen answers one question.  
**NestMate:** Adopt. Landing = search; Match detail = “should I connect?”; Chat = converse.

### 2. Media-first discovery
**Why:** Photos carry trust and desire; chrome stays quiet (Airbnb).  
**NestMate:** Adopt for rooms; adapt for people (large photo + name + one score, not 6 badges).

### 3. Single primary mobile chrome
**Why:** Spotify/Airbnb prioritize bottom nav; content owns the canvas.  
**NestMate:** Adopt — bottom nav primary; slim top (logo + one utility). Reject perpetual dual chrome.

### 4. Progressive disclosure (sheets)
**Why:** Apple/Linear hide secondary complexity until asked.  
**NestMate:** Adopt — filters, compatibility breakdown, amenities → sheets. Reject full desktop sidebars on phone.

### 5. Typography restraint
**Why:** Apple/Notion use few sizes; display type is rare and special.  
**NestMate:** Adopt — Lora for hero moments only; Sora for UI; ban sub-11px labels.

### 6. White space as structure
**Why:** Space replaces borders and boxes.  
**NestMate:** Adopt — section breathing; fewer nested white cards.

### 7. Color as accent, not wallpaper
**Why:** Revolut/Stripe use brand color for CTA and status, not full orange gradients.  
**NestMate:** Adopt — fire for primary CTA/active; parchment field; teal for trust/success. Reject orange gradient hero + fitness gauge.

### 8. Card hierarchy (or no card)
**Why:** Premium apps don’t wrap everything in a card; cards = interactive units.  
**NestMate:** Adopt — list rows / media tiles; cards only when the whole unit is tappable.

### 9. One elevation system
**Why:** Soft single shadow or hairline > stacked `shadow-2xl`.  
**NestMate:** Adopt — max 1–2 elevations (rest, raised).

### 10. CTA hierarchy
**Why:** Spotify: one loud play; rest quiet.  
**NestMate:** Adopt — one primary (“Connect”); secondary text/icon only. Reject dual sticky “Connect & Chat” + “Express Interest” equal weight.

### 11. Visual rhythm
**Why:** Consistent vertical cadence (8/16/24) creates calm.  
**NestMate:** Adopt — 4/8 spacing scale; section gaps larger than card gaps.

### 12. Onboarding as progress, not form dump
**Why:** Duolingo / Hinge chunk steps with clear progress and motivation.  
**NestMate:** Adapt — keep quiz value; redesign *feel* as short chapters with progress (structure in IA; hi-fi later). Reject 19 undifferentiated steps visually.

### 13. Trust through restraint
**Why:** Revolut shows security quietly; doesn’t scream “#1 SAFE”.  
**NestMate:** Adopt — verified mark + short trust line; reject marketing eyebrow “#1” + pulse.

### 14. Empty & loading as product moments
**Why:** Linear skeletons match content shape; empty has one CTA.  
**NestMate:** Adopt — content-shaped skeletons; empty = one sentence + one action.

### 15. Search UX: destination intent first
**Why:** Airbnb mobile: where + when as the hero job.  
**NestMate:** Adopt — city + locality (or rooms vs flatmates) as sole hero action; defer social proof.

### 16. Filters as chips + sheet
**Why:** Booking/Airbnb: active filters as chips; advanced in sheet.  
**NestMate:** Adopt. Reject opening full filter wall on mobile.

### 17. Forms: one column, large fields, sticky primary
**Why:** Apple Settings / Stripe Checkout — scannable, thumb-reachable CTA.  
**NestMate:** Adopt for auth, edit profile, listing.

### 18. Mobile ergonomics
**Why:** 44pt targets; primary CTA in thumb zone; safe areas.  
**NestMate:** Adopt (already partially fixed). Sticky Connect above bottom nav.

### 19. Motion with purpose
**Why:** Linear sheet/slide; Apple push; Duolingo celebration sparingly.  
**NestMate:** Adopt — sheet present, press scale, list settle. Reject marketing pulse Sparkles.

### 20. Matching products: story over score alone
**Why:** Hinge prompts / Bumble bios create decision narrative; Tinder score-only feels cheap.  
**NestMate:** Adapt — show 3 compatibility reasons before full quiz matrix. Reject swipe-deck as primary discovery (rooms + people browse is NestMate’s model).

---

## Explicit reject list (do not copy)

| Pattern | Source vibe | Why reject for NestMate |
|---------|-------------|-------------------------|
| Infinite swipe stack as home | Tinder | NestMate is browse + match + housing, not dating dopamine |
| Dark neon finance UI | Some fintech | Breaks residential warmth of parchment/fire |
| Purple gradient startup landing | Generic AI SaaS | Brand already distinctive; keep warm residential |
| Dense CRM owner panels as-is | Admin tools | Owner is still a consumer finding a human roommate |
| Gamified streaks as core | Duolingo | Optional later; not core roommate trust journey |

---

## NestMate implication summary (inputs to Phase 3)

1. **Calm consumer, not SaaS** — one job, more space, quieter type  
2. **Evolve brand** — parchment/fire/teal/ink + Lora/Sora  
3. **Bottom-nav-first mobile shell**  
4. **Media + story for decisions**; sheets for depth  
5. **One Connect CTA**; auth-on-action preserved  
6. **Trust quiet, verification clear**  
7. **Search-first landing**  
8. **Compatibility as narrative (3 reasons)**, not spreadsheet  

---

## Exit

Phase 2 complete. Proceeding to Phase 3 (design principles).
