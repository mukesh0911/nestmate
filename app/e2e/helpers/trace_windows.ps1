param([int]$FilterPid = 0)

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
    [DllImport("user32.dll")] public static extern IntPtr GetProcessWindowStation();
    [DllImport("user32.dll")] public static extern IntPtr GetThreadDesktop(uint dwThreadId);
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
    [DllImport("user32.dll", SetLastError = true)] public static extern bool GetUserObjectInformation(IntPtr hObj, int nIndex, StringBuilder pvInfo, int nLength, out int lpnLengthNeeded);
  }
"@

# Desktop / WinStation info
$winsta = [ForensicWinFinder]::GetProcessWindowStation()
$sbWinsta = New-Object System.Text.StringBuilder 256
$len = 0
[ForensicWinFinder]::GetUserObjectInformation($winsta, 2, $sbWinsta, 256, [ref]$len) | Out-Null

$tid = [ForensicWinFinder]::GetCurrentThreadId()
$desk = [ForensicWinFinder]::GetThreadDesktop($tid)
$sbDesk = New-Object System.Text.StringBuilder 256
[ForensicWinFinder]::GetUserObjectInformation($desk, 2, $sbDesk, 256, [ref]$len) | Out-Null

$explorer = Get-Process -Name explorer -ErrorAction SilentlyContinue | Select-Object -First 1
$ide = Get-Process -Name language_server_windows_x64, Antigravity, Code -ErrorAction SilentlyContinue | Select-Object -First 1

$sessionInfo = [PSCustomObject]@{
  UserName = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  CurrentSessionId = (Get-Process -Id $PID).SessionId
  WinStation = $sbWinsta.ToString()
  DesktopName = $sbDesk.ToString()
  ExplorerSessionId = if ($explorer) { $explorer.SessionId } else { "N/A" }
  ExplorerPID = if ($explorer) { $explorer.Id } else { "N/A" }
  IDESessionId = if ($ide) { $ide.SessionId } else { "N/A" }
  IDEPID = if ($ide) { $ide.Id } else { "N/A" }
  IDEName = if ($ide) { $ide.ProcessName } else { "N/A" }
}

# Processes
$chromes = Get-Process -Name chrome -ErrorAction SilentlyContinue
$pids = $chromes.Id
$winList = [System.Collections.Generic.List[PSCustomObject]]::new()

if ($pids.Count -gt 0) {
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

      $winList.Add([PSCustomObject]@{
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
}

$procList = [System.Collections.Generic.List[PSCustomObject]]::new()
foreach ($cp in $chromes) {
  $parentPid = 0
  try {
    $parentPid = (Get-CimInstance Win32_Process -Filter "ProcessId = $($cp.Id)").ParentProcessId
  } catch {}
  $procList.Add([PSCustomObject]@{
    PID = $cp.Id
    ParentPID = $parentPid
    SessionId = $cp.SessionId
    Name = $cp.ProcessName
    Path = $cp.Path
  })
}

[PSCustomObject]@{
  Session = $sessionInfo
  Processes = $procList
  Windows = $winList
} | ConvertTo-Json -Depth 5
