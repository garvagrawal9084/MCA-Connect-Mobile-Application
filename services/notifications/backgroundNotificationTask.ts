/**
 * SCIS Connect Mobile - Headless Background Notification Worker
 * Executes periodic synchronization using Expo TaskManager & BackgroundFetch
 * to inspect new jobs, announcements, and reminders even when the app is closed.
 */

import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { storageService } from "@/services/storage";
import { jobWatcher } from "@/features/placement/jobWatcher";
import { notificationWatcher } from "./notificationWatcher";
import { leetcodeReminderWatcher } from "./leetcodeReminderWatcher";
import { logger } from "@/utils/logger";

export const SCIS_BACKGROUND_NOTIFICATION_TASK = "SCIS_BACKGROUND_NOTIFICATION_TASK";
export const SCIS_LEETCODE_REMINDER_TASK = "SCIS_LEETCODE_REMINDER_TASK";

async function ensureBackgroundStorageInitialized(): Promise<void> {
  if (!storageService.isInitialized()) {
    await storageService.init();
  }
}

// 1. General headless background task: checks placement jobs & announcements
TaskManager.defineTask(SCIS_BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    await ensureBackgroundStorageInitialized();
    logger.info("BG_TASK", "General background notification sync triggered by Android OS");

    const [newJobsCount, newNotifsCount] = await Promise.all([
      jobWatcher.syncAndCheckJobs({ silent: false }).catch(() => 0),
      notificationWatcher.syncAndCheckNotifications({ silent: false }).catch(() => 0),
      leetcodeReminderWatcher.checkIfNeeded({ silent: false }).catch(() => false),
    ]);

    logger.info("BG_TASK", "General background sync completed", {
      newJobsCount,
      newNotifsCount,
    });

    if (newJobsCount > 0 || newNotifsCount > 0) {
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    logger.warn("BG_TASK", "Background notification sync failed", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 2. Dedicated LeetCode 3-Hour Streak Reminder Task (Android WorkManager PeriodicWorkRequest)
TaskManager.defineTask(SCIS_LEETCODE_REMINDER_TASK, async () => {
  try {
    await ensureBackgroundStorageInitialized();
    logger.info("BG_TASK", "LeetCode 3-Hour Streak Reminder task triggered by Android WorkManager");
    const didNotify = await leetcodeReminderWatcher.checkDailySolveReminder({ silent: false });
    if (didNotify) {
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    logger.warn("BG_TASK", "LeetCode 3-Hour Streak Reminder background task failed", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registers all background tasks with Android OS
 */
export async function registerBackgroundNotificationTaskAsync(): Promise<void> {
  try {
    // 1. Register General Task (15-min interval)
    const isGeneralRegistered = await TaskManager.isTaskRegisteredAsync(
      SCIS_BACKGROUND_NOTIFICATION_TASK
    );

    if (!isGeneralRegistered) {
      await BackgroundFetch.registerTaskAsync(SCIS_BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 15 * 60, // 15 minutes (minimum allowed by Android OS)
        stopOnTerminate: false, // Continue executing even when user closes/swipes away the app
        startOnBoot: true, // Automatically start task when the phone boots
      });
      logger.info("BG_TASK", "Registered general background notification task with OS");
    }

    // 2. Register LeetCode Reminder Task (3-hour interval = 10,800 seconds)
    const isLeetcodeRegistered = await TaskManager.isTaskRegisteredAsync(
      SCIS_LEETCODE_REMINDER_TASK
    );

    if (!isLeetcodeRegistered) {
      await BackgroundFetch.registerTaskAsync(SCIS_LEETCODE_REMINDER_TASK, {
        minimumInterval: 3 * 60 * 60, // 3 hours
        stopOnTerminate: false, // Continue executing even when user closes the app
        startOnBoot: true, // Automatically start task on phone boot
      });
      logger.info("BG_TASK", "Registered LeetCode 3-Hour streak reminder task with OS WorkManager");
    }
  } catch (error) {
    logger.debug("BG_TASK", "Could not register background notification tasks", error);
  }
}

/**
 * Unregisters the LeetCode streak reminder worker (e.g. on logout)
 */
export async function unregisterLeetcodeReminderTaskAsync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      SCIS_LEETCODE_REMINDER_TASK
    );
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(SCIS_LEETCODE_REMINDER_TASK);
      logger.info("BG_TASK", "Unregistered LeetCode streak reminder background task");
    }
  } catch (error) {
    logger.debug("BG_TASK", "Could not unregister LeetCode streak reminder task", error);
  }
}

/**
 * Unregisters all background tasks (called on full reset or logout)
 */
export async function unregisterBackgroundNotificationTaskAsync(): Promise<void> {
  try {
    const [isGeneralRegistered, isLeetcodeRegistered] = await Promise.all([
      TaskManager.isTaskRegisteredAsync(SCIS_BACKGROUND_NOTIFICATION_TASK),
      TaskManager.isTaskRegisteredAsync(SCIS_LEETCODE_REMINDER_TASK),
    ]);

    if (isGeneralRegistered) {
      await BackgroundFetch.unregisterTaskAsync(SCIS_BACKGROUND_NOTIFICATION_TASK);
      logger.info("BG_TASK", "Unregistered general background notification task");
    }

    if (isLeetcodeRegistered) {
      await BackgroundFetch.unregisterTaskAsync(SCIS_LEETCODE_REMINDER_TASK);
      logger.info("BG_TASK", "Unregistered LeetCode reminder background task");
    }
  } catch (error) {
    logger.debug("BG_TASK", "Could not unregister background notification tasks", error);
  }
}
