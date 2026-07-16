[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$forbiddenDirectories = @('legacy', 'old', 'backup', 'backups', 'exports')
$violations = [System.Collections.Generic.List[string]]::new()
$secretPatterns = @(
    @{
        Name = 'Supabase secret key'
        Pattern = '(?i)\bsb_secret_[a-z0-9_-]{16,}'
    },
    @{
        Name = 'JWT-like token'
        Pattern = '\beyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{16,}\b'
    },
    @{
        Name = 'GitHub token'
        Pattern = '(?i)\bgh[pousr]_[a-z0-9]{30,}\b'
    },
    @{
        Name = 'Assigned infrastructure secret'
        Pattern = '(?im)\b(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|DATABASE_URL|POSTGRES_PASSWORD)\s*=\s*["'']?(?!\s*(?:$|<|your-|replace-|example|changeme))\S{12,}'
    },
    @{
        Name = 'Quoted infrastructure secret'
        Pattern = '(?im)["''](?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|DATABASE_URL|POSTGRES_PASSWORD)["'']\s*:\s*["''](?!\s*(?:<|your-|replace-|example|changeme))[^"'']{12,}["'']'
    }
)
$textExtensions = @(
    '.css', '.env', '.example', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.ps1', '.sql',
    '.toml', '.ts', '.tsx', '.txt', '.yaml', '.yml'
)

foreach ($directory in $forbiddenDirectories) {
    $candidate = Join-Path $repositoryRoot $directory
    if (Test-Path -LiteralPath $candidate) {
        $violations.Add("Forbidden legacy/data directory exists: $directory")
    }
}

$prdFiles = @(Get-ChildItem -LiteralPath (Join-Path $repositoryRoot 'docs') -File |
    Where-Object { $_.Name -match '(?i)prd.*\.md$' })
if ($prdFiles.Count -ne 1 -or $prdFiles[0].Name -ne 'PRD.md') {
    $violations.Add('docs/PRD.md must be the single canonical PRD file.')
}

$migrationRoot = Join-Path $repositoryRoot 'supabase\migrations'
if (Test-Path -LiteralPath $migrationRoot) {
    $invalidMigrations = @(Get-ChildItem -LiteralPath $migrationRoot -File |
        Where-Object { $_.Name -notmatch '^20\d{12}_[a-z0-9_]+\.sql$' })
    foreach ($migration in $invalidMigrations) {
        $violations.Add("Migration is outside the V2 naming baseline: $($migration.Name)")
    }
}

$candidateFiles = @(git -C $repositoryRoot ls-files --cached --others --exclude-standard)
foreach ($relativePath in $candidateFiles) {
    $absolutePath = Join-Path $repositoryRoot $relativePath
    if (-not (Test-Path -LiteralPath $absolutePath -PathType Leaf)) {
        continue
    }

    $extension = [System.IO.Path]::GetExtension($relativePath).ToLowerInvariant()
    if ($textExtensions -notcontains $extension -and [System.IO.Path]::GetFileName($relativePath) -ne '.env.example') {
        continue
    }

    $content = Get-Content -LiteralPath $absolutePath -Raw
    foreach ($secretPattern in $secretPatterns) {
        if ($content -match $secretPattern.Pattern) {
            $violations.Add("$($secretPattern.Name) detected in tracked workspace file: $relativePath")
        }
    }
}

if ($violations.Count -gt 0) {
    $violations | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output 'CLEAN_ROOM_BASELINE_CONFIRMED'
