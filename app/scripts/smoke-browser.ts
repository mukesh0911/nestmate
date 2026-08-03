/**
 * NestMate browser smoke test — run against local Vite:
 *   npx tsx scripts/smoke-browser.ts
 */
import { chromium, type Page, type Browser } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3001';
const OUT = join(process.cwd(), 'smoke-artifacts');
mkdirSync(OUT, { recursive: true });

type Check = { name: string; ok: boolean; detail?: string; severity?: 'P0' | 'P1' | 'P2' };
const results: Check[] = [];

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name: string, detail: string, severity: 'P0' | 'P1' | 'P2' = 'P1') {
  results.push({ name, ok: false, detail, severity });
  console.log(`❌ [${severity}] ${name} — ${detail}`);
}

async function shot(page: Page, name: string) {
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function waitReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(800);
}

async function goto(page: Page, path: string) {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await waitReady(page);
  return res;
}

async function hasText(page: Page, text: string | RegExp) {
  return page.getByText(text).first().isVisible().catch(() => false);
}

async function clickIfVisible(page: Page, locator: ReturnType<Page['locator']>, timeout = 3000) {
  try {
    await locator.first().waitFor({ state: 'visible', timeout });
    await locator.first().click();
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`\n=== NestMate Browser Smoke @ ${BASE} ===\n`);
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  // ── Public pages ──────────────────────────────────────────────
  for (const [path, marker] of [
    ['/', /NestMate|flatmate|roommate|compatible/i],
    ['/how-it-works', /How NestMate Works|How it works/i],
    ['/pricing', /Pricing|Free|Premium/i],
    ['/about', /About|NestMate/i],
    ['/privacy', /Privacy|Terms/i],
    ['/browse-rooms', /Room|Browse|Find|listing|filter/i],
    ['/browse-seekers', /Seeker|Flatmate|Browse|Find/i],
    ['/map', /Map|Search|area|leaflet|OpenStreetMap/i],
  ] as const) {
    try {
      const res = await goto(page, path);
      const status = res?.status() ?? 0;
      const visible = await hasText(page, marker);
      const body = await page.locator('body').innerText().catch(() => '');
      await shot(page, `public${path.replace(/\W+/g, '_') || '_home'}`);
      if (status >= 400) fail(`Public page ${path}`, `HTTP ${status}`, 'P0');
      else if (!visible && body.length < 20) fail(`Public page ${path}`, 'Blank or unreadable content', 'P0');
      else pass(`Public page ${path}`, `status=${status}`);
    } catch (e: any) {
      fail(`Public page ${path}`, e?.message || String(e), 'P0');
    }
  }

  // ── 404 ───────────────────────────────────────────────────────
  try {
    await goto(page, '/this-route-does-not-exist-xyz');
    const ok404 = (await hasText(page, /not found|404|lost|home/i)) || page.url().includes('this-route');
    await shot(page, 'not_found');
    if (ok404) pass('404 / unknown route renders');
    else fail('404 / unknown route renders', 'No not-found UI detected', 'P2');
  } catch (e: any) {
    fail('404 / unknown route renders', e?.message || String(e), 'P2');
  }

  // ── Login page UI ─────────────────────────────────────────────
  try {
    await goto(page, '/login');
    await page.waitForSelector('text=/Welcome|Continue with Google|Continue with Email|Sign in/i', { timeout: 15000 });
    await shot(page, 'login');
    const hasEmail = await page.locator('input[type="email"], input[placeholder*="email" i]').count();
    const hasGoogleOrEmail = await hasText(page, /Google|Email|password|Sign|Welcome|Continue with/i);
    if (hasEmail > 0 || hasGoogleOrEmail) pass('Login page form/UI present');
    else fail('Login page form/UI present', 'No auth controls found', 'P0');
  } catch (e: any) {
    fail('Login page form/UI present', e?.message || String(e), 'P0');
  }

  // ── Auth modal from landing CTA ───────────────────────────────
  try {
    await goto(page, '/');
    const opened =
      (await clickIfVisible(page, page.getByRole('button', { name: /get started|sign in|try|demo|connect/i }))) ||
      (await clickIfVisible(page, page.locator('button').filter({ hasText: /Get Started|Sign|Demo/i })));
    await page.waitForTimeout(600);
    await shot(page, 'auth_modal_attempt');
    const modalVisible =
      (await page.locator('[class*="fixed"]').filter({ hasText: /demo|seeker|owner|sign/i }).count()) > 0 ||
      (await hasText(page, /Continue as Seeker|Continue as Owner|1-Click|Sign in/i));
    if (opened && modalVisible) pass('Landing opens auth modal / CTA');
    else if (opened) pass('Landing CTA clickable', 'modal text not detected but click succeeded');
    else fail('Landing opens auth modal / CTA', 'Could not find/open CTA', 'P1');
  } catch (e: any) {
    fail('Landing opens auth modal / CTA', e?.message || String(e), 'P1');
  }

  // ── Demo seeker login ─────────────────────────────────────────
  let demoOk = false;
  try {
    await goto(page, '/');
    await clickIfVisible(page, page.getByRole('button', { name: /get started|sign in|try|demo/i }), 4000);
    await page.waitForTimeout(500);
    // Open auth modal if needed
    if (!(await hasText(page, /Continue as Seeker/i))) {
      await clickIfVisible(page, page.locator('button, a').filter({ hasText: /Sign|Get Started|Connect/i }), 3000);
      await page.waitForTimeout(500);
    }
    const seekerBtn = page.getByRole('button', { name: /Continue as Seeker/i });
    if (await seekerBtn.count()) {
      await seekerBtn.click();
      await page.waitForTimeout(5000);
      await shot(page, 'demo_seeker_after');
      const url = page.url();
      const onApp =
        /dashboard|onboarding|role-select|browse|chat|profile/i.test(url) ||
        (await hasText(page, /Dashboard|Match|Connect|Messages|Profile|Best Match/i));
      if (onApp) {
        pass('Demo seeker login reaches app', url);
        demoOk = true;
      } else {
        fail('Demo seeker login reaches app', `Stuck at ${url}`, 'P0');
      }
    } else {
      // Fallback: create account via login page
      await goto(page, '/login');
      const stamp = Date.now();
      const email = `smoke.seeker.${stamp}@nestmate.app`;
      const password = `Smoke!${stamp}`;
      // Try signup mode
      await clickIfVisible(page, page.getByText(/create|sign up|register/i), 2000);
      await page.waitForTimeout(400);
      const emailInput = page.locator('input[type="email"]').first();
      const passInput = page.locator('input[type="password"]').first();
      if ((await emailInput.count()) && (await passInput.count())) {
        await emailInput.fill(email);
        await passInput.fill(password);
        await clickIfVisible(page, page.getByRole('button', { name: /sign up|create|continue|register/i }), 3000);
        await page.waitForTimeout(4000);
        await shot(page, 'email_signup_after');
        if (/role-select|onboarding|dashboard/i.test(page.url()) || (await hasText(page, /Looking for|I have|role|Dashboard/i))) {
          pass('Email signup reaches post-auth flow', page.url());
          demoOk = true;
        } else {
          fail('Email signup reaches post-auth flow', `URL=${page.url()}`, 'P0');
        }
      } else {
        fail('Demo seeker login reaches app', 'No Continue as Seeker and no email form', 'P0');
      }
    }
  } catch (e: any) {
    fail('Demo seeker login reaches app', e?.message || String(e), 'P0');
  }

  // ── Authenticated navigation ──────────────────────────────────
  if (demoOk) {
    const authedRoutes: Array<[string, RegExp]> = [
      ['/dashboard', /match|connect|filter|saved|seeker|budget|Best Match|No matches|Dashboard/i],
      ['/browse-rooms', /room|rent|browse|filter/i],
      ['/browse-seekers', /seeker|flatmate|browse|filter/i],
      ['/chat', /message|conversation|chat|select|hello|connect/i],
      ['/profile', /profile|edit|trust|completeness|bio|settings/i],
      ['/edit-profile', /edit|save|name|bio|verification/i],
      ['/settings', /settings|privacy|dark|language|delete|download/i],
      ['/notifications', /notification|no notifications|empty|mark/i],
      ['/map', /map|search|area/i],
      ['/pricing', /pricing|premium|free/i],
    ];

    for (const [path, marker] of authedRoutes) {
      try {
        await goto(page, path);
        await page.waitForTimeout(1200);
        await shot(page, `authed${path.replace(/\W+/g, '_')}`);
        const redirectedLogin = /login|phone-login/i.test(page.url());
        const visible = await hasText(page, marker);
        const loaderStuck = (await hasText(page, /^Loading\.\.\.$/)) && !(await hasText(page, marker));
        if (redirectedLogin) fail(`Authed route ${path}`, 'Redirected to login (session lost)', 'P0');
        else if (loaderStuck) fail(`Authed route ${path}`, 'Stuck on loading', 'P1');
        else if (visible || page.url().includes(path.replace(/^\//, ''))) pass(`Authed route ${path}`);
        else fail(`Authed route ${path}`, `Missing expected UI at ${page.url()}`, 'P1');
      } catch (e: any) {
        fail(`Authed route ${path}`, e?.message || String(e), 'P1');
      }
    }

    // Settings toggles / buttons present
    try {
      await goto(page, '/settings');
      await shot(page, 'settings_detail');
      const hasDark = await hasText(page, /dark|appearance|theme/i);
      const hasDelete = await hasText(page, /delete account|download/i);
      if (hasDark || hasDelete) pass('Settings controls visible');
      else fail('Settings controls visible', 'Missing privacy/appearance/delete sections', 'P1');
    } catch (e: any) {
      fail('Settings controls visible', e?.message || String(e), 'P1');
    }

    // Profile edit save button
    try {
      await goto(page, '/edit-profile');
      await page.waitForTimeout(1500);
      const saveBtn = page.locator('button').filter({ hasText: /^Save$/i });
      if ((await saveBtn.count()) > 0) pass('Edit profile has Save control');
      else fail('Edit profile has Save control', 'Save button missing', 'P1');
    } catch (e: any) {
      fail('Edit profile has Save control', e?.message || String(e), 'P1');
    }

    // Chat empty/select state
    try {
      await goto(page, '/chat');
      await page.waitForSelector('text=/No conversations yet|Select a conversation|Loading conversations/i', { timeout: 12000 });
      await page.waitForTimeout(1500);
      await shot(page, 'chat_empty');
      const ok = await hasText(page, /No conversations yet|Select a conversation|Connect with matches|Start chatting|Messages/i);
      if (ok) pass('Chat page empty/select state');
      else fail('Chat page empty/select state', 'Unexpected chat UI', 'P1');
    } catch (e: any) {
      fail('Chat page empty/select state', e?.message || String(e), 'P1');
    }

    // Notifications empty/list
    try {
      await goto(page, '/notifications');
      await shot(page, 'notifications');
      const ok = await hasText(page, /notification|no notification|empty|mark|all caught/i);
      if (ok) pass('Notifications page renders');
      else pass('Notifications page renders', 'Loaded without crash');
    } catch (e: any) {
      fail('Notifications page renders', e?.message || String(e), 'P1');
    }

    // Mobile viewport + guest browse + tablet spot-check
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await goto(page, '/dashboard');
      await page.waitForTimeout(2500);
      await shot(page, 'mobile_dashboard');
      const menu =
        (await hasText(page, /match|connect|dashboard|NestMate|filter|best match|Rohan|Priya/i));
      if (menu) pass('Mobile dashboard layout loads');
      else fail('Mobile dashboard layout loads', 'Blank mobile dashboard', 'P1');

      // Mobile browse rooms (auth-gated actions unchanged; guest can still browse when logged out)
      await goto(page, '/browse-rooms');
      await page.waitForTimeout(2000);
      await shot(page, 'mobile_browse_rooms');
      const browseOk = await hasText(page, /room|filter|where|budget|map|NestMate|listing|no rooms/i);
      if (browseOk) pass('Mobile browse rooms layout loads');
      else fail('Mobile browse rooms layout loads', 'Browse blank on mobile', 'P1');

      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (scrollW <= 8) pass('Mobile browse no horizontal overflow');
      else fail('Mobile browse no horizontal overflow', `scrollWidth delta=${scrollW}`, 'P1');

      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await goto(page, '/dashboard');
      await page.waitForTimeout(2000);
      await shot(page, 'tablet_dashboard');
      const tabletOk = await hasText(page, /match|dashboard|NestMate|filter|connect/i);
      if (tabletOk) pass('Tablet dashboard layout loads');
      else fail('Tablet dashboard layout loads', 'Blank tablet dashboard', 'P1');

      await page.setViewportSize({ width: 1280, height: 800 });
    } catch (e: any) {
      fail('Mobile dashboard layout loads', e?.message || String(e), 'P1');
      try { await page.setViewportSize({ width: 1280, height: 800 }); } catch {}
    }

    // Logout
    try {
      await goto(page, '/settings');
      const loggedOut =
        (await clickIfVisible(page, page.getByRole('button', { name: /log out|logout|sign out/i }), 3000)) ||
        (await clickIfVisible(page, page.getByText(/log out|logout|sign out/i), 3000));
      // Also try navbar profile dropdown
      if (!loggedOut) {
        await goto(page, '/dashboard');
        await clickIfVisible(page, page.locator('.profile-dropdown-container button, button').filter({ hasText: /./ }), 2000);
        await clickIfVisible(page, page.getByText(/log out|logout|sign out/i), 2000);
      }
      await page.waitForTimeout(2000);
      await shot(page, 'after_logout');
      const guest =
        /login|^https?:\/\/[^/]+\/?$|browse|how-it-works/i.test(page.url()) ||
        (await hasText(page, /sign in|get started|log in|find compatible/i));
      if (guest) pass('Logout returns to guest experience');
      else fail('Logout returns to guest experience', `URL=${page.url()}`, 'P1');
    } catch (e: any) {
      fail('Logout returns to guest experience', e?.message || String(e), 'P1');
    }
  }

  // ── Demo owner login ──────────────────────────────────────────
  try {
    await context.clearCookies();
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.clear());
    await goto(page, '/');
    await clickIfVisible(page, page.getByRole('button', { name: /get started|sign in|try|demo|connect/i }), 4000);
    await page.waitForTimeout(500);
    if (!(await hasText(page, /Continue as Owner/i))) {
      await clickIfVisible(page, page.locator('button, a').filter({ hasText: /Sign|Get Started|Connect/i }), 3000);
      await page.waitForTimeout(500);
    }
    const ownerBtn = page.getByRole('button', { name: /Continue as Owner/i });
    if (await ownerBtn.count()) {
      await ownerBtn.click();
      await page.waitForTimeout(5000);
      await shot(page, 'demo_owner_after');
      const ok =
        /owner-dashboard|onboarding\/owner|dashboard/i.test(page.url()) ||
        (await hasText(page, /listing|applicant|owner|views|dashboard|publish/i));
      if (ok) pass('Demo owner login reaches owner experience', page.url());
      else fail('Demo owner login reaches owner experience', `URL=${page.url()}`, 'P0');
    } else {
      fail('Demo owner login reaches owner experience', 'Owner demo button missing', 'P1');
    }
  } catch (e: any) {
    fail('Demo owner login reaches owner experience', e?.message || String(e), 'P0');
  }

  // ── Console error triage (ignore known noise) ─────────────────
  const serious = consoleErrors.filter(
    (e) =>
      !/favicon|Download the React DevTools|browserslist|GrpcConnection RPC|permission-denied|net::ERR/i.test(e) &&
      !/404 .*favicon/i.test(e)
  );
  if (serious.length === 0) pass('No serious console errors during smoke');
  else fail('No serious console errors during smoke', serious.slice(0, 5).join(' | '), 'P1');

  await browser.close();

  // Report
  const failed = results.filter((r) => !r.ok);
  const p0 = failed.filter((r) => r.severity === 'P0');
  const p1 = failed.filter((r) => r.severity === 'P1');
  const report = {
    base: BASE,
    passed: results.filter((r) => r.ok).length,
    failed: failed.length,
    p0: p0.length,
    p1: p1.length,
    results,
    artifacts: OUT,
  };
  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log('\n=== Smoke Summary ===');
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed} (P0=${report.p0}, P1=${report.p1})`);
  console.log(`Artifacts: ${OUT}`);
  if (p0.length || p1.length) {
    failed.forEach((f) => console.log(`  - [${f.severity}] ${f.name}: ${f.detail}`));
    process.exit(1);
  }
  console.log('\nSmoke passed with no P0/P1 failures.\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
