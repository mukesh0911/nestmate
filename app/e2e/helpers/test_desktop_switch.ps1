Add-Type @"
  using System;
  using System.Text;
  using System.Runtime.InteropServices;
  public class DesktopUtil {
    [DllImport("user32.dll", SetLastError = true)] public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll", SetLastError = true)] public static extern bool SetThreadDesktop(IntPtr hDesktop);
    [DllImport("user32.dll", SetLastError = true)] public static extern bool CloseDesktop(IntPtr hDesktop);
    [DllImport("user32.dll")] public static extern IntPtr GetThreadDesktop(uint dwThreadId);
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
    [DllImport("user32.dll", SetLastError = true)] public static extern bool GetUserObjectInformation(IntPtr hObj, int nIndex, StringBuilder pvInfo, int nLength, out int lpnLengthNeeded);
  }
"@

$tid = [DesktopUtil]::GetCurrentThreadId()
$currDesk = [DesktopUtil]::GetThreadDesktop($tid)
$sb = New-Object System.Text.StringBuilder 256
$len = 0
[DesktopUtil]::GetUserObjectInformation($currDesk, 2, $sb, 256, [ref]$len) | Out-Null
Write-Host "INITIAL_THREAD_DESKTOP: $($sb.ToString())"

# DESKTOP_ALL_ACCESS = 0x1FF
$hDefault = [DesktopUtil]::OpenDesktop("Default", 0, $false, 0x1FF)
if ($hDefault -ne [IntPtr]::Zero) {
  Write-Host "OPEN_DESKTOP_DEFAULT: SUCCESS (Handle: $hDefault)"
  $res = [DesktopUtil]::SetThreadDesktop($hDefault)
  if ($res) {
    Write-Host "SET_THREAD_DESKTOP: SUCCESS"
    $newDesk = [DesktopUtil]::GetThreadDesktop($tid)
    $sbNew = New-Object System.Text.StringBuilder 256
    [DesktopUtil]::GetUserObjectInformation($newDesk, 2, $sbNew, 256, [ref]$len) | Out-Null
    Write-Host "NEW_THREAD_DESKTOP: $($sbNew.ToString())"
  } else {
    $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
    Write-Host "SET_THREAD_DESKTOP: FAILED (Win32Error: $err)"
  }
  [DesktopUtil]::CloseDesktop($hDefault) | Out-Null
} else {
  $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
  Write-Host "OPEN_DESKTOP_DEFAULT: FAILED (Win32Error: $err)"
}
