[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$targets=@('app','components','features','supabase/migrations')|ForEach-Object{Join-Path $root $_}
$forbidden='(?i)(co_admin|coadmin|role\s*[:=]\s*["'']co-admin["'']|co-admin\s+(hinzufügen|ernennen|verwalten))'
$matches=& rg -n --glob '*.{ts,tsx,sql}' $forbidden @targets 2>$null
if($LASTEXITCODE -eq 0){$matches|Write-Error;throw 'Forbidden co-admin capability detected.'}
if($LASTEXITCODE -gt 1){throw 'Co-admin audit could not run.'}
Write-Output 'NO_CO_ADMIN_CAPABILITY_CONFIRMED'
