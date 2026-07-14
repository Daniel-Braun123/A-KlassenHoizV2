[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][ValidateSet('e2e', 'accessibility', 'pwa')][string]$Suite,
    [string]$Project,
    [string]$TestPath
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$nodeRoot = Join-Path $repositoryRoot '.tools\node-v24.18.0-win-x64'
$isWindowsPlatform = [Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT
$supabaseCli = Join-Path $repositoryRoot $(if ($isWindowsPlatform) { 'node_modules\.bin\supabase.cmd' } else { 'node_modules/.bin/supabase' })
$playwright = Join-Path $repositoryRoot 'node_modules\@playwright\test\cli.js'
$nodeExecutable = if (Test-Path -LiteralPath (Join-Path $nodeRoot 'node.exe')) { Join-Path $nodeRoot 'node.exe' } else { (Get-Command node -ErrorAction Stop).Source }
$powerShellExecutable = if ($isWindowsPlatform) { 'powershell' } else { 'pwsh' }
$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$env:Path = "$(if (Test-Path -LiteralPath $nodeRoot) { "$nodeRoot;" })$machinePath;$userPath;$env:Path"
if ($env:DOCKER_CERT_PATH -and -not (Test-Path -LiteralPath $env:DOCKER_CERT_PATH)) {
    Remove-Item Env:DOCKER_CERT_PATH, Env:DOCKER_HOST, Env:DOCKER_TLS_VERIFY -ErrorAction SilentlyContinue
}
$status = & $supabaseCli status -o env
if ($LASTEXITCODE -ne 0) { throw 'Local Supabase must be running before browser tests.' }
$values = @{}
foreach ($line in $status) { if ($line -match '^(API_URL|PUBLISHABLE_KEY|JWT_SECRET)="([^"]+)"$') { $values[$matches[1]] = $matches[2] } }
$env:NEXT_PUBLIC_SUPABASE_URL = $values.API_URL
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = $values.PUBLISHABLE_KEY
$env:SUPABASE_TEST_JWT_SECRET = $values.JWT_SECRET
$env:NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3000'
$env:NEXT_TELEMETRY_DISABLED = '1'

if (-not $env:PLAYWRIGHT_WEB_SERVER_COMMAND) {
    & $nodeExecutable (Join-Path $repositoryRoot 'node_modules\next\dist\bin\next') build
    if ($LASTEXITCODE -ne 0) { throw 'The production browser-test build failed.' }
    $env:PLAYWRIGHT_WEB_SERVER_COMMAND = 'npm run start'
}

function Invoke-BrowserProject([string]$ProjectName) {
    $arguments = @('test', $(if ($TestPath) { $TestPath } else { "tests/$Suite" }), "--project=$ProjectName")
    & $nodeExecutable $playwright @arguments
    $script:BrowserExitCode = $LASTEXITCODE
}

if ($Project) {
    Invoke-BrowserProject $Project
    exit $script:BrowserExitCode
}

$projects = @('chromium', 'firefox', 'webkit', 'mobile-chrome', 'mobile-safari')
foreach ($projectName in $projects) {
    if ($Suite -ne 'pwa') {
        $resetArguments = @('-NoProfile')
        if ($isWindowsPlatform) { $resetArguments += @('-ExecutionPolicy', 'Bypass') }
        $resetArguments += @('-File', (Join-Path $repositoryRoot 'scripts\database.ps1'), 'reset')
        & $powerShellExecutable @resetArguments
        if ($LASTEXITCODE -ne 0) { throw "Local database reset failed before $projectName." }
    }
    Invoke-BrowserProject $projectName
    if ($script:BrowserExitCode -ne 0) { exit $script:BrowserExitCode }
}
exit 0
