[CmdletBinding(SupportsShouldProcess=$true,ConfirmImpact='High')]
param([Parameter(Mandatory=$true)][ValidateSet('local','linked')][string]$Target)
$ErrorActionPreference='Stop'
if($Target -ne 'local'){throw 'Linked score rebuild requires a separately reviewed production runbook and explicit approval.'}
$root=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if(-not $PSCmdlet.ShouldProcess('local Supabase score read model','rebuild from canonical results and score function')){return}
& (Join-Path $root 'node_modules\.bin\supabase.cmd') db query --local 'select private.rebuild_all_scores();'
if($LASTEXITCODE -ne 0){throw 'Score rebuild failed.'}
