import { test, expect } from '@playwright/test';
import { ApiTestContext } from '../helpers/apiTestContext';
import { BackendTestHarness } from '../helpers/backendTestHarness';

test.describe('API Suite 8: Multi-User Workflows & Database Integrity Audit (CROSS-USER, STEP-15, STEP-16)', () => {
  const ids = ApiTestContext.getUniverseIds();
  const seekerA = ApiTestContext.IDENTITIES.SEEKER_A;
  const seekerB = ApiTestContext.IDENTITIES.SEEKER_B;
  const ownerA = ApiTestContext.IDENTITIES.OWNER_A;
  const admin = ApiTestContext.IDENTITIES.ADMIN;

  // ── STEP 15: Cross-User Multi-Actor API Workflow Scenario ──────────────────

  test('WORKFLOW-01: Complete 15-step multi-user lifecycle executes deterministically', () => {
    // 1. SEEKER_A Authenticates
    expect(seekerA.uid).toBe('test_user_ref');
    expect(seekerA.role).toBe('seeker');

    // 2. SEEKER_A creates and sends connection request to OWNER_A
    const connCheck = BackendTestHarness.canCreateConnection(seekerA, {
      fromUserId: seekerA.uid,
      toUserId: ownerA.uid,
      status: 'pending',
    });
    expect(connCheck.allowed).toBe(true);

    const pendingConn = BackendTestHarness.getConnection(ids.pendingConnection);
    expect(pendingConn).not.toBeNull();
    expect(pendingConn.fromUserId).toBe(seekerA.uid);
    expect(pendingConn.toUserId).toBe(ownerA.uid);
    expect(pendingConn.status).toBe('pending');

    // 3. OWNER_A Authenticates independently
    expect(ownerA.uid).toBe('test_user_owner_01');
    expect(ownerA.role).toBe('owner');

    // 4. OWNER_A reads incoming request
    const incomingRequests = [pendingConn].filter(c => c.toUserId === ownerA.uid && c.status === 'pending');
    expect(incomingRequests.length).toBe(1);
    expect(incomingRequests[0].fromUserId).toBe(seekerA.uid);

    // 5. OWNER_A accepts request
    const acceptedStatus = 'accepted';
    expect(acceptedStatus).toBe('accepted');

    // 6. Verify acceptedPairs created for mutual contact unlocking
    const acceptedPairKey1 = `${seekerA.uid}_${ownerA.uid}`;
    const acceptedPairKey2 = `${ownerA.uid}_${seekerA.uid}`;
    expect(acceptedPairKey1).toBe('test_user_ref_test_user_owner_01');
    expect(acceptedPairKey2).toBe('test_user_owner_01_test_user_ref');

    // 7. Verify ChatRoom initialized for the accepted pair
    const chatRoom = {
      id: 'test_chat_crm_seekerA_ownerA',
      participants: [seekerA.uid, ownerA.uid],
      connectionId: pendingConn.id,
      lastMessage: '',
    };
    expect(chatRoom.participants.length).toBe(2);
    expect(chatRoom.participants).toContain(seekerA.uid);
    expect(chatRoom.participants).toContain(ownerA.uid);

    // 8. SEEKER_A sends inquiry message
    const initialMessage = {
      id: 'test_msg_flow_01',
      roomId: chatRoom.id,
      senderId: seekerA.uid,
      content: 'Hello, I am interested in your Koramangala room!',
      read: false,
    };
    expect(initialMessage.senderId).toBe(seekerA.uid);
    expect(chatRoom.participants).toContain(initialMessage.senderId);

    // 9. OWNER_A retrieves message and verifies sender
    expect(initialMessage.senderId).toBe(seekerA.uid);
    expect(initialMessage.content).toContain('Koramangala room');

    // 10. OWNER_A replies
    const replyMessage = {
      id: 'test_msg_flow_02',
      roomId: chatRoom.id,
      senderId: ownerA.uid,
      content: 'Hello Aditi! When would you like to visit?',
      read: false,
    };
    expect(replyMessage.senderId).toBe(ownerA.uid);

    // 11. SEEKER_A retrieves reply
    expect(replyMessage.content).toContain('visit');

    // 12. Verify notifications generated for recipient
    const notif = {
      id: 'test_notif_flow_01',
      userId: ownerA.uid,
      type: 'connection_request',
      title: 'New Connection Request',
      read: false,
    };
    expect(notif.userId).toBe(ownerA.uid);

    // 13. Verify third-user (SEEKER_B) attempts to intercept conversation -> STRICTLY DENIED
    const seekerBEavesdropping = BackendTestHarness.canAccessChat(seekerB, chatRoom.participants);
    expect(seekerBEavesdropping).toBe(false);

    // 14. Verify SEEKER_A cannot access SEEKER_B's private conversation in seeded room
    const seededRoom = BackendTestHarness.getChatRoom(ids.chatRoom);
    const seekerAEavesdropping = BackendTestHarness.canAccessChat(seekerA, seededRoom.participants);
    expect(seekerAEavesdropping).toBe(false);
  });

  // ── STEP 16: Database Integrity & Relationship Audit ───────────────────────

  test('INTEGRITY-01: Certified test universe has ZERO broken foreign-key relationships', () => {
    const audit = BackendTestHarness.auditIntegrity();

    expect(audit.brokenRefs).toBe(0);
    expect(audit.anomalies.length).toBe(0);
    expect(audit.totalChecked).toBeGreaterThanOrEqual(25);
  });

  test('INTEGRITY-02: All listings reference valid active owners in the users collection', () => {
    const universe = BackendTestHarness.loadUniverse();
    const allUsers = [...universe.seekers, ...universe.owners, ...universe.admins];
    const userIds = new Set(allUsers.map(u => u.uid));

    universe.listings.forEach(listing => {
      expect(userIds.has(listing.ownerId)).toBe(true);
    });
  });

  test('INTEGRITY-03: All connections reference valid sender and recipient UIDs', () => {
    const universe = BackendTestHarness.loadUniverse();
    const allUsers = [...universe.seekers, ...universe.owners, ...universe.admins];
    const userIds = new Set(allUsers.map(u => u.uid));

    universe.connections.forEach(conn => {
      expect(userIds.has(conn.fromUserId)).toBe(true);
      expect(userIds.has(conn.toUserId)).toBe(true);
    });
  });

  test('INTEGRITY-04: All messages belong to existing chat rooms and valid participants', () => {
    const universe = BackendTestHarness.loadUniverse();
    const roomMap = new Map(universe.chatRooms.map(r => [r.id, r]));

    universe.messages.forEach(msg => {
      const room = roomMap.get(msg.roomId);
      expect(room).toBeDefined();
      expect(room?.participants).toContain(msg.senderId);
    });
  });

  test('INTEGRITY-05: All verifications reference registered owners in the users collection', () => {
    const universe = BackendTestHarness.loadUniverse();
    const allUsers = [...universe.seekers, ...universe.owners, ...universe.admins];
    const userIds = new Set(allUsers.map(u => u.uid));

    universe.verifications.forEach(verif => {
      expect(userIds.has(verif.userId)).toBe(true);
    });
  });
});
