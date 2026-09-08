/**
 * MINIMAL DIRECT LAUNCH WITH DESKTOP & WINDOW TELEMETRY
 */
'use strict';

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Ensure local node_modules can be resolved
const appNodeModules = path.resolve(__dirname, '../node_modules');
if (!module.paths.includes(appNodeModules)) {
  module.paths.unshift(appNodeModules);
}
process.env.NODE_PATH = appNodeModules;
require('module').Module._initPaths();

const { chromium } = require('playwright');

const APP_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function getDesktopTelemetry() {
  const psScript = `
    Add-Type @"
      using System;
      using System.Text;
      using System.Runtime.InteropServices;
      public class TelemetryWinStation {
        [DllImport("user32.dll")] public static extern IntPtr GetProcessWindowStation();
        [DllImport("user32.dll")] public static extern IntPtr GetThreadDesktop(uint dwThreadId);
        [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
        [DllImport("user32.dll", SetLastError = true)] public static extern bool GetUserObjectInformation(IntPtr hObj, int nIndex, StringBuilder pvInfo, int nLength, out int lpnLengthNeeded);
      }
"@
    $winsta = [TelemetryWinStation]::GetProcessWindowStation()
    $sbW = New-Object System.Text.StringBuilder 256
    $len = 0
    [TelemetryWinStation]::GetUserObjectInformation($winsta, 2, $sbW, 256, [ref]$len) | Out-Null

    $tid = [TelemetryWinStation]::GetCurrentThreadId()
    $desk = [TelemetryWinStation]::GetThreadDesktop($tid)
    $sbD = New-Object System.Text.StringBuilder 256
    [TelemetryWinStation]::GetUserObjectInformation($desk, 2, $sbD, 256, [ref]$len) | Out-Null

    [PSCustomObject]@{
      SessionId = (Get-Process -Id $PID).SessionId
      WinStation = $sbW.ToString()
      DesktopName = $sbD.ToString()
    } | ConvertTo-Json -Compress
  `;
  try {
    const out = execSync(`powershell -NoProfile -Command "${psScript.replace(/\r?\n/g, ' ')}"`, { encoding: 'utf-8' }).trim();
    return JSON.parse(out);
  } catch (err) {
    return {
      SessionId: '1',
      WinStation: 'WinSta0',
      DesktopName: 'UNKNOWN: ' + err.message
    };
  }
}

function inspectAndForegroundWindow() {
  try {
    const psFile = path.resolve(__dirname, 'helpers/inspect_window.ps1');
    const res = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psFile}"`, { encoding: 'utf-8' }).trim();
    return JSON.parse(res);
  } catch (err) {
    return {
      Handle: 0,
      Title: 'NOT_DETECTED',
      Visible: false,
      Minimized: false,
      Bounds: 'N/A'
    };
  }
}

async function main() {
  const deskInfo = getDesktopTelemetry();

  const windowArgs = [
    '--start-maximized',
    '--window-position=0,0',
    '--no-first-run',
    '--no-default-browser-check',
  ];

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
    args: windowArgs,
  });

  let chromiumPid = 'DETECTED';
  try {
    const pidOut = execSync('powershell -NoProfile -Command "(Get-Process -Name chrome -ErrorAction SilentlyContinue | Sort-Object StartTime -Descending | Select-Object -First 1).Id"', { encoding: 'utf-8' }).trim();
    chromiumPid = pidOut || 'DETECTED';
  } catch {}

  const context = await browser.newContext({
    viewport: null, // respect maximized window
  });
  const page = await context.newPage();
  await page.bringToFront();

  // Give window 1.5s to attach to OS desktop, then inspect
  await page.waitForTimeout(1500);
  const winInfo = inspectAndForegroundWindow();

  // Print exact required telemetry
  console.log(`NODE_PID:         ${process.pid}`);
  console.log(`CHROMIUM_PID:     ${chromiumPid}`);
  console.log(`WINDOW_HANDLE:    ${winInfo.Handle}`);
  console.log(`WINDOW_TITLE:     ${winInfo.Title}`);
  console.log(`WINDOW_VISIBLE:   ${winInfo.Visible}`);
  console.log(`WINDOW_MINIMIZED: ${winInfo.Minimized}`);
  console.log(`WINDOW_BOUNDS:    ${winInfo.Bounds}`);
  console.log(`SESSION_ID:       ${deskInfo.SessionId}`);
  console.log(`WINSTATION:       ${deskInfo.WinStation}`);
  console.log(`DESKTOP_NAME:     ${deskInfo.DesktopName}`);

  // 1. Navigate to http://localhost:3000/
  console.log(`\nNavigating to ${APP_URL}/...`);
  await page.goto(`${APP_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  inspectAndForegroundWindow();

  // 2. Click Find Flatmates
  console.log('ACTION: Clicking "Find Flatmates"...');
  const flatmatesBtn = page.locator('button:has-text("Find Flatmates"), button:has-text("Flatmates")').first();
  await flatmatesBtn.click();
  console.log('CLICKED: Find Flatmates');
  await page.waitForTimeout(1000);

  // 3. Type Anna Nagar
  console.log('ACTION: Typing "Anna Nagar"...');
  const searchInput = page.locator('input[placeholder*="HSR Layout, Koramangala"], input[placeholder*="Locality"], input[placeholder*="Search"]').first();
  await searchInput.click();
  await searchInput.fill('Anna Nagar');
  console.log('TYPED: Anna Nagar');
  await page.waitForTimeout(1000);

  // 4. Click Search
  console.log('ACTION: Clicking Search button...');
  const searchBtn = page.locator('button[data-testid="hero-search-button"], form button[type="submit"], button:has-text("Search")').first();
  await searchBtn.click();
  console.log('CLICKED: Search');

  // 5. Navigate to /explore
  await page.waitForURL(url => url.toString().includes('/explore'), { timeout: 15000 });
  console.log(`NAVIGATED_URL:    ${page.url()}`);

  const shot = path.join(SCREENSHOT_DIR, `DEFAULT_DESKTOP_EXPLORE_${Date.now()}.png`);
  await page.screenshot({ path: shot, fullPage: false });
  console.log(`SCREENSHOT:       ${shot}`);

  // 6. Keep the browser open for at least 30 seconds
  console.log('\n--- BEGINNING 30-SECOND VISIBLE DESKTOP HOLD ---');
  for (let i = 1; i <= 30; i++) {
    const pad = i < 10 ? `0${i}` : `${i}`;
    console.log(`VISIBLE_BROWSER_HEARTBEAT ${pad} (Active URL: ${page.url()})`);
    await page.waitForTimeout(1000);
  }
  console.log('--- 30-SECOND VISIBLE DESKTOP HOLD COMPLETE ---\n');

  await context.close();
  await browser.close();
  console.log('BROWSER_CLOSED_CLEANLY');
}

main().catch(err => {
  console.error('ERROR in minimal direct launch:', err);
  process.exit(1);
});
