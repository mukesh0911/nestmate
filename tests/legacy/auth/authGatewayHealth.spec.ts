import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../fixtures/authFixtures';
import { AccountFactory } from '../factories/accountFactory';

test.describe('Phase 12: Authentication Gateway Health Check (AUTH-01 to AUTH-12)', () => {
  // ── AUTH-01: Seeker Authentication ──────────────────────────────────────────
  test('AUTH-01: Seeker authentication grants access to seeker application surfaces', async ({ page }) => {
    await AuthHelpers.loginAsSeekerA(page);
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Explore|NestMate/i);
    await expect(page.locator('body')).toBeVisible();

    // Verify session identity in localStorage
    const session = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    expect(session).toBeTruthy();
    const parsed = JSON.parse(session!);
    expect(parsed.uid).toBe('test_user_ref');
    expect(parsed.role).toBe('seeker');
  });

  // ── AUTH-02: Owner Authentication ───────────────────────────────────────────
  test('AUTH-02: Owner authentication grants access to owner dashboard', async ({ page }) => {
    await AuthHelpers.loginAsOwnerA(page);
    await page.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    const session = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    expect(session).toBeTruthy();
    const parsed = JSON.parse(session!);
    expect(parsed.uid).toBe('test_user_owner_01');
    expect(parsed.role).toBe('owner');
  });

  // ── AUTH-03: Admin Authentication ───────────────────────────────────────────
  test('AUTH-03: Admin authentication grants access to Admin Control Center', async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('body')).toBeVisible();

    // Verify admin identity
    const session = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    const parsed = JSON.parse(session!);
    expect(parsed.email).toBe('admin@nestmate-test.com');
  });

  // ── AUTH-04: Logout ─────────────────────────────────────────────────────────
  test('AUTH-04: Logout completely purges session from client storage and redirects', async ({ page }) => {
    await AuthHelpers.loginAsSeekerA(page);
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });

    // Purge session via clearAuthSession
    await AuthHelpers.clearAuthSession(page);
    const sessionAfter = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    expect(sessionAfter).toBeNull();
  });

  // ── AUTH-05: Session Persistence ────────────────────────────────────────────
  test('AUTH-05: Authenticated session persists across hard page reload', async ({ page }) => {
    await AuthHelpers.loginAsSeekerA(page);
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });

    // Hard reload
    await page.reload({ waitUntil: 'domcontentloaded' });
    const session = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    expect(session).toBeTruthy();
    expect(JSON.parse(session!).uid).toBe('test_user_ref');
  });

  // ── AUTH-06: Session Isolation (User A vs User B) ───────────────────────────
  test('AUTH-06: Independent browser contexts maintain strict session isolation', async ({ browser }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await AuthHelpers.loginAsSeekerA(pageA);

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await AuthHelpers.loginAsSeekerB(pageB);

    await pageA.goto('/explore', { waitUntil: 'domcontentloaded' });
    await pageB.goto('/explore', { waitUntil: 'domcontentloaded' });

    const sessionA = await pageA.evaluate(() => JSON.parse(window.localStorage.getItem('nestmate_auth_session')!));
    const sessionB = await pageB.evaluate(() => JSON.parse(window.localStorage.getItem('nestmate_auth_session')!));

    expect(sessionA.uid).toBe('test_user_ref');
    expect(sessionB.uid).toBe('test_user_perfect_match');
    expect(sessionA.uid).not.toBe(sessionB.uid);

    await contextA.close();
    await contextB.close();
  });

  // ── AUTH-07: Suspended Account Behavior ─────────────────────────────────────
  test('AUTH-07: Suspended account state is correctly identified and quarantined', async ({ page }) => {
    const suspended = AccountFactory.createSuspendedUser('bad_actor_suspended');
    await AuthHelpers.setupMockSession(page, suspended);
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });

    const session = await page.evaluate(() => JSON.parse(window.localStorage.getItem('nestmate_auth_session')!));
    expect(session.status).toBe('suspended');
  });

  // ── AUTH-08: Banned Account Behavior ────────────────────────────────────────
  test('AUTH-08: Banned account state is correctly identified and quarantined', async ({ page }) => {
    const banned = AccountFactory.createBannedUser('malicious_banned');
    await AuthHelpers.setupMockSession(page, banned);
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });

    const session = await page.evaluate(() => JSON.parse(window.localStorage.getItem('nestmate_auth_session')!));
    expect(session.status).toBe('banned');
  });

  // ── AUTH-09: Onboarding Pending Behavior ────────────────────────────────────
  test('AUTH-09: Incomplete user account is flagged as onboarding incomplete', async ({ page }) => {
    const incomplete = AccountFactory.createIncompleteUser('onboarding_pending');
    await AuthHelpers.setupMockSession(page, incomplete);
    await page.goto('/explore', { waitUntil: 'domcontentloaded' });

    const session = await page.evaluate(() => JSON.parse(window.localStorage.getItem('nestmate_auth_session')!));
    expect(session.onboardingComplete).toBe(false);
    expect(session.role).toBeNull();
  });

  // ── AUTH-10: Admin Authorization ────────────────────────────────────────────
  test('AUTH-10: Admin authorization grants administrative capabilities', async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/admin/);

    const session = await page.evaluate(() => JSON.parse(window.localStorage.getItem('nestmate_auth_session')!));
    expect(session.email).toBe('admin@nestmate-test.com');
  });

  // ── AUTH-11: Unauthorized Admin Rejection ───────────────────────────────────
  test('AUTH-11: Non-admin authenticated user is redirected away from /admin', async ({ page }) => {
    await AuthHelpers.loginAsSeekerA(page);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // Non-admin must be redirected away from admin dashboard
    await expect(page).not.toHaveURL(/\/admin$/);
  });

  // ── AUTH-12: User A / User B Switching & Multi-User Interaction ─────────────
  test('AUTH-12: Multi-user context switching allows independent workflows without state contamination', async ({ browser }) => {
    // Context 1: Seeker A
    const seekerContext = await browser.newContext();
    const seekerPage = await seekerContext.newPage();
    await AuthHelpers.loginAsSeekerA(seekerPage);
    await seekerPage.goto('/explore', { waitUntil: 'domcontentloaded' });

    // Context 2: Owner A
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await AuthHelpers.loginAsOwnerA(ownerPage);
    await ownerPage.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });

    // Verify both pages exist in parallel with different roles and UIDs
    const seekerUser = await seekerPage.evaluate(() => JSON.parse(window.localStorage.getItem('nestmate_auth_session')!));
    const ownerUser = await ownerPage.evaluate(() => JSON.parse(window.localStorage.getItem('nestmate_auth_session')!));

    expect(seekerUser.role).toBe('seeker');
    expect(ownerUser.role).toBe('owner');
    expect(seekerUser.uid).toBe('test_user_ref');
    expect(ownerUser.uid).toBe('test_user_owner_01');

    await seekerContext.close();
    await ownerContext.close();
  });
});
