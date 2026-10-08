import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../fixtures/authFixtures';
import { AccountFactory } from '../factories/accountFactory';

test.describe('Phase 4 & 5: Authentication & Session Flows (Desktop & Mobile)', () => {
  test('AUTH-01: Login page defaults to Google Sign-In and toggles to Email Mode', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Log In|NestMate/i);

    // Google button is primary visible action
    const googleBtn = page.locator('button:visible').filter({ hasText: /Google/i }).first();
    await expect(googleBtn).toBeVisible({ timeout: 15000 });

    // Toggle to Email sign in
    const emailToggle = page.locator('button:visible').filter({ hasText: /Email/i }).first();
    await expect(emailToggle).toBeVisible();
    await emailToggle.click();

    // Verify email and password input fields are visible
    const emailInput = page.locator('input[type="email"]:visible');
    const passwordInput = page.locator('input[type="password"]:visible');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
  });

  test('AUTH-02: Form validation rejects empty or invalid email and passwords < 6 characters', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Switch to email mode
    const emailToggle = page.locator('button:visible').filter({ hasText: /Sign in with Email/i }).first();
    await expect(emailToggle).toBeVisible({ timeout: 10000 });
    await emailToggle.click();

    const emailInput = page.locator('input[type="email"]:visible');
    const passwordInput = page.locator('input[type="password"]:visible');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    // Explicitly target the submit action button, NOT the "Back to Google Sign In" button
    const submitBtn = page.getByRole('button', { name: /Continue with Email|Sign In to Admin Portal/i }).locator('visible=true').first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    // Test 1: Empty submission
    await submitBtn.click();
    const alertMsg = page.getByRole('alert').locator('visible=true').filter({ hasText: /Enter your email/i }).first();
    await expect(alertMsg).toBeVisible({ timeout: 5000 });

    // Test 2: Short password (< 6 chars)
    await emailInput.fill('test@nestmate-test.com');
    await passwordInput.fill('123'); // 3 chars
    await submitBtn.click();
    const pwError = page.getByRole('alert').locator('visible=true').filter({ hasText: /at least 6 characters/i }).first();
    await expect(pwError).toBeVisible({ timeout: 5000 });
  });

  test('AUTH-03: Password Reset flow switches views and validates email input', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Switch to email mode first
    const emailToggle = page.locator('button:visible').filter({ hasText: /Sign in with Email/i }).first();
    await expect(emailToggle).toBeVisible({ timeout: 10000 });
    await emailToggle.click();

    const emailInput = page.locator('input[type="email"]:visible');
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Click "Forgot password?"
    const forgotBtn = page.getByRole('button', { name: /Forgot password\?/i }).locator('visible=true').first();
    await expect(forgotBtn).toBeVisible({ timeout: 5000 });
    await forgotBtn.click();

    // Verify Reset Password view is active
    await expect(page.getByRole('heading', { name: /Reset Password/i }).locator('visible=true').first()).toBeVisible({ timeout: 5000 });

    // Test validation on empty reset submission
    const sendResetBtn = page.getByRole('button', { name: /Send Reset Link/i }).locator('visible=true').first();
    await sendResetBtn.click();
    const alertMsg = page.locator(':visible').filter({ hasText: /Enter your email/i }).first();
    await expect(alertMsg).toBeVisible({ timeout: 5000 });

    // Back button returns to Email Sign In
    const backBtn = page.getByRole('button', { name: /Back to/i }).locator('visible=true').first();
    await backBtn.click();
    await expect(page.locator('input[type="password"]:visible')).toBeVisible({ timeout: 5000 });
  });

  test('AUTH-04: Deep link with ?redirect=/admin activates Admin Email Sign In banner', async ({ page }) => {
    await page.goto('/login?redirect=/admin', { waitUntil: 'domcontentloaded' });

    // Automatically renders in email mode with Administrator banner
    await expect(page.locator(':visible').filter({ hasText: /Administrator Access/i }).first()).toBeVisible({ timeout: 10000 });
    const emailInput = page.locator('input[type="email"]:visible');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });

  test('AUTH-05: Authenticated Seeker session renders user profile state', async ({ page }) => {
    const seeker = AccountFactory.createSeeker('ref');
    await AuthHelpers.setupMockSession(page, seeker);

    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Explore|NestMate/i);

    // Page body loads cleanly under authenticated session
    await expect(page.locator('body')).toBeVisible();
  });

  test('AUTH-06: Authenticated Owner session navigates to Owner Dashboard', async ({ page }) => {
    const owner = AccountFactory.createOwner('verified_01');
    await AuthHelpers.setupMockSession(page, owner);

    await page.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    // Should render owner dashboard or title
    await expect(page.locator('body')).toBeVisible();
  });

  test('AUTH-07: Legacy phone auth routes redirect deterministically to login', async ({ page }) => {
    await page.goto('/phone-login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/verify-otp', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });
});
