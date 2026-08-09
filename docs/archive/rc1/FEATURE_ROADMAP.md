# NestMate — Feature Roadmap

> **Mode**: Continuous improvement (stability-first)  
> **Baseline**: Production verified 2026-08-03 — https://nestmate-eb562.web.app  
> **Rule**: Major features require approval before implementation.

---

## How items are prioritized

1. **Must not regress** existing auth, match, chat, profile, settings, owner flows  
2. Prefer improvements that raise UX / UI / performance / a11y / security / maintainability / scalability  
3. Prefer free / Firebase-native solutions; paid integrations marked *Future Production Integration*

---

## Near-term (no major product surface change)

| ID | Item | Value | Complexity | Impact | Status |
|----|------|-------|------------|--------|--------|
| N-01 | CI: `npm test` + `tsc` on PR | Maintainability, regression safety | Low | High | Proposed |
| N-02 | Legacy public PII background migrate / admin cleanup | Security | Medium | Medium | Proposed |
| N-03 | Consistent empty / loading / error states audit | UX, UI quality | Low–Med | Medium | **Done** (2026-08-03 polish) |
| N-04 | Accessibility pass (focus, labels, contrast, keyboard) | Accessibility | Medium | Medium | Partial — icon labels added; full pass still open |
| N-05 | Bundle / route-level lazy-load audit | Performance | Low–Med | Medium | Proposed |

---

## Next product improvements (approval required if major)

| ID | Item | Value | Complexity | Impact | Notes |
|----|------|-------|------------|--------|-------|
| F-01 | Functional chat reaction / smile | UX | Low | Low | Currently non-functional (P2) |
| F-02 | Stronger onboarding defaults / validation | UX, data quality | Medium | Medium | Avoid auto-complete traps |
| F-03 | Notification polish (preferences, grouping) | UX | Medium | Medium | |
| F-04 | Owner listing UX polish | UX, UI | Medium | Medium | |
| F-05 | Map discovery refinements | UX | Medium | Medium | |

---

## Future Production Integration (do not fake)

| ID | Item | Why deferred |
|----|------|----------------|
| I-01 | DigiLocker / real KYC | Needs server verification + compliance |
| I-02 | Razorpay / real Premium | Needs backend payment verification |
| I-03 | Digital agreements / e-sign | Legal + product scope |
| I-04 | Rent splitter | Not core MVP; marketing must stay honest |

---

## Recently completed (baseline)

- Security: trust self-grant blocked, private PII store, demo auth fix  
- QA: local + production browser smoke 30/30  
- Hosting: current secured client live  

---

## Proposal template (use before major work)

```
Feature:
Why valuable (best-practice context):
User impact:
Complexity (S/M/L):
Regression risk:
Approval needed?: Yes/No
```
