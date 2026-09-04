# Sprint 6A — Premium Owner Dashboard / Applicant Inbox Polish Report

**Date:** 2026-08-24
**Scope:** `app/src/pages/OwnerDashboard.tsx` only (single focused pass)
**Mode:** Presentation/interaction — no protected system touched

---

## 1. Objective

Make the OwnerDashboard answer, in order: who is interested → which listing they want → how strong is the fit → what real trust signals exist → what to do next (INCOMING REQUEST → UNDERSTAND APPLICANT → UNDERSTAND FIT → REVIEW TRUST → DECIDE/RESPOND), using the Sprint 5A–5E design system.

## 2. Audit Findings (before changes)

| # | Finding | Evidence |
|---|---|---|
| 1 | `connection.listingId` (Sprint 3C) was never displayed — owners with multiple listings could not tell which room an applicant wanted | No reference to `listingId` anywhere in the render tree |
| 2 | Mobile applicant cards dropped the ID-verified shield — desktop showed `workEmailVerified` + `isVerified`, mobile showed only `workEmailVerified` | Mobile pending card trust row |
| 3 | Hardcoded hex colors (`#ff5a36`, `#161c2d`, `#1a1f36`, `#ffe5df`) throughout the mobile view instead of design tokens | ~20 occurrences |
| 4 | Off-palette purple tile on mobile Weekly Views section | `bg-purple-50 text-purple-600` |
| 5 | Mobile Weekly Views rendered "Create a listing to see analytics and insights." **unconditionally** — even for owners with an active listing and recorded views (misleading copy) | Mobile Weekly Views section |
| 6 | Mobile pending empty state said "Create a listing…" even when a listing existed (desktop handled this correctly) | Mobile pending empty state |
| 7 | Quick Tip claimed "Replying to applicants quickly improves your listing's visibility" — no such mechanism exists anywhere in the codebase (unsupported claim, truth-contract violation) | Desktop + mobile Quick Tip |
| 8 | Sub-44px touch targets on mobile decision actions (`p-1.5` reject ≈28px, `py-1.5` Profile/Accept) | Mobile action row |
| 9 | Fit reason chips used a literal "✓" text character instead of the Lucide icon system | Desktop + mobile reason chips |

## 3. Files Changed

| File | Change |
|---|---|
| `app/src/pages/OwnerDashboard.tsx` | Listing attribution display; mobile trust parity; touch targets; truth-copy fixes; hex→token sweep; icon consistency; pending-section emphasis |

## 4. UI/UX Changes

1. **Pending Requests as primary task:** warm accent border (`border-brand-orange/30`) on the Pending Requests section while applicants are waiting; count remains truthful (real array length).
2. **Fit reasons normalized:** "✓" text replaced with Lucide `<Check>` icons in inline-flex chips (desktop + mobile).
3. **CTA hierarchy preserved:** Accept (primary brand-orange) → Profile (secondary outline) → Reject (destructive red) — semantics untouched.
4. **Tokenization:** all hardcoded hex replaced with `brand-orange`, `brand-lightOrange`, `brand-dark`, `ink`; off-palette purple removed.

## 5. Listing Attribution Handling

- New helper `getRequestedListing(conn)` resolves `connection.listingId` against the owner's actual listings.
- When it resolves: card shows "Interested in: {title (truncated) or locality}" with a Home icon — desktop and mobile parity.
- When `listingId` is absent (profile-origin request) or the listing no longer exists: nothing is shown — attribution is never guessed.
- **Deferred (documented, not worked around):** per-listing grouping of applicants and per-listing fit recalculation would require re-architecting the ranking input flow; current fit scores remain computed against the selected listing exactly as before.

## 6. Applicant Ranking Presentation

- `rankApplicants` / `evaluateApplicantFit` untouched — same inputs, same scores, same order, same caveats.
- Score chip + max 2 reasons + first caveat only (restraint: no reason stacking).
- Honest caveat preserved when data is incomplete.

## 7. Trust Presentation

- Truthful signals only: phone-auth-era `workEmailVerified` checkmark + admin-set `isVerified` shield (Sprint 4A truth rule intact).
- **Mobile parity fix:** ID-verified shield now also renders on mobile cards.
- TrustBadge primitive evaluated but not swapped in — the two compact icons are lower-noise than a badge cluster on dense cards; documented as an intentional choice.
- No fake ratings, counts, percentages, or verification claims introduced.

## 8. Mobile/Accessibility Verification

- All three mobile decision actions now ≥44px (Profile `py-2.5`, Reject `p-3` + `aria-label`, Accept `py-2.5`).
- Attribution line truncates safely at narrow widths; no horizontal overflow introduced.
- Bottom-nav clearance system untouched; no new fixed/sticky elements.
- Semantic headings retained; icon-only controls have titles/aria-labels.

## 9. Protected Systems Verified Untouched

- `matching.ts`, `calculateCompatibility`, match eligibility — not modified
- `applicantRanking.ts` scoring logic, weights, eligibility — not modified
- Listing freshness policy, marketplace visibility policy — not modified
- Demo quarantine, analytics taxonomy/privacy model — not modified
- Trust authorization model, Firestore rules, Storage rules — not modified
- Connection creation logic, listingId attribution rules, database schema — not modified
- Accept/reject/chat/notification behavior — unchanged verbatim

## 10. Truthfulness Verification

- Applicant counts = real array lengths.
- Fit scores/reasons/caveats = real `evaluateApplicantFit` output.
- "Interested in" = real resolved listing from real `connection.listingId`.
- Quick Tip rewritten to remove the fabricated "improves visibility" mechanism claim → now states only generic behavioral guidance ("Applicants who hear back quickly are more likely to stay engaged").
- Weekly Views misleading unconditional copy fixed → conditional, truthful ("No views recorded yet this week." only when zero).

## 11. Tests

```
npm run check  ✅ tsc -b clean
npm test       ✅ 180 passed / 26 skipped (rules tests require emulator)
```

## 12. Build Result

```
npm run build  ✅ built in ~64s (OwnerDashboard chunk 45.75 kB → 46.87 kB)
```

## 13. Remaining Issues

1. Per-listing applicant grouping + per-listing fit recalculation deferred (architectural; requires ranking-input redesign).
2. Listing-selector delete micro-buttons still small (16px glyph); functional but below ideal touch size — candidate for a future pass.
3. Sidebar stat tiles mildly dashboard-template-like; harmless.
4. Browserslist data stale (build warning) — maintenance task.

## 14. Recommended Next Sprint

Sprint 6B — full-device QA sweep (320–430px widths, both dashboards, chat, detail pages) against the premium checklist, then production deploy readiness review.