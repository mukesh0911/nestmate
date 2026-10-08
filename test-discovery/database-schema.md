# NestMate — Firestore Database Schema
_Evidence source: firestore.rules (478 lines) + hooks/ + lib/_

---

## Collections Summary

| Collection | Access Model | Purpose |
|-----------|-------------|---------|
| `users/{uid}` | Public read, owner/admin write | Public user profile |
| `privateUserData/{uid}` | Owner or admin only | PII: phone, email, workEmail |
| `userContacts/{uid}` | Owner, admin, or accepted partner | WhatsApp number for sharing |
| `acceptedPairs/{user1_user2}` | Participants or admin | Bi-directional accepted connection index |
| `listings/{listingId}` | Public read, owner create/update, admin | Room listings |
| `connections/{connectionId}` | Participants or admin | Interest/connection requests |
| `chatRooms/{roomId}` | Participants or admin | Chat room metadata |
| `chatRooms/{roomId}/messages/{messageId}` | Participants or admin | Chat messages |
| `notifications/{notificationId}` | Recipient or admin | In-app notifications |
| `listingViews/{docId}` | Authenticated read, anonymous increment | Analytics view counts |
| `ratings/{ratingId}` | Authenticated read/create | User ratings |
| `reviews/{reviewId}` | Authenticated read/create, own edit/delete | Vouches/reviews |
| `skippedUsers/{docId}` | Authenticated, bound to caller | Users hidden from feed |
| `agreementOTPs/{agreementId}` | Authenticated | OTP tokens for rent agreements |
| `agreements/{agreementId}` | Landlord, tenant, or admin | Rent agreements |
| `verifications/{verificationId}` | Owner or admin | Legacy ID verification uploads |
| `ownerVerifications/{userId}` | Owner (own) or admin | Owner identity verification state machine |
| `reports/{reportId}` | Admin read, any active user create | User/listing reports |
| `admins/{email}` | Self-read or admin write | Admin email registry |
| `config/{docId}` | Authenticated read, admin write | Platform configuration |
| `analyticsEvents/{eventId}` | Admin read, active user create (immutable) | Product analytics events |

---

## users/{uid} — Public User Profile

**Security:** `allow read: if true` (fully public), owners cannot self-escalate trust fields.

### Core Fields

| Field | Type | Notes |
|-------|------|-------|
| `uid` | string | Firebase Auth UID |
| `name` | string | Required for onboarding completion |
| `email` | string | Stored as empty string (PII in privateUserData) |
| `phone` | string | Stored as empty string (PII in privateUserData) |
| `workEmail` | string | Stored as empty string (PII in privateUserData) |
| `role` | 'seeker' or 'owner' | Determines dashboard routing |
| `city` | string | One of 15 supported cities |
| `localities` | string[] | Preferred neighborhoods |
| `locality` | string | Primary locality |
| `budget` | number | Monthly budget in INR |
| `moveInDate` | string | Expected move-in date |
| `profession` | string | From professions dropdown |
| `company` | string | Employer/institution name |
| `bio` | string | Optional free-text bio |
| `age` | number | User age |
| `gender` | string | 'male', 'female', or other |
| `avatar` | string | Profile photo URL (Firebase Storage) |
| `geoLocation` | object | {lat, lng, formattedAddress} |
| `quizAnswers` | map | Lifestyle quiz answers (key=questionId, value=answerId) |
| `onboardingComplete` | boolean | Must be true to access app features |
| `status` | string | 'active', 'suspended', 'banned' |
| `isPremium` | boolean | Admin-only field (trustFieldsUnchanged) |
| `isVerified` | boolean | Admin-only field (trustFieldsUnchanged) |
| `phoneVerified` | boolean | Set via phone auth flow |
| `workEmailVerified` | boolean | Admin-only field (trustFieldsUnchanged) |
| `verificationLevel` | number | Admin-only (0=none, 1=basic, 2+=advanced) |
| `isAadhaarVerified` | boolean | Admin-only |
| `isWorkIdVerified` | boolean | Admin-only |
| `isStudentIdVerified` | boolean | Admin-only |
| `connectsUsed` | number | Connection requests used |
| `connectsLimit` | number | Monthly connection limit |
| `savedProfileIds` | string[] | Saved match profile UIDs |
| `savedRoomIds` | string[] | Saved listing IDs |
| `skippedUserIds` | string[] | UIDs excluded from match feed |
| `blockedUserIds` | string[] | UIDs blocked by user |
| `savedSearches` | array | Saved filter configurations |
| `whatsappNumber` | string | WhatsApp contact number |
| `socialLinks` | object | {linkedin, instagram} |
| `ownerType` | string | 'owner_flatmate' or 'landlord' |
| `propertyBasics` | object | Owner property info |
| `householdExpectations` | object | {genderPref, dietPref, smokingPolicy, petPolicy} |
| `preferences` | object | Matching preferences |
| `housingIntent` | string | Move-in intent |
| `settings` | object | {darkMode, etc.} |
| `lastActiveAt` | Timestamp | Updated by useActiveTracking hook |
| `updatedAt` | Timestamp | Server timestamp on every write |

---

## listings/{listingId}

**Security:** Public read. Creation requires active + onboarded owner. Cannot self-approve (ownerVerified=false on create).

### Lifecycle Statuses
- `pending_verification` — initial state (default)
- `active` — verified and visible
- `paused` — temporarily hidden
- `filled` — room has been filled
- `closed` — listing removed

### Key Fields

| Field | Type | Notes |
|-------|------|-------|
| `ownerId` | string | Firebase Auth UID of owner |
| `title` | string | Listing title |
| `city` | string | From 15 supported cities |
| `locality` | string | Neighborhood |
| `monthlyRent` | number | Full rent in INR |
| `partnerShare` | number | Seeker's share if co-tenant |
| `totalRent` | number | Total property rent |
| `deposit` | number | Security deposit |
| `genderPreference` | string | 'any', 'female', 'male', 'female only', 'male only' |
| `houseRules` | string[] | List of house rules |
| `amenities` | string[] | Available amenities |
| `ownerQuizAnswers` | map | Owner lifestyle quiz answers |
| `status` | string | One of the lifecycle statuses |
| `ownerVerified` | boolean | Only admin can set to true |
| `lastConfirmedAt` | Timestamp | Last availability confirmation |
| `views` | number | Incrementable by anyone (analytics) |
| `createdAt` | Timestamp | |
| `updatedAt` | Timestamp | |

---

## connections/{connectionId}

**Security:** Only participants or admin can read. Sender creates with status='pending'. Recipient can accept/reject.

| Field | Type | Notes |
|-------|------|-------|
| `fromUserId` | string | Request sender UID |
| `toUserId` | string | Request recipient UID |
| `status` | string | 'pending', 'accepted', 'rejected', 'blocked' |
| `listingId` | string? | Optional -- listing this interest originated from |
| `screeningAnswers` | map? | Optional -- seeker questionnaire answers |
| `createdAt` | Timestamp | |

---

## ownerVerifications/{userId}

**Security:** Owner reads own doc. Owner can only submit (status: SUBMITTED/NOT_STARTED). Admin can approve/reject.

### Verification Status Machine
```
NOT_STARTED --> SUBMITTED --> UNDER_REVIEW --> APPROVED
                                           --> REJECTED --> RESUBMISSION_REQUIRED --> SUBMITTED
```

---

## reports/{reportId}

**Security:** Only admins can read. Any active user can create (cannot report self).

### Valid Reasons
- `spam`, `spam_or_scam`, `harassment`, `inappropriate`, `inappropriate_behavior`, `fake`, `fake_profile`, `other`

---

## analyticsEvents/{eventId}

**Security:** Immutable after creation (update/delete blocked by rules). Only admin can read.

### Valid Event Names
- `search_performed`, `listing_viewed`, `interest_sent`, `interest_accepted`
- `interest_rejected`, `connection_created`, `chat_started`, `contact_shared`
- `listing_created`, `listing_closed`, `availability_confirmed`, `match_explanation_viewed`

---

## Admin Access

```
isAdmin() = isAuthenticated()
            AND request.auth.token.email != null
            AND (
              exists(/admins/{adminEmail()})
              OR adminEmail() in ['admin@nestmate-test.com', 'admin@nestmate.in', 'mukvr46@gmail.com']
            )
```

Admin email is lowercased from the Firebase Auth token (server-verified, cannot be spoofed).

---

## acceptedPairs/{user1_user2}

Bi-directional index. On connection acceptance, TWO documents are created:
- `acceptedPairs/{fromUserId}_{toUserId}`
- `acceptedPairs/{toUserId}_{fromUserId}`

This enables the `userContacts` access rule to check accepted pair existence in a single `exists()` call.
