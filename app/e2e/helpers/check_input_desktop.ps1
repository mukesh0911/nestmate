Add-Type @"
  using System;
  using System.Text;
  using System.Runtime.InteropServices;
  public class DeskCheck {
    [DllImport("user32.dll")] public static extern IntPtr OpenInputDesktop(uint dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll")] public static extern bool GetUserObjectInformation(IntPtr hObj, int nIndex, StringBuilder pvInfo, int nLength, out int lpnLengthNeeded);
    [DllImport("user32.dll")] public static extern bool CloseDesktop(IntPtr hDesktop);
    [DllImport("user32.dll")] public static extern bool SwitchDesktop(IntPtr hDesktop);
  }
"@

$inputDesk = [DeskCheck]::OpenInputDesktop(0, $false, 0x0100) # GENERIC_READ
if ($inputDesk -ne [IntPtr]::Zero) {
  $sb = New-Object System.Text.StringBuilder 256
  $len = 0
  [DeskCheck]::GetUserObjectInformation($inputDesk, 2, $sb, 256, [ref]$len) | Out-Null
  Write-Host "ACTIVE_INPUT_DESKTOP: $($sb.ToString())"
  [DeskCheck]::CloseDesktop($inputDesk) | Out-Null
} else {
  Write-Host "ACTIVE_INPUT_DESKTOP: FAILED_TO_OPEN"
}
