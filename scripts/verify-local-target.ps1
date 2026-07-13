[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CommandArguments
)

$ErrorActionPreference = 'Stop'
$joined = ($CommandArguments -join ' ').Trim()
$blockedPatterns = @(
    '(?i)(^|\s)--linked(\s|$)',
    '(?i)(^|\s)--db-url(\s|=|$)',
    '(?i)\bdb\s+push\b',
    '(?i)\bmigration\s+repair\b',
    '(?i)\bewqzhdnfoozjzenzmtlm\b'
)

foreach ($pattern in $blockedPatterns) {
    if ($joined -match $pattern) {
        throw "Remote Supabase command blocked by local-target guard: $joined"
    }
}

if ($env:SUPABASE_DB_URL -and $env:SUPABASE_DB_URL -notmatch '(localhost|127\.0\.0\.1)') {
    throw 'Remote SUPABASE_DB_URL is not allowed in the local workflow.'
}

Write-Output 'LOCAL_TARGET_CONFIRMED'
