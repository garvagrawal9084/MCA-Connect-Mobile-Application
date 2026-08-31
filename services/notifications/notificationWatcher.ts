/**
 * SCIS Connect Mobile - Real-time Server Notification Watcher
 * Monitors incoming server notifications from /api/notifications (including
 * reminders and broadcasts sent via /api/placement/jobs/:id/send-notifications),
 * identifies new items, and dispatches system notification bar alerts & in-app banners.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { NotificationItem, normalizeNotification } from "@/features/notifications/types";
import { notificationsApi } from "@/features/notifications/api";
import { useNotificationsStore } from "@/features/notifications/store";
import { NOTIFICATION_CHANNELS } from "./channels";
import { logger } from "@/utils/logger";

const STORAGE_KEY_KNOWN_NOTIFS = "scis_known_notification_ids";

async function getStoredNotificationIds(): Promise<string[] | null> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        const item = window.localStorage.getItem(STORAGE_KEY_KNOWN_NOTIFS);
        return item ? JSON.parse(item) : null;
      }
      return null;
    }
    const isAvail = await SecureStore.isAvailableAsync();
    if (isAvail) {
      const item = await SecureStore.getItemAsync(STORAGE_KEY_KNOWN_NOTIFS);
      return item ? JSON.parse(item) : null;
    }
    return null;
  } catch (err) {
    logger.debug("NOTIF_WATCHER", "Failed to read stored notification IDs", err);
    return null;
  }
}

async function saveStoredNotificationIds(ids: string[]): Promise<void> {
  try {
    // Keep most recent 500 IDs to avoid unbounded storage growth
    const trimmed = ids.slice(-500);
    const json = JSON.stringify(trimmed);
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_KNOWN_NOTIFS, json);
      }
      return;
    }
    const isAvail = await SecureStore.isAvailableAsync();
    if (isAvail) {
      await SecureStore.setItemAsync(STORAGE_KEY_KNOWN_NOTIFS, json);
    }
  } catch (err) {
    logger.debug("NOTIF_WATCHER", "Failed to save stored notification IDs", err);
  }
}

class NotificationWatcher {
  private knownNotifIds: Set<string> = new Set();
  private isInitialized: boolean = false;

  /**
   * Inspect a list of fetched notifications.
   * On initial cold boot / silent mode:
   *  - Restores known IDs from persistent SecureStore.
   *  - Baselines all existing server notifications silently.
   * On subsequent active polling / resume (silent: false):
   *  - Detects new unread server notifications (e.g. sent via /send-notifications, reminders, announcements).
   *  - Immediately triggers system tray alerts and animated floating in-app banners.
   */
  async inspectAndNotifyNewNotifications(
    notifications: NotificationItem[],
    options?: { silent?: boolean }
  ): Promise<void> {
    if (!notifications || !Array.isArray(notifications) || notifications.length === 0) return;

    // Load persisted known IDs on cold boot
    if (!this.isInitialized) {
      const storedIds = await getStoredNotificationIds();
      if (storedIds && Array.isArray(storedIds) && storedIds.length > 0) {
        this.knownNotifIds = new Set(storedIds);
        this.isInitialized = true;
        logger.info(
          "NOTIF_WATCHER",
          `Restored ${this.knownNotifIds.size} known notification IDs from persistent storage`
        );
      } else {
        // First install / first run: baseline all currently existing server notifications
        notifications.forEach((n) => {
          const id = n._id || n.id;
          if (id) this.knownNotifIds.add(id);
        });
        this.isInitialized = true;
        await saveStoredNotificationIds(Array.from(this.knownNotifIds));
        logger.info(
          "NOTIF_WATCHER",
          `Initialized baseline with ${this.knownNotifIds.size} notification IDs`
        );
        return;
      }
    }

    // If explicit silent inspection requested (e.g. cold launch sync)
    if (options?.silent) {
      let hasNew = false;
      notifications.forEach((n) => {
        const id = n._id || n.id;
        if (id && !this.knownNotifIds.has(id)) {
          this.knownNotifIds.add(id);
          hasNew = true;
        }
      });
      if (hasNew) {
        await saveStoredNotificationIds(Array.from(this.knownNotifIds));
      }
      return;
    }

    // Detect newly arrived notifications that have not been seen on this device
    const newItems = notifications.filter((n) => {
      const id = n._id || n.id;
      if (!id || id.startsWith("local-")) return false;
      const isUnread = !n.read && !n.isRead;
      return isUnread && !this.knownNotifIds.has(id);
    });

    if (newItems.length === 0) {
      return;
    }

    logger.info(
      "NOTIF_WATCHER",
      `Detected ${newItems.length} newly arrived server notification(s)! Triggering alerts...`
    );

    const notifStore = useNotificationsStore.getState();

    for (const item of newItems) {
      const id = item._id || item.id;
      if (id) this.knownNotifIds.add(id);

      try {
        // Route channel & colors based on notification type
        const isReminder =
          item.type === "JOB_DEADLINE_REMINDER" ||
          item.type === "APPLICATION_DEADLINE" ||
          item.title?.toLowerCase().includes("reminder") ||
          item.message?.toLowerCase().includes("deadline");

        const channelId = isReminder
          ? (NOTIFICATION_CHANNELS.APPLICATION_UPDATES?.id || "application-updates")
          : item.type === "NEW_PLACEMENT_NOTICE" || item.type === "JOB_POSTED"
          ? (NOTIFICATION_CHANNELS.PLACEMENT_JOBS?.id || "placement-jobs")
          : item.type?.includes("RESULT")
          ? (NOTIFICATION_CHANNELS.ACADEMIC_RESULTS?.id || "academic-results")
          : item.type?.includes("ANNOUNCEMENT")
          ? (NOTIFICATION_CHANNELS.CAMPUS_ANNOUNCEMENTS?.id || "campus-announcements")
          : (NOTIFICATION_CHANNELS.GENERAL?.id || "general-notifications");

        // 1. Dispatch native system notification bar alert
        try {
          const scheduleTrigger: Notifications.NotificationTriggerInput =
            Platform.OS === "android"
              ? ({ channelId } as Notifications.ChannelAwareTriggerInput)
              : null;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: item.title || "SCIS Connect Notification",
              body: item.message || "You have a new update in SCIS Connect.",
              sound: "default",
              color: isReminder ? "#7C3AED" : "#8B0000",
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: {
                type: item.type,
                jobId: item.metadata?.jobId,
                screen: item.metadata?.jobId ? "/(app)/placement/center" : "/(app)/(tabs)/notifications",
                ...item.metadata,
              },
            },
            trigger: scheduleTrigger,
          });
        } catch (err) {
          logger.debug("NOTIF_WATCHER", "Native notification schedule error", err);
        }

        // 2. Display the floating in-app animated banner
        notifStore.showInAppBanner({
          id: `srv-${id}`,
          type: item.type,
          title: item.title,
          message: item.message,
          companyName: (item.metadata?.companyName as string) || undefined,
          jobId: (item.metadata?.jobId as string) || undefined,
          data: item.metadata,
        });
      } catch (itemErr) {
        logger.warn("NOTIF_WATCHER", "Failed to dispatch alert for notification item", itemErr);
      }
    }

    // Directly merge new items into Zustand state so UI updates immediately
    useNotificationsStore.setState((state) => {
      const existingIds = new Set(state.notifications.map((n) => n._id || n.id));
      const itemsToAdd = newItems.filter((n) => !existingIds.has(n._id || n.id));
      if (itemsToAdd.length === 0) return state;
      return {
        notifications: [...itemsToAdd, ...state.notifications],
        unreadCount: state.unreadCount + itemsToAdd.length,
      };
    });

    // Persist updated known IDs
    await saveStoredNotificationIds(Array.from(this.knownNotifIds));

    // Refresh notifications list & unread count in background
    notifStore.fetchNotifications().catch(() => {});
    notifStore.fetchUnreadCount().catch(() => {});
  }

  /**
   * Polls /api/notifications and inspects for newly published reminders / broadcasts
   */
  async syncAndCheckNotifications(options?: { silent?: boolean }): Promise<number> {
    try {
      const res = await notificationsApi.getNotifications({ limit: 20 });
      let rawList: unknown[] = [];

      if (res.data) {
        if (Array.isArray(res.data)) {
          rawList = res.data;
        } else if (typeof res.data === "object" && res.data !== null) {
          const d = res.data as Record<string, unknown>;
          if (Array.isArray(d.notifications)) {
            rawList = d.notifications;
          } else if (Array.isArray(d.data)) {
            rawList = d.data;
          }
        }
      }

      const list = rawList.map((item, idx) => normalizeNotification(item, idx));
      if (list.length > 0) {
        await this.inspectAndNotifyNewNotifications(list, options);
      }
      return list.length;
    } catch (err) {
      logger.debug("NOTIF_WATCHER", "Notification sync check skipped", err);
      return 0;
    }
  }

  /**
   * Reset watcher state on logout
   */
  reset(): void {
    this.knownNotifIds.clear();
    this.isInitialized = false;
  }
}

export const notificationWatcher = new NotificationWatcher();
export default notificationWatcher;
