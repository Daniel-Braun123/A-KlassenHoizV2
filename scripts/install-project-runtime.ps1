[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$nodeVersion = '24.18.0'
$npmVersion = '11.18.0'
$archiveName = "node-v$nodeVersion-win-x64.zip"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$toolsRoot = Join-Path $repositoryRoot '.tools'
$nodeRoot = Join-Path $toolsRoot "node-v$nodeVersion-win-x64"
$nodeExecutable = Join-Path $nodeRoot 'node.exe'
$bundledNpm = Join-Path $nodeRoot 'npm.cmd'
$npmRoot = Join-Path $toolsRoot "npm-$npmVersion"
$npmCli = Join-Path $npmRoot 'node_modules\npm\bin\npm-cli.js'

if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64') {
    throw 'The pinned portable runtime installer currently supports Windows x64 only.'
}

New-Item -ItemType Directory -Path $toolsRoot -Force | Out-Null

if (-not (Test-Path -LiteralPath $nodeExecutable -PathType Leaf)) {
    $archivePath = Join-Path $toolsRoot $archiveName
    $checksumsPath = Join-Path $toolsRoot 'SHASUMS256.txt'
    $releaseRoot = "https://nodejs.org/dist/v$nodeVersion"

    Invoke-WebRequest -Uri "$releaseRoot/SHASUMS256.txt" -OutFile $checksumsPath
    Invoke-WebRequest -Uri "$releaseRoot/$archiveName" -OutFile $archivePath

    $checksumLine = Get-Content -LiteralPath $checksumsPath |
        Where-Object { $_ -match "\s+$([regex]::Escape($archiveName))$" }
    if (-not $checksumLine) {
        throw 'The official checksum file does not contain the selected Node archive.'
    }

    $expectedChecksum = ($checksumLine -split '\s+')[0].ToLowerInvariant()
    $actualChecksum = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actualChecksum -ne $expectedChecksum) {
        throw 'The downloaded Node archive does not match the official SHA-256 checksum.'
    }

    Expand-Archive -LiteralPath $archivePath -DestinationPath $toolsRoot
}

$installedNodeVersion = (& $nodeExecutable --version).TrimStart('v')
if ($installedNodeVersion -ne $nodeVersion) {
    throw "Unexpected project Node version: $installedNodeVersion"
}

$installedNpmVersion = if (Test-Path -LiteralPath $npmCli -PathType Leaf) {
    (& $nodeExecutable $npmCli --version).Trim()
} else {
    $null
}

if ($installedNpmVersion -ne $npmVersion) {
    & $bundledNpm install --prefix $npmRoot --no-audit --no-fund --save-exact "npm@$npmVersion"
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

$installedNpmVersion = (& $nodeExecutable $npmCli --version).Trim()
if ($installedNpmVersion -ne $npmVersion) {
    throw "Unexpected project npm version: $installedNpmVersion"
}

Write-Output "PROJECT_RUNTIME_CONFIRMED node=$installedNodeVersion npm=$installedNpmVersion"
