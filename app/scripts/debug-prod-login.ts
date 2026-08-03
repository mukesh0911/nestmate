import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const res = await page.goto('https://nestmate-eb562.web.app/login', { waitUntil: 'networkidle', timeout: 60000 });
  console.log('status', res?.status());
  await page.waitForTimeout(5000);
  console.log('URL', page.url());
  console.log('TITLE', await page.title());
  const text = await page.locator('body').innerText();
  console.log('BODY_LEN', text.length);
  console.log('BODY', text.slice(0, 1200));
  const inputs = await page.locator('input').count();
  const buttons = await page.locator('button').count();
  console.log('inputs', inputs, 'buttons', buttons);
  await page.screenshot({ path: 'smoke-artifacts/prod_login_debug2.png', fullPage: true });
  await browser.close();
}

main();
