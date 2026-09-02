# Standalone Build Application Device Registration & Push Notification Fix

> **Module:** Authentication, Notification Service & Push Token Lifecycle  
> **Target Environments:** Standalone Android Build (.apk / EAS Build / Production) & Expo Go  
> **Key Files:**  
> - [`services/notifications/notificationPermissions.ts`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/services/notifications/notificationPermissions.ts)  
> - [`features/notifications/api.ts`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/features/notifications/api.ts)  
> - [`features/auth/authStore.ts`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/features/auth/authStore.ts)  
> - [`app/(app)/(tabs)/_layout.tsx`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app/%28app%29/%28tabs%29/_layout.tsx)  
> - [`app.json`](file:///Users/garvagrawal/Documents/Coding/MCA-CONNECT/app.json)

---

## 1. Issue Summary

During testing, students and developers noticed that:
- **In Expo Go:** When a student logs in, the device registration API (`POST /api/notifications/register-device`) is executed successfully, registering the phone's Expo push token with the backend.
- **In the Standalone Build Application (`.apk` / EAS Build):** Student login succeeds, but device registration is skipped or fails silently. The device push token is never registered with the backend, preventing the student from receiving remote background push notifications for jobs, campus notices, or test results.

---

## 2. Root Cause Analysis

### A. Missing Firebase Cloud Messaging (FCM) in Standalone Android Builds
* **Expo Go Behavior:** Expo Go is a pre-compiled native application distributed by Expo. It already embeds Expo's internal Firebase project credentials and FCM configuration. When `Notifications.getExpoPushTokenAsync()` is called in Expo Go, it uses Expo's bundled Firebase client to obtain an Expo push token (`ExponentPushToken[...]`).
* **Standalone Build Behavior:** When built with EAS or as a standalone `.apk` under package name `com.scis.connect`, Android's native push system requires a dedicated **Firebase Cloud Messaging (FCM)** project.
* **The Failure:** Without `google-services.json` present and configured in `app.json` (`expo.android.googleServicesFile`), native Android code throws:
  ```text
  Default FirebaseApp is not initialized in this process com.scis.connect
  ```
* Previously, in `notificationPermissions.ts`, this error was caught in `catch (tokenErr)` and logged only as a debug warning before returning `null`. Because `token` was `null`, `registerTokenWithBackend(token)` was never called.

### B. Missing Fallback EAS Project ID in Standalone Builds
* In Expo Go, `Constants.expoConfig` is populated with the contents of `app.json`.
* In standalone production/preview builds, `Constants.expoConfig` can be `null` or `undefined` (or lacks `extra.eas.projectId`), and if `Constants.easConfig?.projectId` is also not set, `projectId` resolves to `undefined`.
* `notificationPermissions.ts` previously checked:
  ```ts
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    logger.error("NOTIFICATIONS", "EAS project ID is missing; push token cannot be created");
    return null;
  }
  ```
  Without the hardcoded fallback `"97969023-a829-43e7-8bf0-00ad4847726a"`, token generation aborted immediately.

### C. Android 13+ Notification Permission & Fast Redirect Race Condition
* On a freshly installed standalone APK, `POST_NOTIFICATIONS` runtime permission is `undetermined`.
* When the student taps "Sign In", `useAuthStore.login()` initiated `registerForPushNotificationsAsync()` as an unawaited background promise.
* Concurrently, `login.tsx` scheduled navigation away after 400ms (`router.replace("/(app)/(tabs)")`). If the OS permission prompt was pending or answered after navigating, the initial registration attempt had already aborted, and no retry mechanism existed.

### D. Access Token Resolution Delay
* `registerForPushNotificationsAsync()` relied strictly on `storageService.getAccessToken()`. If SecureStore persistence was asynchronous or pending, `accessToken` was null, causing registration to exit early.

---

## 3. Implementation & Resolution

### 1. Robust EAS Project ID Fallback
Updated `services/notifications/notificationPermissions.ts`:
```ts
const projectId =
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.easConfig?.projectId ??
  "97969023-a829-43e7-8bf0-00ad4847726a";
```

### 2. Token Override & Direct Authentication Passing
- Updated `registerForPushNotificationsAsync(tokenOverride?: string)` to accept an access token directly.
- Updated `registerTokenWithBackend(token, tokenOverride)` to pass the token to `notificationsApi.registerDevice(payload, tokenOverride)`.
- Updated `features/auth/authStore.ts` in `login()`, `initializeAuth()`, and `refreshToken()` to pass the fresh access token directly, eliminating storage hydration race conditions:
  ```ts
  registerForPushNotificationsAsync(activeToken || undefined).catch((pushErr) => {
    logger.debug("AUTH_STORE", "Background push token sync after login deferred", pushErr);
  });
  ```

### 3. Secondary Registration Check on Tabs Mount
Updated `app/(app)/(tabs)/_layout.tsx` to verify push token registration when the student arrives on the main tabs:
```tsx
useEffect(() => {
  fetchUnreadCount();

  if (!getActiveExpoPushToken()) {
    registerForPushNotificationsAsync().catch((e) =>
      logger.debug("TABS_LAYOUT", "Deferred push registration check skipped", e)
    );
  }
}, [fetchUnreadCount]);
```

### 4. Descriptive Error Logging
Updated `registerForPushNotificationsAsync()` to explicitly log actionable error diagnostics when push token acquisition fails in standalone environments:
```ts
logger.error(
  "NOTIFICATIONS",
  "Failed to acquire Expo Push Token. In standalone Android APK builds, Firebase Cloud Messaging (google-services.json) and EAS FCM V1 credentials must be configured.",
  tokenErr
);
```

### 5. Configured `googleServicesFile` in `app.json`
Configured the Android configuration in `app.json`:
```json
"android": {
  "package": "com.scis.connect",
  "googleServicesFile": "./google-services.json",
  ...
}
```

---

## 4. How to Complete Firebase Cloud Messaging (FCM) Setup for Android Builds

To ensure remote push tokens are issued by Google Play Services in your standalone `.apk` builds, complete these 3 steps:

### Step 1: Create a Firebase Project
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Create a project (e.g. `SCIS-Connect-App`).
3. Click **Add App** and select **Android**.
4. Enter the package name: `com.scis.connect`.
5. Download the `google-services.json` file.
6. Place `google-services.json` in your project root:
   ```text
   /Users/garvagrawal/Documents/Coding/MCA-CONNECT/google-services.json
   ```

### Step 2: Upload FCM V1 Credentials to EAS
1. In the Firebase Console, go to **Project Settings** > **Service accounts**.
2. Click **Generate new private key** to download your JSON service account key.
3. In your terminal, run:
   ```bash
   eas credentials
   ```
4. Select **Android** > **Push Notifications** > **FCM V1 service account key**, and upload the private key.

### Step 3: Build Standalone APK
Build your new APK with EAS:
```bash
eas build -p android --profile preview
```
All standalone builds will now initialize Firebase natively and register device push tokens with the backend upon student login!
