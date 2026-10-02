# Closed-App Native Alarm Pre-Scheduling for LeetCode Streak Reminders

## Overview
When the mobile application was in the foreground or when a user clicked the diagnostic trigger **"Run Live 1-Hour Streak Check Now"**, the streak check executed successfully and dispatched the notification banner. However, when the app was closed, swiped away from the Recent Apps screen, or killed, no notifications appeared automatically after one hour.

This document details the root cause of why background notifications were suppressed when the application was closed, how we re-architected the reminder mechanism using Android native `AlarmManager` pre-scheduling, and how to verify delivery.

---

## 1. Problem Analysis & Root Cause

### 1.1 The OEM Background Task Kill Problem
On modern Android versions (especially customized OEM ROMs like Xiaomi HyperOS, MIUI, Samsung One UI, Realme UI, and ColorOS):
- When a user swipes away an application from the Recent Apps list, the operating system sends `ACTION_FORCE_STOP` or places the process into a cached, frozen state.
- `expo-background-fetch` relies internally on Android's `WorkManager` API (`PeriodicWorkRequest`).
- Under strict battery optimization policies, `WorkManager` periodic tasks are deferred, throttled, or prevented entirely from spawning the headless React Native JavaScript runtime (`HeadlessJsTaskService`).
- Consequently, JavaScript code inside `TaskManager.defineTask` never executes while the app is killed.

### 1.2 Lack of Pre-Scheduled Native OS Alarms
In version `2.2.4`, the app relied purely on **reactive on-demand triggers**:
- The app only called `Notifications.scheduleNotificationAsync()` when the JavaScript code had *already* checked the backend and determined the student had 0 solves.
- If the headless background task never ran due to OS restrictions, no future alarm was registered in Android's native system `AlarmManager`.
- Thus, the phone never displayed the notification automatically when closed.

---

## 2. Architectural Solution: Native Alarm Pre-Scheduling

Instead of relying solely on an unreliable headless JS process waking up after the app is dead, we implemented **Pre-Scheduled Native AlarmManager Slots**:

```
                       ┌────────────────────────────────────────┐
                       │ Student Opens App / Checks Reminders    │
                       └──────────────────┬─────────────────────┘
                                          │
                                          ▼
                      ┌───────────────────────────────────────┐
                      │ Check LeetCode Solves for Today       │
                      └───────┬───────────────────────┬───────┘
            Solved Today (dailyTotal > 0)    Unsolved (dailyTotal === 0)
                              │                       │
                              ▼                       ▼
            ┌───────────────────────────┐   ┌───────────────────────────┐
            │ Cancel All Pending Alarms │   │ Pre-Schedule Native Alarms│
            │ for Today (AlarmManager)  │   │ in Android OS AlarmManager│
            └───────────────────────────┘   │ (Slot 1..6: +1h..+6h)     │
                                            └─────────────┬─────────────┘
                                                          │
                                                          ▼
                                            ┌───────────────────────────┐
                                            │ App Swiped Away / Killed  │
                                            └─────────────┬─────────────┘
                                                          │
                                                          ▼ (1 Hour Later)
                                            ┌───────────────────────────┐
                                            │ Android Hardware RTC      │
                                            │ Fires Native Notification │
                                            │ (No JS Runtime Required!) │
                                            └───────────────────────────┘
```

### 2.1 Native AlarmManager Independence
When an alarm is registered using `Notifications.scheduleNotificationAsync({ trigger: { type: SchedulableTriggerInputTypes.DATE, date: targetDate } })`:
1. Expo Notifications hands the notification payload and trigger timestamp directly to the Android OS `AlarmManager` service.
2. The Android OS maintains this trigger in its native system table (hardware real-time clock RTC).
3. **The app process does NOT need to be running in the background.**
4. When the exact timestamp arrives, the Android OS itself posts the notification to the status bar, rings the notification chime, and triggers vibration according to the channel settings.

### 2.2 Discrete Hourly Slot Pre-Scheduling
In `services/notifications/leetcodeReminderWatcher.ts`, `scheduleUpcomingHourlyReminders()`:
- Pre-schedules up to 6 discrete hourly slots (`SCIS_LEETCODE_REMINDER_SLOT_1` through `_6`) for each upcoming hour during active waking hours (08:00 to 22:59).
- Pre-schedules a morning alarm for 08:15 AM tomorrow if daytime slots are exhausted.
- Clears any previous slots before re-scheduling to prevent duplicates.

### 2.3 Instant Streak Invalidation
When the student solves a problem:
- Opening the app or returning to the foreground runs `checkDailySolveReminder()`.
- If `hasSolvedAnyToday === true`, `cancelAllScheduledStreakReminders()` queries all scheduled notifications with prefix `SCIS_LEETCODE_REMINDER_SLOT_` and cancels them immediately via `Notifications.cancelScheduledNotificationAsync`.
- Similarly, logging out calls `stop()`, wiping all scheduled alarms from the phone.

---

## 3. Implementation Details

### 3.1 Permission Added to `app.json`
To allow exact native alarms on Android 12+ (API 31+):
```json
"permissions": [
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.VIBRATE",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.SCHEDULE_EXACT_ALARM"
]
```

### 3.2 Maximum Channel Priority
In `services/notifications/channels.ts`, the `LEETCODE_PRACTICE` channel is configured with `importance: "max"`:
- `Notifications.AndroidImportance.MAX` ensures heads-up floating banner presentation, sound, and vibration across all Android versions.

### 3.3 Interactive 10-Second Closed-App Test Trigger
In `components/notifications/NotificationSettingsModal.tsx`:
- **"Test Closed-App Streak Alert (10s Delay)"**: Schedules a native OS alarm 10 seconds into the future.
- Users can tap the button, immediately swipe away and kill the app from Recent Apps, and verify that Android OS sounds the notification without the app open.
- **"Run Live 1-Hour Streak Check Now"**: Now displays the exact number of active native OS alarms pre-scheduled in `AlarmManager` and the next scheduled fire time.

---

## 4. Verification Checklist
- [x] TypeScript compiled cleanly with `npx tsc --noEmit` (0 errors).
- [x] Native alarms verified via `Notifications.getAllScheduledNotificationsAsync()`.
- [x] Quiet hours (11:00 PM to 8:00 AM) respected during slot pre-scheduling.
- [x] Cancellation on solved questions verified.
- [x] Cancellation on logout verified.
- [x] Application version bumped to `2.2.5` in `package.json` and `app.json`.
