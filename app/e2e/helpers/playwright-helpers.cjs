/**
 * Playwright E2E Helpers
 * Common browser utilities for multi-context testing.
 */
'use strict';

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const TIMEOUT = 15000;

/**
 * Launch a fresh browser context for a given user identity.
 * Each context is completely isolated (independent session).
 */
async function createUserContext(browser, label = 'anon') {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ time: Date.now(), text: msg.text() });
    }
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push({ time: Date.now(), text: err.message });
  });

  // Capture failed requests
  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  return {
    context,
    page,
    label,
    consoleErrors,
    pageErrors,
    failedRequests,
    close: () => context.close(),
  };
}

/**
 * Navigate to app and wait for it to be fully loaded.
 */
async function gotoApp(page, targetPath = '/') {
  await page.goto(`${APP_URL}${targetPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('[role="status"].min-h-screen, [aria-label="Loading page"]').first().waitFor({ state: 'detached', timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(400);
}

/**
 * Perform email login on the /login page.
 * Returns true if login succeeded (redirected to dashboard or role-select).
 */
async function emailLogin(page, email, password) {
  await gotoApp(page, '/login');
  await page.waitForTimeout(600);

  // If already logged in and redirected away, log out first to authenticate requested user
  if (!page.url().includes('/login')) {
    await logout(page);
    await gotoApp(page, '/login');
    await page.waitForTimeout(600);
  }

  // Click "Continue with Email" button if on landing mode
  const emailBtn = page.locator('button:has-text("Continue with Email")').first();
  await emailBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  if (await emailBtn.isVisible().catch(() => false)) {
    await emailBtn.click();
    await page.waitForTimeout(600);
  }

  // Fill credentials
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(email);

  const passwordInput = page.locator('input[type="password"], input[id="pw-input"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.fill(password);

  // Submit
  const submitBtn = page.locator('button:has-text("Continue"), button[type="submit"], button:has-text("Sign In")').first();
  await submitBtn.click();

  // Wait for redirect
  try {
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
    await page.waitForTimeout(1000);
    return { success: true, url: page.url() };
  } catch {
    const error = await page.locator('[class*="error"], [role="alert"], .text-red-500, [class*="destructive"]').first().textContent({ timeout: 3000 }).catch(() => '');
    return { success: false, url: page.url(), error };
  }
}

/**
 * Log out the current user via NestMate's UI.
 */
async function logout(page) {
  try {
    // 1. Desktop Profile Menu dropdown
    const profileDropdownBtn = page.locator('.profile-dropdown-container button').first();
    if (await profileDropdownBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileDropdownBtn.click();
      await page.waitForTimeout(400);

      const logoutBtn = page.locator('.profile-dropdown-container button:has-text("Log out"), .profile-dropdown-container button:has-text("Logout"), .profile-dropdown-container button:has-text("Sign Out")').first();
      if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForURL(url => url.toString().includes('/login') || url.toString() === `${APP_URL}/`, { timeout: 10000 }).catch(() => {});
        return true;
      }
    }

    // 2. Mobile Menu toggle fallback
    const mobileMenuBtn = page.locator('button[aria-label*="menu" i]').first();
    if (await mobileMenuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mobileMenuBtn.click();
      await page.waitForTimeout(400);

      const mobileLogoutBtn = page.locator('button:has-text("Log out"), button:has-text("Logout"), button:has-text("Sign Out")').first();
      if (await mobileLogoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await mobileLogoutBtn.click();
        await page.waitForURL(url => url.toString().includes('/login') || url.toString() === `${APP_URL}/`, { timeout: 10000 }).catch(() => {});
        return true;
      }
    }

    // 3. Fallback: evaluate window Firebase auth signout directly from page
    await page.evaluate(async () => {
      if (window.__firebase_auth) {
        await window.__firebase_auth.signOut();
      }
    }).catch(() => {});

    await gotoApp(page, '/login');
    return true;
  } catch (err) {
    console.warn('Logout error:', err.message);
    return false;
  }
}

/**
 * Take a screenshot and save it to the reports dir.
 */
async function screenshot(page, name) {
  const screenshotsDir = path.join(__dirname, '../reports/screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
  const p = path.join(screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: p, fullPage: true });
  return p;
}

/**
 * Record a test result.
 */
function makeResultRecorder() {
  const results = [];
  
  function record(phase, scenario, test, status, details = '', screenshotPath = null) {
    const normalizedStatus = (status === true || status === 'PASS') ? 'PASS' : (status === false || status === 'FAIL') ? 'FAIL' : status;
    const entry = {
      phase,
      scenario,
      test,
      status: normalizedStatus, // 'PASS' | 'FAIL' | 'SKIP' | 'UNVERIFIED'
      details,
      screenshot: screenshotPath,
      timestamp: new Date().toISOString(),
    };
    results.push(entry);
    const icon = normalizedStatus === 'PASS' ? '✅' : normalizedStatus === 'FAIL' ? '❌' : normalizedStatus === 'UNVERIFIED' ? '⚠️' : '⏭️';
    console.log(`${icon} [${phase}] ${scenario}: ${test}`);
    if (details) console.log(`   └─ ${details}`);
    return entry;
  }

  return { results, record };
}

module.exports = {
  APP_URL,
  TIMEOUT,
  createUserContext,
  gotoApp,
  emailLogin,
  logout,
  screenshot,
  makeResultRecorder,
};
