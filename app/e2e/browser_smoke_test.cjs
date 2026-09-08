const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runSmokeTest() {
  console.log('----------------------------------------');
  console.log('STARTING VISIBLE BROWSER SMOKE TEST');
  console.log('----------------------------------------');
  console.log('Launching visible Chromium...');

  let browser;
  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 300,
      args: [
        '--start-maximized',
      ]
    });
    console.log('Chromium launched successfully');

    if (!browser || typeof browser.newContext !== 'function') {
      throw new Error('Browser object is invalid or not created properly');
    }
    console.log('Browser object verified: [Playwright Chromium Instance]');

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    console.log('Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.waitForTimeout(1500);
    const url = page.url();
    const title = await page.title();

    console.log(`Current Page URL:   ${url}`);
    console.log(`Current Page Title: "${title}"`);

    const shotsDir = path.join(__dirname, 'reports/screenshots');
    if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });
    const screenshotPath = path.join(shotsDir, 'smoke_test_proof.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);

    console.log('Keeping browser visible for 6 seconds for human inspection...');
    await page.waitForTimeout(6000);

    console.log('✅ Smoke test completed successfully!');
  } catch (err) {
    console.error('❌ SMOKE TEST FAILED with real error:', err);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed.');
    }
  }
}

runSmokeTest();
