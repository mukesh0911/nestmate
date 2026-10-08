import { test, expect } from '@playwright/test';

test.describe('Phase 10 & 11: Connections, Messaging & Owner Workflows', () => {
  test('CONN-01: Roommates tab provides Connect action and triggers Auth Modal for unauthenticated user', async ({ page }) => {
    await page.goto('/explore?tab=roommates', { waitUntil: 'domcontentloaded' });
    
    // Find candidate card Connect/Chat action button or empty state Create Profile CTA
    const candidateConnectBtn = page.getByRole('button', { name: /^Chat with/i }).locator('visible=true').first();
    const createProfileBtn = page.getByRole('button', { name: /Create Roommate Profile/i }).locator('visible=true').first();

    if (await candidateConnectBtn.isVisible()) {
      await candidateConnectBtn.click();
    } else {
      await expect(createProfileBtn).toBeVisible({ timeout: 10000 });
      await createProfileBtn.click();
    }

    // Verify Auth Modal appears requiring sign-in or demo account
    const modalTitle = page.locator(':visible').filter({ hasText: /Sign in to Connect|Join NestMate|Continue as Seeker/i }).first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
  });

  test('CONN-02: Phone number and private contact info are masked on public discovery', async ({ page }) => {
    await page.goto('/explore?tab=roommates', { waitUntil: 'domcontentloaded' });

    // Ensure raw unmasked phone numbers are NOT displayed in plaintext on public cards
    const rawPhoneRegex = page.locator('text=/\\+91\\s*[6-9]\\d{9}/');
    await expect(rawPhoneRegex).not.toBeVisible();
  });

  test('CHAT-01: Chat hub route (/chat) guards unauthenticated users to login', async ({ page }) => {
    await page.goto('/chat', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('CHAT-02: Direct chat room route (/chat/:roomId) guards unauthenticated users to login', async ({ page }) => {
    await page.goto('/chat/test_room_123', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('OWNER-01: Owner Dashboard route (/owner-dashboard) guards unauthenticated users to login', async ({ page }) => {
    await page.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('OWNER-02: Owner Dashboard applicants tab route guards unauthenticated users to login', async ({ page }) => {
    await page.goto('/owner-dashboard?tab=applicants', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('OWNER-03: Create Listing route (/edit-listing/new) guards unauthenticated users to login', async ({ page }) => {
    await page.goto('/edit-listing/new', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });
});
