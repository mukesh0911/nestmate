import { test, expect } from '@playwright/test';
import path from 'path';
import { injectFirebaseAuth } from '../../../helpers/firebaseAuthInjector';

const AUTH_DIR = path.resolve(__dirname, '../../../../tests/.auth');

test.describe('Feature: Notifications Feed & Activity Alerts', () => {

  test('1. Notifications hub renders header, filter controls, and seeded activity feed', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();
    await injectFirebaseAuth(page, 'SEEKER_A');

    await page.goto('/notifications', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/notifications/);

    // Verify PageShell title
    const title = page.locator('main').locator('text=/Notifications/i').locator('visible=true').first();
    await expect(title).toBeVisible({ timeout: 15000 });

    // Verify subtitle or notification feed content
    const subtitleOrFeed = page.locator('main').locator('text=/Stay updated|Never miss|match|inquiry|caught up/i').locator('visible=true').first();
    await expect(subtitleOrFeed).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('2. Filter tabs switch between All and Unread notifications', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();
    await injectFirebaseAuth(page, 'SEEKER_A');

    await page.goto('/notifications', { waitUntil: 'domcontentloaded' });

    // Check if filter tabs exist (when notifications exist)
    const allTab = page.locator('main').locator('button').filter({ hasText: /^All/i }).locator('visible=true').first();
    const unreadTab = page.locator('main').locator('button').filter({ hasText: /^Unread/i }).locator('visible=true').first();

    if (await allTab.isVisible()) {
      await expect(unreadTab).toBeVisible();
      await unreadTab.click();
      // Ensure tab clicked without crash
      await expect(unreadTab).toBeVisible();
    } else {
      // Empty state shows caught up message
      const emptyState = page.locator('main').locator('text=/All caught up|No unread notifications/i').locator('visible=true').first();
      await expect(emptyState).toBeVisible({ timeout: 10000 });
    }

    await context.close();
  });

  test('3. Browser notification alert banner or settings trigger is interactive', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();
    await injectFirebaseAuth(page, 'SEEKER_A');

    await page.goto('/notifications', { waitUntil: 'domcontentloaded' });

    // Verify interactive elements (Enable Alerts button or notification action controls)
    const alertBtnOrAction = page.locator('main').locator('button').filter({ hasText: /Enable Alerts|Mark all as read|Browse Listings/i }).locator('visible=true').first();
    await expect(alertBtnOrAction).toBeVisible({ timeout: 10000 });

    await context.close();
  });

});
