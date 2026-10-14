// Adapted from Tether's Tools/NewScreenshotHost.ps1 (UShotLibrary). Slate-event input and window capture for the video host.
#pragma once

#include "CoreMinimal.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "Shot.generated.h"

// Drives and captures the editor's own windows through Slate, so the editor can sit off screen while the site's
// screenshots are taken. Window-relative coordinates are in the window's pixels. An empty title means the main window
// for Capture and MoveWindow, and "the topmost window under the point" for Click, which is how menu items get clicked.
UCLASS()
class UShotLibrary : public UBlueprintFunctionLibrary
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable, Category = "Shot")
	static bool Capture(const FString& WindowTitle, const FString& Path, int32 X, int32 Y, int32 W, int32 H);

	// One line per window, children included: "title|x,y,w,h".
	UFUNCTION(BlueprintCallable, Category = "Shot")
	static FString Windows();

	UFUNCTION(BlueprintCallable, Category = "Shot")
	static bool MoveWindow(const FString& WindowTitle, int32 X, int32 Y, int32 W, int32 H);

	UFUNCTION(BlueprintCallable, Category = "Shot")
	static bool Click(const FString& WindowTitle, float X, float Y, bool bRight);

	UFUNCTION(BlueprintCallable, Category = "Shot")
	static bool Hover(const FString& WindowTitle, float X, float Y);

	UFUNCTION(BlueprintCallable, Category = "Shot")
	static void TypeText(const FString& Text);

	UFUNCTION(BlueprintCallable, Category = "Shot")
	static void PressKey(const FString& KeyName);

	// A key with modifiers held, for shortcuts like Ctrl+Z.
	UFUNCTION(BlueprintCallable, Category = "Shot")
	static void PressKeyWithModifiers(const FString& KeyName, bool bCtrl, bool bShift, bool bAlt);

	UFUNCTION(BlueprintCallable, Category = "Shot")
	static bool DoubleClick(const FString& WindowTitle, float X, float Y);

	// Positive Delta scrolls up.
	UFUNCTION(BlueprintCallable, Category = "Shot")
	static bool Scroll(const FString& WindowTitle, float X, float Y, float Delta);

	// Whether Capture draws a ring where the last synthesized pointer event landed. On by default.
	UFUNCTION(BlueprintCallable, Category = "Shot")
	static void SetCursorRing(bool bOn);

	// Throws away every unsaved change and loads the map from disk, with no save prompt. MapPath is a long package name.
	UFUNCTION(BlueprintCallable, Category = "Shot")
	static bool DiscardAndLoad(const FString& MapPath);

	// Scales the whole editor UI like Editor Preferences > Application Scale, so text is readable in a 1920x1080 capture.
	UFUNCTION(BlueprintCallable, Category = "Shot")
	static void SetApplicationScale(float Scale);

	// Fixes every level viewport's exposure at EV100, the Lit menu's Exposure setting, so auto exposure can't wash colors out.
	UFUNCTION(BlueprintCallable, Category = "Shot")
	static void SetViewportExposure(float EV100);

	// A drag in three parts, so frames can be captured while the button is held. Screen coordinates, like an empty-title Click.
	UFUNCTION(BlueprintCallable, Category = "Shot")
	static bool PointerDown(float X, float Y);

	UFUNCTION(BlueprintCallable, Category = "Shot")
	static bool PointerMove(float X, float Y);

	UFUNCTION(BlueprintCallable, Category = "Shot")
	static bool PointerUp(float X, float Y);

	// Every visible widget whose type contains TypeFilter and whose text contains TextFilter, one per line:
	// "window|type|x,y,w,h|text". Rectangles are relative to the main window, so they match Capture and Click. Empty filters match all.
	UFUNCTION(BlueprintCallable, Category = "Shot")
	static FString Widgets(const FString& TypeFilter, const FString& TextFilter);
};
