# NestMate - Database Schema
> Version: 1.0.0-rc1 | Date: 2026-08-04 | Database: Cloud Firestore

---

## Collection: users/{uid}

Public profile. PII fields (phone, email, workEmail) are blanked here; real values live in privateUserData/{uid}.

| Field | Type | Description |
|-------|------|-------------|
| uid | string | Firebase Auth UID |
| name | string | Display name |
| email | string | Always "" (PII in privateUserData) |
| phone | string | Always "" (PII in privateUserData) |
| workEmail | string | Always "" (PII in privateUserData) |
| role | "seeker" or "owner" or null | User role |
| city | string | Home city (from staticData.cities) |
| localities | string[] | Preferred localities |
| budget | number | Monthly budget in INR |
| moveInDate | string | ISO date string |
| profession | string | e.g. "Software Engineer" |
| company | string | Employer name |
| bio | string | Short bio |
| age | number | Age in years |
| gender | string | "Male", "Female", "Other" |
| avatar | string | Storage download URL or external URL |
| quizAnswers | Record of string to string | Quiz answer map (q_id -> option_id) |
| onboardingComplete | boolean | Whether onboarding is complete |
| isPremium | boolean | Premium status (admin-set only) |
| isVerified | boolean | Verified status (admin-set only) |
| isAadhaarVerified | boolean | Aadhaar-specific verified flag |
| isWorkIdVerified | boolean | Work ID verified flag |
| isStudentIdVerified | boolean | Student ID verified flag |
| workEmailVerified | boolean | Work email verified flag |
| verificationLevel | number | 0-3 scale |
| connectsUsed | number | Connects used this period |
| connectsLimit | number | Monthly connect limit |
| savedProfileIds | string[] | UIDs of saved match profiles |
| savedRoomIds | string[] | IDs of saved listings |
| skippedUserIds | string[] | UIDs excluded from match feed |
| blockedUserIds | string[] | UIDs blocked by this user |
| savedSearches | SavedSearch[] | Saved filter presets |
| geoLocation | GeoLocation or null | lat, lng, formattedAddress |
| socialLinks | object | linkedin, instagram URLs |
| lastActiveAt | Timestamp | Last activity timestamp |
| status | string | "active", "suspended", "banned" |
| settings | object | darkMode, language, notifications prefs |
| createdAt | Timestamp | Account creation |
| updatedAt | Timestamp | Last update |

---

## Collection: privateUserData/{uid}

Owner or admin read/write only. Stores actual PII.

| Field | Type | Description |
|-------|------|-------------|
| phone | string | Phone number |
| email | string | Email address |
| workEmail | string | Work email address |
| updatedAt | Timestamp | Last update |

---

## Collection: listings/{listingId}

| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated Firestore ID |
| ownerId | string | Owner's Firebase UID |
| ownerName | string | Denormalized owner name |
| ownerAvatar | string | Denormalized owner avatar URL |
| title | string | Listing title |
| description | string | Full description |
| flatType | string | "1BHK", "2BHK", "3BHK", "Studio" |
| furnishing | string | "Fully Furnished", "Semi-Furnished", "Unfurnished" |
| city | string | City name |
| locality | string | Specific locality |
| address | string | Full address |
| totalRent | number | Total monthly rent in INR |
| partnerShare | number | Seeker's share in INR |
| partnersNeeded | number | Number of roommates needed |
| deposit | number | Security deposit in INR |
| amenities | string[] | e.g. ["WiFi", "AC", "Parking"] |
| houseRules | string[] | e.g. ["No smoking inside"] |
| images | string[] | Storage download URLs |
| availableFrom | string | ISO date string |
| lat | number | Latitude for map |
| lng | number | Longitude for map |
| geoLocation | object | lat, lng, formattedAddress |
| status | "active" or "paused" or "filled" | Listing visibility status |
| applicants | number | Applicant count |
| views | number | Total view count |
| createdAt | Timestamp | Creation time |
| updatedAt | Timestamp | Last update |

---

## Collection: connections/{connectionId}

| Field | Type | Description |
|-------|------|-------------|
| fromUserId | string | Request sender UID |
| toUserId | string | Request recipient UID |
| status | "pending" or "accepted" or "rejected" or "blocked" | Connection state |
| createdAt | Timestamp | When request was sent |

---

## Collection: chatRooms/{roomId}

| Field | Type | Description |
|-------|------|-------------|
| participants | string[] | Array of two UIDs |
| matchId | string | Associated match/connection ID |
| lastMessage | string | Preview of last message |
| lastMessageAt | Timestamp or null | Timestamp of last message |
| createdAt | Timestamp | Room creation |
| typingStatus | Record of string to boolean | userId to isTyping map |
| phoneSharing | PhoneSharing | Phone share state |

PhoneSharing fields:
- requestedBy: string or null
- requestedAt: Timestamp or null
- acceptedBy: string or null
- acceptedAt: Timestamp or null
- requesterPhone: string or null
- ownerPhone: string or null
- seekerPhone: string or null

---

## Subcollection: chatRooms/{roomId}/messages/{messageId}

| Field | Type | Description |
|-------|------|-------------|
| senderId | string | Sender UID or "system" |
| content | string | Message text |
| imageUrl | string (optional) | Image attachment URL |
| isSystem | boolean (optional) | Whether it's a system message |
| read | boolean | Read status |
| createdAt | Timestamp | Send time |

---

## Collection: notifications/{notificationId}

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Recipient UID |
| type | string | "match", "message", "connect", "room", "agreement", "verification", "system" |
| title | string | Notification title |
| description | string | Notification body |
| read | boolean | Read status |
| actionUrl | string (optional) | Deep link URL |
| createdAt | Timestamp | Creation time |

---

## Collection: verifications/{verificationId}

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Submitter UID |
| type | string | "aadhaar", "work_id", "student_id" |
| documentUrl | string | Storage download URL |
| status | "pending" or "approved" or "rejected" | Review status |
| submittedAt | Timestamp | Submission time |
| reviewedAt | Timestamp (optional) | Admin review time |
| reviewNote | string (optional) | Admin rejection reason |

---

## Collection: reports/{reportId}

| Field | Type | Description |
|-------|------|-------------|
| reporterId | string | Reporter UID |
| targetId | string | Reported user UID |
| reason | string | Report category |
| description | string (optional) | Additional details |
| status | "pending" or "reviewed" or "resolved" | Processing status |
| createdAt | Timestamp | Report time |
| updatedAt | Timestamp | Last admin update |

---

## Collection: reviews/{reviewId}

| Field | Type | Description |
|-------|------|-------------|
| targetUserId | string | Reviewed user UID |
| reviewerId | string | Reviewer UID |
| reviewerName | string | Denormalized reviewer name |
| reviewerAvatar | string | Denormalized reviewer avatar |
| rating | number | 1-5 numeric rating |
| text | string | Review text |
| createdAt | Timestamp | Review time |

---

## Collection: listingViews/{listingId_YYYY-MM-DD}

| Field | Type | Description |
|-------|------|-------------|
| listingId | string | Associated listing ID |
| date | string | YYYY-MM-DD date string |
| count | number | View count for that day |

---

## Collection: admins/{adminId}

| Field | Type | Description |
|-------|------|-------------|
| email | string | Admin email |
| name | string | Admin display name |
| role | string | "moderator", "admin" |
| createdAt | Timestamp | When added |

---

## Document: config/admin

| Field | Type | Description |
|-------|------|-------------|
| adminEmails | string[] | List of admin email addresses |

---

## Indexes (firestore.indexes.json)

| Collection | Fields | Order |
|-----------|--------|-------|
| users | onboardingComplete, role, city | ASC, ASC, ASC |
| users | onboardingComplete, city | ASC, ASC |
| users | onboardingComplete, role | ASC, ASC |
| chatRooms | participants (array-contains), lastMessageAt | DESC |
| listings | status, city, createdAt | ASC, ASC, DESC |
| listings | status, createdAt | ASC, DESC |
| listings | ownerId, createdAt | ASC, DESC |
| connections | fromUserId, createdAt | ASC, DESC |
| connections | toUserId, status, createdAt | ASC, ASC, DESC |
| notifications | userId, createdAt | ASC, DESC |
| matches | userId, createdAt | ASC, DESC |
| matches | matchedUserId, createdAt | ASC, DESC |
| reviews | targetUserId, createdAt | ASC, DESC |

