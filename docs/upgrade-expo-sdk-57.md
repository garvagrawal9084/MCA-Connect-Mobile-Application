# 🚀 Expo SDK 57 Upgrade Documentation

## Overview
This document records the major upgrade of **SCIS Connect Mobile** from **Expo SDK 54** to **Expo SDK 57**, including runtime transition to **React Native 0.86.3**, unified Expo package versioning, and NativeWind v4 compatibility.

---

## 1. Upgrade Summary

| Component | Previous Version (SDK 54) | Upgraded Version (SDK 57) |
|---|---|---|
| **Expo** | `~54.0.36` | `~57.0.24` |
| **React** | `19.1.0` | `19.2.3` |
| **React Native** | `0.81.5` | `0.86.3` |
| **React Native Reanimated** | `~4.1.1` | `4.5.1` |
| **React Native Worklets** | `0.5.1` | `0.10.1` |
| **NativeWind** | `^4.2.6` | `^4.2.7` |
| **Tailwind CSS** | `~3.4.17` | `~3.4.17` (Retained) |
| **Project Version** | `1.1.0` | `2.0.0` |

---

## 2. Configuration & Schema Adjustments

### `app.json`
1. **Removed `newArchEnabled: true`**:
   - In Expo SDK 57, the React Native New Architecture is enabled by default. The property is deprecated from the schema.
2. **Removed `android.edgeToEdgeEnabled: true`**:
   - In React Native 0.86 and Expo SDK 57, edge-to-edge rendering is standard on Android and managed natively.
3. **Auto-registered Config Plugins**:
   - Expo CLI automatically registered `expo-font`, `expo-image`, `expo-status-bar`, and `expo-web-browser` in `plugins`.

---

## 3. Expo Go Compatibility Patches (Android)

When running the project in the generic **Expo Go** client on Android (which does not bundle newly introduced SDK 57 native modules):
1. **`ExpoTopicSubscriptionModule`**:
   - In SDK 57, `expo-notifications` requires `ExpoTopicSubscriptionModule` at bundle initialization.
   - Patched `TopicSubscriptionModule.android.js` to use `requireOptionalNativeModule` with a graceful no-op fallback so Expo Go does not crash on import.
2. **`ExpoMediaLibraryNext`**:
   - In SDK 57, `expo-media-library` requires `ExpoMediaLibraryNext`.
   - In `PlacementDetailModal.tsx`, wrapped the library import in a graceful fallback when the native module is absent.
3. **`warnOfExpoGoPushUsage`**:
   - Patched to log a warning instead of throwing an unhandled `throw new Error(...)` during bundle evaluation on Android Expo Go.
   - Maintained automatically via `scripts/patch-expo-notifications.js` on `npm install`.
4. **Android Notification Channels in Expo Go**:
   - Guarded `setupAndroidNotificationChannels()` with `if (isExpoGo) return;` to prevent `NullPointerException` when native channel providers are unavailable in Expo Go.
5. **Authenticated Watcher Polling**:
   - Added `storageService.isAuthenticated()` guards to `jobWatcher.syncAndCheckJobs()`, `notificationWatcher.syncAndCheckNotifications()`, and `app/_layout.tsx` so unauthenticated cold boots never fire unauthorized 401 requests to `/api/placement/jobs`.
6. **Reanimated v4 Layout Animation vs `transform` Property Separation**:
   - In React Native Reanimated v4 (SDK 57), placing layout animations (e.g., `entering={FadeInDown...}`) on the same `Animated.View` that contains a custom `transform` style (e.g., `animatedCardShakeStyle` for form error shakes) triggers a warning: `Property "transform" of AnimatedComponent(View) may be overwritten by a layout animation`.
   - Resolved by wrapping the animated component with an outer `Animated.View` dedicated to the entering layout animation, while the inner `Animated.View` applies the custom shake/transform style. Applied to `app/(auth)/login.tsx` and `app/(auth)/forgot-password.tsx`.

---

## 4. Verification & Diagnostic Results

1. **Expo Doctor (`npx expo-doctor`)**:
   - **21/21 checks passed. No issues detected!**
   - Verified that all installed native modules and SDK packages match the official SDK 57 specification.
2. **TypeScript Compilation (`npx tsc --noEmit`)**:
   - **Exited with code 0 (0 errors)**.
   - All router paths, component typings, and API interfaces compiled cleanly with TypeScript 6 and React 19.2 types.
