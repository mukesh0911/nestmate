# NESTMATE PLAYWRIGHT E2E EXECUTION RUNBOOK

**Document:** `docs/testing/NESTMATE_PLAYWRIGHT_RUNBOOK.md`  
**Purpose:** Standard Operating Procedures & Execution Commands for E2E Automation  
**Target Environment:** Local Dev / CI / Staging  
**Application Root:** `d:\roomate\app`  

---

## Prerequisites & Environment Setup

Ensure the NestMate application server is running before executing tests:
```powershell
# In terminal 1 (App root: d:\roomate\app)
npm run dev
# Expected output: Local: http://localhost:3000/
```

Verify environment variables:
- Firebase Project: `nestmate-eb562`
- Playwright Node version: Node.js v18+

---

## 1. Reset Test Database

Cleans up test artifacts, prior connection requests, and synthetic test chat rooms between `SEEKER_01` and `OWNER_01`:
```powershell
cd d:\roomate\app
node -e "const { cleanTestConnections } = require('../tests/helpers/seed-test-data.cjs'); cleanTestConnections().then(() => console.log('✅ DB Reset Complete'));"
```

---

## 2. Seed Test Data

Provisions all 18 deterministic test identities, user profiles, questionnaire responses, verification states, and sample listings:
```powershell
cd d:\roomate\app
node tests/helpers/seed-test-data.cjs
```

---

## 3. Validate Seed Data

Verifies directly against Firestore that test accounts and fixtures exist before running tests:
```powershell
cd d:\roomate\app
node -e "
const { getFirestoreDb } = require('../tests/helpers/seed-test-data.cjs');
const db = getFirestoreDb();
async function validate() {
  const users = await db.collection('users').get();
  console.log('Total users in DB:', users.size);
  const listings = await db.collection('listings').where('status', '==', 'active').get();
  console.log('Active listings in DB:', listings.size);
  if (users.size >= 18 && listings.size >= 1) console.log('✅ SEED VALIDATION: PASS');
  else throw new Error('❌ SEED VALIDATION FAILED');
}
validate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
"
```

---

## 4. Run Complete Headless Suite (Master Runner)

Executes all 87 test scenarios across Phases 0 through 15 in isolated headless Chromium contexts:
```powershell
cd d:\roomate\app
node tests/e2e/master_suite_runner.cjs
```
- Real-time formatted console output
- Summary report saved to: `d:\roomate\app\e2e\reports\e2e_master_suite_results.json`

---

## 5. Run Headed Chromium (Visual Debug Mode)

Launches browser windows with slow-motion (300ms) to visually inspect interactions, form filling, and page transitions:
```powershell
cd d:\roomate\app
$env:HEADED="true"; $env:SLOWMO="300"; node tests/e2e/master_suite_runner.cjs
```

---

## 6. Run Critical Smoke Suite

Runs only essential high-priority paths (Healthcheck, Auth, Seeker Dashboard, Owner Dashboard, Security Guards):
```powershell
cd d:\roomate\app
$env:SMOKE_ONLY="true"; node tests/e2e/master_suite_runner.cjs
```

---

## 7. Run Only Failed Tests

Re-executes any test scenarios marked `FAIL` in the previous test execution run:
```powershell
cd d:\roomate\app
$env:RERUN_FAILED="true"; node tests/e2e/master_suite_runner.cjs
```

---

## 8. View Test Reports & Failure Artifacts

Inspect the JSON execution results:
```powershell
cd d:\roomate\app
Get-Content e2e\reports\e2e_master_suite_results.json | ConvertFrom-Json | Select-Object -ExpandProperty summary
```

View failure screenshots (captured automatically on test errors):
```powershell
# Open screenshots directory
explorer d:\roomate\app\e2e\screenshots
```

---

## CI/CD Pipeline One-Liner

To run the complete automated validation in CI/CD pipelines with non-zero exit code on failures:
```powershell
npm run test:e2e
```
*(Configured to execute `master_suite_runner.cjs` with exit code 0 for 100% pass of automated non-blocked tests)*
