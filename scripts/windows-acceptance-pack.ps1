# Xyeena Rig Windows source preflight — NO model calls, no hook installs, no native PASS assertion.
# Run on the existing repository from PowerShell 5.1+; accepts a separate repo path.
[CmdletBinding()]
param(
  [string]$RepoDir = (Get-Location).Path,
  [switch]$UseCurrentSource,
  [string]$OutputDir = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$createdWorktree = $false
$sourceDir = ''

function Invoke-GitOrFail {
  param([string[]]$GitArgs)
  $output = @(& git -C $RepoDir @GitArgs 2>&1)
  if ($LASTEXITCODE -ne 0) { throw ('Git step failed: ' + $GitArgs[0]) }
  return ($output -join [Environment]::NewLine)
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
  if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.(\d+)\.') {
    throw 'Cannot read Node.js version'
  }
  $major = [int]$Matches[1]
  $minor = [int]$Matches[2]
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
    $head = (Invoke-GitOrFail -GitArgs @('rev-parse','refs/remotes/origin/main')).Trim()
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
  if ($preflight.schema -ne 1 -or $preflight.modelCallPerformed -ne $false -or
      $preflight.filesModified -ne $false -or $preflight.guidedHook.hostEnforcement -ne 'UNVERIFIED') {
    throw 'Preflight reported an unexpected or unsafe result'
  }

  $after = @(& git -C $RepoDir status --porcelain --untracked-files=all) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0 -or $before -cne $after) {
    throw 'User checkout changed during preflight; inspect it before continuing'
  }
  $evidence = [ordered]@{
    schema = 1
    verdict = 'SOURCE_PREFLIGHT_PASS_LIVE_PENDING'
    sourceCommit = $head
    nodeVersion = $nodeVersion
    existingCheckoutUnchanged = $true
    preflight = $preflight
    nativeAcceptance = [ordered]@{
      antigravityIde = 'LIVE_BLOCKED_REQUIRES_IN_IDE_NEGATIVE_TEST'
      simpul = 'LIVE_BLOCKED_REQUIRES_AUTHENTICATED_SUPERVISOR'
      codexClaudeGemini = 'LIVE_BLOCKED_OR_PENDING_PER_HOST'
      hermes = 'LIVE_PARTIAL_REQUIRES_REAL_CANCEL_AND_BILLING_EVIDENCE'
    }
    limitations = 'Read-only prerequisite report: not native interception, approval, cancellation, execution readiness or provider hard cap'
  }
  $json = ConvertTo-Json -InputObject $evidence -Depth 20
  $reportPath = Join-Path $OutputDir 'rig-windows-evidence.json'
  [System.IO.File]::WriteAllText($reportPath, $json, (New-Object System.Text.UTF8Encoding($false)))
  Write-Output 'PASS: read-only source preflight; existing checkout unchanged.'
  Write-Output ('Source commit: ' + $head)
  Write-Output ('Evidence JSON: ' + $reportPath)
  Write-Output 'LIVE PENDING: Antigravity IDE, Simpul, Codex/Claude/Gemini, Hermes cancellation/provider billing.'
} finally {
  if ($createdWorktree) {
    # This was created here using a random unused temporary directory.
    # No -Force: if changed, Git refuses to remove it and preserves the files.
    $remove = @(& git -C $RepoDir worktree remove $sourceDir 2>&1)
    if ($LASTEXITCODE -ne 0) {
      Write-Warning 'Temporary worktree was not clean; inspect and remove it manually. No forced removal was attempted.'
    }
  }
}
