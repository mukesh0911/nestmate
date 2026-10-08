import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../fixtures/authFixtures';
import { AccountFactory } from '../factories/accountFactory';

test.describe('Section 9, 10 & 11: Owner Experience, Verification & Listing Lifecycle', () => {
  test('OWNER-V-01: Verified Owner A vs Unverified Owner B verification state badges', async ({ browser }) => {
    // 1. Context A: Verified Owner A (verificationLevel = 3, isVerified = true)
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await AuthHelpers.loginAsOwnerA(pageA);

    await pageA.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(pageA.locator('body')).toBeVisible({ timeout: 15000 });

    // Verified Owner A sees Verified Host badge or verified status
    const verifiedBadge = pageA.locator(':visible').filter({ hasText: /Verified Host|Verified|Identity Verified/i }).first();
    await expect(verifiedBadge).toBeVisible({ timeout: 10000 });
    await contextA.close();

    // 2. Context B: Unverified Owner B (verificationLevel = 0, isVerified = false)
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await AuthHelpers.loginAsOwnerB(pageB);

    await pageB.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(pageB.locator('body')).toBeVisible({ timeout: 15000 });

    // Unverified Owner B sees Verification Pending or gate prompt
    const pendingNotice = pageB.locator(':visible').filter({ hasText: /Verification Pending|Pending|Verify Your Identity|Verification Required/i }).first();
    await expect(pendingNotice).toBeVisible({ timeout: 10000 });
    await contextB.close();
  });

  test('OWNER-V-02: Listing lifecycle - Pending verification listing is blocked from public seekers', async ({ page }) => {
    // Authenticated seeker visits an unverified listing in pending_verification status
    await AuthHelpers.loginAsSeekerA(page);
    await page.goto('/room/FSXystxUrr3MzY37W7L2', { waitUntil: 'domcontentloaded' });

    // Verify security gate: Unverified owner listings are pending review
    const pendingGate = page.locator(':visible').filter({
      hasText: /Listing not yet available|pending identity verification by the owner|Browse Other Rooms/i
    }).first();
    await expect(pendingGate).toBeVisible({ timeout: 15000 });
  });

  test('OWNER-V-03: Listing lifecycle - Inactive or non-existent listing renders safe fallback', async ({ page }) => {
    await AuthHelpers.loginAsSeekerA(page);
    await page.goto('/room/non_existent_listing_id_999', { waitUntil: 'domcontentloaded' });

    // Expect graceful fallback: "Listing not found"
    const notFoundState = page.locator(':visible').filter({
      hasText: /Listing not found|Browse Other Rooms|This room is inactive/i
    }).first();
    await expect(notFoundState).toBeVisible({ timeout: 15000 });
  });

  test('OWNER-V-04: Listing creation route is accessible for authenticated owners', async ({ page }) => {
    await AuthHelpers.loginAsOwnerA(page);
    await page.goto('/edit-listing/new', { waitUntil: 'domcontentloaded' });

    // Verify Create Listing page/heading or space details form
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    const createForm = page.locator(':visible').filter({
      hasText: /List a Room|Add New Space|Create Listing|Property Details|Rent|Flat Type/i
    }).first();
    await expect(createForm).toBeVisible({ timeout: 15000 });
  });

  test('OWNER-V-05: Non-owner seekers navigating to owner dashboard are bounced to their dashboard', async ({ page }) => {
    // Seeker attempting to access Owner-only route
    await AuthHelpers.loginAsSeekerA(page);
    await page.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });

    // Role-based routing: seeker redirected to seeker dashboard/explore
    await expect(page).not.toHaveURL(/\/owner-dashboard$/);
  });
});
