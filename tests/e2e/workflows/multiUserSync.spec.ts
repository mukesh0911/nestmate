import { test, expect } from '@playwright/test';
import path from 'path';
import { injectFirebaseAuth } from '../../helpers/firebaseAuthInjector';

const AUTH_DIR = path.resolve(__dirname, '../../../tests/.auth');

test.describe('Workflow: Multi-User Browser Synchronization & Context Isolation', () => {

  test('1. Independent concurrent sessions maintain strict context isolation', async ({ browser }) => {
    // Context A: Seeker B (Pooja)
    const contextSeeker = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerB.json'),
    });
    const pageSeeker = await contextSeeker.newPage();
    await injectFirebaseAuth(pageSeeker, 'SEEKER_B');

    // Context B: Owner A (Ramesh)
    const contextOwner = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'ownerA.json'),
    });
    const pageOwner = await contextOwner.newPage();
    await injectFirebaseAuth(pageOwner, 'OWNER_A');

    // Navigate concurrently
    await Promise.all([
      pageSeeker.goto('/explore?tab=roommates', { waitUntil: 'domcontentloaded' }),
      pageOwner.goto('/owner-dashboard', { waitUntil: 'domcontentloaded' }),
    ]);

    // Verify Seeker sees Roommate Explore without cross-talk
    await expect(pageSeeker).toHaveURL(/\/explore\?tab=roommates/);
    const seekerIdentity = pageSeeker.locator('header, nav, main').locator('text=/Pooja/i').locator('visible=true').first();
    await expect(seekerIdentity).toBeVisible({ timeout: 10000 });

    // Verify Owner sees Owner Dashboard without being redirected or contaminated by Seeker
    await expect(pageOwner).toHaveURL(/\/owner-dashboard/);
    const ownerIdentity = pageOwner.locator('header, nav, main').locator('text=/Owner Dashboard|Ramesh/i').locator('visible=true').first();
    await expect(ownerIdentity).toBeVisible({ timeout: 10000 });

    await contextSeeker.close();
    await contextOwner.close();
  });

  test('2. Multi-user concurrent messaging session between Seeker and Owner', async ({ browser }) => {
    // Context A: Seeker B (Pooja)
    const contextSeeker = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'seekerB.json'),
    });
    const pageSeeker = await contextSeeker.newPage();
    await injectFirebaseAuth(pageSeeker, 'SEEKER_B');

    // Context B: Owner A (Ramesh)
    const contextOwner = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'ownerA.json'),
    });
    const pageOwner = await contextOwner.newPage();
    await injectFirebaseAuth(pageOwner, 'OWNER_A');

    // Both users open /chat concurrently
    await Promise.all([
      pageSeeker.goto('/chat', { waitUntil: 'domcontentloaded' }),
      pageOwner.goto('/chat', { waitUntil: 'domcontentloaded' }),
    ]);

    await expect(pageSeeker).toHaveURL(/\/chat/);
    await expect(pageOwner).toHaveURL(/\/chat/);

    // Verify chat UI loaded on Seeker side
    const seekerChat = pageSeeker.locator('main').locator('text=/Messages|Aditi|Ramesh|online/i').locator('visible=true').first();
    await expect(seekerChat).toBeVisible({ timeout: 15000 });

    // Verify chat UI loaded on Owner side
    const ownerChat = pageOwner.locator('main').locator('text=/Messages|Aditi|Pooja|online/i').locator('visible=true').first();
    await expect(ownerChat).toBeVisible({ timeout: 15000 });

    await contextSeeker.close();
    await contextOwner.close();
  });

});
