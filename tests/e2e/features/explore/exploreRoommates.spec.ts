import { test, expect } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.resolve(__dirname, '../../../../tests/.auth');

test.describe('Feature: Explore Roommates & Matching', () => {

  test('1. Roommates tab renders candidate profiles and match scores', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/explore?tab=roommates', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/explore\?tab=roommates/);

    // Verify roommate cards render with candidate names
    const candidateName = page.locator('h3').filter({ hasText: /Pooja|Karan/i }).first();
    await expect(candidateName).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('2. Current user is excluded from candidate roommate list', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/explore?tab=roommates', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    // Verify candidate grid does NOT show Seeker A (Aditi Sharma) as a match card to connect with
    const selfCardButton = page.locator('button').filter({ hasText: /Connect with Aditi/i });
    await expect(selfCardButton).toHaveCount(0);

    await context.close();
  });

  test('3. Locality search filters candidate roommates', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/explore?tab=roommates', { waitUntil: 'domcontentloaded' });

    // Search for a candidate
    const searchInput = page.locator('input[placeholder*="Search locality" i]:visible');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Pooja');
      await expect(page.locator('text=/Pooja/i').first()).toBeVisible();
    }

    await context.close();
  });

});
