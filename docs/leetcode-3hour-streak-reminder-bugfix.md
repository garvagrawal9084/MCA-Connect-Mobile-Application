# LeetCode 3-Hour Streak Reminder: Root Cause Analysis & Resilient Fix

**Version:** 2.2.3  
**Target Platform:** Android & iOS (React Native + Expo SDK 57)  
**Modules Affected:** `services/notifications/leetcodeReminderWatcher.ts`, `services/notifications/backgroundNotificationTask.ts`, `components/notifications/NotificationSettingsModal.tsx`, `features/auth/authStore.ts`

---

## 1. Problem Statement

Following the deployment of the LeetCode API alignment and 3-hour streak reminder worker (v2.2.0 / v2.2.1), the student reported:
> *"check it been 3 hours still no notification"*

Although manual test triggers in the diagnostic settings modal succeeded in dropping status bar notifications, the automated 3-hour periodic background worker did not deliver any notification to the student's device.

---

## 2. Root Cause Analysis

A thorough forensic audit of the headless background worker, storage lifecycle, and network API pipelines uncovered seven intersecting failure modes:

### Root Cause 1: Uninitialized SecureStore in Headless Background Execution
- **Mechanism:** When Android WorkManager wakes up headless tasks (`SCIS_LEETCODE_REMINDER_TASK` and `SCIS_BACKGROUND_NOTIFICATION_TASK`), the JavaScript engine runs without rendering the React component tree or executing `app/_layout.tsx`.
- **Defect:** `backgroundNotificationTask.ts` invoked `leetcodeReminderWatcher.checkIfNeeded()` and `checkDailySolveReminder()` directly without calling `await storageService.init()`.
- **Consequence:** `storageService.isInitialized()` remained `false`, and `storageService.getAccessToken()` returned `null`.
- **Result:** `apiClient.request()` dispatched network requests (`/api/challenges/my`, `/api/profile`) without the `Authorization: Bearer <token>` header. The Railway backend responded with `401: Access token required`. The task caught an `ApiError(401)` and terminated silently with `BackgroundFetchResult.Failed`.

### Root Cause 2: Array Schema Mismatch on `GET /api/challenges/my`
- **Mechanism:** The backend endpoint returns `{ success: true, message: "...", data: [ ... ] }` (where `data` is an array of challenge items directly).
- **Defect:** `leetcodeReminderWatcher.ts` looked exclusively for `myChallengesRes.data?.challenges`.
- **Consequence:** `myChallengesRes.data?.challenges` was `undefined`, causing `enrolledChallenges` to default to an empty array `[]`.
- **Result:** The watcher logged `"Student has not enrolled in any challenges; skipping reminder"` and returned `false`.

### Root Cause 3: Premature Timer Reset on Skipped Checks
- **Mechanism:** In `leetcodeReminderWatcher.ts`, lines 164, 180, and 250 executed:
  ```ts
  await storageService.setLeetCodeLastCheck(Date.now());
  ```
  even when the check was aborted because challenges were not resolved or user identity was unconfirmed.
- **Consequence:** On cold boot or startup, the watcher encountered the data parsing mismatch, stamped `lastCheck = Date.now()`, and pushed the 3-hour interval forward. Every subsequent check saw `elapsed < 3 hours - buffer`, skipped again, and reset the timer again, permanently postponing the reminder.

### Root Cause 4: Overly Strict Date Range Filtering
- **Mechanism:** Active challenges were filtered with:
  ```ts
  const startTime = new Date(ch.startDate).getTime();
  const endTime = new Date(ch.endDate).getTime();
  return startTime <= nowTime && nowTime <= endTime;
  ```
- **Defect:** If a challenge object lacked a nested `.challenge` wrapper (`item.challenge`), `ch` was `undefined`. Furthermore, if a sprint was marked `status: "active"` or `isActive: true` without strict date boundaries, or if the end date had time component variations (e.g. UTC midnight vs end of day), it was rejected.
- **Result:** `activeRunningChallenges.length === 0`, causing the check to skip and reset the timer.

### Root Cause 5: Incomplete Student Identity Resolution on Leaderboards
- **Mechanism:** MongoDB challenge leaderboards represent participants in varied schemas (`entry._id` as subdocument ID, `entry.userId` as user ObjectId, `entry.user` as populated object or string ID, `entry.roll_no`, `entry.leetcodeUsername`).
- **Defect:** The watcher only compared `entry._id === userId`.
- **Consequence:** If `entry._id` was the subdocument ID or `entry.user` was a string ID, the match evaluated to `false`.

### Root Cause 6: Flawed Condition on `userFoundInAtLeastOne`
- **Mechanism:** The watcher required `if (userFoundInAtLeastOne && !hasSolvedAnyToday)`.
- **Defect:** If a student joined an active challenge but had not yet solved any problem today (or was not yet indexed in the leaderboard array because their score was 0), `userFoundInAtLeastOne` remained `false`.
- **Consequence:** The student who needed the streak reminder the most was never alerted.

---

## 3. Comprehensive Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Headless Task Wake (WorkManager) / AppState Resume / Poll  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Ensure Storage Hydration: if (!initialized) init()       │
│    Restores accessToken, refreshToken & user from SecureStore│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Night Hours Check: 11:00 PM to 8:00 AM                   │
│    (If active, return false without touching lastCheck)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. 3-Hour Interval Check: Date.now() - lastCheck >= 3 hours │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Resolve Student Identity: user._id, roll_no, email,      │
│    and leetcodeHandle (from AuthStore / Storage / Profile)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Multi-Schema Challenges Normalization:                   │
│    Handles data directly as array, data.challenges, or      │
│    Zustand cache. Inspects active running sprints.           │
│    *DO NOT update lastCheck if no challenges enrolled*      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Deep Leaderboard Inspection:                             │
│    Matches entry by _id, userId, user string, user object,  │
│    roll_no, email, and leetcodeUsername.                    │
│    Checks dailyTotal, dailySolveCount, or solvedToday.      │
└──────────────────────────────┬──────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
 [hasSolvedAnyToday === true]                  [hasSolvedAnyToday === false]
        │                                             │
 (Streak verified active!)                     (No solves today!)
        │                                             │
        ▼                                             ▼
 Update lastCheck = Date.now()                 Dispatch System Notification:
 Return false (suppress alert)                 "You haven't solved any LeetCode
                                               question today 👀 – keep streak alive!"
                                               Update lastCheck = Date.now()
                                               Return true
```

---

## 4. Key Modifications

### 4.1 `services/notifications/leetcodeReminderWatcher.ts`
- Added storage bootstrap guard: `if (!storageService.isInitialized()) await storageService.init()`.
- Multi-schema parsing for `getMyChallenges()`: handles arrays directly, nested objects, and Zustand cache fallback.
- Inclusive active challenge filter: allows `status: "active"`, `isActive: true`, and challenges spanning today until `23:59:59`.
- Multi-field student matching on leaderboards: checks `_id`, `userId`, `user` string/object, `roll_no`, `email`, and `leetcodeUsername`.
- Trigger condition: alerts whenever `!hasSolvedAnyToday` for enrolled students.
- Only updates `setLeetCodeLastCheck(Date.now())` on successful notification dispatch or verified active streak—never on aborted/unresolved checks.
- Added `runDiagnosticCheck()` method returning full trace details for in-app verification.

### 4.2 `services/notifications/backgroundNotificationTask.ts`
- Added `ensureBackgroundStorageInitialized()` prior to running both `SCIS_BACKGROUND_NOTIFICATION_TASK` and `SCIS_LEETCODE_REMINDER_TASK`.
- Ensures access tokens are available in memory during headless OS execution.

### 4.3 `components/notifications/NotificationSettingsModal.tsx`
- Added **"Run Live 3-Hour Streak Check Now"** button under Closed-App Notification Diagnostics.
- Displays an interactive alert with full real-time trace:
  - Student ID
  - Linked LeetCode handle
  - Number of enrolled challenges
  - Solved today status (`dailyTotal`)
  - Minutes elapsed since last check
  - Quiet hours state
  - Notification dispatch result

### 4.4 `features/auth/authStore.ts`
- Wired `leetcodeReminderWatcher.init()` directly into the post-login callback.

---

## 5. Verification

1. **TypeScript Typecheck:** `npx tsc --noEmit` (**0 errors**).
2. **Headless Storage Hydration:** Verified background tasks initialize SecureStore before network calls.
3. **Live Diagnostic Action:** Tested live streak verification runner with interactive UI breakdown.
4. **Interval Enforcement:** Verified `lastCheck` is only updated upon notification dispatch or confirmed active streak.
