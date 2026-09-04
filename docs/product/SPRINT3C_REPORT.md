# NESTMATE — SPRINT 3C REPORT: RECONCILIATION & PRODUCTION-READINESS GAPS

Sprint: 3C — Repository reconciliation + remaining production-readiness gaps
Status: COMPLETE (with documented residual risks)

---

## 1. Repository Reconciliation (Phase 0)

Verified each documented sprint against actual code (repository = source of truth):

| Sprint | Claimed work | Verified in code? | Evidence |
|--------|-------------|-------------------|----------|
| 1 — Production Integrity | Rules hardening, admin authz, seed protection | ✅ PRESENT | `firestore.rules` (admin registry, trust-field guards, status enforcement), `docs/security/SPRINT1_*` |
| 2A — Listing Freshness | lastConfirmedAt anchor, 14/45-day policy | ✅ PRESENT | `listingFreshness.ts` + 15 tests; RoomDetail unavailable-state handling |
| 2B — Trust Quality | review validation, truthful badges | ✅ PRESENT | `reviewValidation.ts`, `TrustBadge.tsx` |
| 2C — Match Quality | eligibility-before-ranking, honest caveats | ✅ PRESENT | `matching.ts`, `matchQuality.test.ts` (16 tests) |
| 2D — Analytics | closed taxonomy, null-not-zero rates | ✅ PRESENT | `analytics.ts` + 23 tests; rules `validAnalyticsEvent()` |
| 2E — Marketplace Quality | single visibility layer, orphan policy | ✅ PRESENT | `marketplaceVisibility.ts` + 18 tests used by Explore/Browse/Map |
| 2E Hardening | demo quarantine, fail-closed | ✅ PRESENT | `demoUsers.ts`, hardening report |
| 3A — Applicant Ranking | explainable owner-side ranking | ✅ PRESENT | `applicantRanking.ts` + 10 tests |
| 3B — Truthful Trust Signals | phone-from-auth-providers, no fabricated claims | ✅ PRESENT | Sprint 3B changes in this branch |

### Gaps found (NOT covered by any prior sprint)

1. **Connection/listing attribution missing** — matches carried `listingId`
   but connection documents did not. Multi-room owners could not tell which
   listing an interest was for; listing-level conversion analytics impossible.
   → FIXED this sprint.
2. **No emulator-based security-rules tests** — all prior rule verification
   was source inspection + pure-function tests. The mandated §14 gate did not
   exist. → ADDED this sprint.

## 2. Changes Made

### A. Connection listing attribution (smallest safe change)
- `app/firestore.rules` — new `connectionListingAttributionValid()`: on
  connection create, if `listingId` is present it MUST be a non-empty string
  ≤128 chars referencing an EXISTING listing whose `ownerId == toUserId`.
  Enforcement boundary is the RULE, not the client. Legacy connections
  without `listingId` are unaffected.
- `app/src/hooks/useConnections.ts` — `Connection.listingId?: string`;
  `sendRequest(fromId, toId, opts?: { listingId?: string })` attaches it only
  when provided and non-empty.
- `app/src/pages/RoomDetail.tsx` — Express Interest now passes
  `{ listingId: room.id }`. Other call sites (SeekerDashboard, MatchDetail,
  BrowseSeekers) intentionally unchanged: those interests are profile-origin,
  not listing-origin.

### B. Firestore emulator rules-test infrastructure (§14 gate)
- `@firebase/rules-unit-testing@5` added as devDependency.
- `app/firestore.rules.test.ts` — 12 tests against the REAL rules on the
  Firestore Emulator, each with positive AND negative cases:
  1. unauthenticated CANNOT create connection
  2. seeker CAN create legacy-shape pending connection
  3. seeker CAN attribute a recipient-owned listing
  4. attacker CANNOT claim another owner's listing
  5. nonexistent listingId REJECTED
  6. sender CANNOT self-accept
  7. normal user CANNOT self-grant `isVerified`
  8. admin CAN set `isVerified` (and value visible)
  9. reporter identity spoofing BLOCKED
  10. reports unreadable by users / readable by admin
  11. banned user CANNOT create listings
  12. chat rooms unreadable by non-participants
- `scripts/run-rules-tests.cjs` + root script `npm run test:rules`
  (`firebase emulators:exec --only firestore`). Suite auto-skips under plain
  `npm test` so CI without Java/emulator still passes; the dedicated gate
  FAILS if any protected operation becomes permitted.

## 3. Test Results (actually executed)

```
npm test          → 13 files passed, 149 tests passed (+12 rules tests skipped by design)
npm run check     → tsc -b pass
npm run build     → vite build pass (✓ built)
npm run test:rules→ see "Emulator result" below
```

**Emulator result:** INFRASTRUCTURE COMPLETE — LOCAL EXECUTION BLOCKED BY ENVIRONMENT.

Actual command executed: `npm run test:rules`
Actual result: FAILED BEFORE TESTS RAN —
`firebase-tools no longer supports Java version before 21. Please install a JDK at version 21 or above.`
This machine has only JDK 1.8.0_91 (`java -version` verified). No tests were
skipped or faked: the suite did not execute locally.

Mitigation implemented:
- `.github/workflows/rules-tests.yml` runs `npm run test:rules` on every
  push/PR with Temurin JDK 21 via setup-java — the gate executes automatically
  in CI where the environment requirement is met.
- Local enablement: install JDK 21+, then run `npm run test:rules`.
- Until the first green CI run of this workflow, rule security remains
  verified by source inspection + Sprint 1 audit only — this is an OPEN item,
  not a closed one.

## 4. Security Impact

- NEW enforcement boundary: clients can no longer attribute arbitrary
  listings to connections. This closes a data-integrity hole that would have
  corrupted future listing-level analytics and owner ranking.
- No existing allow-rule weakened. The new condition only ADDS a constraint
  on creates that include `listingId`.
- Regression risk LOW: legacy writes (no listingId) take the identical code
  path as before; RoomDetail is the only caller passing listingId, and its
  listing always exists (fetched by id) and belongs to the recipient
  (room.ownerId is the send target).

## 5. Remaining Risks / Deferred

1. Storage-rules emulator tests not yet added (§14 "where applicable") —
   deferred; storage.rules were audited in Sprint 1.
2. Rules suite covers highest-risk boundaries, not every collection/verb;
   expanding coverage is incremental follow-up work.
3. OwnerDashboard applicant list does not yet display per-listing grouping
   using the new attribution (data now exists; UI consumption deferred).
4. App Check remains UNDECIDED/unimplemented — evaluation documented as
   required before enforcement (§24); no blind enablement performed.
5. Manual critical-flow verification (§29 list) requires a running app +
   Firebase project; automated coverage substitutes where possible but does
   not fully replace it.
6. Rules emulator suite has NOT yet produced a passing local/CI run (JDK 21
   missing locally; CI workflow added but first run pending push). Treated as
   an open production-readiness item until green.

## 6. Files Changed

- `app/firestore.rules` (attribution rule)
- `app/src/hooks/useConnections.ts` (interface + sendRequest opts)
- `app/src/pages/RoomDetail.tsx` (pass listingId)
- `app/firestore.rules.test.ts` (NEW — 12 emulator tests)
- `scripts/run-rules-tests.cjs` (NEW)
- `package.json` (test:rules script; devDependency)
- `app/package.json` (@firebase/rules-unit-testing devDep)
- `.github/workflows/rules-tests.yml` (NEW — CI gate with JDK 21)
- `scripts/run-rules-tests.cjs` (path-independent runner)
