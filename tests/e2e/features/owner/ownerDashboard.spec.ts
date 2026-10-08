import { test, expect } from '@playwright/test';
import path from 'path';

const AUTH_DIR = path.resolve(__dirname, '../../../../tests/.auth');

test.describe('Feature: Owner Dashboard & Management', () => {

  test('1. Owner dashboard overview renders key portfolio metrics and controls', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'ownerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/owner-dashboard/);

    // Verify visible owner dashboard content inside main container
    const dashboardHeader = page.locator('main').locator('text=/Owner Dashboard/i').locator('visible=true').first();
    await expect(dashboardHeader).toBeVisible({ timeout: 10000 });

    // Verify visible metrics cards or action buttons exist
    const statsIndicator = page.locator('main').locator('text=/Views|Applicants|Listings|Properties|Active/i').locator('visible=true').first();
    await expect(statsIndicator).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('2. Owner can view and manage property listings tab', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'ownerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/owner-dashboard?tab=listings', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/owner-dashboard\?tab=listings/);

    // Verify visible listings tab heading or property listing cards inside main
    const listingsHeading = page.locator('main').locator('text=/Listings|Properties|Koramangala|Add Space|Add Room|Manage/i').locator('visible=true').first();
    await expect(listingsHeading).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('3. Owner can view incoming applicants and connection inquiries tab', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'ownerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/owner-dashboard?tab=applicants', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/owner-dashboard\?tab=applicants/);

    // Verify visible applicants tab heading or inquiry list inside main
    const applicantsHeading = page.locator('main').locator('text=/Applicants|Inquiries|Pending Inquiries|Requests|No pending roommate requests/i').locator('visible=true').first();
    await expect(applicantsHeading).toBeVisible({ timeout: 10000 });

    await context.close();
  });

});
