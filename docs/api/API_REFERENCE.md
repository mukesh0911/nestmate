# NestMate - API Reference
> Version: 1.0.0-rc1 | Date: 2026-08-04
> Note: NestMate has no traditional REST API. All data access is via Firebase SDK hooks.

---

## useAuth (src/hooks/useAuth.ts)

Hook for authentication state and auth operations.

### State
- user: FirebaseUser | null
- profile: UserProfile | null
- isLoading: boolean
- isAuthenticated: boolean
- error: string | null

### Methods

**signInWithEmail(email, password)**
- Returns: { isNew, role, onboardingComplete }

**signUpWithEmail(email, password)**
- Creates a new user; redirects to role-select
- Returns: void

**signInWithGoogle()**
- Returns: { isNew, role }

**resetPassword(email)**
- Sends reset email via Firebase
- Returns: void

**logout()**
- Signs out, clears Zustand store
- Returns: void

**refreshProfile(uid?)**
- Re-fetches profile from Firestore
- Returns: UserProfile | null

---

## useUserProfile (src/hooks/useUserProfile.ts)

Hook for public profile CRUD and social actions.

**getProfile(userId)**
- Returns: UserProfile | null (PII stripped)

**updateProfile(userId, data)**
- Saves public fields; routes PII to privateUserData
- Returns: void

**toggleSavedProfile(userId, targetUid, currentlySaved)**
- Returns: boolean (new saved state)

**toggleSavedRoom(userId, roomId, currentlySaved)**
- Returns: boolean (new saved state)

**addSkippedUser(userId, skippedUid)**
- Adds to skippedUserIds (permanent)
- Returns: void

**blockUser(userId, targetUid)**
- Adds to blockedUserIds
- Returns: void

**reportUser(data)**
- data: { reporterId, targetId, reason, description? }
- Returns: void

**saveSearch(userId, searchData) / deleteSearch(userId, searchData)**
- Manages saved filter presets
- Returns: void

---

## useListings (src/hooks/useListings.ts)

Hook for listing CRUD, search, and analytics.

**getListings(filters?, reset?)**
- Fetches active listings with optional city filter
- Client-side filters: budget, flatType, furnishing, amenities
- Returns: Listing[]

**loadMore(filters?)**
- Appends next page via cursor pagination
- Returns: void

**getListingById(id)**
- Returns: Listing | null

**getMyListings(ownerId)**
- Returns: Listing[]

**createListing(ownerId, data)**
- Returns: string (new listing ID)

**updateListing(id, data)**
- Returns: void

**deleteListing(id)**
- Returns: void

**recordView(listingId)**
- Increments views + upserts daily listingViews analytics doc
- Returns: void

**getWeeklyViews(listingId)**
- Returns: { day: string, views: number }[]

---

## useMatches (src/hooks/useMatches.ts)

Hook for match feed and compatibility scoring.

**findMatches(currentUser, uiCity?, filters?, isLoadMore?)**
- Queries users with opposite role in same city
- Attaches active listing data to owner profiles
- Applies client-side filters
- Sorts: Premium > Verified > Compatibility Score
- Returns: MatchedUser[]

**calculateCompatibility(answersA, answersB)**
- Pure function, unit tested
- Returns: number (0-100%)

**getProfilesByIds(currentUser, uids)**
- Batch-fetches profiles by UID array
- Returns: MatchedUser[]

**createMatch(userId, matchedUserId, score)**
- Returns: string (match ID)

**skipUser(userId, skippedUserId)**
- Returns: void

---

## useChat (src/hooks/useChat.ts)

Hook for real-time chat.

**getOrCreateChatRoom(userIdA, userIdB, matchId?)**
- Finds or creates chat room between two users
- Returns: string (room ID)

**subscribeToChatRooms(userId, onChange)**
- Real-time listener for user's chat rooms
- Returns: unsubscribe function

**subscribeToMessages(roomId, onNewMessages)**
- Real-time listener for messages in a room
- Returns: unsubscribe function

**sendMessage(roomId, senderId, content, imageUrl?)**
- Returns: void

**sendSystemMessage(roomId, content)**
- Returns: void

**markMessagesRead(roomId, userId)**
- Returns: void

**setTyping(roomId, userId, isTyping)**
- Non-critical; silently fails
- Returns: void

**requestPhoneShare(roomId, requesterId, requesterName, requesterPhone)**
- Returns: void

**acceptPhoneShare(roomId, accepterId, accepterName, accepterPhone, requesterPhone, requesterRole, accepterRole)**
- Uses assignSharedPhones() to split by role
- Returns: void

---

## useConnections (src/hooks/useConnections.ts)

**sendRequest(fromId, toId)**
- Deduplicates before creating
- Returns: string (connection ID)

**getIncomingRequests(userId)**
- Returns: Connection[]

**getMyConnections(userId, status?)**
- Returns: Connection[]

**acceptRequest(connectionId) / rejectRequest(connectionId)**
- Returns: void

**blockUser(connectionId)**
- Sets status to "blocked"
- Returns: void

---

## useNotifications (src/hooks/useNotifications.ts)

**subscribeToNotifications(userId, onChange)**
- Real-time, last 50 notifications
- Returns: unsubscribe function

**createNotification(data)**
- Returns: void

**markAsRead(notifId) / markAllRead(userId)**
- Returns: void

**deleteNotification(notifId)**
- Returns: void

---

## useAdmin (src/hooks/useAdmin.ts)

Admin-only hook. isAdmin check gates all admin panels.

**getMetrics()**
- Returns: { totalUsers, signupsToday, signupsYesterday, activeListings, totalListings, totalChats, topCities, dailySignups, seekers, owners }

**getAllUsers() / suspendUser(uid) / banUser(uid) / reinstateUser(uid)**

**getAllListings() / deleteListing(id)**

**broadcastNotification(title, description, target)**
- target: "all" | "seekers" | "owners"
- Returns: number (recipients count)

**getAllReports() / updateReportStatus(id, status)**

**getAllVerifications() / approveVerification(id, userId, type) / rejectVerification(id, userId, type, note)**

**getAdmins() / addAdmin(email, name) / removeAdmin(id)**

**getAdminConfig() / updateAdminEmails(emails)**

---

## useStorage (src/hooks/useStorage.ts)

**uploadProfilePicture(file, userId, onProgress?)**
- Path: profiles/{userId}/avatar.{ext}
- Returns: string (download URL)

**uploadListingImages(files, listingId, onProgress?)**
- Returns: string[] (download URLs)

**uploadChatImage(file, roomId, onProgress?)**
- Returns: string (download URL)

**deleteFile(path)**
- Returns: void

---

## useGeocoding (src/hooks/useGeocoding.ts)

**geocode(city, locality?)**
- Uses Nominatim OpenStreetMap
- Rate-limited to 1.1s per request via global queue
- Returns: GeoLocation | null

**geocodeAndSave(type, id, city, locality?)**
- Geocodes and writes geoLocation to Firestore doc
- Returns: GeoLocation | null

---

## Pure Library Functions (src/lib/)

**calculateCompatibility(answersA, answersB)** - matching.ts
- Returns: number (0-100)

**getActiveStatus(timestamp)** - matching.ts
- Returns: { status: "online" | "recent" | "offline", text: string }

**findExistingConnectionId(pairs, fromId, toId)** - connectionGuards.ts
- Returns: string | null

**canSendConnect(params)** - connectionGuards.ts
- Returns: boolean

**sanitizePublicProfile(profile)** - sanitizeProfile.ts
- Strips phone, email, workEmail
- Returns: Profile with empty PII

**hydrateOwnProfile(profile)** - privateUserData.ts
- Merges private PII from privateUserData/{uid}
- Returns: Profile with actual PII (for logged-in user only)

**compressImage(file, maxWidth, maxHeight, quality)** - imageCompressor.ts
- Canvas-based client-side compression
- Returns: Blob

**assignSharedPhones(params)** - phoneShare.ts
- Assigns ownerPhone and seekerPhone based on roles
- Returns: { ownerPhone, seekerPhone }

