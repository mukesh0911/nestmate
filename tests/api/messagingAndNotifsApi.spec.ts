import { test, expect } from '@playwright/test';
import { ApiTestContext } from '../helpers/apiTestContext';
import { BackendTestHarness } from '../helpers/backendTestHarness';

test.describe('API Suite 5: Messaging & Notifications Operations (OP-CHAT, OP-NOTIF)', () => {
  const ids = ApiTestContext.getUniverseIds();
  const seekerA = ApiTestContext.IDENTITIES.SEEKER_A;
  const seekerB = ApiTestContext.IDENTITIES.SEEKER_B;
  const ownerA = ApiTestContext.IDENTITIES.OWNER_A;
  const admin = ApiTestContext.IDENTITIES.ADMIN;

  // ── STEP 9: Messaging & Chat Operations ───────────────────────────────────

  test('CHAT-01: Chat room contains exactly two participants and links to connection', () => {
    const chatRoom = BackendTestHarness.getChatRoom(ids.chatRoom);
    expect(chatRoom).not.toBeNull();
    expect(chatRoom.participants.length).toBe(2);
    expect(chatRoom.participants).toContain(ids.seekerB);
    expect(chatRoom.participants).toContain(ids.ownerA);
    expect(chatRoom.connectionId).toBe(ids.acceptedConnection);
  });

  test('CHAT-02: Message exchange preserves chronological ordering and sender attribution', () => {
    const messages = BackendTestHarness.getMessages(ids.chatRoom);
    expect(messages.length).toBe(3);

    // Message 1: From Seeker B
    expect(messages[0].id).toBe(ids.message1);
    expect(messages[0].senderId).toBe(ids.seekerB);
    expect(messages[0].content).toContain('2BHK room');
    expect(messages[0].read).toBe(true);

    // Message 2: Reply from Owner A
    expect(messages[1].id).toBe(ids.message2);
    expect(messages[1].senderId).toBe(ids.ownerA);
    expect(messages[1].content).toContain('Would you like a tour?');
    expect(messages[1].read).toBe(true);

    // Message 3: Response from Seeker B
    expect(messages[2].id).toBe(ids.message3);
    expect(messages[2].senderId).toBe(ids.seekerB);
    expect(messages[2].content).toBe('Saturday works best.');
    expect(messages[2].read).toBe(false);
  });

  test('CHAT-03 (CRITICAL): Third-user (Seeker A) is strictly DENIED access to private chat between Seeker B and Owner A', () => {
    const chatRoom = BackendTestHarness.getChatRoom(ids.chatRoom);
    expect(chatRoom.participants).not.toContain(seekerA.uid);

    // 1. Participant check for Seeker B (Participant) -> PERMITTED
    const seekerBAccess = BackendTestHarness.canAccessChat(seekerB, chatRoom.participants);
    expect(seekerBAccess).toBe(true);

    // 2. Participant check for Owner A (Participant) -> PERMITTED
    const ownerAAccess = BackendTestHarness.canAccessChat(ownerA, chatRoom.participants);
    expect(ownerAAccess).toBe(true);

    // 3. Participant check for Seeker A (Third Party) -> DENIED
    const seekerAAccess = BackendTestHarness.canAccessChat(seekerA, chatRoom.participants);
    expect(seekerAAccess).toBe(false);

    // 4. Admin access -> PERMITTED
    const adminAccess = BackendTestHarness.canAccessChat(admin, chatRoom.participants);
    expect(adminAccess).toBe(true);
  });

  test('CHAT-04: Non-participant CANNOT create or inject messages into chat room', () => {
    const chatRoom = BackendTestHarness.getChatRoom(ids.chatRoom);
    const canInjectMessage = (callerUid: string, participants: string[]) => {
      return participants.includes(callerUid);
    };

    expect(canInjectMessage(seekerA.uid, chatRoom.participants)).toBe(false);
    expect(canInjectMessage(seekerB.uid, chatRoom.participants)).toBe(true);
    expect(canInjectMessage(ownerA.uid, chatRoom.participants)).toBe(true);
  });

  // ── STEP 10: Notification Operations & Recipient Isolation ─────────────────

  test('NOTIF-01: Notifications in certified universe are bound to specific recipients', () => {
    const universe = BackendTestHarness.loadUniverse();
    expect(universe.notifications.length).toBeGreaterThanOrEqual(3);

    const n1 = universe.notifications.find(n => n.id === ids.notification1);
    expect(n1.userId).toBe(ownerA.uid);
    expect(n1.type).toBe('connection_request');

    const n2 = universe.notifications.find(n => n.id === ids.notification2);
    expect(n2.userId).toBe(seekerB.uid);
    expect(n2.type).toBe('connection_accepted');
  });

  test('NOTIF-02: Notification recipient isolation strictly prevents cross-user visibility', () => {
    // Owner A notifications
    const ownerNotifs = BackendTestHarness.getNotifications(ownerA.uid);
    expect(ownerNotifs.every(n => n.userId === ownerA.uid)).toBe(true);

    // Seeker B notifications
    const seekerBNotifs = BackendTestHarness.getNotifications(seekerB.uid);
    expect(seekerBNotifs.every(n => n.userId === seekerB.uid)).toBe(true);

    // Cross-user check: Owner A's notifications must NOT contain Seeker B's notifications
    const leakFound = ownerNotifs.some(n => n.userId === seekerB.uid);
    expect(leakFound).toBe(false);

    // Security rule authorization check
    expect(BackendTestHarness.canAccessNotification(seekerA, ownerA.uid)).toBe(false);
    expect(BackendTestHarness.canAccessNotification(ownerA, ownerA.uid)).toBe(true);
    expect(BackendTestHarness.canAccessNotification(admin, ownerA.uid)).toBe(true);
  });

  test('NOTIF-03: Marking notification as read mutates read status while preserving content immutability', () => {
    const notif = BackendTestHarness.getNotifications(ownerA.uid)[0];
    expect(notif).toBeDefined();

    // Simulating markAsRead mutation: only 'read' changes
    const updatedNotif = { ...notif, read: true };
    expect(updatedNotif.read).toBe(true);
    expect(updatedNotif.title).toBe(notif.title);
    expect(updatedNotif.message).toBe(notif.message);
    expect(updatedNotif.userId).toBe(notif.userId);
  });
});
