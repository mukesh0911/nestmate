# NESTMATE — CROSS-FEATURE E2E DEPENDENCY GRAPH

**Scope**: Cross-Feature Flow Transitions, Data Handshakes, and State Transformations

```mermaid
flowchart TD
    subgraph AUTH["1. Authentication & Onboarding"]
        A1[Guest Landing / Login] --> A2[Role Selection: Seeker vs Owner]
        A2 -->|Seeker| A3[Seeker Onboarding: 10-Step Wizard & Quiz Tokens]
        A2 -->|Owner| A4[Owner Onboarding: Property Details, Rent & Photos]
        A3 --> A5[Firestore: users/{uid} Onboarding Complete]
        A4 --> A6[Firestore: listings & users/{uid} Onboarding Complete]
    end

    subgraph MATCH["2. Matching & Discovery"]
        A5 --> M1[Matching Engine: 10-Token String Equality]
        M1 --> M2[Seeker Dashboard: Top Match & Compatibility Ranked List]
        M2 --> M3[Filters & Sort: City, Locality, Budget, Score]
        M2 --> M4[Match Detail: Lifestyle Comparison & Trust Badges]
        A6 --> M5[Explore Marketplace: Active Listings Feed]
        M5 --> M6[Room Detail: Amenities, Split Calculation, Map Location]
    end

    subgraph CONN["3. Connection & Notification Handshake"]
        M4 -->|Send Connect Request| C1[Create connections doc: status = 'pending']
        M6 -->|Express Interest| C1
        C1 --> C2[Create Notification for Recipient]
        C2 --> C3[Recipient Notification Stream: Deep-Link Action]
        C3 -->|Owner Dashboard / Match Detail| C4{Accept or Reject?}
        C4 -->|Reject| C5[Update connection: status = 'rejected']
        C4 -->|Accept| C6[Update connection: status = 'accepted']
        C6 --> C7[Create chatRooms doc with both participants]
        C6 --> C8[Dispatch Acceptance Notification to Sender]
    end

    subgraph CHAT["4. Real-Time Chat & Phone Exchange"]
        C7 --> CH1[Chat Page: Real-Time Messages via onSnapshot]
        CH1 --> CH2[Debounced Typing Indicators]
        CH1 --> CH3[Image Upload to Storage: chats/{roomId}]
        CH1 --> CH4[Phone Sharing Request: chatRooms.phoneSharing = 'requested']
        CH4 --> CH5[Recipient Prompt: 'Accept & Share']
        CH5 --> CH6[Mutual Consent: Contact numbers unmasked from privateUserData]
    end

    subgraph TRUST["5. Trust, Reviews & Settings"]
        CH1 --> T1[Submit Peer Review / Vouch: reviews doc]
        T1 --> T2[Update Recipient Average Rating & Trust Ladder]
        A5 --> S1[Edit Profile / Retake Lifestyle Quiz]
        S1 --> M1
        A5 --> S2[Dynamic Role Switch: Seeker <-> Owner]
        S2 --> A1
        A5 --> S3[Account Deletion: Cascading Deletion of all user artifacts]
    end
```

---

## EDGE-BY-EDGE E2E TRANSITION VERIFICATION

| Source Node | Target Node | Transition Trigger | State Handshake | Verification Result |
|---|---|---|---|---|
| `ONBOARDING` | `DASHBOARD` | Complete 10th Quiz Question | `users/{uid}.onboardingComplete = true` | **E2E VERIFIED** |
| `DASHBOARD` | `MATCHING` | Profile answers loaded | `calculateCompatibility(myAnswers, theirAnswers)` | **E2E VERIFIED** |
| `MATCHING` | `FILTER / SORT` | User adjusts city / budget slider | `applyClientFilters()` + sort comparator | **E2E VERIFIED** |
| `MATCH DETAIL`| `CONNECTION` | Click "Connect" | `sendRequest(user.uid, targetUid)` | **E2E VERIFIED** |
| `CONNECTION` | `NOTIFICATION` | Request created | `createNotification(recipientUid, 'connect', ...)` | **E2E VERIFIED** |
| `NOTIFICATION`| `ACCEPT` | Owner clicks notification link | Loads `/owner-dashboard?request={id}`, auto-scrolls | **E2E VERIFIED** |
| `ACCEPT` | `CHAT ROOM` | Owner clicks "Accept" | `getOrCreateChatRoom(user.uid, senderUid)` | **E2E VERIFIED** |
| `CHAT ROOM` | `PHONE EXCHANGE`| Both users consent | `phoneSharing.status = 'accepted'` -> reads `privateUserData` | **E2E VERIFIED** |
| `REVIEWS` | `TRUST LADDER` | User submits 5-star review | `reviews` doc added -> Recipient Trust Badge level updated | **E2E VERIFIED** |
| `SETTINGS` | `ROLE SWITCH` | User switches role | `users/{uid}.role` updated -> Realtime listener updates dashboard | **E2E VERIFIED** |
