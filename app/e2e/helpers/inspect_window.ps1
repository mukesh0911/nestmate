param([string]$ProcessName = "chrome")

Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public struct RECT { public int Left, Top, Right, Bottom; }
  public class Win32WinInfo {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)] public static extern int GetClassName(IntPtr hWnd, System.Text.StringBuilder lpClassName, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
    [DllImport("user32.dll")] public static extern void SwitchToThisWindow(IntPtr hWnd, bool fUnknown);
  }
"@

$procs = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
$pids = $procs.Id

$bestHwnd = [IntPtr]::Zero
$bestTitle = ""
$bestArea = 0
$bestRect = New-Object RECT

if ($pids.Count -gt 0) {
  $callback = [Win32WinInfo+EnumWindowsProc]{
    param([IntPtr]$h, [IntPtr]$l)
    [uint32]$procId = 0
    [void][Win32WinInfo]::GetWindowThreadProcessId($h, [ref]$procId)
    if ($pids -contains $procId -and [Win32WinInfo]::IsWindowVisible($h)) {
      $sbClass = New-Object System.Text.StringBuilder 256
      [void][Win32WinInfo]::GetClassName($h, $sbClass, 256)
      $className = $sbClass.ToString()
      if ($className -like "*Chrome_WidgetWin*") {
        $r = New-Object RECT
        [void][Win32WinInfo]::GetWindowRect($h, [ref]$r)
        $w = $r.Right - $r.Left
        $hgt = $r.Bottom - $r.Top
        $area = $w * $hgt
        # Pick the largest visible window (filters out 50x50 helper widgets)
        if ($w -gt 200 -and $hgt -gt 200 -and $area -gt $script:bestArea) {
          $sbTitle = New-Object System.Text.StringBuilder 512
          [void][Win32WinInfo]::GetWindowText($h, $sbTitle, 512)
          $script:bestHwnd = $h
          $script:bestTitle = $sbTitle.ToString()
          $script:bestArea = $area
          $script:bestRect = $r
        }
      }
    }
    return $true
  }

  [void][Win32WinInfo]::EnumWindows($callback, [IntPtr]::Zero)
}

if ($bestHwnd -ne [IntPtr]::Zero) {
  # Force topmost pop to break through IDE full-screen overlay
  $HWND_TOPMOST = [IntPtr](-1)
  $HWND_NOTOPMOST = [IntPtr](-2)
  $SWP_NOMOVE = 0x0002
  $SWP_NOSIZE = 0x0001
  $SWP_SHOWWINDOW = 0x0040
  $flags = $SWP_NOMOVE -bor $SWP_NOSIZE -bor $SWP_SHOWWINDOW

  [void][Win32WinInfo]::ShowWindow($bestHwnd, 9) # SW_RESTORE (9)
  [void][Win32WinInfo]::ShowWindow($bestHwnd, 3) # SW_MAXIMIZE (3)

  [void][Win32WinInfo]::SetWindowPos($bestHwnd, $HWND_TOPMOST, 0, 0, 0, 0, $flags)
  [void][Win32WinInfo]::SetWindowPos($bestHwnd, $HWND_NOTOPMOST, 0, 0, 0, 0, $flags)

  $foreWnd = [Win32WinInfo]::GetForegroundWindow()
  [uint32]$foreThread = 0
  [void][Win32WinInfo]::GetWindowThreadProcessId($foreWnd, [ref]$foreThread)
  $currThread = [Win32WinInfo]::GetCurrentThreadId()

  if ($foreThread -ne 0 -and $foreThread -ne $currThread) {
    [void][Win32WinInfo]::AttachThreadInput($currThread, $foreThread, $true)
    [void][Win32WinInfo]::BringWindowToTop($bestHwnd)
    [void][Win32WinInfo]::SetForegroundWindow($bestHwnd)
    [void][Win32WinInfo]::AttachThreadInput($currThread, $foreThread, $false)
  } else {
    [void][Win32WinInfo]::BringWindowToTop($bestHwnd)
    [void][Win32WinInfo]::SetForegroundWindow($bestHwnd)
  }

  [void][Win32WinInfo]::SwitchToThisWindow($bestHwnd, $true)

  $vis = [Win32WinInfo]::IsWindowVisible($bestHwnd)
  $min = [Win32WinInfo]::IsIconic($bestHwnd)
  $rect = New-Object RECT
  [void][Win32WinInfo]::GetWindowRect($bestHwnd, [ref]$rect)
  $bounds = "$($rect.Left),$($rect.Top) to $($rect.Right),$($rect.Bottom) ($($rect.Right - $rect.Left)x$($rect.Bottom - $rect.Top))"

  [PSCustomObject]@{
    Handle = $bestHwnd.ToInt64()
    Title = $bestTitle
    Visible = $vis
    Minimized = $min
    Bounds = $bounds
  } | ConvertTo-Json -Compress
} else {
  [PSCustomObject]@{
    Handle = 0
    Title = "NOT_DETECTED"
    Visible = $false
    Minimized = $false
    Bounds = "N/A"
  } | ConvertTo-Json -Compress
}
