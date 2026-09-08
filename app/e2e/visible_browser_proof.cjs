/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  VISIBLE PLAYWRIGHT BROWSER LAUNCH PROOF
 *  Demonstrates physical browser window opening on the user's desktop,
 *  navigating to localhost:3000, and performing visible UI actions in slow motion.
 * ═══════════════════════════════════════════════════════════════════════════
 */
'use strict';

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const APP_URL = 'http://localhost:3000';
const PROOF_SCREENSHOT = path.join(__dirname, 'reports/screenshots/proof_live_interaction.png');

// Ensure screenshots dir exists
const shotsDir = path.dirname(PROOF_SCREENSHOT);
if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

function bringWindowToForeground() {
  try {
    // Windows PowerShell command to find and focus Chrome/Chromium window
    const psCommand = `
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
        [Win32]::ShowWindow($p.MainWindowHandle, 9) # SW_RESTORE
        [Win32]::SetForegroundWindow($p.MainWindowHandle)
      }
    `;
    execSync(`powershell -NoProfile -Command "${psCommand.replace(/\n/g, ' ')}"`, { stdio: 'ignore' });
  } catch {
    // Non-fatal if PowerShell focus fails
  }
}

async function runProof() {
  console.log('===============================================================');
  console.log('🔍 STEP 1: VERIFYING PLAYWRIGHT & CHROMIUM ENVIRONMENT');
  console.log('===============================================================');

  const execPath = chromium.executablePath();
  console.log('Playwright Chromium Path:', execPath);
  console.log('Executable exists on disk:', fs.existsSync(execPath));

  console.log('\n===============================================================');
  console.log('🚀 STEP 2: LAUNCHING VISIBLE CHROMIUM (headless: false)');
  console.log('===============================================================');

  let browser;
  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 600, // 600ms per action so every interaction is clearly visible
      args: [
        '--window-size=1280,850',
        '--window-position=80,60',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    console.log('✅ Chromium process spawned successfully with headless: false');

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();
    bringWindowToForeground();

    console.log('\n===============================================================');
    console.log('🌐 STEP 3: NAVIGATING TO APPLICATION');
    console.log('===============================================================');
    console.log(`Navigating to ${APP_URL} ...`);
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    const title = await page.title();
    console.log(`✅ Page loaded! Current Title: "${title}"`);
    console.log(`✅ Current URL: ${page.url()}`);
    bringWindowToForeground();

    console.log('\n===============================================================');
    console.log('🖱️ STEP 4: PERFORMING VISIBLE ACTIONS ON LANDING PAGE');
    console.log('===============================================================');

    // 1. Smooth scroll down
    console.log('Action: Scrolling down to show features...');
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);
    console.log('Action: Scrolling back up to hero...');
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(800);

    // 2. Select City on Hero
    console.log('Action: Selecting "Chennai" in the hero search dropdown...');
    const citySelect = page.locator('select').first();
    if (await citySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await citySelect.selectOption('Chennai');
      await page.waitForTimeout(800);
      console.log('✅ City selected: Chennai');
    }

    // 3. Click Search
    console.log('Action: Clicking Search button...');
    const searchBtn = page.getByRole('button', { name: /Search/i }).first();
    if (await searchBtn.isVisible().catch(() => false)) {
      await searchBtn.click();
      await page.waitForTimeout(1500);
      console.log(`✅ Navigated! Current URL: ${page.url()}`);
    }

    console.log('\n===============================================================');
    console.log('📋 STEP 5: VISIBLE INTERACTION ON EXPLORE MARKETPLACE');
    console.log('===============================================================');

    // 4. Toggle Roommates tab
    console.log('Action: Switching to "Flatmates" tab...');
    const flatmatesTab = page.getByRole('button', { name: /Flatmates|Roommates|Seekers/i }).first();
    if (await flatmatesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await flatmatesTab.click();
      await page.waitForTimeout(1200);
      console.log(`✅ Tab switched! Current URL: ${page.url()}`);
    }

    // 5. Navigate to Login Page
    console.log('\n===============================================================');
    console.log('🔑 STEP 6: VISIBLE FORM INTERACTION ON /LOGIN');
    console.log('===============================================================');
    console.log('Action: Navigating to /login ...');
    await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    console.log('Action: Clicking "Continue with Email"...');
    const emailModeBtn = page.locator('button:has-text("Continue with Email")').first();
    if (await emailModeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailModeBtn.click();
      await page.waitForTimeout(800);
    }

    console.log('Action: Typing email address into input field...');
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.click();
    await emailInput.pressSequentially('test.proof@nestmate.com', { delay: 60 });
    await page.waitForTimeout(500);
    console.log('✅ Typed email: test.proof@nestmate.com');

    console.log('Action: Typing password into password field...');
    const pwInput = page.locator('input[id="pw-input"], input[type="password"]').first();
    await pwInput.click();
    await pwInput.pressSequentially('SecureProof2026!', { delay: 60 });
    await page.waitForTimeout(500);
    console.log('✅ Typed password: [filled]');

    // Toggle show password
    console.log('Action: Toggling password visibility eye button...');
    const showPwBtn = page.locator('button[aria-label*="password" i]').first();
    if (await showPwBtn.isVisible().catch(() => false)) {
      await showPwBtn.click();
      await page.waitForTimeout(800);
      await showPwBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Password eye toggle clicked');
    }

    // Capture screenshot of the interaction
    await page.screenshot({ path: PROOF_SCREENSHOT, fullPage: true });
    console.log(`\n📸 Screenshot saved to: ${PROOF_SCREENSHOT}`);

    console.log('\n===============================================================');
    console.log('👀 STEP 7: HOLDING BROWSER VISIBLE FOR DIRECT OBSERVATION');
    console.log('===============================================================');
    for (let sec = 12; sec > 0; sec--) {
      console.log(`Browser is physically open on screen. Time remaining: ${sec}s...`);
      await page.waitForTimeout(1000);
    }

    console.log('\n✅ PROOF COMPLETE: Visible Playwright browser execution verified!');

  } catch (err) {
    console.error('❌ PROOF FAILED:', err);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed cleanly.');
    }
  }
}

runProof();
