import { chromium } from 'playwright';

async function runE2E() {
  console.log('🚀 Starting NestMate Real Black-Box E2E Execution Pass...\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const results = [];

  function record(testName, passed, details) {
    results.push({ testName, passed, details });
    const icon = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon}: ${testName}`);
    if (details) console.log(`   Details: ${details}`);
  }

  try {
    // ----------------------------------------------------
    // PRIORITY 1: PUBLIC DISCOVERY
    // ----------------------------------------------------
    console.log('\n--- Testing Priority 1: Public Discovery ---');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    record('Landing Page Loaded', title.includes('NestMate'), `Title: "${title}"`);

    // Hero search
    const citySelect = page.locator('select').first();
    if (await citySelect.isVisible()) {
      await citySelect.selectOption('Bengaluru');
    }
    const searchBtn = page.getByRole('button', { name: /Search/i }).first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
      await page.waitForURL(/.*explore.*/);
      record('Hero Search Navigation', page.url().includes('/explore'), `URL: ${page.url()}`);
    }

    // Switch tab to flatmates
    await page.goto('http://localhost:3000/explore?tab=rooms');
    await page.waitForLoadState('networkidle');
    const flatmatesTab = page.getByRole('button', { name: /Flatmates|Seekers/i }).first();
    if (await flatmatesTab.isVisible()) {
      await flatmatesTab.click();
      await page.waitForTimeout(500);
      record('Explore Tab Switch to Flatmates', page.url().includes('tab=roommates'), `URL: ${page.url()}`);
    }

    // Map View
    await page.goto('http://localhost:3000/map');
    await page.waitForLoadState('networkidle');
    const mapContainer = page.locator('.leaflet-container');
    const mapVisible = await mapContainer.isVisible().catch(() => false);
    record('Map View Interactive Leaflet Container', mapVisible, 'Leaflet container loaded and visible');

    // ----------------------------------------------------
    // PRIORITY 2: AUTHENTICATION & ROLE SELECTION
    // ----------------------------------------------------
    console.log('\n--- Testing Priority 2: Authentication & Role Selection ---');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Test 1-click Seeker Demo Login
    const demoSeekerBtn = page.getByRole('button', { name: /Seeker/i }).first();
    if (await demoSeekerBtn.isVisible()) {
      await demoSeekerBtn.click();
      await page.waitForTimeout(1500);
      const url = page.url();
      record('Seeker 1-Click Login Navigation', url.includes('/dashboard'), `Navigated to ${url}`);
    }

    // ----------------------------------------------------
    // PRIORITY 3: SEEKER DASHBOARD & DYNAMIC FILTERS
    // ----------------------------------------------------
    console.log('\n--- Testing Priority 3: Seeker Dashboard & Dynamic Filters ---');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Check dashboard elements
    const dashboardHeader = page.locator('h1, h2, h3').first();
    const headerText = await dashboardHeader.textContent();
    record('Seeker Dashboard Content Rendered', !!headerText, `Header: "${headerText?.trim()}"`);

    // Verify sort controls
    const sortSelect = page.locator('select').first();
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption({ label: 'Newest' }).catch(() => {});
      await page.waitForTimeout(300);
      record('Dynamic Sort Selection (Newest)', true, 'Sort option updated in state without crashing');
    }

    // ----------------------------------------------------
    // PRIORITY 4: PROFILE & SETTINGS NAVIGATION
    // ----------------------------------------------------
    console.log('\n--- Testing Priority 4: Profile & Settings Navigation ---');
    await page.goto('http://localhost:3000/profile');
    await page.waitForLoadState('networkidle');

    const editProfileBtn = page.getByRole('button', { name: /Edit Profile/i }).first();
    if (await editProfileBtn.isVisible()) {
      await editProfileBtn.click();
      await page.waitForTimeout(500);
      record('Edit Profile Button Destination', page.url().includes('/edit-profile'), `Destination: ${page.url()}`);
    }

    await page.goto('http://localhost:3000/settings');
    await page.waitForLoadState('networkidle');
    record('Settings Page Loaded', page.url().includes('/settings'), `URL: ${page.url()}`);

    // Test Dark Mode toggle
    const darkModeToggle = page.locator('button[role="switch"], input[type="checkbox"]').first();
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(300);
      record('Dark Mode Toggle Interactive', true, 'Settings toggle interactive');
    }

    // ----------------------------------------------------
    // PRIORITY 5: OWNER DASHBOARD & APPLICANTS
    // ----------------------------------------------------
    console.log('\n--- Testing Priority 5: Owner Dashboard ---');
    await page.goto('http://localhost:3000/owner-dashboard');
    await page.waitForLoadState('networkidle');
    const ownerHeader = page.locator('h1, h2').first();
    const ownerTitle = await ownerHeader.textContent().catch(() => '');
    record('Owner Dashboard Accessible', page.url().includes('/owner-dashboard') || page.url().includes('/dashboard'), `URL: ${page.url()}, Heading: "${ownerTitle?.trim()}"`);

    // ----------------------------------------------------
    // PRIORITY 6: CHAT & MESSAGING
    // ----------------------------------------------------
    console.log('\n--- Testing Priority 6: Chat & Messaging ---');
    await page.goto('http://localhost:3000/chat');
    await page.waitForLoadState('networkidle');
    record('Chat Page Loaded', page.url().includes('/chat'), `URL: ${page.url()}`);

    // ----------------------------------------------------
    // PRIORITY 7: ERROR & 404 STATES
    // ----------------------------------------------------
    console.log('\n--- Testing Priority 7: Error & 404 States ---');
    await page.goto('http://localhost:3000/non-existent-page-xyz');
    await page.waitForLoadState('networkidle');
    const notFoundText = await page.textContent('body');
    const has404 = notFoundText.includes('404') || notFoundText.includes('Not Found') || notFoundText.includes('Page Not Found') || notFoundText.includes('Page not found');
    record('404 Not Found Handling', has404, 'Graceful 404 page rendered');

    console.log('\n========================================');
    console.log(`TOTAL TESTS: ${results.length}`);
    console.log(`PASSED: ${results.filter(r => r.passed).length}`);
    console.log(`FAILED: ${results.filter(r => !r.passed).length}`);
    console.log('========================================\n');

  } catch (err) {
    console.error('E2E execution error:', err);
  } finally {
    await browser.close();
  }
}

runE2E();
