import { test, expect } from '@playwright/test';
import path from 'path';
import { TEST_LISTINGS } from '../../helpers/testDataRegistry';
import { injectFirebaseAuth } from '../../helpers/firebaseAuthInjector';

const AUTH_DIR = path.resolve(__dirname, '../../../tests/.auth');

test.describe('Workflow: Listing Discovery to Connection & Communication', () => {

  test('Step 1: Seeker discovers active listing on Explore and navigates to details', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();
    await injectFirebaseAuth(page, 'SEEKER_A');

    // Seeker opens explore page
    await page.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/explore/);

    // Verify rooms feed is loaded
    const roomCard = page.locator('article, [class*="CompactRoomCard"], [class*="RoomCard"]').or(page.locator('text=/Koramangala|Indiranagar|HSR/i')).first();
    await expect(roomCard).toBeVisible({ timeout: 15000 });

    // Open listing detail directly or via click
    await page.goto(`/room/${TEST_LISTINGS.ACTIVE_KORAMANGALA}`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(`/room/${TEST_LISTINGS.ACTIVE_KORAMANGALA}`));

    // Verify details loaded
    const title = page.locator('main').locator('text=/Koramangala/i').locator('visible=true').first();
    await expect(title).toBeVisible({ timeout: 10000 });

    // Verify Connect / Message / Status button exists
    const actionBtn = page.locator('main').locator('button, a').filter({ hasText: /Connect|Interest|Message|Applied/i }).locator('visible=true').first();
    await expect(actionBtn).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('Step 2: Owner reviews incoming applicant inquiries in Dashboard', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'ownerA.json'),
    });
    const page = await context.newPage();
    await injectFirebaseAuth(page, 'OWNER_A');

    // Owner accesses Applicants tab
    await page.goto('/owner-dashboard?tab=applicants', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/owner-dashboard\?tab=applicants/);

    // Verify Inquiries / Applicants section is visible
    const applicantsSection = page.locator('main').locator('text=/Pending Inquiries|Inquiries|Applicants|Requests/i').locator('visible=true').first();
    await expect(applicantsSection).toBeVisible({ timeout: 15000 });

    await context.close();
  });

  test('Step 3: Accepted connection unlocks seamless messaging channel', async ({ browser }) => {
    // Seeker B (Pooja) has accepted connection test_conn_a01
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerB.json'),
    });
    const page = await context.newPage();
    await injectFirebaseAuth(page, 'SEEKER_B');

    await page.goto('/chat', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/chat/);

    // Verify chat UI renders conversation thread or message area
    const chatContainer = page.locator('main').locator('text=/Messages|Aditi|Ramesh|online|Type a message/i').locator('visible=true').first();
    await expect(chatContainer).toBeVisible({ timeout: 15000 });

    await context.close();
  });

});
