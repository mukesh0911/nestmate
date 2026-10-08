# NestMate Seed Data Contract (Phase 2 Certification)

**Version:** 1.0.0  
**Target Environment:** Test Firestore Project (`nestmate-eb562`) & Playwright Auth States (`tests/.auth/`)  
**Registry Source:** [`tests/helpers/testDataRegistry.ts`](file:///d:/nestmate/tests/helpers/testDataRegistry.ts)

This contract establishes the deterministic specification for all test personas, listings, connections, conversations, and governance records required across the NestMate testing lifecycle.

---

## 1. Test Personas Specification

| Persona Key | Document UID | Email | Role | Status | Onboarding | Premium | Verified | Permissions & Scenarios |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEEKER_A** | `test_user_ref` | `seeker.ref@nestmate-test.com` | `seeker` | `active` | Complete | `false` | `true` | Reference baseline seeker; discovers rooms/seekers; sends connections (5 limit). |
| **SEEKER_B** | `test_user_perfect_match` | `seeker.perfect@nestmate-test.com` | `seeker` | `active` | Complete | `false` | `true` | 100% quiz match with Seeker A; has active chat with Owner A and Rohan. |
| **SEEKER_C** | `test_user_night_owl` | `seeker.night@nestmate-test.com` | `seeker` | `active` | Complete | `false` | `true` | Night-owl lifestyle profile; partial quiz match; tests filter compatibility. |
| **OWNER_A** | `test_user_owner_01` | `owner.verified@nestmate-test.com` | `owner` | `active` | Complete | `true` | `true` (Lvl 3) | Verified host; owns active Koramangala listing; manages incoming connection requests. |
| **OWNER_B** | `test_user_owner_02` | `owner.unverified@nestmate-test.com` | `owner` | `active` | Complete | `false` | `false` (Lvl 0) | Unverified host; owns pending & draft listings; cannot publish active rooms without review. |
| **OWNER_PENDING_VERIFICATION** | `test_user_owner_03` | `owner.pending@nestmate-test.com` | `owner` | `active` | Complete | `false` | `false` (Lvl 1) | Verification submission in `UNDER_REVIEW` state; tests admin queue inspection. |
| **OWNER_REJECTED** | `test_user_owner_rejected` | `owner.rejected@nestmate-test.com` | `owner` | `active` | Complete | `false` | `false` (Lvl 0) | Document rejected by admin; tests rejection badge and resubmission prompt. |
| **ADMIN** | `test_user_admin` | `admin@nestmate-test.com` | `seeker` | `active` | Complete | `true` | `true` | Full administrative bypass; accesses `/admin`, reports, verification queues, config. |
| **ONBOARDING_PENDING** | `test_user_onboarding_pending` | `incomplete@nestmate-test.com` | `null` | `active` | Incomplete | `false` | `false` | Missing profile/quiz; quarantined to `/role-select` and onboarding wizard. |
| **SUSPENDED_USER** | `test_user_suspended` | `suspended@nestmate-test.com` | `seeker` | `suspended` | Complete | `false` | `false` | Moderated for policy breach; blocked screen shown; direct mutations rejected. |
| **BANNED_USER** | `test_user_banned` | `banned@nestmate-test.com` | `seeker` | `banned` | Complete | `false` | `false` | Permanent ban; blocked screen shown; zero platform access. |
| **PREMIUM_USER** | `test_user_pro_user` | `seeker.pro@nestmate-test.com` | `seeker` | `active` | Complete | `true` | `true` | Pro badge; unlimited connections (`connectsLimit: 999`); bypasses free quotas. |
| **QUOTA_FULL_USER** | `test_user_quota_full` | `seeker.quota@nestmate-test.com` | `seeker` | `active` | Complete | `false` | `true` | Non-premium seeker with `connectsUsed: 5`; next connection blocked by quota guard. |

---

## 2. Listing Entity Lifecycle (7 States)

| Listing ID | Title & Locality | Owner UID | Status | Owner Verified | Rent / Share | Freshness Anchor | Visibility Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `test_listing_kora_01` | Prime 2BHK in Koramangala | `test_user_owner_01` | `active` | `true` | ₹28,000 / ₹14,000 | Fresh (Today) | **Publicly Visible** |
| `FSXystxUrr3MzY37W7L2` | Sunny Master Room in Indiranagar | `Nos8X8pwiXb9wAVA3lmOcgH5vOy1` | `active` | `true` | ₹36,000 / ₹18,000 | Fresh (Today) | **Publicly Visible** |
| `test_listing_hsr_01` | Architect 2BHK in HSR Layout | `test_user_owner_03` | `active` | `true` | ₹32,000 / ₹16,000 | Fresh (Today) | **Publicly Visible** |
| `test_listing_white_01` | Prestige Shantiniketan Whitefield | `test_user_owner_04` | `active` | `true` | ₹45,000 / ₹15,000 | Fresh (Today) | **Publicly Visible** |
| `test_listing_bellandur_01` | EcoSpace High-Rise Bellandur | `test_user_owner_01` | `active` | `true` | ₹48,000 / ₹16,000 | Fresh (Today) | **Publicly Visible** |
| `test_listing_btm_01` | Cozy Room in BTM Layout | `test_user_owner_04` | `active` | `true` | ₹23,000 / ₹11,500 | Fresh (Today) | **Publicly Visible** |
| `test_listing_pend_01` | Studio in Indiranagar | `test_user_owner_02` | `pending_verification` | `false` | ₹18,000 / ₹9,000 | Fresh (Today) | **Hidden (Pending Review)** |
| `test_listing_draft_01` | Draft Studio in HSR Layout | `test_user_owner_02` | `draft` | `false` | ₹14,000 / ₹7,000 | Fresh (Today) | **Hidden (Draft)** |
| `test_listing_pause_01` | Paused 3BHK in Whitefield | `test_user_owner_01` | `paused` | `true` | ₹35,000 / ₹17,500 | Fresh (Today) | **Hidden (Paused by Host)** |
| `test_listing_fill_01` | Filled Occupancy Room in BTM | `test_user_owner_04` | `filled` | `true` | ₹12,000 / ₹6,000 | Fresh (Today) | **Hidden (Occupied)** |
| `test_listing_close_01` | Closed Listing in Electronic City | `test_user_owner_04` | `closed` | `true` | ₹16,000 / ₹8,000 | Fresh (Today) | **Hidden (Closed)** |
| `test_listing_exp_01` | Stale Expired Listing | `test_user_owner_01` | `active` | `true` | ₹22,000 / ₹11,000 | Stale (35 Days Ago) | **Hidden (Freshness Expired)** |

---

## 3. Connections & Relationships (4 States)

| Connection ID | From User | To User | Status | Target Listing | Intended Scenario |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `test_conn_p01` | `test_user_ref` (Seeker A) | `test_user_owner_01` (Owner A) | `pending` | `test_listing_kora_01` | Incoming request in Owner A applicants tab. |
| `test_conn_a01` | `test_user_perfect_match` (Seeker B) | `test_user_owner_01` (Owner A) | `accepted` | `test_listing_kora_01` | Mutual connection with chat room `test_chat_crm_01`. |
| `test_conn_r01` | `test_user_night_owl` (Seeker C) | `test_user_owner_01` (Owner A) | `rejected` | `test_listing_kora_01` | Rejected connection; chat blocked. |
| `test_conn_b01` | `test_user_suspended` | `test_user_owner_01` (Owner A) | `blocked` | `test_listing_kora_01` | Blocked user interaction. |
| `conn_nos_pooja` | `test_user_perfect_match` | `Nos8X8pwiXb9wAVA3lmOcgH5vOy1` | `accepted` | `FSXystxUrr3MzY37W7L2` | Active live session conversation with Pooja Iyer. |
| `conn_nos_aditi` | `test_user_ref` | `Nos8X8pwiXb9wAVA3lmOcgH5vOy1` | `pending` | `FSXystxUrr3MzY37W7L2` | Active live session request with Aditi Sharma. |

---

## 4. Chat Rooms & Subcollection Messages

| Room ID | Participants | Parent Connection | Last Message | Timestamp |
| :--- | :--- | :--- | :--- | :--- |
| `test_chat_crm_01` | `test_user_perfect_match` ↔ `test_user_owner_01` | `test_conn_a01` | *"Saturday afternoon works best for the tour."* | Today (10 mins ago) |
| `chat_room_nos_pooja` | `Nos8X8pwiXb9wAVA3lmOcgH5vOy1` ↔ `test_user_perfect_match` | `conn_nos_pooja` | *"Sure, Saturday 4 PM works perfectly! Looking forward to meeting."* | Today (10 mins ago) |
| `chat_room_nos_aditi` | `Nos8X8pwiXb9wAVA3lmOcgH5vOy1` ↔ `test_user_ref` | `conn_nos_aditi` | *"Hi Rohan! Would love to know if pure vegetarian cooking is preferred in the flat."* | Today (30 mins ago) |

### Messages Schema (`chatRooms/{roomId}/messages/{msgId}`):
- `id`: string
- `senderId`: string (Must belong to room participants)
- `content`: string
- `read`: boolean
- `createdAt`: Firestore Timestamp

---

## 5. Governance, Reports & Verifications

### Owner Verifications (`verifications/{id}`)
- `test_verif_owner_01` (`test_user_owner_01`): `APPROVED` (Level 3)
- `test_verif_owner_02` (`test_user_owner_02`): `SUBMITTED` (Level 0)
- `test_verif_owner_03` (`test_user_owner_03`): `UNDER_REVIEW` (Level 1)
- `test_verif_owner_04` (`test_user_owner_04`): `RESUBMISSION_REQUIRED` (Level 1)
- `test_verif_owner_05` (`test_user_owner_rejected`): `REJECTED` (Level 0)

### Abuse Reports (`reports/{id}`)
- `test_report_rep_01`: Reporter `test_user_ref` → Target `test_user_suspended` (`reason: spam_or_scam`, `status: open`)
- `test_report_rep_02`: Reporter `test_user_perfect_match` → Target `test_user_banned` (`reason: harassment`, `status: resolved`)

---

## 6. Relationship Integrity Rules (Zero Broken References)

All seeded collections must strictly satisfy:
1. **Listings → Users:** Every `listing.ownerId` must exist in `users`.
2. **Connections → Users:** Every `connection.fromUserId` and `toUserId` must exist in `users`.
3. **Attributed Listings:** If `connection.listingId` is defined, the listing must exist and `listing.ownerId == connection.toUserId`.
4. **ChatRooms → Users & Connections:** Both participants must exist in `users`. `chatRoom.connectionId` must exist in `connections`.
5. **Messages → ChatRooms:** `message.roomId` must exist in `chatRooms` and `message.senderId` must be one of its participants.
6. **Notifications → Users:** `notification.userId` must exist in `users`.
7. **Reports → Users:** `report.reporterId` and `report.targetId` must exist in `users`.
8. **Verifications → Users:** `verification.userId` must exist in `users` and have `role == 'owner'`.
