<#
.SYNOPSIS
    Scaffolds the disposable UE 5.8 host the Ritual videos are recorded in, under .video\host.

.DESCRIPTION
    Adapted from Tether's Tools\NewScreenshotHost.ps1. A small C++ project with one module that holds UShotLibrary
    (Slate-event input, widget discovery, window capture, application scale) and the engine's Python plugin with
    remote execution on, so scripts\video\record.py can drive the editor. It carries no Tether content and no Aethyr content.
    The public Aethyr release is installed into it separately by scripts\video\install_aethyr.ps1.

    Safe to delete. Re-run to recreate it. Idempotent.
#>
param(
    [string]$HostPath = ""
)

$ErrorActionPreference = "Stop"

$Repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $HostPath) { $HostPath = Join-Path $Repo ".video\host" }
$Name = "VideoHost"

New-Item -ItemType Directory -Force -Path (Join-Path $HostPath "Source\$Name") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $HostPath "Config") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $HostPath "Plugins") | Out-Null

$Uproject = @"
{
	"FileVersion": 3,
	"EngineAssociation": "5.8",
	"Category": "",
	"Description": "Disposable host for the Aethyr Ritual videos. Not a game.",
	"Modules": [
		{
			"Name": "$Name",
			"Type": "Runtime",
			"LoadingPhase": "Default"
		}
	],
	"Plugins": [
		{ "Name": "PythonScriptPlugin", "Enabled": true },
		{ "Name": "EditorScriptingUtilities", "Enabled": true }
	]
}
"@

# Remote execution on the loopback only. The editor must not throttle when it isn't the foreground window, and must not
# auto-save or restore anything, since every scene starts from a known state.
$DefaultEngine = @"
[/Script/PythonScriptPlugin.PythonScriptPluginSettings]
bRemoteExecution=True
RemoteExecutionMulticastGroupEndpoint=239.0.0.1:6766
RemoteExecutionMulticastBindAddress=127.0.0.1
RemoteExecutionSendBufferSizeBytes=2097152
RemoteExecutionReceiveBufferSizeBytes=2097152
RemoteExecutionMulticastTtl=0

[/Script/UnrealEd.EditorPerformanceSettings]
bThrottleCPUWhenNotForeground=False
bMonitorEditorPerformance=False
"@

$DefaultEditorPerProject = @"
[/Script/UnrealEd.EditorLoadingSavingSettings]
bAutoSaveEnable=False
bRestoreOpenAssetTabsOnRestart=False
bPromptForCheckoutOnAssetModification=False
"@

$GameTarget = @"
using UnrealBuildTool;
using System.Collections.Generic;

public class ${Name}Target : TargetRules
{
	public ${Name}Target(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V7;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_8;
		ExtraModuleNames.Add("$Name");
	}
}
"@

$EditorTarget = @"
using UnrealBuildTool;
using System.Collections.Generic;

public class ${Name}EditorTarget : TargetRules
{
	public ${Name}EditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.V7;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_8;
		ExtraModuleNames.Add("$Name");
	}
}
"@

$BuildCs = @"
using UnrealBuildTool;

public class $Name : ModuleRules
{
	public $Name(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine" });
		PrivateDependencyModuleNames.AddRange(new string[] { "ApplicationCore", "InputCore", "Slate", "SlateCore" });
		if (Target.bBuildEditor)
		{
			PrivateDependencyModuleNames.Add("UnrealEd");
		}
	}
}
"@

$ModuleCpp = @"
#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"

IMPLEMENT_PRIMARY_GAME_MODULE(FDefaultGameModuleImpl, $Name, "$Name");
"@

$Utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $HostPath "$Name.uproject"), $Uproject, $Utf8)
[System.IO.File]::WriteAllText((Join-Path $HostPath "Config\DefaultEngine.ini"), $DefaultEngine, $Utf8)
[System.IO.File]::WriteAllText((Join-Path $HostPath "Config\DefaultEditorPerProjectUserSettings.ini"), $DefaultEditorPerProject, $Utf8)
[System.IO.File]::WriteAllText((Join-Path $HostPath "Source\$Name.Target.cs"), $GameTarget, $Utf8)
[System.IO.File]::WriteAllText((Join-Path $HostPath "Source\${Name}Editor.Target.cs"), $EditorTarget, $Utf8)
[System.IO.File]::WriteAllText((Join-Path $HostPath "Source\$Name\$Name.Build.cs"), $BuildCs, $Utf8)
[System.IO.File]::WriteAllText((Join-Path $HostPath "Source\$Name\$Name.cpp"), $ModuleCpp, $Utf8)
Copy-Item -Force (Join-Path $PSScriptRoot "host\Shot.h") (Join-Path $HostPath "Source\$Name\Shot.h")
Copy-Item -Force (Join-Path $PSScriptRoot "host\Shot.cpp") (Join-Path $HostPath "Source\$Name\Shot.cpp")

Write-Host "Video host ready: $(Join-Path $HostPath "$Name.uproject")" -ForegroundColor Green
