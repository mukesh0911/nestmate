const { chromium } = require('playwright');

async function debugAuth() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const continueEmailBtn = page.getByRole('button', { name: /Continue with Email/i });
  if (await continueEmailBtn.isVisible()) {
    await continueEmailBtn.click();
    await page.waitForTimeout(500);

    const stamp = Date.now();
    const testEmail = `real.new.user.${stamp}@nestmate.app`;
    const testPass = 'SecurePass@123';

    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPass);

    console.log('Submitting new user credentials:', testEmail);
    await page.locator('button:has-text("Continue")').last().click();
    await page.waitForTimeout(5000);

    console.log('Current URL after submit:', page.url());
  }

  await browser.close();
}

debugAuth();
