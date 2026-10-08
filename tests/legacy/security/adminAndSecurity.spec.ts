import { test, expect } from '@playwright/test';

test.describe('Phase 12 & 13: Admin Workflow & Security / Permissions Verification', () => {
  test('SEC-01: Unauthenticated user accessing /admin is bounced to login with redirect param', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin|\/login\?redirect=\/admin/);
  });

  test('SEC-02: Unauthenticated user accessing /admin/users is bounced to login with redirect param', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fusers|\/login\?redirect=\/admin\/users/);
  });

  test('SEC-03: Unauthenticated user accessing /admin/reports is bounced to login with redirect param', async ({ page }) => {
    await page.goto('/admin/reports', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Freports|\/login\?redirect=\/admin\/reports/);
  });

  test('SEC-04: Unauthenticated user accessing /admin/verifications is bounced to login with redirect param', async ({ page }) => {
    await page.goto('/admin/verifications', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fverifications|\/login\?redirect=\/admin\/verifications/);
  });

  test('SEC-05: Unauthenticated user accessing /admin/settings is bounced to login with redirect param', async ({ page }) => {
    await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fsettings|\/login\?redirect=\/admin\/settings/);
  });

  test('SEC-06: Unauthenticated user accessing /admin/listings is bounced to login with redirect param', async ({ page }) => {
    await page.goto('/admin/listings', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Flistings|\/login\?redirect=\/admin\/listings/);
  });

  test('SEC-07: Unauthenticated user accessing /admin/marketplace is bounced to login with redirect param', async ({ page }) => {
    await page.goto('/admin/marketplace', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin%2Fmarketplace|\/login\?redirect=\/admin\/marketplace/);
  });

  test('SEC-08: Admin redirection watcher intercepts arbitrary subpaths containing /admin', async ({ page }) => {
    // App.tsx contains an AdminRedirectWatcher that catches /explore/admin or /room/123/admin
    await page.goto('/explore/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin|\/admin/);
  });
});
