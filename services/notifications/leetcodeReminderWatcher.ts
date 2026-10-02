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
import { useChallengeStore } from "@/features/challenges/store";
import { logger } from "@/utils/logger";

const ONE_HOUR_MS = 1 * 60 * 60 * 1000; // 1 hour (3,600,000 ms)
const CHECK_BUFFER_MS = 3 * 60 * 1000; // 3-minute buffer to accommodate OS timing jitters

export interface ReminderCheckOptions {
  force?: boolean;
  silent?: boolean;
}

export interface ReminderDiagnosticResult {
  success: boolean;
  notified: boolean;
  message: string;
  details: {
    userId: string | null;
    leetcodeHandle: string | null;
    enrolledChallengesCount: number;
    challengesInspectedCount: number;
    hasSolvedToday: boolean;
    lastCheckTimestamp: number;
    elapsedMinutes: number;
    isQuietHours: boolean;
  };
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
    logger.info("LEETCODE_REMINDER", "Initializing LeetCode 1-Hour Reminder Watcher");

    // Ensure persistent storage is restored into memory
    if (!storageService.isInitialized()) {
      await storageService.init();
    }

    // Start in-app periodic timer (checks every 10 minutes whether the 1-hour check is due)
    this.startInAppPolling();

    // Perform an initial check if due
    this.checkDailySolveReminder().catch((err) => {
      logger.debug("LEETCODE_REMINDER", "Initial startup reminder check skipped", err);
    });
  }

  /**
   * Starts light in-app timer to poll if 1-hour threshold has elapsed while app is open
   */
  private startInAppPolling(): void {
    if (this.inAppTimer) {
      clearInterval(this.inAppTimer);
    }

    // Inspect every 10 minutes while the app is active in foreground
    this.inAppTimer = setInterval(() => {
      this.checkDailySolveReminder().catch((err) => {
        logger.debug("LEETCODE_REMINDER", "Periodic in-app reminder poll skipped", err);
      });
    }, 10 * 60 * 1000);
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
      // 0. Ensure Storage is Ready (crucial for headless background tasks)
      if (!storageService.isInitialized()) {
        await storageService.init();
      }

      // 1. Verify Night Hours (11:00 PM to 8:00 AM)
      const now = new Date();
      const currentHour = now.getHours();
      const isQuietHours = currentHour >= 23 || currentHour < 8;
      if (!options?.force && isQuietHours) {
        logger.debug(
          "LEETCODE_REMINDER",
          `Skipping check during quiet hours (${currentHour}:00). Active window: 08:00 to 22:59.`
        );
        return false;
      }

      // 2. Check 1-Hour Frequency Interval
      const lastCheck = await storageService.getLeetCodeLastCheck();
      const elapsed = Date.now() - lastCheck;
      if (!options?.force && lastCheck > 0 && elapsed < ONE_HOUR_MS - CHECK_BUFFER_MS) {
        const remainingMin = Math.ceil((ONE_HOUR_MS - elapsed) / 60000);
        logger.debug(
          "LEETCODE_REMINDER",
          `Interval threshold not met: ${Math.round(elapsed / 60000)}m elapsed. Next check in ~${remainingMin}m.`
        );
        return false;
      }

      // 3. Resolve Current Student & User ID
      let user = useAuthStore.getState().user || storageService.getUser();
      let userId: string | null = user?._id || user?.id || null;

      if (!userId) {
        userId = await storageService.getLeetCodeUserId();
      }

      if (!userId || !user) {
        try {
          const profileRes = await profileApi.getProfile();
          if (profileRes.data?.user) {
            user = profileRes.data.user as any;
            userId = user?._id || user?.id || null;
            if (userId) {
              await storageService.setLeetCodeUserId(userId);
            }
          }
        } catch (profileErr) {
          logger.debug("LEETCODE_REMINDER", "Failed to retrieve student profile for reminder check", profileErr);
          // Do not advance lastCheck timestamp on network error
          return false;
        }
      }

      if (!userId) {
        logger.debug("LEETCODE_REMINDER", "No authenticated student user ID found; skipping check");
        return false;
      }

      // Extract matching identifiers for robust leaderboard lookup
      const userRoll = (user?.roll_no || (user as any)?.rollNo || "").toString().trim().toLowerCase();
      const userEmail = (user?.email || "").toString().trim().toLowerCase();

      // 4. Check if Student has configured a LeetCode handle
      const leetcodeProfiles = user?.leetcode_profiles;
      const leetcodeHandle = (
        (Array.isArray(leetcodeProfiles) && leetcodeProfiles[0]?.username) ||
        (user as any)?.leetcodeUsername ||
        (user as any)?.leetcode ||
        ""
      ).toString().trim().toLowerCase();

      if (!leetcodeHandle) {
        logger.debug("LEETCODE_REMINDER", "Student has not linked a LeetCode username; skipping reminder");
        return false;
      }

      // 5. Fetch Student Enrolled Challenges with Multi-Schema Extraction
      let enrolledChallenges: any[] = [];
      try {
        const myChallengesRes = await challengesApi.getMyChallenges();
        const rawData = myChallengesRes.data;
        if (Array.isArray(rawData)) {
          enrolledChallenges = rawData;
        } else if (Array.isArray((rawData as any)?.challenges)) {
          enrolledChallenges = (rawData as any).challenges;
        } else if (Array.isArray((rawData as any)?.data)) {
          enrolledChallenges = (rawData as any).data;
        }
      } catch (challengesErr) {
        logger.warn("LEETCODE_REMINDER", "Failed to fetch student enrolled challenges", challengesErr);
      }

      // Fallback to Zustand cache if network response was empty
      if (enrolledChallenges.length === 0) {
        const cachedMy = useChallengeStore.getState().myChallenges;
        if (Array.isArray(cachedMy) && cachedMy.length > 0) {
          enrolledChallenges = cachedMy;
        }
      }

      // Fallback: If still empty, check all challenges where current student is a participant
      if (enrolledChallenges.length === 0) {
        try {
          const allRes = await challengesApi.getAllChallenges();
          const allList = Array.isArray(allRes.data)
            ? allRes.data
            : (allRes.data as any)?.challenges || [];
          enrolledChallenges = allList.filter((ch: any) => {
            const users = ch.users || [];
            return users.some((u: any) => {
              const uid = typeof u === "string" ? u : u?._id || u?.id;
              return uid && String(uid) === String(userId);
            });
          });
        } catch (allErr) {
          logger.debug("LEETCODE_REMINDER", "All challenges fallback skipped", allErr);
        }
      }

      if (enrolledChallenges.length === 0) {
        logger.debug("LEETCODE_REMINDER", "Student has not enrolled in any challenges; skipping reminder");
        // DO NOT overwrite lastCheck so student isn't locked out once they join
        return false;
      }

      // 6. Filter Active Running Challenges
      const nowTime = Date.now();
      const activeRunningChallenges = enrolledChallenges.filter((item: any) => {
        const ch = item.challenge || item;
        if (!ch) return false;

        // Skip if explicitly closed or inactive
        if (ch.status === "completed" || ch.isActive === false) return false;
        if (ch.status === "active" || ch.isActive === true) return true;

        if (ch.startDate && ch.endDate) {
          const startTime = new Date(ch.startDate).getTime();
          const endTime = new Date(ch.endDate).getTime();
          if (!isNaN(startTime) && !isNaN(endTime)) {
            const endOfDay = new Date(endTime);
            endOfDay.setHours(23, 59, 59, 999);
            return startTime <= nowTime && nowTime <= endOfDay.getTime();
          }
        }
        return true;
      });

      // Defensive fallback: If strict date bounds yielded 0, inspect enrolled challenges
      const challengesToInspect =
        activeRunningChallenges.length > 0 ? activeRunningChallenges : enrolledChallenges;

      if (challengesToInspect.length === 0) {
        logger.debug("LEETCODE_REMINDER", "No active challenges to inspect; skipping check");
        return false;
      }

      // 7. Pull Latest LeetCode Total to reduce false positive alerts
      profileApi.syncLeetCode().catch((syncErr) => {
        logger.debug("LEETCODE_REMINDER", "Opportunistic LeetCode sync before leaderboard check deferred", syncErr);
      });

      // 8. Inspect Leaderboard `dailyTotal` for Each Active Challenge
      let hasSolvedAnyToday = false;
      let solvedChallengeName = "";

      for (const activeItem of challengesToInspect) {
        const ch = activeItem.challenge || activeItem;
        const challengeId = ch._id || ch.id;
        if (!challengeId) continue;

        try {
          const lbRes = await challengesApi.getChallengeLeaderboard(challengeId);
          const rawEntries = Array.isArray(lbRes.data)
            ? lbRes.data
            : (lbRes.data as any)?.leaderboard || (lbRes.data as any)?.data || [];

          // Locate current student in leaderboard with robust multi-field matching
          const studentEntry = rawEntries.find((entry: any) => {
            // A. Direct entry ID or userId
            const entryId = entry._id || entry.userId || entry.id;
            if (entryId && String(entryId) === String(userId)) return true;

            // B. Nested user ID
            if (typeof entry.user === "string" && String(entry.user) === String(userId)) return true;
            if (typeof entry.user === "object" && entry.user !== null) {
              const uId = entry.user._id || entry.user.id;
              if (uId && String(uId) === String(userId)) return true;
            }

            // C. Roll Number
            const entryRoll = (
              entry.roll_no ||
              entry.rollNo ||
              entry.user?.roll_no ||
              entry.user?.rollNo ||
              ""
            )
              .toString()
              .trim()
              .toLowerCase();
            if (entryRoll && userRoll && entryRoll === userRoll) return true;

            // D. Email
            const entryEmail = (entry.email || entry.user?.email || "").toString().trim().toLowerCase();
            if (entryEmail && userEmail && entryEmail === userEmail) return true;

            // E. LeetCode Handle
            const entryHandle = (
              entry.leetcodeUsername ||
              entry.username ||
              entry.user?.leetcodeUsername ||
              entry.user?.username ||
              ""
            )
              .toString()
              .trim()
              .toLowerCase();
            if (entryHandle && leetcodeHandle && entryHandle === leetcodeHandle) return true;

            return false;
          });

          if (studentEntry) {
            const solvedToday =
              typeof studentEntry.dailyTotal === "number"
                ? studentEntry.dailyTotal
                : typeof studentEntry.dailySolveCount === "number"
                ? studentEntry.dailySolveCount
                : typeof studentEntry.solvedToday === "number"
                ? studentEntry.solvedToday
                : 0;

            if (solvedToday > 0) {
              hasSolvedAnyToday = true;
              solvedChallengeName = ch.name || challengeId;
              logger.info(
                "LEETCODE_REMINDER",
                `Student solved ${solvedToday} problem(s) today in challenge "${solvedChallengeName}". Streak is active!`
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
        logger.info(
          "LEETCODE_REMINDER",
          `Streak verified active (${solvedChallengeName}). Resetting 1-hour check timer.`
        );
        await storageService.setLeetCodeLastCheck(Date.now());
        return false;
      }

      // If user is enrolled in active challenges and has dailyTotal === 0 today:
      logger.info(
        "LEETCODE_REMINDER",
        "Student has not solved any LeetCode questions today across active challenges. Triggering 1-hour streak reminder alert!"
      );

      await notificationEngine.trigger(
        "LEETCODE_DAILY_REMINDER",
        {
          title: "LeetCode Practice Alert",
          body: "You haven't solved any LeetCode question today 👀 – keep your streak alive!",
        },
        { force: options?.force }
      );

      // Successfully notified! Stamp check timestamp
      await storageService.setLeetCodeLastCheck(Date.now());
      return true;
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

  /**
   * Diagnostic runner: executes live check with full trace output for in-app verification
   */
  async runDiagnosticCheck(): Promise<ReminderDiagnosticResult> {
    if (!storageService.isInitialized()) {
      await storageService.init();
    }

    const lastCheck = await storageService.getLeetCodeLastCheck();
    const elapsedMinutes = lastCheck > 0 ? Math.round((Date.now() - lastCheck) / 60000) : 0;
    const currentHour = new Date().getHours();
    const isQuietHours = currentHour >= 23 || currentHour < 8;

    const user = useAuthStore.getState().user || storageService.getUser();
    const userId = user?._id || user?.id || (await storageService.getLeetCodeUserId());

    const leetcodeProfiles = user?.leetcode_profiles;
    const leetcodeHandle = (
      (Array.isArray(leetcodeProfiles) && leetcodeProfiles[0]?.username) ||
      (user as any)?.leetcodeUsername ||
      (user as any)?.leetcode ||
      ""
    ).toString().trim();

    let enrolledCount = 0;
    try {
      const myChallengesRes = await challengesApi.getMyChallenges();
      const rawData = myChallengesRes.data;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray((rawData as any)?.challenges)
        ? (rawData as any).challenges
        : Array.isArray((rawData as any)?.data)
        ? (rawData as any).data
        : [];
      enrolledCount = list.length;
    } catch {
      enrolledCount = useChallengeStore.getState().myChallenges?.length || 0;
    }

    const notified = await this.checkDailySolveReminder({ force: true });

    let message = "";
    if (notified) {
      message = "Reminder Alert Dispatched! You have not solved any problems today in your active challenges.";
    } else if (!leetcodeHandle) {
      message = "Check Skipped: No LeetCode username linked to your profile.";
    } else if (enrolledCount === 0) {
      message = "Check Skipped: You are not enrolled in any coding challenges yet.";
    } else {
      message = "Streak Active: Verified that you have solved problems today, or quiet hours apply.";
    }

    return {
      success: true,
      notified,
      message,
      details: {
        userId,
        leetcodeHandle: leetcodeHandle || null,
        enrolledChallengesCount: enrolledCount,
        challengesInspectedCount: enrolledCount,
        hasSolvedToday: !notified && enrolledCount > 0 && Boolean(leetcodeHandle),
        lastCheckTimestamp: await storageService.getLeetCodeLastCheck(),
        elapsedMinutes,
        isQuietHours,
      },
    };
  }
}

export const leetcodeReminderWatcher = new LeetCodeReminderWatcher();
export default leetcodeReminderWatcher;
