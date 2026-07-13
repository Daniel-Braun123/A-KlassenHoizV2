[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
# Direct dependencies and runtime source are authoritative for shipped telemetry. The lockfile is
# intentionally excluded because the dev-only Lighthouse CLI carries an unused Sentry transitive.
$paths = @('app','components','features','lib','public','next.config.ts','package.json')
$patterns = @(
  '(?i)console\.(log|debug|info)\s*\(',
  '(?i)(posthog|mixpanel|segment|amplitude|sentry|datadog|newrelic)',
  '(?i)(home_goals|away_goals|prediction).*?(console|logger|log\.)',
  '(?i)(email|token|roundName|round_name).*?(console|logger|log\.)'
)
$violations = [System.Collections.Generic.List[string]]::new()

foreach ($path in $paths) {
  $target = Join-Path $root $path
  if (-not (Test-Path -LiteralPath $target)) { continue }
  $files = if ((Get-Item -LiteralPath $target) -is [System.IO.DirectoryInfo]) {
    Get-ChildItem -LiteralPath $target -Recurse -File | Where-Object { $_.Extension -in @('.ts','.tsx','.js','.mjs','.json') }
  } else { @(Get-Item -LiteralPath $target) }
  foreach ($file in $files) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    foreach ($pattern in $patterns) {
      if ($file.FullName -eq (Join-Path $root 'lib\observability\logger.ts') -and $pattern -like '*console*') { continue }
      if ($content -match $pattern) { $violations.Add("$($file.FullName): $pattern") }
    }
  }
}

if ($violations.Count) { $violations | ForEach-Object { Write-Error $_ }; exit 1 }
Write-Output 'OBSERVABILITY_PRIVACY_BOUNDARY_CONFIRMED'
