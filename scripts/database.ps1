[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet('start', 'status', 'reset', 'lint', 'test', 'types')]
    [string]$Action
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$nodeRoot = Join-Path $repositoryRoot '.tools\node-v24.18.0-win-x64'
$supabaseCli = Join-Path $repositoryRoot 'node_modules\.bin\supabase.cmd'
$targetGuard = Join-Path $PSScriptRoot 'verify-local-target.ps1'

# Long-running terminals do not automatically receive PATH/environment updates made by a
# newly installed container engine. Refresh PATH for this process and ignore only stale Docker
# overrides whose referenced certificate directory no longer exists.
$machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$env:Path = "$machinePath;$userPath;$env:Path"
if ($env:DOCKER_CERT_PATH -and -not (Test-Path -LiteralPath $env:DOCKER_CERT_PATH)) {
    Remove-Item Env:DOCKER_CERT_PATH -ErrorAction SilentlyContinue
    Remove-Item Env:DOCKER_HOST -ErrorAction SilentlyContinue
    Remove-Item Env:DOCKER_TLS_VERIFY -ErrorAction SilentlyContinue
}

if (-not (Test-Path -LiteralPath $supabaseCli -PathType Leaf)) {
    throw 'Project-local Supabase CLI is missing. Run npm ci with the pinned project runtime.'
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'A local Docker-compatible engine is required. Remote databases are never a fallback.'
}

$arguments = [string[]]@(switch ($Action) {
    'start' { @('start') }
    'status' { @('status') }
    'reset' { @('db', 'reset', '--local') }
    'lint' { @('db', 'lint', '--local', '--level', 'error') }
    'test' { @('test', 'db', '--local') }
    'types' { @('gen', 'types', 'typescript', '--local', '--schema', 'api,app') }
})

& $targetGuard @arguments | Out-Host
$env:Path = "$nodeRoot;$env:Path"

if ($Action -eq 'types') {
    $generatedPath = Join-Path $repositoryRoot 'lib\supabase\database.types.ts'
    $temporaryPath = "$generatedPath.tmp"

    try {
        & $supabaseCli @arguments | Set-Content -LiteralPath $temporaryPath -Encoding utf8
        if ($LASTEXITCODE -ne 0) {
            throw "Supabase type generation failed with exit code $LASTEXITCODE."
        }

        Move-Item -LiteralPath $temporaryPath -Destination $generatedPath -Force
        Write-Output "Generated $generatedPath from the local V2 database."
    }
    finally {
        if (Test-Path -LiteralPath $temporaryPath) {
            Remove-Item -LiteralPath $temporaryPath -Force
        }
    }

    exit 0
}

& $supabaseCli @arguments
exit $LASTEXITCODE
