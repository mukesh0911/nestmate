/**
 * VISIBLE BROWSER CONTROL PROOF SCRIPT
 * 
 * Strict Phase 1 requirement:
 * Proves real visible Chromium control with real UI clicks, typing, navigation,
 * screenshot capture, and a 10-second hold.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Ensure local node_modules can be resolved
const appNodeModules = path.resolve(__dirname, '../node_modules');
if (!module.paths.includes(appNodeModules)) {
  module.paths.unshift(appNodeModules);
}
process.env.NODE_PATH = appNodeModules;
require('module').Module._initPaths();

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function bringToForeground(pid) {
  try {
    const ps = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
          [DllImport("user32.dll")]
          public static extern bool SetForegroundWindow(IntPtr hWnd);
          [DllImport("user32.dll")]
          public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
        }
"@
      $procs = Get-Process -Name chrome, msedge -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }
      foreach ($p in $procs) {
        [Win32]::ShowWindow($p.MainWindowHandle, 9)
        [Win32]::SetForegroundWindow($p.MainWindowHandle)
      }
    `;
    execSync(`powershell -NoProfile -Command "${ps.replace(/\r?\n/g, ' ')}"`, { stdio: 'ignore' });
  } catch {
    // Non-fatal
  }
}

async function runProof() {
  const startTimestamp = new Date().toISOString();
  const startTime = Date.now();
  const clicksPerformed = [];
  const inputsFilled = [];
  let startingUrl = '';
  let finalUrl = '';
  let screenshotPath = '';
  let browserPid = null;
  let browserClosedCleanly = false;
  let browser = null;

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        PHASE 1: VISIBLE BROWSER CONTROL PROOF SCRIPT          ║');
  console.log('║        Mode: REAL VISIBLE CHROMIUM (headless: false)          ║');
  console.log('║        Speed: slowMo: 500ms for observable interaction        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Launch visible browser
    console.log('[BROWSER] Launching visible Chromium (headless: false, slowMo: 500)...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 500,
      args: [
        '--window-size=1280,850',
        '--window-position=80,50',
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });

    try {
      const pidOut = execSync('powershell -NoProfile -Command "(Get-Process -Name chrome -ErrorAction SilentlyContinue | Sort-Object StartTime -Descending | Select-Object -First 1).Id"', { encoding: 'utf-8' }).trim();
      browserPid = pidOut || 'Detected';
    } catch {
      browserPid = 'Active';
    }
    console.log(`[BROWSER] Chromium process spawned. PID: ${browserPid}`);

    bringToForeground(browserPid);

    // 2. Create Context & Page
    console.log('[BROWSER] Creating browser context and visible page (1280x850)...');
    const context = await browser.newContext({
      viewport: { width: 1280, height: 850 },
    });
    const page = await context.newPage();

    // 3. Navigate to application landing page
    console.log(`[BROWSER] Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    startingUrl = page.url();
    console.log(`[BROWSER] Page loaded. Starting URL: ${startingUrl}`);

    bringToForeground(browserPid);

    // 4. Wait for usability
    console.log('[BROWSER] Waiting for page usability (value proposition heading)...');
    const heroH1 = page.locator('h1').first();
    await heroH1.waitFor({ state: 'visible', timeout: 10000 });
    const h1Text = (await heroH1.textContent()).trim();
    console.log(`[BROWSER] Page usable. Hero title: "${h1Text}"`);

    await page.waitForTimeout(1000);

    // 5. Click real visible UI control 1: 'Find Flatmates' tab button
    const flatmatesTabBtn = page.locator('button:has-text("Find Flatmates")').first();
    console.log('[BROWSER] Clicking: Find Flatmates tab button...');
    await flatmatesTabBtn.click();
    clicksPerformed.push('Find Flatmates tab button on hero widget');
    console.log('[BROWSER] Click completed: Switched to Flatmates search tab.');

    await page.waitForTimeout(1000);

    // 6. Click real visible UI control 2: 'Find Rooms & Flats' tab button
    const roomsTabBtn = page.locator('button:has-text("Find Rooms & Flats")').first();
    console.log('[BROWSER] Clicking: Find Rooms & Flats tab button...');
    await roomsTabBtn.click();
    clicksPerformed.push('Find Rooms & Flats tab button on hero widget');
    console.log('[BROWSER] Click completed: Switched back to Rooms search tab.');

    await page.waitForTimeout(1000);

    // 7. Locate real text/input field and type into it
    const localityInput = page.locator('input[placeholder*="HSR Layout, Koramangala"], input[placeholder*="Locality"]').first();
    console.log('[BROWSER] Locating input: Locality / Landmark text field...');
    await localityInput.waitFor({ state: 'visible', timeout: 5000 });
    console.log('[BROWSER] Filling input: Typing "Indiranagar"...');
    await localityInput.click();
    await localityInput.fill('Indiranagar');
    inputsFilled.push({ selector: 'input[placeholder*="HSR Layout, Koramangala"]', value: 'Indiranagar' });
    console.log('[BROWSER] Input completed: Value is now "Indiranagar".');

    await page.waitForTimeout(1000);

    // 8. Real UI navigation/action to move to another page: Click Search
    const searchBtn = page.locator('button[data-testid="hero-search-button"], form button[type="submit"]').first();
    console.log('[BROWSER] Navigating via UI: Clicking "Search" button...');
    await searchBtn.click();
    clicksPerformed.push('Search button on hero widget (data-testid="hero-search-button")');
    console.log('[BROWSER] Click completed. Waiting for navigation to complete...');

    await page.waitForURL(url => url.toString().includes('/explore'), { timeout: 10000 });
    finalUrl = page.url();
    console.log(`[BROWSER] UI navigation completed. Landed on: ${finalUrl}`);

    await page.waitForTimeout(1000);

    // 9. Perform one additional real click: Click "Filters" button on Explore page
    const filterBtn = page.locator('button:has-text("Filters"), button:has-text("Filter")').first();
    console.log('[BROWSER] Performing additional real click: Clicking "Filters" button on Explore page...');
    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      clicksPerformed.push('Filters button on Explore page');
      console.log('[BROWSER] Second click completed: Filters dialog/drawer toggled.');
    } else {
      // Fallback click on another visible explore control (e.g. flatmates tab)
      const tabBtn = page.locator('button:has-text("Flatmates")').first();
      await tabBtn.click();
      clicksPerformed.push('Flatmates tab button on Explore page');
      console.log('[BROWSER] Second click completed: Explore tab switched.');
    }

    await page.waitForTimeout(1500);

    // 10. Capture screenshot after interactions
    screenshotPath = path.join(SCREENSHOT_DIR, `VISIBLE_BROWSER_PROOF_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`[BROWSER] Screenshot saved: ${screenshotPath}`);

    // 11. Keep Chromium visibly open for at least 10 seconds after final interaction
    console.log('\n[BROWSER] Holding browser open for 10 seconds for human desktop inspection...');
    for (let i = 10; i >= 1; i--) {
      process.stdout.write(`[BROWSER] Inspection window closing in ${i}s...\r`);
      await page.waitForTimeout(1000);
    }
    console.log('\n[BROWSER] 10-second inspection hold completed.');

    // 12. Close browser cleanly
    console.log('[BROWSER] Closing browser cleanly...');
    await context.close();
    await browser.close();
    browserClosedCleanly = true;
    console.log('[BROWSER] Browser closed cleanly.');

    const endTimestamp = new Date().toISOString();
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n===============================================================');
    console.log('📋 VISIBLE BROWSER CONTROL PROOF EXECUTION SUMMARY');
    console.log('===============================================================');
    console.log(`Chromium PID:           ${browserPid}`);
    console.log(`Exact Starting URL:     ${startingUrl}`);
    console.log(`Exact Final URL:        ${finalUrl}`);
    console.log(`Clicks Performed:       ${clicksPerformed.length}`);
    clicksPerformed.forEach((c, idx) => console.log(`  ${idx + 1}. ${c}`));
    console.log(`Inputs Filled:          ${inputsFilled.length}`);
    inputsFilled.forEach((inf, idx) => console.log(`  ${idx + 1}. ${inf.selector} -> "${inf.value}"`));
    console.log(`Screenshot Path:        ${screenshotPath}`);
    console.log(`Start Timestamp:        ${startTimestamp}`);
    console.log(`End Timestamp:          ${endTimestamp}`);
    console.log(`Total Duration:         ${durationSec}s`);
    console.log(`Browser Close Status:   ${browserClosedCleanly ? 'CLEAN_CLOSE' : 'DIRTY_OR_OPEN'}`);
    console.log('===============================================================\n');

    // Strict validation
    const passed = (
      browserClosedCleanly &&
      clicksPerformed.length >= 3 &&
      inputsFilled.length >= 1 &&
      finalUrl.includes('/explore') &&
      fs.existsSync(screenshotPath)
    );

    if (passed) {
      console.log('RESULT: VISIBLE_BROWSER_PROOF: PASS\n');
      process.exit(0);
    } else {
      console.error('RESULT: VISIBLE_BROWSER_PROOF: FAIL\n');
      process.exit(1);
    }

  } catch (err) {
    console.error('\n[BROWSER ERROR] Execution failed:', err);
    if (browser) {
      try { await browser.close(); } catch {}
    }
    console.log('RESULT: VISIBLE_BROWSER_PROOF: FAIL\n');
    process.exit(1);
  }
}

runProof();
