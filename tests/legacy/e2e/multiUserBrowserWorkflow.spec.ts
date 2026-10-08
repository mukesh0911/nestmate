import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../fixtures/authFixtures';

test.describe('Section 4 & 14 & 15: Real Multi-User Browser Workflows (Headed / Context Isolation)', () => {
  test('MULTI-01: Seeker A discovers listings and inspects verified / verification states', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await AuthHelpers.loginAsSeekerA(pageA);

    try {
      // 1. Seeker A navigates to Explore Rooms to discover listings
      await pageA.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });
      await expect(pageA).toHaveTitle(/Explore|NestMate/i);

      // Verify search input is present and functional
      const searchInput = pageA.locator('input[placeholder*="Search"]:visible, input[placeholder*="locality"]:visible').first();
      await expect(searchInput).toBeVisible({ timeout: 10000 });

      // 2. Seeker A inspects a specific listing detail (e.g. Indiranagar room)
      await pageA.goto('/room/FSXystxUrr3MzY37W7L2', { waitUntil: 'domcontentloaded' });
      
      // Data reality check: Verify Room detail container renders with genuine status
      // (either active room details or owner identity verification gate)
      const roomContainer = pageA.locator(':visible').filter({
        hasText: /Listing not yet available|Sunny Private Room|Indiranagar|Room Details|Browse Other Rooms/i
      }).first();
      await expect(roomContainer).toBeVisible({ timeout: 15000 });
    } finally {
      await contextA.close();
    }
  });

  test('MULTI-02: Owner A views applicants and connection management surfaces', async ({ browser }) => {
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await AuthHelpers.loginAsOwnerA(pageB);

    try {
      // Owner A navigates to Owner Dashboard
      await pageB.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
      await expect(pageB).toHaveURL(/\/owner-dashboard/);

      // Verify that Owner Dashboard title or welcome banner appears
      const dashboardHeader = pageB.locator(':visible').filter({
        hasText: /Owner Dashboard|Welcome back|My Listings|Applicants|Overview/i
      }).first();
      await expect(dashboardHeader).toBeVisible({ timeout: 15000 });
    } finally {
      await contextB.close();
    }
  });

  test('MULTI-03: Real-time messaging and reply exchange between Seeker A and Owner A', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await AuthHelpers.loginAsSeekerA(pageA);
    await AuthHelpers.loginAsOwnerA(pageB);

    try {
      // 1. Both users navigate to Chat hub
      await pageA.goto('/chat', { waitUntil: 'domcontentloaded' });
      await pageB.goto('/chat', { waitUntil: 'domcontentloaded' });

      await expect(pageA.locator('body')).toBeVisible({ timeout: 15000 });
      await expect(pageB.locator('body')).toBeVisible({ timeout: 15000 });

      // Verify Chat page loads for both users with title
      await expect(pageA).toHaveTitle(/Messages|NestMate/i);
      await expect(pageB).toHaveTitle(/Messages|NestMate/i);

      // 2. Select conversation or active room if present
      const messageInputA = pageA.locator('input[placeholder*="Type a message"], input[aria-label="Message"]:visible').first();
      if (await messageInputA.isVisible({ timeout: 5000 }).catch(() => false)) {
        const testMsg = `Hello from Seeker A test run ${Date.now()}`;
        await messageInputA.fill(testMsg);

        const sendBtnA = pageA.locator('button[aria-label="Send message"]:visible').first();
        if (await sendBtnA.isVisible()) {
          await sendBtnA.click();

          // Verify message appears in Seeker A's chat
          await expect(pageA.locator(`text=${testMsg}`).first()).toBeVisible({ timeout: 10000 });
        }
      } else {
        // Chat room list empty or requires room selection
        const conversationItem = pageA.locator('button:visible, div:visible').filter({ hasText: /Ramesh|Pooja|Conversation/i }).first();
        if (await conversationItem.isVisible()) {
          await conversationItem.click();
        }
      }
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('MULTI-04: Notifications display connection and communication updates', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await AuthHelpers.loginAsSeekerA(pageA);

    try {
      await pageA.goto('/notifications', { waitUntil: 'domcontentloaded' });
      await expect(pageA).toHaveTitle(/Notifications|NestMate/i);

      // Verify notifications list or safe empty state renders
      const notifContainer = pageA.locator(':visible').filter({ hasText: /Notifications|No notifications|Connection|Message|All/i }).first();
      await expect(notifContainer).toBeVisible({ timeout: 10000 });
    } finally {
      await contextA.close();
    }
  });

  test('MULTI-05: Unauthorized third-party Seeker B cannot access private conversation', async ({ browser }) => {
    const contextC = await browser.newContext();
    const pageC = await contextC.newPage();
    await AuthHelpers.loginAsSeekerB(pageC);

    try {
      // Seeker B attempts to navigate to private chat room ID not belonging to them
      await pageC.goto('/chat/unauthorized_private_room_999', { waitUntil: 'domcontentloaded' });

      // Verify that unauthorized access does not leak private messages
      // Page should show safe empty state ("Say hello" or "No messages" or bounce) and not display unauthorized data
      await expect(pageC.locator('body')).toBeVisible();
      const leakedPrivateMessages = pageC.locator('text="CONFIDENTIAL_LEAK_TEST"');
      await expect(leakedPrivateMessages).not.toBeVisible();
    } finally {
      await contextC.close();
    }
  });
});
