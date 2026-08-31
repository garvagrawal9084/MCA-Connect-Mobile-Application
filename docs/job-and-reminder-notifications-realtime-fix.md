# Real-time Job and Deadline Reminder Notification Synchronization

## Overview
This document records the architectural root causes, fixes, and verification steps implemented to resolve real-time notification triggers and automatic screen synchronization for job postings, deadline reminders, and administrative broadcasts.

---

## 1. Issues Identified & Root Cause Analysis

### Issue A: New Jobs Were Suppressed and Failed to Trigger Alerts
* **Root Cause**: In `features/placement/jobWatcher.ts`, during cold boot, the initialization method unconditionally looped over all currently fetched jobs and added them to `knownJobIds` before returning. This effectively erased the baseline difference between stored jobs and newly fetched opportunities on app restart.
* **Secondary Cause**: In `features/placement/store.ts` (`fetchJobs`) and `app/_layout.tsx` (foreground sync), `jobWatcher.inspectAndNotifyNewJobs(jobs, { silent: true })` was called with `{ silent: true }`. This silently registered newly posted jobs into `knownJobIds` without firing `notificationEngine.trigger("JOB_POSTED", ...)`.

### Issue B: Deadline Reminders Popped but Did Not Auto-Update Notification Center
* **Root Cause 1**: In `components/placement/PlacementJobDetailModal.tsx`, the `handleSetReminder` handler only posted the payload to `/api/placement-center/jobs/:id/reminder` without calling `notificationEngine.trigger("APPLICATION_DEADLINE", ...)`.
* **Root Cause 2**: In `services/notifications/notificationEngine.ts`, `syncInAppStore` only mapped `JOB_POSTED` to `NEW_PLACEMENT_NOTICE`, leaving `APPLICATION_DEADLINE` unmapped.
* **Root Cause 3**: In `app/_layout.tsx`, `Notifications.addNotificationReceivedListener` displayed the in-app banner but failed to call `fetchNotifications()` and `fetchUnreadCount()`.
* **Root Cause 4**: In `app/(app)/(tabs)/notifications.tsx`, notifications were fetched exclusively in a single-run `useEffect([])` on component mount. Switching tabs did not trigger a refresh, forcing users to pull down to refresh manually.
* **Root Cause 5**: In `components/notifications/NotificationCard.tsx` and filter tabs, `isReminder` and `filterCategory === "placement"` did not recognize `APPLICATION_DEADLINE`, `JOB_DEADLINE_REMINDER`, or `JOB_POSTED`.

---

## 2. Implemented Solutions

### 1. Persistent Baseline & Active Job Discovery (`features/placement/jobWatcher.ts`)
* Restores persisted known IDs from `SecureStore` (or `localStorage` on web).
* Only executes first-time silent base-lining if no stored IDs exist (clean install).
* If stored IDs exist, compares incoming jobs against known IDs and immediately fires `notificationEngine.trigger("JOB_POSTED", ...)` for any newly published opportunities.

### 2. Immediate In-App Store Synchronization (`services/notifications/notificationEngine.ts`)
* Standardized trigger type mappings:
  - `JOB_POSTED` -> `NEW_PLACEMENT_NOTICE`
  - `APPLICATION_DEADLINE` -> `JOB_DEADLINE_REMINDER`
  - `APPLICATION_STATUS_UPDATE` -> `APPLICATION_UPDATE`
* Optimistically injects normalized items into Zustand store with deduplication.
* Automatically fires background re-fetches (`fetchNotifications` & `fetchUnreadCount`) to pull server-assigned IDs without blocking the UI.

### 3. Screen Auto-Refresh with `useFocusEffect` (`app/(app)/(tabs)/notifications.tsx`)
* Implemented `useFocusEffect(useCallback(...))` from `expo-router` to automatically refresh notifications and unread badges whenever the student navigates to the Notifications tab.
* Expanded filter categories to properly include job deadline reminders and new opportunity alerts.

### 4. Direct Reminder Dispatch (`components/placement/PlacementJobDetailModal.tsx`)
* Updated `handleSetReminder` to trigger `notificationEngine.trigger("APPLICATION_DEADLINE", ...)` with scheduled delay, pop the floating banner, and refresh the store.
* Updated `handleBroadcastNotification` to trigger `notificationEngine.trigger("JOB_POSTED", ...)` and synchronize store state.

### 5. Foreground Notification Listener Sync (`app/_layout.tsx`)
* Updated `Notifications.addNotificationReceivedListener` to trigger `fetchNotifications()` and `fetchUnreadCount()`, ensuring the in-app badge and notification list are updated the exact moment any notification pops.
* Updated `AppState` change listener to perform active job inspection on return to foreground (`silent: false`).

### 6. Notification Deep-Linking Auto-Modal (`app/(app)/placement/center.tsx`)
* Added `useEffect` listening to `selectedJob` in `usePlacementCenterStore` to automatically open the `PlacementJobDetailModal` drill-down sheet when navigating from a notification banner or card.

---

## 3. Verification & Compliance
* TypeScript compilation: `npx tsc --noEmit` passed with 0 errors.
* Preserved strict client-only architecture with zero backend modifications.
* NativeWind / Tailwind CSS styling and Zustand store state management maintained.
