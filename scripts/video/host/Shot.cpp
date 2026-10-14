// Adapted from Tether's Tools/NewScreenshotHost.ps1 (UShotLibrary). Slate-event input and window capture for the video host.
#include "Shot.h"
#if WITH_EDITOR
#include "Editor.h"
#include "EngineUtils.h"
#include "FileHelpers.h"
#include "Framework/Application/SlateApplication.h"
#include "GenericPlatform/GenericWindow.h"
#include "ImageUtils.h"
#include "InputCoreTypes.h"
#include "LevelEditorViewport.h"
#include "Misc/FileHelper.h"
#include "Misc/PackageName.h"
#include "Rendering/SlateRenderer.h"
#include "UObject/Package.h"
#include "Widgets/Input/SEditableText.h"
#include "Widgets/Input/SEditableTextBox.h"
#include "Widgets/SWindow.h"
#include "Widgets/Text/SRichTextBlock.h"
#include "Widgets/Text/STextBlock.h"

namespace Shot
{
	// Where the last synthesized pointer event landed, in screen space, so a capture can draw a cursor there.
	static FVector2D LastPointer(-1.0, -1.0);
	static bool bCursorRing = true;
	static bool bLeftDown = false;

	static void Collect(const TSharedRef<SWindow>& Window, TArray<TSharedRef<SWindow>>& Out)
	{
		Out.Add(Window);
		for (const TSharedRef<SWindow>& Child : Window->GetChildWindows())
		{
			Collect(Child, Out);
		}
	}

	static TArray<TSharedRef<SWindow>> All()
	{
		TArray<TSharedRef<SWindow>> all;
		for (const TSharedRef<SWindow>& Window : FSlateApplication::Get().GetTopLevelWindows())
		{
			Collect(Window, all);
		}
		return all;
	}

	static TSharedPtr<SWindow> Find(const FString& Title)
	{
		for (const TSharedRef<SWindow>& Window : All())
		{
			if (Title.IsEmpty() ? Window->IsRegularWindow() : Window->GetTitle().ToString().Contains(Title))
			{
				return Window;
			}
		}
		return nullptr;
	}

	static TSharedPtr<SWindow> Under(const FVector2D& ScreenPos)
	{
		TSharedPtr<SWindow> found;
		for (const TSharedRef<SWindow>& Window : All())
		{
			if (Window->IsVisible() && Window->GetRectInScreen().ContainsPoint(ScreenPos))
			{
				found = Window;
			}
		}
		return found;
	}

	// TakeScreenshot leaves the renderer holding OutColors when the window skips its draw, and a later frame writes into it
	// after it's gone. Parking it on a static array with no window after every call keeps a missed capture from corrupting
	// the heap. The renderer asserts on a null array, which is why it isn't simply cleared.
	bool Screenshot(const TSharedRef<SWindow>& Window, const FIntRect& Area, TArray<FColor>& OutColors, FIntVector& OutSize)
	{
		static TArray<FColor> Parked;
		const bool bTaken = FSlateApplication::Get().TakeScreenshot(Window, Area, OutColors, OutSize);
		FSlateApplication::Get().GetRenderer()->PrepareToTakeScreenshot(FIntRect(), &Parked, nullptr);
		return bTaken;
	}
}

bool UShotLibrary::Capture(const FString& WindowTitle, const FString& Path, int32 X, int32 Y, int32 W, int32 H)
{
	TSharedPtr<SWindow> window = Shot::Find(WindowTitle);
	if (!window.IsValid())
	{
		return false;
	}

	TArray<FColor> colors;
	FIntVector size;
	const FIntRect area = (W > 0 && H > 0) ? FIntRect(X, Y, X + W, Y + H) : FIntRect();
	if (!Shot::Screenshot(window.ToSharedRef(), area, colors, size))
	{
		return false;
	}

	// Popups, menus, and floating tabs are windows of their own. Blit every visible popup but tooltips, and every window
	// floating over this one, into the capture so they show. All() lists a parent before its children, which is draw order.
	const FVector2D origin = window->GetPositionInScreen() + FVector2D(area.Min.X, area.Min.Y);
	for (const TSharedRef<SWindow>& Popup : Shot::All())
	{
		const bool bFloating = Popup->IsRegularWindow() && Popup->GetParentWindow() == window;
		if (Popup == window || !Popup->IsVisible() || Popup->GetType() == EWindowType::ToolTip || (Popup->IsRegularWindow() && !bFloating))
		{
			continue;
		}

		TArray<FColor> popupColors;
		FIntVector popupSize;
		if (!Shot::Screenshot(Popup, FIntRect(), popupColors, popupSize))
		{
			continue;
		}

		const FVector2D offset = Popup->GetPositionInScreen() - origin;
		for (int32 y = 0; y < popupSize.Y; ++y)
		{
			const int32 targetY = y + FMath::RoundToInt(offset.Y);
			if (targetY < 0 || targetY >= size.Y)
			{
				continue;
			}

			for (int32 x = 0; x < popupSize.X; ++x)
			{
				const int32 targetX = x + FMath::RoundToInt(offset.X);
				if (targetX >= 0 && targetX < size.X)
				{
					colors[targetY * size.X + targetX] = popupColors[y * popupSize.X + x];
				}
			}
		}
	}

	// A ring where the pointer is, since Slate draws no cursor into a capture.
	const FVector2D cursor = Shot::LastPointer - origin;
	if (Shot::bCursorRing && Shot::LastPointer.X >= 0.0)
	{
		for (int32 y = -14; y <= 14; ++y)
		{
			for (int32 x = -14; x <= 14; ++x)
			{
				const float distance = FMath::Sqrt(float(x * x + y * y));
				if (distance < 9.0f || distance > 13.0f)
				{
					continue;
				}

				const int32 px = FMath::RoundToInt(cursor.X) + x;
				const int32 py = FMath::RoundToInt(cursor.Y) + y;
				if (px >= 0 && px < size.X && py >= 0 && py < size.Y)
				{
					colors[py * size.X + px] = FColor(255, 160, 40);
				}
			}
		}
	}

	for (FColor& Color : colors)
	{
		Color.A = 255;
	}

	TArray64<uint8> png;
	FImageUtils::PNGCompressImageArray(size.X, size.Y, colors, png);
	return FFileHelper::SaveArrayToFile(png, *Path);
}

FString UShotLibrary::Windows()
{
	FString out;
	for (const TSharedRef<SWindow>& Window : Shot::All())
	{
		const FSlateRect rect = Window->GetRectInScreen();
		out += FString::Printf(TEXT("%s|%d,%d,%d,%d|%s\n"), *Window->GetTitle().ToString(), (int32)rect.Left, (int32)rect.Top, (int32)rect.GetSize().X, (int32)rect.GetSize().Y, Window->IsVisible() ? TEXT("visible") : TEXT("hidden"));
	}
	return out;
}

bool UShotLibrary::MoveWindow(const FString& WindowTitle, int32 X, int32 Y, int32 W, int32 H)
{
	TSharedPtr<SWindow> window = Shot::Find(WindowTitle);
	if (!window.IsValid())
	{
		return false;
	}

	window->ReshapeWindow(FVector2D(X, Y), FVector2D(W, H));
	return true;
}

static bool ShotPointer(const FString& WindowTitle, float X, float Y, bool bRight, bool bClick)
{
	FVector2D screenPos(X, Y);
	TSharedPtr<SWindow> window = Shot::Find(WindowTitle);
	if (WindowTitle.IsEmpty())
	{
		window = Shot::Under(screenPos);
	}
	else if (window.IsValid())
	{
		screenPos += window->GetPositionInScreen();
	}

	if (!window.IsValid())
	{
		return false;
	}

	Shot::LastPointer = screenPos;
	FSlateApplication& slate = FSlateApplication::Get();
	const FPointerEvent move(0, screenPos, screenPos, TSet<FKey>(), FKey(), 0.0f, FModifierKeysState());
	slate.ProcessMouseMoveEvent(move);
	if (!bClick)
	{
		return true;
	}

	const FKey button = (bRight) ? EKeys::RightMouseButton : EKeys::LeftMouseButton;
	TSet<FKey> pressed;
	pressed.Add(button);
	const FPointerEvent down(0, screenPos, screenPos, pressed, button, 0.0f, FModifierKeysState());
	slate.ProcessMouseButtonDownEvent(window->GetNativeWindow(), down);
	const FPointerEvent up(0, screenPos, screenPos, TSet<FKey>(), button, 0.0f, FModifierKeysState());
	slate.ProcessMouseButtonUpEvent(up);

	// Slate keeps a popup inside a real monitor, which drags a menu back on screen when the editor sits off it. Put any popup
	// that landed outside the editor window back at the click, before it paints.
	const FSlateRect editorRect = window->GetRectInScreen();
	FDisplayMetrics metrics;
	FSlateApplication::Get().GetCachedDisplayMetrics(metrics);
	const FPlatformRect& primary = metrics.PrimaryDisplayWorkAreaRect;
	const bool bEditorOnScreen = editorRect.Left < primary.Right && editorRect.Right > primary.Left && editorRect.Top < primary.Bottom && editorRect.Bottom > primary.Top;
	for (const TSharedRef<SWindow>& Popup : Shot::All())
	{
		if (bEditorOnScreen)
		{
			break;
		}

		if (!Popup->IsRegularWindow() && Popup->IsVisible() && !editorRect.ContainsPoint(Popup->GetPositionInScreen() + FVector2D(1.0, 1.0)))
		{
			Popup->MoveWindowTo(screenPos);
		}
	}

	return true;
}

bool UShotLibrary::DoubleClick(const FString& WindowTitle, float X, float Y)
{
	if (!ShotPointer(WindowTitle, X, Y, false, true))
	{
		return false;
	}

	FVector2D screenPos = Shot::LastPointer;
	TSharedPtr<SWindow> window = Shot::Under(screenPos);
	if (!window.IsValid())
	{
		return false;
	}

	TSet<FKey> pressed;
	pressed.Add(EKeys::LeftMouseButton);
	FSlateApplication& slate = FSlateApplication::Get();
	const FPointerEvent down(0, screenPos, screenPos, pressed, EKeys::LeftMouseButton, 0.0f, FModifierKeysState());
	slate.ProcessMouseButtonDoubleClickEvent(window->GetNativeWindow(), down);
	const FPointerEvent up(0, screenPos, screenPos, TSet<FKey>(), EKeys::LeftMouseButton, 0.0f, FModifierKeysState());
	slate.ProcessMouseButtonUpEvent(up);
	return true;
}

bool UShotLibrary::Scroll(const FString& WindowTitle, float X, float Y, float Delta)
{
	if (!ShotPointer(WindowTitle, X, Y, false, false))
	{
		return false;
	}

	const FVector2D screenPos = Shot::LastPointer;
	const FPointerEvent wheel(0, screenPos, screenPos, TSet<FKey>(), EKeys::MouseWheelAxis, Delta, FModifierKeysState());
	return FSlateApplication::Get().ProcessMouseWheelOrGestureEvent(wheel, nullptr);
}

void UShotLibrary::SetCursorRing(bool bOn)
{
	Shot::bCursorRing = bOn;
}

static TSet<FKey> ShotHeld()
{
	TSet<FKey> held;
	if (Shot::bLeftDown)
	{
		held.Add(EKeys::LeftMouseButton);
	}
	return held;
}

bool UShotLibrary::PointerDown(float X, float Y)
{
	const FVector2D screenPos(X, Y);
	TSharedPtr<SWindow> window = Shot::Under(screenPos);
	if (!window.IsValid())
	{
		return false;
	}

	FSlateApplication& slate = FSlateApplication::Get();
	Shot::LastPointer = screenPos;
	slate.ProcessMouseMoveEvent(FPointerEvent(0, screenPos, screenPos, ShotHeld(), FKey(), 0.0f, FModifierKeysState()));
	Shot::bLeftDown = true;
	slate.ProcessMouseButtonDownEvent(window->GetNativeWindow(), FPointerEvent(0, screenPos, screenPos, ShotHeld(), EKeys::LeftMouseButton, 0.0f, FModifierKeysState()));
	return true;
}

bool UShotLibrary::PointerMove(float X, float Y)
{
	const FVector2D screenPos(X, Y);
	const FVector2D last = Shot::LastPointer;
	Shot::LastPointer = screenPos;
	return FSlateApplication::Get().ProcessMouseMoveEvent(FPointerEvent(0, screenPos, last, ShotHeld(), FKey(), 0.0f, FModifierKeysState()));
}

bool UShotLibrary::PointerUp(float X, float Y)
{
	const FVector2D screenPos(X, Y);
	PointerMove(X, Y);
	Shot::bLeftDown = false;
	return FSlateApplication::Get().ProcessMouseButtonUpEvent(FPointerEvent(0, screenPos, screenPos, ShotHeld(), EKeys::LeftMouseButton, 0.0f, FModifierKeysState()));
}

void UShotLibrary::SetApplicationScale(float Scale)
{
	FSlateApplication::Get().SetApplicationScale(Scale);
}

bool UShotLibrary::DiscardAndLoad(const FString& MapPath)
{
	TArray<UPackage*> dirty;
	FEditorFileUtils::GetDirtyWorldPackages(dirty);
	FEditorFileUtils::GetDirtyContentPackages(dirty);
	for (UPackage* Package : dirty)
	{
		Package->SetDirtyFlag(false);
	}

	const FString filename = FPackageName::LongPackageNameToFilename(MapPath, FPackageName::GetMapPackageExtension());
	return FEditorFileUtils::LoadMap(filename, false, false);
}

void UShotLibrary::SetViewportExposure(float EV100)
{
	for (FLevelEditorViewportClient* Client : GEditor->GetLevelViewportClients())
	{
		Client->ExposureSettings.bFixed = true;
		Client->ExposureSettings.FixedEV100 = EV100;
		Client->Invalidate();
	}
}

void UShotLibrary::PressKeyWithModifiers(const FString& KeyName, bool bCtrl, bool bShift, bool bAlt)
{
	const FKey key(*KeyName);
	const uint32 keyCode = 0;
	const FModifierKeysState modifiers(bShift, false, bCtrl, false, bAlt, false, false, false, false);
	FSlateApplication::Get().ProcessKeyDownEvent(FKeyEvent(key, modifiers, 0, false, keyCode, keyCode));
	FSlateApplication::Get().ProcessKeyUpEvent(FKeyEvent(key, modifiers, 0, false, keyCode, keyCode));
}

bool UShotLibrary::Click(const FString& WindowTitle, float X, float Y, bool bRight)
{
	return ShotPointer(WindowTitle, X, Y, bRight, true);
}

bool UShotLibrary::Hover(const FString& WindowTitle, float X, float Y)
{
	return ShotPointer(WindowTitle, X, Y, false, false);
}

void UShotLibrary::TypeText(const FString& Text)
{
	for (const TCHAR Char : Text)
	{
		FSlateApplication::Get().ProcessKeyCharEvent(FCharacterEvent(Char, FModifierKeysState(), 0, false));
	}
}

void UShotLibrary::PressKey(const FString& KeyName)
{
	const FKey key(*KeyName);
	const uint32 keyCode = 0;
	FSlateApplication::Get().ProcessKeyDownEvent(FKeyEvent(key, FModifierKeysState(), 0, false, keyCode, keyCode));
	FSlateApplication::Get().ProcessKeyUpEvent(FKeyEvent(key, FModifierKeysState(), 0, false, keyCode, keyCode));
}
static FString ShotWidgetText(const TSharedRef<SWidget>& Widget)
{
	const FName type = Widget->GetType();
	if (type == TEXT("STextBlock"))
	{
		return StaticCastSharedRef<STextBlock>(Widget)->GetText().ToString();
	}
	if (type == TEXT("SEditableText"))
	{
		return StaticCastSharedRef<SEditableText>(Widget)->GetText().ToString();
	}
	if (type == TEXT("SRichTextBlock"))
	{
		return StaticCastSharedRef<SRichTextBlock>(Widget)->GetText().ToString();
	}
	if (type == TEXT("SEditableTextBox") || type == TEXT("SSearchBox"))
	{
		return StaticCastSharedRef<SEditableTextBox>(Widget)->GetText().ToString();
	}
	return FString();
}

static void ShotWalk(const TSharedRef<SWidget>& Widget, const FString& WindowName, const FVector2D& Origin, const FString& TypeFilter, const FString& TextFilter, FString& Out, int32 Depth)
{
	if (Depth > 200 || !Widget->GetVisibility().IsVisible())
	{
		return;
	}

	const FGeometry& geometry = Widget->GetTickSpaceGeometry();
	const FVector2D position = FVector2D(geometry.GetAbsolutePosition()) - Origin;
	const FVector2D size = FVector2D(geometry.GetAbsoluteSize());
	const FString type = Widget->GetTypeAsString();
	if (size.X > 0.0 && size.Y > 0.0 && (TypeFilter.IsEmpty() || type.Contains(TypeFilter)))
	{
		const FString text = ShotWidgetText(Widget).Replace(TEXT("\n"), TEXT(" ")).Replace(TEXT("|"), TEXT("/"));
		if (TextFilter.IsEmpty() || text.Contains(TextFilter))
		{
			Out += FString::Printf(TEXT("%s|%s|%d,%d,%d,%d|%s\n"), *WindowName, *type, FMath::RoundToInt(position.X), FMath::RoundToInt(position.Y), FMath::RoundToInt(size.X), FMath::RoundToInt(size.Y), *text);
		}
	}

	// GetAllChildren, since an invalidation panel that caches reports no children through GetChildren.
	FChildren* children = Widget->GetAllChildren();
	for (int32 index = 0; children && index < children->Num(); ++index)
	{
		ShotWalk(children->GetChildAt(index), WindowName, Origin, TypeFilter, TextFilter, Out, Depth + 1);
	}
}

FString UShotLibrary::Widgets(const FString& TypeFilter, const FString& TextFilter)
{
	FString out;
	TSharedPtr<SWindow> main = Shot::Find(FString());
	const FVector2D origin = (main.IsValid()) ? main->GetPositionInScreen() : FVector2D::ZeroVector;
	for (const TSharedRef<SWindow>& Window : Shot::All())
	{
		if (Window->IsVisible())
		{
			ShotWalk(Window, Window->GetTitle().ToString(), origin, TypeFilter, TextFilter, out, 0);
		}
	}
	return out;
}
#else
FString UShotLibrary::Widgets(const FString&, const FString&) { return FString(); }
bool UShotLibrary::Capture(const FString&, const FString&, int32, int32, int32, int32) { return false; }
FString UShotLibrary::Windows() { return FString(); }
bool UShotLibrary::MoveWindow(const FString&, int32, int32, int32, int32) { return false; }
bool UShotLibrary::Click(const FString&, float, float, bool) { return false; }
bool UShotLibrary::Hover(const FString&, float, float) { return false; }
void UShotLibrary::TypeText(const FString&) {}
void UShotLibrary::PressKey(const FString&) {}
void UShotLibrary::PressKeyWithModifiers(const FString&, bool, bool, bool) {}
bool UShotLibrary::DoubleClick(const FString&, float, float) { return false; }
bool UShotLibrary::Scroll(const FString&, float, float, float) { return false; }
void UShotLibrary::SetCursorRing(bool) {}
bool UShotLibrary::DiscardAndLoad(const FString&) { return false; }
void UShotLibrary::SetApplicationScale(float) {}
void UShotLibrary::SetViewportExposure(float) {}
bool UShotLibrary::PointerDown(float, float) { return false; }
bool UShotLibrary::PointerMove(float, float) { return false; }
bool UShotLibrary::PointerUp(float, float) { return false; }
#endif
