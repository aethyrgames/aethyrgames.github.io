<#
.SYNOPSIS
    Starts the video host's editor off screen (-RenderOffScreen: no window is shown and nothing takes focus). Never opens a visible window.
#>
param([string]$Map = "")
$Repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Project = Join-Path $Repo ".video\host\VideoHost.uproject"
$Log = Join-Path $Repo ".video\logs\editor.log"
$Args = @("`"$Project`"")
if ($Map) { $Args += $Map }
$Args += @("-RenderOffScreen", "-nosplash", "-unattended", "-NoSound", "-nosourcecontrol", "-ForceLogFlush", "-ABSLOG=`"$Log`"")
$p = Start-Process -FilePath "D:\Games\Epic Games\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe" -ArgumentList $Args -PassThru -WindowStyle Hidden
Set-Content -Path (Join-Path $Repo ".video\logs\editor.pid") -Value $p.Id
Write-Host "editor pid $($p.Id)"
