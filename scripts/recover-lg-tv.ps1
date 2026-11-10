# PowerShell 7+ (Windows) safe recovery for LG webOS after a black screen.
# Example: pwsh -NoProfile -File .\recover-lg-tv.ps1 -TV 192.168.2.154
# No multiline shell snippets need to be pasted into PowerShell.
[CmdletBinding()]
param(
    [string]$TV = "192.168.2.154",
    [string]$KeyPath = "$env:USERPROFILE\.ssh\infiniti_tv_rsa"
)

$ErrorActionPreference = "Stop"
$uri = "https://raw.githubusercontent.com/infiniti-money/lg-tv-webos/main/tv/safe-recovery.sh"
$ssh = Get-Command ssh.exe -ErrorAction Stop
if (-not (Test-Path -LiteralPath $KeyPath -PathType Leaf)) {
    throw "SSH key not found: $KeyPath"
}
$ipAddress = $null
if (-not [System.Net.IPAddress]::TryParse($TV, [ref]$ipAddress) -or
    $ipAddress.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) {
    throw "Specify a valid TV IPv4 address with -TV."
}
$tmp = Join-Path ([IO.Path]::GetTempPath()) ("infiniti-recover-" + [Guid]::NewGuid().ToString("N") + ".sh")
try {
    Invoke-WebRequest -Uri $uri -OutFile $tmp -ErrorAction Stop
    $body = [IO.File]::ReadAllText($tmp).Replace("`r", "")
    if (-not $body.StartsWith("#!/bin/sh") -or
        -not $body.Contains("RECOVERY_COMPLETE:")) {
        throw "Recovery file failed basic integrity checks; nothing was sent to the TV."
    }
    Write-Host "Connecting to LG TV $TV using the configured SSH key..."
    # A single native SSH process receives the shell script on stdin.
    # -T avoids pseudo-terminal/paste-order issues. No destructive reset commands.
    $body | & $ssh.Source -T -o BatchMode=yes -o ConnectTimeout=10 -i $KeyPath "root@$TV" "sh -s"
    if ($LASTEXITCODE -ne 0) {
        throw "TV recovery did not complete (SSH exit $LASTEXITCODE). Do not reboot yet."
    }
    Write-Host "Review output for RECOVERY_COMPLETE and any WARNING before rebooting."
    Write-Host "When ready, reboot separately with:"
    Write-Host "ssh.exe -i `"$KeyPath`" root@$TV reboot"
}
finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
}
