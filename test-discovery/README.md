# NestMate — Discovery Audit Index
_Phase: Discovery Only. No test cases created. No code modified._
_Date: 2026-10-05_

---

## Audit Status

| Checkpoint | Status |
|-----------|--------|
| Source code structure mapped | COMPLETE |
| Routes inventoried | COMPLETE |
| Database schema documented | COMPLETE |
| Auth flows traced | COMPLETE |
| Business logic cataloged | COMPLETE |
| Feature inventory classified | COMPLETE |
| UI component inventory | COMPLETE |
| Running app verification | PENDING (requires browser session) |

---

## Artifacts in this Discovery Package

| File | Contents |
|------|---------|
| [application-overview.md](./application-overview.md) | Tech stack, roles, access model, confidence levels |
| [routes.json](./routes.json) | All 51 routes with reachability classification |
| [database-schema.md](./database-schema.md) | All 21 Firestore collections, fields, security rules |
| [auth-flows.md](./auth-flows.md) | Auth providers, state machine, guard logic, onboarding |
| [business-logic.md](./business-logic.md) | 20 business logic rules documented |
| [features.md](./features.md) | 80+ features classified by reachability |
| [ui-inventory.md](./ui-inventory.md) | All pages, components, modals with sizes |

---

## Route Count Summary

| Reachability | Count |
|-------------|-------|
| PUBLIC (no auth) | 16 |
| AUTH_REQUIRED | 3 |
| ONBOARDED_SEEKER | 2 |
| ONBOARDED_OWNER | 4 |
| ONBOARDED_ANY | 7 |
| ADMIN | 8 |
| DEV_ONLY | 1 |
| REDIRECT | 13 |
| **Total** | **54** |

---

## Feature Reachability Summary

| Classification | Count |
|---------------|-------|
| REACHABLE (always) | 38 |
| CONDITIONALLY REACHABLE | 26 |
| IN CODE (not verified live) | 8 |
| UNCERTAIN | 4 |
| DEV ONLY | 2 |

---

## Firestore Collections Summary

| Collection | Read Access | Write Access |
|-----------|------------|-------------|
| users | Public | Owner (restricted fields) or Admin |
| privateUserData | Owner or Admin | Owner or Admin |
| userContacts | Owner, Admin, or accepted partner | Owner or Admin |
| acceptedPairs | Participants or Admin | Participants or Admin |
| listings | Public | Owner (with restrictions) or Admin |
| connections | Participants or Admin | Sender create, recipient accept/reject |
| chatRooms | Participants or Admin | Participants or Admin |
| chatRooms/messages | Participants or Admin | Participants create, sender edit |
| notifications | Recipient or Admin | Any authenticated user create |
| listingViews | Authenticated | Anyone (count increment) |
| ratings | Authenticated | Any authenticated user |
| reviews | Authenticated | Creator edit/delete, Admin |
| skippedUsers | Authenticated | Owner only |
| agreementOTPs | Authenticated | Authenticated |
| agreements | Landlord, Tenant, Admin | Participants or Admin |
| verifications | Owner or Admin | Owner create, Admin update/delete |
| ownerVerifications | Owner (own) or Admin | Owner submit, Admin approve |
| reports | Admin only | Active users (no self-report) |
| admins | Self or Admin | Admin only |
| config | Authenticated | Admin only |
| analyticsEvents | Admin only | Active users (immutable) |

---

## Key Findings and Risks

### RISK-01: Admin Route Guard Too Weak (Client-Side)
The `/admin` routes use only `PrivateRoute` (any logged-in user). A non-admin user CAN navigate to the admin UI. Firestore rules will reject all data queries, but the UI shell renders. Consider adding client-side admin check.

### RISK-02: Connection Rate Limiting is Client-Only
`FREE_CONNECT_LIMIT` enforcement is client-side only. A determined user can bypass it via direct Firestore writes (rules don't enforce it). Documents as known limitation.

### RISK-03: Listing Freshness is Client-Only
`isDiscoverable` staleness check is explicitly documented in rules as a known limitation that rules cannot express. Client guard can be bypassed by direct Firestore access.

### RISK-04: /terms Route Shares PrivacyPolicy Component
`/terms` and `/privacy` both render `PrivacyPolicy.tsx`. There is no distinct Terms of Service page.

### RISK-05: SeekerDashboard May Be Legacy Dead Code
The 95KB SeekerDashboard.tsx exists but seekers are redirected away from `/dashboard` to `/explore?tab=rooms`. Needs verification whether it's referenced anywhere or is dead code.

### RISK-06: BrowseRooms / BrowseSeekers May Be Partially Dead
These pages have route files but App.tsx routes for `/browse-rooms` and `/browse-seekers` use redirect components (BrowseRoomsRedirect / BrowseSeekersRedirect), not the page components directly.

### RISK-07: AadhaarVerifyModal and DigiLockerModal — Integration Unclear
Both modal components exist (1-2KB each, suggesting stubs) but their integration in the verification flow is unknown from file sizes alone.

### RISK-08: Nuclear Database Reset in AdminSettings
`wipeEntireDatabase()` was added to useAdmin.ts and exposed in AdminSettings.tsx. This is a high-risk function with no secondary confirmation in Firestore rules.

---

## Quiz Answer Keys (Discovered)

Seeker quiz question keys visible in matching.ts:
- `food_pref` — values: 'veg', 'vegan', 'non_veg'
- `smoking` — values: 'never', 'outside', 'regularly', 'socially'
- `pets` — values: 'no', 'allergic', 'love'
- `cleanliness` — values include 'very'
- `guests` — values: 'rarely'

Full quiz structure requires reading SeekerOnboarding.tsx for complete question/answer mapping.

---

## Next Steps (if proceeding to test generation)

1. **Verify live routes** — browser session to confirm all PUBLIC routes render correctly
2. **Read SeekerOnboarding.tsx** — get complete quiz question/answer map
3. **Read OwnerDashboard.tsx** — understand all owner dashboard tabs and sub-features
4. **Read ExplorePage.tsx** — understand all filter combinations and tab behavior
5. **Read AdminSettings.tsx** — verify nuclear reset UI and other admin settings
6. **Check SeedData.tsx** — understand seed data capabilities for test setup
7. **Read useListings.ts** — understand query patterns and real-time subscription model
