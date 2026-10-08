import { test, expect } from '@playwright/test';

test.describe('Phase 14, 15 & 16: Cross-Feature End-to-End & Responsive Workflows', () => {
  test('JOURNEY-A: Seeker Room Discovery flow from Landing to Explore', async ({ page, isMobile }) => {
    // 1. Start from Landing
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    if (isMobile) {
      // Mobile landing features Hero Search CTA directly in viewport
      const searchBtn = page.getByRole('button', { name: 'Search' }).locator('visible=true').first();
      await expect(searchBtn).toBeVisible({ timeout: 10000 });
      await searchBtn.click();
    } else {
      const findRoomLink = page.getByRole('link', { name: /Find a Room/i }).locator('visible=true').first();
      await expect(findRoomLink).toBeVisible({ timeout: 10000 });
      await findRoomLink.click();
    }
    await expect(page).toHaveURL(/explore/);

    // 2. Perform search in explore
    const searchInput = page.getByPlaceholder(/Search locality|Search area|Search city/i).locator('visible=true').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('Koramangala');

    // 3. Verify page remains stable and responsive to search query
    await expect(page).toHaveURL(/explore/);
  });

  test('JOURNEY-B: Seeker Roommate Discovery to Match Inspection flow', async ({ page }) => {
    // 1. Navigate to Roommates tab on explore
    await page.goto('/explore?tab=roommates', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/tab=roommates/);

    // 2. Locate candidate card or empty state Create Profile CTA
    const candidateConnectBtn = page.getByRole('button', { name: /^Chat with/i }).locator('visible=true').first();
    const createProfileBtn = page.getByRole('button', { name: /Create Roommate Profile/i }).locator('visible=true').first();

    if (await candidateConnectBtn.isVisible()) {
      await candidateConnectBtn.click();
    } else {
      await expect(createProfileBtn).toBeVisible({ timeout: 10000 });
      await createProfileBtn.click();
    }

    // 3. Verify Auth modal opens with options
    const modal = page.locator(':visible').filter({ hasText: /Sign in to Connect|Join NestMate|Continue as Seeker/i }).first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 4. Close modal
    const closeBtn = page.getByLabel('Close').locator('visible=true').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  test('JOURNEY-C: Protected Owner & Backoffice Route Guard flow', async ({ page }) => {
    // 1. Visit Owner Dashboard without authentication -> should bounce to login
    await page.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);

    // 2. Visit Edit Listing without authentication -> should bounce to login
    await page.goto('/edit-listing/new', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);

    // 3. Visit Admin route without authentication -> should bounce to login
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin|\/login\?redirect=\/admin/);
  });

  test('RESP-01: Responsive navigation bar adjusts cleanly on viewport', async ({ page }) => {
    await page.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Explore/i);

    // Verify main content container is not horizontally overflowing
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    // Tolerance of a few pixels for rounding
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('VISUAL-01: Core brand elements render reliably across key views', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Ensure logo and brand icon render
    const brandLogo = page.locator('header a, nav a').filter({ hasText: /NestMate/i }).first();
    await expect(brandLogo).toBeVisible({ timeout: 10000 });
  });
});
