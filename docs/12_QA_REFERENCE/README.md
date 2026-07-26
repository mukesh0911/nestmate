# 12 — QA Reference

> **Purpose**: Links to existing QA documentation and testing approach  
> **Audience**: QA engineers, developers  
> **Dependencies**: [04 Features](../04_FEATURES/README.md)  
> **Related**: [07 Developer Guide](../07_DEVELOPER_GUIDE/README.md)

---

## Current Testing State

NestMate does not currently have automated test suites. The project is in active development (≈90% complete) by a 2-person bootstrap team.

### What Exists
- **No unit tests** — no test framework configured in `package.json`
- **No integration tests** — no end-to-end testing setup
- **No CI/CD pipeline** — deployment is manual via `firebase deploy`
- **Type safety** — TypeScript provides compile-time type checking
- **ESLint** — `eslint` is configured for code quality linting

### Testing Strategy (Recommended for Future)

| Layer | Tool | Coverage Target |
|-------|------|----------------|
| Unit Tests | Vitest | Hook logic (useMatches, useConnections, useAuth) |
| Component Tests | Testing Library | UI components (TrustBadge, ProfileCompleteness) |
| Integration Tests | Playwright | Critical user flows (signup, connect, chat) |
| Security Tests | Firestore Rules Emulator | All Firestore security rules |
| Visual Tests | Chromatic / Percy | UI regression across breakpoints |

### Critical Flows to Test

| Priority | Flow | Pages Involved |
|----------|------|---------------|
| P0 | Signup → Onboarding → Dashboard | AuthPage → SeekerOnboarding → SeekerDashboard |
| P0 | Owner lists room → Receives application | OwnerOnboarding → OwnerDashboard |
| P0 | Connect → Accept → Chat | SeekerDashboard → OwnerDashboard → ChatPage |
| P1 | Filter and search matches | SeekerDashboard filters |
| P1 | Phone sharing protocol | ChatPage |
| P1 | Admin verification workflow | AdminVerifications |
| P2 | Dark mode toggle | SettingsPage |
| P2 | Language switching | SettingsPage + all pages |
| P2 | Account deletion | SettingsPage |

### Firestore Rules Testing

Firebase provides an emulator-based testing approach:
```bash
# Install Firebase Emulators
firebase emulators:start

# Run rules tests (to be configured)
npx vitest run tests/rules/
```

---

> **Note**: Per project guidelines, this documentation does **not** create QA reports, test cases, or bug reports. This section exists solely as a reference for future testing infrastructure.

---

*→ Next: [13 Changelog](../13_CHANGELOG/README.md)*
