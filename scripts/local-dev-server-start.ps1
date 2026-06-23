param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $Root

$StartPort = 4190
$EndPort = 4290
$PortFile = Join-Path $Root '.local-dev-server-port'

function Test-PortAvailable {
    param([int]$Port)

    $Address = [System.Net.IPAddress]::Parse('127.0.0.1')
    $Listener = New-Object System.Net.Sockets.TcpListener -ArgumentList $Address, $Port
    try {
        $Listener.Start()
        return $true
    } catch {
        return $false
    } finally {
        if ($Listener) {
            $Listener.Stop()
        }
    }
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host 'ERROR: npm was not found in PATH.'
    Write-Host 'Install Node.js/npm or open this from a terminal that has npm available.'
    exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $Root 'package.json'))) {
    Write-Host 'ERROR: package.json was not found. This script must stay in the repository root.'
    exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $Root 'node_modules'))) {
    Write-Host 'ERROR: node_modules was not found.'
    Write-Host 'Run npm install once in this repository, then start again.'
    exit 1
}

if (Test-Path -LiteralPath $PortFile) {
    Remove-Item -LiteralPath $PortFile -Force
}

$Port = $null
foreach ($Candidate in $StartPort..$EndPort) {
    if (Test-PortAvailable -Port $Candidate) {
        $Port = $Candidate
        break
    }
}

if (-not $Port) {
    Write-Host "ERROR: No free local port was found between $StartPort and $EndPort."
    exit 1
}

Set-Content -LiteralPath $PortFile -Value $Port -Encoding ASCII

Write-Host 'Starting Vite on:'
Write-Host "  http://127.0.0.1:$Port/"
Write-Host ''
Write-Host 'Keep this window open while playing.'
Write-Host 'To stop from another window, run stop-local-server.bat.'
Write-Host ''

if ($DryRun) {
    Write-Host 'Dry run only. Server was not started.'
    Remove-Item -LiteralPath $PortFile -Force
    exit 0
}

try {
    & npm run dev -- --host 127.0.0.1 --port $Port --strictPort
    exit $LASTEXITCODE
} finally {
    if (Test-Path -LiteralPath $PortFile) {
        Remove-Item -LiteralPath $PortFile -Force
    }
}
