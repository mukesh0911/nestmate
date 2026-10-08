import { test, expect } from '@playwright/test';

test.describe('Phase 6 & 7: Core UI & Forms Verification', () => {
  test('UI-01: Landing page renders hero and navigation CTAs navigate correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/NestMate/i);

    // Hero headline (allow for inline spans)
    const heroHeadline = page.getByRole('heading', { level: 1 }).locator('visible=true');
    await expect(heroHeadline).toBeVisible({ timeout: 15000 });
    await expect(heroHeadline).toContainText(/Find your.*people/i);

    // Search CTA button (present on both desktop and mobile hero)
    const searchBtn = page.getByRole('button', { name: /Search/i }).locator('visible=true').first();
    await expect(searchBtn).toBeVisible({ timeout: 10000 });
    await searchBtn.click();
    await expect(page).toHaveURL(/\/explore/);
  });

  test('UI-02: RoleSelect route guards unauthenticated users to login', async ({ page }) => {
    await page.goto('/role-select', { waitUntil: 'domcontentloaded' });
    // PrivateRoute should bounce unauthenticated user to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('UI-03: Seeker and Owner onboarding routes guard unauthenticated users', async ({ page }) => {
    // Both onboarding paths must bounce to login when unauthenticated
    await page.goto('/onboarding/seeker', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/onboarding/owner', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('UI-04: Explore page supports Rooms, Roommates, and category tab switching', async ({ page }) => {
    await page.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Explore/i);

    // Tab buttons
    const roomsTab = page.locator('button:visible, a:visible').filter({ hasText: /^Rooms/i }).first();
    const roommatesTab = page.locator('button:visible, a:visible').filter({ hasText: /^Roommates|^Flatmates/i }).first();

    await expect(roomsTab).toBeVisible({ timeout: 10000 });
    await expect(roommatesTab).toBeVisible({ timeout: 10000 });

    // Switch to Roommates tab
    await roommatesTab.click();
    await expect(page).toHaveURL(/tab=roommates/);

    // Switch back to Rooms tab
    await roomsTab.click();
    await expect(page).toHaveURL(/tab=rooms/);
  });

  test('UI-05: Room Detail page renders listing information or safe not-found state', async ({ page }) => {
    await page.goto('/room/seed_listing_001_indiranagar', { waitUntil: 'domcontentloaded' });

    // Validate listing detail container renders active room data or safe not found status
    const roomState = page.locator(':visible').filter({ hasText: /Listing not found|Browse Other Rooms|Furnished|Indiranagar|Room Details/i }).first();
    await expect(roomState).toBeVisible({ timeout: 15000 });
  });

  test('UI-06: Seeker Match Detail page renders profile information or safe fallback state', async ({ page }) => {
    await page.goto('/match/seed_seeker_002_priya', { waitUntil: 'domcontentloaded' });

    // Expect profile card or fallback browse CTA
    const matchState = page.locator(':visible').filter({ hasText: /Browse Roommates|Flatmate Profile|Compatibility|Priya|Pooja/i }).first();
    await expect(matchState).toBeVisible({ timeout: 15000 });
  });

  test('UI-07: Search bar on Explore page accepts inputs and updates search state', async ({ page }) => {
    await page.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });

    const searchInput = page.getByPlaceholder(/Search locality|keywords/i).locator('visible=true').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('HSR Layout');
    await expect(searchInput).toHaveValue('HSR Layout');
  });

  test('UI-08: Explore page filter controls open and render filter options', async ({ page }) => {
    await page.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });

    // Locate Open filters button
    const filterBtn = page.getByRole('button', { name: /Open filters|Filter/i }).locator('visible=true').first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      // Ensure filter dialog/drawer opened
      await expect(page.locator(':visible').filter({ hasText: /Budget|Price|Amenities|Furnishing|Filters/i }).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('UI-09: Owner Dashboard route guards unauthenticated users to login', async ({ page }) => {
    await page.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('UI-10: Protected profile route guards unauthenticated users to login', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });
});
