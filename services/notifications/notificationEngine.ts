/**
 * SCIS Connect Mobile - Scalable Notification Engine
 * Dispatches trigger-based notifications to the system notification bar and manages
 * Android channels, deduplication, user preferences, and in-app synchronization.
 */

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { triggerRegistry } from "./triggerRegistry";
import {
  TriggerType,
  TriggerPayloadMap,
  TriggerOptions,
  FormattedNotification,
} from "./types";
import { NOTIFICATION_CHANNELS } from "./channels";
import {
  setupAndroidNotificationChannels,
  registerForPushNotificationsAsync,
} from "./notificationPermissions";
import { useNotificationsStore } from "@/features/notifications/store";
import { normalizeNotification } from "@/features/notifications/types";
import { logger } from "@/utils/logger";

class NotificationEngine {
  private initialized: boolean = false;
  private deduplicationCache: Set<string> = new Set();
  private maxCacheSize: number = 200;

  /**
   * Initialize notification services, Android channels, and push permissions
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await setupAndroidNotificationChannels();
      await useNotificationsStore.getState().loadPreferences();
      await registerForPushNotificationsAsync();
      this.initialized = true;
      logger.info("NOTIFICATION_ENGINE", "Notification Engine initialized successfully");
    } catch (error) {
      logger.error("NOTIFICATION_ENGINE", "Failed to initialize Notification Engine", error);
    }
  }

  /**
   * Scalable trigger dispatcher.
   * Can be invoked from any feature (Placement, Results, Challenges, Announcements, etc.)
   *
   * @param triggerType The registered trigger identifier (e.g. "JOB_POSTED")
   * @param payload The domain data payload matching the trigger schema
   * @param options Additional delivery & deduplication options
   */
  async trigger<K extends keyof TriggerPayloadMap>(
    triggerType: K,
    payload: TriggerPayloadMap[K],
    options?: TriggerOptions
  ): Promise<string | null>;
  async trigger<T = Record<string, unknown>>(
    triggerType: TriggerType,
    payload: T,
    options?: TriggerOptions
  ): Promise<string | null>;
  async trigger(
    triggerType: TriggerType,
    payload: any,
    options?: TriggerOptions
  ): Promise<string | null> {
    try {
      // 1. Resolve trigger definition from registry
      const definition = triggerRegistry[triggerType];

      // 2. Check user notification preferences
      const preferences = useNotificationsStore.getState();
      if (preferences.masterNotificationsEnabled === false && !options?.force) {
        logger.info("NOTIFICATION_ENGINE", `Trigger ${triggerType} suppressed: master notifications disabled`);
        return null;
      }

      if (definition?.preferenceKey && !options?.force) {
        const prefKey = definition.preferenceKey as keyof typeof preferences;
        const isEnabled = preferences[prefKey];
        if (isEnabled === false) {
          logger.info("NOTIFICATION_ENGINE", `Trigger ${triggerType} suppressed by user preference (${definition.preferenceKey})`);
          return null;
        }
      }

      // 3. Deduplication Check
      const entityId =
        payload?.jobId ||
        payload?.resultId ||
        payload?.announcementId ||
        payload?.challengeId ||
        payload?.id ||
        "";
      const dedupKey = options?.dedupKey || (entityId ? `${triggerType}_${entityId}` : "");

      if (dedupKey && !options?.force) {
        if (this.deduplicationCache.has(dedupKey)) {
          logger.debug("NOTIFICATION_ENGINE", `Skipping duplicate notification trigger for key: ${dedupKey}`);
          return null;
        }
      }

      // 4. Format notification payload
      let formatted: FormattedNotification;

      if (definition) {
        const formattedData = definition.formatter(payload);
        formatted = {
          title: formattedData.title,
          body: formattedData.body,
          subTitle: formattedData.subTitle,
          channelId: definition.channelId || NOTIFICATION_CHANNELS.GENERAL.id,
          priority: options?.priority || definition.defaultPriority || "default",
          sound: true,
          data: formattedData.data,
        };
      } else {
        // Fallback for custom / ad-hoc triggers
        formatted = {
          title: payload?.title || "SCIS Connect Notification",
          body: payload?.body || payload?.message || "",
          channelId: payload?.channelId || NOTIFICATION_CHANNELS.GENERAL.id,
          priority: options?.priority || "default",
          sound: true,
          data: payload?.data || { type: triggerType },
        };
      }

      // Map priority to Android notification priority
      let androidPriority = Notifications.AndroidNotificationPriority.DEFAULT;
      if (formatted.priority === "high" || formatted.priority === "max") {
        androidPriority = Notifications.AndroidNotificationPriority.HIGH;
      } else if (formatted.priority === "low" || formatted.priority === "min") {
        androidPriority = Notifications.AndroidNotificationPriority.LOW;
      }

      // 5. Schedule / present notification in system notification bar
      const scheduleTriggerInput: Notifications.NotificationTriggerInput = options?.delaySeconds
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: options.delaySeconds,
            channelId: formatted.channelId,
          }
        : Platform.OS === "android" && formatted.channelId
        ? ({ channelId: formatted.channelId } as Notifications.ChannelAwareTriggerInput)
        : null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: formatted.title,
          body: formatted.body,
          subtitle: formatted.subTitle,
          data: formatted.data,
          sound: formatted.sound ? "default" : undefined,
          color: "#8B0000",
          priority: androidPriority,
        },
        trigger: scheduleTriggerInput,
      });

      // 6. Record in deduplication cache
      if (dedupKey) {
        this.deduplicationCache.add(dedupKey);
        if (this.deduplicationCache.size > this.maxCacheSize) {
          const firstKey = this.deduplicationCache.values().next().value;
          if (firstKey) this.deduplicationCache.delete(firstKey);
        }
      }

      // 7. Optimistically inject into in-app Notification Store so Notification Center updates instantly
      this.syncInAppStore(triggerType, formatted);

      logger.info("NOTIFICATION_ENGINE", `Dispatched system notification [${triggerType}]`, {
        notificationId,
        title: formatted.title,
        channelId: formatted.channelId,
      });

      return notificationId;
    } catch (error) {
      logger.error("NOTIFICATION_ENGINE", `Failed to trigger notification for ${triggerType}`, error);
      return null;
    }
  }

  /**
   * Optimistically synchronizes a dispatched notification with the in-app Zustand store
   */
  private syncInAppStore(triggerType: string, formatted: FormattedNotification): void {
    try {
      const store = useNotificationsStore.getState();

      let mappedType = triggerType;
      if (triggerType === "JOB_POSTED") mappedType = "NEW_PLACEMENT_NOTICE";
      else if (triggerType === "APPLICATION_DEADLINE") mappedType = "JOB_DEADLINE_REMINDER";
      else if (triggerType === "APPLICATION_STATUS_UPDATE") mappedType = "APPLICATION_UPDATE";

      const rawItem = {
        _id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: mappedType,
        title: formatted.title,
        message: formatted.body,
        read: false,
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: formatted.data,
      };

      const normalized = normalizeNotification(rawItem);

      // Prepend to notifications store optimistically with deduplication
      useNotificationsStore.setState((state) => {
        const exists = state.notifications.some(
          (n) =>
            n._id === rawItem._id ||
            (n.type === mappedType && n.title === formatted.title && n.message === formatted.body)
        );
        if (exists) {
          return state;
        }
        return {
          notifications: [normalized, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        };
      });

      // Also display animated floating in-app notification banner
      store.showInAppBanner({
        id: `banner-${Date.now()}`,
        type: triggerType,
        title: formatted.title,
        message: formatted.body,
        subTitle: formatted.subTitle,
        companyName:
          typeof formatted.data?.companyName === "string"
            ? formatted.data.companyName
            : undefined,
        jobId:
          typeof formatted.data?.jobId === "string"
            ? formatted.data.jobId
            : undefined,
        data: formatted.data,
      });

      // Trigger background sync to pull server-assigned IDs if available
      store.fetchNotifications().catch(() => {});
      store.fetchUnreadCount().catch(() => {});
    } catch (e) {
      logger.debug("NOTIFICATION_ENGINE", "In-app store sync skipped", e);
    }
  }

  /**
   * Cancel a specific scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      logger.info("NOTIFICATION_ENGINE", `Cancelled notification ${notificationId}`);
    } catch (error) {
      logger.warn("NOTIFICATION_ENGINE", `Could not cancel notification ${notificationId}`, error);
    }
  }

  /**
   * Cancel all active scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      logger.info("NOTIFICATION_ENGINE", "Cancelled all scheduled notifications");
    } catch (error) {
      logger.warn("NOTIFICATION_ENGINE", "Failed to cancel all notifications", error);
    }
  }

  /**
   * Update the badge count displayed on the app icon
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(Math.max(0, count));
    } catch {
      // Best-effort
    }
  }

  /**
   * Clear the deduplication cache
   */
  clearDeduplicationCache(): void {
    this.deduplicationCache.clear();
  }
}

export const notificationEngine = new NotificationEngine();
export default notificationEngine;
