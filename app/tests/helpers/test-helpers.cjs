/**
 * NestMate E2E Test Helpers
 * Enhanced from existing playwright-helpers.cjs with better login flow,
 * storage state management, and robust selectors.
 */
'use strict';

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const CONFIG = require('../config/playwright.config.cjs');

const APP_URL = CONFIG.APP_URL;
const TIMEOUT = CONFIG.TIMEOUT;

/**
 * Launch a fresh browser context for a given user.
 * Each context is completely isolated (independent session, cookies, storage).
 */
async function createFreshContext(browser, label = 'anon') {
  const context = await browser.newContext({
    viewport: CONFIG.BROWSER.viewport,
    // No storageState — ensures clean session per context
  });

  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ time: new Date().toISOString(), text: msg.text(), url: page.url() });
    }
  });
  page.on('pageerror', err => {
    pageErrors.push({ time: new Date().toISOString(), text: err.message, url: page.url() });
  });
  page.on('requestfailed', req => {
    const url = req.url();
    // Ignore known non-critical failures (ORB image blocks, Firestore long-poll aborts)
    const isNonCritical = url.includes('unsplash.com') || 
                          url.includes('lh3.googleusercontent.com') ||
                          (url.includes('firestore.googleapis.com') && req.failure()?.errorText === 'net::ERR_ABORTED');
    if (!isNonCritical) {
      failedRequests.push({ url, failure: req.failure()?.errorText });
    }
  });

  return { context, page, label, consoleErrors, pageErrors, failedRequests, close: () => context.close() };
}

/**
 * Navigate to app path and wait for any loading spinner to clear.
 */
async function gotoApp(page, targetPath = '/') {
  await page.goto(`${APP_URL}${targetPath}`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT.navigation });
  // Wait for loading spinner to disappear
  await Promise.all([
    page.locator('[role="status"]').first().waitFor({ state: 'detached', timeout: TIMEOUT.loadingSpinner }).catch(() => {}),
    page.locator('[aria-label="Loading page"]').waitFor({ state: 'detached', timeout: TIMEOUT.loadingSpinner }).catch(() => {}),
  ]);
  await page.waitForTimeout(400);
}

/**
 * Perform email/password login on the /login page.
 * Uses a FRESH context call — does not attempt to logout first.
 * For multi-user scenarios, use createFreshContext() for each user.
 */
async function emailLogin(page, email, password) {
  await gotoApp(page, '/login');
  await page.waitForTimeout(500);

  // If already redirected away (already logged in), we need to navigate back
  if (!page.url().includes('/login')) {
    // Already logged in — return current state
    return { success: true, url: page.url(), alreadyLoggedIn: true };
  }

  // Click "Continue with Email" if the auth mode selector is shown
  const emailModeBtn = page.locator('button:has-text("Continue with Email"), button:has-text("Email")').first();
  if (await emailModeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailModeBtn.click();
    await page.waitForTimeout(400);
  }

  // Fill email
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: TIMEOUT.action });
  await emailInput.fill(email);

  // Fill password
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: TIMEOUT.action });
  await passwordInput.fill(password);

  // Submit
  const submitBtn = page.locator(
    'button[type="submit"], button:has-text("Sign In"), button:has-text("Continue"), button:has-text("Log In")'
  ).first();
  await submitBtn.waitFor({ state: 'visible', timeout: TIMEOUT.action });
  await submitBtn.click();

  // Wait for redirect away from /login
  try {
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: TIMEOUT.navigation });
    await page.waitForTimeout(800);
    return { success: true, url: page.url() };
  } catch {
    const error = await page.locator('[role="alert"], .text-red-500, [class*="destructive"], [class*="error"]')
      .first().textContent({ timeout: 3000 }).catch(() => '');
    return { success: false, url: page.url(), error };
  }
}

/**
 * Log out via the profile menu UI.
 */
async function logout(page) {
  try {
    // Try profile dropdown (desktop)
    const profileDropdown = page.locator('.profile-dropdown-container button').first();
    if (await profileDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await profileDropdown.click();
      await page.waitForTimeout(300);
      const logoutBtn = page.locator('button:has-text("Log out"), button:has-text("Sign Out"), button:has-text("Logout")').first();
      if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForURL(
          url => url.toString().includes('/login') || url.toString() === `${APP_URL}/`,
          { timeout: 10000 }
        ).catch(() => {});
        return true;
      }
    }

    // Try mobile menu
    const mobileMenu = page.locator('button[aria-label*="menu" i]').first();
    if (await mobileMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mobileMenu.click();
      await page.waitForTimeout(300);
      const mobileLogout = page.locator('button:has-text("Log out"), button:has-text("Sign Out")').first();
      if (await mobileLogout.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mobileLogout.click();
        await page.waitForURL(
          url => url.toString().includes('/login') || url.toString() === `${APP_URL}/`,
          { timeout: 10000 }
        ).catch(() => {});
        return true;
      }
    }

    // Fallback: navigate directly to landing (forces auth state reset)
    await page.goto(`${APP_URL}/`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    return true;
  } catch (err) {
    console.warn(`[logout] Error: ${err.message}`);
    return false;
  }
}

/**
 * Capture a screenshot on test failure with consistent naming.
 */
async function captureFailure(page, testId, description = '') {
  try {
    const name = `FAIL-${testId.replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}.png`;
    const fullPath = path.join(CONFIG.REPORTS.screenshots, name);
    fs.mkdirSync(CONFIG.REPORTS.screenshots, { recursive: true });
    await page.screenshot({ path: fullPath, fullPage: true });
    return fullPath;
  } catch {
    return null;
  }
}

/**
 * Capture a pass screenshot.
 */
async function capturePass(page, testId, description = '') {
  try {
    const name = `PASS-${testId.replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}.png`;
    const fullPath = path.join(CONFIG.REPORTS.screenshots, name);
    fs.mkdirSync(CONFIG.REPORTS.screenshots, { recursive: true });
    await page.screenshot({ path: fullPath, fullPage: true });
    return fullPath;
  } catch {
    return null;
  }
}

/**
 * Wait for the page to reach a stable loaded state (no spinner, no skeleton).
 */
async function waitForStableLoad(page, timeout = TIMEOUT.page) {
  await page.waitForLoadState('domcontentloaded', { timeout });
  // Wait for loading indicators to disappear
  await Promise.all([
    page.locator('[aria-label="Loading page"]').waitFor({ state: 'detached', timeout: TIMEOUT.loadingSpinner }).catch(() => {}),
    page.locator('[role="status"]').first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => {}),
    page.locator('[class*="skeleton"]').first().waitFor({ state: 'detached', timeout: 5000 }).catch(() => {}),
  ]);
  await page.waitForTimeout(400);
}

/**
 * Check if user is on the correct dashboard for their role.
 */
async function verifyAuthenticatedOn(page, expectedPath) {
  const currentUrl = page.url();
  return currentUrl.includes(expectedPath);
}

/**
 * Result recorder for structured test results.
 */
function makeResultRecorder() {
  const results = [];

  function record(phase, scenario, test, status, details = '', screenshotPath = null) {
    const normalized = 
      status === true || status === 'PASS' ? 'PASS' :
      status === false || status === 'FAIL' ? 'FAIL' :
      status === 'BLOCKED' ? 'BLOCKED' :
      status === 'SKIP' ? 'SKIP' : 
      String(status).toUpperCase();

    const entry = {
      phase, scenario, test,
      status: normalized,
      details,
      screenshot: screenshotPath,
      timestamp: new Date().toISOString(),
    };
    results.push(entry);

    const icon = normalized === 'PASS' ? '✅' :
                 normalized === 'FAIL' ? '❌' :
                 normalized === 'BLOCKED' ? '🔒' : '⏭️';
    console.log(`${icon} [${phase}] ${scenario}: ${test}`);
    if (details) console.log(`   └─ ${details}`);
    return entry;
  }

  function summary() {
    const pass = results.filter(r => r.status === 'PASS').length;
    const fail = results.filter(r => r.status === 'FAIL').length;
    const blocked = results.filter(r => r.status === 'BLOCKED').length;
    const skip = results.filter(r => r.status === 'SKIP').length;
    return { total: results.length, pass, fail, blocked, skip };
  }

  return { results, record, summary };
}

/**
 * Wait for a tab/navigation to become active.
 */
async function clickAndWaitForNav(page, selector, expectedUrlFragment, timeout = TIMEOUT.navigation) {
  await page.locator(selector).first().click();
  await page.waitForURL(url => url.toString().includes(expectedUrlFragment), { timeout }).catch(() => {});
  await waitForStableLoad(page);
}

/**
 * Assert text is visible on the page.
 */
async function assertTextVisible(page, text, timeout = TIMEOUT.assertion) {
  const loc = page.locator(`text=${text}`).first();
  await loc.waitFor({ state: 'visible', timeout });
  return await loc.isVisible();
}

/**
 * Check for console errors excluding known benign ones.
 */
function hasCriticalConsoleErrors(consoleErrors) {
  return consoleErrors.some(e => {
    const text = e.text || '';
    // Exclude known benign errors
    if (text.includes('ERR_BLOCKED_BY_ORB')) return false;
    if (text.includes('ERR_ABORTED')) return false;
    if (text.includes('firestore.googleapis.com')) return false;
    if (text.includes('status of 400')) return false; // Firebase SMS 400 on dev
    return true;
  });
}

module.exports = {
  APP_URL,
  TIMEOUT,
  CONFIG,
  createFreshContext,
  gotoApp,
  emailLogin,
  logout,
  captureFailure,
  capturePass,
  waitForStableLoad,
  verifyAuthenticatedOn,
  makeResultRecorder,
  clickAndWaitForNav,
  assertTextVisible,
  hasCriticalConsoleErrors,
};
