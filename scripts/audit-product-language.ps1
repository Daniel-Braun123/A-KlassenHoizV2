[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$targets = @('app','components','features','public')
$pattern = '(?i)(^|[^\p{L}])(echtgeld(?:wette|wetten)?|wette|wetten|wettquote|quoten|buchmacher|casino|betting|wager|einsatz|jackpot|gewinnchance)([^\p{L}]|$)'
$violations = [System.Collections.Generic.List[string]]::new()
foreach ($target in $targets) {
  Get-ChildItem -LiteralPath (Join-Path $root $target) -Recurse -File |
    Where-Object { $_.Extension -in @('.ts','.tsx','.js','.json','.webmanifest','.html') } |
    ForEach-Object {
      $line = 0
      Get-Content -LiteralPath $_.FullName | ForEach-Object {
        $line++
        if ($_ -match $pattern) { $violations.Add("$($_.FullName):$line") }
      }
    }
}
if ($violations.Count) { $violations | ForEach-Object { Write-Error "Forbidden product language: $_" }; exit 1 }
Write-Output 'PRODUCT_LANGUAGE_CONFIRMED'

