import { test, expect } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.resolve(__dirname, '../../../../tests/.auth');

test.describe('Feature: Profile Management', () => {

  test('1. Seeker profile displays user identity, verification badges, and role', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/profile/);

    // Verify seeker name is visible
    const nameHeading = page.locator('text=/Aditi Sharma/i').first();
    await expect(nameHeading).toBeVisible({ timeout: 10000 });

    // Verify seeker role or trust indicator is visible
    const seekerIndicator = page.locator('main').locator('text=/Seeker|Roommate|Verified|Trust/i').first();
    await expect(seekerIndicator).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('2. Seeker can navigate to edit profile page and see edit controls', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/edit-profile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/edit-profile/);

    // Verify edit form header or fields are visible
    const editHeading = page.locator('text=/Edit Profile|Profile Details|Basic Info/i').first();
    await expect(editHeading).toBeVisible({ timeout: 10000 });

    // Verify visible input or textarea for profile exists
    const inputField = page.locator('input:visible, textarea:visible').first();
    await expect(inputField).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('3. Owner profile renders owner role indicators and verification level', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'ownerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/profile/);

    // Verify owner name is visible
    const ownerName = page.locator('text=/Ramesh Gupta/i').first();
    await expect(ownerName).toBeVisible({ timeout: 10000 });

    // Verify owner role or verified badge
    const ownerBadge = page.locator('text=/Owner|Host|Property Manager|Verified/i').first();
    await expect(ownerBadge).toBeVisible({ timeout: 10000 });

    await context.close();
  });

});
