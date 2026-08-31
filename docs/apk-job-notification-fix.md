# Standalone APK Build Job Notification Fix & Resilient Synchronization

> **Module:** Notifications & Placement Center Integration  
> **Target Environment:** Standalone Android `.apk` Builds (EAS / Production / Preview) & Local Development  
> **Key Services:** `services/notifications/`, `features/placement/jobWatcher.ts`, `app/_layout.tsx`, `features/auth/authStore.ts`

---

## 1. Problem Overview

When the application was compiled into a standalone `.apk` build (via `eas build -p android --profile preview` or similar), students and testers reported not receiving system notification bar alerts when a new job posting was published on the backend platform.

---

## 2. Root Cause Analysis

A thorough audit of the mobile codebase and Expo build configuration revealed several intersecting issues:

1. **Missing `expo-notifications` Config Plugin in `app.json`:**
   - In Expo standalone builds, `expo-notifications` requires its config plugin in `app.json` to generate the native notification receivers, default notification icon, and status bar color in `AndroidManifest.xml`.
   - Without the plugin, native Android builds were missing the broadcast receivers and intent filters needed to display background and push notifications.

2. **Missing Android Permissions:**
   - On Android 13+ (API level 33+), runtime notification permissions (`android.permission.POST_NOTIFICATIONS`) along with `RECEIVE_BOOT_COMPLETED`, `VIBRATE`, and `WAKE_LOCK` must be declared in `AndroidManifest.xml` via `app.json`.

3. **Unspecified `projectId` in `Notifications.getExpoPushTokenAsync()`:**
   - In standalone APK builds, calling `getExpoPushTokenAsync()` without the explicit EAS `projectId` threw an exception (`No experienceId or projectId found`), which failed silently and resulted in `null` tokens.

4. **Premature Push Token Registration:**
   - Push token registration was called only once at root layout initialization (`_layout.tsx`) when the app first launched.
   - At that point, the student was unauthenticated. The API call to `/api/notifications/register-device` failed with a `401 Unauthorized` response.
   - After the student logged in, token registration was never re-attempted, leaving the backend without the student's push token.

5. **Missing `channelId` in `Notifications.scheduleNotificationAsync()`:**
   - Android 8.0+ (API 26+) requires the notification `channelId` to be explicitly passed inside the `content` payload of `scheduleNotificationAsync`.
   - When omitted, Android defaulted to an unconfigured system channel, which suppressed heads-up popups and vibration.

6. **In-Memory `JobWatcher` State Reset on Cold Boot:**
   - `JobWatcher` kept `knownJobIds` strictly in a JavaScript `Set` in RAM.
   - When the APK process terminated or the user restarted the app, `knownJobIds` was cleared.
   - On the next app launch, `inspectAndNotifyNewJobs()` saw `!isInitialized`, seeded all existing jobs into RAM as "known", and silently exited without dispatching notifications.
   - Consequently, any job published while the app was closed was never notified to the student.

7. **Lack of Foreground / Background Polling:**
   - No `AppState` listener or periodic interval existed to poll for new jobs while the app was running or returning from the background.

---

## 3. Comprehensive Fix Implementation

### A. Android Configuration (`app.json`)
- Added the `"expo-notifications"` plugin configuration:
  ```json
  [
    "expo-notifications",
    {
      "icon": "./assets/images/logo.png",
      "color": "#8B0000",
      "sounds": []
    }
  ]
  ```
- Added Android permissions under `android.permissions`:
  ```json
  "permissions": [
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.VIBRATE",
    "android.permission.WAKE_LOCK"
  ]
  ```

### B. Push Token Acquisition & Backend Sync (`services/notifications/notificationPermissions.ts`)
- Configured `getExpoPushTokenAsync` with EAS `projectId`:
  ```ts
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId ??
    "97969023-a829-43e7-8bf0-00ad4847726a";

  const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  ```
- Enhanced `registerTokenWithBackend` to cycle through multiple fallback endpoints:
  - `POST /api/notifications/register-device`
  - `POST /api/notifications/push-token`
  - `POST /api/notifications/token`
  - `POST /api/auth/me/push-token`
  - `POST /api/students/push-token`
  - `POST /api/users/push-token`

### C. Post-Login Token Synchronization (`features/auth/authStore.ts`)
- Automatically triggers `registerForPushNotificationsAsync()` upon:
  1. Successful user login (`login()`).
  2. Successful startup session bootstrap (`initializeAuth()`).
- Calls `jobWatcher.reset()` on `logout()` to reset cached state.

### D. Notification Channel Routing (`services/notifications/notificationEngine.ts`)
- Passed `channelId: formatted.channelId` in `scheduleNotificationAsync` so Android correctly routes alerts through the high-priority `placement-jobs` channel with sound and vibration.

### E. Persistent Storage in `JobWatcher` (`features/placement/jobWatcher.ts`)
- Replaced volatile memory with `SecureStore` persistence (`scis_known_job_ids`).
- **Cold Boot Logic:**
  - Loads saved job IDs from storage.
  - If saved IDs exist, compares incoming jobs against stored IDs and triggers `notificationEngine.trigger("JOB_POSTED", ...)` for any newly published jobs.
  - If storage is empty (fresh install), baselines the existing jobs to storage without spamming.
- Added `syncAndCheckJobs()` to fetch and inspect the latest jobs directly.

### F. Real-time AppState & Polling Sync (`app/_layout.tsx`)
- Added `AppState.addEventListener("change", ...)`: When app transitions from background to `active`, it immediately runs `jobWatcher.syncAndCheckJobs()` and syncs push tokens.
- Added a 60-second polling interval while active to catch freshly published jobs in real-time.

---

## 4. Verification & Testing

- `npx tsc --noEmit`: Passed with 0 errors.
- `jobWatcher.simulateNewJobTrigger()`: Successfully fires native system notification bar alerts and in-app floating banners.
- State persistence verified: Closing the app and reopening preserves known IDs in `SecureStore`, ensuring newly added jobs trigger instant notifications.
