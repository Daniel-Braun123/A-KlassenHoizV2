[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$nodeRoot = Join-Path $repositoryRoot '.tools\node-v24.18.0-win-x64'
$isWindowsPlatform = [Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT
$supabaseCli = Join-Path $repositoryRoot $(if ($isWindowsPlatform) { 'node_modules\.bin\supabase.cmd' } else { 'node_modules/.bin/supabase' })
$vitest = Join-Path $repositoryRoot 'node_modules\vitest\vitest.mjs'
$nodeExecutable = if (Test-Path -LiteralPath (Join-Path $nodeRoot 'node.exe')) { Join-Path $nodeRoot 'node.exe' } else { (Get-Command node -ErrorAction Stop).Source }

$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$env:Path = "$(if (Test-Path -LiteralPath $nodeRoot) { "$nodeRoot;" })$machinePath;$userPath;$env:Path"
if ($env:DOCKER_CERT_PATH -and -not (Test-Path -LiteralPath $env:DOCKER_CERT_PATH)) {
    Remove-Item Env:DOCKER_CERT_PATH, Env:DOCKER_HOST, Env:DOCKER_TLS_VERIFY -ErrorAction SilentlyContinue
}

$status = & $supabaseCli status -o env
if ($LASTEXITCODE -ne 0) {
    throw 'Local Supabase must be running before integration tests.'
}

$values = @{}
foreach ($line in $status) {
    if ($line -match '^(API_URL|PUBLISHABLE_KEY|SECRET_KEY|JWT_SECRET)="([^"]+)"$') {
        $values[$matches[1]] = $matches[2]
    }
}

foreach ($required in @('API_URL', 'PUBLISHABLE_KEY', 'SECRET_KEY', 'JWT_SECRET')) {
    if (-not $values.ContainsKey($required)) {
        throw "Missing $required in local Supabase status output."
    }
}

$env:SUPABASE_TEST_URL = $values.API_URL
$env:SUPABASE_TEST_PUBLISHABLE_KEY = $values.PUBLISHABLE_KEY
$env:SUPABASE_TEST_SECRET_KEY = $values.SECRET_KEY
$env:SUPABASE_TEST_JWT_SECRET = $values.JWT_SECRET

& $nodeExecutable $vitest run tests/integration
exit $LASTEXITCODE
