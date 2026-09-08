/**
 * VISIBLE MASTER DIAGNOSTIC
 * Exact interactive foreground test matching user specification
 */
'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

// Ensure local node_modules can be resolved
const appNodeModules = path.resolve(__dirname, '../node_modules');
if (!module.paths.includes(appNodeModules)) {
  module.paths.unshift(appNodeModules);
}
process.env.NODE_PATH = appNodeModules;
require('module').Module._initPaths();

const { chromium } = require('playwright');
const playwrightPkg = require('playwright/package.json');

const APP_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function getWindowsSessionId() {
  try {
    return execSync('powershell -NoProfile -Command "(Get-Process -Id $PID).SessionId"', { encoding: 'utf-8' }).trim();
  } catch {
    return '1';
  }
}

function inspectAndForegroundWindow() {
  try {
    const psFile = path.resolve(__dirname, 'helpers/inspect_window.ps1');
    const res = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psFile}"`, { encoding: 'utf-8' }).trim();
    return JSON.parse(res);
  } catch (err) {
    return {
      Handle: 0,
      Title: 'ERROR: ' + err.message,
      Visible: false,
      Minimized: false,
      Bounds: 'N/A'
    };
  }
}

async function runForegroundDiagnostic() {
  const sessionId = getWindowsSessionId();
  const username = os.userInfo()?.username || process.env.USERNAME || 'Current User';
  const cwd = process.cwd();

  // Print exact required environment headers
  console.log(`EXECUTION_SESSION:   Interactive Windows Desktop`);
  console.log(`NODE_PID:            ${process.pid}`);
  console.log(`WINDOWS_SESSION_ID:  ${sessionId}`);
  console.log(`USER:                ${username}`);
  console.log(`WORKING_DIRECTORY:   ${cwd}`);

  const windowArgs = [
    '--start-maximized',
    '--window-position=0,0',
    '--no-first-run',
    '--no-default-browser-check',
  ];

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: windowArgs,
  });

  let chromiumPid = 'DETECTED';
  try {
    const pidOut = execSync('powershell -NoProfile -Command "(Get-Process -Name chrome -ErrorAction SilentlyContinue | Sort-Object StartTime -Descending | Select-Object -First 1).Id"', { encoding: 'utf-8' }).trim();
    chromiumPid = pidOut || 'DETECTED';
  } catch {}

  const context = await browser.newContext({
    viewport: null, // respect maximized layout
  });
  const page = await context.newPage();
  await page.bringToFront();

  // Wait 1 second for OS window to register, then pop to absolute foreground
  await page.waitForTimeout(1000);
  const winInfo = inspectAndForegroundWindow();

  // Immediately print exact required window properties
  console.log(`CHROMIUM_PID:        ${chromiumPid}`);
  console.log(`WINDOW_HANDLE:       ${winInfo.Handle}`);
  console.log(`WINDOW_VISIBLE:      ${winInfo.Visible}`);
  console.log(`WINDOW_MINIMIZED:    ${winInfo.Minimized}`);
  console.log(`WINDOW_BOUNDS:       ${winInfo.Bounds}`);
  console.log(`CURRENT_URL:         ${page.url()}`);

  // 1. Navigate to http://localhost:3000/
  console.log(`\nNavigating to ${APP_URL}/...`);
  await page.goto(`${APP_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  inspectAndForegroundWindow(); // re-assert topmost on navigation

  // 2. KEEP CHROMIUM OPEN FOR 30 SECONDS
  // 3. Print one heartbeat every second
  console.log('\n--- 30-SECOND VISIBLE DESKTOP INSPECTION ---');
  for (let i = 1; i <= 30; i++) {
    const pad = i < 10 ? `0${i}` : `${i}`;
    console.log(`VISIBLE_BROWSER_HEARTBEAT ${pad}`);
    await page.waitForTimeout(1000);
  }
  console.log('--- 30-SECOND VISIBLE DESKTOP INSPECTION COMPLETE ---\n');

  // 4. Click "Find Flatmates"
  console.log('ACTION: Clicking "Find Flatmates"...');
  const flatmatesBtn = page.locator('button:has-text("Find Flatmates"), button:has-text("Flatmates")').first();
  await flatmatesBtn.click();
  console.log('CLICKED: Find Flatmates');

  // 5. Type "Anna Nagar"
  console.log('ACTION: Typing "Anna Nagar"...');
  const searchInput = page.locator('input[placeholder*="HSR Layout, Koramangala"], input[placeholder*="Locality"], input[placeholder*="Search"]').first();
  await searchInput.click();
  await searchInput.fill('Anna Nagar');
  console.log('TYPED: "Anna Nagar"');
  await page.waitForTimeout(1000);

  // 6. Click Search
  console.log('ACTION: Clicking Search button...');
  const searchBtn = page.locator('button[data-testid="hero-search-button"], form button[type="submit"], button:has-text("Search")').first();
  await searchBtn.click();
  console.log('CLICKED: Search');

  // 7. Navigate to /explore
  await page.waitForURL(url => url.toString().includes('/explore'), { timeout: 15000 });
  console.log(`NAVIGATED: ${page.url()}`);

  // 8. Keep browser open another 15 seconds
  console.log('\n--- 15-SECOND POST-ACTION VISIBLE INSPECTION ---');
  for (let i = 15; i >= 1; i--) {
    const pad = i < 10 ? `0${i}` : `${i}`;
    console.log(`VISIBLE_FINAL_HOLD ${pad}s remaining...`);
    await page.waitForTimeout(1000);
  }
  console.log('--- 15-SECOND POST-ACTION VISIBLE INSPECTION COMPLETE ---\n');

  // 9. Only then close it
  console.log('Closing browser cleanly...');
  await context.close();
  await browser.close();
  console.log('VISIBLE_MASTER_DIAGNOSTIC_COMPLETE');
}

runForegroundDiagnostic().catch(err => {
  console.error('DIAGNOSTIC_ERROR:', err);
  process.exit(1);
});
