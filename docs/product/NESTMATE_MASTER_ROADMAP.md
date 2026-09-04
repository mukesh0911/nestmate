# NESTMATE — MASTER ROADMAP

## Current State (post Sprint 1–2E + hardening)
- Production integrity: hardened (admin authz, rules, PII, seed isolation, truthful claims).
- Listing freshness: live (14d stale / 45d expired, owner confirmation).
- Trust signals: truthful, auth-derived; review anti-spoofing live.
- Matching: eligibility-first, explainable, seeker→owner only.
- Analytics: closed taxonomy, demo-excluded, full funnel.
- Discovery: consistent across Dashboard/Explore/Map; honest empty states.
- Quality gates: 133 tests, strict TS, production build green.

## Strategic Objective
"A trusted roommate marketplace where people find a real available room, understand who they're dealing with, see why a match makes sense, and confidently move from discovery to a real connection."

Compete on marketplace QUALITY + TRUSTWORTHINESS, not feature count. Never fabricate anything (Rules 1–20 stand).

## Major Product Systems & Health
| System | Health | Next lever |
|--------|--------|------------|
| Identity & Trust | Good foundations | Validate/complete one real ID path OR label unavailable |
| Room Availability | Strong | Promote freshness signal in UI copy |
| Two-sided matching | WEAK (owner side) | Sprint 3A |
| Discovery | Strong | Empty-state guidance |
| Communication | Complete | Response-time measurement |
| Safety | Solid | Contact-moment safety guidance |
| Liquidity | Unproven | City-first launch gates |
| Conversion | Unknown | Analytics-instrumented iteration |

## Prioritized Sprints
- **3A — Owner-side explainable applicant ranking** (chosen first; rationale in Gap Matrix decision). Pure functions + tests; reuse calculateCompatibility/getMatchReasons; sort signals: compatibility, budget fit vs listing, city match, completeness, trust, recency tiebreak. Every recommendation shows its reasons.
- **3B — Trust depth**: validate DigiLocker/Aadhaar data-flows; either ship one genuine verification path or relabel as unavailable; vouches validation.
- **3C — Discovery & conversion**: empty-state "what to relax" guidance; freshness prominence; response-latency tracking via existing analytics taxonomy.
- **3D — Post-match transition**: evaluate visit/decision prompts post-connection (build only if liquidity emerging).
- **3E — Retention loops**: returning-seeker/owner loops driven by 2D metrics.
- **3F — Launch readiness**: device QA pass, performance instrumentation, security re-review, launch gates.

Dependencies: 3A independent. 3C response-metrics depend on 2D taxonomy (done). 3F depends on all prior. 3D/3E gated on real-usage data.

## Risks
1. Single-founder bandwidth → keep sprints small, pure-function-first.
2. Cold-start liquidity → do NOT broad-launch; corridor-first.
3. Verification complexity (DigiLocker/Aadhaar compliance) → may conclude "label unavailable" is the honest 3B outcome.
4. Performance debt at scale → instrument before rewrite.
5. Over-filtering killing liquidity → every constraint relaxation must be disclosed (Principle B).

## Success Metrics (from 2D taxonomy — never invented)
Supply: active fresh rooms per corridor; confirmation rate. Demand: searches, zero-result rate. Conversion: search→view→interest→accept→chat→contact. Quality: response rate, availability accuracy, reports/blocks rate. Retention: returning seekers/owners.

## Launch Gates (city-first, hypothesis: Chennai corridors — validate with data, do not hardcode)
1. ≥ N fresh (confirmed ≤14d) listings in target corridor.
2. Owner median first-response < 24h.
3. Interest→acceptance ≥ threshold X.
4. Zero unresolved P0 security issues.
5. Device QA pass.
(X/N set from first weeks of real data, not invented targets.)