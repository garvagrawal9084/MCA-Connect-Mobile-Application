/**
 * SCIS Connect Mobile - Headless Background Notification Worker
 * Executes periodic synchronization using Expo TaskManager & BackgroundFetch
 * to inspect new jobs, announcements, and reminders even when the app is closed.
 */

import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { jobWatcher } from "@/features/placement/jobWatcher";
import { notificationWatcher } from "./notificationWatcher";
import { logger } from "@/utils/logger";

export const SCIS_BACKGROUND_NOTIFICATION_TASK = "SCIS_BACKGROUND_NOTIFICATION_TASK";

// Define the headless background task (runs at top-level outside React components)
TaskManager.defineTask(SCIS_BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    logger.info("BG_TASK", "Background notification sync triggered by Android OS");

    const [newJobsCount, newNotifsCount] = await Promise.all([
      jobWatcher.syncAndCheckJobs({ silent: false }).catch(() => 0),
      notificationWatcher.syncAndCheckNotifications({ silent: false }).catch(() => 0),
    ]);

    logger.info("BG_TASK", "Background sync completed", {
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

/**
 * Registers the background task with Android OS
 */
export async function registerBackgroundNotificationTaskAsync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      SCIS_BACKGROUND_NOTIFICATION_TASK
    );

    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(SCIS_BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 15 * 60, // 15 minutes (minimum allowed by Android OS)
        stopOnTerminate: false, // Continue executing even when user closes/swipes away the app
        startOnBoot: true, // Automatically start task when the phone boots
      });
      logger.info("BG_TASK", "Registered background notification task with OS");
    } else {
      logger.info("BG_TASK", "Background notification task already registered");
    }
  } catch (error) {
    logger.debug("BG_TASK", "Could not register background notification task", error);
  }
}

/**
 * Unregisters the background task
 */
export async function unregisterBackgroundNotificationTaskAsync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      SCIS_BACKGROUND_NOTIFICATION_TASK
    );
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(SCIS_BACKGROUND_NOTIFICATION_TASK);
      logger.info("BG_TASK", "Unregistered background notification task");
    }
  } catch (error) {
    logger.debug("BG_TASK", "Could not unregister background notification task", error);
  }
}
