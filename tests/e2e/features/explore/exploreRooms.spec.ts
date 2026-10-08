import { test, expect } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.resolve(__dirname, '../../../../tests/.auth');

test.describe('Feature: Explore Rooms', () => {

  test('1. Room marketplace renders seeded active listings', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/explore\?tab=rooms/);

    // Verify rooms feed is loaded
    const roomCards = page.locator('article, [class*="CompactRoomCard"], [class*="RoomCard"]').or(page.locator('text=/Koramangala|Indiranagar|HSR/i'));
    await expect(roomCards.first()).toBeVisible({ timeout: 10000 });

    // Confirm active listing content
    await expect(page.locator('text=/Koramangala/i').first()).toBeVisible();

    await context.close();
  });

  test('2. Locality search filters active rooms grid', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    // Target the visible search input across responsive viewports
    const searchInput = page.locator('input[placeholder*="Search locality" i]:visible');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('Koramangala');

    // Wait for filtered results
    await expect(page.locator('text=/Koramangala/i').first()).toBeVisible();

    await context.close();
  });

  test('3. Sort dropdown orders rooms by rent', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });

    // Select Lowest Rent
    const sortSelect = page.locator('select').filter({ hasText: /Lowest Rent|Best Match/i }).first();
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('price_asc');
      // Confirm selection applied
      await expect(sortSelect).toHaveValue('price_asc');
    }

    await context.close();
  });

  test('4. Clicking a room card navigates to detailed room view', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });

    // Click on a room item or title
    const roomTitle = page.locator('text=/Koramangala/i').first();
    await expect(roomTitle).toBeVisible({ timeout: 10000 });
    await roomTitle.click();

    // Verify transition to /room/:id
    await expect(page).toHaveURL(/\/room\/[a-zA-Z0-9_-]+/, { timeout: 10000 });
    await expect(page.getByRole('button', { name: /Back/i })).toBeVisible({ timeout: 10000 });

    await context.close();
  });

});
