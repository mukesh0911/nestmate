# NestMate Test Architecture Audit (Phase 0)

**Date:** 2026-10-07  
**Scope:** Complete audit of test runners, configurations, seed/reset scripts, test suites, helpers, fixtures, and discovery assets.  
**Objective:** Identify all sources of test flakiness, false positives, non-determinism, duplicate coverage, and architectural flaws prior to rebuilding the test suite in strict dependency order (Phase 0 → Phase 11).

---

## 1. Executive Summary

The current test suite is unstable, brittle, and failing to provide reliable regression confidence. The root causes identified during this audit are:

1. **Non-Deterministic Execution & Worker Collisions:** `playwright.config.ts` configures `workers: 2` across `testMatch: /.*\.spec\.ts$/`. Both workers run concurrently against a single shared Firebase environment (`nestmate-eb562`). As a result, tests mutating database records, connection states, or messages collide and produce race conditions.
2. **Simulated Tests Masquerading as E2E/API Tests:** All 9 test files in `tests/api/` (`authAndUserApi`, `listingsApi`, `matchingApi`, etc.) do not make actual HTTP requests or communicate with Firebase. Instead, they execute in-memory TypeScript logic in `BackendTestHarness.ts` that mirrors security rules in code. Running these inside Playwright with browser worker overhead is completely misaligned.
3. **Hard-Coded Data & Non-Existent Entity Lookups:** Multiple tests query fabricated IDs (e.g., `/room/seed_listing_001_indiranagar`, `/match/seed_seeker_002_priya`, `/chat/test_room_123`) that never existed in the database, relying on forgiving fallback regexes (`/Listing not found|Room Details/i`) to pass whether data exists or not.
4. **Conditional Testing (`if/else` assertions):** Tests in `connectionsAndOwner.spec.ts`, `coreUIAndForms.spec.ts`, and `multiUserBrowserWorkflow.spec.ts` use `if (await button.isVisible()) { click(); } else { fallback(); }`. Tests pass silently even when the intended UI path is completely broken.
5. **Disconnected Seed & Verification Layers:** `run-seed.cjs` and `run-verify.cjs` historically only read and wrote a local JSON file (`tests/data/seed-universe.json`). They never wrote to or verified against Firestore. Only the newly introduced `full-firestore-seed.cjs` actually interacts with Firestore.
6. **Authentication Anti-Patterns:** Tests oscillate between raw form login with arbitrary selectors, `page.addInitScript` mock session injection, and zero session handling, resulting in redirect loops to `/login` and auth state contamination.

---

## 2. Inventory of Test Assets

### Configuration & Tooling
| Path | Purpose | Audit Assessment |
| :--- | :--- | :--- |
| `playwright.config.ts` | Root Playwright config | **Critical Flaw:** `testDir: './tests'` matches all `.spec.ts` files including unit/API mocks. `workers: 2` with shared database state causes race conditions. Missing project-level storageState mapping. |
| `package.json` | Root test scripts | Scripts mix vitest, playwright, and shell runners without strict phase ordering. |

### Test Suites
| Path | Current Role | Audit Assessment |
| :--- | :--- | :--- |
| `tests/auth/authGatewayHealth.spec.ts` | 12 Auth gateway tests | **Refactor:** Tests verify injected localStorage objects rather than real browser auth sessions or UI login behavior. Duplicates `/admin` route guard tests. |
| `tests/e2e/authFlows.spec.ts` | 7 Auth flow tests | **Retain & Refactor:** Contains legitimate UI login form tests (AUTH-01 to AUTH-04), but mixes in mock sessions and duplicate route redirects (AUTH-07). |
| `tests/e2e/foundation.spec.ts` | 5 Smoke & info page tests | **Refactor:** Good baseline smoke checks, but duplicates branding tests in `coreUIAndForms.spec.ts` and legacy redirects in `authFlows.spec.ts`. |
| `tests/e2e/coreUIAndForms.spec.ts` | 10 UI & form tests | **Refactor & Split:** Mixes unauthenticated route guard checks (UI-02, UI-03, UI-09, UI-10), search tests, and fake IDs (UI-05, UI-06). |
| `tests/e2e/connectionsAndOwner.spec.ts` | 7 Connection & owner tests | **Remove / Merge:** 5 of 7 tests are duplicate unauthenticated redirects to `/login`. CONN-01 has conditional `if/else` testing. |
| `tests/e2e/crossFeatureJourneys.spec.ts` | 5 Cross-feature tests | **Remove / Merge:** Completely duplicates existing tests (JOURNEY-B duplicates CONN-01; JOURNEY-C duplicates OWNER-01/03/SEC-01). |
| `tests/e2e/multiUserBrowserWorkflow.spec.ts` | 5 Multi-user tests | **Refactor:** Valid multi-user context design, but contains conditional execution (`if (await isVisible())`), dynamic timestamps (`Date.now()`), and unverified leak assertions. |
| `tests/e2e/onboardingAndAdminWorkflows.spec.ts` | 8 Onboarding & admin tests | **Retain & Refactor:** High-value workflows (quarantine, admin dashboards, blocked account screen), but needs deterministic persona storageState instead of inline mock setups. |
| `tests/e2e/ownerWorkflowAndVerification.spec.ts` | 5 Owner verification tests | **Retain & Refactor:** Important verification badge and lifecycle checks, but OWNER-V-02 uses hardcoded doc ID without seed verification. |
| `tests/e2e/searchAndMatching.spec.ts` | 6 Search & discovery tests | **Merge:** Duplicates search and filter opening from `coreUIAndForms.spec.ts`. Compatibility checks should be structured in dedicated feature tests. |
| `tests/security/adminAndSecurity.spec.ts` | 8 Admin route security tests | **Refactor / Consolidate:** Tests identical redirect behavior 8 times across different `/admin/*` subroutes. |
| `tests/security/connectionQuotaSecurity.spec.ts` | 2 Connection quota tests | **Critical Flaw:** RISK-02-A defines an inline JS function and asserts `expect(5).toBe(5)` instead of testing real client UI or Firebase rules! |
| `tests/api/*.spec.ts` (9 files) | "API" test suites | **Wrong Directory / Mocked:** Pure in-memory unit tests using `BackendTestHarness`. Must not run as Playwright browser tests. |
| `tests/unit/*.spec.ts` (3 files) | Unit suites | Should be run via `vitest` or standalone Node, not swept up in Playwright E2E. |

### Fixtures, Helpers & Seed Infrastructure
| Path | Purpose | Audit Assessment |
| :--- | :--- | :--- |
| `tests/fixtures/authFixtures.ts` | Base test extensions & helpers | Uses `page.addInitScript` to mock localStorage. Does not use Playwright's native `storageState` fixture pipeline. |
| `tests/helpers/backendTestHarness.ts` | In-memory DB & rule evaluator | 364 lines simulating Firestore rules in JS. Useful for fast offline logic validation, but misleading when called in `tests/api/`. |
| `tests/helpers/generateAuthStorageStates.cjs` | Generates storage states | Generates valid Playwright storage states in `tests/.auth/`, but they are unused by test files. |
| `tests/seed/run-seed.cjs` | Seed runner | Historically only wrote JSON to disk. Now augmented by `full-firestore-seed.cjs`. |
| `tests/seed/run-verify.cjs` | Verification runner | Only checks `tests/data/seed-universe.json`; does not verify real Firestore state. |
| `tests/seed/run-reset.cjs` | Reset runner | Only unlinks local files; does not purge or reset Firestore test collections. |
| `tests/seed/full-firestore-seed.cjs` | Real Firestore admin seed | Seeds real users, listings, connections, chat rooms, messages, and notifications into Firestore. Solid foundation for Phase 2. |

---

## 3. Detailed Findings by Flaw Category (A through N)

### A. Duplicate Tests
* **Duplicate Unauthenticated Route Guards:**
  * `tests/e2e/connectionsAndOwner.spec.ts` (OWNER-01) tests that `/owner-dashboard` redirects to `/login`.
  * `tests/e2e/coreUIAndForms.spec.ts` (UI-09) tests the exact same route and redirect.
  * `tests/e2e/crossFeatureJourneys.spec.ts` (JOURNEY-C) tests the exact same route and redirect a third time.
  * `tests/e2e/connectionsAndOwner.spec.ts` (OWNER-03) tests `/edit-listing/new` -> `/login`.
  * `tests/e2e/crossFeatureJourneys.spec.ts` (JOURNEY-C) tests `/edit-listing/new` -> `/login` again.
* **Duplicate Branding / Landing Page Loads:**
  * `tests/e2e/foundation.spec.ts` (Test A): Landing page headline, title, and search button.
  * `tests/e2e/coreUIAndForms.spec.ts` (Test UI-01): Landing page headline, title, and search button.
  * `tests/e2e/crossFeatureJourneys.spec.ts` (Test VISUAL-01): Logo and brand icon rendering.
* **Duplicate Legacy Route Redirects:**
  * `tests/e2e/foundation.spec.ts` (Test E): `/phone-login` -> `/login`.
  * `tests/e2e/authFlows.spec.ts` (Test AUTH-07): `/phone-login` -> `/login`.
* **Duplicate Explore Search & Filter Actions:**
  * `tests/e2e/coreUIAndForms.spec.ts` (UI-07) and `tests/e2e/searchAndMatching.spec.ts` (SEARCH-01) both fill a locality in Explore search.
  * `tests/e2e/coreUIAndForms.spec.ts` (UI-08) and `tests/e2e/searchAndMatching.spec.ts` (SEARCH-04) both open the filter modal and inspect budget/amenities.
* **Duplicate Admin Rejection:**
  * `tests/auth/authGatewayHealth.spec.ts` (AUTH-11) and `tests/e2e/onboardingAndAdminWorkflows.spec.ts` (ADMIN-04) both assert seeker redirection away from `/admin`.

### B. Obsolete Tests
* `tests/e2e/coreUIAndForms.spec.ts` (UI-05): Tests deep link `/room/seed_listing_001_indiranagar` which does not exist in any seed dataset.
* `tests/e2e/coreUIAndForms.spec.ts` (UI-06): Tests deep link `/match/seed_seeker_002_priya` which does not exist in any seed dataset.
* `tests/security/connectionQuotaSecurity.spec.ts` (RISK-02-A): Uses pure inline JavaScript math (`(connectsUsed, isPremium) => isPremium || connectsUsed < 5`) and asserts `expect(5).toBe(5)`—completely obsolete as an integration/security test.

### C. Tests in Wrong Directories
* All 9 test files in `tests/api/`:
  * `authAndUserApi.spec.ts`, `businessLogicApi.spec.ts`, `connectionsAndQuotaApi.spec.ts`, `listingsApi.spec.ts`, `matchingApi.spec.ts`, `messagingAndNotifsApi.spec.ts`, `moderationAndVerifApi.spec.ts`, `multiUserWorkflowApi.spec.ts`, `securityAndRulesApi.spec.ts`.
  * None of these tests use a browser, Playwright page, or HTTP API client. They call `BackendTestHarness` in memory. Running them under Playwright causes massive test-runner bloat and confusion.
* `tests/unit/*.spec.ts`:
  * `businessRules.spec.ts`, `environmentHealth.spec.ts`, `testUniverse.spec.ts` are unit tests and should be managed by a unit test runner (Vitest) or Node test runner.

### D. Tests That Depend on Another Test
* In `tests/e2e/multiUserBrowserWorkflow.spec.ts` (MULTI-03): User A sends a message in the chat room. If tests run without resetting database state, any test expecting zero messages or a specific unread count in that room will fail.
* In `tests/e2e/ownerWorkflowAndVerification.spec.ts` (OWNER-V-02): Assumes listing `FSXystxUrr3MzY37W7L2` is `pending_verification`. If a previous test or seed script marked it `active`, this test fails.

### E. Tests That Mutate Shared State
* Real-time message sending in `tests/e2e/multiUserBrowserWorkflow.spec.ts` (MULTI-03) appends documents to Firestore subcollections with dynamically generated message strings (`Hello from Seeker A test run ${Date.now()}`).
* `AuthHelpers.clearAuthSession(page)` in `tests/auth/authGatewayHealth.spec.ts` (AUTH-04) clears client storage mid-suite.

### F. Tests That Require Login Repeatedly
* `tests/e2e/authFlows.spec.ts` performs UI form entry across multiple tests. While acceptable in an authentication feature spec, other specs (`coreUIAndForms.spec.ts`, `onboardingAndAdminWorkflows.spec.ts`) should use pre-authenticated storage states rather than repetitive login steps or manual init scripts.

### G. Tests That Perform Unnecessary Logout/Login Cycles
* `tests/auth/authGatewayHealth.spec.ts` (AUTH-04) logs in as Seeker A and immediately purges storage in the same test without testing real app logout flow (such as clicking the user menu -> Logout).

### H. Tests That Depend on Arbitrary Timing
* `tests/e2e/connectionsAndOwner.spec.ts` (CONN-01, line 11):
  ```typescript
  if (await candidateConnectBtn.isVisible()) {
    await candidateConnectBtn.click();
  } else {
    await expect(createProfileBtn).toBeVisible({ timeout: 10000 });
  }
  ```
  `isVisible()` evaluates immediately without waiting for hydration. Depending on CPU speed, this branches unpredictably.
* `tests/e2e/multiUserBrowserWorkflow.spec.ts` (MULTI-03, lines 76-88):
  `await messageInputA.isVisible({ timeout: 5000 }).catch(() => false)` drops into an `else` clause that clicks a conversation item and never sends the message.

### I. Tests That Use Hard-Coded Data Without Verifying It Exists
* Hard-coded non-existent listing: `seed_listing_001_indiranagar` in `coreUIAndForms.spec.ts`.
* Hard-coded non-existent seeker: `seed_seeker_002_priya` in `coreUIAndForms.spec.ts`.
* Hard-coded unseeded room: `test_room_123` in `connectionsAndOwner.spec.ts`.
* Hard-coded unseeded room: `unauthorized_private_room_999` in `multiUserBrowserWorkflow.spec.ts`.
* Hard-coded unverified listing: `FSXystxUrr3MzY37W7L2` in `ownerWorkflowAndVerification.spec.ts` (which is actually an active verified listing in Firestore).

### J. Tests That Create Their Own Inconsistent Data
* `tests/security/connectionQuotaSecurity.spec.ts` (RISK-02-A): Creates an ad-hoc in-memory user (`quota_e2e_user`) with `connectsUsed: 5` that does not exist in the database, meaning backend security rules can never be legitimately tested against it.
* `tests/e2e/onboardingAndAdminWorkflows.spec.ts` (ONBOARD-03): Creates `seeker_onboarding_test` in mock localStorage only.

### K. Tests That Use Backend Shortcuts Instead of Real UI Behavior
* `tests/auth/authGatewayHealth.spec.ts` (AUTH-01 to AUTH-10): All tests call `AuthHelpers.loginAsSeekerA(page)` (which executes `page.addInitScript` to write an object into localStorage) and then assert that `window.localStorage.getItem('nestmate_auth_session')` has the object! This tests JavaScript's `localStorage.setItem` rather than NestMate's auth system.
* `tests/security/connectionQuotaSecurity.spec.ts`: Avoids making a real request and instead evaluates an in-memory function.

### L. Tests That Mix Multiple Unrelated Features
* `tests/e2e/crossFeatureJourneys.spec.ts`: Blends landing navigation, search input, auth modals, role routing, responsive viewport calculations, and logo branding in a single file.

### M. Tests That Are Too Large and Should Be Split
* `tests/unit/businessRules.spec.ts` (18 KB): Contains over 15 business rule checks in one massive file.
* `tests/api/listingsApi.spec.ts` (8 KB): Evaluates 7 distinct lifecycle states in one monolithic suite.

### N. Tests That Can Become Flaky Because of Shared Firebase State
* `playwright.config.ts` runs with `workers: 2`. When tests run in parallel, worker contexts make simultaneous mutations against `nestmate-eb562`, contaminating query results, notification counts, and room active states.

---

## 4. File-by-File Disposition Table

| File | Current Status | Disposition | Rationale |
| :--- | :--- | :--- | :--- |
| `playwright.config.ts` | Shared config | **Refactor** | Configure `workers: 1` for deterministic sequential execution; separate E2E projects by persona/storageState; point `testDir` strictly to `tests/e2e`. |
| `tests/auth/authGatewayHealth.spec.ts` | Mock auth tests | **Refactor** | Transform into Phase 3 `00-auth-foundation.spec.ts` testing genuine session hydration, storageState consumption, logout UI, and route guards. |
| `tests/e2e/00-environment-smoke.spec.ts` | Does not exist | **Create (Phase 1)** | Dedicated tiny smoke test verifying shell render, no console crashes, and desktop/mobile support. |
| `tests/e2e/foundation.spec.ts` | Mixed smoke | **Refactor** | Retain static legal/informational page rendering; remove duplicate landing/search tests. |
| `tests/e2e/authFlows.spec.ts` | UI login tests | **Retain & Refactor** | Keep form validation, toggle, and password reset flows. Move unauthenticated redirects out. |
| `tests/e2e/coreUIAndForms.spec.ts` | Redundant UI tests | **Remove / Merge** | Break into dedicated feature tests under `tests/e2e/features/` (Explore, Details, Onboarding). Remove obsolete 404 tests. |
| `tests/e2e/connectionsAndOwner.spec.ts` | Redirect checks | **Remove** | 5 redirect tests duplicate existing guard tests; the 2 interaction tests move to `features/connections/`. |
| `tests/e2e/crossFeatureJourneys.spec.ts` | Duplicate journeys | **Remove** | Completely redundant with existing foundation and discovery tests. |
| `tests/e2e/searchAndMatching.spec.ts` | Search checks | **Refactor** | Move to `tests/e2e/features/search/` with verified seed data and deterministic persona storageState. |
| `tests/e2e/onboardingAndAdminWorkflows.spec.ts` | Onboarding & admin | **Refactor** | Move onboarding to `features/onboarding/` and admin controls to `features/admin/` with certified ADMIN persona. |
| `tests/e2e/ownerWorkflowAndVerification.spec.ts` | Owner workflows | **Refactor** | Move to `features/listings/` and `features/verification/` referencing verified seed IDs. |
| `tests/e2e/multiUserBrowserWorkflow.spec.ts` | Multi-user chat | **Refactor (Phase 8/9)** | Rewrite in Phase 8/9 using strict dual-context pattern with deterministic assertions (no `if/else`). |
| `tests/security/adminAndSecurity.spec.ts` | Route redirects | **Merge (Phase 10)** | Consolidate into Phase 10 security regression. |
| `tests/security/connectionQuotaSecurity.spec.ts` | Mocked quota | **Rewrite (Phase 10)** | Replace dummy JS math with real UI action and real Firestore rules rejection. |
| `tests/api/*.spec.ts` (9 files) | In-memory rule mocks | **Relocate / Exclude** | Exclude from Playwright testDir. Move to a dedicated logic unit suite or replace with real emulator rules tests. |
| `tests/unit/*.spec.ts` (3 files) | Unit suites | **Exclude** | Move out of Playwright's `testMatch` scope into standard Vitest unit testing. |
| `tests/helpers/testDataRegistry.ts` | Does not exist | **Create (Phase 2)** | Central typed registry of all test IDs, personas, and entity constants. |
| `tests/helpers/verifySeedData.ts` | Does not exist | **Create (Phase 2)** | Real Firestore query validator ensuring all required seed entities and foreign keys exist. |
| `tests/helpers/personaRegistry.ts` | Does not exist | **Create (Phase 4)** | Typed persona definitions mapped to certified storageState paths. |

---

## 5. Root Causes of Current Test Suite Collapse

1. **Lack of a Certified Test Data Contract:** Test authors picked arbitrary strings (`seed_listing_001_indiranagar`, `test_room_123`) instead of referring to a single source of truth. When those IDs returned 404, tests were "fixed" by accepting 404 text in assertions.
2. **Confusing Mock Session with Real Auth:** Setting `nestmate_auth_session` in `localStorage` works for React components checking `useAuth`, but does not authenticate the Firebase client SDK (`auth.currentUser` remains `null`). When the app queries protected collections (`chatRooms`, `connections`), Firebase rejects with permissions errors, trapping the app in empty or loading states.
3. **No Strict Phase Ordering:** E2E multi-user tests were attempted before verifying that the environment, seed data, and authentication baseline were stable.
4. **Parallel Worker Contamination:** Running 2 workers against the same live Firestore collections caused tests to overwrite each other's data mid-run.

---

## 6. Next Steps (Phase 1 to Phase 11 Roadmap)

The audit confirms that the existing test code must not be run as a monolithic suite. We will proceed strictly phase by phase:

1. **PHASE 1:** Certify test environment with a tiny, standalone `tests/e2e/00-environment-smoke.spec.ts` running sequentially (`workers: 1`) on both Desktop Chrome and Mobile Chrome.
2. **PHASE 2:** Build `testDataRegistry.ts`, generate `seed-data-contract.md`, create `verifySeedData.ts` that validates real Firestore documents, and certify seed data.
3. **PHASE 3:** Build `tests/auth/00-auth-foundation.spec.ts` verifying real authentication sessions, storageState consumption, and session isolation.
4. **PHASE 4:** Build `personaRegistry.ts` and certify each persona independently.
5. **PHASE 5:** Generate the complete feature test matrix (`test-discovery/feature-test-matrix.md`).
6. **PHASE 6–11:** Implement and certify feature-by-feature tests in dedicated directories under `tests/e2e/features/`, followed by cross-feature, multi-user, and security regressions.

---
*End of Phase 0 Audit Report. Ready for Phase 1 upon confirmation.*
