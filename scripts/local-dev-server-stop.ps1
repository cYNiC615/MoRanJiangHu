param(
    [switch]$DryRun
)

$ErrorActionPreference = 'SilentlyContinue'

$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root

$PortFile = Join-Path $Root '.local-dev-server-port'
$RecordedPorts = @()

if (Test-Path -LiteralPath $PortFile) {
    Get-Content -LiteralPath $PortFile | ForEach-Object {
        $value = 0
        if ([int]::TryParse(($_ -as [string]).Trim(), [ref]$value) -and $value -gt 0) {
            $RecordedPorts += $value
        }
    }
}

$CandidatePorts = @($RecordedPorts + (4190..4205)) | Sort-Object -Unique
$Connections = foreach ($Port in $CandidatePorts) {
    Get-NetTCPConnection -LocalPort $Port -State Listen | ForEach-Object {
        [pscustomobject]@{
            Port = $Port
            Pid = $_.OwningProcess
        }
    }
}

$Targets = @{}

foreach ($Connection in $Connections) {
    if (-not $Connection.Pid) {
        continue
    }

    $ProcessInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $($Connection.Pid)"
    $CommandLine = [string]$ProcessInfo.CommandLine
    $ProcessName = [string]$ProcessInfo.Name
    $PortPattern = "(--port\s+$($Connection.Port)\b|--port=$($Connection.Port)\b)"
    $FromRecordedPort = $RecordedPorts -contains $Connection.Port
    $LooksLikeThisWorkspace = $CommandLine -match [regex]::Escape($Root)
    $LooksLikeVite = $CommandLine -match '(vite|vite\.js)' -and $CommandLine -match $PortPattern

    if (-not $LooksLikeVite -or (-not $FromRecordedPort -and -not $LooksLikeThisWorkspace)) {
        Write-Host "Skipping PID $($Connection.Pid) on port $($Connection.Port): command line does not look like this workspace's Vite server."
        continue
    }

    $Targets[$Connection.Pid] = [pscustomobject]@{
        Pid = $Connection.Pid
        Port = $Connection.Port
        Name = $ProcessName
        CommandLine = $CommandLine
    }
}

if ($Targets.Count -eq 0) {
    Write-Host 'No matching local Vite dev server was found on ports 4190-4205.'
    if (Test-Path -LiteralPath $PortFile) {
        if ($DryRun) {
            Write-Host 'Dry run: would remove stale .local-dev-server-port file.'
        } else {
            Remove-Item -LiteralPath $PortFile -Force
            Write-Host 'Removed stale .local-dev-server-port file.'
        }
    }
    exit 0
}

foreach ($Target in $Targets.Values) {
    if ($DryRun) {
        Write-Host "Dry run: would stop PID $($Target.Pid) ($($Target.Name)) on port $($Target.Port)."
        continue
    }

    Write-Host "Stopping PID $($Target.Pid) ($($Target.Name)) on port $($Target.Port)."
    Stop-Process -Id $Target.Pid -Force
}

if (-not $DryRun -and (Test-Path -LiteralPath $PortFile)) {
    Remove-Item -LiteralPath $PortFile -Force
}

Write-Host 'Done.'
