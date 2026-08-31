# Notification Options, Preferences & System Permission Management

> **Module:** Notification Architecture & User Preferences  
> **Environment:** Standalone Android Builds (`.apk`), iOS, & Local Expo  
> **Key Files:** `services/notifications/`, `features/notifications/`, `components/notifications/NotificationSettingsModal.tsx`, `services/storage.ts`

---

## 1. Problem Overview & Analysis

In standalone APK builds and development environments, students reported that notification options/toggles were either not persisting, not delivering status bar alerts, or failing when system permissions were disabled in Android settings.

### Root Causes Identified
1. **Trigger Channel Mapping in `expo-notifications`:**
   - In `expo-notifications` v0.32.x (Expo SDK 54), Android notification channel routing is resolved through `trigger: { channelId }` (`ChannelAwareTriggerInput`), while `content` contains standard notification visual primitives.
2. **Volatile Preference State:**
   - Notification options were only stored in in-memory Zustand state and reset whenever the application was closed or restarted.
3. **Silent Permission Blocks:**
   - When notification permissions were denied or revoked in device OS settings, turning notification options ON inside the app failed silently without directing the user to device App Settings.
4. **Lack of User Settings & Diagnostic Tools:**
   - No dedicated preferences modal existed for students to configure granular channels (Job Drives, Campus Announcements, Deadlines, Assessment Results) or verify alert delivery via a test trigger.

---

## 2. Technical Architecture & Solutions

### A. Persistent Notification Preferences (`services/storage.ts` & `features/notifications/store.ts`)
- Added `NotificationPreferences` interface and SecureStore persistence (`scis_notification_preferences`).
- Granular category toggles:
  - `masterNotificationsEnabled`: Global master switch.
  - `jobAlertsEnabled`: Real-time placement drive alerts.
  - `announcementsEnabled`: Department circulars and notices.
  - `deadlineRemindersEnabled`: Upcoming application deadlines.
  - `resultsPublishedEnabled`: Test scorecard and ranking publications.
- Preferences automatically load on application startup during `notificationEngine.init()` and `store.loadPreferences()`.

### B. Android System Permission Verification & Settings Deep-Linking (`services/notifications/notificationPermissions.ts`)
- Implemented `checkNotificationPermissions()` to verify exact OS grant status.
- Implemented `requestNotificationPermissionsWithPrompt()`:
  - If permissions can be requested, displays system runtime prompt.
  - If permissions are denied and blocked by the OS (`canAskAgain: false`), presents an informative Alert with a one-tap deep link to device App Settings (`Linking.openSettings()`).
- Implemented `sendTestNotification()` for immediate end-to-end device alert verification.

### C. Dedicated Notification Preferences UI (`components/notifications/NotificationSettingsModal.tsx`)
- Modern, accessible modal with NativeWind styling and dark mode support.
- Streamlined **Allow All Notifications** master switch.
- Granular channel toggles with domain icons, descriptions, and tactile Haptic feedback.

### D. UI Entry Points
1. **Notification Center (`app/(app)/(tabs)/notifications.tsx`):**
   - Header options button (`options-outline`) to open Notification Settings modal.
2. **Student Profile (`app/(app)/(tabs)/profile.tsx`):**
   - Dedicated "Preferences & Settings" card with live alert status indicator.
3. **Placement Center (`app/(app)/placement/center.tsx`):**
   - Synchronized "Instant New Job Alerts" banner backed by persistent storage.

---

## 3. Verification & Quality Assurance

1. `npx tsc --noEmit`: Executed cleanly with 0 errors.
2. Verified SecureStore preference persistence across application sessions.
3. Verified channel routing through high-priority Android Notification Channels (`placement-jobs`, `campus-announcements`, `application-updates`, `academic-results`, `general-notifications`).
