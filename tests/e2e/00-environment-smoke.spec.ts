import { test, expect } from '@playwright/test';

test.describe('Phase 1: Test Environment Certification', () => {
  test('ENV-00: App opens, shell renders cleanly, and no fatal startup errors occur', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    // Capture uncaught exceptions on the page
    page.on('pageerror', (err) => {
      pageErrors.push(err.message || String(err));
    });

    // Capture error-level console output
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore non-fatal third-party/external network anomalies
        if (
          !text.includes('favicon') &&
          !text.includes('font') &&
          !text.includes('analytics') &&
          !text.includes('404')
        ) {
          consoleErrors.push(text);
        }
      }
    });

    // 1. App opens
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);

    // 2. Application shell renders with correct title
    await expect(page).toHaveTitle(/NestMate/i, { timeout: 15000 });

    // 3. Root shell DOM node is mounted and visible
    const appRoot = page.locator('#root, body');
    await expect(appRoot.first()).toBeVisible({ timeout: 15000 });

    // 4. Brand identity element or navigation shell renders
    const brandElement = page.locator('text=NestMate').first();
    await expect(brandElement).toBeVisible({ timeout: 15000 });

    // 5. Zero uncaught runtime crashes / fatal startup errors
    expect(pageErrors, `Unhandled page errors: ${pageErrors.join(', ')}`).toHaveLength(0);
    expect(consoleErrors, `Fatal console errors: ${consoleErrors.join(', ')}`).toHaveLength(0);
  });
});
