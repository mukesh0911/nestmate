# 06 — Database

> **Purpose**: Complete Firestore schema documentation — every collection, every field, every relationship  
> **Audience**: Developers, AI agents, database administrators  
> **Dependencies**: [05 Architecture](../05_ARCHITECTURE/README.md)  
> **Related**: [10 Security](../10_SECURITY/README.md) · [08 Business Logic](../08_BUSINESS_LOGIC/README.md)

---

## ER Diagram

```mermaid
erDiagram
    users ||--o{ listings : "ownerId"
    users ||--o{ connections : "fromUserId / toUserId"
    users ||--o{ chatRooms : "participants[]"
    users ||--o{ notifications : "userId"
    users ||--o{ reviews : "targetUserId / reviewerId"
    users ||--o{ verifications : "userId"
    users ||--o{ reports : "reporterId / targetId"
    users ||--o{ matches : "userId / matchedUserId"
    users ||--o| emailOTPs : "userId"

    chatRooms ||--o{ messages : "subcollection"
    listings ||--o{ listingViews : "listingId"

    users {
        string uid PK
        string name
        string email
        string phone
        string role
        string city
        array localities
        number budget
        string moveInDate
        string profession
        string company
        string bio
        number age
        string gender
        string avatar
        map quizAnswers
        boolean onboardingComplete
        boolean isPremium
        boolean isVerified
        number connectsUsed
        number connectsLimit
        number verificationLevel
        map settings
        array savedProfileIds
        array savedRoomIds
        array skippedUserIds
        array blockedUserIds
        array savedSearches
        string workEmail
        boolean workEmailVerified
        map socialLinks
        map geoLocation
        timestamp lastActiveAt
        timestamp createdAt
        timestamp updatedAt
    }

    listings {
        string id PK
        string ownerId FK
        string ownerName
        string ownerAvatar
        string title
        string description
        string flatType
        string furnishing
        string city
        string locality
        string address
        number totalRent
        number partnerShare
        number partnersNeeded
        number deposit
        array amenities
        array houseRules
        array images
        string availableFrom
        number lat
        number lng
        string status
        number applicants
        number views
        timestamp createdAt
        timestamp updatedAt
    }

    connections {
        string id PK
        string fromUserId FK
        string toUserId FK
        string status
        timestamp createdAt
    }

    chatRooms {
        string id PK
        array participants
        string matchId
        string lastMessage
        timestamp lastMessageAt
        timestamp createdAt
        map typingStatus
        map phoneSharing
    }

    messages {
        string id PK
        string senderId
        string content
        boolean read
        timestamp createdAt
        string imageUrl
        boolean isSystem
    }

    notifications {
        string id PK
        string userId FK
        string type
        string title
        string description
        boolean read
        string actionUrl
        timestamp createdAt
    }

    matches {
        string id PK
        string userId FK
        string matchedUserId FK
        number compatibilityScore
        string status
        timestamp createdAt
    }

    reviews {
        string id PK
        string targetUserId FK
        string reviewerId FK
        string reviewerName
        string reviewerAvatar
        number rating
        string text
        timestamp createdAt
    }

    verifications {
        string id PK
        string userId FK
        string type
        string status
        string documentUrl
        timestamp submittedAt
        timestamp reviewedAt
        string reviewNote
    }

    reports {
        string id PK
        string reporterId FK
        string targetId FK
        string reason
        string description
        string status
        timestamp createdAt
    }

    listingViews {
        string id PK
        string listingId FK
        string date
        number count
    }

    emailOTPs {
        string userId PK
    }

    agreements {
        string id PK
        string landlordId FK
        string tenantId FK
    }

    agreementOTPs {
        string id PK
    }

    ratings {
        string id PK
    }

    skippedUsers {
        string id PK
        string userId FK
        string skippedUserId FK
        timestamp createdAt
    }
```

---

## Firestore Collections

### 1. `users` — User Profiles

**Document ID**: Firebase Auth UID  
**Read**: Public (anyone can browse)  
**Write**: Owner only (or admin)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `uid` | `string` | ✅ | Auth UID | Firebase Auth user ID |
| `name` | `string` | ✅ | — | Display name |
| `email` | `string` | ✅ | — | Email address |
| `phone` | `string` | ⬜ | — | E.164 phone number |
| `role` | `string` | ✅ | `null` | `'seeker'` or `'owner'` |
| `city` | `string` | ✅ | — | Selected city |
| `localities` | `string[]` | ⬜ | `[]` | Preferred localities |
| `budget` | `number` | ✅ | `8000` | Monthly budget (₹) |
| `moveInDate` | `string` | ⬜ | — | ISO date string |
| `profession` | `string` | ⬜ | — | Job title |
| `company` | `string` | ⬜ | — | Employer name |
| `bio` | `string` | ⬜ | — | User biography |
| `age` | `number` | ⬜ | `0` | User age |
| `gender` | `string` | ⬜ | — | `'Male'`, `'Female'`, `'Other'` |
| `avatar` | `string` | ⬜ | Unsplash URL | Profile image URL |
| `quizAnswers` | `map<string, string>` | ⬜ | `{}` | Compatibility quiz answers |
| `onboardingComplete` | `boolean` | ✅ | `false` | Whether onboarding is done |
| `isPremium` | `boolean` | ✅ | `false` | Premium subscription status |
| `isVerified` | `boolean` | ✅ | `false` | Government ID verified |
| `connectsUsed` | `number` | ✅ | `0` | Monthly connections used |
| `connectsLimit` | `number` | ✅ | `5` | Monthly connection cap |
| `verificationLevel` | `number` | ✅ | `0` | 0-3 verification tier |
| `settings` | `map` | ⬜ | — | User preferences (dark mode, language, notifications) |
| `savedProfileIds` | `string[]` | ✅ | `[]` | Saved match UIDs |
| `savedRoomIds` | `string[]` | ✅ | `[]` | Saved listing IDs |
| `skippedUserIds` | `string[]` | ✅ | `[]` | Skipped UIDs |
| `blockedUserIds` | `string[]` | ✅ | `[]` | Blocked UIDs |
| `savedSearches` | `array<map>` | ⬜ | `[]` | Saved filter presets |
| `workEmail` | `string` | ⬜ | — | Corporate email |
| `workEmailVerified` | `boolean` | ⬜ | `false` | Corporate email verified |
| `socialLinks` | `map` | ⬜ | — | `{linkedin?, instagram?}` |
| `geoLocation` | `map` | ⬜ | — | `{lat, lng, formattedAddress?}` |
| `lastActiveAt` | `timestamp` | ⬜ | — | Last activity timestamp |
| `createdAt` | `timestamp` | ✅ | `serverTimestamp()` | Account creation |
| `updatedAt` | `timestamp` | ✅ | `serverTimestamp()` | Last profile update |

---

### 2. `listings` — Room Listings

**Document ID**: Auto-generated  
**Read**: Public  
**Write**: Owner (ownerId) or admin; view count updates by any authenticated user

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` | ✅ | Auto | Document ID |
| `ownerId` | `string` | ✅ | — | Owner's user UID |
| `ownerName` | `string` | ✅ | — | Denormalized owner name |
| `ownerAvatar` | `string` | ⬜ | — | Denormalized owner avatar |
| `title` | `string` | ✅ | — | Listing title |
| `description` | `string` | ✅ | — | Detailed description |
| `flatType` | `string` | ✅ | — | `'1BHK'`, `'2BHK'`, `'3BHK'`, `'Studio'` |
| `furnishing` | `string` | ✅ | — | `'Fully Furnished'`, `'Semi-Furnished'`, `'Unfurnished'` |
| `city` | `string` | ✅ | — | City name |
| `locality` | `string` | ✅ | — | Locality/area name |
| `address` | `string` | ⬜ | — | Full street address |
| `totalRent` | `number` | ✅ | — | Total monthly rent (₹) |
| `partnerShare` | `number` | ✅ | — | Per-person share (₹) |
| `partnersNeeded` | `number` | ✅ | `1` | How many flatmates needed |
| `deposit` | `number` | ⬜ | — | Security deposit amount |
| `amenities` | `string[]` | ⬜ | `[]` | Available amenities |
| `houseRules` | `string[]` | ⬜ | `[]` | House rules |
| `images` | `string[]` | ⬜ | `[]` | Image URLs from Storage |
| `availableFrom` | `string` | ⬜ | — | ISO date string |
| `lat` | `number` | ⬜ | — | Latitude |
| `lng` | `number` | ⬜ | — | Longitude |
| `status` | `string` | ✅ | `'active'` | `'active'`, `'paused'`, `'filled'` |
| `applicants` | `number` | ✅ | `0` | Number of applicants |
| `views` | `number` | ✅ | `0` | Total view count |
| `createdAt` | `timestamp` | ✅ | `serverTimestamp()` | |
| `updatedAt` | `timestamp` | ✅ | `serverTimestamp()` | |

---

### 3. `connections` — Connection Requests

**Document ID**: Auto-generated  
**Read/Write**: Participants only

| Field | Type | Description |
|-------|------|-------------|
| `fromUserId` | `string` | Requester UID |
| `toUserId` | `string` | Target UID |
| `status` | `string` | `'pending'`, `'accepted'`, `'rejected'`, `'blocked'` |
| `createdAt` | `timestamp` | Request timestamp |

---

### 4. `chatRooms` — Chat Rooms

**Document ID**: Auto-generated  
**Read/Write**: Participants only

| Field | Type | Description |
|-------|------|-------------|
| `participants` | `string[]` | Array of 2 user UIDs |
| `matchId` | `string` | Associated match ID |
| `lastMessage` | `string` | Preview text of last message |
| `lastMessageAt` | `timestamp` | Last message timestamp |
| `createdAt` | `timestamp` | Room creation |
| `typingStatus` | `map<string, boolean>` | `{uid: isTyping}` |
| `phoneSharing` | `map` | Phone sharing protocol state |

#### `phoneSharing` Sub-map

| Field | Type | Description |
|-------|------|-------------|
| `requestedBy` | `string?` | UID who requested |
| `requestedAt` | `timestamp?` | When requested |
| `acceptedBy` | `string?` | UID who accepted |
| `acceptedAt` | `timestamp?` | When accepted |
| `ownerPhone` | `string?` | Owner's phone (revealed) |
| `seekerPhone` | `string?` | Seeker's phone (revealed) |

---

### 5. `chatRooms/{roomId}/messages` — Messages (Subcollection)

| Field | Type | Description |
|-------|------|-------------|
| `senderId` | `string` | Sender UID or `'system'` |
| `content` | `string` | Message text |
| `read` | `boolean` | Read status |
| `createdAt` | `timestamp` | Sent timestamp |
| `imageUrl` | `string?` | Optional image attachment |
| `isSystem` | `boolean?` | System-generated message flag |

---

### 6. `notifications`

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `string` | Recipient UID |
| `type` | `string` | `'match'`, `'message'`, `'connect'`, `'room'`, `'agreement'`, `'verification'`, `'system'` |
| `title` | `string` | Notification title |
| `description` | `string` | Notification body |
| `read` | `boolean` | Read status |
| `actionUrl` | `string?` | Deep link URL |
| `createdAt` | `timestamp` | |

---

### 7. `matches`

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `string` | First user UID |
| `matchedUserId` | `string` | Second user UID |
| `compatibilityScore` | `number` | 0-100 compatibility |
| `status` | `string` | `'pending'`, `'accepted'`, `'rejected'` |
| `createdAt` | `timestamp` | |

---

### 8. `reviews` (Vouches)

| Field | Type | Description |
|-------|------|-------------|
| `targetUserId` | `string` | User being reviewed |
| `reviewerId` | `string` | Reviewer UID |
| `reviewerName` | `string` | Reviewer display name |
| `reviewerAvatar` | `string` | Reviewer avatar URL |
| `rating` | `number` | 1-5 star rating |
| `text` | `string` | Review text |
| `createdAt` | `timestamp` | |

---

### 9. `verifications`

| Field | Type | Description |
|-------|------|-------------|
| `userId` | `string` | User who submitted |
| `type` | `string` | `'aadhaar'`, `'work_id'`, `'student_id'` |
| `status` | `string` | `'pending'`, `'approved'`, `'rejected'` |
| `documentUrl` | `string` | Uploaded document URL |
| `submittedAt` | `timestamp` | |
| `reviewedAt` | `timestamp?` | Admin review time |
| `reviewNote` | `string?` | Admin rejection note |

---

### 10. `reports`

| Field | Type | Description |
|-------|------|-------------|
| `reporterId` | `string` | Reporter UID |
| `targetId` | `string` | Reported user UID |
| `reason` | `string` | Report category |
| `description` | `string?` | Details |
| `status` | `string` | `'pending'`, `'reviewed'`, `'resolved'` |
| `createdAt` | `timestamp` | |

---

### 11. `listingViews` — Daily View Analytics

**Document ID**: `{listingId}_{YYYY-MM-DD}`

| Field | Type | Description |
|-------|------|-------------|
| `listingId` | `string` | Listing reference |
| `date` | `string` | ISO date (YYYY-MM-DD) |
| `count` | `number` | View count for that day |

---

### 12–15. Supporting Collections

| Collection | Purpose | Key Fields |
|-----------|---------|------------|
| `ratings` | Star ratings (append-only) | Authenticated create-only |
| `skippedUsers` | Legacy skip tracking | `userId`, `skippedUserId` |
| `agreements` | Rent agreement documents | `landlordId`, `tenantId` |
| `agreementOTPs` | Agreement verification OTPs | — |
| `emailOTPs` | Email verification OTPs | Document ID = user UID |
| `admins` | Admin user registry | `email`, `name`, `role` |
| `config/admin` | Admin configuration | `adminEmails[]` |

---

## Composite Indexes

| Collection | Fields | Scope |
|-----------|--------|-------|
| `users` | `onboardingComplete` ASC, `role` ASC, `city` ASC | COLLECTION |
| `users` | `onboardingComplete` ASC, `city` ASC | COLLECTION |
| `users` | `onboardingComplete` ASC, `role` ASC | COLLECTION |
| `chatRooms` | `participants` CONTAINS, `lastMessageAt` DESC | COLLECTION |
| `listings` | `status` ASC, `city` ASC, `createdAt` DESC | COLLECTION |
| `listings` | `status` ASC, `createdAt` DESC | COLLECTION |
| `listings` | `ownerId` ASC, `createdAt` DESC | COLLECTION |
| `connections` | `fromUserId` ASC, `createdAt` DESC | COLLECTION |
| `connections` | `toUserId` ASC, `status` ASC, `createdAt` DESC | COLLECTION |
| `notifications` | `userId` ASC, `createdAt` DESC | COLLECTION |
| `matches` | `userId` ASC, `createdAt` DESC | COLLECTION |
| `matches` | `matchedUserId` ASC, `createdAt` DESC | COLLECTION |
| `reviews` | `targetUserId` ASC, `createdAt` DESC | COLLECTION |

---

## Storage Buckets

| Path Pattern | Purpose | Max Size | Access |
|-------------|---------|----------|--------|
| `profiles/{userId}/**` | Profile avatars | — | Read: auth'd, Write: owner |
| `listings/{listingId}/**` | Listing images | — | Read/Write: auth'd |
| `chats/{roomId}/**` | Chat image attachments | — | Read/Write: auth'd |
| `agreements/{agreementId}/**` | Agreement PDFs | 20MB | Read: auth'd, Write: auth'd |

---

## Data Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant Auth as Firebase Auth
    participant DB as Firestore
    participant Storage as Firebase Storage

    User->>Auth: Sign up (email/Google/phone)
    Auth->>DB: Create users/{uid} (minimal profile)
    User->>DB: Complete onboarding (update profile)
    User->>DB: Take quiz (update quizAnswers)
    
    alt Owner Flow
        User->>Storage: Upload listing images
        Storage-->>User: Image URLs
        User->>DB: Create listings/{id}
    end

    alt Seeker Flow
        User->>DB: Query users (findMatches)
        User->>DB: Create connections/{id}
        DB->>DB: Create notifications
    end

    alt Chat Flow
        User->>DB: Create chatRooms/{id}
        User->>DB: Add messages subcollection
        User->>Storage: Upload chat images
    end

    alt Account Deletion
        User->>DB: Delete users/{uid}
        User->>DB: Delete user's listings
        User->>DB: Delete user's connections
        User->>Auth: deleteUser()
    end
```

---

*→ Next: [07 Developer Guide](../07_DEVELOPER_GUIDE/README.md)*
