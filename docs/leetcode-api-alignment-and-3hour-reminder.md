# LeetCode API Alignment & 3-Hour Streak Reminder Architecture

**Version:** 2.2.0  
**Target Platform:** Android & iOS (React Native + Expo SDK 57)  
**Modules Affected:** `features/challenges`, `features/profile`, `services/notifications`, `services/storage`, `app/_layout.tsx`, `app/(app)/(tabs)/placement.tsx`

---

## 1. Executive Summary

This update completes full alignment with the SCIS Connect backend LeetCode specification and introduces the automated **3-Hour Streak Reminder** service.

The mobile client now:
1. Conforms strictly to backend routes for LeetCode profile management (`GET /api/profile`, `PATCH /api/profile`, `POST /api/profile/sync-leetcode`).
2. Adheres to challenge enrollment contracts (`POST /api/challenges/:id/join` with `{ agreedToTerms: true }`).
3. Preserves participant `_id` values on challenge and global leaderboards to enable identity resolution.
4. Executes a headless periodic background worker using Android WorkManager via `expo-task-manager` and `expo-background-fetch` (3-hour interval).
5. Checks if the student has set a LeetCode username and enrolled in active running challenges (`startDate <= now <= endDate`).
6. Inspects `dailyTotal` (questions solved today) across every active challenge. If `dailyTotal === 0` in all active challenges, dispatches a local notification:
   > **"You haven't solved any LeetCode question today 👀 – keep your streak alive!"**
7. Skips quiet night hours (11:00 PM to 8:00 AM) to preserve student sleep.
8. Opens Placement Studio directly into the Challenges modal when the student taps the notification.
9. Cancels all timers and unregisters the OS background worker on student logout.

---

## 2. Backend Route Alignment Summary

| Route | HTTP Method | Expected Contract | Client Implementation |
|---|---|---|---|
| `/api/profile` | `GET` | Returns logged-in user profile, `data.user._id`, and `data.user.leetcode_profiles[0]` (solved stats & sync date). | `profileApi.getProfile()` automatically persists `data.user._id` into SecureStore under `scis_leetcode_user_id`. |
| `/api/profile` | `PATCH` | Updates LeetCode username with `{ "leetcode": "their_leetcode_username" }`. | `profileApi.updateLeetCodeUsername(username)` and `EditSkillsLinksModal.tsx` send `{ leetcode, leetcodeUsername }`. |
| `/api/profile/sync-leetcode` | `POST` | Fetches latest solve counts from LeetCode GraphQL on-demand (pull-to-refresh). | `profileApi.syncLeetCode()` triggered on pull-to-refresh in `useChallenges` and `useMyChallenges`. |
| `/api/challenges` | `GET` | Lists all challenges. | `challengesApi.getAllChallenges()`. |
| `/api/challenges/my` | `GET` | Lists challenges current student has joined. | `challengesApi.getMyChallenges()`. |
| `/api/challenges/:id` | `GET` | Fetches challenge details. | `challengesApi.getChallengeById(id)`. |
| `/api/challenges/:id/join` | `POST` | Self-enrolls student with body `{ "agreedToTerms": true }`. | `challengesApi.joinChallenge(id)` updated to submit `{ agreedToTerms: true }`. |
| `/api/challenges/:id/leaderboard` | `GET` | Challenge leaderboard: entries with `_id` (user id), `rank`, `currentSolved`, `gainedSolved`, `score`, and `dailyTotal`. | `challengesApi.getChallengeLeaderboard(id)` and `features/challenges/store.ts` normalized to preserve `_id` and `dailyTotal`. |
| `/api/challenges/:id/daily-max` | `GET` | Daily maximum solvers chart data. | `challengesApi.getChallengeDailyMax(id)`. |
| `/api/challenges/leaderboard` | `GET` | Global leaderboard. | `challengesApi.getGlobalLeaderboard()`. |

---

## 3. 3-Hour Streak Reminder Architecture

```
                       ┌───────────────────────────────┐
                       │  Android WorkManager / OS BG  │
                       │  SCIS_LEETCODE_REMINDER_TASK  │
                       └───────────────┬───────────────┘
                                       │ (every 3 hours)
                                       ▼
                       ┌───────────────────────────────┐
                       │   leetcodeReminderWatcher     │
                       └───────────────┬───────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
[11:00 PM - 8:00 AM?]                                         [Has LeetCode handle?]
        │                                                             │
     YES ──► (Skip check)                                          NO ──► (Skip check)
        │                                                             │
        ▼ NO                                                          ▼ YES
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. GET /api/challenges/my                                                   │
│ 2. Filter active running challenges: startDate <= now <= endDate            │
│ 3. If none running ──► (Skip check)                                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. For each active challenge: GET /api/challenges/:id/leaderboard           │
│ 5. Match entry._id === currentStudentId                                     │
│ 6. If dailyTotal > 0 in ANY active challenge ──► (Streak active! Stop check) │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                         dailyTotal === 0 in ALL
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 7. Trigger Local Notification (Channel: leetcode-practice):                 │
│    "You haven't solved any LeetCode question today 👀 – keep streak alive!" │
│ 8. Record last check timestamp in SecureStore                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Implementation Components

### 4.1 `services/notifications/leetcodeReminderWatcher.ts`
- Encapsulates the entire check logic in a singleton service.
- Restores student user ID from SecureStore / `useAuthStore` / `profileApi.getProfile()`.
- Validates the 3-hour interval using `storageService.getLeetCodeLastCheck()` and a 5-minute jitter grace buffer.
- Suppresses checks during quiet hours (23:00 to 07:59 local device time).
- Dispatches high-priority notification via `notificationEngine.trigger("LEETCODE_DAILY_REMINDER", ...)`.

### 4.2 `services/notifications/backgroundNotificationTask.ts`
- Registers `SCIS_LEETCODE_REMINDER_TASK` with `BackgroundFetch.registerTaskAsync`:
  - `minimumInterval: 3 * 60 * 60` (3 hours).
  - `stopOnTerminate: false` (persists when app is closed).
  - `startOnBoot: true` (restores on device boot).
- Hooks into `SCIS_BACKGROUND_NOTIFICATION_TASK` (15-minute worker) to ensure checks run reliably even if Android Doze delays individual tasks.
- Exposes `unregisterLeetcodeReminderTaskAsync()` for clean logout cancellation.

### 4.3 `app/_layout.tsx` & `app/(app)/(tabs)/placement.tsx`
- Initializes watcher on app launch if authenticated.
- Polls `checkIfNeeded()` when app returns to foreground (`AppState` active).
- `handleNotificationTap` intercepts `LEETCODE_DAILY_REMINDER` and navigates to `/(app)/(tabs)/placement?feature=challenges`.
- `PlacementScreen` reads `useLocalSearchParams<{ feature?: string; openModal?: string }>()` and automatically displays the Challenges modal.

### 4.4 `features/auth/authStore.ts`
- Invokes `leetcodeReminderWatcher.stop()` and `unregisterLeetcodeReminderTaskAsync()` during `logout()`.
- Clears stored LeetCode user ID and reminder timestamps.

---

## 5. Verification Checklist

- [x] `npx tsc --noEmit` passed with 0 errors.
- [x] `POST /api/challenges/:id/join` sends `{ agreedToTerms: true }`.
- [x] Leaderboard normalizer preserves participant `_id`.
- [x] Profile endpoint supports `PATCH /api/profile` with `{ leetcode }`.
- [x] Pull-to-refresh triggers `POST /api/profile/sync-leetcode`.
- [x] Android notification channel `leetcode-practice` registered with high importance and amber light.
- [x] 3-Hour interval and night-hour suppression verified.
- [x] Deep link on notification tap tested to open Challenges modal.
- [x] Logout cancellation unregisters OS background worker and clears in-app timers.
