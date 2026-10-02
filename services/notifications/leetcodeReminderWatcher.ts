/**
 * SCIS Connect Mobile - LeetCode 3-Hour Streak Reminder Watcher
 *
 * Implements the automated 3-hour periodic reminder worker:
 * 1. Checks if the student has set a LeetCode username and joined active challenges.
 * 2. Skips night hours (11:00 PM to 8:00 AM) to preserve user sleep.
 * 3. Inspects every active running challenge (`startDate <= now <= endDate`).
 * 4. Checks the participant's `dailyTotal` on each active challenge leaderboard.
 * 5. If `dailyTotal === 0` across all active challenges, dispatches a high-priority
 *    local notification: "You haven't solved any LeetCode question today 👀 – keep your streak alive!".
 * 6. Tapping the notification opens Placement Studio directly into Challenges.
 * 7. Cancels immediately on user logout.
 */

import { storageService } from "@/services/storage";
import { challengesApi } from "@/features/challenges/api";
import { profileApi } from "@/features/profile/api";
import { notificationEngine } from "./notificationEngine";
import { useAuthStore } from "@/features/auth/authStore";
import { logger } from "@/utils/logger";

const THREE_HOURS_MS = 3 * 60 * 60 * 1000; // 3 hours (10,800,000 ms)
const CHECK_BUFFER_MS = 5 * 60 * 1000; // 5-minute buffer to accommodate OS timing jitters

export interface ReminderCheckOptions {
  force?: boolean;
  silent?: boolean;
}

class LeetCodeReminderWatcher {
  private inAppTimer: ReturnType<typeof setInterval> | null = null;
  private isChecking: boolean = false;
  private isInitialized: boolean = false;

  /**
   * Initializes the watcher on app start or authentication restore
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    logger.info("LEETCODE_REMINDER", "Initializing LeetCode 3-Hour Reminder Watcher");

    // Start in-app periodic timer (checks every 30 minutes whether the 3-hour check is due)
    this.startInAppPolling();

    // Perform an initial check if 3 hours have already passed since last check
    this.checkDailySolveReminder().catch((err) => {
      logger.debug("LEETCODE_REMINDER", "Initial startup reminder check skipped", err);
    });
  }

  /**
   * Starts light in-app timer to poll if 3-hour threshold has elapsed while app is open
   */
  private startInAppPolling(): void {
    if (this.inAppTimer) {
      clearInterval(this.inAppTimer);
    }

    // Inspect every 30 minutes while the app is active in foreground
    this.inAppTimer = setInterval(() => {
      this.checkDailySolveReminder().catch((err) => {
        logger.debug("LEETCODE_REMINDER", "Periodic in-app reminder poll skipped", err);
      });
    }, 30 * 60 * 1000);
  }

  /**
   * Stops in-app polling and resets worker (called on logout)
   */
  stop(): void {
    if (this.inAppTimer) {
      clearInterval(this.inAppTimer);
      this.inAppTimer = null;
    }
    this.isInitialized = false;
    this.isChecking = false;
    logger.info("LEETCODE_REMINDER", "LeetCode Reminder Watcher stopped and cleared");
  }

  /**
   * Executes the full 3-hour LeetCode reminder workflow
   * Returns true if a notification was dispatched, false otherwise
   */
  async checkDailySolveReminder(options?: ReminderCheckOptions): Promise<boolean> {
    if (this.isChecking) {
      logger.debug("LEETCODE_REMINDER", "A reminder check is already in progress, skipping");
      return false;
    }

    this.isChecking = true;

    try {
      // 1. Verify Night Hours (11:00 PM to 8:00 AM)
      const now = new Date();
      const currentHour = now.getHours();
      if (!options?.force && (currentHour >= 23 || currentHour < 8)) {
        logger.debug(
          "LEETCODE_REMINDER",
          `Skipping check during quiet hours (${currentHour}:00). Active window: 08:00 to 22:59.`
        );
        return false;
      }

      // 2. Check 3-Hour Frequency Interval
      const lastCheck = await storageService.getLeetCodeLastCheck();
      const elapsed = Date.now() - lastCheck;
      if (!options?.force && lastCheck > 0 && elapsed < THREE_HOURS_MS - CHECK_BUFFER_MS) {
        const remainingMin = Math.ceil((THREE_HOURS_MS - elapsed) / 60000);
        logger.debug(
          "LEETCODE_REMINDER",
          `Interval threshold not met: ${Math.round(elapsed / 60000)}m elapsed. Next check in ~${remainingMin}m.`
        );
        return false;
      }

      // 3. Resolve Current Student & User ID
      let user = useAuthStore.getState().user;
      let userId: string | null = user?._id || user?.id || null;

      if (!userId) {
        userId = await storageService.getLeetCodeUserId();
      }

      if (!userId) {
        try {
          const profileRes = await profileApi.getProfile();
          if (profileRes.data?.user?._id || profileRes.data?.user?.id) {
            userId = profileRes.data.user._id || profileRes.data.user.id || null;
            user = profileRes.data.user as any;
            if (userId) {
              await storageService.setLeetCodeUserId(userId);
            }
          }
        } catch (profileErr) {
          logger.debug("LEETCODE_REMINDER", "Failed to retrieve student profile for reminder check", profileErr);
          return false;
        }
      }

      if (!userId) {
        logger.debug("LEETCODE_REMINDER", "No authenticated student user ID found; skipping check");
        return false;
      }

      // 4. Check if Student has configured a LeetCode handle
      const leetcodeProfiles = user?.leetcode_profiles;
      const hasLeetcodeHandle =
        (Array.isArray(leetcodeProfiles) && leetcodeProfiles.length > 0 && Boolean(leetcodeProfiles[0]?.username)) ||
        Boolean((user as any)?.leetcodeUsername) ||
        Boolean((user as any)?.leetcode);

      if (!hasLeetcodeHandle) {
        logger.debug("LEETCODE_REMINDER", "Student has not linked a LeetCode username; skipping reminder");
        return false;
      }

      // 5. Fetch Student Enrolled Challenges
      const myChallengesRes = await challengesApi.getMyChallenges();
      const enrolledChallenges = myChallengesRes.data?.challenges || [];

      if (!Array.isArray(enrolledChallenges) || enrolledChallenges.length === 0) {
        logger.debug("LEETCODE_REMINDER", "Student has not enrolled in any challenges; skipping reminder");
        await storageService.setLeetCodeLastCheck(Date.now());
        return false;
      }

      // 6. Filter Active Running Challenges (startDate <= now <= endDate)
      const nowTime = Date.now();
      const activeRunningChallenges = enrolledChallenges.filter((item) => {
        const ch = item.challenge;
        if (!ch || !ch.startDate || !ch.endDate) return false;
        const startTime = new Date(ch.startDate).getTime();
        const endTime = new Date(ch.endDate).getTime();
        return !isNaN(startTime) && !isNaN(endTime) && startTime <= nowTime && nowTime <= endTime;
      });

      if (activeRunningChallenges.length === 0) {
        logger.debug("LEETCODE_REMINDER", "No currently running challenges found; skipping check");
        await storageService.setLeetCodeLastCheck(Date.now());
        return false;
      }

      // 7. Pull Latest LeetCode Total to reduce false positive alerts
      profileApi.syncLeetCode().catch((syncErr) => {
        logger.debug("LEETCODE_REMINDER", "Opportunistic LeetCode sync before leaderboard check deferred", syncErr);
      });

      // 8. Inspect Leaderboard `dailyTotal` for Each Active Challenge
      let hasSolvedAnyToday = false;
      let userFoundInAtLeastOne = false;

      for (const activeItem of activeRunningChallenges) {
        const ch = activeItem.challenge;
        const challengeId = ch._id || ch.id;
        if (!challengeId) continue;

        try {
          const lbRes = await challengesApi.getChallengeLeaderboard(challengeId);
          const rawEntries = Array.isArray(lbRes.data)
            ? lbRes.data
            : (lbRes.data as any)?.leaderboard || [];

          // Locate current student in leaderboard by _id or userId
          const studentEntry = rawEntries.find((entry: any) => {
            const entryId = entry._id || entry.userId || entry.user?._id || entry.user?.id;
            return String(entryId) === String(userId);
          });

          if (studentEntry) {
            userFoundInAtLeastOne = true;
            const solvedToday = typeof studentEntry.dailyTotal === "number" ? studentEntry.dailyTotal : 0;
            if (solvedToday > 0) {
              hasSolvedAnyToday = true;
              logger.info(
                "LEETCODE_REMINDER",
                `Student solved ${solvedToday} problem(s) today in challenge "${ch.name}". Streak is active!`
              );
              break;
            }
          }
        } catch (lbErr) {
          logger.warn("LEETCODE_REMINDER", `Failed to inspect leaderboard for challenge ${challengeId}`, lbErr);
        }
      }

      // If user has solved at least one question today, don't show reminder
      if (hasSolvedAnyToday) {
        await storageService.setLeetCodeLastCheck(Date.now());
        return false;
      }

      // If user is registered in active challenges and dailyTotal === 0 across ALL of them:
      if (userFoundInAtLeastOne && !hasSolvedAnyToday) {
        logger.info(
          "LEETCODE_REMINDER",
          "Student has dailyTotal === 0 across all active challenges. Triggering 3-hour streak reminder alert!"
        );

        await notificationEngine.trigger("LEETCODE_DAILY_REMINDER", {
          title: "LeetCode Practice Alert",
          body: "You haven't solved any LeetCode question today 👀 – keep your streak alive!",
        });

        await storageService.setLeetCodeLastCheck(Date.now());
        return true;
      }

      // Record check timestamp even if student was not yet indexed in leaderboard
      await storageService.setLeetCodeLastCheck(Date.now());
      return false;
    } catch (error) {
      logger.error("LEETCODE_REMINDER", "Unexpected error during LeetCode reminder check", error);
      return false;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Helper called by background workers and AppState resume:
   * Checks if a 3-hour reminder check is due
   */
  async checkIfNeeded(options?: { silent?: boolean }): Promise<boolean> {
    return this.checkDailySolveReminder(options);
  }
}

export const leetcodeReminderWatcher = new LeetCodeReminderWatcher();
export default leetcodeReminderWatcher;
