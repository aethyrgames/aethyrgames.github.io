<#
.SYNOPSIS
    Installs the PUBLIC Aethyr release into the video host (.video\host) and builds the host editor.

.DESCRIPTION
    Downloads the release zips from github.com/aethyrgames/aethyr-mcp-releases (never from a local Aethyr-MCP checkout),
    checks them against SHA256SUMS, and runs the bundled `AethyrMcp.exe setup` against the host with the user-scope parts
    switched off (--clients none --no-skills --no-guidance), so nothing outside the host project is touched by setup.
    Then it builds VideoHostEditor (the host module plus Aethyr's own modules) with the engine's Build.bat.

    Run scripts\video\new_host.ps1 first. Re-running updates in place.

.PARAMETER Release
    A release tag such as v0.6.13. Default: the latest.
#>
param([string]$Release = "")

$ErrorActionPreference = "Stop"
$Repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Video = Join-Path $Repo ".video"
$Host_ = Join-Path $Video "host\VideoHost.uproject"
$Dir = Join-Path $Video "release"
New-Item -ItemType Directory -Force -Path $Dir | Out-Null

$tagArgs = @()
if ($Release) { $tagArgs = @($Release) }
gh release download @tagArgs --repo aethyrgames/aethyr-mcp-releases -p "Aethyr-plugin-precompiled.zip" -p "SHA256SUMS" --dir $Dir --clobber
$sums = Get-Content (Join-Path $Dir "SHA256SUMS")
$zip = Join-Path $Dir "Aethyr-plugin-precompiled.zip"
$want = ($sums | Where-Object { $_ -match "Aethyr-plugin-precompiled.zip" }) -replace "\s.*", ""
$have = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
if ($want.ToLower() -ne $have) { throw "SHA256 mismatch for the release zip" }

$stage = Join-Path $Dir "x"
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
Expand-Archive $zip $stage
& (Join-Path $stage "Aethyr\Binaries\Win64\AethyrMcp.exe") setup --project $Host_ --zip $zip --clients none --no-skills --no-guidance
if ($LASTEXITCODE -ne 0) { throw "setup failed" }

# The setup output's build_editor step. A short PATH entry lets vcvars find vswhere.
$env:PATH = "C:\Program Files (x86)\Microsoft Visual Studio\Installer;" + $env:PATH
& "D:\Games\Epic Games\UE_5.8\Engine\Build\BatchFiles\Build.bat" VideoHostEditor Win64 Development "-Project=$Host_" -WaitMutex
if ($LASTEXITCODE -ne 0) { throw "host build failed" }
Write-Host "Aethyr installed and the host editor built." -ForegroundColor Green
