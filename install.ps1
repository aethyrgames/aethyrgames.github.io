<#
.SYNOPSIS
  Installs or updates the Aethyr plugin for ONE Unreal project.

.DESCRIPTION
  Bootstrap for https://aethyr.gg/install.md. In order, it:
    1. Finds the project (a .uproject, or a folder holding exactly one).
    2. Downloads the precompiled release zip and SHA256SUMS from
       github.com/aethyrgames/aethyr-mcp-releases, and checks the hash.
       Both zips carry AethyrMcp.exe. The setup command fetches the source
       flavor itself if your engine needs it.
    3. Unblocks the zip and extracts it to
       <Project>/Saved/Aethyr/setup-staging/<timestamp>/.
    4. Runs the staged AethyrMcp.exe "setup" command for that project and prints
       its summary: steps, scc, clients, next steps. The script exits with
       setup's exit code.

  It only touches the project you name. The staging folder lives under that
  project's Saved/ folder, and setup writes only inside the project and to the
  MCP client config files it reports. It needs no admin rights.

  It runs on Windows PowerShell 5.1 and PowerShell 7.

  Read it before you run it, and don't pipe it into iex. Run it from a saved
  copy:
    powershell -ExecutionPolicy Bypass -File install.ps1 -Project D:\Game\My.uproject

.PARAMETER Project
  A .uproject file or the folder that holds exactly one. If you leave it out,
  the current folder must hold one .uproject.

.PARAMETER Release
  A release tag such as v0.6.0 (a bare 0.6.0 works too). Default is the latest
  release.

.PARAMETER Zip
  Use this local release zip and skip the download. If a SHA256SUMS file sits
  next to it, the hash is checked.

.PARAMETER DryRun
  Preview. It still downloads and stages the zip (setup needs its exe), then
  runs setup with --dry-run so the plugin, the configs, and any running
  processes are left alone. Only the staging folder is written.

.PARAMETER SetupArgs
  Extra arguments passed to "AethyrMcp.exe setup". Give them as one quoted
  string, for example -SetupArgs '--no-epic-mcp --deny StalePlugin'. A real
  array works too when you call the script from inside PowerShell. Setup's
  flags are listed at https://aethyr.gg/install.md.

.NOTES
  Set AETHYR_UPDATE_REPO (owner/name) to download from a different releases repo.
#>
[CmdletBinding()]
param(
    [string]$Project,
    [string]$Release,
    [string]$Zip,
    [switch]$DryRun,
    [string[]]$SetupArgs
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$tag = '[Aethyr/install]'

function Stop-Install([string]$Message) {
    Write-Host "$tag REFUSED: $Message"
    exit 1
}

# TLS 1.2 for Windows PowerShell 5.1, which defaults to older protocols.
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch {}

# ---- 1. Find the project ----------------------------------------------------
$uproject = $null
if ($Project) {
    if (-not (Test-Path -LiteralPath $Project)) { Stop-Install "project not found: $Project" }
    $item = Get-Item -LiteralPath $Project
    if ($item.PSIsContainer) { $searchDir = $item.FullName } else { $searchDir = $null; $uproject = $item.FullName }
} else {
    $searchDir = (Get-Location).Path
}
if (-not $uproject) {
    $found = @(Get-ChildItem -LiteralPath $searchDir -Filter '*.uproject' -File -ErrorAction SilentlyContinue)
    if ($found.Count -eq 0) { Stop-Install "no .uproject in $searchDir. Pass -Project <dir or .uproject>." }
    if ($found.Count -gt 1) { Stop-Install "more than one .uproject in $searchDir. Pass -Project <.uproject>." }
    $uproject = $found[0].FullName
}
if ([IO.Path]::GetExtension($uproject) -ne '.uproject') { Stop-Install "not a .uproject file: $uproject" }
$projectDir = Split-Path -Parent $uproject
Write-Host "$tag Project: $uproject"

# ---- 2. Get the zip and check it -------------------------------------------
$stamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
$staging = Join-Path $projectDir "Saved\Aethyr\setup-staging\$stamp"
$assetName = 'Aethyr-plugin-precompiled.zip'
$repo = 'aethyrgames/aethyr-mcp-releases'
if ($env:AETHYR_UPDATE_REPO) { $repo = $env:AETHYR_UPDATE_REPO }

function Test-ZipHash([string]$ZipPath, [string]$SumsPath, [string]$Name) {
    # Returns $true on a match. Stops with a refusal on a mismatch or no entry.
    $expected = $null
    foreach ($line in (Get-Content -LiteralPath $SumsPath)) {
        if ($line -match '^([0-9a-fA-F]{64})\s+\*?(.+)$' -and $Matches[2].Trim() -ieq $Name) {
            $expected = $Matches[1].ToLower()
            break
        }
    }
    if (-not $expected) { Stop-Install "SHA256SUMS has no entry for $Name, so the download can't be verified." }
    $sha = [Security.Cryptography.SHA256]::Create()
    $fs = [IO.File]::OpenRead($ZipPath)
    try { $actual = ([BitConverter]::ToString($sha.ComputeHash($fs)) -replace '-', '').ToLower() }
    finally { $fs.Dispose(); $sha.Dispose() }
    if ($actual -ne $expected) {
        Stop-Install "checksum mismatch for $Name (expected $expected, got $actual). Nothing was installed."
    }
    return $true
}

New-Item -ItemType Directory -Force $staging | Out-Null

if ($Zip) {
    if (-not (Test-Path -LiteralPath $Zip)) { Stop-Install "zip not found: $Zip" }
    $zipPath = (Resolve-Path -LiteralPath $Zip).Path
    $sumsBeside = Join-Path (Split-Path -Parent $zipPath) 'SHA256SUMS'
    if (Test-Path -LiteralPath $sumsBeside) {
        [void](Test-ZipHash $zipPath $sumsBeside (Split-Path -Leaf $zipPath))
        Write-Host "$tag SHA256 verified against $sumsBeside."
    } else {
        Write-Host "$tag Using local zip $zipPath. No SHA256SUMS beside it, so the hash was not checked."
    }
} else {
    if ($Release) {
        $relTag = $Release
        if ($relTag -match '^\d') { $relTag = "v$relTag" }
        $base = "https://github.com/$repo/releases/download/$relTag"
    } else {
        $base = "https://github.com/$repo/releases/latest/download"
    }
    $zipPath = Join-Path $staging $assetName
    $sumsPath = Join-Path $staging 'SHA256SUMS'
    try {
        Write-Host "$tag Downloading $base/$assetName"
        Invoke-WebRequest -Uri "$base/$assetName" -OutFile $zipPath -UseBasicParsing -MaximumRedirection 5
        Invoke-WebRequest -Uri "$base/SHA256SUMS" -OutFile $sumsPath -UseBasicParsing -MaximumRedirection 5
    } catch {
        Stop-Install "download failed from $base : $($_.Exception.Message)"
    }
    [void](Test-ZipHash $zipPath $sumsPath $assetName)
    Write-Host "$tag SHA256 verified for $assetName."
}

# ---- 3. Unblock and extract -------------------------------------------------
try { Unblock-File -LiteralPath $zipPath } catch {}
Write-Host "$tag Extracting to $staging"
try {
    Expand-Archive -LiteralPath $zipPath -DestinationPath $staging -Force
} catch {
    Stop-Install "could not extract $zipPath : $($_.Exception.Message)"
}
$exe = Join-Path $staging 'Aethyr\Binaries\Win64\AethyrMcp.exe'
if (-not (Test-Path -LiteralPath $exe)) { Stop-Install "the zip has no Aethyr\Binaries\Win64\AethyrMcp.exe, so it isn't an Aethyr plugin zip." }
try { Unblock-File -LiteralPath $exe } catch {}

# ---- 4. Run setup -----------------------------------------------------------
$setupCmd = @('setup', '--project', $uproject, '--zip', $zipPath, '--json')
if ($DryRun -and -not ("$SetupArgs" -match '--dry-run')) { $setupCmd += '--dry-run' }
# Each element may hold several space-separated arguments. That keeps a single
# quoted string working under "powershell -File", which doesn't build arrays.
if ($SetupArgs) {
    foreach ($a in $SetupArgs) { $setupCmd += @(($a -split '\s+') | Where-Object { $_ }) }
}

$versionLine = ''
try { $versionLine = (& $exe --version 2>&1 | Select-Object -First 1) } catch {}
Write-Host "$tag Staged exe: $versionLine"
Write-Host "$tag Running: AethyrMcp.exe $($setupCmd -join ' ')"

$ErrorActionPreference = 'Continue'
$raw = & $exe @setupCmd
$code = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
$text = (@($raw) | ForEach-Object { "$_" }) -join "`n"

$summary = $null
try { $summary = $text | ConvertFrom-Json } catch {}
if (-not $summary) {
    Write-Host "$tag setup subcommand not found, or it didn't return a summary (exit $code)."
    Write-Host "$tag The setup command ships in Aethyr 0.6.0 and later. Staged exe: $versionLine"
    if ($text) {
        $lines = @($text -split "`n")
        $lines | Select-Object -First 6 | ForEach-Object { Write-Host "  $_" }
        if ($lines.Count -gt 6) { Write-Host "  ... ($($lines.Count - 6) more lines)" }
    }
    if ($code -eq 0) { $code = 1 }
    exit $code
}

# ---- 5. Print the summary ---------------------------------------------------
Write-Host ''
if ($summary.ok) { $verdict = 'ok' } else { $verdict = 'NOT ok' }
Write-Host "$tag Setup finished: $verdict. Version $($summary.version_before) -> $($summary.version_after), flavor $($summary.flavor)."
if ($summary.refused) { Write-Host "$tag Refused ($($summary.refused.code)): $($summary.refused.message)" }

Write-Host ''
Write-Host 'Steps:'
foreach ($s in @($summary.steps)) { Write-Host ("  [{0}] {1}: {2}" -f $s.status, $s.id, $s.detail) }

if ($summary.scc) {
    Write-Host ''
    Write-Host "Source control: $($summary.scc.kind)"
    $made = @($summary.scc.made_writable)
    if ($made.Count -gt 0 -and $made[0]) { Write-Host "  Made writable (not checked out): $($made.Count) file(s)" }
    if ($summary.scc.note) { Write-Host "  $($summary.scc.note)" }
}

if ($summary.clients) {
    Write-Host ''
    Write-Host 'MCP clients:'
    foreach ($c in @($summary.clients)) { Write-Host ("  [{0}] {1}: {2} {3}" -f $c.action, $c.id, $c.path, $c.detail) }
}

if ($summary.doctor) {
    Write-Host ''
    Write-Host "Doctor: $($summary.doctor.verdict) ($($summary.doctor.errors) errors, $($summary.doctor.warnings) warnings)"
}

$next = @($summary.next_steps)
if ($next.Count -gt 0 -and $next[0]) {
    Write-Host ''
    Write-Host 'Next steps:'
    $n = 1
    foreach ($ns in $next) {
        Write-Host ("  {0}. {1}: {2}" -f $n, $ns.id, $ns.why)
        if ($ns.command) { Write-Host "     $($ns.command)" }
        $n++
    }
}

Write-Host ''
Write-Host "$tag Staging folder (safe to delete once you're done): $staging"
exit $code
