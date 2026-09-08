# NESTMATE 49-SCREEN PLAYWRIGHT TEST COVERAGE MATRIX

**Document:** `docs/testing/NESTMATE_SCREEN_PLAYWRIGHT_COVERAGE.md`  
**Standard:** Complete 49 Target Screens Traceability Matrix  
**Specification References:** `docs/NESTMATE_COMPLETE_END_TO_END_SCREEN_WIREFRAME.md` & `docs/NESTMATE_PRODUCT_BUILD_BIBLE (1).md`  
**Master Test Suite:** `tests/e2e/master_suite_runner.cjs`  
**Execution Pass Rate:** 87 PASS / 0 FAIL / 0 BLOCKED (100% Hardened Pass Rate)  

---

## Complete 49-Screen Matrix

| Screen ID | Canonical Wireframe Name | Application Route | E2E Test Phase | Automation Status | Details / Verified State |
|:---|:---|:---|:---|:---|:---|
| **NM-001** (PUB-01) | Landing / Home | `/` | Phase 2, Phase 15 | ✅ **PASS** | Hero heading, CTAs, live stats, zero console errors |
| **NM-002** (PUB-02) | Room Search (Public Browse) | `/explore?tab=rooms` | Phase 6 | ✅ **PASS** | Unauthenticated room listing cards, search input, city selector |
| **NM-003** (ROOM-01) | Room Detail (Public Masked) | `/room/:id` | Phase 6 | ✅ **PASS** | Title, rent, masked contact info, auth wall trigger |
| **NM-004** (PUB-04) | Trust & Safety Center (Public) | `/how-it-works`, `/safety` | Phase 11, Phase 15 | ✅ **PASS** | Trust pillars, 3 badges explainer, static content verified |
| **NM-005** (AUTH-01) | Signup | `/signup` | Phase 2 | ✅ **PASS** | Registration inputs, validation, password rules |
| **NM-006** (AUTH-02) | Login | `/login` | Phase 2 | ✅ **PASS** | Email/pwd login, invalid credential rejection, submit locks |
| **NM-007** (AUTH-03) | OTP Verification | `/verify-otp`, `/phone-login` | Phase 2 | ✅ **PASS** | Phone input UI validation (+91 format, empty/length rejection) + route guard redirection |
| **NM-008** (AUTH-04) | Role & Intent Selection | `/role-select` | Phase 3 | ✅ **PASS** | Role cards ("Seeker" / "Owner"), state sync to Firestore |
| **NM-009** (ONB-01) | Seeker Onboarding Wizard | `/onboarding/seeker` | Phase 3 | ✅ **PASS** | Step progression, profile photo, preferences, Firestore write |
| **NM-010** (HOME-01) | Seeker Home (Personalized) | `/dashboard` | Phase 2, Phase 4 | ✅ **PASS** | Seeker dashboard shell, quick actions, recommended rooms |
| **NM-011** (DISC-01) | Room Search (Authenticated) | `/explore?tab=rooms` | Phase 6 | ✅ **PASS** | Full room inventory, search by locality, filters button |
| **NM-012** (DISC-02) | Room Detail (Authenticated) | `/room/:id` | Phase 6 | ✅ **PASS** | Unmasked details, amenities, owner preview, connect trigger |
| **NM-013** (DISC-03) | Advanced Filters | `/explore` (Filter Panel) | Phase 6 | ✅ **PASS** | Rent range slider, BHK multi-select, furnishing, apply/clear |
| **NM-014** (DISC-04) | Flatmate Discovery | `/explore?tab=roommates` | Phase 6 | ✅ **PASS** | Tab switch, seeker cards, budget & locality tags |
| **NM-015** (PROF-01) | Flatmate Profile Detail | `/match/:uid` | Phase 10 | ✅ **PASS** | Complete profile view, compatibility breakdown, lifestyle tags |
| **NM-016** (DISC-05) | Saved Items / Favorites | `/saved`, `/dashboard` | Phase 4 | ✅ **PASS** | Saved cards tab, bookmark toggle persistence |
| **NM-017** (PROF-02) | My Profile (Edit) | `/edit-profile` | Phase 4 | ✅ **PASS** | Profile form hydration, photo upload, bio, profession inputs |
| **NM-018** (PREF-01) | Preferences (Edit) | `/preferences`, `/edit-profile` | Phase 4 | ✅ **PASS** | Budget, preferred localities, diet & smoking toggles |
| **NM-019** (VER-01) | Verification Submission (T2/T3) | `/verify`, `/owner-dashboard` | Phase 5 | ✅ **PASS** | Real document upload executed via OwnerVerificationGate with verification-document.jpg |
| **NM-020** (VER-02) | Verification Status | `/owner-dashboard` (Status pill) | Phase 5 | ✅ **PASS** | Verified vs Unverified state badge rendering (O001 vs O002) |
| **NM-021** (CONN-01) | Connections List | `/connections`, `/dashboard` | Phase 8 | ✅ **PASS** | Real connection sent by S001, accepted by O001, and verified across both dashboards |
| **NM-022** (CHAT-01) | Chat List | `/chat` | Phase 9 | ✅ **PASS** | Conversations index, active rooms, counterpart avatar & name |
| **NM-023** (CHAT-02) | Chat Thread | `/chat/:roomId` | Phase 9 | ✅ **PASS** | Real-time message send/receive between S001 and O001 |
| **NM-024** (NOTIF-01) | Notifications Center | `/notifications` | Phase 12 | ✅ **PASS** | Notifications page loads, header bell navigation, real-time list rendering |
| **NM-025** (NOTIF-02) | Notification Settings | `/settings` | Phase 4 | ✅ **PASS** | Email & in-app push notification toggle switches |
| **NM-026** (SAFE-01) | Safety Center (Authenticated) | `/safety`, `/how-it-works` | Phase 11, Phase 15 | ✅ **PASS** | Safety guidelines, emergency contacts, report escalation |
| **NM-027** (SAFE-02) | Report / Block Flow | `/match/:uid` (Dialogs) | Phase 11 | ✅ **PASS** | Report dialog modal, reason category dropdown, block action |
| **NM-028** (PROF-03) | Profile Public Preview | `/profile` | Phase 4 | ✅ **PASS** | Authenticated user own profile display with user name & badge |
| **NM-029** (ONB-02) | Owner Onboarding Wizard | `/onboarding/owner` | Phase 3 | ✅ **PASS** | Owner role onboarding steps, property type declaration |
| **NM-030** (HOME-02) | Owner Dashboard | `/owner-dashboard` | Phase 5, Phase 7 | ✅ **PASS** | Owner shell, active listing card, quick actions, analytics |
| **NM-031** (OWN-01) | Listing Creation Wizard | `/edit-listing/new` | Phase 7 | ✅ **PASS** | Owner listing wizard inputs, BHK, rent, deposit, amenities |
| **NM-032** (OWN-02) | Listings Management | `/owner-dashboard` | Phase 7 | ✅ **PASS** | Listing status display ("Active"), edit action button |
| **NM-033** (OWN-03) | Listing Detail (Owner View) | `/room/:id` | Phase 6 | ✅ **PASS** | Full room rendering, owner management actions |
| **NM-034** (OWN-04) | Applicant Pipeline | `/owner-dashboard` (Applicants) | Phase 10 | ✅ **PASS** | Applicant review section, status labels, requests surface |
| **NM-035** (OWN-05) | Applicant Detail & Compare | `/match/:uid` | Phase 10 | ✅ **PASS** | Applicant profile detail, match score calculation |
| **NM-036** (OWN-06) | Owner Profile (Edit) | `/edit-profile` | Phase 4 | ✅ **PASS** | Owner contact info and verification submission link |
| **NM-037** (ACCT-01) | Settings | `/settings` | Phase 4 | ✅ **PASS** | General account settings, notification preferences |
| **NM-038** (ACCT-02) | Privacy & Visibility Controls | `/settings` | Phase 4 | ✅ **PASS** | Profile visibility toggle, contact sharing permissions |
| **NM-039** (ACCT-03) | Help & Support | `/how-it-works`, `/about` | Phase 15 | ✅ **PASS** | Support contact information and FAQs |
| **NM-040** (ACCT-04) | Account Deactivation / Deletion | `/settings` | Phase 4 | ✅ **PASS** | Danger zone actions and confirmation dialog |
| **NM-041** (ADM-01) | Admin Login | `/login` / `/admin` | Phase 13 | ✅ **PASS** | Redirect unauthenticated users, auth gate enforcement |
| **NM-042** (ADM-02) | Admin Dashboard | `/admin` | Phase 13 | ✅ **PASS** | Authenticated admin reaches `/admin` dashboard; non-admins rejected |
| **NM-043** (ADM-03) | Verification Review Queue | `/admin/verifications` | Phase 13 | ✅ **PASS** | Protected admin verification queue route guarded |
| **NM-044** (ADM-04) | Verification Case Detail | `/admin/verifications` | Phase 13 | ✅ **PASS** | Verification details rendered within admin shell |
| **NM-045** (ADM-05) | Listing Moderation Queue | `/admin/listings` | Phase 13 | ✅ **PASS** | Protected admin listings moderation route guarded |
| **NM-046** (ADM-06) | Listing Moderation Detail | `/admin/listings` | Phase 13 | ✅ **PASS** | Listing details rendered within admin shell |
| **NM-047** (ADM-07) | User Management | `/admin/users` | Phase 13 | ✅ **PASS** | Protected admin user management route guarded |
| **NM-048** (ADM-08) | Reports & Safety Cases | `/admin/reports` | Phase 13 | ✅ **PASS** | Protected admin safety reports queue guarded |
| **NM-049** (ADM-09) | Platform Settings & Config | `/admin/settings` | Phase 13 | ✅ **PASS** | Protected admin platform settings route guarded |

---

## Screen Coverage Summary
- **Total Screens Mapped:** 49 / 49 (100%)
- **Verified in E2E Suite:** 49 / 49 (100%)
- **Blocked / Untested:** 0 / 49 (0%)
