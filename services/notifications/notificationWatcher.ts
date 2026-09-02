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
        const type = String(item.type || "").toUpperCase();
        const title = (item.title || "").trim();
        const message = (item.message || "").trim();
        const meta = (item.metadata || {}) as Record<string, unknown>;

        const isReminder =
          type === "JOB_DEADLINE_REMINDER" ||
          type === "APPLICATION_DEADLINE" ||
          type.includes("REMINDER") ||
          type.includes("DEADLINE") ||
          title.toLowerCase().includes("reminder") ||
          message.toLowerCase().includes("deadline");

        const isPlacement =
          !isReminder &&
          (type === "NEW_PLACEMENT_NOTICE" ||
            type === "JOB_POSTED" ||
            type.includes("PLACEMENT") ||
            type.includes("JOB") ||
            Boolean(meta.jobId || meta.companyName));

        const isResult =
          type === "RESULT_PUBLISHED" ||
          type.includes("RESULT") ||
          type.includes("ASSESSMENT");

        const isAnnouncement =
          type === "CAMPUS_ANNOUNCEMENT" ||
          type.includes("ANNOUNCEMENT") ||
          type.includes("NOTICE");

        const isChallenge =
          type === "CHALLENGE_INVITE" ||
          type.includes("CHALLENGE");

        const isApplication =
          type === "APPLICATION_STATUS_UPDATE" ||
          type === "APPLICATION_UPDATE" ||
          type.includes("APPLICATION");

        // Helper to ensure clean emoji prefix without duplicating
        const withEmoji = (emoji: string, text: string) => {
          const hasEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(text);
          return hasEmoji ? text : `${emoji} ${text}`;
        };

        let formattedTitle = title || "SCIS Connect Notification";
        let formattedSubtitle = "SCIS Connect Alert";
        let channelId = NOTIFICATION_CHANNELS.GENERAL.id;
        let targetScreen = "/(app)/(tabs)/notifications";

        if (isPlacement) {
          const company = meta.companyName || meta.company || title || "Campus Placement";
          formattedTitle = withEmoji("💼", `New Job: ${company}`);
          formattedSubtitle = "SCIS Placement Drive";
          channelId = NOTIFICATION_CHANNELS.PLACEMENT_JOBS.id;
          targetScreen = "/(app)/placement/center";
        } else if (isReminder) {
          const company = meta.companyName || meta.company || title || "Opportunity";
          formattedTitle = withEmoji("⏳", `Deadline Alert: ${company}`);
          formattedSubtitle = "Application Deadline";
          channelId = NOTIFICATION_CHANNELS.APPLICATION_UPDATES.id;
          targetScreen = "/(app)/placement/center";
        } else if (isResult) {
          formattedTitle = withEmoji("📊", `Results Announced: ${title || "Assessment"}`);
          formattedSubtitle = "Assessment & Results";
          channelId = NOTIFICATION_CHANNELS.ACADEMIC_RESULTS.id;
          targetScreen = "/(app)/placement/center";
        } else if (isChallenge) {
          formattedTitle = withEmoji("⚡", `Coding Challenge: ${title || "Active Contest"}`);
          formattedSubtitle = "SCIS Challenges";
          channelId = NOTIFICATION_CHANNELS.GENERAL.id;
          targetScreen = "/(app)/(tabs)/index";
        } else if (isApplication) {
          formattedTitle = withEmoji("📋", `Application Update: ${title}`);
          formattedSubtitle = "Placement Cell Update";
          channelId = NOTIFICATION_CHANNELS.APPLICATION_UPDATES.id;
          targetScreen = "/(app)/(tabs)/notifications";
        } else if (isAnnouncement) {
          formattedTitle = withEmoji("📢", `Announcement: ${title}`);
          formattedSubtitle = "SCIS Notice Board";
          channelId = NOTIFICATION_CHANNELS.CAMPUS_ANNOUNCEMENTS.id;
          targetScreen = "/(app)/(tabs)/notifications";
        } else {
          formattedTitle = withEmoji("🔔", `SCIS Notice: ${title}`);
          formattedSubtitle = "SCIS Connect Alert";
          channelId = NOTIFICATION_CHANNELS.GENERAL.id;
          targetScreen = "/(app)/(tabs)/notifications";
        }

        // Format body with metadata if available
        let formattedBody = message || "You have a new update in SCIS Connect.";
        const metaParts: string[] = [];
        if (meta.package) {
          const pkgNum = Number(meta.package);
          metaParts.push(!isNaN(pkgNum) ? `₹${(pkgNum >= 100000 ? pkgNum / 100000 : pkgNum).toFixed(1)} LPA` : `₹${meta.package}`);
        }
        if (meta.location) metaParts.push(String(meta.location));
        if (meta.deadline) metaParts.push(`Deadline: ${meta.deadline}`);

        if (metaParts.length > 0 && isPlacement) {
          formattedBody = `${formattedBody} • ${metaParts.join(" • ")}. Tap to view eligibility & apply!`;
        }

        // 1. Dispatch native system notification bar alert
        try {
          const scheduleTrigger: Notifications.NotificationTriggerInput =
            Platform.OS === "android"
              ? ({ channelId } as Notifications.ChannelAwareTriggerInput)
              : null;

          await Notifications.scheduleNotificationAsync({
            content: {
              title: formattedTitle,
              body: formattedBody,
              subtitle: formattedSubtitle,
              sound: "default",
              color: "#8B0000",
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: {
                type: item.type,
                jobId: meta.jobId,
                screen: meta.jobId ? "/(app)/placement/center" : targetScreen,
                ...meta,
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
          title: formattedTitle,
          message: formattedBody,
          subTitle: formattedSubtitle,
          companyName: (meta.companyName as string) || undefined,
          jobId: (meta.jobId as string) || undefined,
          data: {
            screen: targetScreen,
            ...meta,
          },
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
