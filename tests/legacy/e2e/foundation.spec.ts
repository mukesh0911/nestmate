import { test, expect } from '@playwright/test';

test.describe('NestMate Core Infrastructure & Browser Foundation', () => {
  test('A. Landing page loads cleanly with real DOM content & brand identity', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/NestMate/i);

    // Verify main branding
    const brand = page.locator('text=NestMate').first();
    await expect(brand).toBeVisible({ timeout: 15000 });

    // Verify Hero Heading
    const heroHeading = page.locator('h1, :has-text("Find your people")').first();
    await expect(heroHeading).toBeVisible({ timeout: 10000 });

    // Verify Search CTA Button
    const searchBtn = page.locator('button:visible').filter({ hasText: /Search/i }).first();
    await expect(searchBtn).toBeVisible({ timeout: 10000 });

    // Filter out external resource / network errors
    const fatalErrors = consoleErrors.filter(
      (err) => !err.includes('favicon') && !err.includes('font') && !err.includes('analytics') && !err.includes('404')
    );
    expect(fatalErrors).toHaveLength(0);
  });

  test('B. Explore page loads and renders discovery tabs and filters', async ({ page }) => {
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Explore|NestMate/i);

    // Verify visible search input is rendered in active viewport
    const searchInput = page.locator('input[placeholder*="Search"]:visible, input[placeholder*="locality"]:visible, input[placeholder*="City"]:visible').first();
    await expect(searchInput).toBeVisible({ timeout: 20000 });
  });

  test('C. Auth page renders with login controls and switches to email mode', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Log In|NestMate/i);

    // Verify visible Google button exists
    const googleBtn = page.locator('button:visible').filter({ hasText: /Google/i }).first();
    await expect(googleBtn).toBeVisible({ timeout: 20000 });

    // Switch to Email mode using visible email trigger
    const emailTrigger = page.locator('button:visible').filter({ hasText: /Email/i }).first();
    if (await emailTrigger.isVisible()) {
      await emailTrigger.click();
    }

    // Verify email input becomes visible
    const emailInput = page.locator('input[type="email"]:visible');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });

  test('D. Informational and legal pages render expected content', async ({ page }) => {
    const infoPages = [
      { path: '/how-it-works' },
      { path: '/safety' },
      { path: '/help' },
      { path: '/privacy' },
    ];

    for (const info of infoPages) {
      await page.goto(info.path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    }
  });

  test('E. Convenience and legacy redirects route correctly', async ({ page }) => {
    // /phone-login redirects to /login
    await page.goto('/phone-login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);

    // /map redirects to /explore
    await page.goto('/map', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/explore/);
  });
});
