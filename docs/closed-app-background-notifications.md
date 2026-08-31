# Closed-App Background Notifications & Headless Worker Architecture

> **Module:** Notifications & Background Execution  
> **Package Dependencies:** `expo-background-fetch`, `expo-task-manager`, `expo-notifications`, `expo-secure-store`  
> **Key Files:** `services/notifications/backgroundNotificationTask.ts`, `app/_layout.tsx`, `services/notifications/notificationWatcher.ts`, `features/placement/jobWatcher.ts`

---

## 1. Overview & Objective

To enable notifications on Android when the application is **completely closed or terminated**, the app employs a dual-strategy architecture:
1. **Remote Push Notifications (Cloud Dispatch):** Handled by Google FCM & Expo Push Service via token registration across `/api/notifications/register-device` and `/api/notifications/push-token`.
2. **Headless Background Worker (Local OS Dispatch):** Handled by `expo-task-manager` and `expo-background-fetch` to wake up periodically in the background, poll for newly published placement drives and announcements, and trigger system status bar alerts with vibration and sound.

---

## 2. Headless Task Implementation

In `services/notifications/backgroundNotificationTask.ts`:
- Defined task `SCIS_BACKGROUND_NOTIFICATION_TASK`.
- Configured with `stopOnTerminate: false` (remains active when the app is swiped away from recent apps) and `startOnBoot: true` (resumes execution after device reboot).
- When triggered by Android OS:
  1. Inspects `/api/placement/jobs` via `jobWatcher.syncAndCheckJobs({ silent: false })`.
  2. Inspects `/api/notifications` via `notificationWatcher.syncAndCheckNotifications({ silent: false })`.
  3. Compares incoming IDs against `SecureStore` cache.
  4. Dispatches native notifications via `Notifications.scheduleNotificationAsync` over high-priority Android channels (`placement-jobs`, `application-updates`).

---

## 3. Lifecycle Registration

In `app/_layout.tsx`:
```ts
notificationEngine.init().then(() => {
  registerBackgroundNotificationTaskAsync().catch((err) => {
    logger.debug("LAYOUT", "Background task registration skipped", err);
  });
  jobWatcher.syncAndCheckJobs().catch((err) => { ... });
  notificationWatcher.syncAndCheckNotifications().catch((err) => { ... });
});
```

---

## 4. Verification

- TypeScript Compilation: `npx tsc --noEmit` (**0 errors**).
- Background execution: Verified task registration and unregistration hooks.
