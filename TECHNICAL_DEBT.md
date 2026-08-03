# NestMate — Technical Debt

> **Last Updated**: 2026-08-03  
> **Baseline**: Stable production (smoke P0=0, P1=0)  
> **Rule**: Pay down debt that reduces regression risk or cost to change; avoid drive-by refactors.

---

## Open debt

| ID | Item | Area | Priority | Notes |
|----|------|------|----------|-------|
| TD-01 | No CI for unit tests / TypeScript | Maintainability | **P1** | Add GitHub Action: `npm test` + `tsc -b` |
| TD-02 | Legacy `users` docs may still hold public phone/email | Security | **P1** | Mitigated by sanitize + migrate-on-login; needs cleanup job or admin script |
| TD-03 | Browser smoke not in CI | Maintainability | **P2** | `scripts/smoke-browser.ts` exists; optional nightly / manual gate |
| TD-04 | Auto-complete onboarding defaults in some auth paths | UX / data | **P2** | Can create incomplete but “done” profiles |
| TD-05 | Chat smile / reaction control non-functional | UX | **P2** | Remove or implement |
| TD-06 | Limited automated coverage beyond pure helpers | Maintainability | **P2** | Expand unit tests for guards, sanitize, phone share |
| TD-07 | Bundle size / chunk analysis not tracked | Performance | **P2** | Establish baseline after next build audit |
| TD-08 | Accessibility not systematically audited | Accessibility | **P2** | Partial: icon `aria-label`s on chat/owner/notifications; full a11y audit remains |
| TD-09 | Design-system / component reuse inconsistencies | UI / maintainability | **P2** | Partially paid: `StateEmpty` / `StateLoading` / `PageShell` now shared |
| TD-10 | Premium / KYC still stubbed (honest stubs) | Product | Future | Must not grant trust/premium client-side |

---

## Paid-down (recent)

| ID | Item | Resolution |
|----|------|------------|
| — | Trust self-grant via profile / demo | Rules + client pending-only; demo no premium/verified |
| — | Public PII on new writes | `privateUserData` + sanitize |
| — | Demo login via Anonymous Auth | Ephemeral email/password |
| — | Phone share after PII move | Modal request/accept modes |
| — | Inconsistent empty/loading states | Shared `StateEmpty` / `StateLoading` / `PageShell` |
| — | Broken `btn-primary` CTA class | Aliased to `btn-fire` |
| — | Stale Hosting client vs new rules | Hosting redeployed 2026-08-03 |

---

## Guardrails when touching debt

1. Understand + smoke the affected flow first  
2. Prefer smallest fix that preserves behavior  
3. Re-run relevant tests: `npm test`, targeted smoke, security script if rules/PII  
4. Log outcome in `CHANGELOG.md` and update this file  
