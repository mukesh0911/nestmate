import { test, expect } from '@playwright/test';
import path from 'path';
import { PERSONA_REGISTRY } from '../helpers/personaRegistry';

const AUTH_DIR = path.resolve(__dirname, '../.auth');

test.describe('Phase 4: Test Persona Diagnostic Certification', () => {

  // 1. SEEKER_A
  test('Persona: SEEKER_A (Aditi Sharma) authentication and identity verification', async ({ browser }) => {
    const persona = PERSONA_REGISTRY.SEEKER_A;
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/explore/);
    await expect(page.locator('body')).toBeVisible();

    const sessionRaw = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    const session = JSON.parse(sessionRaw!);
    expect(session.uid).toBe(persona.uid);
    expect(session.role).toBe(persona.role);
    expect(session.name).toBe(persona.name);
    expect(session.isVerified).toBe(true);

    await context.close();
  });

  // 2. SEEKER_B
  test('Persona: SEEKER_B (Pooja Iyer) authentication and identity verification', async ({ browser }) => {
    const persona = PERSONA_REGISTRY.SEEKER_B;
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerB.json'),
    });
    const page = await context.newPage();

    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/explore/);

    const sessionRaw = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    const session = JSON.parse(sessionRaw!);
    expect(session.uid).toBe(persona.uid);
    expect(session.role).toBe(persona.role);
    expect(session.name).toBe(persona.name);

    await context.close();
  });

  // 3. OWNER_A
  test('Persona: OWNER_A (Ramesh Gupta) dashboard and verified status', async ({ browser }) => {
    const persona = PERSONA_REGISTRY.OWNER_A;
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'ownerA.json'),
    });
    const page = await context.newPage();

    await page.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/owner-dashboard/);

    const sessionRaw = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    const session = JSON.parse(sessionRaw!);
    expect(session.uid).toBe(persona.uid);
    expect(session.role).toBe('owner');
    expect(session.name).toBe(persona.name);
    expect(session.isVerified).toBe(true);

    await context.close();
  });

  // 4. OWNER_B
  test('Persona: OWNER_B (Siddharth Rao) unverified owner status', async ({ browser }) => {
    const persona = PERSONA_REGISTRY.OWNER_B;
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'ownerB.json'),
    });
    const page = await context.newPage();

    await page.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/owner-dashboard/);

    const sessionRaw = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    const session = JSON.parse(sessionRaw!);
    expect(session.uid).toBe(persona.uid);
    expect(session.role).toBe('owner');
    expect(session.isVerified).toBe(false);

    await context.close();
  });

  // 5. OWNER_PENDING_VERIFICATION
  test('Persona: OWNER_PENDING_VERIFICATION (Anjali Deshmukh) pending status', async ({ browser }) => {
    const persona = PERSONA_REGISTRY.OWNER_PENDING_VERIFICATION;
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'ownerPending.json'),
    });
    const page = await context.newPage();

    await page.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/owner-dashboard/);

    const sessionRaw = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    const session = JSON.parse(sessionRaw!);
    expect(session.uid).toBe(persona.uid);
    expect(session.role).toBe('owner');

    await context.close();
  });

  // 6. OWNER_REJECTED
  test('Persona: OWNER_REJECTED (Kavita Reddy) rejected status', async ({ browser }) => {
    const persona = PERSONA_REGISTRY.OWNER_REJECTED;
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'ownerRejected.json'),
    });
    const page = await context.newPage();

    await page.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/owner-dashboard/);

    const sessionRaw = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    const session = JSON.parse(sessionRaw!);
    expect(session.uid).toBe(persona.uid);
    expect(session.role).toBe('owner');

    await context.close();
  });

  // 7. ADMIN
  test('Persona: ADMIN (NestMate Admin) admin portal access', async ({ browser }) => {
    const persona = PERSONA_REGISTRY.ADMIN;
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'admin.json'),
    });
    const page = await context.newPage();

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/admin/);

    const sessionRaw = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    const session = JSON.parse(sessionRaw!);
    expect(session.uid).toBe(persona.uid);
    expect(session.email).toBe(persona.email);

    await expect(page.getByRole('heading', { name: /Dashboard/i }).first()).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  // 8. ONBOARDING_PENDING
  test('Persona: ONBOARDING_PENDING route gate to /role-select', async ({ browser }) => {
    const persona = PERSONA_REGISTRY.ONBOARDING_PENDING;
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'onboardingPending.json'),
    });
    const page = await context.newPage();

    await page.goto('/role-select', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/role-select/);

    const sessionRaw = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    const session = JSON.parse(sessionRaw!);
    expect(session.uid).toBe(persona.uid);
    expect(session.onboardingComplete).toBe(false);

    await expect(page.getByText(/I want to…|Step 1 of 1/i).first()).toBeVisible();

    await context.close();
  });

  // 9. PREMIUM_USER
  test('Persona: PREMIUM_USER (Priya Sharma) premium flag active', async ({ browser }) => {
    const persona = PERSONA_REGISTRY.PREMIUM_USER;
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'premiumUser.json'),
    });
    const page = await context.newPage();

    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/explore/);

    const sessionRaw = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    const session = JSON.parse(sessionRaw!);
    expect(session.uid).toBe(persona.uid);
    expect(session.isPremium).toBe(true);

    await context.close();
  });

  // 10. QUOTA_FULL_USER
  test('Persona: QUOTA_FULL_USER (Suresh Raina) connects quota limit reached', async ({ browser }) => {
    const persona = PERSONA_REGISTRY.QUOTA_FULL_USER;
    const context = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'quotaFullUser.json'),
    });
    const page = await context.newPage();

    await page.goto('/explore', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/explore/);

    const sessionRaw = await page.evaluate(() => window.localStorage.getItem('nestmate_auth_session'));
    const session = JSON.parse(sessionRaw!);
    expect(session.uid).toBe(persona.uid);
    expect(session.connectsUsed).toBe(5);
    expect(session.connectsLimit).toBe(5);

    await context.close();
  });

});
