const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(600);
  
  const emailModeBtn = page.locator('button:has-text("Continue with Email")').first();
  console.log('emailModeBtn visible:', await emailModeBtn.isVisible());
  if (await emailModeBtn.isVisible()) {
    await emailModeBtn.click();
    await page.waitForTimeout(500);
  }
  
  const submitBtn = page.locator('button.btn-fire').first();
  console.log('Submit button visible:', await submitBtn.isVisible());
  console.log('Submit button text:', await submitBtn.innerText());
  
  await submitBtn.click();
  await page.waitForTimeout(500);
  
  const alert = page.locator('[role="alert"]').first();
  console.log('Alert visible:', await alert.isVisible());
  if (await alert.isVisible()) {
    console.log('Alert text:', await alert.innerText());
  } else {
    console.log('Body text snippet:\n', (await page.locator('body').innerText()).slice(0, 300));
  }
  
  // Test invalid login
  await page.locator('input[type="email"]').first().fill('invalid-user@nestmate-test.com');
  await page.locator('input[id="pw-input"], input[type="password"]').first().fill('WrongPassword999!');
  await submitBtn.click();
  await page.waitForTimeout(2000);
  
  console.log('\nAfter invalid submit:');
  console.log('Alert visible:', await alert.isVisible());
  if (await alert.isVisible()) {
    console.log('Alert text:', await alert.innerText());
  } else {
    console.log('Body text snippet:\n', (await page.locator('body').innerText()).slice(0, 400));
  }
  
  await browser.close();
})();
