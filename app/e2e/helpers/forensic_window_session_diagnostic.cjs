/**
 * Forensic Window & Session Diagnostic
 * Answers sections 2, 3, 4 of user request
 */
'use strict';

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const appNodeModules = path.resolve(__dirname, '../../node_modules');
if (!module.paths.includes(appNodeModules)) {
  module.paths.unshift(appNodeModules);
}
process.env.NODE_PATH = appNodeModules;
require('module').Module._initPaths();

const { chromium } = require('playwright');

async function runForensicDiagnostic() {
  console.log('===============================================================');
  console.log('🔍 FORENSIC WINDOW, SESSION & PROCESS TREE INVESTIGATION');
  console.log('===============================================================');

  // 1. Session & Desktop Information
  const psSessionScript = `
    Add-Type @"
      using System;
      using System.Text;
      using System.Runtime.InteropServices;
      public class WinStationInfo {
        [DllImport("user32.dll")] public static extern IntPtr GetProcessWindowStation();
        [DllImport("user32.dll")] public static extern IntPtr GetThreadDesktop(uint dwThreadId);
        [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
        [DllImport("user32.dll", SetLastError = true)] public static extern bool GetUserObjectInformation(IntPtr hObj, int nIndex, StringBuilder pvInfo, int nLength, out int lpnLengthNeeded);
      }
"@
    $winsta = [WinStationInfo]::GetProcessWindowStation()
    $sbWinsta = New-Object System.Text.StringBuilder 256
    $len = 0
    [WinStationInfo]::GetUserObjectInformation($winsta, 2, $sbWinsta, 256, [ref]$len) | Out-Null

    $tid = [WinStationInfo]::GetCurrentThreadId()
    $desk = [WinStationInfo]::GetThreadDesktop($tid)
    $sbDesk = New-Object System.Text.StringBuilder 256
    [WinStationInfo]::GetUserObjectInformation($desk, 2, $sbDesk, 256, [ref]$len) | Out-Null

    $explorer = Get-Process -Name explorer -ErrorAction SilentlyContinue | Select-Object -First 1
    $ide = Get-Process -Name language_server_windows_x64, Antigravity, Code -ErrorAction SilentlyContinue | Select-Object -First 1

    [PSCustomObject]@{
      UserName = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
      CurrentSessionId = (Get-Process -Id $PID).SessionId
      WinStation = $sbWinsta.ToString()
      DesktopName = $sbDesk.ToString()
      ExplorerSessionId = if ($explorer) { $explorer.SessionId } else { "N/A" }
      ExplorerPID = if ($explorer) { $explorer.Id } else { "N/A" }
      IDESessionId = if ($ide) { $ide.SessionId } else { "N/A" }
      IDEPID = if ($ide) { $ide.Id } else { "N/A" }
      IDEName = if ($ide) { $ide.ProcessName } else { "N/A" }
    } | ConvertTo-Json
  `;

  try {
    const sessionRes = JSON.parse(execSync(`powershell -NoProfile -Command "${psSessionScript.replace(/\r?\n/g, ' ')}"`, { encoding: 'utf-8' }));
    console.log('\n--- [3. DESKTOP / SESSION IDENTIFICATION] ---');
    console.log(`Windows User:              ${sessionRes.UserName}`);
    console.log(`Node Session ID:           ${sessionRes.CurrentSessionId}`);
    console.log(`WinStation:                ${sessionRes.WinStation}`);
    console.log(`Interactive Desktop Name:  ${sessionRes.DesktopName}`);
    console.log(`explorer.exe Session:      ${sessionRes.ExplorerSessionId} (PID: ${sessionRes.ExplorerPID})`);
    console.log(`Antigravity / IDE Session: ${sessionRes.IDESessionId} (PID: ${sessionRes.IDEPID}, Name: ${sessionRes.IDEName})`);
  } catch (err) {
    console.error('Session query error:', err.message);
  }

  // Launch Chromium to inspect its process tree and windows
  console.log('\n--- LAUNCHING CHROMIUM TO TRACE PROCESS TREE & WINDOWS ---');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: [
      '--start-maximized',
      '--window-position=0,0',
    ],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // 2. Process Tree Inspection
  const psProcTreeScript = `
    $chromes = Get-CimInstance Win32_Process -Filter "Name LIKE 'chrome%'" | Select-Object ProcessId, ParentProcessId, SessionId, Name, ExecutablePath, CommandLine
    $chromes | ConvertTo-Json
  `;

  let chromeProcesses = [];
  try {
    const treeOut = execSync(`powershell -NoProfile -Command "${psProcTreeScript.replace(/\r?\n/g, ' ')}"`, { encoding: 'utf-8' }).trim();
    if (treeOut) {
      chromeProcesses = JSON.parse(treeOut);
      if (!Array.isArray(chromeProcesses)) chromeProcesses = [chromeProcesses];
    }
  } catch (e) {}

  console.log('\n--- [4. CHROMIUM PROCESS TREE] ---');
  console.log(`Node PID: ${process.pid} (Session: ${process.env.SESSIONNAME || 'Session 1'})`);
  for (const cp of chromeProcesses) {
    console.log(`\n -> PID:            ${cp.ProcessId}`);
    console.log(`    Parent PID:     ${cp.ParentProcessId}`);
    console.log(`    Session ID:     ${cp.SessionId}`);
    console.log(`    Process Name:   ${cp.Name}`);
    console.log(`    Executable:     ${cp.ExecutablePath}`);
    console.log(`    Command Line:   ${cp.CommandLine ? cp.CommandLine.slice(0, 120) + '...' : 'N/A'}`);
  }

  // 3. Window Enumeration across all Chrome processes
  const psWinEnumScript = `
    Add-Type @"
      using System;
      using System.Text;
      using System.Runtime.InteropServices;
      public struct RECT { public int Left, Top, Right, Bottom; }
      public class ForensicWinFinder {
        [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
        public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
        [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
        [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)] public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
        [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
        [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
        [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
        [DllImport("user32.dll")] public static extern IntPtr GetWindow(IntPtr hWnd, uint uCmd);
        [DllImport("user32.dll")] public static extern IntPtr GetParent(IntPtr hWnd);
      }
"@

    $chromes = Get-Process -Name chrome -ErrorAction SilentlyContinue
    $pids = $chromes.Id
    $list = [System.Collections.Generic.List[PSCustomObject]]::new()

    $cb = [ForensicWinFinder+EnumWindowsProc]{
      param([IntPtr]$hWnd, [IntPtr]$lParam)
      [uint32]$procId = 0
      [ForensicWinFinder]::GetWindowThreadProcessId($hWnd, [ref]$procId)
      if ($pids -contains $procId) {
        $sbC = New-Object System.Text.StringBuilder 256
        [ForensicWinFinder]::GetClassName($hWnd, $sbC, 256) | Out-Null
        $sbT = New-Object System.Text.StringBuilder 512
        [ForensicWinFinder]::GetWindowText($hWnd, $sbT, 512) | Out-Null
        $r = New-Object RECT
        [ForensicWinFinder]::GetWindowRect($hWnd, [ref]$r) | Out-Null
        $vis = [ForensicWinFinder]::IsWindowVisible($hWnd)
        $min = [ForensicWinFinder]::IsIconic($hWnd)
        $parent = [ForensicWinFinder]::GetParent($hWnd)
        $owner = [ForensicWinFinder]::GetWindow($hWnd, 4) # GW_OWNER = 4
        $procObj = Get-Process -Id $procId -ErrorAction SilentlyContinue

        $list.Add([PSCustomObject]@{
          HWND = $hWnd.ToInt64()
          PID = $procId
          ProcessName = if ($procObj) { $procObj.ProcessName } else { "chrome" }
          SessionId = if ($procObj) { $procObj.SessionId } else { "N/A" }
          WindowTitle = $sbT.ToString()
          ClassName = $sbC.ToString()
          Visible = $vis
          Minimized = $min
          Bounds = "$($r.Left),$($r.Top) to $($r.Right),$($r.Bottom) ($($r.Right - $r.Left)x$($r.Bottom - $r.Top))"
          IsTopLevel = ($parent -eq [IntPtr]::Zero)
          IsOwned = ($owner -ne [IntPtr]::Zero)
          OwnerHWND = $owner.ToInt64()
        })
      }
      return $true
    }

    [ForensicWinFinder]::EnumWindows($cb, [IntPtr]::Zero) | Out-Null
    $list | ConvertTo-Json
  `;

  console.log('\n--- [2. WINDOWS WINDOW ENUMERATION ACROSS CHROMIUM] ---');
  try {
    const winEnumOut = execSync(`powershell -NoProfile -Command "${psWinEnumScript.replace(/\r?\n/g, ' ')}"`, { encoding: 'utf-8' }).trim();
    if (winEnumOut) {
      let windows = JSON.parse(winEnumOut);
      if (!Array.isArray(windows)) windows = [windows];
      console.log(`Discovered ${windows.length} top-level windows belonging to Chrome PIDs:`);
      for (const w of windows) {
        console.log(`\n  HWND:         ${w.HWND}`);
        console.log(`  PID:          ${w.PID} (${w.ProcessName}, Session ${w.SessionId})`);
        console.log(`  WindowTitle:  "${w.WindowTitle}"`);
        console.log(`  ClassName:    ${w.ClassName}`);
        console.log(`  Visible:      ${w.Visible}`);
        console.log(`  Minimized:    ${w.Minimized}`);
        console.log(`  Bounds:       ${w.Bounds}`);
        console.log(`  IsTopLevel:   ${w.IsTopLevel}`);
        console.log(`  IsOwned:      ${w.IsOwned} (OwnerHWND: ${w.OwnerHWND})`);
      }
    } else {
      console.log('NO top-level windows returned by EnumWindows for Chrome PIDs.');
    }
  } catch (err) {
    console.error('Window enumeration error:', err.message);
  }

  await browser.close();
  console.log('\n===============================================================');
  console.log('FORENSIC ENUMERATION COMPLETE');
  console.log('===============================================================');
}

runForensicDiagnostic().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
