param(
  [string]$ScriptPath = "e2e/minimal_direct_launch.cjs"
)

Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class ProcessLauncher {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    public struct STARTUPINFO {
      public int cb;
      public string lpReserved;
      public string lpDesktop;
      public string lpTitle;
      public int dwX;
      public int dwY;
      public int dwXSize;
      public int dwYSize;
      public int dwXCountChars;
      public int dwYCountChars;
      public int dwFillAttribute;
      public int dwFlags;
      public short wShowWindow;
      public short cbReserved2;
      public IntPtr lpReserved2;
      public IntPtr hStdInput;
      public IntPtr hStdOutput;
      public IntPtr hStdError;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct PROCESS_INFORMATION {
      public IntPtr hProcess;
      public IntPtr hThread;
      public int dwProcessId;
      public int dwThreadId;
    }

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern bool CreateProcess(
      string lpApplicationName,
      string lpCommandLine,
      IntPtr lpProcessAttributes,
      IntPtr lpThreadAttributes,
      bool bInheritHandles,
      uint dwCreationFlags,
      IntPtr lpEnvironment,
      string lpCurrentDirectory,
      ref STARTUPINFO lpStartupInfo,
      out PROCESS_INFORMATION lpProcessInformation
    );

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern uint WaitForSingleObject(IntPtr hHandle, uint dwMilliseconds);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool CloseHandle(IntPtr hObject);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool GetExitCodeProcess(IntPtr hProcess, out uint lpExitCode);
  }
"@

$cwd = (Get-Location).Path
$logDir = Join-Path $cwd "e2e\reports"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir "desktop_launch.log"
if (Test-Path $logFile) { Remove-Item -Path $logFile -Force }

$fullScriptPath = Join-Path $cwd $ScriptPath

$cmdExe = "C:\Windows\System32\cmd.exe"
# We wrap node execution inside cmd /c so all output is streamed to the desktop_launch.log file
$cmdLine = "`"$cmdExe`" /c `"node `"$fullScriptPath`" > `"$logFile`" 2>&1`""

$si = New-Object ProcessLauncher+STARTUPINFO
$si.cb = [System.Runtime.InteropServices.Marshal]::SizeOf($si)
$si.lpDesktop = "WinSta0\Default" # TARGET THE PHYSICAL HUMAN USER INTERACTIVE DESKTOP

$pi = New-Object ProcessLauncher+PROCESS_INFORMATION

Write-Host "LAUNCHING_ON_PHYSICAL_DESKTOP: WinSta0\Default"
Write-Host "EXECUTING: node $ScriptPath"

$success = [ProcessLauncher]::CreateProcess(
  $cmdExe,
  $cmdLine,
  [IntPtr]::Zero,
  [IntPtr]::Zero,
  $false,
  0,
  [IntPtr]::Zero,
  $cwd,
  [ref]$si,
  [ref]$pi
)

if ($success) {
  Write-Host "LAUNCHER_SUCCESS: PID $($pi.dwProcessId)"
  
  # Poll the log file while the process is running to stream progress
  $lastPos = 0
  while ([ProcessLauncher]::WaitForSingleObject($pi.hProcess, 1000) -eq 258) { # WAIT_TIMEOUT = 258 (0x102)
    if (Test-Path $logFile) {
      try {
        $fs = [System.IO.File]::Open($logFile, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $sr = New-Object System.IO.StreamReader($fs)
        $content = $sr.ReadToEnd()
        $sr.Close()
        $fs.Close()
        if ($content.Length -gt $lastPos) {
          $chunk = $content.Substring($lastPos)
          Write-Host -NoNewline $chunk
          $lastPos = $content.Length
        }
      } catch {}
    }
  }

  # Final flush of log file
  if (Test-Path $logFile) {
    try {
      $fs = [System.IO.File]::Open($logFile, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
      $sr = New-Object System.IO.StreamReader($fs)
      $content = $sr.ReadToEnd()
      $sr.Close()
      $fs.Close()
      if ($content.Length -gt $lastPos) {
        $chunk = $content.Substring($lastPos)
        Write-Host -NoNewline $chunk
      }
    } catch {}
  }

  $exitCode = 0
  [ProcessLauncher]::GetExitCodeProcess($pi.hProcess, [ref]$exitCode) | Out-Null
  Write-Host "`nDESKTOP_PROCESS_COMPLETED: ExitCode $exitCode"

  [ProcessLauncher]::CloseHandle($pi.hThread) | Out-Null
  [ProcessLauncher]::CloseHandle($pi.hProcess) | Out-Null
} else {
  $err = [System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
  Write-Host "CREATE_PROCESS_FAILED: Win32Error $err"
}
