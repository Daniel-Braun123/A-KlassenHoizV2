[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$NpmArguments
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$nodeRoot = Join-Path $repositoryRoot '.tools\node-v24.18.0-win-x64'
$nodeExecutable = Join-Path $nodeRoot 'node.exe'
$npmCli = Join-Path $repositoryRoot '.tools\npm-11.18.0\node_modules\npm\bin\npm-cli.js'

if (-not (Test-Path -LiteralPath $nodeExecutable -PathType Leaf)) {
    throw 'Project Node 24.18.0 is missing. Install the verified portable runtime first.'
}

if (-not (Test-Path -LiteralPath $npmCli -PathType Leaf)) {
    throw 'Project npm 11.18.0 is missing. Install the verified project-local npm runtime first.'
}

if ($NpmArguments.Count -eq 0) {
    $NpmArguments = @('--version')
}

$env:Path = "$nodeRoot;$env:Path"
& $nodeExecutable $npmCli @NpmArguments
exit $LASTEXITCODE
