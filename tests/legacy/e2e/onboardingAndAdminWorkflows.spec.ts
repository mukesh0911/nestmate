import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../fixtures/authFixtures';
import { AccountFactory } from '../factories/accountFactory';

test.describe('Section 7, 16 & 17: Onboarding, Admin Control & Moderation Workflows', () => {
  test('ONBOARD-01: Incomplete user (ONBOARDING_PENDING) is quarantined to role selection or onboarding', async ({ page }) => {
    const incompleteUser = AccountFactory.createIncompleteUser('onboarding_pending');
    await AuthHelpers.setupMockSession(page, incompleteUser);

    // Attempt to access interactive route (/chat)
    await page.goto('/chat', { waitUntil: 'domcontentloaded' });

    // OnboardingGuard bounces incomplete user to /role-select or onboarding
    await expect(page).toHaveURL(/\/role-select|\/onboarding/);
  });

  test('ONBOARD-02: RoleSelect route displays Seeker and Owner selection cards', async ({ page }) => {
    const incompleteUser = AccountFactory.createIncompleteUser('onboarding_pending');
    await AuthHelpers.setupMockSession(page, incompleteUser);

    await page.goto('/role-select', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Role|NestMate/i);

    // Verify role selection cards for Seeker and Owner
    const seekerCard = page.locator(':visible').filter({ hasText: /Find a Room & Roommate|Continue as Seeker/i }).first();
    const ownerCard = page.locator(':visible').filter({ hasText: /List My Room|Continue as Owner/i }).first();

    await expect(seekerCard).toBeVisible({ timeout: 10000 });
    await expect(ownerCard).toBeVisible({ timeout: 10000 });
  });

  test('ONBOARD-03: Seeker onboarding route renders profile setup and lifestyle questions', async ({ page }) => {
    const seekerIncomplete = AccountFactory.createSeeker('seeker_onboarding_test', {
      onboardingComplete: false,
      role: 'seeker',
    });
    await AuthHelpers.setupMockSession(page, seekerIncomplete);

    await page.goto('/onboarding/seeker', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Onboarding|NestMate/i);

    // Verify form renders city, budget, or lifestyle questions
    const onboardingForm = page.locator(':visible').filter({
      hasText: /Bengaluru|Budget|Lifestyle|Sleep|Wake|Cleanliness|Smoking|Food/i
    }).first();
    await expect(onboardingForm).toBeVisible({ timeout: 15000 });
  });

  test('ADMIN-01: Admin user gains full access to Admin Control Center', async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // Verify Admin Control Center renders
    await expect(page).toHaveURL(/\/admin/);
    const adminDashboard = page.locator(':visible').filter({
      hasText: /Admin|Overview|Users|Listings|Verifications|Reports/i
    }).first();
    await expect(adminDashboard).toBeVisible({ timeout: 15000 });
  });

  test('ADMIN-02: Admin verifications queue renders pending verification requests', async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
    await page.goto('/admin/verifications', { waitUntil: 'domcontentloaded' });

    // Verify Verifications table / view
    await expect(page).toHaveURL(/\/admin\/verifications/);
    const verifHeader = page.locator(':visible').filter({ hasText: /Verifications|Status|Document|Filter/i }).first();
    await expect(verifHeader).toBeVisible({ timeout: 15000 });
  });

  test('ADMIN-03: Admin reports and moderation surface displays safety cases', async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
    await page.goto('/admin/reports', { waitUntil: 'domcontentloaded' });

    // Verify Reports table / safety cases
    await expect(page).toHaveURL(/\/admin\/reports/);
    const reportsView = page.locator(':visible').filter({ hasText: /Reports|Safety|Flag|Incident|Reporter/i }).first();
    await expect(reportsView).toBeVisible({ timeout: 15000 });
  });

  test('ADMIN-04: Non-admin authenticated seeker is denied access and redirected away from /admin', async ({ page }) => {
    await AuthHelpers.loginAsSeekerA(page);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // Seeker must be bounced away from /admin
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  test('MOD-01: Suspended and banned accounts are quarantined with BlockedAccountScreen', async ({ page }) => {
    // 1. Suspended user attempting protected interactive route (/chat)
    const suspended = AccountFactory.createSuspendedUser('suspended_test_user');
    await AuthHelpers.setupMockSession(page, suspended);
    await page.goto('/chat', { waitUntil: 'domcontentloaded' });

    // Should display Account Restricted screen
    const restrictedScreen = page.locator(':visible').filter({ hasText: /Account Restricted|Sign out/i }).first();
    await expect(restrictedScreen).toBeVisible({ timeout: 10000 });

    // 2. Banned user attempting protected interactive route (/chat)
    const banned = AccountFactory.createBannedUser('banned_test_user');
    await AuthHelpers.setupMockSession(page, banned);
    await page.goto('/chat', { waitUntil: 'domcontentloaded' });

    const bannedScreen = page.locator(':visible').filter({ hasText: /Account Restricted|Sign out/i }).first();
    await expect(bannedScreen).toBeVisible({ timeout: 10000 });
  });
});
