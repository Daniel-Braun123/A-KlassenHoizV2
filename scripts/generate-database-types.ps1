[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$databaseScript = Join-Path $PSScriptRoot 'database.ps1'

& $databaseScript types
exit $LASTEXITCODE
