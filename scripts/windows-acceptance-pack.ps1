# Xyeena Rig Windows source preflight — NO model calls, no hook installs, no native PASS assertion.
# Run on the existing repository from PowerShell 5.1+; accepts a separate repo path.
[CmdletBinding()]
param(
  [string]$RepoDir = (Get-Location).Path,
  [switch]$UseCurrentSource,
  [ValidateSet('refs/remotes/origin/main','HEAD')]
  [string]$SourceRef = 'refs/remotes/origin/main',
  [string]$OutputDir = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$createdWorktree = $false
$sourceDir = ''

function Invoke-GitOrFail {
  param([string[]]$GitArgs)
  # Windows PowerShell 5.1 converts *normal* native Git stderr progress
  # (for example "From github.com..." or "Preparing worktree") into a
  # NativeCommandError record. With ErrorActionPreference=Stop, 2>&1
  # would otherwise terminate this script despite git exit code 0.
  # Relax the preference only inside this native invocation, then restore it.
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = 'Continue'
    $output = @(& git -C $RepoDir @GitArgs 2>&1)
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($exitCode -ne 0) {
    throw ('Git step failed: ' + $GitArgs[0] + ' (exit ' + $exitCode + ')')
  }
  # Git's progress/error records must never contaminate parsed stdout
  # (e.g. the exact origin URL or SHA).
  return (($output | Where-Object { $_ -is [string] }) -join [Environment]::NewLine)
}

try {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git is required' }
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js >=22.14 is required' }
  $RepoDir = (Resolve-Path -LiteralPath $RepoDir).Path
  $origin = (Invoke-GitOrFail -GitArgs @('remote','get-url','origin')).Trim()
  if ($origin -notmatch '(?i)github[.]com[:/]rzqllh/xyeena([.]git)?$') {
    throw 'Origin is not the intended rzqllh/xyeena repository'
  }
  $nodeVersion = (& node --version).Trim()
  $versionMatch = [regex]::Match($nodeVersion, '^v(\d+)\.(\d+)\.')
  if ($LASTEXITCODE -ne 0 -or -not $versionMatch.Success) {
    throw 'Cannot read Node.js version'
  }
  $major = [int]$versionMatch.Groups[1].Value
  $minor = [int]$versionMatch.Groups[2].Value
  if ($major -lt 22 -or ($major -eq 22 -and $minor -lt 14)) {
    throw 'Node.js 22.14+ is required'
  }
  $before = @(& git -C $RepoDir status --porcelain --untracked-files=all) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0) { throw 'Cannot inspect workspace status' }

  if ($UseCurrentSource) {
    $sourceDir = $RepoDir
    $head = (Invoke-GitOrFail -GitArgs @('rev-parse','HEAD')).Trim()
  } else {
    # Fetch never resets the current checkout. The new worktree is uniquely named.
    Invoke-GitOrFail -GitArgs @('fetch','--no-tags','origin','main') | Out-Null
    # CI may use HEAD on a PR to exercise its updated script and CLI. The
    # default always uses freshly fetched main for normal operator use.
    $head = (Invoke-GitOrFail -GitArgs @('rev-parse',$SourceRef)).Trim()
    $sourceDir = Join-Path ([System.IO.Path]::GetTempPath()) ('xyeena-rig-source-' + [guid]::NewGuid().ToString('N'))
    Invoke-GitOrFail -GitArgs @('worktree','add','--detach',$sourceDir,$head) | Out-Null
    $createdWorktree = $true
  }

  if (-not $OutputDir) {
    $OutputDir = Join-Path ([System.IO.Path]::GetTempPath()) ('xyeena-rig-evidence-' + [guid]::NewGuid().ToString('N'))
  }
  $OutputDir = [System.IO.Path]::GetFullPath($OutputDir)
  if ($OutputDir.StartsWith($RepoDir + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Evidence output must be outside the user repository'
  }
  if (Test-Path -LiteralPath $OutputDir) { throw 'Evidence folder already exists; select a fresh path' }
  New-Item -ItemType Directory -Path $OutputDir -ErrorAction Stop | Out-Null

  $cli = Join-Path $sourceDir 'bin/xyeena.mjs'
  $raw = @(& node $cli ops preflight --dir $RepoDir) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0) { throw 'Xyeena source preflight failed' }
  $preflight = $raw | ConvertFrom-Json
  if ($preflight.schema -ne 1 -or $preflight.project -ne 'xyeena-rig' -or
      $preflight.acceptanceScope -ne 'rig-native-hosts' -or
      $preflight.PSObject.Properties.Name -contains 'simpul' -or
      ($preflight.remainingGates | Where-Object { $_.issue -eq 35 }) -or
      $preflight.modelCallPerformed -ne $false -or
      $preflight.filesModified -ne $false -or $preflight.guidedHook.hostEnforcement -ne 'UNVERIFIED') {
    throw 'Preflight reported an unexpected or unsafe result'
  }

  $after = @(& git -C $RepoDir status --porcelain --untracked-files=all) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0 -or $before -cne $after) {
    throw 'User checkout changed during preflight; inspect it before continuing'
  }
  $evidence = [ordered]@{
    schema = 1
    project = 'xyeena-rig'
    acceptanceScope = 'rig-native-hosts'
    verdict = 'SOURCE_PREFLIGHT_PASS_LIVE_PENDING'
    sourceCommit = $head
    nodeVersion = $nodeVersion
    existingCheckoutUnchanged = $true
    preflight = $preflight
    nativeAcceptance = [ordered]@{
      antigravityIde = 'LIVE_BLOCKED_REQUIRES_IN_IDE_NEGATIVE_TEST'
      codexClaudeGemini = 'LIVE_BLOCKED_OR_PENDING_PER_HOST'
      hermes = 'LIVE_PARTIAL_REQUIRES_REAL_HOST_CANCEL_EVIDENCE'
    }
    limitations = 'RIG-native prerequisite report only: not native interception, approval, cancellation or execution readiness; optional subagent transports and provider billing are separately scoped'
  }
  $json = ConvertTo-Json -InputObject $evidence -Depth 20
  $reportPath = Join-Path $OutputDir 'rig-windows-evidence.json'
  [System.IO.File]::WriteAllText($reportPath, $json, (New-Object System.Text.UTF8Encoding($false)))
  Write-Output 'PASS: read-only source preflight; existing checkout unchanged.'
  Write-Output ('Source commit: ' + $head)
  Write-Output ('Evidence JSON: ' + $reportPath)
  Write-Output 'RIG LIVE PENDING: Antigravity IDE, Codex/Claude/Gemini, Hermes native cancellation.'
} finally {
  if ($createdWorktree) {
    # This was created here using a random unused temporary directory.
    # No -Force: if changed, Git refuses to remove it and preserves the files.
    try {
      Invoke-GitOrFail -GitArgs @('worktree','remove',$sourceDir) | Out-Null
    } catch {
      Write-Warning 'Temporary worktree was not clean; inspect and remove it manually. No forced removal was attempted.'
    }
  }
}
