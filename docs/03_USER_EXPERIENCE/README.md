# 03 — User Experience

> **Purpose**: Personas, user journeys, flows, and information architecture  
> **Audience**: Designers, product managers, developers  
> **Dependencies**: [01 Product](../01_PRODUCT/README.md) · [02 Requirements](../02_REQUIREMENTS/README.md)  
> **Related**: [04 Features](../04_FEATURES/README.md)

---

## User Personas

### Persona 1: Rohan — The IT Relocator (Seeker)

| Attribute | Detail |
|-----------|--------|
| **Name** | Rohan Deshmukh |
| **Age** | 25 |
| **Role** | Software Engineer at Razorpay |
| **City** | Bengaluru |
| **Budget** | ₹14,000/mo |
| **Preferred Areas** | HSR Layout, Koramangala, Indiranagar |
| **Lifestyle** | Non-smoker, social drinker, hybrid work, clean, loves pets |
| **Goal** | Find a chill, compatible flatmate near his office |
| **Pain** | Wasted 2 weeks on FB groups; fake listings, no compatibility info |
| **Motivator** | Speed + trust signals (verified profiles, quiz scores) |

### Persona 2: Priya — The Room Owner

| Attribute | Detail |
|-----------|--------|
| **Name** | Priya Sharma |
| **Age** | 28 |
| **Role** | Room Owner (3BHK in HSR Layout) |
| **City** | Bengaluru |
| **Rent** | ₹24,000 total, ₹12,000/partner |
| **Need** | 1 flatmate — neat working professional |
| **Goal** | Find a verified, lifestyle-compatible roommate quickly |
| **Pain** | Past tenant was messy, parties at midnight, left early |
| **Motivator** | Quiz-based matching + verified-only filtering |

### Persona 3: Divya — The Safety-Conscious Female Seeker

| Attribute | Detail |
|-----------|--------|
| **Name** | Divya Nair |
| **Age** | 24 |
| **Role** | Product Designer at Swiggy |
| **City** | Bengaluru |
| **Budget** | ₹15,000/mo |
| **Lifestyle** | Vegetarian, non-smoker, WFH, values cleanliness |
| **Goal** | Female-only flatshare, safe gated society |
| **Pain** | Most platforms don't verify gender or identity |
| **Motivator** | Gender filters + Aadhaar verification + "Verified Pro" badge |

### Persona 4: Admin — Moderation & Operations

| Attribute | Detail |
|-----------|--------|
| **Name** | NestMate Admin |
| **Email** | `*@nestmate.com` |
| **Role** | Platform moderator |
| **Goals** | Verify IDs, resolve reports, monitor metrics, broadcast updates |
| **Tools** | Admin dashboard with 7 sections |

---

## User Journeys

### Journey 1: New Seeker — Signup to First Match

```mermaid
journey
    title Seeker Journey: Signup to First Match
    section Landing
      Visit homepage: 5: Guest
      Browse rooms/seekers (public): 4: Guest
      Click "Get Started": 5: Guest
    section Authentication
      Login via email/Google: 4: Guest
      Select "Looking for a Room": 5: User
    section Onboarding (19 steps)
      Upload profile photo: 3: User
      Enter name, gender, age: 4: User
      Select profession: 4: User
      Choose city & localities: 5: User
      Set budget & move-in date: 4: User
      Take 10-question lifestyle quiz: 5: User
    section Dashboard
      View "Best Match Today" card: 5: User
      Browse match grid: 4: User
      Apply filters (budget, locality): 4: User
      View compatibility breakdown: 5: User
    section Connection
      Send connection request: 5: User
      Wait for acceptance: 3: User
      Start chatting: 5: User
      Share phone numbers: 4: User
```

### Journey 2: Owner — List a Room to Accept a Tenant

```mermaid
journey
    title Owner Journey: List Room to Accept Tenant
    section Onboarding
      Select "I Have a Room": 5: Owner
      Fill profile (6 steps): 4: Owner
      Add listing details (11 steps): 4: Owner
      Upload room photos: 3: Owner
      Set amenities & house rules: 4: Owner
    section Dashboard
      View listing metrics: 4: Owner
      See weekly views chart: 4: Owner
      Receive connection requests: 5: Owner
    section Review Applicants
      View applicant profiles: 4: Owner
      Check compatibility scores: 5: Owner
      Accept request: 5: Owner
      Auto-create chat room: 5: Owner
    section Communication
      Chat with accepted seekers: 4: Owner
      Share phone numbers: 4: Owner
      Arrange flat visit: 4: Owner
```

### Journey 3: Admin — Daily Operations

```mermaid
journey
    title Admin Journey: Daily Moderation
    section Morning Check
      View admin dashboard metrics: 4: Admin
      Check signup trends: 4: Admin
    section Moderation
      Review ID verification queue: 5: Admin
      Approve/reject Aadhaar submissions: 4: Admin
      Handle user reports: 4: Admin
    section Operations
      Suspend bad actors: 5: Admin
      Send broadcast notification: 4: Admin
      Monitor listing quality: 3: Admin
```

---

## Information Architecture

### Navigation Map

```mermaid
graph TD
    subgraph "Public (No Auth)"
        LP["Landing Page /"]
        BR["Browse Rooms /browse-rooms"]
        BS["Browse Seekers /browse-seekers"]
        MV["Map View /map"]
        RD["Room Detail /room/:id"]
        MD["Match Detail /match/:id"]
        HIW["How It Works /how-it-works"]
        PR["Pricing /pricing"]
        AB["About Us /about"]
        PP["Privacy /privacy"]
        TOS["Terms /terms"]
    end

    subgraph "Auth Gates"
        LG["Login /login"]
        PL["Phone Login /phone-login"]
        RS["Role Select /role-select"]
        SO["Seeker Onboarding /onboarding/seeker"]
        OO["Owner Onboarding /onboarding/owner"]
    end

    subgraph "Seeker Dashboard"
        SD["Dashboard /dashboard"]
        SD --> SDall["All Matches Tab"]
        SD --> SDsaved["Saved Profiles Tab"]
        SD --> SDfilters["Filters Sidebar"]
        SD --> SDsearch["Search Bar"]
    end

    subgraph "Owner Dashboard"
        OD["Dashboard /owner-dashboard"]
        OD --> ODlisting["Listing Card"]
        OD --> ODchart["Weekly Views Chart"]
        OD --> ODapplicants["Pending Applicants"]
    end

    subgraph "Shared Authenticated"
        CH["Chat /chat + /chat/:roomId"]
        PF["Profile /profile"]
        EP["Edit Profile /edit-profile"]
        EL["Edit Listing /edit-listing/:id"]
        ST["Settings /settings"]
        NT["Notifications /notifications"]
    end

    subgraph "Admin"
        AD["Dashboard /admin"]
        AU["Users /admin/users"]
        AL["Listings /admin/listings"]
        AR["Reports /admin/reports"]
        AV["Verifications /admin/verifications"]
        AN["Notifications /admin/notifications"]
        AS["Settings /admin/settings"]
    end
```

### Navbar Links by Role

| Role | Links |
|------|-------|
| **Guest** | Find Flatmates · Find Rooms · Map View · Login |
| **Seeker** | Dashboard · Browse Rooms · Messages · Map · Profile |
| **Owner** | Dashboard · Browse Seekers · Messages · Map · Profile |
| **Admin** | All owner/seeker links + Admin Panel |

### Mobile Bottom Nav (Authenticated)

| Position | Seeker | Owner |
|----------|--------|-------|
| 1 | Dashboard | Dashboard |
| 2 | Browse Rooms | Browse Seekers |
| 3 | Messages | Messages |
| 4 | Map | Map |
| 5 | Profile | Profile |

---

## Core User Flows

### Flow 1: Authentication

```mermaid
flowchart TD
    A["Visit App"] --> B{Authenticated?}
    B -->|Yes| C{Onboarding Complete?}
    B -->|No| D["Login Page"]
    D --> E["Email/Password"]
    D --> F["Google OAuth"]
    D --> G["Phone OTP"]
    E --> H["Firebase Auth"]
    F --> H
    G --> H
    H --> I{User Doc Exists?}
    I -->|No| J["Create users/uid doc"]
    I -->|Yes| K["Load Profile"]
    J --> K
    K --> C
    C -->|No role| L["Role Select"]
    C -->|No onboarding| M["Onboarding Wizard"]
    C -->|Yes| N["Dashboard"]
    L --> M
    M --> N
```

### Flow 2: Connection & Chat

```mermaid
flowchart TD
    A["View Match Card"] --> B["Click Connect"]
    B --> C{Already Connected?}
    C -->|Has Chat| D["Navigate to Chat"]
    C -->|Pending| E["Show 'Request Sent'"]
    C -->|No| F["Send Connection Request"]
    F --> G["Create connections/ doc"]
    G --> H["Send Notification to Target"]
    H --> I["Target Views Request"]
    I --> J{Accept or Reject?}
    J -->|Accept| K["Create Chat Room"]
    J -->|Reject| L["Connection Rejected"]
    K --> M["Navigate to Chat"]
    M --> N["Exchange Messages"]
    N --> O["Request Phone Share"]
    O --> P["Mutual Consent"]
    P --> Q["Phone Numbers Revealed"]
```

### Flow 3: Onboarding (Seeker)

```mermaid
flowchart TD
    A["Role Select: 'Looking for a Room'"] --> B["Step 1: Upload Photo"]
    B --> C["Step 2: Enter Name"]
    C --> D["Step 3: Select Gender"]
    D --> E["Step 4: Enter Age"]
    E --> F["Step 5: Select Profession"]
    F --> G["Step 6: Select City"]
    G --> H["Step 7: Select Localities"]
    H --> I["Step 8: Set Budget (slider)"]
    I --> J["Step 9: Move-in Date"]
    J --> K["Steps 10-19: Lifestyle Quiz (10 questions)"]
    K --> L["Loading Screen (save to Firestore)"]
    L --> M["Success Screen (show match count)"]
    M --> N["Navigate to Dashboard"]
```

---

## Design Patterns

### Mobile-First Patterns

| Pattern | Implementation |
|---------|---------------|
| **Vaul Drawer** | Mobile filters open as bottom sheet (Vaul library) |
| **Bottom Navigation** | 5-icon mobile nav bar, hidden on desktop |
| **Stacked Cards** | Grid → single column on mobile |
| **Touch Targets** | Minimum 44px touch targets |

### Loading State Patterns

| Pattern | Usage |
|---------|-------|
| **Skeleton Shimmer** | Match cards, dashboard stats |
| **Spinner** | Button loading states (`<Loader2>` from Lucide) |
| **Toast Notifications** | Success/error feedback (Sonner) |
| **Optimistic UI** | Skip with undo (5s), save toggle |

### Trust Signal Patterns

| Signal | Visibility |
|--------|-----------|
| Trust Badge | Every match card, profile pages, chat list |
| Verification Icons | ShieldCheck (ID), CheckCircle2 (work email) |
| Active Status | Green dot + text on match cards |
| "NEW" Badge | Profiles created within 7 days |
| Shared Lifestyle Tags | Color-coded match/mismatch on cards |

---

*→ Next: [04 Features](../04_FEATURES/README.md)*
