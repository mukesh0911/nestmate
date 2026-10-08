# NestMate — UI Component Inventory
_Evidence source: src/components/, src/pages/, src/pages/admin/_

---

## Layout Components

| Component | File | Purpose | Notes |
|-----------|------|---------|-------|
| Layout | Layout.tsx (42KB) | Primary app shell | Navbar, mobile nav, sidebar, wraps all post-landing pages |
| AdminLayout | admin/AdminLayout.tsx (13KB) | Admin shell | Admin sidebar navigation |
| AuthLayout | AuthLayout.tsx (9KB) | Auth page wrapper | Used during login/onboarding flows |
| AuthLayoutSkeleton | AuthLayoutSkeleton.tsx | Loading skeleton for auth | |
| PageShell | PageShell.tsx | Thin wrapper | Used for consistent page structure |

---

## Global UI State Components

| Component | Purpose |
|-----------|---------|
| Toaster (Sonner) | Toast notifications -- position: top-center, richColors |
| PageLoader | Full-screen spinner (Loader2 icon) during auth/route loading |
| BlockedAccountScreen | Full-screen block UI for suspended/banned accounts |

---

## Modal Components

| Component | File | Trigger Context |
|-----------|------|----------------|
| AuthModal | AuthModal.tsx (8KB) | Inline auth prompt for unauthenticated actions |
| ScreeningQuestionnaireModal | ScreeningQuestionnaireModal.tsx (28KB) | Before sending connect request (if owner configured questions) |
| ContactModal | ContactModal.tsx (9KB) | Share contact / WhatsApp after connection accepted |
| AdvancedFiltersModal | AdvancedFiltersModal.tsx (18KB) | Advanced search filters |
| CreateTeamModal | CreateTeamModal.tsx (4KB) | Create flatmate team (UNCERTAIN -- feature unclear) |
| AadhaarVerifyModal | AadhaarVerifyModal.tsx (1KB) | Aadhaar verification (IN CODE -- integration depth unclear) |
| DigiLockerModal | DigiLockerModal.tsx (1KB) | DigiLocker integration (IN CODE -- integration depth unclear) |
| ApplicantScreeningAnswersModal | ApplicantScreeningAnswersModal.tsx (6KB) | Owner views seeker's screening answers |

---

## Card Components

| Component | File | Used In |
|-----------|------|---------|
| RoomCard | RoomCard.tsx (10KB) | Listings grid in ExplorePage / BrowseRooms |
| CompactRoomCard | CompactRoomCard.tsx (11KB) | Owner dashboard listings list |
| DashboardSeekerCard | DashboardSeekerCard.tsx (15KB) | Owner dashboard seeker browse |
| OwnerSeekerCard | OwnerSeekerCard.tsx (8KB) | Owner-specific seeker display |

---

## Profile / Trust Components

| Component | File | Purpose |
|-----------|------|---------|
| TrustBadge | TrustBadge.tsx (12KB) | Verification badges on profiles |
| SeekerTrustBanner | SeekerTrustBanner.tsx (2KB) | Trust information banner for seekers |
| FlatmateAvatar | FlatmateAvatar.tsx (5KB) | Rendered avatar with active status indicator |
| RoommateAvatar | RoommateAvatar.tsx (61B) | Minimal avatar (stub?) |
| ProfileCompleteness | ProfileCompleteness.tsx (10KB) | Profile completeness score widget |
| OwnerVerificationGate | OwnerVerificationGate.tsx (26KB) | Gate for owner-specific features requiring verification |
| Badge | Badge.tsx (1KB) | Reusable badge primitive |

---

## Interactive Components

| Component | File | Purpose |
|-----------|------|---------|
| LocationAutocomplete | LocationAutocomplete.tsx (9KB) | Google Places-powered location input |
| MapPreview | MapPreview.tsx (16KB) | Embedded map preview for listing/profile location |
| HeroMatchShowcase | HeroMatchShowcase.tsx (17KB) | Landing page match showcase animation |

---

## State Components

| Component | File | Purpose |
|-----------|------|---------|
| StateEmpty | StateEmpty.tsx (1KB) | Empty state display |
| StateLoading | StateLoading.tsx (1KB) | Loading state display |

---

## Landing Components

| Directory | Purpose |
|-----------|---------|
| components/landing/ | Landing page specific sub-components |

---

## Page Inventory (34 pages + 9 admin pages)

### Public Pages
| Page | File | Size | Key Interactions |
|------|------|------|-----------------|
| LandingPage | LandingPage.tsx | 2KB | CTA buttons for seeker/owner flow |
| ExplorePage | ExplorePage.tsx | 60KB | Tab navigation, filtering, map toggle, save/connect actions |
| RoomDetail | RoomDetail.tsx | 76KB | Full listing detail, connect CTA, map, photo gallery |
| MatchDetail | MatchDetail.tsx | 75KB | Full seeker profile detail, connect CTA, compatibility breakdown |
| HowItWorks | HowItWorks.tsx | 4KB | Static informational |
| AboutUs | AboutUs.tsx | 4KB | Static informational |
| PrivacyPolicy | PrivacyPolicy.tsx | 5KB | Static informational |
| TrustCenter | TrustCenter.tsx | 15KB | Trust and safety information |
| SafetyCenter | SafetyCenter.tsx | 16KB | Safety tips and resources |
| HelpSupport | HelpSupport.tsx | 13KB | FAQ and support content |
| PricingPage | PricingPage.tsx | 18KB | Pricing tiers display |
| NotFound | NotFound.tsx | 1KB | 404 page |

### Auth / Onboarding Pages
| Page | File | Size | Key Interactions |
|------|------|------|-----------------|
| AuthPage | AuthPage.tsx | 41KB | Login, signup, Google, phone OTP flows |
| RoleSelect | RoleSelect.tsx | 6KB | seeker or owner selection |
| SeekerOnboarding | SeekerOnboarding.tsx | 55KB | Multi-step form with quiz |
| OwnerOnboarding | OwnerOnboarding.tsx | 52KB | Multi-step owner form |
| PhoneLogin | PhoneLogin.tsx | 105B | Stub -- redirects to /login |
| OTPVerify | OTPVerify.tsx | 7KB | OTP code entry |
| VerifyPhone | VerifyPhone.tsx | 15KB | Phone verification step |

### Authenticated Pages
| Page | File | Size | Key Interactions |
|------|------|------|-----------------|
| SeekerDashboard | SeekerDashboard.tsx | 95KB | (Appears legacy -- seekers redirected to ExplorePage) |
| OwnerDashboard | OwnerDashboard.tsx | 176KB | Largest file. Multi-tab management hub |
| EditListing | EditListing.tsx | 45KB | Create/edit listing form with photo upload |
| ChatPage | ChatPage.tsx | 38KB | Real-time chat interface |
| ProfilePage | ProfilePage.tsx | 39KB | Own profile view |
| EditProfile | EditProfile.tsx | 31KB | Profile editing form |
| ProfilePreview | ProfilePreview.tsx | 13KB | Public-facing profile preview |
| PreferencesPage | PreferencesPage.tsx | 18KB | Seeker matching preference config |
| ApplicantCompare | ApplicantCompare.tsx | 32KB | Side-by-side seeker comparison |
| SettingsPage | SettingsPage.tsx | 32KB | App settings including dark mode |
| NotificationsPage | NotificationsPage.tsx | 13KB | Notification list |
| MapView | MapView.tsx | 41KB | Full map view of listings |
| BrowseRooms | BrowseRooms.tsx | 27KB | (May be legacy -- redirected to /explore?tab=rooms) |
| BrowseSeekers | BrowseSeekers.tsx | 20KB | (May be legacy -- redirected) |

### Admin Pages
| Page | File | Size |
|------|------|------|
| AdminDashboard | admin/AdminDashboard.tsx | 17KB |
| AdminUsers | admin/AdminUsers.tsx | 28KB |
| AdminListings | admin/AdminListings.tsx | 26KB |
| AdminMarketplace | admin/AdminMarketplace.tsx | 10KB |
| AdminReports | admin/AdminReports.tsx | 29KB |
| AdminVerifications | admin/AdminVerifications.tsx | 43KB |
| AdminNotifications | admin/AdminNotifications.tsx | 18KB |
| AdminSettings | admin/AdminSettings.tsx | 33KB |

### Dev Pages
| Page | File | Notes |
|------|------|-------|
| SeedData | SeedData.tsx | 23KB, DEV only via /dev/seed |

---

## UI Component Library (src/components/ui/)

Standard shadcn/radix-style component library. Contents not individually listed -- assumed to include: button, input, dialog, select, checkbox, label, badge, card, tabs, etc.

---

## Key Reachability Notes

- **SeekerDashboard (95KB)** — exists as a page file but seekers are redirected to `/explore?tab=rooms` via DashboardRedirect. May contain legacy or alternative seeker hub code.
- **BrowseRooms / BrowseSeekers** — standalone pages that redirect to ExplorePage. The page components themselves may be unused dead code or contain redirect logic.
- **PhoneLogin (105B)** — effectively a stub that redirects to /login. Not a functional page.
