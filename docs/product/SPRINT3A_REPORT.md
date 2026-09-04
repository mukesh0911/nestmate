# NESTMATE — SPRINT 3A REPORT: OWNER-SIDE EXPLAINABLE APPLICANT RANKING

**Date:** 2026-08-23 · **Scope:** Close the largest unshipped conversion lever found in the master audit (Gap Matrix #1/#5): owners received applicants in pure chronological order with zero fit signals.

## 1. Executive Summary
Owners can now answer "Who should I talk to first?" Pending requests are ranked by explainable fit, and every card shows a reproducible match % plus data-backed reasons and honest caveats. No fabricated data, no opaque scoring, no schema changes, no new infrastructure.

## 2. Existing Behavior
`subscribeToIncoming` ordered pending connections by `createdAt desc` only. Cards showed name/avatar/profession/budget — no compatibility, intent, or trust context. Owner-side matching did not exist (matching was seeker→owner only).

## 3. Product Decision (recorded per protocol)
- **Sprint order adjusted** from the suggested 3A=trust-depth: trust essentials already shipped in 2B; owner-side applicant quality was the highest-value, lowest-complexity gap. Documented in `NESTMATE_PRODUCT_GAP_MATRIX.md`.
- **Ranking is explainable, not opaque:** score reuses the exact `calculateCompatibility` engine from seeker-side matching (Rule 16: reproducible). Reasons/caveats are rendered verbatim from real data.
- **Ties preserve chronological order** (stable sort over createdAt-desc input) — ranking never buries newer applicants.
- **Missing data is stated, never invented** (Rule 18): incomplete profiles get "Profile incomplete — limited signal", not a penalty or a fabricated score.

## 4. Technical Changes
New pure lib `app/src/lib/applicantRanking.ts`:
- `evaluateApplicantFit(ownerAnswers, applicant, {ownerCity, listing, requestedAtMs, now})` → `{score, reasons[], caveats[]}`
- Signals: quiz compatibility (cross-city capped), same city/locality vs the actual listing, budget fit vs `partnerShare`/`totalRent` (≤20% gap = reason), lifestyle overlap count, profile completeness, REAL verification fields only (`workEmailVerified`, `isVerified`), week-old-request recency caveat (display-only).
- `rankApplicants(items, fitOf)` → stable sort by score desc.

`OwnerDashboard.tsx`: `rankedApplicants` memo (no extra Firestore reads — all inputs already fetched); both desktop and mobile card lists render ranked order; desktop cards show score chip + up to 2 reason chips + first caveat; mobile shows score chip + top reason; mobile header explains "Sorted by compatibility — reasons shown on each request."

## 5. Files Changed
- `app/src/lib/applicantRanking.ts` (NEW)
- `app/src/lib/applicantRanking.test.ts` (NEW — 10 tests)
- `app/src/pages/OwnerDashboard.tsx` (ranking memo + ranked rendering + fit chips)
- `docs/product/CURRENT_PRODUCT_INVENTORY.md`, `NESTMATE_PRODUCT_GAP_MATRIX.md`, `NESTMATE_MASTER_ROADMAP.md` (NEW — master audit deliverables)

## 6. Database / Security Changes
None. No schema, rules, or infrastructure changes. Ranking is client-side over already-fetched documents; no new PII exposure (uses only fields already rendered or already public on profiles).

## 7. Tests
10 new tests: strong-applicant reasons; cross-city cap + caveat; budget mismatch caveat; missing-data honesty (score 0, reasons empty); trust reasons ONLY from real verification fields; recency caveat doesn't change score; ranking order; stable chronological tiebreak; empty inbox; input non-mutation.

## 8. Verification
- `npm test`: **13 files, 143 tests, all passing** (was 133; +10)
- `npm run check` (`tsc -b`): clean
- `npm run build`: succeeds (2565 modules)

## 9. Remaining Risks
- Ranking is client-side; a modified client could reorder its own view — acceptable because this is presentation ordering, not authorization or data integrity.
- Fit uses the owner's FIRST listing only when multiple listings exist; per-listing applicant attribution is a known pre-existing limitation (connections aren't listing-scoped) — deferred, not introduced here.
- Manual E2E with real multi-applicant data not performed in this environment; unit tests cover the rules, not the wiring.
- Desktop "Pending Requests" heading has no ordering caption (mobile does) — cosmetic follow-up.

## 10. Deferred / Next
- **3B — Trust depth:** validate DigiLocker/Aadhaar data-flows; ship one genuine verification path or relabel as unavailable; vouches validation.
- **3C:** empty-state "what to relax" guidance; response-latency tracking via 2D taxonomy.
- Per-listing connection attribution (schema change — needs founder decision).

Stopping here — Sprint 3B not started.