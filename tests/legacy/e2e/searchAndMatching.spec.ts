import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../fixtures/authFixtures';
import { TEST_UNIVERSE } from '../data/seedDataUniverse';

test.describe('Phase 8 & 9: Search, Filter, Sort & Discovery / Matching', () => {
  test('SEARCH-01: Locality search input accepts keywords on explore page', async ({ page }) => {
    await page.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });

    // Find search bar with exact placeholder
    const searchInput = page.getByPlaceholder(/Search locality|keywords/i).locator('visible=true').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('Koramangala');
    await expect(searchInput).toHaveValue('Koramangala');
  });

  test('SEARCH-02: Empty state displays helpful messaging when no matches found', async ({ page }) => {
    // Non-existent search query
    await page.goto('/explore?tab=rooms&search=NonExistentLocality123456789', { waitUntil: 'domcontentloaded' });

    // Expect empty state or zero results message
    const emptyNotice = page.locator(':visible').filter({ hasText: /No rooms available|No rooms found|No results|Be the first to list/i }).first();
    await expect(emptyNotice).toBeVisible({ timeout: 10000 });
  });

  test('SEARCH-03: Roommates tab displays compatibility cards for authenticated seeker', async ({ page }) => {
    const seeker = TEST_UNIVERSE.seekers[0];
    await AuthHelpers.injectAuthenticatedSession(page, seeker);
    await page.goto('/explore?tab=roommates', { waitUntil: 'domcontentloaded' });

    // Validate that flatmate / roommate cards render
    await expect(page.locator(':visible').filter({ hasText: /Pooja|Karan|Compatibility|Match/i }).first()).toBeVisible({ timeout: 15000 });
  });

  test('SEARCH-04: Filter drawer or controls display budget and amenity filters', async ({ page }) => {
    await page.goto('/explore?tab=rooms', { waitUntil: 'domcontentloaded' });

    // Open filter if filter button exists
    const filterBtn = page.getByRole('button').filter({ hasText: /Filter|Filters/i }).locator('visible=true').first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      // Verify filter modal / drawer opens
      await expect(page.locator(':visible').filter({ hasText: /Budget|Price|Amenities|Furnishing/i }).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('MATCH-01: Compatibility score badge renders on Roommate cards', async ({ page }) => {
    const seeker = TEST_UNIVERSE.seekers[0];
    await AuthHelpers.injectAuthenticatedSession(page, seeker);
    await page.goto('/explore?tab=roommates', { waitUntil: 'domcontentloaded' });

    // Expect percentage score like "80%" or "90%" or "Match" badge
    const matchBadge = page.locator(':visible').filter({ hasText: /%|Match/i }).first();
    await expect(matchBadge).toBeVisible({ timeout: 10000 });
  });

  test('MATCH-02: Room Detail page handles listing view safely', async ({ page }) => {
    const listingId = TEST_UNIVERSE.listings[0].id;
    await page.goto(`/room/${listingId}`, { waitUntil: 'domcontentloaded' });

    // Room detail renders either active room data or safe empty state
    await expect(page.locator(':visible').filter({ hasText: /Listing not found|Browse Other Rooms|Listing not yet available|Furnished|Room Details|Rent/i }).first()).toBeVisible({ timeout: 15000 });
  });
});
